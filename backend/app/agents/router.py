"""The assistant's router (section 7; G2: Krishna, 19 Nov 2026): a small LangGraph state machine in front of the
knowledge answer.

    intake -> safety (word checks, unchanged) -> route -> [second check] -> knowledge | record | next_step -> END

1. Safety routing runs first and is not changed: when the word checks find a crisis, urgent signs, a medicine question
   or a diagnosis request, the question goes to the knowledge answer (app/agents/assistant.py `answer`), whose safety
   routes reply exactly as before.
2. The route is deterministic: keywords and patterns in English and Gulf Arabic. Three lanes:
   (a) knowledge: as before; (b) her record: her own numbers, computed by code (app/agents/record.py);
   (c) next step: her patterns and due care steps as a short list of drafts she approves.
   Only when her AI switch is on and a model is configured, a model may pick a lane for a question the patterns did
   not place; it never answers, and code still computes every number.
3. With a model, the record and next-step lanes still get the model's second safety check first (it can only add a
   crisis or urgent route, as in the knowledge answer).
4. Her AI switch: off, the record and next-step lanes still work (they are code) with no model call at all; the
   knowledge answer stays closed (the API's 403 `ai_off`), and the safety replies stay on.
"""

from __future__ import annotations

import json
import re
import time
from datetime import date
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents import assistant, explain, food, record, safety
from app.ai.llm import NoLLM, get_llm
from app.ai.redact import redact
from app.rag.kb import sources as kb_sources

LANES = ("knowledge", "record", "next_step", "food", "explain")

# ---------------- the deterministic router (EN and Gulf Arabic, after the assistant's folding) ----------------
# A record question is short and asks for her own data: a first-person marker, a data-question shape and a topic.
# Long messages (a story, someone else's emergency) stay with the knowledge answer, as before.
MAX_WORDS = 20
_MINE_EN = r"\b(my|mine|did i|have i|i (logged|had|missed|took|got|was)|i've)\b"
_MINE_AR = (
    r"\b(دوراتي|دورتي|عادتي|ضغطي|قراءاتي|تحاليلي|تحليلي|نتائجي|نتايجي|فحوصاتي|فحوصي|خطواتي|الامي|اوجاعي|المي|"
    r"لي|عندي|سجلت|غبت|تغيبت|بقيت|فاتني|موعدي)\b|ما رحت"
)
_SHAPE_EN = (
    r"\b(how (long|many|often|much)|when (was|were|did|is)|what (was|were|are|is|did)|which|show|list|tell me|give me|"
    r"did i|have i|how far|latest|last|recent|readings?|values?|results?|numbers?|summary)\b"
)
_SHAPE_AR = (
    r"\b(كم|متي|ما هي|ما هو|ما كانت|ماهي|وش|ايش|شو|شنو|اعطيني|اعرضي|ورني|وريني|اخر|الاخيره|الاخير|قراءات|نتائج|قيم)\b"
)
# Questions about what is usual, why, what it means or what to do about it are knowledge questions, even about her
# own numbers ("is my cycle length normal?").
_JUDGE_EN = (
    r"\b(normal|usual|typical|average|ok|okay|healthy|should|supposed|why|cause[sd]?|mean|means|meaning|safe|worr\w*|"
    r"concern\w*|dangerous|serious|bad|good|high|low|too|risk|treat\w*|help|reduce|stop|prevent|improve|symptoms?|signs?|"
    r"probability|chances?|odds|likely|diagnos\w*|am i)\b"
)
_JUDGE_AR = (
    r"\b(طبيعي|طبيعيه|عادي|عاديه|المعتاد|يجب|لازم|ليش|ليه|لماذا|سبب|اسباب|يعني|تعني|معني|خطير|مقلق|اقلق|"
    r"مرتفع|منخفض|عالي|واطي|علاج|اعالج|تخفيف|اخفف|اعراض|علامات|تشخيص\w*|شخصي\w*|احتمال|نسبه|مصابه)\b"
)
# Yes/no questions about a value ("is my blood pressure high?") are knowledge questions.
_YESNO_EN = r"^(is|are|does|do|can|could|should|will|would|isn'?t|aren'?t)\b"
_YESNO_AR = r"^هل "
# Someone in distress or an emergency is never handed a to-do list.
_DISTRESS = (
    r"\b(help|urgent|emergency|scared|afraid|panic\w*|knife|blood|bleed\w*|faint\w*|breathe|ambulance)\b|"
    r"\b(ساعدي|ساعدوني|الحقي|الحقوني|طوارئ|خايفه|خائفه|دم|نزيف|سكين|اسعاف)\b"
)

TOPIC_EN = {
    "last_period": (
        r"\bwhen (was|did|is) my (last |latest |most recent |previous )?(period|menses|bleed)|"
        r"\b(my )?last period (start|begin|was)|\bdays since my (last )?period|\bhow long ago (was|did) my (last )?period|"
        r"\bdate of my (last )?period"
    ),
    "cycles": r"\bcycles?\b.{0,30}\b(long|length|lengths|days?)\b|\b(long|length|lengths)\b.{0,30}\bcycles?\b",
    "impact": r"\bmiss(ed|ing)? (work|school|study|uni|university|class|classes|college)\b|\bdays? off\b|\bstayed in bed\b|\bsick days?\b",
    "pain": r"\b(pain|cramps?|hurt)\b",
    "bp": r"\bblood pressure\b|\bbp\b",
    "postnatal": (
        r"\b(postnatal|postpartum|post-partum|after (the |my )?(birth|delivery))\b.{0,40}\b(steps?|checks?|visits?|appointments?|left|due|plan|pathway|remaining)\b|"
        r"\b(steps?|checks?|visits?)\b.{0,30}\b(postnatal|postpartum|after (the |my )?(birth|delivery))\b"
    ),
}
TOPIC_AR = {
    "last_period": (
        r"\bمتي (كانت|كان|جات|جاءت|جت|بدات|نزلت|اجت) (اخر )?(دوره|الدوره|دورتي|العاده|عادتي)\b|"
        r"\bاخر (دوره|دورتي) (لي|عندي)\b|\bمتي اخر (دوره|دورتي)\b"
    ),
    "cycles": r"\b(طول|اطوال|مده) (دوراتي|دورتي|الدوره|الدورات|دورات)\b|\b(دوراتي|دورتي) (الاخيره|كم)\b",
    "impact": r"\b(غبت|تغيبت|غياب|فاتني|اجازه مرضيه)\b|ما رحت (العمل|الدوام|الشغل|الدراسه|الجامعه|المدرسه|الكليه)|بقيت (في|ب)(السرير|الفراش)",
    "pain": r"\b(الم|الام|وجع|اوجاع|المي|اوجاعي)\b",
    "bp": r"\bضغط الدم\b|\bضغطي\b|\bقراءات الضغط\b|\bقراءه الضغط\b",
    "postnatal": (
        r"\b(بعد الولاده|النفاس|ما بعد الولاده)\b.{0,30}\b(خطوات|فحوصات|زيارات|مواعيد|باقي|متبقي|المتبقيه|بقي|الخطه)\b|"
        r"\b(خطوات|فحوصات|زيارات|مواعيد)\b.{0,30}\b(بعد الولاده|النفاس)\b"
    ),
}
# A lab question names a test (record.LABS) or asks for her lab results in general, with a possessive.
_LABS_GENERAL = r"\b(lab|labs|blood tests?|test results)\b|\b(تحاليلي|تحليلي|نتائج التحاليل|فحوصات الدم|فحوصاتي)\b"
_LABS_MINE = r"\bmy\b|\b(عندي|لي|تحاليلي|تحليلي|نتائجي|فحوصاتي)\b"

NEXT_EN = (
    r"\bwhat (should|do|can) i do next\b|\bwhat('s| is) (my )?next( step)?\b|\b(my )?next steps?\b|"
    r"\bprepare me\b|\bhelp me (get )?(prepare|ready)\b|\b(get|getting) ready for my (appointment|visit|doctor)\b|"
    r"\bprepare for my (appointment|visit|doctor|clinic)\b|\bwhat should i (ask|bring)\b|\bquestions for my (doctor|appointment|visit)\b"
)
NEXT_AR = (
    r"\b(ماذا|ايش|وش|شو|شنو) (افعل|اسوي|اعمل) (بعد ذلك|بعدين|بعدها)\b|\b(ما|ما هي|وش|شو) (الخطوه|خطوتي) (التاليه|الجايه|القادمه)\b|"
    r"\bخطوتي (التاليه|الجايه|القادمه)\b|\bالخطوات (التاليه|الجايه|القادمه)\b|"
    r"\b(جهزيني|حضريني|جهزني|حضرني)\b|\b(ساعديني|ساعدني) (اجهز|استعد)\b|\b(استعد|اجهز) (لموعدي|للموعد|لزيارتي)\b|"
    r"\b(ماذا|ايش|وش|شو) اسال (الطبيبه|الطبيب|الدكتوره|الدكتور)\b|\bاسئله (للطبيبه|للطبيب|للدكتوره|للدكتور)\b"
)

# Someone else's record: never opened, whatever the question.
_OTHER_EN = (
    r"\b(my (sister|mother|mom|mum|friend|daughter|cousin|aunt|wife|niece|colleague|neighbou?r)'?s?|her|his|their|"
    r"someone else'?s|another (woman|person|patient)'?s?|other (women|people|patients)'?s?)\b"
    r"|\b(?!(?:what|it|that|let|there|who|he|she|here|where|how|baby|today|doctor|one|everyone|nobody|mom|mum)\b)[a-z]{3,}'s\b"
)
_OTHER_AR = (
    r"\b(اختي|امي|والدتي|صديقتي|صاحبتي|بنتي|ابنتي|خالتي|عمتي|زوجتي|جارتي|زميلتي|دوراتها|دورتها|تحاليلها|نتائجها|"
    r"ضغطها|قراءاتها|المها|سجلها|غيري)\b|شخص اخر|امراه اخري"
)
_RECORD_NOUN_EN = r"\b(cycles?|periods?|labs?|lab results|results|values|blood pressure|bp|readings?|pain|record|entries|data|ferritin|ha?emoglobin|hb|tsh|steps)\b"
_RECORD_NOUN_AR = (
    r"\b(دوره|دورات|دوراتها|دورتها|تحاليل|تحاليلها|نتائج|نتائجها|ضغط|ضغطها|قراءات|الم|سجل|سجلها|فيريتين|هيموجلوبين)\b"
)


def _has(p: str, t: str) -> bool:
    return bool(re.search(p, t))


def classify(question: str) -> dict:
    """{"lane", "topic", "why"} from patterns only. Safety routing runs before this and is not part of it."""
    t = record.clean(question)
    ar = bool(assistant.AR.search(question or ""))
    knowledge = lambda why: {"lane": "knowledge", "topic": None, "why": why}  # noqa: E731
    if len(t.split()) > MAX_WORDS:
        return knowledge("a long message: the knowledge answer, as before")
    other = (_has(_OTHER_EN, t) and _has(_RECORD_NOUN_EN, t)) or (
        ar and _has(_OTHER_AR, t) and _has(_RECORD_NOUN_AR, t)
    )
    judging = _has(_JUDGE_EN, t) or (ar and _has(_JUDGE_AR, t))
    # "what should I do next?" and "help me prepare" are next-step words, not judging ones
    judging_next = _has(_JUDGE_EN.replace("should|", "").replace("help|", ""), t) or (ar and _has(_JUDGE_AR, t))
    if (_has(NEXT_EN, t) or _has(NEXT_AR, t)) and not (other or judging_next or _has(_DISTRESS, t)):
        return {"lane": "next_step", "topic": None, "why": "next-step words"}
    shape = _has(_SHAPE_EN, t) or (ar and _has(_SHAPE_AR, t))
    if judging:
        return knowledge("asks what is usual, why or what to do")
    if _has(_YESNO_AR, t) or (_has(_YESNO_EN, t) and not _has(r"^(did|have|has) ", t)):
        return knowledge("a yes-or-no question")
    if shape and other:
        return {"lane": "record", "topic": "other_person", "why": "asks about someone else's record"}
    if not (shape and (_has(_MINE_EN, t) or (ar and _has(_MINE_AR, t)))):
        return knowledge("no record question")
    if (record.asked_labs(question) or _has(_LABS_GENERAL, t)) and _has(_LABS_MINE, t):
        return {"lane": "record", "topic": "labs", "why": "her lab results"}
    topics = TOPIC_AR if ar else TOPIC_EN
    for topic in ("last_period", "postnatal", "bp", "impact", "cycles", "pain"):
        if _has(topics[topic], t):
            return {"lane": "record", "topic": topic, "why": f"her {topic.replace('_', ' ')}"}
    return knowledge("no record topic")


def _topic_hint(question: str) -> bool:
    """Worth a model's opinion: first person and a record noun, but the patterns placed it nowhere."""
    t = record.clean(question)
    ar = bool(assistant.AR.search(question or ""))
    noun = _has(_RECORD_NOUN_EN, t) or (ar and _has(_RECORD_NOUN_AR, t))
    return noun and (_has(_MINE_EN, t) or (ar and _has(_MINE_AR, t)))


ROUTER_SYSTEM = """You sort questions sent to a women's health record app. Decide only where each one goes; never answer it.
- "record": she asks for numbers or dates from her OWN entries (cycle lengths, last period, pain days, missed work, her
  lab values, her blood pressure readings, her postnatal steps). Topic: one of cycles, last_period, pain, impact, labs,
  bp, postnatal.
- "next_step": she asks what to do next or to prepare for an appointment.
- "knowledge": anything else, including what is normal, why, or what something means.
Return JSON: {"lane": "knowledge|record|next_step", "topic": "<topic or empty>"}"""


# ---------------- the graph ----------------
class State(TypedDict, total=False):
    question: str
    lang: str
    bundle: dict | None
    ref: date
    ai_on: bool
    names: list[str]
    llm: Any
    words: dict
    second: Any
    lane: str
    topic: str | None
    out: dict
    trace: list[dict]


_UNSET = assistant.ASK_MODEL  # "run the model's second check inside the knowledge answer"


def _step(state: State, agent: str, detail: str, t0: float) -> list[dict]:
    return [
        *state.get("trace", []),
        {"agent": agent, "detail": detail, "ms": round((time.perf_counter() - t0) * 1000, 1)},
    ]


def _model(state: State):
    """The model, only when her AI switch is on and one is configured; otherwise None."""
    llm = state.get("llm")
    return llm if state.get("ai_on") and getattr(llm, "name", "none") != "none" else None


def intake(state: State) -> dict:
    t0 = time.perf_counter()
    lang = state["lang"]
    return {"trace": _step(state, "intake", f"question in {'Arabic' if lang == 'ar' else 'English'}", t0)}


def safety_first(state: State) -> dict:
    """The word checks, unchanged and first. Any route hands the question to the knowledge answer's safety replies."""
    t0 = time.perf_counter()
    q = state["question"]
    words = {
        "crisis": assistant._crisis(q),
        "urgent": assistant._urgent_kind(q),
        "medicine": assistant._medicine(q),
        "diagnosis": assistant._diagnosis(q),
    }
    found = [k for k, v in words.items() if v]
    detail = (
        f"word checks: {', '.join(found)}; the knowledge answer's safety routes reply"
        if found
        else "word checks: no safety route"
    )
    return {"words": words, "second": _UNSET, "trace": _step(state, "safety", detail, t0)}


def route(state: State) -> dict:
    t0 = time.perf_counter()
    w = state["words"]
    if w["crisis"] or w["urgent"] or w["medicine"]:
        return {"lane": "safety", "topic": None, "trace": _step(state, "router", "safety route first", t0)}
    q = state["question"]
    if w["diagnosis"]:
        # 22 Nov (G2: Krishna): a named condition or "what is wrong with me" gets the refusal FIRST, then cited facts and
        # what her own record shows (explain lane, code only); anything else is refused with sources, as before.
        if explain.condition(q):
            return {"lane": "explain", "topic": "diagnosis",
                    "trace": _step(state, "router", "diagnosis request about a named condition: refusal first, then cited facts (explain lane)", t0)}
        if explain.is_body_question(q) and state.get("bundle") is not None:
            return {"lane": "explain", "topic": "body_refuse",
                    "trace": _step(state, "router", "diagnosis request about her body: refusal first, then her own patterns (explain lane)", t0)}
        return {
            "lane": "knowledge",
            "topic": None,
            "trace": _step(state, "router", "diagnosis request: refused with sources", t0),
        }
    if explain.asks_medicine(q):  # 22 Nov (G2: Krishna): "what medicine for PCOS?" missed by the word checks
        return {"lane": "explain", "topic": "medicine",
                "trace": _step(state, "router", "medicine question about a named condition: fixed medicine reply first, never a medicine (explain lane)", t0)}
    if food.is_food_question(q, state.get("bundle")):  # 22 Nov (G2: Krishna): food, never medicine
        return {"lane": "food", "topic": None, "trace": _step(state, "router", "food question: food lane (code, NHS)", t0)}
    if explain.is_explain_question(q):  # 22 Nov (G2: Krishna): what a condition is, cited, plus her own patterns
        return {"lane": "explain", "topic": "explain",
                "trace": _step(state, "router", f"condition question ({explain.condition(q)}): explain lane (code, NHS and guidelines)", t0)}
    if explain.is_body_question(q) and state.get("bundle") is not None:
        return {"lane": "explain", "topic": "body", "trace": _step(state, "router", "her body: her own patterns (explain lane, code)", t0)}
    if state.get("bundle") is None:
        return {"lane": "knowledge", "topic": None, "trace": _step(state, "router", "no record loaded: knowledge", t0)}
    got = classify(state["question"])
    how = "patterns"
    llm = _model(state)
    if got["lane"] == "knowledge" and llm and _topic_hint(state["question"]):
        try:
            res = llm.complete_json(
                ROUTER_SYSTEM, f"<question>\n{redact(state['question'], state.get('names'))}\n</question>", 60
            )
        except Exception:  # noqa: BLE001 (no answer: the patterns' lane stands)
            res = None
        lane = str((res or {}).get("lane", "")).strip().lower()
        topic = str((res or {}).get("topic", "")).strip().lower()
        if lane == "record" and topic in record.TOPICS:
            got, how = {"lane": "record", "topic": topic, "why": "model fallback"}, f"model fallback ({llm.name})"
        elif lane == "next_step":
            got, how = {"lane": "next_step", "topic": None, "why": "model fallback"}, f"model fallback ({llm.name})"
    detail = f"{got['lane']}" + (f" ({got['topic']})" if got.get("topic") else "") + f" by {how}: {got['why']}"
    return {"lane": got["lane"], "topic": got.get("topic"), "trace": _step(state, "router", detail, t0)}


def second_check(state: State) -> dict:
    """With a model, her record lanes get the same second safety check as the knowledge answer (it only adds routes)."""
    t0 = time.perf_counter()
    llm = _model(state)
    if state["lane"] not in ("record", "next_step", "food", "explain") or not llm:
        return {}
    second = safety.model_check(state["question"], llm, state.get("names"))
    if second and (second["crisis"] or second["urgent"]):
        return {
            "lane": "safety",
            "second": second,
            "trace": _step(state, "safety", "second check by the language model: safety route", t0),
        }
    return {"second": second, "trace": _step(state, "safety", "second check by the language model: no route", t0)}


def knowledge(state: State) -> dict:
    w = state["words"]
    if not state.get("ai_on") and not (w["crisis"] or w["urgent"] or w["medicine"] or state["lane"] == "safety"):
        return {"out": {"lane": "ai_off"}}  # her AI switch: the knowledge answer stays closed (API 403 ai_off)
    llm = state.get("llm") if state.get("ai_on") else NoLLM()
    out = assistant.answer(
        state["question"], state["lang"], state.get("names"), llm=llm, second=state.get("second", _UNSET)
    )
    safety_route = out["crisis"] or bool(out["urgent"]) or any("medicine" in s["detail"] for s in out["trace"])
    out["lane"] = "safety" if safety_route else "knowledge"
    out["trace"] = [*state["trace"], *out["trace"][1:]]  # the router's intake replaces the answer's own
    return {"out": out}


def _base(state: State) -> dict:
    return {
        "question": state["question"],
        "lang": state["lang"],
        "answer": "",
        "sentences": [],
        "citations": [],
        "urgent": None,
        "crisis": False,
        "refused": False,
        "grounded": True,
    }


def _cite_list(ids: list[str]) -> list[dict]:
    s = kb_sources()
    return [
        {"n": i + 1, "source_id": sid, "title": s[sid].title, "url": s[sid].url}
        for i, sid in enumerate(ids)
        if sid in s
    ]


def record_lane(state: State) -> dict:
    t0 = time.perf_counter()
    lang, topic = state["lang"], state["topic"]
    res = record.answer_record(state["bundle"], topic, state["question"], lang, state["ref"])
    trace = _step(state, "record", f"{topic}: {len(res['lines'])} lines computed by code from her entries", t0)
    lines, written_by = res["lines"], "code"
    llm = _model(state)
    if llm and topic in record.REWORDABLE:
        t1 = time.perf_counter()
        lines, stats = record.reword(lines, topic, lang, llm, state.get("names"))
        if stats["kept"]:
            written_by = llm.name
        rej = stats["rejected"]
        detail = f"{stats['kept']} of {stats['asked']} reworded lines kept" + (
            f"; {len(rej)} rejected ({'; '.join(dict.fromkeys(rej))}), so the code's own sentence stays" if rej else ""
        )
        trace = [*trace, {"agent": "verifier", "detail": detail, "ms": round((time.perf_counter() - t1) * 1000, 1)}]
    elif topic not in record.REWORDABLE:
        trace = [*trace, {"agent": "verifier", "detail": f"{topic}: shown as computed, never reworded"}]
    else:
        why = "she turned AI off" if not state.get("ai_on") else "no model configured"
        trace = [*trace, {"agent": "verifier", "detail": f"code's own sentences ({why})"}]
    out = _base(state)
    cites = _cite_list(res["sources"])
    out.update(
        lane="record",
        answer=" ".join(ln["text"] for ln in lines),
        citations=cites,
        record={
            "topic": topic,
            "from_entries": True,
            "written_by": written_by,
            "lines": [
                {"text": ln["text"], "evidence": ln["evidence"], "evidence_total": ln["evidence_total"]} for ln in lines
            ],
        },
        trace=[*trace, {"agent": "writer", "detail": f"answered from her entries ({written_by})"}],
    )
    return {"out": out}


def next_step_lane(state: State) -> dict:
    t0 = time.perf_counter()
    lang = state["lang"]
    res = record.next_steps(state["bundle"], lang, state["ref"])
    out = _base(state)
    trace = _step(state, "next_step", f"{len(res['items'])} items from her rules and care steps (code, no model)", t0)
    if res["crisis"]:  # the crisis path: the support message first, no pattern, no draft (CLAUDE.md rule 5)
        msg = assistant.URGENT_TEXT[lang]["crisis"]
        out.update(
            lane="next_step",
            crisis=True,
            urgent={"kind": "crisis", "message": msg, "number": "998", "support_line": assistant.SUPPORT_LINE},
            answer=msg,
            lead=msg,
            citations=_cite_list(assistant.URGENT_SOURCES["crisis"]),
            next_steps=res["items"],  # other red flags only, each with its own urgent message
            trace=[*trace, {"agent": "safety", "detail": "crisis path in her record: support message first"}],
        )
        return {"out": out}
    if res["red_flags"]:
        first = res["items"][0]
        out["urgent"] = {"kind": "record", "message": first["text"], "number": "998"}
    lines = [
        res["lead"],
        *(i["text"] if i["kind"] == "red_flag" else f"{i['title']}: {i['text']}" for i in res["items"]),
    ]
    out.update(lane="next_step", lead=res["lead"], answer=" ".join(lines), next_steps=res["items"], trace=trace)
    return {"out": out}


def food_lane(state: State) -> dict:
    """Food and drink for periods from the NHS, written by code; never a medicine (22 Nov, G2: Krishna)."""
    t0 = time.perf_counter()
    res = food.answer(state["question"], state["lang"], state.get("bundle"), state["ref"])
    ids = list(dict.fromkeys(food.SOURCES[ln["cite"]] for ln in res["lines"]))
    cites = _cite_list(ids)
    num = {c["source_id"]: c["n"] for c in cites}
    parts = [res["lead"], *(f"{ln['text']} [{num[food.SOURCES[ln['cite']]]}]" for ln in res["lines"])]
    detail = f"{len(res['lines'])} sentences from NHS pages, no medicines"
    if res["allergens"]:
        detail += f"; she can't eat: {', '.join(res['allergens'])} ({len(res['dropped'])} foods left out)"
    if res["heavy_days"]:
        detail += f"; personalised: {res['heavy_days']} heavy days in 90"
    out = _base(state)
    out.update(
        lane="food",
        answer=" ".join(parts),
        citations=cites,
        food={"allergens": res["allergens"], "left_out": res["dropped"], "heavy_days": res["heavy_days"]},
        trace=[*_step(state, "food", detail, t0), {"agent": "writer", "detail": "code's own sentences (no model)"}],
    )
    return {"out": out}


def explain_lane(state: State) -> dict:
    """What a condition is, or what her body's entries show; fixed sentences with sources, never a model (22 Nov, G2)."""
    t0 = time.perf_counter()
    topic = state.get("topic") or "explain"
    mode = {"diagnosis": "diagnosis", "medicine": "medicine", "body": "body", "body_refuse": "body"}.get(topic, "explain")
    if not state.get("ai_on") and mode != "medicine":  # her AI switch closes Nura's answers, as for the knowledge answer
        return {"out": {"lane": "ai_off"}}
    res = explain.answer(
        state["question"], state["lang"], state.get("bundle"), state["ref"], mode=mode, refuse=topic == "body_refuse"
    )
    ids = list(dict.fromkeys(ln["cite"] for ln in res["lines"] if ln["cite"]))
    cites = _cite_list(ids)
    num = {c["source_id"]: c["n"] for c in cites}
    parts = [ln["text"] + (f" [{num[ln['cite']]}]" if ln["cite"] in num else "") for ln in res["lines"]]
    sentences = [{"text": ln["text"], "cite": num[ln["cite"]]} for ln in res["lines"] if ln["cite"] in num]
    srcs = kb_sources()
    learn = [
        {"kind": "page", "url": srcs[sid].url, "title": srcs[sid].title, "publisher": srcs[sid].publisher}
        for sid in res["pages"]
        if sid in srcs
    ]
    cid = res["condition"]
    for i, rc in enumerate(res["related"][:2]):  # the named condition, or her patterns' conditions (body question)
        if state["lang"] == "ar" and rc in explain.AR_PAGES:
            learn.insert(i, explain.AR_PAGES[rc])
        learn.extend(explain.VIDEOS.get(rc, []))
    out = _base(state)
    detail = f"{mode}: {len(res['lines'])} sentences" + (f" on {cid}" if cid else "")
    detail += f"; {len(res['personal'])} from her own patterns" if res["personal"] else ""
    if res["refused"]:
        detail += "; refused first (no diagnosis)"
    out.update(
        lane="explain",
        answer="\n".join(parts),  # one sentence per line on screen (the card keeps the line breaks)
        sentences=sentences,
        citations=cites,
        refused=res["refused"],
        learn_more=learn,
        explain={"condition": cid, "mode": mode, "personal": [p["text"] for p in res["personal"]]},
        trace=[*_step(state, "explain", detail, t0), {"agent": "writer", "detail": "code's own sentences (no model)"}],
    )
    if res["red_flag"]:  # red flags first (CLAUDE.md rule 5): her urgent pattern leads, with 998
        first = next(p for p in res["personal"] if p["kind"] == "red_flag")
        out["urgent"] = {"kind": "record", "message": first["text"], "number": "998"}
    return {"out": out}


def _after_route(state: State) -> str:
    return {"record": "second_check", "next_step": "second_check", "food": "second_check", "explain": "second_check"}.get(
        state["lane"], "knowledge"
    )


def _after_second(state: State) -> str:
    return {"record": "record", "next_step": "next_step", "food": "food", "explain": "explain"}.get(state["lane"], "knowledge")


def build_graph():
    g = StateGraph(State)
    for name, fn in [
        ("intake", intake),
        ("safety", safety_first),
        ("route", route),
        ("second_check", second_check),
        ("knowledge", knowledge),
        ("record", record_lane),
        ("next_step", next_step_lane),
        ("food", food_lane),
        ("explain", explain_lane),
    ]:
        g.add_node(name, fn)
    g.add_edge(START, "intake")
    g.add_edge("intake", "safety")
    g.add_edge("safety", "route")
    g.add_conditional_edges("route", _after_route, {"second_check": "second_check", "knowledge": "knowledge"})
    g.add_conditional_edges(
        "second_check",
        _after_second,
        {"record": "record", "next_step": "next_step", "food": "food", "explain": "explain", "knowledge": "knowledge"},
    )
    for lane in ("knowledge", "record", "next_step", "food", "explain"):
        g.add_edge(lane, END)
    return g.compile()


_GRAPH = None


def ask(
    question: str,
    lang: str | None = None,
    *,
    bundle: dict | None,
    ref: date,
    ai_on: bool,
    names: list[str] | None = None,
    llm=None,
) -> dict:
    """Route one question. `bundle` is the signed-in woman's own record (the API loads it from her session, never from
    the request). Returns the knowledge answer's shape plus `lane`, and `record` or `next_steps` for those lanes;
    `{"lane": "ai_off"}` when her AI switch is off and the question needs the knowledge answer."""
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = build_graph()
    q = (question or "").strip()[:600]
    lang = lang if lang in ("en", "ar") else assistant.detect_lang(q)
    if llm is None:
        llm = get_llm() if ai_on else NoLLM()
    state: State = {
        "question": q,
        "lang": lang,
        "bundle": bundle,
        "ref": ref,
        "ai_on": ai_on,
        "names": names or [],
        "llm": llm,
        "trace": [],
    }
    return _GRAPH.invoke(state)["out"]


def dumps(x) -> str:
    return json.dumps(x, ensure_ascii=False)
