"""Family support view (build week Y4, UAE Year of the Family 2026).

What a family link shows, and nothing else:
- her first name and life stage, so the reader knows whose steps these are;
- her upcoming care steps with their dates: the after-birth checks (K1 pathway) and, in pregnancy, the glucose screen
  at 24-28 weeks. Steps carry neutral names, so a step never reveals why it is on the list (the glucose test after
  gestational diabetes is "a blood sugar test");
- "how you can help" tips for her stage (copy in the web app, keyed by stage);
- health details only if she ticked them when she made the link: pregnancy week or weeks since the birth, and which
  patterns are worth discussing with a doctor, as rule ids the web names in the third person (her cards say "your").
  Never red flags, never the evidence entries, and never the mood pattern: mental health stays between her and her
  care team (the "ask how she is feeling" tip covers it). Care-gap rules are already listed as steps.
"""

from __future__ import annotations

from datetime import date

from app.services import postnatal

STAGES = ("periods", "trying_to_conceive", "pregnancy", "after_birth", "perimenopause")
RELATIONS = ("husband", "mother", "sister", "friend", "other")
LINK_DAYS = 30
NEVER_SHARED = {"OBS_POSTPARTUM_MOOD"}  # mental health: not on a family link, even with details ticked


def first_name(alias: str) -> str:
    parts = (alias or "").replace("(fictional)", "").replace("(demo)", "").split()
    return parts[0] if parts else ""


def view(bundle: dict, open_gaps: list[dict], cards: list[dict], include_details: bool, ref: date) -> dict:
    p = bundle["profile"]
    stage = p.get("life_stage") if p.get("life_stage") in STAGES else "periods"
    steps: list[dict] = []
    path = postnatal.pathway(bundle, ref)
    if path:
        for s in path["steps"]:
            if s["status"] in ("due", "upcoming"):
                steps.append({"id": s["id"], "from": s["from"], "to": s["to"], "status": s["status"]})
    for g in open_gaps:
        if g.get("type") == "pregnancy_glucose_screen":
            steps.append(
                {
                    "id": "pregnancy_glucose_screen",
                    "from": None,
                    "to": str(g["due_date"]) if g.get("due_date") else None,
                    "status": "due",
                }
            )
    details = None
    if include_details:
        details = {
            "pregnancy_weeks": p.get("pregnancy_weeks") if stage == "pregnancy" else None,
            "weeks_since_birth": path["weeks_since_birth"] if path else None,
            "patterns": [
                c["observation_id"]
                for c in cards
                if c.get("kind") == "observation" and c["observation_id"] not in NEVER_SHARED
            ][:5],
        }
    return {
        "first_name": first_name(p.get("alias", "")),
        "stage": stage,
        "steps": steps,
        "steps_done": path["done"] if path else None,
        "details": details,
    }
