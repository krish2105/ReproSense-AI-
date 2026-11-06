"""API integration tests over the seeded synthetic data (the demo path, end to end)."""

import re
from datetime import UTC, datetime, timedelta
from pathlib import Path

from tests.conftest import login

ROOT = Path(__file__).resolve().parents[2]


def test_health(client):
    assert client.get("/healthz").json() == {"ok": True}
    r = client.get("/readyz").json()
    assert r["personas"] == 8 and r["kb_chunks"] > 50 and r["demo_mode"] is True


def test_demo_personas_story_order(client):
    ids = [p["id"] for p in client.get("/v1/demo/personas").json()["personas"]]
    assert ids[:3] == ["noura", "hessa", "fatima"] and len(ids) == 8


def test_auth_required_and_roles_enforced(client):
    assert client.get("/v1/me/home").status_code == 401
    h = login(client, "noura")
    assert client.get("/v1/clinic/patients", headers=h).status_code == 403
    assert client.get("/v1/admin/metrics", headers=h).status_code == 403
    assert client.get("/v1/me/home", headers={"Authorization": "Bearer nonsense"}).status_code == 401


def test_noura_home_dashboard(client):
    r = client.get("/v1/me/home", headers=login(client, "noura")).json()
    assert r["status"]["mode"] == "cycle" and r["status"]["estimate"] is True  # irregular -> phases are estimates
    assert {c["observation_id"] for c in r["observations"]} == {"OBS_IRREGULAR_CYCLES", "OBS_IRREGULAR_PLUS_ANDROGEN"}
    assert len(r["day_pills"]) == 7 and r["recommendations"]


def test_hessa_and_fatima_stage_arcs(client):
    h = client.get("/v1/me/home", headers=login(client, "hessa")).json()
    assert h["status"] == {**h["status"], "mode": "pregnancy", "week": 24}
    assert any(g["type"] == "pregnancy_glucose_screen" for g in h["care_gaps"])
    f = client.get("/v1/me/home", headers=login(client, "fatima")).json()
    assert f["status"]["mode"] == "after_birth" and f["status"]["week"] == 9


def test_insights_cards_explain_themselves(client):
    r = client.get("/v1/insights", headers=login(client, "priya")).json()
    assert r["crisis"] is False and len(r["cards"]) == 2
    for c in r["cards"]:
        assert c["why_we_noticed"] and c["sources"] and c["what_to_consider"] and c["questions_for_doctor"]
    assert [t["agent"] for t in r["trace"]] == [
        "intake",
        "signal",
        "safety",
        "evidence",
        "writer",
        "verifier",
        "care_gap",
    ]


def test_sara_red_flag_first(client):
    r = client.get("/v1/insights", headers=login(client, "sara")).json()
    assert r["cards"][0]["kind"] == "red_flag" and "998" in r["cards"][0]["summary"]


def test_insights_in_arabic(client):
    r = client.get("/v1/insights?lang=ar", headers=login(client, "noura")).json()
    assert any("؀" <= ch <= "ۿ" for ch in r["cards"][0]["title"])


def test_timeline_and_analytics(client):
    h = login(client, "noura")
    t = client.get("/v1/timeline?months=12", headers=h).json()
    assert t["cycles"] and t["days"]
    a = client.get("/v1/analytics?months=6", headers=h).json()
    assert a["band"] == [21, 35] and a["summary"]
    assert client.get("/v1/timeline?months=5", headers=h).status_code == 422


def test_nl_symptom_capture(client):
    r = client.post(
        "/v1/logs/parse", json={"text": "cramps so bad I missed work again"}, headers=login(client, "priya")
    ).json()
    assert r["pain"] == 8 and r["impact"] == "missed work or study" and "cramps" in r["symptoms"]


def test_log_with_red_flag_shows_urgent_guidance(client, reseed):
    h = login(client, "amina")
    r = client.post(
        "/v1/logs",
        headers=h,
        json={
            "date": "2026-11-22",
            "flow": "heavy",
            "symptoms": ["flooding", "dizziness"],
            "pbac_items": {"pads": {"soaked": 3}, "clots": {"large": 2}},
        },
    ).json()
    assert r["pbac"] == 70
    assert r["red_flags"] and "998" in r["red_flags"][0]["summary"]


def test_log_validation(client):
    h = login(client, "amina")
    assert client.post("/v1/logs", headers=h, json={"date": "2026-11-22", "pain": 11}).status_code == 422
    assert client.post("/v1/logs", headers=h, json={"date": "2026-11-22", "symptoms": ["made up"]}).status_code == 422
    assert client.post("/v1/logs", headers=h, json={"date": "2027-01-01"}).status_code == 422


def test_epds_item10_opens_crisis_path_without_score(client, reseed):
    h = login(client, "fatima")
    r = client.post("/v1/questionnaires/epds", headers=h, json={"answers": [2, 2, 1, 1, 2, 1, 1, 2, 1, 1]}).json()
    assert r["crisis"] is True and r["total"] is None
    assert all(c["kind"] == "red_flag" for c in r["cards"])
    ins = client.get("/v1/insights", headers=h).json()
    assert ins["crisis"] is True and not any(c["observation_id"] == "OBS_POSTPARTUM_MOOD" for c in ins["cards"])


def test_navigator_drafts_but_never_sends(client, reseed):
    h = login(client, "hessa")
    d = client.post("/v1/navigator/drafts", headers=h, json={"rule_id": "CARE_PREGNANCY_GLUCOSE_SCREEN"}).json()
    assert d["status"] == "draft" and "24" in d["draft"]["message_en"]
    a = client.post(f"/v1/navigator/drafts/{d['id']}/approve", headers=h).json()
    assert a["status"] == "approved" and a["sent"] is False
    assert client.post(f"/v1/navigator/drafts/{d['id']}/approve", headers=h).status_code == 409
    assert client.post("/v1/navigator/drafts", headers=h, json={"rule_id": "OBS_IRREGULAR_CYCLES"}).status_code == 404


def test_lab_upload_confirm_closes_postpartum_gap(client, reseed):
    h = login(client, "fatima")
    text = (ROOT / "data/synthetic/demo_uploads/fatima_postnatal_ogtt.txt").read_bytes()
    up = client.post("/v1/documents", headers=h, files={"file": ("ogtt.txt", text, "text/plain")}).json()
    codes = {r["code"] for r in up["rows"]}
    assert {"OGTT2H", "FPG", "HBA1C"} <= codes
    home = client.get("/v1/me/home", headers=h).json()
    assert any(g["type"] == "postpartum_glucose_test" for g in home["care_gaps"])  # nothing saved before confirm
    c = client.post(f"/v1/documents/{up['id']}/confirm", headers=h, json={"rows": up["rows"]}).json()
    assert c["saved"] == 3 and "CARE_POSTPARTUM_GLUCOSE_TEST" not in c["patterns"]
    home = client.get("/v1/me/home", headers=h).json()
    assert not any(g["type"] == "postpartum_glucose_test" for g in home["care_gaps"])


def test_upload_rejects_images_and_big_files(client):
    h = login(client, "fatima")
    assert (
        client.post("/v1/documents", headers=h, files={"file": ("x.png", b"\x89PNG", "image/png")}).status_code == 415
    )
    assert (
        client.post(
            "/v1/documents", headers=h, files={"file": ("x.exe", b"MZ", "application/octet-stream")}
        ).status_code
        == 415
    )


def test_report_pdf_and_share_lifecycle(client, reseed):
    h = login(client, "noura")
    rep = client.post("/v1/reports", headers=h).json()
    assert rep["payload"]["alias"].startswith("Noura") and rep["payload"]["patterns"]
    pdf = client.get(f"/v1/reports/{rep['id']}.pdf", headers=h)
    assert pdf.status_code == 200 and pdf.content[:4] == b"%PDF"
    assert client.post("/v1/shares", headers=h, json={"report_id": rep["id"], "consent": False}).status_code == 422
    sh = client.post("/v1/shares", headers=h, json={"report_id": rep["id"], "consent": True}).json()
    exp = datetime.fromisoformat(sh["expires_at"].replace("Z", "+00:00"))
    assert timedelta(days=6, hours=23) < exp - datetime.now(UTC) <= timedelta(days=7)
    assert client.get(f"/v1/shared/{sh['token']}").status_code == 200
    assert client.get(f"/v1/shared/{sh['token']}.pdf").content[:4] == b"%PDF"
    assert client.delete(f"/v1/shares/{sh['id']}", headers=h).status_code == 200
    assert client.get(f"/v1/shared/{sh['token']}").status_code == 404
    priv = client.get("/v1/privacy", headers=h).json()
    assert any(a["action"] == "view_shared_report" for a in priv["audit"])


def test_expired_share_link(client, reseed):
    from app.db import SYSTEM, session

    h = login(client, "noura")
    rep = client.post("/v1/reports", headers=h).json()
    sh = client.post("/v1/shares", headers=h, json={"report_id": rep["id"], "consent": True}).json()
    with session(SYSTEM) as cur:
        cur.execute("UPDATE shares SET expires_at = now() - interval '1 minute' WHERE id=%s", (sh["id"],))
    assert client.get(f"/v1/shared/{sh['token']}").status_code == 410


def test_clinician_sees_only_consented_patients(client):
    h = login(client, role="clinician")
    ids = {p["id"] for p in client.get("/v1/clinic/patients", headers=h).json()["patients"]}
    assert "amina" not in ids and {"noura", "hessa", "fatima"} <= ids
    assert client.get("/v1/clinic/patients/amina", headers=h).status_code == 404
    first = client.get("/v1/clinic/patients", headers=h).json()["patients"][0]
    assert first["id"] == "sara"  # red flag first


def test_clinician_view_sbar_and_ask_the_record(client):
    h = login(client, role="clinician")
    v = client.get("/v1/clinic/patients/priya", headers=h).json()
    assert v["sbar"]["situation"] and v["sbar"]["assessment"] and "VISIT NOTE" in v["visit_note_draft"]
    # Clinician voice (QUESTIONS #41): about her, never to her, and no advice to "ask your doctor"
    for pid in ("priya", "noura", "fatima", "sara", "hessa", "layla", "mariam"):
        sb = client.get(f"/v1/clinic/patients/{pid}", headers=h).json()["sbar"]
        text = " ".join([sb["situation"], sb["background"], *sb["assessment"], *sb["recommendation"]]).lower()
        assert not re.search(r"\byou(r|rs)?\b", text), (pid, text)
        assert "ask your doctor" not in text, (pid, text)
    a = client.post(
        "/v1/clinic/patients/priya/ask", headers=h, json={"question": "How often did pain stop her working?"}
    ).json()
    assert a["from_entries_only"] and a["evidence"] and all(e["date"] for e in a["evidence"])
    n = client.post("/v1/clinic/patients/priya/ask", headers=h, json={"question": "What is her blood pressure?"}).json()
    assert n["evidence"] == []


def test_care_gap_closes_live_and_admin_kpi_moves(client, reseed):
    hc = login(client, role="clinician")
    ha = login(client, role="admin")
    m0 = client.get("/v1/admin/metrics", headers=ha).json()
    before, pc0 = m0["kpis"]["care_gaps_closed"], m0["pc008_glucose"]
    gaps = client.get("/v1/clinic/care-gaps", headers=hc).json()
    g = next(x for x in gaps if x["profile_id"] == "fatima")
    assert g["type"] == "postpartum_glucose_test"
    rem = client.post(f"/v1/clinic/care-gaps/{g['id']}/reminder", headers=hc).json()
    assert rem["sent"] is False and rem["en"] and rem["ar"]
    assert (
        client.patch(f"/v1/clinic/care-gaps/{g['id']}", headers=hc, json={"status": "closed"}).json()["status"]
        == "closed"
    )
    m1 = client.get("/v1/admin/metrics", headers=ha).json()
    assert m1["kpis"]["care_gaps_closed"] == before + 1
    # Fatima's glucose test is part of DoH Jawda KPI PC008: its "done" count moves with her
    pc1 = m1["pc008_glucose"]
    assert pc0["due"] >= 10 and pc1["due"] == pc0["due"] and pc1["done"] == pc0["done"] + 1
    assert pc1["done"] + pc1["booked"] + pc1["open"] == pc1["due"]


def test_admin_metrics_are_aggregates_with_k_min(client):
    m = client.get("/v1/admin/metrics", headers=login(client, role="admin")).json()
    assert m["cohort"]["n"] == 1200 and m["cohort"]["is_synthetic"]
    assert all(r["n"] is None or r["n"] >= 10 for r in m["regions"])
    assert m["fairness"]["nationality_group"] and m["fairness"]["age_band"]
    assert not any(r["g"] == "15-19" for r in m["fairness"]["age_band"])


def test_fhir_export_validates(client):
    r = client.get("/v1/fhir", headers=login(client, "sara")).json()
    assert r["validation_errors"] == [] and r["bundle"]["entry"][0]["resource"]["resourceType"] == "Patient"


def test_privacy_export_and_consent_revocation(client, reseed):
    h = login(client, "noura")
    assert client.get("/v1/export", headers=h).json()["profile"]["id"] == "noura"
    assert client.patch("/v1/consents", headers=h, json={"purpose": "care_share", "granted": False}).status_code == 200
    hc = login(client, role="clinician")
    assert "noura" not in {p["id"] for p in client.get("/v1/clinic/patients", headers=hc).json()["patients"]}
    assert client.get("/v1/clinic/patients/noura", headers=hc).status_code == 404


def test_assistant_answers_with_citations(client):
    r = client.post("/v1/assistant/ask", headers=login(client, "noura"), json={"question": "What is PCOS?"}).json()
    assert r["citations"] and r["sentences"] and r["grounded"] and "[1]" in r["answer"]


def test_quality_panel(client):
    q = client.get("/v1/quality").json()
    assert q["rule_accuracy"]["pass"] == 8


def test_admin_sees_each_clinic_and_can_export_the_audit_log(client):
    ha = login(client, role="admin")
    m = client.get("/v1/admin/metrics", headers=ha).json()
    clinics = {c["clinic_id"]: c for c in m["clinics"]}
    assert set(clinics) == {"clinic_corniche", "clinic_north", "clinic_alain", "clinic_dhafra"}
    assert all(c["n"] is None or c["n"] >= 10 for c in m["clinics"])
    assert sum(c["n"] or 0 for c in m["clinics"]) == m["cohort"]["n"]
    r = client.get("/v1/admin/audit/export.csv", headers=ha)
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
    lines = r.text.strip().splitlines()
    assert lines[0] == "id,at,actor_role,actor_id,action,subject_id,target,prev_hash,hash" and len(lines) > 1
    assert "detail" not in lines[0]
    assert client.get("/v1/admin/audit/export.csv", headers=login(client, "noura")).status_code == 403
    assert client.get("/v1/admin/audit/verify", headers=ha).json()["chain_ok"]  # exporting is itself logged, chain intact


def test_the_crisis_path_never_shows_a_score_or_a_scored_card(client, reseed):
    """CLAUDE.md rule 5: EPDS item 10 > 0 opens the crisis path only. No RF4 red-flag card, no mood pattern card, no
    total, and no 'nothing needs discussing' line, in the check-in reply, on Home and after logging."""
    h = login(client, "fatima")
    r = client.post("/v1/questionnaires/epds", headers=h, json={"answers": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]}).json()
    assert r["crisis"] and r["total"] is None
    assert all(c["observation_id"] != "RF4_SELF_HARM_THOUGHTS" for c in r["cards"])
    home = client.get("/v1/me/home", headers=h).json()
    assert home["crisis"] and home["recommendations"] == []
    ids = {c["observation_id"] for c in home["red_flags"] + home["observations"]}
    assert "RF4_SELF_HARM_THOUGHTS" not in ids and "OBS_POSTPARTUM_MOOD" not in ids
    assert "EPDS total" not in str(home)
    log = client.post("/v1/logs", headers=h, json={"date": "2026-11-22", "flow": "none", "pain": 0}).json()
    assert log["crisis"] and all(c["observation_id"] != "RF4_SELF_HARM_THOUGHTS" for c in log["red_flags"])


def test_bad_input_and_unshared_records_get_clear_errors_not_500(client):
    h = login(client, "noura")
    bad = client.post("/v1/logs", headers=h, json={"date": "2026-11-20", "flow": "medium", "pbac_items": {"pads": {"huge": 3}}})
    assert bad.status_code == 422
    neg = client.post("/v1/logs", headers=h, json={"date": "2026-11-20", "flow": "medium", "pbac_items": {"pads": {"soaked": -2}}})
    assert neg.status_code == 422
    hc = login(client, role="clinician")
    assert client.post("/v1/clinic/patients/amina/review", headers=hc).status_code == 404  # Amina has not shared
    assert client.put("/v1/clinic/patients/amina/visit-note", headers=hc, json={"text": "x"}).status_code == 404


def test_a_card_cites_its_own_evidence_first_and_counts_the_rest(client):
    cards = {c["observation_id"]: c for c in client.get("/v1/insights", headers=login(client, "noura")).json()["cards"]}
    andro = cards["OBS_IRREGULAR_PLUS_ANDROGEN"]
    assert andro["why_total"] >= 16 and len(andro["why_we_noticed"]) <= 12
    first = andro["why_we_noticed"][0]["text"].lower()
    assert "acne" in first or "hair" in first, first  # the androgen card shows the skin and hair days first
