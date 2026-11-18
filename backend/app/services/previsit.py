"""Pre-visit brief (K3): "what changed since your last visit", from her own entries only.

Rules and her data decide every fact: which patterns are new or still in the record (the rules engine run on her
entries up to the last visit and up to today), cycle lengths and pain since the visit, labs dated since, care steps
done or due, and her questions. Every line carries the entries behind it, like a card's "Why we noticed".

Wording: a deterministic template (EN/AR). With a model configured and her AI switch on, the model may reword the
English lines only; the verifier keeps a sentence only if it is supported by that line's facts (the pipeline's
`supported`) and passes the guard, otherwise the template line stays. Urgent lines and her questions are never sent.

"Last visit" is the most recent of: the last report she shared, the last clinician review, else 90 days before the
demo reference date. Never a diagnosis or a probability (app/ai/guards.py).
"""

from __future__ import annotations

import json
import re
import statistics
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.agents import copy as cp
from app.agents.pipeline import supported
from app.ai.guards import violations
from app.ai.llm import get_llm
from app.ai.redact import redact
from app.config import get_settings
from app.db import SYSTEM, session
from app.rag import kb
from app.rules.engine import evaluate
from app.services import views

DEFAULT_DAYS = 90  # no visit recorded yet: the brief covers the last 90 days
PAIN_BEFORE_DAYS = 183  # pain before the visit is compared over the 6 months before it
MAX_EVIDENCE = 8
GST = ZoneInfo("Asia/Dubai")
_SENT = re.compile(r"(?<=[.!?؟])\s+")


def _d(s) -> date:
    return s if isinstance(s, date) else date.fromisoformat(str(s))


def _day(d, lang: str) -> str:
    return cp._fmt_day(str(d), lang)


# ---------------- last visit ----------------
def _local_date(ts: datetime | date | None) -> date | None:
    if ts is None:
        return None
    if isinstance(ts, datetime):
        return ts.astimezone(GST).date() if ts.tzinfo else ts.date()
    return ts


def last_visit(shared_at: datetime | None, reviewed_at: datetime | None, ref: date) -> dict:
    """The most recent of the last report she shared and the last clinician review, never after "today" (ref);
    with neither, 90 days before ref."""
    found = [(ts, basis) for ts, basis in ((shared_at, "shared_report"), (reviewed_at, "clinician_review")) if ts]
    if not found:
        return {"date": ref - timedelta(days=DEFAULT_DAYS), "basis": "default_90_days"}
    ts, basis = max(found, key=lambda x: x[0])
    return {"date": min(_local_date(ts), ref), "basis": basis}


def visit_inputs(cur, profile_id: str) -> dict:
    """Her care gaps and last clinician review, read as the caller (RLS: her own record, or a consented clinician)."""
    cur.execute(
        "SELECT id, type, rule_id, status, due_date, updated_at FROM care_gaps WHERE profile_id=%s ORDER BY id",
        (profile_id,),
    )
    gaps = cur.fetchall()
    cur.execute("SELECT reviewed_at FROM clinic_reviews WHERE profile_id=%s", (profile_id,))
    row = cur.fetchone()
    return {"gaps": gaps, "reviewed_at": row["reviewed_at"] if row else None}


def last_shared_at(profile_id: str) -> datetime | None:
    """When she last shared a report. Clinicians cannot read share rows (they hold link hashes), so only this one
    timestamp is read as the system, after the caller's own access to the record has been checked."""
    with session(SYSTEM) as cur:
        cur.execute("SELECT max(created_at) AS at FROM shares WHERE profile_id=%s", (profile_id,))
        return cur.fetchone()["at"]


# ---------------- copy (EN neutral: read by her and her clinician; AR for her screens, AR-REVIEW) ----------------
T = {
    "en": {
        "new": "New since the last visit: {title}.",
        "ongoing": "Still in the record: {title}.",
        "resolved": "No longer seen in the entries: {title}.",
        "cycles_ended": "Cycles that ended since the last visit: {since} days.",
        "cycles_before": "Before that they were {lo} to {hi} days.",
        "cycles_before_one": "Before that, one cycle of {lo} days.",
        "longest": "{n} days is the longest cycle in the record.",
        "shortest": "{n} days is the shortest cycle in the record.",
        "period_started": "A period started on {date}.",
        "no_period": "No new period start logged since the last visit. The last one started on {date}.",
        "pain_since": "Highest pain logged since the last visit: {pain} out of 10 on {date}.",
        "pain_before": "In the 6 months before it, the highest was {pain} out of 10.",
        "pain_none": "No pain logged since the last visit.",
        "impact": "Missed work or study, or stayed in bed, on {n} since the last visit.",
        "lab": "{test}: {value} on {date}, {where}.",
        "lab_no_range": "{test}: {value} on {date}.",
        "above": "above the lab's range ({range})",
        "below": "below the lab's range ({range})",
        "within": "within the lab's range ({range})",
        "care_done": "Done since the last visit: {step}.",
        "care_booked": "Booked: {step}.",
        "care_due": "Still due: {step}.",
        "care_due_by": "Still due: {step}, by {date}.",
        "and": " and ",
    },
    "ar": {
        "new": "جديد منذ الزيارة الأخيرة: {title}.",
        "ongoing": "ما زال في السجل: {title}.",
        "resolved": "لم يعد ظاهراً في الإدخالات: {title}.",
        "cycles_ended": "الدورات التي انتهت منذ الزيارة الأخيرة: {since} {unit}.",
        "cycles_before": "قبل ذلك كانت بين {lo} و{hi} يوماً.",
        "cycles_before_one": "قبل ذلك، دورة واحدة طولها {lo} يوماً.",
        "longest": "{n} يوماً هي أطول دورة في السجل.",
        "shortest": "{n} يوماً هي أقصر دورة في السجل.",
        "period_started": "بدأت دورة في {date}.",
        "no_period": "لم يُسجَّل بدء دورة جديدة منذ الزيارة الأخيرة. بدأت آخر دورة في {date}.",
        "pain_since": "أعلى ألم مسجّل منذ الزيارة الأخيرة: {pain} من 10 في {date}.",
        "pain_before": "في الأشهر الستة التي سبقتها كان الأعلى {pain} من 10.",
        "pain_none": "لم يُسجَّل أي ألم منذ الزيارة الأخيرة.",
        "impact": "سُجّل الغياب عن العمل أو الدراسة أو البقاء في السرير في {n} منذ الزيارة الأخيرة.",
        "lab": "{test}: {value} في {date}، {where}.",
        "lab_no_range": "{test}: {value} في {date}.",
        "above": "أعلى من مدى المختبر ({range})",
        "below": "أقل من مدى المختبر ({range})",
        "within": "ضمن مدى المختبر ({range})",
        "care_done": "تمّ منذ الزيارة الأخيرة: {step}.",
        "care_booked": "محجوز: {step}.",
        "care_due": "ما زال مستحقاً: {step}.",
        "care_due_by": "ما زال مستحقاً: {step}، قبل {date}.",
        "and": " و",
    },
}
CARE_STEP = {
    "postpartum_glucose_test": ("the glucose test after birth (OGTT)", "فحص تحمّل السكر بعد الولادة (OGTT)"),
    "pregnancy_glucose_screen": ("the pregnancy glucose test (24–28 weeks)", "فحص سكر الحمل (الأسبوع 24–28)"),
}


def _join(nums: list[int], lang: str) -> str:
    s = [str(n) for n in nums]
    return s[0] if len(s) == 1 else ", ".join(s[:-1]) + T[lang]["and"] + s[-1]


def _days_en(n: int) -> str:
    return "1 day" if n == 1 else f"{n} days"


def _range(lo, hi) -> str:
    fmt = lambda v: f"{v:g}" if isinstance(v, float) else str(v)  # noqa: E731
    if lo is not None and hi is not None:
        return f"{fmt(lo)}–{fmt(hi)}"
    return f"≤ {fmt(hi)}" if hi is not None else f"≥ {fmt(lo)}"


# ---------------- lines ----------------
def _line(lid: str, kind: str, text: str, evidence: list[dict], **extra) -> dict:
    return {
        "id": lid,
        "kind": kind,
        "status": extra.pop("status", None),
        "rule_id": extra.pop("rule_id", None),
        "text": text,
        "evidence": evidence[:MAX_EVIDENCE],
        "evidence_total": len(evidence),
        "sources": extra.pop("sources", []),
        "written_by": "template",
        **extra,
    }


def _entry(e: dict, lang: str) -> dict:
    return {"entry_id": e["id"], "date": str(e["date"]), "text": cp.entry_text(e, lang)}


def _as_of(bundle: dict, since: date, ref: date) -> dict:
    """Her record as it stood on the day of the last visit: entries up to that day, cycles not yet ended left open."""
    cycles = []
    for c in bundle["cycles"]:
        if _d(c["start"]) > since:
            continue
        ended = c.get("length_days") and _d(c["start"]) + timedelta(days=int(c["length_days"])) <= since
        cycles.append({**c, "length_days": c["length_days"] if ended else None})
    profile = dict(bundle["profile"])
    if profile.get("pregnancy_weeks"):
        profile["pregnancy_weeks"] = max(0, int(profile["pregnancy_weeks"]) - (ref - since).days // 7)
    return {
        **bundle,
        "profile": profile,
        "cycles": cycles,
        "daily_logs": [lg for lg in bundle["daily_logs"] if _d(lg["date"]) <= since],
        "events": [e for e in bundle["events"] if _d(e["date"]) <= since],
        "labs": [lab for lab in bundle["labs"] if _d(lab["date"]) <= since],
    }


def _pattern_title(card: dict | None, rule_id: str, title_en: str, lang: str, audience: str) -> str:
    if audience == "clinician":
        return cp.clinician_title(rule_id, card["title"] if card else title_en)
    if card:
        return card["title"]
    return (cp.ar_rules().get(rule_id, {}).get("title") if lang == "ar" else None) or title_en


def _pattern_lines(bundle, cards, crisis, since, ref, lang, audience) -> list[dict]:
    window = get_settings().red_flag_window_days
    now = evaluate(bundle, ref, window)
    then = evaluate(_as_of(bundle, since, ref), since, window)
    _, shown = views.display_cards(cards, crisis)
    by_id = {c["observation_id"]: c for c in shown}
    before = {h.rule_id for h in then.observations}
    t = T[lang]
    out = []
    for status in ("new", "ongoing"):
        for c in shown:
            rid = c["observation_id"]
            if ("new" if rid not in before else "ongoing") != status:
                continue
            title = _pattern_title(c, rid, c["title"], lang, audience)
            detail = (
                cp.clinician_detail(rid, now.features.values)
                if audience == "clinician"
                else cp.detail(rid, c.get("values", {}), now.features.values, lang)
            )
            text = f"{t[status].format(title=title)} {detail}".strip()
            if violations(text):  # never let a detail sentence carry wording the guard rejects
                text = t[status].format(title=title)
            out.append(
                _line(
                    f"pattern:{rid}",
                    "pattern",
                    text,
                    list(c.get("why_we_noticed", [])),
                    status=status,
                    rule_id=rid,
                    sources=c.get("sources", []),
                    title=title,
                    explains=c.get("explains", ""),
                )
            )
            out[-1]["evidence_total"] = max(out[-1]["evidence_total"], c.get("why_total", 0))
    suppressed = {views.MOOD_RULE} if crisis else set()
    entries = {e["id"]: e for e in bundle["daily_logs"] + bundle["events"]}
    srcs = kb.sources()
    for h in then.observations:
        if h.rule_id in by_id or h.rule_id in suppressed or any(x.rule_id == h.rule_id for x in now.observations):
            continue
        title = _pattern_title(None, h.rule_id, h.title, lang, audience)
        ev = [_entry(entries[i], lang) for i in h.supporting_entry_ids if i in entries]
        out.append(
            _line(
                f"pattern:{h.rule_id}",
                "pattern",
                t["resolved"].format(title=title),
                ev,
                status="resolved",
                rule_id=h.rule_id,
                sources=[
                    {"source_id": s, "title": srcs[s].title, "url": srcs[s].url} for s in h.source_ids if s in srcs
                ],
                title=title,
                explains=h.explains,
            )
        )
    return out


def _start_logs(bundle: dict, start) -> list[dict]:
    return [lg for lg in bundle["daily_logs"] if str(lg["date"]) == str(start) and lg.get("flow", "none") != "none"][:1]


def _cycle_line(bundle: dict, since: date, ref: date, lang: str) -> dict | None:
    if (bundle["profile"].get("life_stage") or "periods") in ("pregnancy", "after_birth", "postmenopause"):
        return None
    cycles = sorted(bundle["cycles"], key=lambda c: str(c["start"]))
    if not cycles:
        return None
    t = T[lang]

    def end(c):
        return _d(c["start"]) + timedelta(days=int(c["length_days"])) if c.get("length_days") else None

    done = [c for c in cycles if end(c)]
    ended_since = [c for c in done if since < end(c) <= ref]
    before = [int(c["length_days"]) for c in done if end(c) <= since][-6:]
    started_since = [c for c in cycles if _d(c["start"]) > since and not c.get("length_days")]
    parts, ev = [], []
    if ended_since:
        lens = [int(c["length_days"]) for c in ended_since]
        unit = "أيام" if lang == "ar" and len(lens) == 1 and 3 <= lens[0] <= 10 else "يوماً"
        parts.append(t["cycles_ended"].format(since=_join(lens, lang), unit=unit))
        if len(before) > 1:
            parts.append(t["cycles_before"].format(lo=min(before), hi=max(before)))
        elif before:
            parts.append(t["cycles_before_one"].format(lo=before[0]))
        if before and max(lens) > max(before):
            parts.append(t["longest"].format(n=max(lens)))
        if before and min(lens) < min(before):
            parts.append(t["shortest"].format(n=min(lens)))
        for c in ended_since:
            ev += _start_logs(bundle, c["start"])
    for c in started_since:
        parts.append(t["period_started"].format(date=_day(c["start"], lang)))
        ev += _start_logs(bundle, c["start"])
    if not parts:
        last = cycles[-1]
        parts.append(t["no_period"].format(date=_day(last["start"], lang)))
        ev += _start_logs(bundle, last["start"])
    values = {
        "since": [int(c["length_days"]) for c in ended_since],
        "before": before,
        "median_since": statistics.median([int(c["length_days"]) for c in ended_since]) if ended_since else None,
        "median_before": statistics.median(before) if before else None,
    }
    return _line("cycle", "cycle", " ".join(parts), [_entry(e, lang) for e in ev], values=values)


def _pain_line(bundle: dict, since: date, ref: date, lang: str) -> dict | None:
    logs = bundle["daily_logs"]
    after = [lg for lg in logs if since < _d(lg["date"]) <= ref]
    if not after:
        return None
    prior = [lg for lg in logs if since - timedelta(days=PAIN_BEFORE_DAYS) <= _d(lg["date"]) <= since]
    t = T[lang]
    worst = max(after, key=lambda lg: (lg.get("pain") or 0, str(lg["date"])))
    worst_before = max((lg.get("pain") or 0 for lg in prior), default=None)
    impact = [lg for lg in after if lg.get("impact") in ("missed work or study", "stayed in bed")]
    if not (worst.get("pain") or 0):
        if not worst_before and not impact:
            return None
        parts, ev = [t["pain_none"]], []
    else:
        parts = [t["pain_since"].format(pain=worst["pain"], date=_day(worst["date"], lang))]
        ev = [worst]
    if worst_before is not None and prior:
        parts.append(t["pain_before"].format(pain=worst_before))
    if impact:
        n = cp._ar_n(len(impact), *cp.DAYS_AR) if lang == "ar" else _days_en(len(impact))
        parts.append(t["impact"].format(n=n))
        ev += [lg for lg in impact if lg is not worst]
    values = {"max_since": worst.get("pain") or 0, "max_before": worst_before, "impact_days_since": len(impact)}
    return _line("pain", "pain", " ".join(parts), [_entry(e, lang) for e in ev], values=values)


def _lab_lines(bundle: dict, since: date, ref: date, lang: str) -> list[dict]:
    t = T[lang]
    out = []
    for lab in bundle["labs"]:
        if not (since < _d(lab["date"]) <= ref):
            continue
        value = f"{lab['value']} {lab.get('unit') or ''}".strip()
        lo, hi = lab.get("ref_low"), lab.get("ref_high")
        day = _day(lab["date"], lang)
        if lo is None and hi is None:
            text = t["lab_no_range"].format(test=lab["test"], value=value, date=day)
        else:
            where = {"H": "above", "L": "below"}.get(lab.get("flag") or "", "within")
            text = t["lab"].format(test=lab["test"], value=value, date=day, where=t[where].format(range=_range(lo, hi)))
        ev = [{"entry_id": lab["id"], "date": str(lab["date"]), "text": f"{lab['test']}: {value} ({day})"}]
        out.append(_line(f"lab:{lab['id']}", "lab", text, ev, status=lab.get("flag") or None))
    return out


def _care_lines(gaps: list[dict], cards: list[dict], since: date, lang: str) -> list[dict]:
    t = T[lang]
    by_rule = {c["observation_id"]: c for c in cards}
    out = []
    for g in gaps:
        en, ar = CARE_STEP.get(g["type"], (g["type"].replace("_", " "), g["type"].replace("_", " ")))
        step = ar if lang == "ar" else en
        updated = _local_date(g.get("updated_at"))
        if g["status"] == "closed":
            if not updated or updated <= since:
                continue
            status, text = "done", t["care_done"].format(step=step)
        elif g["status"] == "in_progress":
            status, text = "booked", t["care_booked"].format(step=step)
        elif g.get("due_date"):
            status, text = "due", t["care_due_by"].format(step=step, date=_day(g["due_date"], lang))
        else:
            status, text = "due", t["care_due"].format(step=step)
        card = by_rule.get(g.get("rule_id") or "")
        ev = list(card.get("why_we_noticed", [])) if card else []
        out.append(
            _line(
                f"care:{g['type']}",
                "care_step",
                text,
                ev,
                status=status,
                rule_id=g.get("rule_id"),
                sources=card.get("sources", []) if card else [],
                due_date=str(g["due_date"]) if g.get("due_date") else None,
            )
        )
    return out


def _question_lines(cards: list[dict], crisis: bool) -> list[dict]:
    _, shown = views.display_cards(cards, crisis)
    out, seen = [], set()
    for c in shown:
        for q in c.get("questions_for_doctor", []):
            if q in seen or len(out) >= 5:
                continue
            seen.add(q)
            out.append(
                _line(
                    f"question:{len(out)}",
                    "question",
                    q,
                    list(c.get("why_we_noticed", []))[:3],
                    rule_id=c["observation_id"],
                    sources=c.get("sources", []),
                )
            )
    return out


def _red_flag_lines(cards: list[dict], crisis: bool, lang: str, audience: str) -> list[dict]:
    flags, _ = views.display_cards(cards, crisis)
    out = []
    for c in flags:
        rid = c["observation_id"]
        if audience == "clinician":  # clinician voice: what and when; her own screens carry the 998 action
            text = f"{cp.clinician_title(rid, c['title'])}. {cp.detail(rid, {}, {}, lang, c.get('entry_date'))}"
        else:  # the rule's own urgent message (it starts with the action and 998), never reworded
            text = c["summary"]
        out.append(
            _line(
                f"red_flag:{rid}",
                "red_flag",
                text.strip(),
                list(c.get("why_we_noticed", [])),
                status="urgent",
                rule_id=rid,
                sources=c.get("sources", []),
            )
        )
    return out


# ---------------- model rewording + verifier ----------------
REWORD_SYSTEM = """You reword short lines of a pre-visit summary for a women's health record app. Rules:
- Keep every fact, number and date exactly. Add NO new fact, number, condition, cause or advice.
- Never diagnose. Never write "you have <condition>", "diagnosis of", percentages, chances or probabilities.
- Plain, calm English at a grade 7 reading level. Short sentences. Keep each line's id.
Return JSON: {"lines": [{"id": "...", "text": "..."}]}"""
REWORDABLE = {"pattern", "cycle", "pain", "lab", "care_step"}


def _facts(line: dict) -> list[str]:
    return [line["text"], line.get("title", ""), line.get("explains", ""), *[e["text"] for e in line["evidence"]]]


def _reword(lines: list[dict], names: list[str], ref: date) -> tuple[str, int]:
    """One model call for the whole brief. Returns (writer, dropped sentences). The template stays on any failure."""
    llm = get_llm()
    if llm.name == "none":
        return "template", 0
    todo = [ln for ln in lines if ln["kind"] in REWORDABLE]
    if not todo:
        return "template", 0
    user = redact(
        json.dumps({"lines": [{"id": ln["id"], "text": ln["text"]} for ln in todo]}, ensure_ascii=False), names, ref
    )
    out = llm.complete_json(REWORD_SYSTEM, user, 1500)
    if not out or not isinstance(out.get("lines"), list):
        return "template", 0
    by_id = {ln["id"]: ln for ln in todo}
    dropped, used = 0, False
    for item in out["lines"]:
        if not isinstance(item, dict) or item.get("id") not in by_id or not isinstance(item.get("text"), str):
            continue
        line = by_id[item["id"]]
        sents = [s for s in _SENT.split(item["text"].strip()) if s]
        if violations(item["text"]):  # diagnostic wording anywhere: keep the whole template line
            dropped += len(sents)
            continue
        keep = [s for s in sents if supported(s, _facts(line)) and not violations(s)]
        dropped += len(sents) - len(keep)
        if keep:
            line["text"] = " ".join(keep)
            line["written_by"] = llm.name
            used = True
    return (llm.name if used else "template"), dropped


# ---------------- the brief ----------------
def build_brief(
    bundle: dict,
    cards: list[dict],
    crisis: bool,
    visit: dict,
    gaps: list[dict],
    ref: date,
    lang: str = "en",
    audience: str = "patient",
) -> dict:
    since = visit["date"]
    lines = [
        *_red_flag_lines(cards, crisis, lang, audience),
        *_pattern_lines(bundle, cards, crisis, since, ref, lang, audience),
        *[x for x in (_cycle_line(bundle, since, ref, lang), _pain_line(bundle, since, ref, lang)) if x],
        *_lab_lines(bundle, since, ref, lang),
        *_care_lines(gaps, cards, since, lang),
        *_question_lines(cards, crisis),
    ]
    ai_on = bool(bundle.get("ai_ok", False))
    written_by, dropped = "template", 0
    if ai_on and lang == "en":  # her AI switch first: off means no text of hers reaches a model
        written_by, dropped = _reword(lines, [bundle["profile"].get("alias", "")], ref)
    for ln in lines:  # last line of defence (never shown: every template line passes the guard)
        ln.pop("title", None), ln.pop("explains", None)
        if violations(ln["text"]):
            ln["text"] = ""
    lines = [ln for ln in lines if ln["text"]]
    return {
        "since": since.isoformat(),
        "since_basis": visit["basis"],
        "ref_date": ref.isoformat(),
        "lang": lang,
        "audience": audience,
        "crisis": crisis,
        "ai_on": ai_on,
        "written_by": written_by,
        "dropped_sentences": dropped,
        "lines": lines,
    }
