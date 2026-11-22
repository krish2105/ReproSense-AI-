"""Nura's food lane (22 Nov 2026, G2: Krishna).

"What should I eat on my period?" once came back with medicine advice; it must answer with food and drink from the NHS,
never a medicine, written by code. Her heavy-flow days personalise the lead. A named allergy leaves matching foods out,
with label advice and 998 for a serious reaction. Medicine questions and pregnancy questions keep their old routes."""

import json
import re
from datetime import date

from conftest import login

from app.agents import food
from app.config import DATA_DIR

REF = date(2026, 11, 22)
DRUGS = re.compile(r"ibuprofen|paracetamol|painkiller|naproxen|mefenamic|aspirin|tablet|بروفين|باراسيتامول|بنادول|مسكن", re.I)


def ask(client, who: str, q: str):
    return client.post("/v1/assistant/ask", headers=login(client, who), json={"question": q})


def persona(name: str) -> dict:
    return json.loads((DATA_DIR / "personas" / f"{name}.json").read_text())


def test_what_to_eat_on_a_period_is_food_from_the_nhs_and_never_a_medicine(client):
    r = ask(client, "noura", "What should I eat during my period?")
    assert r.status_code == 200, r.text
    a = r.json()
    assert a["lane"] == "food"
    assert not DRUGS.search(a["answer"]), a["answer"]
    assert "iron" in a["answer"] and "6 to 8 cups" in a["answer"] and "warm bath" in a["answer"]
    ids = {c["source_id"] for c in a["citations"]}
    assert {"nhs_iron_deficiency_anaemia", "nhs_water_drinks", "nhs_period_pain"} <= ids
    assert all(f"[{c['n']}]" in a["answer"] for c in a["citations"])  # every source is cited in the text
    assert not a["crisis"] and not a["urgent"] and not a["refused"]
    assert any(s["agent"] == "router" and "food" in s["detail"] for s in a["trace"])
    assert any(s["agent"] == "writer" and "no model" in s["detail"] for s in a["trace"])


def test_her_heavy_days_put_iron_first(client):
    for who in ("sara", "noura", "priya", "amina", "layla", "mariam"):
        heavy = food._heavy_days(persona(who), REF)
        if heavy:
            a = ask(client, who, "What foods help on my period?").json()
            assert a["lane"] == "food"
            assert f"You logged heavy bleeding on {heavy} day" in a["answer"]
            assert a["food"]["heavy_days"] == heavy
            return
    raise AssertionError("no demo persona has heavy days in the last 90 days")


def test_a_named_allergy_leaves_those_foods_out_and_gives_998(client):
    a = ask(client, "noura", "I'm allergic to gluten. What should I eat on my period?").json()
    assert a["lane"] == "food"
    assert "cereals and bread" not in a["answer"]
    assert "gluten" in a["answer"] and "check food labels" in a["answer"] and "998" in a["answer"]
    assert "nhs_food_allergy" in {c["source_id"] for c in a["citations"]}
    assert a["food"]["allergens"] == ["gluten"] and a["food"]["left_out"] == ["cereals and bread with added iron"]
    assert not DRUGS.search(a["answer"])


def test_arabic_food_question_answers_in_arabic_without_medicines(client):
    a = ask(client, "noura", "ماذا آكل أثناء الدورة؟").json()
    assert a["lane"] == "food" and a["lang"] == "ar"
    assert re.search(r"[؀-ۿ]", a["answer"])
    assert "الحديد" in a["answer"] and "998" not in a["answer"]
    assert not DRUGS.search(a["answer"])


def test_arabic_allergy_is_understood():
    assert food.allergens("عندي حساسية من القمح، ماذا آكل أثناء الدورة؟") == ["القمح"]
    res = food.answer("عندي حساسية من القمح، ماذا آكل أثناء الدورة؟", "ar", None, REF)
    assert "الحبوب والخبز المدعّمة بالحديد" in res["dropped"]


def test_a_medicine_question_never_lands_in_the_food_lane(client):
    a = ask(client, "noura", "Which painkiller should I take for period cramps?").json()
    assert a["lane"] != "food"  # medicine questions keep their existing route; the food lane never answers them


def test_pregnancy_food_questions_stay_with_the_knowledge_answer():
    assert not food.is_food_question("What should I eat while I'm pregnant?")
    assert not food.is_food_question("What foods are good when breastfeeding?")
    assert not food.is_food_question("I can't eat anything since yesterday")  # not asking for food advice
    assert food.is_food_question("What should I eat during my period?")
    assert food.is_food_question("any food tips for cramps?")
    assert not food.is_food_question("What should I eat?", {"profile": {"pregnant": True}})
    assert food.is_food_question("What should I eat on my period?", {"profile": {"pregnant": True}})


def test_allergy_phrases():
    assert food.allergens("I'm allergic to nuts and dairy, what can I eat?") == ["nuts"]
    assert food.allergens("I can't eat beans. What helps on my period?") == ["beans"]
    assert food.allergens("I have a peanut allergy") == ["peanut"]
    assert food.allergens("no idea what to eat on my period") == []


def test_the_food_lane_works_with_her_ai_switch_off(client):
    headers = login(client, "noura")
    assert client.patch("/v1/consents", headers=headers, json={"purpose": "assistant", "granted": False}).status_code == 200
    try:
        r = client.post("/v1/assistant/ask", headers=headers, json={"question": "What should I drink on my period?"})
        assert r.status_code == 200 and r.json()["lane"] == "food"
    finally:
        client.patch("/v1/consents", headers=headers, json={"purpose": "assistant", "granted": True})
