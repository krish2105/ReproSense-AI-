"""Nura's explain lane (22 Nov 2026, G2: Krishna).

Live on 22 Nov, "What is happening with my body?" answered about the menopause questionnaire and the pregnancy glucose
test, "What is endometriosis?" never said what it is, and "What medicine is good for PCOS?" slipped past the medicine
word checks. The explain lane answers what a condition is from fixed, cited sentences, adds her own patterns, refuses a
diagnosis first, gives the fixed medicine reply first, and never touches the crisis and urgent routes."""

import re
from pathlib import Path

from conftest import login

from app.agents import explain
from app.rag.kb import sources

DRUGS = re.compile(
    r"ibuprofen|paracetamol|naproxen|mefenamic|metformin|clomifene|spironolactone|tranexamic|pill\b|بروفين|باراسيتامول|ميتفورمين",
    re.I,
)
KB = Path(__file__).resolve().parents[2] / "knowledge_base" / "summaries"


def ask(client, who: str, q: str, lang: str | None = None):
    body = {"question": q} | ({"lang": lang} if lang else {})
    r = client.post("/v1/assistant/ask", headers=login(client, who), json=body)
    assert r.status_code == 200, r.text
    return r.json()


def test_what_is_pcos_explains_the_condition_with_sources_hormones_and_learn_more(client):
    a = ask(client, "noura", "Which hormones cause PCOS?")
    assert a["lane"] == "explain" and not a["refused"] and not a["crisis"]
    assert "insulin and testosterone" in a["answer"] and "PMOS" in a["answer"]
    ids = {c["source_id"] for c in a["citations"]}
    assert {"nhs_pcos", "pcos_guideline_2023"} <= ids
    assert all(f"[{c['n']}]" in a["answer"] for c in a["citations"])
    kinds = {x["kind"] for x in a["learn_more"]}
    assert kinds == {"page", "video"}
    assert any(x["url"].startswith("https://www.youtube.com/watch?v=") for x in a["learn_more"])
    # her own record: Noura's irregular cycles and skin and hair days, with her numbers
    assert "42–56" in a["answer"] and a["explain"]["personal"]
    assert any(s["agent"] == "writer" and "no model" in s["detail"] for s in a["trace"])


def test_what_is_endometriosis_says_what_it_is(client):
    a = ask(client, "priya", "What is endometriosis?")
    assert a["lane"] == "explain"
    assert "cells similar to the lining of the womb grow in other places" in a["answer"]
    assert "nhs_endometriosis" in {c["source_id"] for c in a["citations"]}


def test_what_is_happening_with_my_body_is_her_own_patterns_not_a_diagnosis(client):
    a = ask(client, "noura", "What is happening with my body?")
    assert a["lane"] == "explain" and a["explain"]["mode"] == "body"
    assert "not a diagnosis" in a["answer"] and "42–56" in a["answer"]
    assert "Menopause Rating Scale" not in a["answer"] and "glucose" not in a["answer"]
    assert any(x["kind"] == "video" for x in a["learn_more"])  # her patterns' condition video (PCOS, NHS)
    assert not any("nfertility" in x["title"] for x in a["learn_more"])  # she is not trying to conceive


def test_her_red_flag_leads_with_998(client, reseed):
    a = ask(client, "sara", "What is happening with my body?")
    assert a["lane"] == "explain"
    assert a["urgent"] and a["urgent"]["number"] == "998"


def test_do_i_have_pcos_refuses_first_then_cites_facts(client):
    a = ask(client, "noura", "Do I have PCOS?")
    assert a["lane"] == "explain" and a["refused"] is True
    assert a["answer"].startswith("I can't tell whether any condition is present")
    assert "nhs_pcos" in {c["source_id"] for c in a["citations"]}


def test_medicine_for_a_condition_gets_the_fixed_reply_and_no_medicine_names(client):
    for q in ("What medicine is good for PCOS?", "What medicine should I take for endometriosis?"):
        a = ask(client, "noura", q)
        assert a["lane"] == "explain" and a["explain"]["mode"] == "medicine"
        assert a["answer"].startswith("I can't advise on medicines")
        assert not DRUGS.search(a["answer"]), a["answer"]


def test_arabic_questions_answer_in_arabic_with_who_page(client):
    a = ask(client, "noura", "ما هي متلازمة تكيس المبايض؟", "ar")
    assert a["lane"] == "explain" and "الإنسولين" in a["answer"]
    assert a["learn_more"][0]["url"].startswith("https://www.who.int/ar/")
    b = ask(client, "noura", "ماذا يحدث في جسمي؟", "ar")
    assert b["lane"] == "explain" and "ليست تشخيصاً" in b["answer"]
    assert "Your cycle lengths" not in b["answer"]  # her pattern titles in Arabic too


def test_crisis_and_urgent_routes_are_unchanged(client):
    a = ask(client, "noura", "I want to end my life, what is PCOS")
    assert a["crisis"] and a["lane"] == "safety"
    b = ask(client, "sara", "I am soaking a pad every hour and I feel dizzy, are these heavy periods?")
    assert b["urgent"] and b["lane"] == "safety"
    c = ask(client, "hessa", "حامل بالشهر السادس وعندي صداع قوي ونظري مغبش، هل هو تسمم الحمل؟", "ar")
    assert c["urgent"] and c["lane"] == "safety"


def test_record_and_food_questions_keep_their_lanes(client):
    assert ask(client, "noura", "How long were my last cycles?")["lane"] == "record"
    assert ask(client, "noura", "What should I eat with PCOS?")["lane"] == "food"


def test_every_sentence_cites_a_known_source_and_every_condition_has_both_languages():
    from app.ai.guards import violations

    known = sources()
    for cid, c in explain.CONDITIONS.items():
        assert c["lines"], cid
        for en, ar, src in c["lines"]:
            assert src in known, (cid, src)
            assert en.strip() and ar.strip()
            assert not DRUGS.search(en) and not DRUGS.search(ar), (cid, en)
            assert not violations(en) and not violations(ar), (cid, en, violations(en), violations(ar))
        for sid in c["pages"]:
            assert sid in known
        for v in explain.VIDEOS.get(cid, []):
            assert re.fullmatch(r"https://www\.youtube\.com/watch\?v=[\w-]{11}", v["url"]) and v["publisher"]


def test_new_sources_are_cite_only_nhs_pages_with_summaries_in_both_languages():
    known = sources()
    for sid in ("nhs_endometriosis", "nhs_menopause", "nhs_gestational_diabetes", "nhs_postnatal_depression", "nhs_infertility"):
        s = known[sid]
        assert s.answers is False and s.url.startswith("https://www.nhs.uk/")
        text = (KB / f"{sid}.md").read_text()
        assert "## en" in text and "## ar" in text


def test_audit_22nov_questions_reach_the_explain_lane(client):
    """The senior audit (22 Nov, 14:03) found these answered by the general lane; each now gets its explainer."""
    m = ask(client, "mariam", "When should I see a doctor about fertility?")
    assert m["lane"] == "explain" and m["explain"]["condition"] == "infertility" and "36" in m["answer"]
    m_ar = ask(client, "mariam", "متى أراجع الطبيب بخصوص الخصوبة؟", "ar")
    assert m_ar["lane"] == "explain" and m_ar["explain"]["condition"] == "infertility"
    f_ar = ask(client, "fatima", "ما هو اكتئاب ما بعد الولادة؟", "ar")
    assert f_ar["lane"] == "explain" and "998" in f_ar["answer"] and "800" in f_ar["answer"]
    h = ask(client, "noura", "What counts as a heavy period?")
    assert h["lane"] == "explain" and "every 1 to 2 hours" in h["answer"]
    p = ask(client, "hessa", "What is pre-eclampsia?")
    assert p["lane"] == "explain" and "high blood pressure" in p["answer"]
    i = ask(client, "noura", "Why are my periods irregular?")
    assert i["lane"] == "explain" and "42–56" in i["answer"]  # her own cycles
    assert not h["answer"].startswith("Here is what")  # 'About heavy periods, in plain words:'


def test_wide_phrasings_reach_the_right_explainer_and_warning_signs_are_urgent(client):
    cases = [
        ("noura", "Am I suffering from PCOS?", "pcos", True),
        ("layla", "Am I going through menopause?", "menopause", True),
        ("noura", "Why is my period late?", "irregular_periods", False),
        ("noura", "Why are my cycles so long?", "irregular_periods", False),
        ("priya", "Why are my periods so painful?", "period_pain", False),
        ("sara", "How do I know if my period is heavy?", "heavy_periods", False),
        ("mariam", "How long does it take to conceive?", "infertility", False),
    ]
    for who, q, cid, refused in cases:
        a = ask(client, who, q)
        assert a["lane"] == "explain" and a["explain"]["condition"] == cid and a["refused"] is refused, q
    ar = ask(client, "noura", "ليش دورتي غير منتظمة؟", "ar")
    assert ar["lane"] == "explain" and ar["explain"]["condition"] == "irregular_periods"
    pe = ask(client, "hessa", "Is this pre-eclampsia? I have a bad headache and swollen face")
    assert pe["urgent"] and pe["urgent"]["number"] == "998" and pe["answer"].startswith("Get help now")
    plain = ask(client, "hessa", "What is pre-eclampsia?")
    assert not plain["urgent"]  # a plain question is not alarmed
