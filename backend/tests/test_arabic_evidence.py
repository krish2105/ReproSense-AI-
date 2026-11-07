"""Arabic "why we noticed" lines are Arabic (issue #67).

The lines translated their labels but kept the logged values in English: "28 نوفمبر · نزول medium, ألم 7/10, PBAC 11,
reduced activity". Every value the API accepts (flow, symptoms, impact) and every event type in the demo data now has an
Arabic word, the same words the log form uses (apps/web/messages/ar.json). Scale names stay as abbreviations (PBAC,
EPDS), as the copy rules allow for terms the doctor will use.
"""

import re

import pytest
from conftest import login

from app.agents import copy as cp
from app.api.patient import FLOWS, IMPACTS, SYMPTOMS

ALLOWED_LATIN = {"PBAC", "EPDS", "MRS", "PHQ", "GAD"}
EVENT_TYPES = [
    "pregnancy_confirmed",
    "antenatal_visit",
    "gdm_diagnosis",
    "delivery",
    "lab_test",
    "breastfeeding",
    "ttc_started",
    "appointment_planned",
]


def latin_words(text: str) -> list[str]:
    return [w for w in re.findall(r"[A-Za-z]+", text) if w not in ALLOWED_LATIN]


@pytest.mark.parametrize("flow", [f for f in FLOWS if f != "none"])
def test_every_flow_is_arabic(flow):
    assert latin_words(cp.entry_text({"date": "2025-11-28", "flow": flow}, "ar")) == []


@pytest.mark.parametrize("symptom", sorted(SYMPTOMS))
def test_every_symptom_is_arabic(symptom):
    assert latin_words(cp.entry_text({"date": "2025-11-28", "symptoms": [symptom]}, "ar")) == []


@pytest.mark.parametrize("impact", [i for i in IMPACTS if i != "none"])
def test_every_impact_is_arabic(impact):
    assert latin_words(cp.entry_text({"date": "2025-11-28", "impact": impact}, "ar")) == []


@pytest.mark.parametrize("etype", [*EVENT_TYPES, "questionnaire"])
def test_every_event_is_arabic(etype):
    e = {"date": "2025-11-28", "type": etype, "details": {"tool": "EPDS", "total": 12}}
    assert latin_words(cp.entry_text(e, "ar")) == []


def test_the_line_from_the_issue_reads_in_arabic_and_english_is_unchanged():
    log = {"date": "2025-11-28", "flow": "medium", "pain": 7, "pbac": 11, "impact": "reduced activity"}
    ar = cp.entry_text(log, "ar")
    assert "نزول متوسط" in ar and "نشاط أقل من المعتاد" in ar and "PBAC 11" in ar
    en = cp.entry_text(log, "en")
    assert en.endswith("· medium flow, pain 7/10, PBAC 11, reduced activity")


def test_noura_arabic_insights_have_no_english_words(client):
    cards = client.get("/v1/insights?lang=ar", headers=login(client, "noura")).json()["cards"]
    lines = [w["text"] for c in cards for w in c.get("why_we_noticed", [])]
    assert lines, "Noura has evidence lines"
    assert [t for t in lines if latin_words(t)] == []
