"""RAG assistant (EN/AR). Every answer cites the curated sources; diagnosis questions are refused politely;
urgent symptoms get 998 guidance first; thoughts of self-harm open the crisis message only.

Without an LLM the answer is extractive: the best-matching sentences from our own source summaries, each cited.
With an LLM, it may rephrase, but the verifier keeps only sentences supported by the retrieved passages."""

from __future__ import annotations

import json
import re
import time

from app.agents.pipeline import supported
from app.ai.guards import violations
from app.ai.llm import get_llm
from app.ai.redact import redact
from app.rag.embed import tokens
from app.rag.kb import sources
from app.rag.retrieve import query_terms, search

AR = re.compile(r"[؀-ۿ]")
CRISIS = [
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\bsuicid",
    r"\bharm(ing)? myself\b",
    r"\bhurt(ing)? myself\b",
    r"\bself[- ]harm\b",
    r"\bdon'?t want to (live|be alive)\b",
    "انتحار",
    "اقتل نفسي",
    "إيذاء نفسي",
    "ايذاء نفسي",
    "أؤذي نفسي",
    "اؤذي نفسي",
]
URGENT = [  # (pattern, message key)
    (
        r"(heav|soak|flood).{0,40}(dizz|faint|light ?headed|short of breath)|(dizz|faint).{0,40}(heav|soak|flood|bleed)",
        "bleed",
    ),
    (
        r"(pregnan).{0,60}(bleed|severe pain|headache|vision|baby.{0,20}(not moving|moving less|fewer movements))|"
        r"(bleed|severe pain|reduced movements|baby.{0,20}(not moving|moving less)).{0,60}pregnan",
        "pregnancy",
    ),
    (r"sudden.{0,20}severe.{0,20}pain|severe.{0,20}sudden.{0,20}pain|worst pain", "pain"),
    (
        r"((after|since) (giving )?birth|gave birth|given birth|had (my|a|the) baby|postpartum|delivered).{0,60}(fever|temperature|heavy bleed|bleeding heavily|severe headache)|"
        r"(fever|heavy bleed|severe headache).{0,60}(after (giving )?birth|gave birth|postpartum)",
        "postnatal",
    ),
    (r"(نزيف|نزف|غزير|غزار).{0,40}(دوخ|دوار|اغماء|إغماء)|(دوخ|دوار|اغماء|إغماء).{0,40}(نزيف|نزف|غزير|غزار)", "bleed"),
    (
        r"(حامل|الحمل).{0,60}(نزيف|ألم شديد|الم شديد|صداع|حركة الجنين)|(نزيف|حركة الجنين).{0,60}(حامل|الحمل)",
        "pregnancy",
    ),
    (r"ألم مفاجئ|الم مفاجئ", "pain"),
    (r"(ولدت|الولادة|انجبت|أنجبت).{0,40}(حرارة|حمى|نزيف غزير|صداع شديد)", "postnatal"),
]
URGENT_TEXT = {
    "en": {
        "bleed": "Call 998 or go to the nearest emergency department if this is happening now. Very heavy bleeding with dizziness or fainting needs urgent care.",
        "pregnancy": "Call 998 or go to your maternity unit now if this is happening. These signs in pregnancy need checking today.",
        "pain": "Call 998 or go to the nearest emergency department if this is happening now. Sudden, severe pain needs urgent care.",
        "postnatal": "Call 998 if this is happening now. After birth, a fever, very heavy bleeding or a severe headache needs urgent care.",
        "crisis": "You deserve support right now. Please call 998 or speak to a doctor today. You are not alone.",
    },
    "ar": {
        "bleed": "اتصلي بالرقم 998 أو توجهي إلى أقرب قسم طوارئ إذا كان هذا يحدث الآن. النزيف الغزير جداً مع الدوخة أو الإغماء يحتاج رعاية عاجلة.",
        "pregnancy": "اتصلي بالرقم 998 أو توجهي إلى وحدة الولادة الآن إذا كان هذا يحدث. هذه العلامات أثناء الحمل تحتاج فحصاً اليوم.",
        "pain": "اتصلي بالرقم 998 أو توجهي إلى أقرب قسم طوارئ إذا كان هذا يحدث الآن. الألم المفاجئ الشديد يحتاج رعاية عاجلة.",
        "postnatal": "اتصلي بالرقم 998 إذا كان هذا يحدث الآن. بعد الولادة، الحرارة أو النزيف الغزير أو الصداع الشديد يحتاج رعاية عاجلة.",
        "crisis": "أنتِ تستحقين الدعم الآن. اتصلي بالرقم 998 أو تحدثي مع طبيبة اليوم. لستِ وحدك.",
    },
}
URGENT_SOURCES = {
    "bleed": "nhs_heavy_periods",
    "pregnancy": "nhs_pregnancy_urgent",
    "pain": "nhs_pelvic_pain",
    "postnatal": "nice_ng194",
    "crisis": "nice_cg192",
}
DIAGNOSIS = [
    r"\bdo i have\b",
    r"\bhave i got\b",
    r"\bam i (infertile|sterile)\b",
    r"\bdiagnose\b",
    r"\bdiagnosis\b",
    r"\bwhat are my chances\b",
    r"\bmy chances\b",
    r"\bprobability\b",
    r"\bpercent(age)? chance\b",
    r"\bhow likely\b",
    r"\bis it (pcos|endometriosis|cancer|diabetes)\b",
    r"\bdo i suffer from\b",
    r"\bwhich (disease|condition) do i\b",
    r"هل (لدي|لدى|عندي|انا مصابة|أنا مصابة)",
    r"تشخيص",
    r"شخصيني|شخصني",
    r"ما نسبة|نسبة اصابتي|نسبة إصابتي",
    r"ما احتمال",
    r"ما هي فرص|ما فرص",
    r"هل أنا عقيم|هل انا عقيم",
]
REFUSAL = {
    "en": "I can't tell whether any condition is present, and I don't give chances or percentages. Only a doctor can assess that. Here is what our trusted sources say doctors look at, so you can ask about it:",
    "ar": "لا أستطيع أن أخبرك إن كانت لديك حالة مرضية، ولا أعطي نسباً أو احتمالات. الطبيب وحده يستطيع التقييم. هذا ما تقوله مصادرنا الموثوقة عمّا ينظر إليه الأطباء، لتسألي عنه:",
}
NOT_FOUND = {
    "en": "I could not find this in ReproSense's trusted sources, so I won't guess. Please ask your doctor, and bring your report.",
    "ar": "لم أجد إجابة لهذا في مصادر ReproSense الموثوقة، لذلك لن أخمّن. اسألي طبيبتك وأحضري تقريرك.",
}
_SENT = re.compile(r"(?<=[.!?؟])\s+")
SYSTEM = """You answer questions for a women's health app in {lang}. Use ONLY the numbered passages. Cite each sentence like [1].
Never diagnose, never give chances or percentages, never add facts that are not in the passages. Plain and kind, grade 7.
Return JSON: {{"sentences": [{{"text": "...", "cites": [1]}}]}}"""


def detect_lang(q: str) -> str:
    return "ar" if AR.search(q or "") else "en"


_DIAC = re.compile(r"[\u064B-\u0652\u0670\u0640]")


def _clean(text: str) -> str:
    return _DIAC.sub("", (text or "").lower())


def _any(patterns: list[str], text: str) -> bool:
    t = _clean(text)
    return any(re.search(p, t) for p in patterns)


def _urgent_kind(q: str) -> str | None:
    t = _clean(q)
    for pat, kind in URGENT:
        if re.search(pat, t):
            return kind
    return None


def _cite_list(ids: list[str]) -> list[dict]:
    s = sources()
    return [{"n": i + 1, "source_id": sid, "title": s[sid].title, "url": s[sid].url} for i, sid in enumerate(ids)]


def _extractive(q: str, passages, lang: str, max_sents: int = 3) -> tuple[list[dict], list[str]]:
    terms = query_terms(q)
    cands = []
    for rank, p in enumerate(passages):
        if p.lang != lang:
            continue
        for s in _SENT.split(p.text):
            words = set(tokens(s))
            overlap = len(terms & words)
            cands.append((overlap - 0.15 * rank, overlap, rank, s.strip(), p.source_id))
    cands.sort(key=lambda c: c[0], reverse=True)
    chosen = [c for c in cands if c[1] > 0][:max_sents]
    if not chosen:
        return [], []
    order = list(dict.fromkeys(c[4] for c in chosen))
    chosen.sort(key=lambda c: (order.index(c[4]), c[2]))
    return [{"text": c[3], "source_id": c[4]} for c in chosen], order


def answer(question: str, lang: str | None = None, names: list[str] | None = None) -> dict:
    t0 = time.perf_counter()
    q = (question or "").strip()[:600]
    lang = lang if lang in ("en", "ar") else detect_lang(q)
    trace = [{"agent": "intake", "detail": f"question in {'Arabic' if lang == 'ar' else 'English'}"}]
    out = {
        "question": q,
        "lang": lang,
        "answer": "",
        "sentences": [],
        "citations": [],
        "urgent": None,
        "crisis": False,
        "refused": False,
        "grounded": False,
        "trace": trace,
    }

    if _any(CRISIS, q):
        out.update(
            crisis=True,
            urgent={"kind": "crisis", "message": URGENT_TEXT[lang]["crisis"], "number": "998"},
            answer=URGENT_TEXT[lang]["crisis"],
            citations=_cite_list([URGENT_SOURCES["crisis"]]),
            grounded=True,
        )
        trace.append({"agent": "safety", "detail": "crisis path: support message only, no other content"})
        return out
    kind = _urgent_kind(q)
    if kind:
        out["urgent"] = {"kind": kind, "message": URGENT_TEXT[lang][kind], "number": "998"}
        trace.append({"agent": "safety", "detail": f"urgent guidance first ({kind})"})
    refused = _any(DIAGNOSIS, q)
    if refused:
        out["refused"] = True
        trace.append({"agent": "safety", "detail": "diagnosis or probability request: politely refused"})

    passages = search(q, k=6, lang=lang)
    trace.append(
        {"agent": "evidence", "detail": f"{len(passages)} passages from {len({p.source_id for p in passages})} sources"}
    )
    sents, order = _extractive(q, passages, lang, 2 if refused else 3)
    llm = get_llm()
    if llm.name != "none" and passages and not refused:
        numbered = [p for p in passages if p.lang == lang][:4] or passages[:4]
        ctx = "\n".join(f"[{i + 1}] {p.text}" for i, p in enumerate(numbered))
        res = llm.complete_json(
            SYSTEM.format(lang="Arabic" if lang == "ar" else "English"),
            f"Passages:\n{ctx}\n\nQuestion: {redact(q, names)}",
            900,
        )
        if res and isinstance(res.get("sentences"), list):
            kept = []
            for s in res["sentences"]:
                cites = [c for c in s.get("cites", []) if isinstance(c, int) and 1 <= c <= len(numbered)]
                text = str(s.get("text", "")).strip()
                if (
                    cites
                    and text
                    and not violations(text)
                    and supported(re.sub(r"\[\d+\]", "", text), [numbered[c - 1].text for c in cites])
                ):
                    kept.append(
                        {"text": re.sub(r"\s*\[\d+\]", "", text), "source_id": numbered[cites[0] - 1].source_id}
                    )
            dropped = len(res["sentences"]) - len(kept)
            trace.append({"agent": "verifier", "detail": f"{dropped} unsupported sentences removed"})
            if kept:
                sents, order = kept, list(dict.fromkeys(k["source_id"] for k in kept))
    if not sents:
        out["answer"] = (
            (out["urgent"]["message"] + " " if out["urgent"] else "")
            + (REFUSAL[lang] + " " if refused else "")
            + NOT_FOUND[lang]
        )
        if out["urgent"]:
            out["citations"] = _cite_list([URGENT_SOURCES[kind]])
            out["grounded"] = True
        trace.append({"agent": "writer", "detail": "no supporting passage: said so instead of guessing"})
        return out
    if out["urgent"]:
        order = list(dict.fromkeys([URGENT_SOURCES[kind], *order]))
    cites = _cite_list(order)
    num = {c["source_id"]: c["n"] for c in cites}
    out["sentences"] = [{"text": s["text"], "cite": num[s["source_id"]]} for s in sents]
    body = " ".join(f"{s['text']} [{num[s['source_id']]}]" for s in sents)
    prefix = (f"{out['urgent']['message']} [{num[URGENT_SOURCES[kind]]}] " if out["urgent"] else "") + (
        REFUSAL[lang] + " " if refused else ""
    )
    out["answer"] = prefix + body
    out["citations"] = cites
    out["grounded"] = all(
        supported(s["text"], [p.text for p in passages if p.source_id == s["source_id"]]) for s in sents
    )
    if violations(out["answer"]):  # last line of defence: never show diagnostic wording
        out.update(answer=NOT_FOUND[lang], sentences=[], grounded=False)
        trace.append({"agent": "guard", "detail": "blocked diagnostic wording"})
    trace.append(
        {
            "agent": "writer",
            "detail": f"{len(sents)} cited sentences ({'extractive' if llm.name == 'none' else llm.name})",
            "ms": round((time.perf_counter() - t0) * 1000, 1),
        }
    )
    return out


SUGGESTED = {
    "en": [
        "What is PCOS?",
        "When should I get a glucose test after gestational diabetes?",
        "What counts as a heavy period?",
        "How much folic acid should I take when trying to conceive?",
        "What does an EPDS score mean?",
    ],
    "ar": [
        "ما هي متلازمة تكيّس المبايض؟",
        "متى أحتاج فحص السكر بعد سكري الحمل؟",
        "متى تُعتبر الدورة غزيرة؟",
        "كم أحتاج من حمض الفوليك عند محاولة الحمل؟",
        "ما معنى نتيجة مقياس إدنبرة؟",
    ],
}


def dumps(x) -> str:
    return json.dumps(x, ensure_ascii=False)
