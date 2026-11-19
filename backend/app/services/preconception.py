"""Planning-a-pregnancy checklist for the "Trying" life stage (build week Y1, 18 Nov 2026).

Five items she may want to look at before or while trying, each with its sources from knowledge_base/sources.yaml:
- folic acid before conception (NHS);
- her premarital screening results, for women who had the Abu Dhabi screening (DoH Premarital Screening Standard,
  DoH/STD/PSS/V3, Sept 2024: infectious diseases, inherited blood disorders, blood group and rubella immunity);
- German measles (rubella) protection, with the one month to wait after the vaccine (DoH standard, UKHSA leaflet);
- a check-up when her cycles are irregular (the same source as OBS_IRREGULAR_CYCLES);
- when to ask about a fertility assessment (the same thresholds and sources as OBS_TTC_FERTILITY_ASSESSMENT).

Information only: nothing here is a rule hit, a score or a diagnosis, and no item is required. `relevant` marks the two
items her own record points to (the matching rule fires), so the screen can say "your record suggests looking at this".
She can tick an item; a tick is an event in her record (`preconception_item`) and can be undone.
"""

from __future__ import annotations

from app.rag.kb import sources as kb_sources

ITEMS: tuple[tuple[str, list[str]], ...] = (
    ("folic_acid", ["nhs_folic_acid"]),
    ("premarital_results", ["doh_premarital_screening_2024"]),
    ("rubella", ["doh_premarital_screening_2024", "ukhsa_rubella_before_pregnancy"]),
    ("cycle_checkup", ["pcos_guideline_2023"]),
    ("fertility_check", ["asrm_2021_infertile_eval", "nice_ng257"]),
)
IDS = tuple(i for i, _ in ITEMS)
RELEVANT_WHEN = {"cycle_checkup": "OBS_IRREGULAR_CYCLES", "fertility_check": "OBS_TTC_FERTILITY_ASSESSMENT"}
EVENT = "preconception_item"


def applies(bundle: dict) -> bool:
    p = bundle.get("profile") or {}
    return bool(p.get("trying_to_conceive")) or p.get("life_stage") == "trying_to_conceive"


def ticked(bundle: dict) -> dict[str, str]:
    """Item id -> the day she ticked it."""
    out: dict[str, str] = {}
    for e in bundle.get("events") or []:
        item = (e.get("details") or {}).get("item")
        if e.get("type") == EVENT and item in IDS:
            out.setdefault(item, str(e["date"])[:10])
    return out


def checklist(bundle: dict, rule_ids: set[str]) -> dict | None:
    """Her checklist, or None outside the Trying stage. `rule_ids`: the rules that fire for her today."""
    if not applies(bundle):
        return None
    known = kb_sources()
    done = ticked(bundle)
    items = []
    for item, srcs in ITEMS:
        items.append(
            {
                "id": item,
                "done": item in done,
                "done_on": done.get(item),
                "relevant": RELEVANT_WHEN.get(item) in rule_ids,
                "sources": srcs,
                "source_links": [
                    {"source_id": s, "title": known[s].title, "url": known[s].url} for s in srcs if s in known
                ],
            }
        )
    return {"items": items, "done": sum(i["done"] for i in items), "total": len(items)}
