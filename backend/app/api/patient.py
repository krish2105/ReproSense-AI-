"""Patient endpoints (/v1/me, logs, insights, timeline, documents, privacy, navigator, questionnaires, FHIR)."""

from __future__ import annotations

import json
import re
from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.agents import navigator
from app.agents.pipeline import cards_for, persist, run
from app.config import get_settings
from app.db import SYSTEM, Actor, session
from app.rules.engine import evaluate, load_rules
from app.security import audit
from app.security.auth import require
from app.security.crypto import decrypt, encrypt
from app.services import documents as docs
from app.services import fhir, views
from app.services.patient_data import apply_period_log, load_bundle

router = APIRouter(prefix="/v1", tags=["patient"])
patient = require("patient")
FLOWS = ("none", "spotting", "light", "medium", "heavy")
SYMPTOMS = {
    "cramps",
    "bloating",
    "fatigue",
    "headache",
    "breast tenderness",
    "low mood",
    "back pain",
    "cravings",
    "acne",
    "excess hair growth",
    "scalp hair thinning",
    "flooding",
    "pain with bowel movements",
    "pain passing urine",
    "dizziness",
    "fainting",
    "fever",
    "hot flushes",
    "night sweats",
    "nausea",
    "anxiety",
    "insomnia",
    "sudden severe pain",
    "severe abdominal pain",
    "reduced baby movements",
    "severe headache",
    "vision changes",
    "bleeding",
}
IMPACTS = ("none", "reduced activity", "missed work or study", "stayed in bed")
SITES = {"lower abdomen", "upper abdomen", "left pelvis", "right pelvis", "lower back"}


def ref() -> date:
    return get_settings().demo_ref_date


def _bundle(cur, actor: Actor) -> dict:
    b = load_bundle(cur, actor.user_id)
    if not b:
        raise HTTPException(404, "Record not found")
    return b


def _refresh(actor: Actor) -> dict:
    """Re-run the pipeline after new data and store observations/care gaps (system actor writes care gaps)."""
    with session(SYSTEM) as cur:
        b = load_bundle(cur, actor.user_id)
        out = run(b)
        persist(cur, actor.user_id, out)
    return out


# ---------- profile + home ----------
@router.get("/me")
def me(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute(
            "SELECT id, alias, age, age_range, region, language, life_stage, pregnant, pregnancy_weeks, discreet,"
            " onboarded, trying_to_conceive, ttc_months, is_synthetic FROM profiles WHERE id=%s",
            (actor.user_id,),
        )
        return cur.fetchone()


class Settings(BaseModel):
    discreet: bool | None = None
    language: Literal["en", "ar"] | None = None
    onboarded: bool | None = None


@router.patch("/me")
def update_me(body: Settings, actor: Actor = Depends(patient)):
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if fields:
        with session(actor) as cur:
            cur.execute(
                "UPDATE profiles SET " + ", ".join(f"{k}=%s" for k in fields) + " WHERE id=%s",
                (*fields.values(), actor.user_id),
            )
            audit.record(cur, actor, "update_settings", actor.user_id, "profile", fields)
    return {"ok": True, **fields}


@router.get("/me/home")
def home(lang: Literal["en", "ar"] = "en", actor: Actor = Depends(patient)):
    with session(actor) as cur:
        b = _bundle(cur, actor)
        cur.execute(
            "SELECT type, status, due_date FROM care_gaps WHERE profile_id=%s AND status <> 'closed'", (actor.user_id,)
        )
        gaps = cur.fetchall()
        cur.execute(
            "SELECT id, rule_id, status, created_at FROM navigator_drafts WHERE profile_id=%s ORDER BY id DESC LIMIT 5",
            (actor.user_id,),
        )
        drafts = cur.fetchall()
    ev = evaluate(b, ref(), get_settings().red_flag_window_days)
    cards, _trace, crisis = cards_for(b, lang)
    flags, obs = views.display_cards(cards, crisis)
    last = b["daily_logs"][-1] if b["daily_logs"] else None
    today = next((lg for lg in b["daily_logs"] if lg["date"] == ref().isoformat()), None)
    return {
        "profile": {
            k: b["profile"][k]
            for k in (
                "id",
                "alias",
                "age",
                "life_stage",
                "pregnancy_weeks",
                "region",
                "language",
                "discreet",
                "trying_to_conceive",
                "ttc_months",
            )
        },
        "ref_date": ref().isoformat(),
        "status": views.cycle_status(b, ev, ref()),
        "day_pills": views.day_pills(b, ref()),
        "red_flags": flags,
        "crisis": crisis,
        "observations": obs[:3],
        "recommendations": views.recommendations(
            obs, lang, crisis=crisis, has_flags=bool(flags), stage=b["profile"].get("life_stage")
        ),
        "care_gaps": gaps,
        "navigator_drafts": drafts,
        "last_log": {**last, "label": views.entry_label(last, lang)} if last else None,
        "today_mood": today.get("mood") if today else None,
        "record_strength": ev.features.values.get("record_strength"),
        "days_logged": views.days_logged(b),
    }


@router.get("/timeline")
def get_timeline(months: int = 12, actor: Actor = Depends(patient)):
    if months not in (3, 6, 12):
        raise HTTPException(422, "months must be 3, 6 or 12")
    with session(actor) as cur:
        b = _bundle(cur, actor)
    return views.timeline(b, ref(), months)


@router.get("/analytics")
def get_analytics(months: int = 6, actor: Actor = Depends(patient)):
    if months not in (3, 6, 12):
        raise HTTPException(422, "months must be 3, 6 or 12")
    with session(actor) as cur:
        b = _bundle(cur, actor)
    return views.analytics(b, evaluate(b, ref()), ref(), months)


# ---------- logging ----------
_Count = Annotated[int, Field(ge=0, le=60)]


class PbacItems(BaseModel):
    """The bleeding chart (PBAC, Higham 1990): how many pads, tampons and clots of each kind. Anything else is a 422."""

    model_config = ConfigDict(extra="forbid")
    pads: dict[Literal["light", "moderate", "soaked"], _Count] = Field(default_factory=dict)
    tampons: dict[Literal["light", "moderate", "soaked"], _Count] = Field(default_factory=dict)
    clots: dict[Literal["small", "large"], _Count] = Field(default_factory=dict)


class LogIn(BaseModel):
    date: date
    flow: Literal["none", "spotting", "light", "medium", "heavy"] = "none"
    pain: int = Field(0, ge=0, le=10)
    pain_sites: list[str] = []
    symptoms: list[str] = []
    impact: Literal["none", "reduced activity", "missed work or study", "stayed in bed"] = "none"
    mood: str | None = Field(None, max_length=20)
    sleep_h: float | None = Field(None, ge=0, le=24)
    pbac_items: PbacItems | None = None
    note: str = Field("", max_length=1000)

    @field_validator("symptoms")
    @classmethod
    def known_symptoms(cls, v: list[str]) -> list[str]:
        bad = [s for s in v if s not in SYMPTOMS]
        if bad:
            raise ValueError(f"unknown symptoms: {bad}")
        return list(dict.fromkeys(v))

    @field_validator("pain_sites")
    @classmethod
    def known_sites(cls, v: list[str]) -> list[str]:
        if [s for s in v if s not in SITES]:
            raise ValueError("unknown pain site")
        return list(dict.fromkeys(v))


def pbac_score(items: dict | None) -> int:
    """Higham 1990: pads 1/5/20, tampons 1/5/10, clots small 1 / large 5."""
    if not items:
        return 0
    w = {
        "pads": {"light": 1, "moderate": 5, "soaked": 20},
        "tampons": {"light": 1, "moderate": 5, "soaked": 10},
        "clots": {"small": 1, "large": 5},
    }
    return sum(
        w[g][k] * int(n) for g, d in items.items() if g in w for k, n in (d or {}).items() if k in w[g] and int(n) >= 0
    )


@router.post("/logs")
def create_log(body: LogIn, actor: Actor = Depends(patient)):
    if body.date > ref():
        raise HTTPException(422, "You can't log a future day.")
    items = body.pbac_items.model_dump() if body.pbac_items else None
    score = pbac_score(items)
    with session(actor) as cur:
        cur.execute(
            "SELECT id FROM daily_logs WHERE profile_id=%s AND date=%s AND source='app'", (actor.user_id, body.date)
        )
        existing = cur.fetchone()
        lid = existing["id"] if existing else f"{actor.user_id}-u{body.date.strftime('%Y%m%d')}"
        cur.execute(
            "INSERT INTO daily_logs (id, profile_id, date, flow, pain, pain_sites, symptoms, impact, mood, sleep_h, pbac, pbac_items,"
            " note_enc, source) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'app') ON CONFLICT (id) DO UPDATE SET flow=EXCLUDED.flow,"
            " pain=EXCLUDED.pain, pain_sites=EXCLUDED.pain_sites, symptoms=EXCLUDED.symptoms, impact=EXCLUDED.impact, mood=COALESCE(EXCLUDED.mood, daily_logs.mood),"
            " sleep_h=EXCLUDED.sleep_h, pbac=EXCLUDED.pbac, pbac_items=EXCLUDED.pbac_items, note_enc=EXCLUDED.note_enc",
            (
                lid,
                actor.user_id,
                body.date,
                body.flow,
                body.pain,
                body.pain_sites,
                body.symptoms,
                body.impact,
                body.mood,
                body.sleep_h,
                score,
                json.dumps(items) if items else None,
                encrypt(body.note),
            ),
        )
        if body.flow not in ("none", "spotting"):
            apply_period_log(cur, actor.user_id, body.date)
        audit.record(cur, actor, "create_log", actor.user_id, lid)
    out = _refresh(actor)
    ev = out["evaluation"]
    crisis = bool(out.get("crisis"))
    return {
        "id": lid,
        "pbac": score,
        "red_flags": views.display_cards(out["cards"], crisis)[0],
        "crisis": crisis,
        "patterns": [h.rule_id for h in ev.observations],
    }


class ParseIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=600)


NL = [  # natural-language symptom capture (deterministic; shown for confirmation before saving)
    (r"cramp", "symptoms", "cramps"),
    (r"bloat", "symptoms", "bloating"),
    (r"tired|exhaust|fatigue", "symptoms", "fatigue"),
    (r"headache", "symptoms", "headache"),
    (r"acne|spots|pimple", "symptoms", "acne"),
    (r"hair (growth|on my (chin|face))|facial hair", "symptoms", "excess hair growth"),
    (r"flood|soak|leak(ed)? through", "symptoms", "flooding"),
    (r"dizz|light ?headed", "symptoms", "dizziness"),
    (r"faint", "symptoms", "fainting"),
    (r"poo|bowel|toilet hurt|pain when i (go|went)", "symptoms", "pain with bowel movements"),
    (r"hot flush|hot flash", "symptoms", "hot flushes"),
    (r"night sweat", "symptoms", "night sweats"),
    (r"low mood|sad|down|teary", "symptoms", "low mood"),
    (r"back (pain|ache)", "symptoms", "back pain"),
    (r"fever|temperature", "symptoms", "fever"),
    (r"nause|sick to my stomach", "symptoms", "nausea"),
    (r"missed (work|school|uni|class)|called in sick|couldn'?t go to (work|school)", "impact", "missed work or study"),
    (r"stayed in bed|couldn'?t get out of bed", "impact", "stayed in bed"),
    (r"heavy (flow|period|bleed)|bleeding a lot", "flow", "heavy"),
    (r"spotting", "flow", "spotting"),
    (r"light (flow|period)", "flow", "light"),
    (r"تقلصات|مغص", "symptoms", "cramps"),
    (r"انتفاخ", "symptoms", "bloating"),
    (r"تعب|إرهاق|ارهاق", "symptoms", "fatigue"),
    (r"صداع", "symptoms", "headache"),
    (r"حب الشباب|حبوب", "symptoms", "acne"),
    (r"دوخة|دوار", "symptoms", "dizziness"),
    (r"غياب عن العمل|لم أذهب إلى العمل|غبت عن", "impact", "missed work or study"),
    (r"نزيف غزير|غزيرة", "flow", "heavy"),
    (r"هبات ساخنة|هبّات", "symptoms", "hot flushes"),
    (r"ظهري|الظهر", "symptoms", "back pain"),
]
WORD_NUM = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
}


@router.post("/logs/parse")
def parse_note(body: ParseIn, actor: Actor = Depends(patient)):
    t = body.text.lower()
    out: dict = {"symptoms": [], "flow": None, "impact": None, "pain": None, "matched": []}
    for pat, field, value in NL:
        if re.search(pat, t):
            out["matched"].append(value)
            if field == "symptoms":
                out["symptoms"].append(value)
            else:
                out[field] = value
    m = re.search(r"(\d{1,2})\s*(?:/|out of)\s*10", t) or re.search(r"pain (?:of |at |was )?(\d{1,2})\b", t)
    if m and 0 <= int(m.group(1)) <= 10:
        out["pain"] = int(m.group(1))
    else:
        m = re.search(r"\b(" + "|".join(WORD_NUM) + r") out of ten\b", t)
        if m:
            out["pain"] = WORD_NUM[m.group(1)]
    if out["pain"] is None and re.search(r"so bad|unbearable|worst|agony|excruciating|شديد جدا|لا يحتمل", t):
        out["pain"] = 8
        out["matched"].append("pain about 8/10 (from 'so bad'): please adjust")
    out["symptoms"] = list(dict.fromkeys(out["symptoms"]))
    out["confirm"] = "Check these fields, change anything that's wrong, then save."
    return out


class MoodIn(BaseModel):
    mood: Literal["calm", "tired", "in pain", "low", "energetic"]


@router.post("/mood")
def set_mood(body: MoodIn, actor: Actor = Depends(patient)):
    d = ref()
    with session(actor) as cur:
        cur.execute(
            "UPDATE daily_logs SET mood=%s WHERE profile_id=%s AND date=%s RETURNING id", (body.mood, actor.user_id, d)
        )
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO daily_logs (id, profile_id, date, mood, source) VALUES (%s,%s,%s,%s,'app')",
                (f"{actor.user_id}-u{d.strftime('%Y%m%d')}", actor.user_id, d, body.mood),
            )
    return {"ok": True, "mood": body.mood}


# ---------- insights ----------
@router.get("/insights")
def insights(lang: Literal["en", "ar"] = "en", actor: Actor = Depends(patient)):
    with session(actor) as cur:
        b = _bundle(cur, actor)
        audit.record(cur, actor, "view_insights", actor.user_id, "insights")
    out = run(b, lang=lang)
    ev = out["evaluation"]
    crisis = bool(out.get("crisis"))
    flags, obs = views.display_cards(out["cards"], crisis)  # crisis: no self-harm or mood card, other red flags stay
    return {
        "cards": flags + obs,
        "crisis": crisis,
        "trace": out["trace"],
        "record_strength": ev.features.values.get("record_strength"),
        "cycles_logged": ev.features.values.get("cycles_logged"),
        "change_point": ev.features.values.get("cycle_change_point"),
        "days_logged": views.days_logged(b),
        "rules_version": load_rules().version,
    }


# ---------- questionnaires ----------
class EPDSIn(BaseModel):
    answers: list[int] = Field(..., min_length=10, max_length=10)

    @field_validator("answers")
    @classmethod
    def range_0_3(cls, v):
        if any(a not in (0, 1, 2, 3) for a in v):
            raise ValueError("each EPDS answer is 0-3")
        return v


@router.post("/questionnaires/epds")
def epds(body: EPDSIn, actor: Actor = Depends(patient)):
    total = sum(body.answers)
    eid = f"{actor.user_id}-epds-{ref().isoformat()}"
    with session(actor) as cur:
        cur.execute(
            "INSERT INTO events (id, profile_id, type, date, details) VALUES (%s,%s,'questionnaire',%s,%s)"
            " ON CONFLICT (id) DO UPDATE SET details=EXCLUDED.details",
            (
                eid,
                actor.user_id,
                ref(),
                json.dumps(
                    {
                        "tool": "EPDS",
                        "total": total,
                        "item10": body.answers[9],
                        "note": "self-completed in app; synthetic",
                    }
                ),
            ),
        )
        audit.record(cur, actor, "questionnaire_epds", actor.user_id, eid)
    out = _refresh(actor)
    crisis = bool(out.get("crisis"))
    # crisis path: never show a score or a pattern card
    return {
        "crisis": crisis,
        "total": None if crisis else total,
        "cards": views.display_cards(out["cards"], crisis)[0]
        if crisis
        else [c for c in out["cards"] if c["observation_id"] == views.MOOD_RULE],
    }


# ---------- documents (Document AI) ----------
@router.get("/documents")
def list_documents(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute(
            "SELECT id, filename, mime, status, extraction, created_at FROM documents WHERE profile_id=%s ORDER BY id DESC",
            (actor.user_id,),
        )
        return cur.fetchall()


@router.post("/documents")
async def upload_document(file: UploadFile = File(...), actor: Actor = Depends(patient)):
    data = await file.read(10 * 1024 * 1024 + 1)
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(413, "Files up to 10 MB, please.")
    name = (file.filename or "upload").lower()
    if name.endswith(".pdf") or data[:4] == b"%PDF":
        text, mime = docs.pdf_text(data), "application/pdf"
    elif name.endswith((".txt", ".text")):
        text, mime = data.decode("utf-8", errors="replace"), "text/plain"
    elif name.endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(
            415, "Photo reading (OCR) is not in this build yet. Please upload the PDF or text version of the report."
        )
    else:
        raise HTTPException(415, "Please upload a PDF, PNG, JPG or TXT lab report.")
    ext = docs.extract(text)
    with session(actor) as cur:
        cur.execute(
            "INSERT INTO documents (profile_id, filename, mime, text_enc, status, extraction) VALUES (%s,%s,%s,%s,'extracted',%s)"
            " RETURNING id",
            (actor.user_id, file.filename, mime, encrypt(text), json.dumps(ext)),
        )
        did = cur.fetchone()["id"]
        audit.record(cur, actor, "upload_document", actor.user_id, f"document:{did}")
    return {"id": did, **ext}


def _confirmed_flag(value: str, lo, hi, printed: str) -> str:
    """H or L from the value she confirms, never the flag sent back from extraction time: she may have corrected a
    misread value, and the doctor PDF prints this flag. Without a range, keep the flag the lab printed."""
    s = value.strip()
    cmp = s[0] if s[:1] in ("<", ">") else ""
    try:
        n = float(s.lstrip("<>"))
        lo = None if lo in (None, "") else float(lo)
        hi = None if hi in (None, "") else float(hi)
    except (TypeError, ValueError):
        return printed or ""
    if lo is None and hi is None:
        return printed or ""
    return docs._flag(cmp, n, lo, hi)


class ConfirmIn(BaseModel):
    rows: list[dict]


@router.post("/documents/{doc_id}/confirm")
def confirm_document(doc_id: int, body: ConfirmIn, actor: Actor = Depends(patient)):
    saved = 0
    with session(actor) as cur:
        cur.execute("SELECT id FROM documents WHERE id=%s", (doc_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Document not found")
        for r in body.rows:
            if not r.get("code") or r.get("value") in (None, "") or not r.get("date"):
                continue
            v = r["value"]
            num = float(v) if isinstance(v, (int, float)) or re.fullmatch(r"-?\d+(\.\d+)?", str(v)) else None
            flag = _confirmed_flag(str(v), r.get("ref_low"), r.get("ref_high"), r.get("flag", ""))
            cur.execute(
                "INSERT INTO lab_results (profile_id, code, test, value, value_num, unit, ref_low, ref_high, flag, date,"
                " source_doc_id, confirmed) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true)",
                (
                    actor.user_id,
                    r["code"],
                    r.get("test", r["code"]),
                    str(v),
                    num,
                    r.get("unit"),
                    r.get("ref_low"),
                    r.get("ref_high"),
                    flag,
                    r["date"],
                    doc_id,
                ),
            )
            saved += 1
        cur.execute("UPDATE documents SET status='confirmed' WHERE id=%s", (doc_id,))
        audit.record(cur, actor, "confirm_document", actor.user_id, f"document:{doc_id}", {"rows": saved})
    out = _refresh(actor)
    return {"saved": saved, "patterns": [h.rule_id for h in out["evaluation"].all_hits]}


# ---------- privacy ----------
@router.get("/privacy")
def privacy(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute(
            "SELECT c.purpose, c.granted, c.granted_at, c.revoked_at, c.clinic_id, cl.name AS clinic_name FROM consents c"
            " LEFT JOIN clinics cl ON cl.id=c.clinic_id WHERE c.profile_id=%s ORDER BY c.purpose",
            (actor.user_id,),
        )
        consents = cur.fetchall()
        cur.execute(
            "SELECT c.id, c.name FROM profiles p JOIN clinics c ON c.id = p.clinic_id WHERE p.id=%s", (actor.user_id,)
        )
        home_clinic = cur.fetchone()  # the clinic a share would go to, named before she allows it
        cur.execute(
            "SELECT actor_role, actor_id, action, target, at FROM audit_log WHERE subject_id=%s ORDER BY id DESC LIMIT 50",
            (actor.user_id,),
        )
        log = cur.fetchall()
        counts = {}
        for t in ("daily_logs", "events", "lab_results", "documents", "reports", "shares"):
            cur.execute(f"SELECT count(*) AS n FROM {t} WHERE profile_id=%s", (actor.user_id,))  # noqa: S608 (fixed table list)
            counts[t] = cur.fetchone()["n"]
    return {
        "consents": consents,
        "home_clinic": home_clinic,
        "audit": log,
        "stored": counts,
        "promises": [
            "We never sell or advertise on health data.",
            "Notes and documents are encrypted (AES-256-GCM).",
            "Clinics see your record only while you share it, and every view is logged here.",
            "AI calls receive de-identified data only (no names, relative dates).",
        ],
    }


class ConsentIn(BaseModel):
    purpose: Literal["care_share", "assistant", "research"]
    granted: bool


@router.patch("/consents")
def set_consent(body: ConsentIn, actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute(
            "SELECT id FROM consents WHERE profile_id=%s AND purpose=%s ORDER BY id DESC LIMIT 1",
            (actor.user_id, body.purpose),
        )
        row = cur.fetchone()
        clinic = None
        if body.purpose == "care_share":  # share only with her own clinic, never a default one
            cur.execute("SELECT clinic_id FROM profiles WHERE id=%s", (actor.user_id,))
            clinic = (cur.fetchone() or {}).get("clinic_id")
            if body.granted and not clinic:
                raise HTTPException(
                    422, "Your record is not linked to a clinic yet. Join from your clinic's invite to share with it."
                )
        if row:
            cur.execute(
                "UPDATE consents SET granted=%s, revoked_at=CASE WHEN %s THEN NULL ELSE now() END,"
                " granted_at=CASE WHEN %s THEN now() ELSE granted_at END, clinic_id=coalesce(%s, clinic_id) WHERE id=%s",
                (body.granted, body.granted, body.granted, clinic, row["id"]),
            )
        else:
            cur.execute(
                "INSERT INTO consents (profile_id, purpose, clinic_id, granted) VALUES (%s,%s,%s,%s)",
                (actor.user_id, body.purpose, clinic, body.granted),
            )
        audit.record(cur, actor, "consent_" + ("grant" if body.granted else "revoke"), actor.user_id, body.purpose)
    _refresh(actor)
    return {"ok": True}


@router.get("/export")
def export(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        b = _bundle(cur, actor)
        audit.record(cur, actor, "export_data", actor.user_id, "export")
    return {"exported_on": ref().isoformat(), "notice": "All data in this demo is fictional.", **b}


@router.get("/fhir")
def fhir_export(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        b = _bundle(cur, actor)
        audit.record(cur, actor, "export_fhir", actor.user_id, "fhir")
    cards, _, _ = cards_for(b, "en")
    bundle = fhir.bundle_for(b, cards)
    return {"bundle": bundle, "validation_errors": fhir.validate(bundle)}


@router.delete("/me/data")
def delete_my_data(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        for t in (
            "navigator_drafts",
            "shares",
            "reports",
            "observations",
            "care_gaps",
            "lab_results",
            "documents",
            "events",
            "daily_logs",
            "cycles",
        ):
            cur.execute(f"DELETE FROM {t} WHERE profile_id=%s", (actor.user_id,))  # noqa: S608 (fixed table list)
        audit.record(cur, actor, "delete_data", actor.user_id, "all")
    return {"ok": True, "message": "Your entries were deleted. In the demo, 'Reset demo data' on /demo restores them."}


# ---------- care navigator ----------
@router.get("/navigator")
def navigator_list(actor: Actor = Depends(patient)):
    with session(actor) as cur:
        b = _bundle(cur, actor)
        cur.execute("SELECT * FROM navigator_drafts WHERE profile_id=%s ORDER BY id DESC", (actor.user_id,))
        drafts = cur.fetchall()
    ev = evaluate(b, ref())
    return {"available": [{"rule_id": h.rule_id, "title": h.title} for h in ev.observations], "drafts": drafts}


class DraftIn(BaseModel):
    rule_id: str


@router.post("/navigator/drafts")
def navigator_draft(body: DraftIn, actor: Actor = Depends(patient)):
    with session(actor) as cur:
        b = _bundle(cur, actor)
        cur.execute("SELECT name FROM clinics WHERE id=%s", (b["profile"].get("clinic_id"),))
        row = cur.fetchone()
        ev = evaluate(b, ref())
        hit = next((h for h in ev.observations if h.rule_id == body.rule_id), None)
        if not hit:
            raise HTTPException(404, "That pattern is not in your record.")
        d = navigator.draft(hit, ev, row["name"] if row else "your clinic")
        cur.execute(
            "INSERT INTO navigator_drafts (profile_id, rule_id, draft) VALUES (%s,%s,%s) RETURNING *",
            (actor.user_id, body.rule_id, json.dumps(d, ensure_ascii=False)),
        )
        draft = cur.fetchone()
        audit.record(cur, actor, "navigator_draft", actor.user_id, f"draft:{draft['id']}")
    return draft


@router.post("/navigator/drafts/{draft_id}/{action}")
def navigator_decide(draft_id: int, action: Literal["approve", "discard"], actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute("SELECT * FROM navigator_drafts WHERE id=%s", (draft_id,))
        d = cur.fetchone()
        if not d:
            raise HTTPException(404, "Draft not found")
        if d["status"] != "draft":
            raise HTTPException(409, f"This draft is already {d['status']}.")
        status = "approved" if action == "approve" else "discarded"
        cur.execute(
            "UPDATE navigator_drafts SET status=%s, approved_at=CASE WHEN %s='approved' THEN now() END WHERE id=%s RETURNING *",
            (status, status, draft_id),
        )
        d = cur.fetchone()
        audit.record(cur, actor, f"navigator_{status}", actor.user_id, f"draft:{draft_id}")
    return {
        **d,
        "sent": False,
        "message": "Approved. Nothing was sent: copy the message or show it at the clinic desk."
        if status == "approved"
        else "Draft discarded.",
    }


@router.get("/documents/{doc_id}/text")
def document_text(doc_id: int, actor: Actor = Depends(patient)):
    with session(actor) as cur:
        cur.execute("SELECT text_enc FROM documents WHERE id=%s", (doc_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Document not found")
    return {"text": decrypt(row["text_enc"])}
