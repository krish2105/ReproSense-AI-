"""Blood-pressure log and urgent warning in pregnancy and after birth (build week K6, 18 Nov 2026, gate G2).

Thresholds come from NICE NG133 Hypertension in pregnancy (2019), checked 18 Nov 2026:
- "Terms used": hypertension is 140 mmHg systolic or higher, or 90 mmHg diastolic or higher; severe hypertension is
  160/110 (Table 1 under recommendation 1.4.3: admit, and manage as hypertension once "BP falls below 160/110 mmHg";
  1.5.2: "sustained systolic blood pressure of 160 mmHg or higher").
- 1.1.1: severe headache, problems with vision and sudden swelling of the face, hands or feet are symptoms of
  pre-eclampsia that need a healthcare professional immediately.
NICE NG201 1.2.26 and 1.2.27 (antenatal care) set the timing: a first reading of 140/90 or higher after 20 weeks is
seen within 24 hours, 160/110 or higher the same day.

RF7 is evaluated with the other red flags, first. It applies in pregnancy and up to 6 weeks after birth.
"""

import copy
import json
from datetime import date, timedelta

import psycopg
import pytest
from conftest import login

from app.config import DATA_DIR
from app.db import SYSTEM, Actor, session
from app.rules.engine import evaluate

REF = date(2026, 11, 22)
RF7 = "RF7_HIGH_BLOOD_PRESSURE"
OBS = "OBS_RAISED_BLOOD_PRESSURE"
PERSONAS = {p: json.loads((DATA_DIR / "personas" / f"{p}.json").read_text()) for p in ("hessa", "fatima", "noura")}


def _with(pid: str, *readings, symptoms=None, log_day=None, delivered_days_ago=None) -> dict:
    """Her persona with extra readings (sys, dia[, day]) and, optionally, a log of symptoms on one day."""
    p = copy.deepcopy(PERSONAS[pid])
    p.setdefault("bp_readings", [])
    for i, r in enumerate(readings):
        day = r[2] if len(r) > 2 else REF.isoformat()
        p["bp_readings"].append(
            {"id": f"{pid}-bp-t{i}", "date": day, "time": None, "systolic": r[0], "diastolic": r[1], "source": "app"}
        )
    if symptoms:
        p["daily_logs"].append(
            {
                "id": f"{pid}-t-log",
                "date": log_day or REF.isoformat(),
                "flow": "none",
                "pain": 0,
                "pain_sites": [],
                "symptoms": symptoms,
                "impact": "none",
                "pbac": 0,
            }
        )
    if delivered_days_ago is not None:
        for e in p["events"]:
            if e["type"] == "delivery":
                e["date"] = (REF - timedelta(days=delivered_days_ago)).isoformat()
    return p


def _hits(p: dict) -> dict:
    ev = evaluate(p, REF)
    return {h.rule_id: h for h in ev.all_hits}


# ---------- thresholds (Hessa, 24 weeks pregnant) ----------
def test_159_over_109_alone_is_not_urgent():
    assert RF7 not in _hits(_with("hessa", (159, 109)))


@pytest.mark.parametrize("reading", [(160, 80), (165, 100), (200, 120)])
def test_systolic_160_or_more_is_urgent(reading):
    assert RF7 in _hits(_with("hessa", reading))


@pytest.mark.parametrize("reading", [(120, 110), (150, 115)])
def test_diastolic_110_or_more_is_urgent(reading):
    assert RF7 in _hits(_with("hessa", reading))


@pytest.mark.parametrize("symptom", ["severe headache", "vision changes", "sudden swelling"])
def test_140_over_90_with_a_warning_symptom_the_same_day_is_urgent(symptom):
    assert RF7 in _hits(_with("hessa", (140, 90), symptoms=[symptom]))


@pytest.mark.parametrize("reading", [(140, 85), (130, 90)])
def test_either_number_at_140_or_90_counts_with_a_warning_symptom(reading):
    assert RF7 in _hits(_with("hessa", reading, symptoms=["severe headache"]))


def test_139_over_89_with_severe_headache_is_not_raised_by_this_rule():
    assert RF7 not in _hits(_with("hessa", (139, 89), symptoms=["severe headache"]))


def test_raised_reading_and_headache_on_different_days_are_not_urgent_together():
    yesterday = (REF - timedelta(days=1)).isoformat()
    assert RF7 not in _hits(_with("hessa", (145, 92), symptoms=["severe headache"], log_day=yesterday))


def test_ordinary_headache_does_not_count_as_a_warning_symptom():
    assert RF7 not in _hits(_with("hessa", (145, 92), symptoms=["headache"]))


# ---------- the "soon" card: 140/90 or more without warning symptoms ----------
def test_140_over_90_without_symptoms_asks_for_a_recheck_today():
    hits = _hits(_with("hessa", (145, 92)))
    assert RF7 not in hits and OBS in hits
    assert hits[OBS].urgency == "soon"
    assert any("today" in s for s in hits[OBS].next_steps)
    assert hits[OBS].supporting_entry_ids[0] == "hessa-bp-t0"  # the reading first, then her pregnancy entries


def test_139_over_89_alone_shows_nothing():
    hits = _hits(_with("hessa", (139, 89)))
    assert RF7 not in hits and OBS not in hits


def test_the_soon_card_is_not_shown_beside_the_urgent_card():
    hits = _hits(_with("hessa", (165, 100)))
    assert RF7 in hits and OBS not in hits


def test_the_soon_card_reads_the_latest_reading():
    earlier = (REF - timedelta(days=2)).isoformat()
    assert OBS not in _hits(_with("hessa", (146, 94, earlier), (122, 78)))


# ---------- evidence and order ----------
def test_red_flag_cites_only_the_reading_behind_it_and_its_date():
    yesterday = (REF - timedelta(days=1)).isoformat()
    h = _hits(_with("hessa", (118, 76, yesterday), (121, 79, yesterday), (165, 100, yesterday)))[RF7]
    assert h.supporting_entry_ids == ["hessa-bp-t2"]
    assert h.entry_date == yesterday
    assert h.kind == "red_flag" and h.urgency == "urgent"


def test_red_flag_with_a_symptom_cites_the_reading_and_the_symptom_entry():
    h = _hits(_with("hessa", (142, 88), (118, 70), symptoms=["vision changes"]))[RF7]
    assert set(h.supporting_entry_ids) == {"hessa-bp-t0", "hessa-t-log"}


def test_red_flags_come_first():
    ev = evaluate(_with("hessa", (170, 100)), REF)
    assert ev.all_hits[0].rule_id == RF7


def test_a_reading_older_than_the_red_flag_window_does_not_fire():
    old = (REF - timedelta(days=20)).isoformat()
    assert RF7 not in _hits(_with("hessa", (170, 112, old)))


# ---------- only in pregnancy or up to 6 weeks after birth ----------
def test_not_for_someone_who_is_not_pregnant_or_after_birth():
    hits = _hits(_with("noura", (170, 112), symptoms=["severe headache"]))
    assert RF7 not in hits and OBS not in hits


def test_not_at_9_weeks_after_birth():
    assert RF7 not in _hits(_with("fatima", (170, 112)))  # Fatima gave birth on 20 Sep, 9 weeks before the demo date


@pytest.mark.parametrize("days, fires", [(20, True), (42, True), (48, True), (49, False)])
def test_after_birth_up_to_the_end_of_week_6(days, fires):
    assert (RF7 in _hits(_with("fatima", (165, 100), delivered_days_ago=days))) is fires


def test_no_persona_triggers_the_blood_pressure_rules_by_default():
    for pid in ("amina", "noura", "priya", "fatima", "sara", "mariam", "hessa", "layla"):
        p = json.loads((DATA_DIR / "personas" / f"{pid}.json").read_text())
        hits = {h.rule_id for h in evaluate(p, REF).all_hits}
        assert not hits & {RF7, OBS}, pid


def test_hessa_and_fatima_carry_ordinary_readings():
    for pid in ("hessa", "fatima"):
        readings = PERSONAS[pid]["bp_readings"]
        assert readings and all(r["systolic"] < 140 and r["diastolic"] < 90 for r in readings), pid


# ---------- API ----------
def _post(client, h, **kw):
    body = {"date": REF.isoformat(), "systolic": 120, "diastolic": 80, **kw}
    return client.post("/v1/bp", json=body, headers=h)


@pytest.mark.parametrize(
    "body",
    [
        {"systolic": 69},
        {"systolic": 251},
        {"diastolic": 39},
        {"diastolic": 151},
        {"systolic": 120, "diastolic": 120},
        {"systolic": 100, "diastolic": 110},
        {"systolic": "high"},
        {"date": (REF + timedelta(days=1)).isoformat()},
        {"time": "25:00"},
        {"pulse": 80},
    ],
)
def test_implausible_readings_are_refused(client, body):
    h = login(client, "hessa")
    r = _post(client, h, **body)
    assert r.status_code == 422, (body, r.text)


def test_boundaries_of_the_plausible_range_are_accepted(client, reseed):
    h = login(client, "hessa")
    assert _post(client, h, systolic=70, diastolic=40).status_code == 200
    assert _post(client, h, systolic=250, diastolic=150, time="07:30").status_code == 200


def test_only_in_pregnancy_or_the_12_weeks_after_birth(client):
    r = _post(client, login(client, "noura"))
    assert r.status_code == 422 and "pregnancy" in r.json()["detail"]


def test_hessa_logs_165_over_100_and_the_998_card_comes_back_first(client, reseed):
    h = login(client, "hessa")
    r = _post(client, h, systolic=165, diastolic=100, time="08:15")
    assert r.status_code == 200, r.text
    out = r.json()
    rid = out["id"]
    assert out["red_flags"][0]["observation_id"] == RF7
    card = out["red_flags"][0]
    assert card["summary"].startswith("Call 998")
    assert card["urgency"] == "urgent" and card["entry_date"] == REF.isoformat()
    assert card["why_we_noticed"][0]["entry_id"] == rid
    assert "165/100" in card["why_we_noticed"][0]["text"]
    assert {s["source_id"] for s in card["sources"]} >= {"nice_ng133"}
    assert out["reading"] == {
        "id": rid,
        "date": REF.isoformat(),
        "time": "08:15",
        "systolic": 165,
        "diastolic": 100,
        "source": "app",
    }

    # stored, audited, and in her bundle, timeline and home
    with session(SYSTEM) as cur:
        cur.execute("SELECT action, subject_id, target FROM audit_log WHERE target=%s", (rid,))
        assert cur.fetchone() == {"action": "create_bp_reading", "subject_id": "hessa", "target": rid}
    tl = client.get("/v1/timeline", params={"months": 3}, headers=h).json()
    assert tl["bp_eligible"] is True and rid in [x["id"] for x in tl["bp_readings"]]
    home = client.get("/v1/me/home", headers=h).json()
    assert home["blood_pressure"]["latest"]["id"] == rid
    assert home["red_flags"][0]["observation_id"] == RF7

    # Arabic: the card in Arabic with 998, the reading named in Arabic
    ar = client.get("/v1/me/home", params={"lang": "ar"}, headers=h).json()["red_flags"][0]
    assert ar["observation_id"] == RF7
    assert "998" in ar["summary"] and "ضغط" in ar["summary"]
    assert "ضغط الدم" in ar["title"] or "ضغط" in ar["title"]
    assert "ضغط الدم 165/100" in ar["why_we_noticed"][0]["text"]

    # another patient cannot read it (row-level security in Postgres, not just the API)
    with session(Actor("patient", "noura")) as cur:
        cur.execute("SELECT count(*) AS n FROM bp_readings WHERE profile_id <> 'noura'")
        assert cur.fetchone()["n"] == 0

    # her clinic sees the readings and the urgent card; another clinic sees nothing
    c = login(client, role="clinician")
    rec = client.get("/v1/clinic/patients/hessa", headers=c).json()
    assert rid in [x["id"] for x in rec["bp_readings"]]
    flag = next(x for x in rec["cards"] if x["observation_id"] == RF7)
    assert flag["clinician_title"].startswith("Red flag:")
    assert RF7 in {x["observation_id"] for x in rec["cards"] if x["kind"] == "red_flag"}
    with session(Actor("clinician", "clin-x", "clinic_alain")) as cur:
        cur.execute("SELECT count(*) AS n FROM bp_readings")
        assert cur.fetchone()["n"] == 0


def test_a_patient_cannot_write_a_reading_into_another_record():
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with session(Actor("patient", "noura")) as cur:
            cur.execute(
                "INSERT INTO bp_readings (id, profile_id, date, systolic, diastolic) VALUES ('x-bp','hessa','2026-11-22',120,80)"
            )


def test_the_database_refuses_an_implausible_reading():
    with pytest.raises(psycopg.errors.CheckViolation):
        with session(SYSTEM) as cur:
            cur.execute(
                "INSERT INTO bp_readings (id, profile_id, date, systolic, diastolic) VALUES ('x-bp','hessa','2026-11-22',80,90)"
            )


def test_a_raised_reading_with_sudden_swelling_logged_the_same_day_is_urgent(client, reseed):
    h = login(client, "hessa")
    log = client.post("/v1/logs", json={"date": REF.isoformat(), "symptoms": ["sudden swelling"]}, headers=h)
    assert log.status_code == 200, log.text
    out = _post(client, h, systolic=142, diastolic=91).json()
    assert out["red_flags"][0]["observation_id"] == RF7
    assert {w["entry_id"] for w in out["red_flags"][0]["why_we_noticed"]} == {out["id"], log.json()["id"]}


def test_a_raised_reading_without_symptoms_gives_the_soon_card(client, reseed):
    h = login(client, "hessa")
    out = _post(client, h, systolic=144, diastolic=86).json()
    assert out["red_flags"] == [] and OBS in out["patterns"]
    cards = client.get("/v1/insights", headers=h).json()
    card = next(c for c in cards["cards"] if c["observation_id"] == OBS)
    assert card["urgency"] == "soon" and "144/86" in card["summary"]


def test_after_birth_the_clinician_sees_fatimas_readings(client):
    c = login(client, role="clinician")
    rec = client.get("/v1/clinic/patients/fatima", headers=c).json()
    assert len(rec["bp_readings"]) >= 2
    assert all({"date", "time", "systolic", "diastolic"} <= set(x) for x in rec["bp_readings"])
    assert "home blood pressure readings, latest 118/78 mmHg" in rec["sbar"]["background"]
    ask = client.post("/v1/clinic/patients/fatima/ask", json={"question": "What has her blood pressure been?"}, headers=c)
    assert [e["entry_id"] for e in ask.json()["evidence"]] == [x["id"] for x in rec["bp_readings"]][::-1]


def test_a_database_seeded_before_the_readings_table_is_seeded_again(reseed):
    from app.db.seed import seed_if_empty

    with session(SYSTEM) as cur:
        cur.execute("RESET ROLE")
        cur.execute("DROP TABLE bp_readings")
    assert seed_if_empty() is not None
    with session(SYSTEM) as cur:
        cur.execute("SELECT count(*) AS n FROM bp_readings WHERE profile_id='hessa'")
        assert cur.fetchone()["n"] == 4
    assert seed_if_empty() is None  # a current database is never wiped


def test_deleting_her_data_deletes_her_readings(client, reseed):
    h = login(client, "hessa")
    assert client.delete("/v1/me/data", headers=h).status_code == 200
    with session(SYSTEM) as cur:
        cur.execute("SELECT count(*) AS n FROM bp_readings WHERE profile_id='hessa'")
        assert cur.fetchone()["n"] == 0


def test_the_doctor_report_lists_her_readings():
    from app.agents.pipeline import run
    from app.reports.pdf import build_payload, render_html

    out = run(PERSONAS["hessa"], REF)
    pl = build_payload(PERSONAS["hessa"], out["evaluation"], out["cards"], REF)
    assert [r["id"] for r in pl["bp_readings"]][0] == "hessa-bp04"
    html = render_html(pl)
    assert "Blood pressure (her home readings" in html and "118/76 mmHg" in html
    assert "Blood pressure" not in render_html(build_payload(PERSONAS["noura"], evaluate(PERSONAS["noura"], REF), [], REF))
