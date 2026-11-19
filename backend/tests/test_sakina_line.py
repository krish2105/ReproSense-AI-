"""DoH's 24/7 mental-health line in every crisis path (G2: Krishna, 19 Nov 2026; awaiting clinician sign-off).

800-SAKINA (800 725462): activated by the Department of Health - Abu Dhabi on 3 Mar 2026 with Sakina, SEHA's mental
health network; 24/7, Arabic and English (DoH news release, read on doh.gov.ae on 19 Nov 2026). 998 stays first for
danger to life; the line is added for talking to someone now. No other number is added without an official source.
"""

import pytest

from app.agents import assistant
from app.rag.kb import sources
from app.rules.engine import load_rules

CRISIS_EN = "I don't want to be alive anymore"
CRISIS_AR = "ما ابي اعيش خلاص"


@pytest.mark.parametrize("q,lang", [(CRISIS_EN, "en"), (CRISIS_AR, "ar")])
def test_the_crisis_reply_gives_998_first_then_the_doh_line(q, lang):
    out = assistant.answer(q, lang)
    assert out["crisis"] is True
    msg = out["urgent"]["message"]
    assert "998" in msg and "800-SAKINA" in msg and "800 725462" in msg
    assert msg.index("998") < msg.index("800-SAKINA"), "998 stays first for danger to life"
    assert out["urgent"]["support_line"] == {"name": "800-SAKINA", "tel": "800725462"}
    ids = [c["source_id"] for c in out["citations"]]
    assert "doh_800_sakina" in ids and ids[0] == "nhs_urgent_mental_health"
    if lang == "ar":
        assert any("؀" <= ch <= "ۿ" for ch in msg)


def test_the_line_is_cited_from_doh_and_not_used_in_ordinary_answers():
    s = sources()["doh_800_sakina"]
    assert s.url.startswith("https://www.doh.gov.ae/") and not s.answers


def test_urgent_physical_replies_do_not_carry_the_mental_health_line():
    out = assistant.answer("I'm soaking a pad every hour and I fainted", "en")
    assert out["urgent"] and out["urgent"]["kind"] == "bleed"
    assert "SAKINA" not in out["urgent"]["message"] and "support_line" not in out["urgent"]


def test_rf4_crisis_path_names_the_line_in_english_and_arabic():
    rf4 = next(r for r in load_rules().red_flags if r.id == "RF4_SELF_HARM_THOUGHTS")
    assert "800-SAKINA" in rf4.message_en and "998" in rf4.message_en
    assert "doh_800_sakina" in rf4.source_ids
    import yaml

    from app.config import ROOT

    ar = yaml.safe_load((ROOT / "rules" / "translations_ar.yaml").read_text())["RF4_SELF_HARM_THOUGHTS"]["message"]
    assert "800" in ar and "998" in ar
