"""FHIR R4 export (Bundle of Patient + Observation). Structure follows the R4 spec; validated structurally in tests
(an official validator run is a Phase 9 item). Shaped so a future Malaffi integration is a mapping, not a rewrite."""

from __future__ import annotations

import uuid

LOINC = {
    "HGB": ("718-7", "Hemoglobin [Mass/volume] in Blood"),
    "TSH": ("3016-3", "Thyrotropin [Units/volume] in Serum or Plasma"),
    "FERR": ("2276-4", "Ferritin [Mass/volume] in Serum or Plasma"),
    "HBA1C": ("4548-4", "Hemoglobin A1c/Hemoglobin.total in Blood"),
    "OGTT2H": ("1518-0", "Glucose [Mass/volume] in Serum or Plasma --2 hours post 75 g glucose PO"),
    "FPG": ("1558-6", "Fasting glucose [Mass/volume] in Serum or Plasma"),
    "TESTO": ("2986-8", "Testosterone [Mass/volume] in Serum or Plasma"),
    "AMH": ("38476-3", "Mullerian inhibiting substance [Mass/volume] in Serum or Plasma"),
    "PRL": ("2842-3", "Prolactin [Mass/volume] in Serum or Plasma"),
}


def _uuid(seed: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, "reprosense:" + seed))


def bundle_for(record: dict, cards: list[dict]) -> dict:
    p = record["profile"]
    pid = _uuid(p["id"])
    patient = {
        "resourceType": "Patient",
        "id": pid,
        "active": True,
        "gender": "female",
        "meta": {
            "tag": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ActReason",
                    "code": "HTEST",
                    "display": "test health data",
                }
            ]
        },
        # Synthetic is marked by the standard HTEST tag above; a custom extension without a published definition fails
        # the HL7 validator (issue #25).
        "name": [{"text": p.get("alias")}],
    }
    entries = [{"fullUrl": f"urn:uuid:{pid}", "resource": patient}]
    for lab in record["labs"]:
        code = LOINC.get(lab["code"])
        obs = {
            "resourceType": "Observation",
            "id": _uuid(f"{p['id']}:{lab['code']}:{lab['date']}"),
            "status": "final",
            "category": [
                {
                    "coding": [
                        {"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory"}
                    ]
                }
            ],
            "code": {"coding": [{"system": "http://loinc.org", "code": code[0], "display": code[1]}]}
            if code
            else {"text": lab["test"]},
            "subject": {"reference": f"urn:uuid:{pid}"},
            "effectiveDateTime": str(lab["date"]),
        }
        if isinstance(lab["value"], (int, float)):
            obs["valueQuantity"] = {"value": lab["value"], "unit": lab["unit"]}
            rr = {}
            if lab.get("ref_low") is not None:
                rr["low"] = {"value": lab["ref_low"], "unit": lab["unit"]}
            if lab.get("ref_high") is not None:
                rr["high"] = {"value": lab["ref_high"], "unit": lab["unit"]}
            if rr:
                obs["referenceRange"] = [rr]
        else:
            obs["valueString"] = str(lab["value"])
        if lab.get("flag") in ("H", "L"):
            obs["interpretation"] = [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                            "code": lab["flag"],
                        }
                    ]
                }
            ]
        entries.append({"fullUrl": f"urn:uuid:{obs['id']}", "resource": obs})
    for c in cards:
        obs = {
            "resourceType": "Observation",
            "id": _uuid(f"{p['id']}:{c['observation_id']}"),
            "status": "preliminary",
            "category": [
                {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "survey"}]}
            ],
            "code": {"text": f"ReproSense pattern (non-diagnostic): {c['title']}"},
            "subject": {"reference": f"urn:uuid:{pid}"},
            "valueString": c["summary"],
            "note": [{"text": "Rule-based pattern worth discussing; not a diagnosis. Rule " + c["observation_id"]}],
        }
        entries.append({"fullUrl": f"urn:uuid:{obs['id']}", "resource": obs})
    return {"resourceType": "Bundle", "type": "collection", "id": _uuid(p["id"] + ":bundle"), "entry": entries}


def validate(b: dict) -> list[str]:
    """Structural checks for the R4 resources we emit."""
    errs = []
    if b.get("resourceType") != "Bundle" or b.get("type") not in ("collection", "document", "transaction"):
        errs.append("bundle type")
    for e in b.get("entry", []):
        r = e.get("resource", {})
        if not e.get("fullUrl", "").startswith("urn:uuid:"):
            errs.append("fullUrl")
        # The HL7 validator rejects extensions it cannot resolve; we publish no StructureDefinitions of our own.
        if any(not x.get("url", "").startswith("http://hl7.org/") for x in r.get("extension", [])):
            errs.append(f"{r.get('resourceType')}.extension without a published definition")
        if r.get("resourceType") == "Observation":
            for k in ("status", "code", "subject"):
                if k not in r:
                    errs.append(f"Observation.{k}")
            if r.get("status") not in ("registered", "preliminary", "final", "amended"):
                errs.append("Observation.status value")
        elif r.get("resourceType") == "Patient":
            if r.get("gender") not in ("male", "female", "other", "unknown"):
                errs.append("Patient.gender")
        else:
            errs.append(f"unexpected {r.get('resourceType')}")
    return errs
