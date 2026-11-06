"""The FHIR export validates against published FHIR models (fhir.resources, R4B: identical to R4 for the Patient and
Observation resources we emit). This checks structure, required elements, cardinality and value formats for every
demo woman. Terminology bindings need the official HL7 validator, which is not run here."""

import json
from pathlib import Path

import pytest
from fhir.resources.R4B.bundle import Bundle

from app.agents.pipeline import cards_for
from app.config import DATA_DIR
from app.services import fhir

PERSONAS = sorted((DATA_DIR / "personas").glob("*.json"))


@pytest.mark.parametrize("path", PERSONAS, ids=lambda p: p.stem)
def test_export_is_a_valid_fhir_bundle(path: Path):
    record = json.loads(path.read_text())
    cards, _, _ = cards_for(record, "en")
    bundle = fhir.bundle_for(record, cards)
    assert fhir.validate(bundle) == []
    parsed = Bundle.model_validate(bundle)
    assert parsed.type == "collection" and len(parsed.entry) >= 1


def test_every_demo_woman_is_checked():
    assert len(PERSONAS) == 8
