"""Clinic network / payer dashboard. Aggregates only, minimum group size 10 (docs/07). Synthetic cohort."""

from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, Response

from app.db import Actor, session
from app.security import audit
from app.security.auth import require

router = APIRouter(prefix="/v1/admin", tags=["admin"])
admin = require("admin")
K_MIN = 10


def _k(n: int) -> int | None:
    return n if n >= K_MIN else None


@router.get("/metrics")
def metrics(actor: Actor = Depends(admin)):
    with session(actor) as cur:
        cur.execute(
            "SELECT count(*) n, count(*) FILTER (WHERE report_shared) shared, count(*) FILTER (WHERE consented_care_share) consented,"
            " count(*) FILTER (WHERE care_gap_type IS NOT NULL) gaps, count(*) FILTER (WHERE care_gap_status='open') open,"
            " count(*) FILTER (WHERE care_gap_status='in_progress') in_progress, count(*) FILTER (WHERE care_gap_status='closed') closed,"
            " count(*) FILTER (WHERE care_gap_type='postpartum_glucose_test') pp_gaps,"
            " count(*) FILTER (WHERE care_gap_type='postpartum_glucose_test' AND care_gap_status='closed') pp_closed,"
            " count(*) FILTER (WHERE care_gap_type='postpartum_glucose_test' AND care_gap_status='in_progress') pp_booked,"
            " count(*) FILTER (WHERE obs_irregular_cycles OR obs_severe_cyclical_pain OR obs_heavy_periods OR obs_ttc_fertility_assessment) any_obs"
            " FROM cohort_members"
        )
        c = cur.fetchone()
        cur.execute(
            "SELECT region, count(*) n, count(*) FILTER (WHERE care_gap_status='open') open,"
            " count(*) FILTER (WHERE care_gap_status='in_progress') in_progress, count(*) FILTER (WHERE care_gap_status='closed') closed"
            " FROM cohort_members GROUP BY region ORDER BY n DESC"
        )
        regions = cur.fetchall()
        # Per clinic (SaaS: usage and outcome metrics per tenant), same k-min rule as every other group
        cur.execute(
            "SELECT m.clinic_id, c.name, count(*) n, count(*) FILTER (WHERE m.consented_care_share) consented,"
            " count(*) FILTER (WHERE m.report_shared) shared, count(*) FILTER (WHERE m.care_gap_type IS NOT NULL) gaps,"
            " count(*) FILTER (WHERE m.care_gap_status='closed') closed"
            " FROM cohort_members m LEFT JOIN clinics c ON c.id = m.clinic_id GROUP BY m.clinic_id, c.name ORDER BY n DESC"
        )
        clinics = cur.fetchall()
        fair = {}
        for dim in ("nationality_group", "age_band"):
            cur.execute(
                f"SELECT {dim} AS g, count(*) n,"  # noqa: S608 (fixed column names)
                " round(100.0*count(*) FILTER (WHERE obs_irregular_cycles OR obs_severe_cyclical_pain OR obs_heavy_periods"
                " OR obs_ttc_fertility_assessment)/count(*),1) pct_obs,"
                " round(100.0*count(*) FILTER (WHERE report_shared)/count(*),1) pct_shared"
                f" FROM cohort_members GROUP BY {dim} ORDER BY {dim}"
            )
            fair[dim] = cur.fetchall()
        # live gaps from the demo personas (closing Fatima's gap moves these numbers)
        cur.execute("SELECT status, n FROM care_gap_counts()")
        live = {r["status"]: r["n"] for r in cur.fetchall()}
        live_pp: dict[str, int] = {}
        cur.execute("SELECT to_regprocedure('care_gap_counts_by_type()') IS NOT NULL AS ok")  # older databases lack it
        if cur.fetchone()["ok"]:
            cur.execute("SELECT status, n FROM care_gap_counts_by_type() WHERE type = 'postpartum_glucose_test'")
            live_pp = {r["status"]: r["n"] for r in cur.fetchall()}
        audit.record(cur, actor, "view_admin_metrics", None, "admin")
    overall_shared = round(100.0 * c["shared"] / c["n"], 1)
    overall_obs = round(100.0 * c["any_obs"] / c["n"], 1)
    for rows in fair.values():
        for r in rows:
            r["n"] = _k(r["n"])
            if r["n"] is None:
                r["pct_obs"] = r["pct_shared"] = None
                r["flag"] = "suppressed (fewer than 10)"
            else:
                gap = max(abs(float(r["pct_shared"]) - overall_shared), abs(float(r["pct_obs"]) - overall_obs))
                r["flag"] = "check: gap over 5 points" if gap > 5 else ""
    gaps_total = c["gaps"] + sum(live.values())
    closed = c["closed"] + live.get("closed", 0)
    return {
        "cohort": {
            "n": c["n"],
            "is_synthetic": True,
            "note": "Synthetic cohort. Proportions are plausible, not epidemiological estimates.",
        },
        "kpis": {
            "reports_shared": c["shared"],
            "consented": c["consented"],
            "care_gaps_total": gaps_total,
            "care_gaps_open": c["open"] + live.get("open", 0),
            "care_gaps_in_progress": c["in_progress"] + live.get("in_progress", 0),
            "care_gaps_closed": closed,
            "close_rate_pct": round(100.0 * closed / gaps_total, 1) if gaps_total else 0,
        },
        "funnel": [
            {"stage": "Follow-ups due", "n": gaps_total},
            {"stage": "Contacted / booked", "n": c["in_progress"] + live.get("in_progress", 0) + closed},
            {"stage": "Completed", "n": closed},
        ],
        "regions": [{**r, "n": _k(r["n"])} for r in regions],
        "clinics": [
            {**r, "n": _k(r["n"])}
            if r["n"] >= K_MIN
            else {
                "clinic_id": r["clinic_id"],
                "name": r["name"],
                "n": None,
                "consented": None,
                "shared": None,
                "gaps": None,
                "closed": None,
            }
            for r in clinics
        ],
        "fairness": {"overall": {"pct_obs": overall_obs, "pct_shared": overall_shared}, **fair},
        "roi_inputs": {
            "postpartum_gaps": c["pp_gaps"] + (1 if live else 0),
            "reports_shared": c["shared"],
            "assumptions": "You set minutes saved per consult and cost per clinician hour; nothing here is measured yet.",
        },
        "live_demo_gaps": live,
        "pc008_glucose": _pc008_glucose(c, live_pp),
    }


def _pc008_glucose(c: dict, live_pp: dict) -> dict:
    """The glucose-test part of DoH Jawda KPI PC008 (post-partum follow-up, 7-84 days after birth): of the after-birth
    glucose follow-ups due after gestational diabetes, how many are done. Synthetic cohort plus the live demo; hidden
    below 10 women like every other group here. A real PC008 rate needs the clinic's claims and records."""
    due = c["pp_gaps"] + sum(live_pp.values())
    done = c["pp_closed"] + live_pp.get("closed", 0)
    booked = c["pp_booked"] + live_pp.get("in_progress", 0)
    if due < K_MIN:
        return {"due": None, "done": None, "booked": None, "open": None, "done_pct": None}
    return {
        "due": due,
        "done": done,
        "booked": booked,
        "open": due - done - booked,
        "done_pct": round(100.0 * done / due, 1),
    }


@router.get("/audit/verify")
def verify_audit(actor: Actor = Depends(admin)):
    from app.security.audit import verify_chain

    with session(actor) as cur:
        cur.execute("SELECT * FROM audit_log ORDER BY id")
        rows = cur.fetchall()
    ok, bad = verify_chain(rows)
    return {"entries": len(rows), "chain_ok": ok, "first_bad_id": bad}


AUDIT_COLUMNS = ("id", "at", "actor_role", "actor_id", "action", "subject_id", "target", "prev_hash", "hash")


@router.get("/audit/export.csv")
def export_audit(actor: Actor = Depends(admin)):
    """The hash-chained audit log as CSV for a compliance review (SaaS scorecard; DoH privacy standard: access logs).
    Who did what to which pseudonymous record, and when; the free-text detail column is left out. The export is logged."""
    with session(actor) as cur:
        audit.record(cur, actor, "export_audit_log", None, "admin")
        cur.execute(f"SELECT {', '.join(AUDIT_COLUMNS)} FROM audit_log ORDER BY id")  # noqa: S608 (fixed column list)
        rows = cur.fetchall()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(AUDIT_COLUMNS)
    for r in rows:
        w.writerow([r["at"].isoformat() if k == "at" else r[k] for k in AUDIT_COLUMNS])
    return Response(
        buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="reprosense-audit-log.csv"', "Cache-Control": "no-store"},
    )
