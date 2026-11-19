"""The assistant's record lane and next-step lane (section 7; G2: Krishna, 19 Nov 2026). "The model narrates, code
computes."

Record lane: a question about her own data ("how long were my last cycles?") is answered by CODE from her entries. Each
line carries the facts code computed and dated chips that open the day in her calendar. A model, when her AI switch is on
and one is configured, may only reword a line whose numbers code fixed: the verifier keeps a reworded line only when it
has exactly the same numbers, no new judging word and no diagnostic wording; otherwise the code's own sentence stays.
Lab values and blood-pressure readings are never reworded: they are shown as printed, with the lab's own range, and
never interpreted (no "low", "high" or "normal").

Next-step lane: "what should I do next?" turns her current red flags, patterns and due care steps into a short list.
Red flags come first, with their own 998 message. Each pattern or care step comes with its questions for the doctor and a
care-navigator draft for her clinic (app/agents/navigator.py), which she approves or discards. Nothing is sent.

Arabic strings: AR-REVIEW (docs/AR_REVIEW.md)."""

from __future__ import annotations

import json
import re
from datetime import date, timedelta

from app.agents import copy as cp
from app.agents.copy import DAYS_AR, _ar_n, _fmt_day
from app.ai.guards import violations
from app.ai.redact import redact
from app.config import get_settings
from app.rag.kb import sources as kb_sources
from app.services import postnatal

# The severe-pain line uses the same 7 out of 10 as the severe-pain pattern (severe_pain_cycles_6 in
# app/rules/features.py, docs/03). Code counts; nothing here decides a pattern.
SEVERE_PAIN = 7
DEFAULT_WINDOW_DAYS = 90  # the window the rules use for pain and impact days (pain_impact_days_90)
MAX_CHIPS = 8
REWORDABLE = {"cycles", "last_period", "pain", "impact"}  # labs, readings and care steps are never reworded
TOPICS = ("cycles", "last_period", "pain", "impact", "labs", "bp", "postnatal")

_AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")
_NUM = re.compile(r"\d+(?:\.\d+)?")


def _d(x) -> date:
    return x if isinstance(x, date) else date.fromisoformat(str(x)[:10])


def _day(x, lang: str, year: bool = False) -> str:
    return _fmt_day(str(x)[:10], lang, year)


def _num(v) -> str:
    """A value as printed: 8.0 is printed 8, 13.3 stays 13.3, text stays text."""
    if isinstance(v, float):
        return f"{v:g}"
    return str(v)


def _list(nums: list, lang: str) -> str:
    s = [str(n) for n in nums]
    if len(s) == 1:
        return s[0]
    return (" و".join(s)) if lang == "ar" else ", ".join(s[:-1]) + " and " + s[-1]


def _ar_days_after(n) -> str:
    """The Arabic noun after a number that ends a list: 3-10 take the plural, 11 or more the singular. AR-REVIEW"""
    k = int(n)
    return "أيام" if 3 <= k % 100 <= 10 else "يوماً"


def _ar_count(n: int, one: str, two: str, few: str, many: str) -> str:
    return _ar_n(n, one, two, few, many)


def _en_days(n: int) -> str:
    return "1 day" if n == 1 else f"{n} days"


def _chip(e: dict, lang: str, text: str | None = None) -> dict:
    return {"entry_id": str(e["id"]), "date": str(e["date"])[:10], "text": text or cp.entry_text(e, lang)}


def _line(lid: str, text: str, evidence: list[dict] | None = None, facts: list | None = None) -> dict:
    ev = evidence or []
    return {
        "id": lid,
        "text": text,
        "evidence": ev[:MAX_CHIPS],
        "evidence_total": len(ev),
        "facts": [str(f) for f in (facts or [])],
    }


def clean(text: str) -> str:
    """The assistant's folding (lower case, no diacritics, one Arabic letter per family), with Western digits."""
    from app.agents.assistant import _clean

    return _clean((text or "").translate(_AR_DIGITS))


# ---------------- the time window a question asks about ----------------
_EN_NUM = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "nine": 9, "twelve": 12, "a": 1}
_UNIT = {"day": 1, "week": 7, "month": 30, "year": 365}


def window(q: str) -> int | None:
    """Days back from today the question asks about (90 by default); None for her whole record."""
    return asked_window(q)[0]


def asked_window(q: str) -> tuple[int | None, bool]:
    """(days back from today, whether the question named the window). None days: her whole record."""
    t = clean(q)
    if re.search(
        r"\b(ever|in total|altogether|so far|all time|whole record)\b|منذ البدايه|طوال|كل السجل|من البدايه", t
    ):
        return None, True
    m = re.search(
        r"\b(?:last|past|previous) (\d+|one|two|three|four|five|six|nine|twelve|a)? ?(day|week|month|year)s?\b", t
    )
    if m:
        n = int(m.group(1)) if (m.group(1) or "").isdigit() else _EN_NUM.get(m.group(1) or "", 1)
        return max(1, min(n * _UNIT[m.group(2)], 366)), True
    m = re.search(r"\bthis (year|month|week)\b", t)
    if m:
        return {"year": 365, "month": 30, "week": 7}[m.group(1)], True
    m = re.search(r"(?:اخر|خلال|في) (\d+) (يوم|ايام|اسبوع|اسابيع|شهر|اشهر|شهور|سنه|سنوات)", t)
    if m:
        unit = m.group(2)
        mult = 1 if unit in ("يوم", "ايام") else 7 if unit.startswith("اسب") else 365 if unit.startswith("سن") else 30
        return max(1, min(int(m.group(1)) * mult, 366)), True
    for words, days in (
        (r"(اخر|خلال) (ثلاث|ثلاثه) (اشهر|شهور)", 90),
        (r"(اخر|خلال) شهرين", 60),
        (r"(اخر|خلال) (سته|ست) (اشهر|شهور)", 180),
        (r"(اخر|خلال) (اسبوعين)", 14),
        (r"(اخر|خلال) (سنه|السنه)|هذه السنه|هالسنه", 365),
        (r"(اخر|خلال) (شهر|الشهر)|هذا الشهر|هالشهر", 30),
        (r"(اخر|خلال) (اسبوع|الاسبوع)|هذا الاسبوع", 7),
    ):
        if re.search(words, t):
            return days, True
    return DEFAULT_WINDOW_DAYS, False


def _in_window(logs: list[dict], days: int | None, ref: date) -> list[dict]:
    lo = None if days is None else ref - timedelta(days=days)
    return [lg for lg in logs if (lo is None or _d(lg["date"]) >= lo) and _d(lg["date"]) <= ref]


def _window_phrase(days: int | None, logs: list[dict], ref: date, lang: str) -> str:
    if days is None:
        first = _day(logs[0]["date"], lang, True) if logs else _day(ref, lang, True)
        return f"منذ أول إدخال لكِ في {first}" if lang == "ar" else f"Since your first entry on {first}"
    since = _day(ref - timedelta(days=days), lang)
    if lang == "ar":
        return f"في آخر {_ar_n(days, *DAYS_AR)} (منذ {since})"
    return f"In the last {_en_days(days)} (since {since})"


# ---------------- lab names ----------------
LABS = {  # code -> words in a question (EN and Arabic, after folding)
    "FERR": r"ferritin|iron stores?|فيريتين|فيرتين|الفريتين|مخزون الحديد",
    "HGB": r"ha?emoglobin|\bhb\b|\bhgb\b|هيموجلوبين|هيموغلوبين|الهيموجلوبين|الهيموغلوبين|خضاب|نسبه الدم|الهيموقلوبين",
    "TSH": r"\btsh\b|thyroid|الغده الدرقيه|الدرقيه",
    "TESTO": r"testosterone|تستوستيرون|التستوستيرون",
    "AMH": r"\bamh\b|anti-?mullerian|مخزون المبيض",
    "PRL": r"prolactin|برولاكتين|البرولاكتين",
    "OGTT2H": r"\bogtt\b|glucose tolerance|تحمل الجلوكوز|تحمل السكر",
    "HBA1C": r"hba1c|\ba1c\b|السكر التراكمي|التراكمي",
    "FPG": r"fasting (blood )?(glucose|sugar)|السكر الصائم|سكر صائم|سكر الصيام",
    "ABO": r"blood (group|type)|فصيله الدم",
    "US_PELVIS": r"ultrasound|\bscan\b|السونار|الالتراساوند|الموجات فوق الصوتيه",
}
_GLUCOSE = r"\bglucose\b|\bsugar\b|السكر|سكر"


def asked_labs(q: str) -> list[str]:
    t = clean(q)
    codes = [code for code, pat in LABS.items() if re.search(pat, t)]
    if not codes and re.search(_GLUCOSE, t):
        codes = ["OGTT2H", "FPG", "HBA1C"]
    return codes


def _range(lab: dict) -> str | None:
    lo, hi, unit = lab.get("ref_low"), lab.get("ref_high"), (lab.get("unit") or "").strip()
    if lo is None and hi is None:
        return None
    r = (
        f"{_num(lo)}–{_num(hi)}"
        if lo is not None and hi is not None
        else f"≤ {_num(hi)}"
        if hi is not None
        else f"≥ {_num(lo)}"
    )
    return f"{r} {unit}".strip()


# ---------------- the answers, one per topic ----------------
def _cycles(b: dict, q: str, lang: str, ref: date) -> list[dict]:
    cycles = sorted(b.get("cycles", []), key=lambda c: str(c["start"]))
    by_date = {}
    for lg in b.get("daily_logs", []):
        if lg.get("flow", "none") != "none":
            by_date.setdefault(str(lg["date"])[:10], lg)
    done = [c for c in cycles if c.get("length_days")][-6:]
    if not done:
        text = (
            "لا توجد في سجلّكِ دورة مكتملة بعد. سجّلي أول يوم من كل دورة لتظهر أطوال دوراتكِ."
            if lang == "ar"
            else "Your record has no complete cycle yet. Log the first day of each period to see your cycle lengths."
        )
        return [_line("cycles", text)]
    lens = [int(c["length_days"]) for c in done]
    chips = []
    for c in done:
        start = str(c["start"])[:10]
        lg = by_date.get(start)
        label = (
            f"{_day(start, lang)} · دورة طولها {int(c['length_days'])} {_ar_days_after(c['length_days'])}"
            if lang == "ar"
            else f"{_day(start, lang)} · cycle of {int(c['length_days'])} days"
        )
        chips.append({"entry_id": str(lg["id"]) if lg else f"cycle-{start}", "date": start, "text": label})
    n = len(lens)
    if lang == "ar":
        if n == 1:
            first = f"كان طول آخر دورة مكتملة في سجلّكِ {lens[0]} {_ar_days_after(lens[0])}."
        else:
            which = "آخر دورتين مكتملتين" if n == 2 else f"آخر {n} دورات مكتملة"
            first = f"أطوال {which} في سجلّكِ: {_list(lens, 'ar')} {_ar_days_after(lens[-1])}."
    else:
        first = (
            f"Your last complete cycle was {lens[0]} days long."
            if n == 1
            else f"Your last {n} complete cycles were {_list(lens, 'en')} days long."
        )
    out = [_line("cycles", first, chips, lens)]
    current = cycles[-1]
    if not current.get("length_days"):
        start = str(current["start"])[:10]
        lg = by_date.get(start)
        text = (
            f"بدأت دورتكِ الحالية في {_day(start, lang, True)}."
            if lang == "ar"
            else f"Your current cycle started on {_day(start, lang, True)}."
        )
        out.append(_line("current", text, [_chip(lg, lang)] if lg else [], [start]))
    return out


def _last_period(b: dict, q: str, lang: str, ref: date) -> list[dict]:
    cycles = sorted(b.get("cycles", []), key=lambda c: str(c["start"]))
    if not cycles:
        text = (
            "لا توجد دورة مسجّلة في سجلّكِ بعد. يمكنكِ تسجيل أول يوم من دورتكِ في صفحة التسجيل."
            if lang == "ar"
            else "Your record has no period logged yet. You can log the first day of a period on the Log screen."
        )
        return [_line("last_period", text)]
    last = cycles[-1]
    start = str(last["start"])[:10]
    bleed = int(last.get("bleed_days") or 1)
    ago = (ref - _d(start)).days
    days = [
        lg
        for lg in b.get("daily_logs", [])
        if lg.get("flow", "none") != "none" and 0 <= (_d(lg["date"]) - _d(start)).days < bleed
    ]
    chips = [_chip(lg, lang) for lg in sorted(days, key=lambda x: str(x["date"]))]
    if lang == "ar":
        first = f"بدأت آخر دورة مسجّلة لديكِ في {_day(start, lang, True)}، وسجّلتِ فيها {_ar_n(bleed, *DAYS_AR)} من النزول."
        second = "كان ذلك اليوم." if ago == 0 else f"كان ذلك قبل {_ar_n(ago, *DAYS_AR)}."
    else:
        first = (
            f"Your last logged period started on {_day(start, lang, True)}, with {_en_days(bleed)} of bleeding logged."
        )
        second = "That was today." if ago == 0 else f"That was {_en_days(ago)} ago."
    return [_line("last_period", first, chips, [start, bleed]), _line("ago", second, [], [ago])]


def _pain(b: dict, q: str, lang: str, ref: date) -> list[dict]:
    logs = sorted(b.get("daily_logs", []), key=lambda x: str(x["date"]))
    days = window(q)
    span = _in_window(logs, days, ref)
    when = _window_phrase(days, logs, ref, lang)
    pain = [lg for lg in span if (lg.get("pain") or 0) >= 1]
    severe = [lg for lg in pain if (lg.get("pain") or 0) >= SEVERE_PAIN]
    if not pain:
        text = f"{when}، لم تسجّلي أي ألم." if lang == "ar" else f"{when}, you logged no pain."
        return [_line("pain", text, [], [days or 0])]
    top = max(pain, key=lambda lg: (lg.get("pain") or 0, str(lg["date"])))
    chips = [_chip(lg, lang) for lg in (severe or sorted(pain, key=lambda lg: -(lg.get("pain") or 0))[:MAX_CHIPS])]
    chips.sort(key=lambda c: c["date"])
    if lang == "ar":
        first = (
            f"{when}، سجّلتِ ألماً بدرجة {SEVERE_PAIN} من 10 أو أكثر في {_ar_n(len(severe), *DAYS_AR)}."
            if severe
            else f"{when}، لم تسجّلي ألماً بدرجة {SEVERE_PAIN} من 10 أو أكثر."
        )
        second = f"وسجّلتِ ألماً بأي درجة في {_ar_n(len(pain), *DAYS_AR)}، وكان أعلاه {top['pain']} من 10 في {_day(top['date'], lang)}."
    else:
        first = (
            f"{when}, you logged pain of {SEVERE_PAIN} out of 10 or more on {_en_days(len(severe))}."
            if severe
            else f"{when}, you logged no pain of {SEVERE_PAIN} out of 10 or more."
        )
        second = (
            f"You logged pain of any level on {_en_days(len(pain))}, and the highest was {top['pain']} out of 10"
            f" on {_day(top['date'], lang)}."
        )
    facts = [days or 0, SEVERE_PAIN, len(severe), len(pain), top["pain"], str(top["date"])[:10]]
    return [_line("pain", first, chips, facts), _line("pain_any", second, [_chip(top, lang)], facts)]


_IMPACT_EN = {"missed work or study": "missed work or study", "stayed in bed": "stayed in bed"}
_IMPACT_AR = {"missed work or study": "غبتُ عن العمل أو الدراسة", "stayed in bed": "بقيتُ في السرير"}


def _impact(b: dict, q: str, lang: str, ref: date) -> list[dict]:
    logs = sorted(b.get("daily_logs", []), key=lambda x: str(x["date"]))
    days = window(q)
    span = _in_window(logs, days, ref)
    when = _window_phrase(days, logs, ref, lang)
    t = clean(q)
    asked_bed = bool(re.search(r"\bbed\b|السرير|الفراش", t))
    out = []
    for kind in ("missed work or study", "stayed in bed"):
        hits = [lg for lg in span if lg.get("impact") == kind]
        if kind == "stayed in bed" and not hits and not asked_bed:
            continue
        chips = [_chip(lg, lang) for lg in hits]
        lead = when if not out else ""  # the window is said once, in the first line
        if lang == "ar":
            label = _IMPACT_AR[kind]
            said = f"سجّلتِ «{label}» في {_ar_n(len(hits), *DAYS_AR)}" if hits else f"لم تسجّلي «{label}» في أي يوم"
            text = f"{lead}، {said}." if lead else f"و{said}."
        else:
            label = _IMPACT_EN[kind]
            said = f"you logged “{label}” on {_en_days(len(hits))}" if hits else f"you did not log “{label}” on any day"
            text = f"{lead}, {said}." if lead else f"{said[0].upper()}{said[1:]}."
        out.append(_line(kind.split()[0], text, chips[-MAX_CHIPS:], [days or 0, len(hits)]))
    named = asked_window(q)[1]
    every = [lg for lg in logs if lg.get("impact") == "missed work or study"]
    if not named and logs and len(every) != len([lg for lg in span if lg.get("impact") == "missed work or study"]):
        first = _day(logs[0]["date"], lang, True)
        text = (
            f"وفي سجلّكِ كله منذ {first}: {_ar_n(len(every), *DAYS_AR)}."
            if lang == "ar"
            else f"In your whole record, since {first}: {_en_days(len(every))}."
        )
        out.append(_line("missed_all", text, [], [len(every), str(logs[0]["date"])[:10]]))
    return out


def _labs(b: dict, q: str, lang: str, ref: date) -> list[dict]:
    labs = sorted(b.get("labs", []), key=lambda x: str(x["date"]))  # stable: the record's own order within a day
    codes = asked_labs(q)
    chosen = labs if not codes else [lab for lab in labs if lab.get("code") in codes]
    if not chosen:
        have = ", ".join(dict.fromkeys(lab["test"] for lab in labs))
        if lang == "ar":
            text = "لا توجد في سجلّكِ نتيجة مؤكدة لهذا الفحص." + (f" الفحوص المؤكدة في سجلّكِ: {have}." if have else "")
        else:
            text = "Your record has no confirmed result for that test." + (
                f" The confirmed results in your record are: {have}." if have else ""
            )
        return [_line("labs_none", text)]
    by_code: dict[str, list[dict]] = {}
    for lab in chosen:
        by_code.setdefault(lab.get("code") or lab["test"], []).append(lab)
    out = []
    for code, items in by_code.items():
        for lab in items[::-1][:3]:  # newest first, up to 3 results of one test
            value = f"{_num(lab['value'])} {(lab.get('unit') or '').strip()}".strip()
            rng = _range(lab)
            day = _day(lab["date"], lang, True)
            if lang == "ar":
                text = f"فحص {lab['test']}: {value} في {day}. " + (  # starts in Arabic, so the line reads right to left
                    f"المدى المطبوع من المختبر مع النتيجة: {rng}." if rng else "لم يُطبع مع هذه النتيجة مدى من المختبر."
                )
            else:
                text = f"{lab['test']}: {value} on {day}. " + (
                    f"The lab's own range printed with it: {rng}." if rng else "No range was printed with this result."
                )
            lid = str(lab.get("id") or f"lab-{code}-{lab['date']}")
            chip = {
                "entry_id": lid,
                "date": str(lab["date"])[:10],
                "text": f"{_day(lab['date'], lang)} · {lab['test']} {value}",
            }
            out.append(_line(f"lab:{lid}", text, [chip], [lab["value"], lab.get("ref_low"), lab.get("ref_high")]))
    close = (
        "اسألي طبيبتكِ عمّا تعنيه هذه القيم لكِ، وأحضري هذه القائمة معكِ."
        if lang == "ar"
        else "Your doctor can tell you what these values mean for you; bring this list."
    )
    return [*out, _line("labs_close", close)]


def _bp(b: dict, q: str, lang: str, ref: date) -> list[dict]:
    rs = sorted(b.get("bp_readings") or [], key=lambda r: (str(r["date"]), str(r.get("time") or "")))
    if not rs:
        text = (
            "لا توجد قراءات لضغط الدم في سجلّكِ. يمكنكِ تسجيل قراءة في صفحة التسجيل أثناء الحمل وخلال 12 أسبوعاً بعد الولادة."
            if lang == "ar"
            else "Your record has no blood pressure readings. You can log one on the Log screen while pregnant and for 12 weeks after a birth."
        )
        return [_line("bp_none", text)]
    last = rs[-1]
    at = f" {last['time']}" if last.get("time") else ""
    day = _day(last["date"], lang, True)
    if lang == "ar":
        first = f"آخر قراءة لضغط الدم في سجلّكِ: {last['systolic']}/{last['diastolic']} ملم زئبقي في {day}{at}."
        n = len(rs)
        count = _ar_n(n, "قراءة واحدة", "قراءتين", "قراءات", "قراءة")
        second = f"سجّلتِ {count} بين {_day(rs[0]['date'], lang)} و{_day(last['date'], lang)}." if n > 1 else ""
    else:
        first = f"Your latest blood pressure reading is {last['systolic']}/{last['diastolic']} mmHg, on {day}{at}."
        n = len(rs)
        second = (
            f"You logged {n} readings between {_day(rs[0]['date'], lang)} and {_day(last['date'], lang)}."
            if n > 1
            else ""
        )
    chips = [_chip(r, lang) for r in rs[::-1][:MAX_CHIPS]]
    out = [_line("bp", first, [chips[0]], [last["systolic"], last["diastolic"]])]
    if second:
        out.append(_line("bp_all", second, chips, [n]))
    return out


_STEP = {  # postnatal step names (the web's postnatal.steps, shortened). AR-REVIEW
    "teleconsult": ("check-in call or home visit", "مكالمة المتابعة أو الزيارة المنزلية"),
    "visit_2w": ("visit 7–14 days after you left hospital", "الزيارة بعد 7 إلى 14 يوماً من خروجكِ من المستشفى"),
    "mood": ("mood check", "فحص المزاج"),
    "visit_6w": ("6-week visit", "زيارة الأسبوع السادس"),
    "glucose_test": ("glucose test after gestational diabetes", "فحص السكر بعد سكري الحمل"),
}


def _postnatal(b: dict, q: str, lang: str, ref: date) -> tuple[list[dict], list[str]]:
    p = postnatal.pathway(b, ref)
    if not p:
        text = (
            "لا توجد ولادة في سجلّكِ خلال آخر 12 أسبوعاً، لذلك لا توجد خطوات ما بعد الولادة لعرضها."
            if lang == "ar"
            else "Your record has no birth in the last 12 weeks, so there are no postnatal steps to show."
        )
        return [_line("postnatal_none", text)], []
    ar = lang == "ar"
    name = lambda s: _STEP[s["id"]][1 if ar else 0]  # noqa: E731
    steps = p["steps"]
    done = [s for s in steps if s["status"] == "done"]
    left = [s for s in steps if s["status"] != "done"]
    births = [e for e in b.get("events", []) if e.get("type") == "delivery"]
    birth_chip = [_chip(births[-1], lang)] if births else []
    if ar:
        total = _ar_n(len(steps), "خطوة واحدة", "خطوتين", "خطوات", "خطوة")
        n_done = _ar_n(len(done), "خطوة واحدة", "خطوتان", "خطوات", "خطوة")
        first = f"خطة ما بعد الولادة في سجلّكِ فيها {total}، " + (
            f"والمسجّل منها كمكتمل {n_done}." if done else "ولم تُسجَّل أي خطوة منها كمكتملة بعد."
        )
    else:
        n_done = "none is" if not done else f"{len(done)} {'is' if len(done) == 1 else 'are'}"
        first = f"Your postnatal plan has {len(steps)} steps, and {n_done} recorded as done."
    out = [_line("postnatal", first, birth_chip, [len(steps), len(done)])]
    unrecorded_visit = False
    for s in left:
        a, z = _day(s["from"], lang), _day(s["to"], lang)
        if s["status"] == "due":
            text = f"مستحقة الآن: {name(s)}، حتى {z}." if ar else f"Due now: {name(s)}, by {z}."
        elif s["status"] == "upcoming":
            text = f"قادمة: {name(s)}، من {a} إلى {z}." if ar else f"Coming up: {name(s)}, from {a} to {z}."
        else:
            unrecorded_visit = unrecorded_visit or s["recordable"]
            text = (
                f"لم تُسجَّل: {name(s)} (كانت بين {a} و{z})."
                if ar
                else f"Not recorded: {name(s)} (its window was {a} to {z})."
            )
        out.append(_line(f"step:{s['id']}", text, [], [s["from"], s["to"]]))
    if unrecorded_visit:
        out.append(
            _line(
                "postnatal_record",
                "إذا أجريتِ زيارة أو مكالمة لم تُسجَّل، يمكنكِ تسجيلها من الصفحة الرئيسية."
                if ar
                else "If you had a visit or call that is not recorded, you can record it on Home.",
            )
        )
    srcs = list(dict.fromkeys(src for s in steps for src in s["sources"]))
    return out, srcs


OTHER_PERSON = {
    "en": "I can only answer from your own entries, so I can't open anyone else's record.",
    "ar": "أستطيع الإجابة من إدخالاتكِ أنتِ فقط، لذلك لا أستطيع فتح سجلّ أي شخص آخر.",
}


def answer_record(bundle: dict, topic: str, q: str, lang: str, ref: date) -> dict:
    """Her own numbers, computed by code. Returns {"topic", "lines", "sources"}."""
    srcs: list[str] = []
    if topic == "other_person":
        lines = [_line("other_person", OTHER_PERSON[lang])]
    elif topic == "postnatal":
        lines, srcs = _postnatal(bundle, q, lang, ref)
    else:
        fn = {
            "cycles": _cycles,
            "last_period": _last_period,
            "pain": _pain,
            "impact": _impact,
            "labs": _labs,
            "bp": _bp,
        }[topic]
        lines = fn(bundle, q, lang, ref)
    for ln in lines:
        ln["text"] = re.sub(r"\s+", " ", ln["text"]).strip()
    return {"topic": topic, "lines": [ln for ln in lines if ln["text"]], "sources": srcs}


# ---------------- the model narrates: rewording and its verifier ----------------
REWORD_SYSTEM = """You reword short lines about a woman's own health record for a women's health app. Rules:
- Keep every number and date exactly as written. Do not add, drop or change any number or date.
- Add NO new fact, judgement, condition, cause or advice. Never say a value is normal, low, high, regular or irregular.
- Never diagnose. Plain, warm, grade 7, the same language as the line, speaking to her as "you". Keep each line's id.
Return JSON: {"lines": [{"id": "...", "text": "..."}]}"""

# Judging words a reworded line may not add (a model narrates; it does not assess). Folded like the question.
_JUDGING = re.compile(
    r"\b(normal|abnormal|irregular|regular|healthy|unhealthy|worr\w*|concern\w*|alarm\w*|danger\w*|serious|"
    r"low|high|elevated|raised|reduced|risk\w*|sign of|symptom of|condition|disease|disorder|pcos|endometriosis|"
    r"diabet\w*|an(a)?emi\w*|deficien\w*|infertil\w*|too (long|short|many|few)|should|must|need to|fine|ok(ay)?)\b|"
    r"طبيعي|غير منتظم|منتظم|خطير|خطر|مقلق|منخفض|مرتفع|علامه|مرض|متلازمه|نقص|فقر|يجب|لازم",
    re.I,
)


def numbers(text: str) -> list[str]:
    return sorted(_NUM.findall((text or "").translate(_AR_DIGITS)))


def verify(original: str, reworded: str) -> str | None:
    """None if the reworded line may be shown, else the reason it was rejected."""
    if not reworded.strip():
        return "empty"
    if numbers(reworded) != numbers(original):
        return "a number not in the computed facts"
    if violations(reworded):
        return "diagnostic wording"
    before = {m.group(0).lower() for m in _JUDGING.finditer(clean(original))}
    if {m.group(0).lower() for m in _JUDGING.finditer(clean(reworded))} - before:
        return "a judging word code did not write"
    if len(reworded) > 2 * len(original) + 60:
        return "too long"
    return None


def reword(lines: list[dict], topic: str, lang: str, llm, names: list[str] | None) -> tuple[list[dict], dict]:
    """One model call for the whole answer. Returns (lines, {"asked", "kept", "rejected": [reasons]})."""
    stats: dict = {"asked": 0, "kept": 0, "rejected": []}
    todo = [ln for ln in lines if topic in REWORDABLE and ln["id"] != "other_person"]
    if not todo:
        return lines, stats
    payload = {"lines": [{"id": ln["id"], "text": redact(ln["text"], names or [])} for ln in todo]}
    stats["asked"] = len(todo)
    try:
        res = llm.complete_json(
            REWORD_SYSTEM,
            f"Reword these lines in {'Arabic' if lang == 'ar' else 'English'}.\n"
            + json.dumps(payload, ensure_ascii=False),
            600,
        )
    except Exception:  # noqa: BLE001 (any failure keeps the code's own sentences)
        res = None
    if not isinstance(res, dict) or not isinstance(res.get("lines"), list):
        return lines, stats
    new = {str(x.get("id")): str(x.get("text", "")).strip() for x in res["lines"] if isinstance(x, dict)}
    out = []
    for ln in lines:
        text = new.get(ln["id"])
        if ln in todo and text is not None and text != ln["text"]:
            why = verify(ln["text"], text)
            if why is None:
                stats["kept"] += 1
                ln = {**ln, "text": text, "reworded": True}
            else:
                stats["rejected"].append(why)
        out.append(ln)
    return out, stats


# ---------------- (c) next step ----------------
NEXT_INTRO = {
    "en": "Here is a short list from your record for your next appointment. Approve what you want to keep. Nothing is sent.",
    "ar": "هذه قائمة قصيرة من سجلّكِ لموعدكِ القادم. وافقي على ما تريدين الاحتفاظ به. لا يُرسَل أي شيء.",
}
NEXT_URGENT = {
    "en": "Start with the urgent step. Call 998 if this is happening now.",
    "ar": "ابدئي بالخطوة العاجلة. اتصلي بالرقم 998 إذا كان هذا يحدث الآن.",
}
NOTHING = {
    "en": "No pattern in your entries needs discussing right now, and no care step is due. Keep logging, and bring your report to your next visit.",
    "ar": "لا يوجد في إدخالاتكِ نمط يحتاج نقاشاً الآن، ولا توجد خطوة رعاية مستحقة. استمري في التسجيل، وأحضري تقريركِ إلى زيارتكِ القادمة.",
}
MAX_ITEMS = 3


def next_steps(bundle: dict, lang: str, ref: date) -> dict:
    """Her red flags, patterns and due care steps as a short list. Code only: template cards, no model."""
    from app.agents.pipeline import _template_card
    from app.rules.engine import evaluate
    from app.services import views

    ev = evaluate(bundle, ref, get_settings().red_flag_window_days)  # the same red-flag window as Home
    cards = [_template_card(h, ev, lang, bundle) for h in ev.all_hits]
    flags, obs = views.display_cards(cards, ev.crisis)
    srcs = kb_sources()
    items = []
    for c in flags:  # red flags first, with the rule's own urgent message (it starts with 998), never reworded
        items.append(
            {
                "id": f"red_flag:{c['observation_id']}",
                "kind": "red_flag",
                "rule_id": c["observation_id"],
                "title": c["title"],
                "text": c["summary"],
                "evidence": c["why_we_noticed"][:4],
                "questions": [],
                "sources": c["sources"],
                "draft": None,
            }
        )
    for c in [] if ev.crisis else obs[:MAX_ITEMS]:  # the crisis path: support first, no pattern and no draft
        kind = "care_step" if c["observation_id"].startswith("CARE_") else "pattern"
        detail = cp.detail(c["observation_id"], c.get("values") or {}, ev.features.values, lang) or c["summary"]
        items.append(
            {
                "id": f"{kind}:{c['observation_id']}",
                "kind": kind,
                "rule_id": c["observation_id"],
                "title": c["title"],
                "text": detail,
                "evidence": c["why_we_noticed"][:4],
                "questions": c["questions_for_doctor"][:3],
                "sources": c["sources"],
                "draft": None,  # the API attaches her care-navigator draft (draft only; she approves)
            }
        )
    path = None if ev.crisis else postnatal.pathway(bundle, ref)
    for s in (path or {}).get("steps", []):
        if (
            s["status"] != "due"
            or s["id"] == "glucose_test"
            and any(i["rule_id"] == "CARE_POSTPARTUM_GLUCOSE_TEST" for i in items)
        ):
            continue
        nm = _STEP[s["id"]][1 if lang == "ar" else 0]
        z = _day(s["to"], lang)
        items.append(
            {
                "id": f"postnatal:{s['id']}",
                "kind": "postnatal_step",
                "rule_id": None,
                "title": nm[0].upper() + nm[1:] if lang == "en" else nm,
                "text": f"مستحقة الآن، حتى {z}." if lang == "ar" else f"Due now, by {z}.",
                "evidence": [],
                "questions": [],
                "sources": [
                    {"source_id": x, "title": srcs[x].title, "url": srcs[x].url} for x in s["sources"] if x in srcs
                ],
                "draft": None,
            }
        )
    lead = NEXT_URGENT[lang] if flags else NEXT_INTRO[lang] if items else NOTHING[lang]
    return {"crisis": ev.crisis, "items": items, "lead": lead, "evaluation": ev, "red_flags": bool(flags)}
