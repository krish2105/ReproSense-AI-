"""What the rules checked and did not show (22 Nov 2026).

The Patterns screen lists the period checks that did not become a card, with her own numbers and the rule's threshold.
The case it exists for: acne without irregular cycles is never shown as a pattern (the 2023 international PCOS guideline
looks at skin and hair changes together with irregular cycles). No new clinical logic, no reassurance, no diagnosis.
"""

import re
from datetime import date, timedelta

from conftest import login

from app.ai.guards import violations
from app.rag.kb import sources
from app.rules.engine import evaluate, load_rules
from app.services import checked as ck
from app.services.patient_data import load_bundle  # noqa: F401  (kept importable for the API tests below)

REF = date(2026, 11, 22)
ARABIC = re.compile(r"[؀-ۿ]")


def bundle(lengths=(28, 29, 27, 28, 30, 28), acne_days=0, pain=3, bleed=5, **profile):
    """A woman with complete cycles of the given lengths, ending today, and acne logged on the last `acne_days` days."""
    starts, d = [], REF - timedelta(days=sum(lengths))
    for n in lengths:
        starts.append((d, n))
        d += timedelta(days=n)
    cycles = [
        {"id": f"c{i}", "start": s.isoformat(), "length_days": n, "bleed_days": bleed} for i, (s, n) in enumerate(starts)
    ]
    cycles.append({"id": "c-open", "start": d.isoformat(), "length_days": None, "bleed_days": bleed})
    logs = [
        {"id": f"p{i}", "date": s.isoformat(), "flow": "medium", "pain": pain, "symptoms": [], "impact": None}
        for i, (s, _) in enumerate(starts)
    ]
    logs += [
        {
            "id": f"a{i}",
            "date": (REF - timedelta(days=40 + i)).isoformat(),
            "flow": "none",
            "pain": 0,
            "symptoms": ["acne"],
            "impact": None,
        }
        for i in range(acne_days)
    ]
    p = {"age": 27, "menarche_age": 13, "pregnant": False, "breastfeeding": False, **profile}
    return {"profile": p, "cycles": cycles, "daily_logs": logs, "events": [], "labs": [], "feeds": []}


def run(b, lang="en", crisis=False):
    ev = evaluate(b, REF, 14)
    return ev, {c["id"]: c for c in ck.checked(ev, lang, crisis)}


def test_acne_with_regular_cycles_is_never_a_pattern_and_the_list_says_why():
    ev, got = run(bundle(acne_days=30))
    assert not ev.observations  # 30 acne days alone: no card at all
    line = got["skin_hair"]["text"]
    assert "30 of the last 90 days" in line and "On their own they are not shown as a pattern" in line
    assert "irregular cycles" in line and "only a doctor" in line
    assert got["skin_hair"]["sources"] and all(s in sources() for s in got["skin_hair"]["sources"])
    assert "0 of your last 6 cycles" in got["cycles"]["text"] and "27–30" in got["cycles"]["text"]


def test_no_acne_logged_no_skin_line():
    _, got = run(bundle())
    assert "skin_hair" not in got and {"cycles", "pain", "bleeding"} <= set(got)


def test_a_check_that_became_a_card_is_not_listed_and_few_acne_days_say_the_threshold():
    ev, got = run(bundle(lengths=(40, 28, 52, 29, 45, 28), acne_days=4))
    fired = {h.rule_id for h in ev.observations}
    assert "OBS_IRREGULAR_CYCLES" in fired and "OBS_IRREGULAR_PLUS_ANDROGEN" not in fired
    assert "cycles" not in got
    assert "4 of the last 90 days" in got["skin_hair"]["text"] and "from 10 days" in got["skin_hair"]["text"]


def test_too_few_cycles_says_so_instead_of_staying_silent():
    _, got = run(bundle(lengths=(28, 30)))
    assert "Complete cycles logged so far: 2" in got["cycles"]["text"] and "from 4 cycles" in got["cycles"]["text"]


def test_not_shown_in_pregnancy_breastfeeding_the_year_after_birth_or_on_the_crisis_path():
    assert run(bundle(acne_days=12, pregnant=True, pregnancy_weeks=20))[1] == {}
    assert run(bundle(acne_days=12, breastfeeding=True))[1] == {}
    assert run(bundle(acne_days=12), crisis=True)[1] == {}
    after_birth = bundle(acne_days=12)
    after_birth["events"] = [{"id": "e1", "type": "delivery", "date": (REF - timedelta(weeks=9)).isoformat(), "details": {}}]
    assert run(after_birth)[1] == {}


def test_every_threshold_in_the_copy_is_the_one_in_the_rules_file():
    rules = load_rules()
    when = {rid: rules.by_id(rid).when for rid in ck.CHECKS.values()}
    assert f"cycles_logged >= {ck.MIN_CYCLES}" in when["OBS_IRREGULAR_CYCLES"]
    assert f"irregular_cycle_count_6 >= {ck.IRREGULAR_FROM}" in when["OBS_IRREGULAR_CYCLES"]
    assert "cycles_per_year < 8" in when["OBS_IRREGULAR_CYCLES"]
    assert f"androgen_symptom_days_90 >= {ck.ANDROGEN_DAYS_FROM}" in when["OBS_IRREGULAR_PLUS_ANDROGEN"]
    assert "OBS_IRREGULAR_CYCLES and" in when["OBS_IRREGULAR_PLUS_ANDROGEN"]  # acne alone can never fire it
    assert f"severe_pain_cycles_6 >= {ck.SEVERE_CYCLES_FROM}" in when["OBS_SEVERE_CYCLICAL_PAIN"]
    assert f"pain_impact_days_90 >= {ck.IMPACT_DAYS_FROM}" in when["OBS_SEVERE_CYCLICAL_PAIN"]
    assert f"period_duration_max > {ck.LONG_PERIOD_OVER}" in when["OBS_HEAVY_OR_LONG_PERIODS"]
    assert f"pbac_max_6 >= {ck.PBAC_FROM}" in when["OBS_HEAVY_OR_LONG_PERIODS"]
    assert "heavy_flow_days_cycle >= 2" in when["OBS_HEAVY_OR_LONG_PERIODS"]


def test_lines_are_plain_never_diagnostic_never_reassuring_and_translated():
    for b in (bundle(acne_days=30), bundle(lengths=(40, 28, 52, 29, 45, 28), acne_days=4), bundle(lengths=(28, 30))):
        en, ar = run(b, "en")[1], run(b, "ar")[1]
        assert list(en) == list(ar)
        for cid in en:
            a, z = en[cid], ar[cid]
            assert not violations(a["text"]) and not violations(z["text"]), cid
            assert ARABIC.search(z["text"]) and ARABIC.search(z["label"]) and a["text"] != z["text"], cid
            assert not re.search(r"\b(normal|healthy|nothing wrong|no need|fine|rule[sd]? out)\b", a["text"], re.I), cid
            assert a["sources"] == z["sources"] and a["sources"], cid


# ---------- the API ----------
def test_amina_sees_what_was_checked_and_noura_does_not_see_her_cards_twice(client):
    amina = client.get("/v1/insights", headers=login(client, "amina")).json()
    assert amina["cards"] == [] and {c["id"] for c in amina["checked"]} >= {"cycles", "pain", "bleeding"}
    noura = client.get("/v1/insights", headers=login(client, "noura")).json()
    shown = {c["observation_id"] for c in noura["cards"]}
    assert all(c["rule_id"] not in shown for c in noura["checked"])
    ar = client.get("/v1/insights", params={"lang": "ar"}, headers=login(client, "amina")).json()["checked"]
    assert all(ARABIC.search(c["text"]) for c in ar)


def test_pregnant_and_after_birth_women_get_no_period_checks(client):
    for who in ("hessa", "fatima"):
        assert client.get("/v1/insights", headers=login(client, who)).json()["checked"] == [], who
