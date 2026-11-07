"""RAG assistant (EN/AR). Every answer cites the curated sources; diagnosis questions are refused politely;
urgent symptoms get 998 guidance first; thoughts of self-harm open the crisis message only.

Without an LLM the answer is extractive: the best-matching sentences from our own source summaries, each cited.
With an LLM, it may rephrase, but the verifier keeps only sentences supported by the retrieved passages."""

from __future__ import annotations

import json
import re
import time

from app.agents import safety
from app.agents.pipeline import supported
from app.ai.guards import violations
from app.ai.llm import get_llm
from app.ai.redact import redact
from app.rag.embed import normalise, tokens
from app.rag.kb import sources
from app.rag.retrieve import query_terms, search

AR = re.compile(r"[؀-ۿ]")
# Thoughts of self-harm or of harming the baby open the crisis message only (CLAUDE.md rule 5). Matching ignores case,
# Arabic diacritics and letter variants, and curly apostrophes (the iOS default), so "don’t" is "don't".
CRISIS = [
    r"\bkill(ing)? myself\b",
    r"\bend(ing)? (my|it) (own )?(life|all)\b",
    r"\b(take|taking) my (own )?life\b",
    r"\bsuicid",
    r"\b(harm|harming|hurt|hurting|cut|cutting) myself\b",
    r"\bself[- ]?harm",
    r"\b(do not|don'?t|dont) want to (live|be alive|be here( anymore)?|wake up|exist)\b",
    r"\b(want|wanted|wanting|wish) (to )?(die|be dead)\b",
    r"\bwish i (was|were) (dead|gone|never born)\b",
    r"\bbetter off (dead|without me)\b",
    r"\b(no (reason|point) (in |to )?(living|live|go on))\b",
    r"\b(life|it) (is|isn'?t|is not) (not )?worth living\b",
    r"\bthoughts? (of|about) (harming|hurting|killing|ending)\b",
    r"\b(kill|smother|drown)(ing)? (my|the|our) (baby|babies|child|newborn|son|daughter|infant)\b",
    "انتحار",
    "انتحر",
    "اقتل نفسي",
    "أقتل حالي",
    "إيذاء نفسي",
    "أؤذي نفسي",
    "أذية نفسي",
    "أذي نفسي",
    "أنهي حياتي",
    "إنهاء حياتي",
    "أريد أن أموت",
    "أريد الموت",
    "أتمنى الموت",
    "أتمنى أن أموت",
    "أبي أموت",
    "أبغى أموت",
    "ودي أموت",
    "لا أريد أن أعيش",
    "لا أريد العيش",
    "ما أبي أعيش",
    "ما أبغى أعيش",
    "لا أرغب في الحياة",
    "الحياة لا تستحق",
]
_PREG = r"(pregnan|weeks? (pregnant|along)|expecting|positive (pregnancy )?test)"
_POSTNATAL = (
    r"((after|since) (giving )?(the )?(birth|delivery|c-?section|caesarean|cesarean)|gave birth|given birth|"
    r"had (my|a|the) baby|postpartum|post-partum|delivered|c-?section|caesarean|cesarean|newborn)"
)
URGENT = [  # (pattern, message key). Each kind cites a knowledge-base source that lists the same signs.
    (
        r"(heav|soak|flood).{0,40}(dizz|faint|light ?headed|short of breath)|(dizz|faint).{0,40}(heav|soak|flood|bleed)",
        "bleed",
    ),
    (  # nhs_pregnancy_urgent, nhs_bleeding_pregnancy: bleeding or spotting, pain, waters, swelling, vision, fever, movements
        _PREG + r".{0,80}(bleed|spotting|severe pain|sharp pain|bad pain|pain (on|in) (one|my (left|right)) side|"
        r"one[- ]sided pain|cramp\w* (and|with) (bleed|spot)|headache|vision|blurr|swell\w* (face|hands|feet)|"
        r"(face|hands|feet).{0,15}swell|high (temperature|fever)|fever|waters?|fluid|leak|"
        r"baby.{0,20}(not moving|moving less|stopped moving|fewer movements|moved less))|"
        r"(bleed|spotting|severe pain|sharp pain|reduced movements|baby.{0,20}(not moving|moving less|stopped moving)).{0,80}"
        + _PREG,
        "pregnancy",
    ),
    (  # signs that only happen in pregnancy, without the word "pregnant"
        r"\b(my )?waters? (have |has )?(broke|broken|gone|burst)\b|\b(leaking|leak) (of )?(clear )?(fluid|water)\b|"
        r"\bbaby (is )?(not moving|moving less|stopped moving|hasn'?t moved)\b|\breduced (fetal|foetal|baby'?s?) movements?\b",
        "pregnancy",
    ),
    (r"sudden.{0,20}severe.{0,20}pain|severe.{0,20}sudden.{0,20}pain|worst pain", "pain"),
    (  # nice_ng194: fever, heavy bleeding, severe headache, chest pain or breathlessness, pain or swelling in one leg
        _POSTNATAL
        + r".{0,80}(fever|temperature|heavy bleed|bleeding heavily|soaking|severe headache|vision|chest pain|"
        r"pain in my chest|breathless|short(ness)? of breath|can'?t (catch my )?breathe?|calf|(one|my|left|right) leg|swollen leg)|"
        r"(fever|heavy bleed|severe headache|chest pain|breathless|short(ness)? of breath|calf|swollen leg).{0,80}"
        + _POSTNATAL,
        "postnatal",
    ),
    (r"(نزيف|نزف|غزير|غزار).{0,40}(دوخ|دوار|اغماء|إغماء)|(دوخ|دوار|اغماء|إغماء).{0,40}(نزيف|نزف|غزير|غزار)", "bleed"),
    (
        r"(حامل|الحمل|حملي).{0,60}(نزيف|نزول دم|تنقيط|دم خفيف|ألم شديد|ألم حاد|ألم في جهة|جهة واحدة|جانب واحد|صداع|"
        r"تشوش|زغللة|الرؤية|نظري|تورم|انتفاخ|حرارة|حمى|سوائل|ماء|حركة الجنين|الجنين لا يتحرك|ما يتحرك)|"
        r"(نزيف|نزول دم|تنقيط|حركة الجنين|ألم حاد).{0,60}(حامل|الحمل|حملي)",
        "pregnancy",
    ),
    (
        r"نزل ماء الرأس|نزول ماء الرأس|نزل الماء|انفجر كيس الماء|تمزق الأغشية|الجنين (لا يتحرك|ما يتحرك|قلت حركته)",
        "pregnancy",
    ),
    (r"ألم مفاجئ|الم مفاجئ", "pain"),
    (
        r"(ولدت|الولادة|انجبت|أنجبت|قيصرية|النفاس).{0,60}(حرارة|حمى|نزيف غزير|صداع شديد|ألم في الصدر|ألم الصدر|"
        r"ضيق (في )?التنفس|صعوبة (في )?التنفس|تورم في (الساق|الرجل|ساقي|رجلي)|ألم في (الساق|الرجل|ساقي|رجلي))",
        "postnatal",
    ),
]
URGENT_TEXT = {
    "en": {
        "bleed": "Call 998 or go to the nearest emergency department if this is happening now. Very heavy bleeding with dizziness or fainting needs urgent care.",
        "pregnancy": "Call 998 or go to your maternity unit now if this is happening. These signs in pregnancy need checking today.",
        "pain": "Call 998 or go to the nearest emergency department if this is happening now. Sudden, severe pain needs urgent care.",
        "postnatal": "Call 998 or go to the nearest emergency department if this is happening now. After a birth or a pregnancy loss, get urgent care for a fever, very heavy bleeding or feeling faint. Do the same for tummy pain that is severe or getting worse, or a severe headache. Also get urgent care for chest pain, trouble breathing, or pain or swelling in one leg. You were right to ask.",
        "crisis": "You deserve support right now. If you took too many tablets or hurt yourself badly, or feel you can't keep yourself or someone else safe, call 998 now. Please also talk to a doctor today, and to someone you trust. You are not alone.",
    },
    "ar": {
        "bleed": "اتصلي بالرقم 998 أو توجهي إلى أقرب قسم طوارئ إذا كان هذا يحدث الآن. النزيف الغزير جداً مع الدوخة أو الإغماء يحتاج رعاية عاجلة.",
        "pregnancy": "اتصلي بالرقم 998 أو توجهي إلى وحدة الولادة الآن إذا كان هذا يحدث. هذه العلامات أثناء الحمل تحتاج فحصاً اليوم.",
        "pain": "اتصلي بالرقم 998 أو توجهي إلى أقرب قسم طوارئ إذا كان هذا يحدث الآن. الألم المفاجئ الشديد يحتاج رعاية عاجلة.",
        "postnatal": "اتصلي بالرقم 998 أو توجّهي إلى أقرب قسم طوارئ إذا كان هذا يحدث الآن. بعد الولادة أو فقدان الحمل، اطلبي رعاية عاجلة عند ارتفاع الحرارة أو النزيف الغزير جداً أو الشعور بالإغماء. وكذلك عند ألم البطن الشديد أو المتزايد، أو الصداع الشديد. واطلبي رعاية عاجلة أيضاً عند ألم الصدر أو ضيق التنفس أو ألم إحدى الساقين أو تورّمها. سؤالكِ في محلّه.",
        "crisis": "أنتِ تستحقين الدعم الآن. إذا تناولتِ حبوباً أكثر من اللازم أو آذيتِ نفسكِ بشدة، أو شعرتِ بأنكِ لا تستطيعين الحفاظ على سلامتكِ أو سلامة غيركِ، اتصلي بالرقم 998 الآن. وتحدّثي اليوم مع طبيب أو طبيبة، ومع شخص تثقين به. لستِ وحدكِ.",
    },
}
URGENT_SOURCES = {
    "bleed": "nhs_heavy_periods",
    "pregnancy": "nhs_pregnancy_urgent",  # also lists fluid leaking, swelling, vision problems, fever
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
    r"\bis it (pcos|pmos|endometriosis|cancer|diabetes)\b",
    r"\bdo i suffer from\b",
    r"\bwhich (disease|condition) do i\b",
    r"\b(could|might|may) i (have|be having|be suffering)\b",
    r"\b(could|might|can) (this|it|these|that|my symptoms?) (be|mean|indicate)\b",
    r"\bis (this|that|it) (a sign of |signs of )?(pcos|pmos|endometriosis|cancer|diabetes|infertility|a miscarriage|miscarriage|an? ectopic|menopause|thyroid)\b",
    r"\b(do|does) (my|these|this|those) (symptoms?|results?|cycles?|periods?) mean\b",
    r"\b(does|do) (this|that|it) mean (i|i'm|i am)\b",
    r"\bwhat('s| is) wrong with me\b",
    r"\bam i (pregnant|having a miscarriage|miscarrying|in menopause|at risk)\b",
    r"\b(risk|chance|odds).{0,30}(percent|%)",
    r"\bhow (likely|probable)\b",
    r"هل (لدي|لدى|عندي|انا مصابة|أنا مصابة)",
    r"تشخيص",
    r"شخصيني|شخصني",
    r"ما نسبة|نسبة اصابتي|نسبة إصابتي",
    r"ما احتمال",
    r"ما هي فرص|ما فرص",
    r"هل أنا عقيم|هل انا عقيم",
    r"(يكون|يكن) (عندي|لدي|فيني)",
    r"هل (هذا|هذه|ذلك) (يعني|علامة|من علامات)",
    r"هل (أعراضي|اعراضي|نتائجي|دورتي) (تعني|تدل)",
    r"ماذا (تعني|يعني) (أعراضي|اعراضي|نتائجي)",
    r"هل (أنا|انا) (حامل|مصابة|معرضة)",
]
REFUSAL = {
    "en": "I can't tell whether any condition is present, and I don't give chances or percentages. Only a doctor can assess that. Here is what our trusted sources say doctors look at, so you can ask about it:",
    "ar": "لا أستطيع أن أخبرك إن كانت لديك حالة مرضية، ولا أعطي نسباً أو احتمالات. الطبيب وحده يستطيع التقييم. هذا ما تقوله مصادرنا الموثوقة عمّا ينظر إليه الأطباء، لتسألي عنه:",
}
# Medicine and dose questions get a fixed reply: the assistant never advises on medicines (folic acid before pregnancy is
# public-health advice with its own source, nhs_folic_acid, so it is answered from the knowledge base).
_DRUGS = (
    r"(metformin|clomid|clomiphene|letrozole|ibuprofen|brufen|paracetamol|panadol|mefenamic|ponstan|tranexamic|"
    r"progesterone|duphaston|utrogestan|oestrogen|estrogen|hrt|insulin|aspirin|iron (tablets?|pills?|supplements?)|"
    r"ferrous|antidepressants?|sertraline|fluoxetine|citalopram|the pill|contraceptive pills?|morning[- ]after pill|"
    r"misoprostol|methotrexate|antibiotics?|spironolactone|inositol|painkillers?|medicines?|medications?|tablets?|pills?|drugs?|"
    r"supplements?|injections?|hormones?)"
)
MEDICINE = [
    r"\b(should|can|could|do|shall|may) i (take|start|stop|use|try|increase|reduce|double|skip|keep taking|come off)\b.{0,40}"
    + _DRUGS,
    _DRUGS + r".{0,30}\b(dose|dosage|how (much|many|often))\b",
    r"\b(dose|dosage)\b",
    r"\bhow (many|much) (mg|milligrams?|tablets|pills|capsules)\b",
    r"\b(prescribe|prescription) (me|for me)\b",
    r"هل (آخذ|اخذ|أتناول|اتناول|أستخدم|استخدم|أوقف|اوقف|أبدأ|ابدأ|أزيد|ازيد|أقلل|اقلل|أوقّف)",
    r"جرعة|جرعه",
    r"كم (حبة|حبه|حبوب|ملغ|مليغرام|ملليغرام)",
    r"(اصرف|اكتب|يكتب|يصرف) (لي|لى) (دواء|علاج)",
]
MED_EXEMPT = [r"folic|فوليك"]
MEDICINE_TEXT = {
    "en": "I can't advise on medicines, doses or stopping a treatment. Please ask your doctor or pharmacist, and bring your report so they can see your history.",
    "ar": "لا أستطيع تقديم نصائح عن الأدوية أو الجرعات أو إيقاف العلاج. اسألي طبيبتك أو الصيدلي، وأحضري تقريرك ليطّلعوا على سجلّك.",
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
_APOS = str.maketrans({"\u2019": "'", "\u2018": "'", "\u02bc": "'", "`": "'", "\u00b4": "'"})
_AR_LETTERS = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي"})


def _clean(text: str) -> str:
    """Lower case, no Arabic diacritics, one form per Arabic letter family, straight apostrophes, single spaces."""
    t = _DIAC.sub("", (text or "").lower()).translate(_APOS).translate(_AR_LETTERS)
    return re.sub(r"\s+", " ", t)


def _pat(p: str) -> re.Pattern:
    return re.compile(_DIAC.sub("", p).translate(_AR_LETTERS))  # patterns get the same Arabic folding as the text


_CRISIS = [_pat(p) for p in CRISIS]
_URGENT = [(_pat(p), kind) for p, kind in URGENT]
_DIAGNOSIS = [_pat(p) for p in DIAGNOSIS]
_MEDICINE = [_pat(p) for p in MEDICINE]
_MED_EXEMPT = [_pat(p) for p in MED_EXEMPT]


def _any(patterns: list[re.Pattern], text: str) -> bool:
    t = _clean(text)
    return any(p.search(t) for p in patterns)


def _urgent_kind(q: str) -> str | None:
    # Concept routing only (app/agents/safety.py): it sets aside negated signs ("no fever") and gum or nose bleeds,
    # which the older phrase list above could not. The list stays as documentation of the first version.
    return safety.urgent_kind(q)


def _medicine(q: str) -> bool:
    return safety.medicine(q)


def _crisis(q: str) -> bool:
    return _any(_CRISIS, q) or safety.crisis(q)  # explicit phrases plus concepts: recall first


def _diagnosis(q: str) -> bool:
    return _any(_DIAGNOSIS, q) or safety.diagnosis(q)


def _cite_list(ids: list[str]) -> list[dict]:
    s = sources()
    return [{"n": i + 1, "source_id": sid, "title": s[sid].title, "url": s[sid].url} for i, sid in enumerate(ids)]


# Issue #43 (c): "Why might my cycles be longer than 35 days?" got an off-topic heavy-periods sentence and no causes.
# Measured by the rag-specialist on all 702 eval and held-out questions plus 42 probes: no answer got worse.
_WHY = {"why", "لماذا", "ليش", "ليه"}
_CAUSE = {"reason", "caus", "سبب", "اسباب"}  # stems of reasons / causes


def _extractive(q: str, passages, lang: str, max_sents: int = 3) -> tuple[list[dict], list[str]]:
    terms = query_terms(q)
    why = bool(_WHY & set(re.findall(r"\w+", normalise(q))) or terms & _CAUSE)
    cands = []
    for rank, p in enumerate(passages):
        if p.lang != lang or not sources()[p.source_id].quote:
            continue
        for s in _SENT.split(p.text):
            words = set(tokens(s))
            cands.append([len(terms & words), rank, s.strip(), p.source_id, bool(words & _CAUSE)])
    if not cands:
        return [], []
    best = max(c[0] for c in cands)
    # The source of the best-matching sentence answers the question; other sources must earn their place.
    top = min((c for c in cands if c[0] == best), key=lambda c: c[1])[3]
    if why and best >= 1:  # a why-question wants causes: favour cause sentences in that source only
        for c in cands:
            if c[3] == top and c[4]:
                c[0] += 1
    # One shared word is weak evidence: once a sentence shares 3 or more, other sources need 2.
    floor = 2 if best >= 3 else 1
    cands.sort(key=lambda c: c[0] - 0.15 * c[1], reverse=True)
    chosen = [c for c in cands if c[0] >= (1 if c[3] == top else floor)][:max_sents]
    if not chosen:
        return [], []
    order = list(dict.fromkeys(c[3] for c in chosen))
    chosen.sort(key=lambda c: (order.index(c[3]), c[1]))
    return [{"text": c[2], "source_id": c[3]} for c in chosen], order


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

    llm = get_llm()
    words = _crisis(q)
    # the second check by the model runs when the word checks found no crisis; it can only add a route, never remove one
    second = None if words else safety.model_check(q, llm, names)
    if words or (second and second["crisis"]):
        out.update(
            crisis=True,
            urgent={"kind": "crisis", "message": URGENT_TEXT[lang]["crisis"], "number": "998"},
            answer=URGENT_TEXT[lang]["crisis"],
            citations=_cite_list([URGENT_SOURCES["crisis"]]),
            grounded=True,
        )
        how = "word checks" if words else "second check by the language model"
        trace.append({"agent": "safety", "detail": f"crisis path ({how}): support message only, no other content"})
        return out
    kind = _urgent_kind(q) or (second["urgent"] if second else None)
    if kind:
        out["urgent"] = {"kind": kind, "message": URGENT_TEXT[lang][kind], "number": "998"}
        trace.append({"agent": "safety", "detail": f"urgent guidance first ({kind})"})
    if _medicine(q):  # never advise on medicines or doses; urgent guidance, if any, still comes first
        msg = MEDICINE_TEXT[lang]
        out.update(
            refused=True,
            answer=(out["urgent"]["message"] + " " if out["urgent"] else "") + msg,
            citations=_cite_list([URGENT_SOURCES[kind]]) if out["urgent"] else [],
            grounded=bool(out["urgent"]),
        )
        trace.append(
            {"agent": "safety", "detail": "medicine or dose question: fixed reply, ask a doctor or pharmacist"}
        )
        return out
    refused = _diagnosis(q)
    if refused:
        out["refused"] = True
        trace.append({"agent": "safety", "detail": "diagnosis or probability request: politely refused"})

    passages = search(q, k=6, lang=lang)
    trace.append(
        {"agent": "evidence", "detail": f"{len(passages)} passages from {len({p.source_id for p in passages})} sources"}
    )
    sents, order = _extractive(q, passages, lang, 2 if refused else 3)
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
