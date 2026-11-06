"""The insights pipeline as a LangGraph state machine (docs/03). Deterministic order, typed state, every step traced.

    intake -> signal (rules, no AI) -> safety -> [crisis: END] -> evidence (RAG) -> writer -> verifier -> care_gap -> END

Rules decide. Retrieval grounds. The LLM (when configured) only rewords, and the verifier drops any sentence it
cannot support. Without an LLM the writer uses the deterministic template, so cards are identical run to run.
"""

from __future__ import annotations

import json
import re
import time
from datetime import date, timedelta
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents import copy as cp
from app.ai.guards import violations
from app.ai.llm import get_llm
from app.ai.redact import redact
from app.config import get_settings
from app.db import SYSTEM, session
from app.rag import kb
from app.rag.retrieve import search
from app.rules.engine import Evaluation, Hit, evaluate, load_rules


class State(TypedDict, total=False):
    profile_id: str
    bundle: dict
    ref: date
    lang: str
    evaluation: Evaluation
    hits: list[Hit]
    crisis: bool
    evidence: dict[str, list[dict]]
    cards: list[dict]
    trace: list[dict]


def _step(state: State, agent: str, detail: str, t0: float, **extra) -> list[dict]:
    return [
        *state.get("trace", []),
        {"agent": agent, "detail": detail, "ms": round((time.perf_counter() - t0) * 1000, 1), **extra},
    ]


# ---------------- nodes ----------------
def intake(state: State) -> dict:
    t0 = time.perf_counter()
    b = state["bundle"]
    n = len(b["daily_logs"])
    return {
        "trace": _step(
            state, "intake", f"{n} daily logs, {len(b['events'])} events, {len(b['labs'])} confirmed lab results", t0
        )
    }


def signal(state: State) -> dict:
    t0 = time.perf_counter()
    ev = evaluate(state["bundle"], state["ref"], get_settings().red_flag_window_days)
    rs = load_rules()
    return {
        "evaluation": ev,
        "hits": ev.all_hits,
        "trace": _step(
            state,
            "signal",
            f"rules v{rs.version}: {len(ev.observations)} patterns, {len(ev.red_flags)} red flags (pure Python, no AI)",
            t0,
            rules=[h.rule_id for h in ev.all_hits],
        ),
    }


def safety(state: State) -> dict:
    t0 = time.perf_counter()
    ev: Evaluation = state["evaluation"]
    detail = "no red flags" if not ev.red_flags else f"red flags first: {', '.join(h.rule_id for h in ev.red_flags)}"
    if ev.crisis:
        detail = "crisis path opened (EPDS item 10); pattern cards held back: " + (", ".join(ev.suppressed) or "none")
    return {"crisis": ev.crisis, "trace": _step(state, "safety", detail, t0)}


def evidence(state: State) -> dict:
    t0 = time.perf_counter()
    out: dict[str, list[dict]] = {}
    for h in state["hits"]:
        node = kb.graph().get(h.rule_id, {})
        ids = list(dict.fromkeys([*h.source_ids, *node.get("sources", [])]))
        q = f"{h.title} {h.explains} {node.get('condition', '')}"
        ps = search(q, k=3, lang=state.get("lang", "en"), source_ids=ids)
        out[h.rule_id] = [
            {"source_id": p.source_id, "title": p.title, "url": p.url, "text": p.text, "lang": p.lang} for p in ps
        ]
    return {
        "evidence": out,
        "trace": _step(
            state,
            "evidence",
            f"retrieved passages for {len(out)} patterns from the guideline graph + hybrid search",
            t0,
        ),
    }


WRITER_SYSTEM = """You write one observation card for a women's health record app. Rules:
- Use ONLY the facts and passages given. Never add numbers, conditions or advice that are not in them.
- Never diagnose. Never write "you have <condition>", "diagnosis of", percentages or chances.
- Plain, calm, kind English at a grade 7 reading level. Short sentences.
Return JSON: {"summary": "<= 2 sentences", "what_to_consider": ["..."]}"""


def _template_card(h: Hit, ev: Evaluation, lang: str, bundle: dict) -> dict:
    f = ev.features.values
    tr = cp.ar_rules().get(h.rule_id, {}) if lang == "ar" else {}
    title = cp.title(h.rule_id, lang) or (tr.get("title") if lang == "ar" else None) or h.title
    if h.kind == "red_flag":
        summary = (tr.get("message") if lang == "ar" else h.message) or h.message
        consider: list[str] = []
    else:
        lead = (
            load_rules()
            .template.get("summary", "We noticed {title_lower}.")
            .format(title_lower=h.title[0].lower() + h.title[1:])
        )
        if lang == "ar":
            lead = f"لاحظنا: {tr.get('title', '')}. هذا ليس تشخيصاً. قد يكون من المفيد مناقشته مع طبيبة."
        summary = f"{lead} {cp.detail(h.rule_id, h.values, f, lang)}".strip()
        consider = tr.get("next_steps") if lang == "ar" and tr.get("next_steps") else list(h.next_steps)
    entries = {e["id"]: e for e in bundle["daily_logs"] + bundle["events"]}
    why_all = [
        {"entry_id": i, "date": str(entries[i]["date"]), "text": cp.entry_text(entries[i], lang)}
        for i in h.supporting_entry_ids
        if i in entries
    ]
    why = why_all[:12]
    srcs = kb.sources()
    return {
        "observation_id": h.rule_id,
        "kind": h.kind,
        "title": title,
        "summary": summary,
        "explains": (tr.get("explains") if lang == "ar" and tr.get("explains") else h.explains),
        "why_we_noticed": why,
        "why_total": len(why_all),  # screens say "and N more" instead of silently cutting the list
        "values": h.values,
        "what_to_consider": consider,
        "questions_for_doctor": cp.questions(h.rule_id, lang),
        "sources": [{"source_id": s, "title": srcs[s].title, "url": srcs[s].url} for s in h.source_ids if s in srcs],
        "urgency": h.urgency,
        "entry_date": h.entry_date,
        "crisis_path": h.crisis_path,
        "creates_care_gap": h.creates_care_gap,
        "written_by": "template",
    }


def writer(state: State) -> dict:
    t0 = time.perf_counter()
    ev: Evaluation = state["evaluation"]
    lang = state.get("lang", "en")
    llm = get_llm()
    ai_on = state["bundle"].get("ai_ok", True)  # her Privacy choice; bundles built outside the database default to on
    use_llm = llm.name != "none" and ai_on
    cards, rejected = [], 0
    names = [state["bundle"]["profile"].get("alias", "")]
    for h in state["hits"]:
        card = _template_card(h, ev, lang, state["bundle"])
        if use_llm and h.kind != "red_flag" and lang == "en":  # urgent copy is never reworded
            facts = {
                "pattern": h.title,
                "numbers": cp.detail(h.rule_id, h.values, ev.features.values),
                "guideline_says": h.explains,
                "next_steps": h.next_steps,
                "passages": [p["text"] for p in state["evidence"].get(h.rule_id, [])],
            }
            user = redact(json.dumps(facts, ensure_ascii=False), names, state["ref"])
            for _attempt in range(3):  # first try + 2 retries
                out = llm.complete_json(WRITER_SYSTEM, user, 800)
                if not out or not isinstance(out.get("summary"), str):
                    break
                text = " ".join([out["summary"], *[str(x) for x in out.get("what_to_consider", [])]])
                if violations(text):
                    rejected += 1
                    continue
                card.update(
                    summary=out["summary"],
                    what_to_consider=[str(x) for x in out.get("what_to_consider", [])][:4],
                    written_by=llm.name,
                )
                break
        cards.append(card)
    return {
        "cards": cards,
        "trace": _step(
            state,
            "writer",
            f"{len(cards)} cards ({llm.name if use_llm else 'template' if ai_on else 'template: she turned AI off'});"
            f" guard rejections: {rejected}",
            t0,
        ),
    }


_SENT = re.compile(r"(?<=[.!?؟])\s+")
_WORDS = re.compile(r"[\w؀-ۿ]+")


def supported(sentence: str, facts: list[str]) -> bool:
    """A sentence is kept if every number in it appears in the facts and it shares enough words with a fact."""
    nums = set(re.findall(r"\d+(?:\.\d+)?", sentence))
    fact_text = " ".join(facts)
    if nums - set(re.findall(r"\d+(?:\.\d+)?", fact_text)):
        return False
    words = {w.lower() for w in _WORDS.findall(sentence) if len(w) > 3}
    if not words:
        return True
    best = max((len(words & {w.lower() for w in _WORDS.findall(f)}) / len(words) for f in facts), default=0.0)
    return best >= 0.34


def verifier(state: State) -> dict:
    t0 = time.perf_counter()
    dropped = 0
    ev: Evaluation = state["evaluation"]
    for card in state["cards"]:
        if card["written_by"] == "template":
            card["verified_sentences"] = len(_SENT.split(card["summary"]))
            card["dropped_sentences"] = 0
            continue
        h = next(x for x in state["hits"] if x.rule_id == card["observation_id"])
        facts = [
            h.title,
            h.explains,
            cp.detail(h.rule_id, h.values, ev.features.values),
            *h.next_steps,
            *[p["text"] for p in state["evidence"].get(h.rule_id, [])],
        ]
        keep = [s for s in _SENT.split(card["summary"]) if s and supported(s, facts)]
        consider = [s for s in card["what_to_consider"] if supported(s, facts)]
        d = len(_SENT.split(card["summary"])) - len(keep) + len(card["what_to_consider"]) - len(consider)
        dropped += d
        if not keep:  # nothing supported: fall back to the template text
            tmpl = _template_card(h, ev, state.get("lang", "en"), state["bundle"])
            card.update(summary=tmpl["summary"], what_to_consider=tmpl["what_to_consider"], written_by="template")
        else:
            card.update(summary=" ".join(keep), what_to_consider=consider or list(h.next_steps))
        card["verified_sentences"], card["dropped_sentences"] = len(keep), d
    return {
        "cards": state["cards"],
        "trace": _step(
            state,
            "verifier",
            f"sentence-level source check: {dropped} unsupported sentences removed",
            t0,
            dropped=dropped,
        ),
    }


def care_gap(state: State) -> dict:
    t0 = time.perf_counter()
    gaps = [c["creates_care_gap"] for c in state["cards"] if c.get("creates_care_gap")]
    return {"trace": _step(state, "care_gap", f"care gaps due: {', '.join(gaps) or 'none'}", t0)}


def _route_after_safety(state: State) -> str:
    return "end" if state.get("crisis") else "evidence"


def build_graph():
    g = StateGraph(State)
    for name, fn in [
        ("intake", intake),
        ("signal", signal),
        ("safety", safety),
        ("evidence", evidence),
        ("writer", writer),
        ("verifier", verifier),
        ("care_gap", care_gap),
    ]:
        g.add_node(name, fn)
    g.add_edge(START, "intake")
    g.add_edge("intake", "signal")
    g.add_edge("signal", "safety")
    g.add_conditional_edges("safety", _route_after_safety, {"end": END, "evidence": "evidence"})
    g.add_edge("evidence", "writer")
    g.add_edge("writer", "verifier")
    g.add_edge("verifier", "care_gap")
    g.add_edge("care_gap", END)
    return g.compile()


_GRAPH = None


def run(bundle: dict, ref: date | None = None, lang: str = "en") -> State:
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = build_graph()
    state: State = {
        "profile_id": bundle["profile"]["id"],
        "bundle": bundle,
        "ref": ref or get_settings().demo_ref_date,
        "lang": lang,
        "trace": [],
        "cards": [],
        "evidence": {},
    }
    out = _GRAPH.invoke(state)
    if out.get("crisis"):  # crisis: only the red-flag cards, written from the rules file, no pattern cards
        ev: Evaluation = out["evaluation"]
        out["cards"] = [_template_card(h, ev, lang, bundle) for h in ev.red_flags]
    return out


def _due_date(gap: str, f: dict, ref: date) -> date | None:
    if gap == "postpartum_glucose_test" and f.get("weeks_since_delivery") is not None:
        return ref + timedelta(weeks=max(0, 12 - int(f["weeks_since_delivery"])))
    if gap == "pregnancy_glucose_screen":
        return ref + timedelta(weeks=max(0, 28 - int(f.get("pregnancy_weeks") or 0)))
    return None


def persist(cur, profile_id: str, out: State) -> None:
    """Store observations (with cards + trace) and open/close care gaps. Runs as the system actor."""
    ev: Evaluation = out["evaluation"]
    ref = out["ref"]
    cur.execute("DELETE FROM observations WHERE profile_id=%s", (profile_id,))
    cards = {c["observation_id"]: c for c in out["cards"]}
    for h in ev.all_hits:
        cur.execute(
            "INSERT INTO observations (profile_id, rule_id, kind, urgency, supporting_entry_ids, values, card, trace)"
            " VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (
                profile_id,
                h.rule_id,
                h.kind,
                h.urgency,
                h.supporting_entry_ids,
                json.dumps(h.values, default=str),
                json.dumps(cards.get(h.rule_id), default=str) if h.rule_id in cards else None,
                json.dumps(out["trace"], default=str),
            ),
        )
    cur.execute(
        "SELECT clinic_id FROM consents WHERE profile_id=%s AND purpose='care_share' AND granted AND revoked_at IS NULL",
        (profile_id,),
    )
    row = cur.fetchone()
    clinic = row["clinic_id"] if row else None
    due = {h.creates_care_gap: h for h in ev.observations if h.creates_care_gap}
    for gap, h in due.items():
        cur.execute(
            "INSERT INTO care_gaps (profile_id, clinic_id, type, rule_id, due_date, status) VALUES (%s,%s,%s,%s,%s,'open')"
            " ON CONFLICT (profile_id, type) DO UPDATE SET clinic_id = EXCLUDED.clinic_id, due_date = EXCLUDED.due_date",
            (profile_id, clinic, gap, h.rule_id, _due_date(gap, ev.features.values, ref)),
        )
    cur.execute("SELECT id, type FROM care_gaps WHERE profile_id=%s AND status <> 'closed'", (profile_id,))
    for g in cur.fetchall():
        if g["type"] not in due:  # rule no longer fires (e.g. the test result arrived): the gap closes itself
            cur.execute(
                "UPDATE care_gaps SET status='closed', updated_at=now(), updated_by='system: rule resolved' WHERE id=%s",
                (g["id"],),
            )


def refresh(profile_id: str, lang: str = "en") -> State:
    from app.services.patient_data import load_bundle

    with session(SYSTEM) as cur:
        bundle = load_bundle(cur, profile_id)
        out = run(bundle, lang=lang)
        persist(cur, profile_id, out)
    return out


def refresh_all(ids: list[str]) -> None:
    for pid in ids:
        refresh(pid)


def cards_for(bundle: dict, lang: str) -> tuple[list[dict], list[dict], bool]:
    """Cards in the requested language (re-written live; cheap and deterministic without an LLM)."""
    out = run(bundle, lang=lang)
    return out["cards"], out["trace"], bool(out.get("crisis"))


def as_jsonable(x: Any) -> Any:
    return json.loads(json.dumps(x, default=str))
