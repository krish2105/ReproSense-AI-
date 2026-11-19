"""The closed loop, told and measured (sections 4 and 8 of the team's plan).

1. A follow-up's history, one line per step: a rule opened it, she shared her record with her clinic, a reminder was
   drafted, the clinic booked it, it was done, a result came back. Each line has its time, the actor's role, its
   evidence and the days since the step before. Built from the follow-up row and the hash-chained audit log, which is
   only ever read here.
2. Loop metrics for the network and for one clinic: median days from opened to booked, booked to done and opened to a
   result; follow-ups done inside their window; overdue follow-ups; postnatal steps done inside their DoH window;
   records a clinician opened before the visit. Synthetic cohort (dates derived per member, so a demo reset gives the
   same figures) plus the live demo. Any group under 10 is hidden.
3. Overdue: an open follow-up (never booked) whose window ended before today.

Nothing here diagnoses or scores a person: these are dates of care steps.
"""

from __future__ import annotations

import math
import random
import statistics
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.agents import copy as cp
from app.rag.kb import sources as kb_sources
from app.rules.engine import load_rules
from app.services import postnatal

TZ = ZoneInfo("Asia/Dubai")
K_MIN = 10
# The lab whose confirmed upload is "a result back" for each follow-up (the same test that ends the rule).
RESULT_CODES = {"postpartum_glucose_test": "OGTT2H", "pregnancy_glucose_screen": "OGTT2H"}
REPORT_OPENS = ("view_record", "view_shared_report", "download_shared_report")
AUDIT_STEP = {
    "care_gap_opened": "opened",
    "care_gap_in_progress": "booked",
    "care_gap_closed": "done",
    "care_gap_resolved": "done",
    "care_gap_open": "reopened",
    "reminder_drafted": "reminder",
    "reminder_approved": "reminder_approved",
    "reminder_discarded": "reminder_discarded",
}
# Window lengths in days for the synthetic cohort. After-birth glucose test: weeks 4-12 (ADA, NICE NG3). Pregnancy
# glucose screen: weeks 24-28. A gynaecology review has no guideline window: 42 days is a clinic service target used
# for the synthetic cohort only, and the API says so.
WINDOW_DAYS = {"postpartum_glucose_test": 56, "pregnancy_glucose_screen": 28, "gyn_review": 42}
COHORT_SEED = "closed-loop-v1"


def day(ts) -> date | None:
    """A timestamp's calendar day in Abu Dhabi (dates pass through)."""
    if ts is None:
        return None
    if isinstance(ts, datetime):
        return (ts if ts.tzinfo else ts.replace(tzinfo=UTC)).astimezone(TZ).date()
    if isinstance(ts, date):
        return ts
    return date.fromisoformat(str(ts)[:10])


def is_overdue(status: str, window_end, ref: date) -> bool:
    """Past its window with no booking: still open (never booked, or reopened) and the window ended before today."""
    end = day(window_end)
    return status == "open" and end is not None and end < ref


# ---------------------------------------------------------------- history


def _sources(ids: list[str]) -> list[dict]:
    known = kb_sources()
    return [{"source_id": s, "title": known[s].title, "url": known[s].url} for s in ids if s in known]


def _opened_evidence(cur, pid: str, gap: dict, lang: str, viewer: str) -> dict:
    rule = load_rules().by_id(gap["rule_id"])
    ar = cp.ar_rules().get(gap["rule_id"]) or {}
    cur.execute("SELECT card FROM observations WHERE profile_id=%s AND rule_id=%s", (pid, gap["rule_id"]))
    obs = cur.fetchone()
    card = (obs or {}).get("card") or {}
    entries = [e.get("text") for e in card.get("why_we_noticed", []) if e.get("text")]
    use_ar = lang == "ar" and viewer == "patient"
    return {
        "rule_id": gap["rule_id"],
        "title": (ar.get("title") if use_ar else None) or (rule.title_en if rule else gap["rule_id"]),
        "why": (ar.get("explains") if use_ar else None) or (rule.explains if rule else ""),
        "sources": _sources(rule.source_ids if rule else []),
        "entries": entries[:3] if viewer == "clinician" else [],
        "still_in_record": obs is not None,
    }


def _step(kind: str, at, role: str, actor: str | None, evidence: dict, audit_row: dict | None = None) -> dict:
    ev = dict(evidence)
    if audit_row:
        ev["audit_id"] = audit_row["id"]
        ev["audit_hash"] = audit_row["hash"][:12]
    return {"step": kind, "at": at, "actor_role": role, "actor_id": actor, "evidence": ev}


def history(cur, pid: str, gap_id: int, ref: date, viewer: str, lang: str = "en") -> dict | None:
    """One follow-up's story for `viewer` ('clinician' or 'patient'), read through the caller's own session: RLS and
    follow_up_audit() return nothing unless she is the woman herself or a clinician she shares her record with."""
    cur.execute(
        "SELECT g.id, g.type, g.rule_id, g.status, g.due_date, g.window_end, g.opened_at, g.updated_at, g.updated_by,"
        " g.clinic_id FROM care_gaps g WHERE g.id=%s AND g.profile_id=%s",
        (gap_id, pid),
    )
    gap = cur.fetchone()
    if not gap:
        return None
    cur.execute("SELECT * FROM follow_up_audit(%s, %s)", (pid, gap_id))
    rows = cur.fetchall()
    cur.execute(
        "SELECT c.granted, c.granted_at, c.revoked_at, c.clinic_id, cl.name FROM consents c"
        " LEFT JOIN clinics cl ON cl.id = c.clinic_id WHERE c.profile_id=%s AND c.purpose='care_share'"
        " ORDER BY c.id DESC LIMIT 1",
        (pid,),
    )
    share = cur.fetchone()
    opened_at = gap["opened_at"]
    steps: list[dict] = []

    opened_row = next(
        (r for r in rows if r["action"] == "care_gap_opened" and r["target"] == f"care_gap:{gap_id}"), None
    )
    steps.append(
        _step(
            "opened",
            opened_row["at"] if opened_row else opened_at,
            "system",
            "rules",
            _opened_evidence(cur, pid, gap, lang, viewer),
            opened_row,
        )
    )

    if share and share["granted_at"]:
        grants = [r for r in rows if r["target"] == "care_share" and r["action"] == "consent_grant"]
        row = grants[-1] if grants else None
        steps.append(
            _step(
                "shared",
                share["granted_at"],
                "patient",
                None,
                {
                    "clinic": share["name"],
                    "clinic_id": share["clinic_id"],
                    "before_opened": share["granted_at"] < opened_at,
                    "active": bool(share["granted"]) and share["revoked_at"] is None,
                },
                row,
            )
        )
        if share["revoked_at"]:
            revokes = [r for r in rows if r["target"] == "care_share" and r["action"] == "consent_revoke"]
            steps.append(
                _step(
                    "unshared",
                    share["revoked_at"],
                    "patient",
                    None,
                    {"clinic": share["name"]},
                    revokes[-1] if revokes else None,
                )
            )

    for r in rows:
        kind = AUDIT_STEP.get(r["action"])
        if not kind or kind == "opened" or r["target"] != f"care_gap:{gap_id}":
            continue
        ev: dict = {}
        if r["action"] == "care_gap_resolved":
            ev["reason"] = "rule_resolved"
        if kind.startswith("reminder"):
            ev["sent"] = False
        steps.append(_step(kind, r["at"], r["actor_role"], r["actor_id"], ev, r))

    code = RESULT_CODES.get(gap["type"])
    result_at = None
    if code:
        for r in rows:
            codes = (r["detail"] or {}).get("codes") or []
            if r["action"] != "confirm_document" or code not in codes or r["at"] < opened_at:
                continue
            doc = int(str(r["target"]).split(":")[1]) if str(r["target"]).startswith("document:") else None
            cur.execute(
                "SELECT code, test, value, unit, date FROM lab_results WHERE profile_id=%s AND source_doc_id=%s"
                " AND code=%s ORDER BY id",
                (pid, doc, code),
            )
            labs = [{**lab, "date": lab["date"].isoformat()} for lab in cur.fetchall()]
            steps.append(_step("result", r["at"], "patient", None, {"tests": labs, "document_id": doc}, r))
            result_at = r["at"]
            break

    # Her record opened by a clinician after the follow-up opened: evidence on the "done" line (before the visit?)
    opens = [r for r in rows if r["action"] in REPORT_OPENS and r["actor_role"] == "clinician" and r["at"] >= opened_at]

    # Loop order: nothing comes before the opening (a share made earlier reads "already shared", 0 days)
    t0 = steps[0]["at"]
    order = {"opened": 0, "shared": 1}
    steps.sort(key=lambda s: (max(s["at"], t0), order.get(s["step"], 2)))
    prev = None
    for s in steps:
        eff = day(max(s["at"], t0))
        s["days"] = None if prev is None else (eff - prev).days
        prev = eff
        if s["step"] == "done":
            before = [o for o in opens if o["at"] < s["at"]]
            s["evidence"]["record_opened_before"] = before[0]["at"] if before else None

    if viewer == "patient":  # her view names the clinic, never a staff member's id
        for s in steps:
            if s["actor_role"] != "patient" and s["actor_role"] != "system":
                s["actor_id"] = None

    booked = next((s["at"] for s in steps if s["step"] == "booked"), None)
    done = next((s["at"] for s in reversed(steps) if s["step"] == "done"), None) if gap["status"] == "closed" else None
    pending = []
    if gap["status"] == "open":
        pending = ["booked", "done"]
    elif gap["status"] == "in_progress":
        pending = ["done"]
    if code and result_at is None:
        pending.append("result")

    def span(a, b) -> int | None:
        return (day(b) - day(a)).days if a and b else None

    end = day(gap["window_end"])
    return {
        "follow_up": {
            "id": gap["id"],
            "type": gap["type"],
            "rule_id": gap["rule_id"],
            "status": gap["status"],
            "due_date": gap["due_date"],
            "window_end": end,
            "opened_at": opened_at,
            "overdue": is_overdue(gap["status"], end, ref),
        },
        "steps": steps,
        "pending": pending,
        "summary": {
            "opened_to_booked": span(opened_at, booked),
            "booked_to_done": span(booked, done),
            "opened_to_result": span(opened_at, result_at),
            "done_in_window": (day(done) <= end) if done and end else None,
        },
    }


def her_follow_ups(cur, pid: str, ref: date, lang: str) -> list[dict]:
    cur.execute("SELECT id FROM care_gaps WHERE profile_id=%s ORDER BY id", (pid,))
    out = [history(cur, pid, r["id"], ref, "patient", lang) for r in cur.fetchall()]
    return [h for h in out if h]


# ---------------------------------------------------------------- the synthetic cohort's loop dates


def _days(rng: random.Random, median: float, sigma: float, lo: int, hi: int) -> int:
    """Right-skewed waiting times (most short, a few long), clipped to a plausible range."""
    return max(lo, min(hi, round(rng.lognormvariate(math.log(median), sigma))))


def _plan(birth: date, gdm: bool) -> list[dict]:
    """The DoH postnatal steps and their windows for a birth (app/services/postnatal.py, unchanged)."""
    events = [{"type": "delivery", "date": birth.isoformat()}]
    if gdm:
        events.append({"type": "gdm_diagnosis", "date": birth.isoformat()})
    p = postnatal.pathway({"events": events, "labs": []}, birth)
    return [{"step": s["id"], "from": s["from"], "to": s["to"]} for s in p["steps"]] if p else []


def cohort_loop(row: dict, ref: date) -> dict:
    """Loop dates for one synthetic cohort member, derived from her id and the demo date only, so every demo reset
    gives the same figures. Waits are right-skewed (median about 8 days to book, 12 more to the visit)."""
    rng = random.Random(f"{COHORT_SEED}:{row['patient_id']}")
    out: dict = dict.fromkeys(
        (
            "gap_opened_on",
            "gap_booked_on",
            "gap_done_on",
            "gap_result_on",
            "gap_window_end",
            "report_opened_on",
            "birth_on",
            "postnatal_steps",
        )
    )
    kind, status = row.get("care_gap_type") or None, row.get("care_gap_status") or None
    pp = kind == "postpartum_glucose_test"
    if kind:
        span = WINDOW_DAYS.get(kind, 42)
        book, visit = _days(rng, 8, 0.6, 1, 60), _days(rng, 12, 0.5, 2, 60)
        booked = done = result = None
        if status == "closed":
            done = ref - timedelta(days=rng.randint(1, 120))
            booked = done - timedelta(days=visit)
            opened = booked - timedelta(days=book)
            if rng.random() < (0.9 if pp else 0.55):
                back = done + timedelta(days=rng.randint(1, 4) if pp else rng.randint(3, 14))
                result = back if back <= ref else None
        elif status == "in_progress":
            booked = ref - timedelta(days=rng.randint(0, 25))
            opened = booked - timedelta(days=book)
        else:  # open: the cohort's days_overdue places the end of the window
            late = int(row.get("days_overdue") or 0)
            opened = ref - timedelta(days=late + span) if late > 0 else ref - timedelta(days=rng.randint(0, span - 1))
        out.update(
            gap_opened_on=opened,
            gap_booked_on=booked,
            gap_done_on=done,
            gap_result_on=result,
            gap_window_end=opened + timedelta(days=span),
        )
        if row.get("report_shared") and booked and rng.random() < 0.8:
            last = (done or ref) - timedelta(days=1)
            out["report_opened_on"] = opened + timedelta(days=rng.randint(0, max(0, (last - opened).days)))
    if row.get("recent_delivery"):
        birth = out["gap_opened_on"] - timedelta(days=28) if pp else ref - timedelta(days=rng.randint(3, 84))
        out["birth_on"] = birth
        steps = []
        for s in _plan(birth, bool(row.get("gdm_history"))):
            start, end = date.fromisoformat(s["from"]), date.fromisoformat(s["to"])
            if start > ref:
                continue
            on = None
            if s["step"] == "glucose_test" and pp:
                on = out["gap_done_on"]
            else:
                u = rng.random()
                if u < 0.70:
                    on = start + timedelta(days=rng.randint(0, (end - start).days))
                elif u < 0.82:
                    on = end + timedelta(days=rng.randint(1, 10))
                on = on if on and on <= ref else None
            steps.append({**s, "done_on": on.isoformat() if on else None})
        out["postnatal_steps"] = steps
    return out


# ---------------------------------------------------------------- metrics


@dataclass
class LoopRow:
    type: str
    status: str
    opened: date
    booked: date | None
    done: date | None
    result: date | None
    window_end: date | None
    report_before_done: bool | None


def cohort_rows(cur, clinic: str | None = None) -> tuple[list[LoopRow], list[dict]]:
    """The synthetic cohort's follow-ups and postnatal steps, read as the caller (RLS: the network admin reads all,
    a clinic admin only her clinic's members)."""
    cur.execute(
        "SELECT care_gap_type, care_gap_status, gap_opened_on, gap_booked_on, gap_done_on, gap_result_on,"
        " gap_window_end, report_opened_on, postnatal_steps FROM cohort_members"
        + (" WHERE clinic_id=%s" if clinic else ""),
        (clinic,) if clinic else (),
    )
    rows, steps = [], []
    for r in cur.fetchall():
        if r["care_gap_type"] and r["gap_opened_on"]:
            rows.append(
                LoopRow(
                    r["care_gap_type"],
                    r["care_gap_status"],
                    r["gap_opened_on"],
                    r["gap_booked_on"],
                    r["gap_done_on"],
                    r["gap_result_on"],
                    r["gap_window_end"],
                    (r["report_opened_on"] < r["gap_done_on"]) if r["report_opened_on"] and r["gap_done_on"] else False,
                )
            )
        steps.extend(r["postnatal_steps"] or [])
    return rows, steps


def live_rows(cur) -> list[LoopRow]:
    """The live demo's follow-ups as dates (follow_up_loop(): the network admin all, a clinic admin her clinic's)."""
    cur.execute("SELECT * FROM follow_up_loop()")
    out = []
    for r in cur.fetchall():
        done = r["done_at"]
        out.append(
            LoopRow(
                r["type"],
                r["status"],
                day(r["opened_at"]),
                day(r["booked_at"]),
                day(done),
                day(r["result_at"]),
                r["window_end"],
                bool(r["report_opened_at"] and done and r["report_opened_at"] < done),
            )
        )
    return out


def live_postnatal_steps(cur, ref: date, clinic: str | None = None) -> list[dict]:
    """Postnatal steps of the live demo records with a birth (read by the system for counts only; a clinic admin's
    figure is limited to records shared with her clinic by an active consent)."""
    scope, args = "", ()
    if clinic:
        scope = (
            " AND profile_id IN (SELECT profile_id FROM consents WHERE purpose='care_share' AND granted"
            " AND revoked_at IS NULL AND clinic_id=%s)"
        )
        args = (clinic,)
    cur.execute(
        "SELECT profile_id, type, date, details FROM events WHERE type IN ('delivery', 'hospital_discharge',"
        " 'gdm_diagnosis', 'postnatal_check', 'questionnaire')" + scope,
        args,
    )
    bundles: dict[str, dict] = defaultdict(lambda: {"events": [], "labs": []})
    for e in cur.fetchall():
        bundles[e["profile_id"]]["events"].append(e)
    cur.execute("SELECT profile_id, code, date FROM lab_results WHERE code='OGTT2H'" + scope, args)
    for lab in cur.fetchall():
        bundles[lab["profile_id"]]["labs"].append(lab)
    out = []
    for b in bundles.values():
        births = sorted(day(e["date"]) for e in b["events"] if e["type"] == "delivery")
        if not births or births[-1] > ref:
            continue
        p = postnatal.pathway(b, births[-1])
        for s in (p or {}).get("steps", []):
            if date.fromisoformat(s["from"]) <= ref:
                out.append({"step": s["id"], "from": s["from"], "to": s["to"], "done_on": s["done_on"]})
    return out


def _median(values: list[int], k: int) -> dict:
    n = len(values)
    return {"days": round(float(statistics.median(values)), 1) if n >= k else None, "n": n if n >= k else None}


def _ratio(num: int, den: int, k: int) -> dict:
    """A share with small-group protection: hidden when the group, the count or its complement is under k."""
    hidden = den < k or 0 < num < k or 0 < den - num < k
    if hidden:
        return {"n": None, "of": None, "pct": None, "suppressed": True}
    return {"n": num, "of": den, "pct": round(100.0 * num / den, 1) if den else None, "suppressed": False}


def loop_metrics(rows: list[LoopRow], steps: list[dict], ref: date, k: int = K_MIN) -> dict:
    booked = [r for r in rows if r.booked]
    due = [r for r in rows if r.status == "closed" or (r.window_end and r.window_end < ref)]
    in_window = [r for r in due if r.status == "closed" and r.done and r.window_end and r.done <= r.window_end]
    overdue = sum(1 for r in rows if is_overdue(r.status, r.window_end, ref))
    done = [r for r in rows if r.status == "closed" and r.done]
    ended = [s for s in steps if date.fromisoformat(s["to"]) < ref]
    inside = [
        s
        for s in ended
        if s.get("done_on")
        and date.fromisoformat(s["from"]) <= date.fromisoformat(s["done_on"])
        and date.fromisoformat(s["done_on"]) <= date.fromisoformat(s["to"])
    ]
    return {
        "k_min": k,
        "follow_ups": len(rows) if len(rows) >= k else None,
        "median_days": {
            "opened_to_booked": _median([(r.booked - r.opened).days for r in booked], k),
            "booked_to_done": _median([(r.done - r.booked).days for r in booked if r.done], k),
            "opened_to_result": _median([(r.result - r.opened).days for r in rows if r.result], k),
        },
        "done_in_window": _ratio(len(in_window), len(due), k),
        "overdue": {"n": overdue if overdue == 0 or overdue >= k else None, "suppressed": 0 < overdue < k},
        "postnatal_in_window": _ratio(len(inside), len(ended), k),
        "record_opened_before_visit": _ratio(sum(1 for r in done if r.report_before_done), len(done), k),
        "note": (
            "Synthetic cohort plus the live demo. Windows: after-birth glucose test weeks 4-12, pregnancy glucose "
            "screen weeks 24-28 (guidelines); a gynaecology review's 42 days is a clinic target used for the "
            "synthetic cohort only. A visit is when the follow-up was marked done. Groups under 10 are hidden."
        ),
    }
