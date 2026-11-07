"""Rules engine: evaluates rules/clinical_rules.yaml (the ONLY place observation logic lives).

Red flags run first. Day-level red flags ("..._today") are checked against every log in the last
`red_flag_window_days` (QUESTIONS #17 default, pending clinician sign-off) so an urgent entry stays pinned
with its date. EPDS item 10 > 0 opens the crisis path and suppresses the mood pattern card (CLAUDE.md rule 5).
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date, timedelta
from functools import lru_cache
from typing import Any

import yaml

from app.config import RULES_PATH
from app.rules import expr
from app.rules.features import DAY_SYMPTOMS, FeatureSet, compute, day_context

SUPPRESSED_BY_CRISIS = {"OBS_POSTPARTUM_MOOD"}


@dataclass
class Rule:
    id: str
    section: str  # red_flags | observations
    when: str
    node: expr.Node
    urgency: str
    title_en: str = ""
    message_en: str = ""
    explains: str = ""
    next_steps_en: list[str] = field(default_factory=list)
    source_ids: list[str] = field(default_factory=list)
    creates_care_gap: str | None = None
    crisis_path: bool = False
    extra: dict = field(default_factory=dict)

    @property
    def kind(self) -> str:
        if self.section == "red_flags":
            return "red_flag"
        return "care" if self.id.startswith("CARE_") else "observation"


@dataclass
class Hit:
    rule_id: str
    kind: str
    urgency: str
    title: str
    message: str
    explains: str
    next_steps: list[str]
    source_ids: list[str]
    supporting_entry_ids: list[str]
    values: dict[str, Any]
    creates_care_gap: str | None = None
    crisis_path: bool = False
    entry_date: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class RuleSet:
    version: str
    emergency_number: str
    red_flags: list[Rule]
    observations: list[Rule]
    template: dict
    questionnaires: list[dict]
    raw: dict

    def by_id(self, rid: str) -> Rule | None:
        return next((r for r in self.red_flags + self.observations if r.id == rid), None)


@lru_cache
def load_rules(path: str = str(RULES_PATH)) -> RuleSet:
    raw = yaml.safe_load(open(path, encoding="utf-8"))
    known = {
        "id",
        "when",
        "urgency",
        "title_en",
        "message_en",
        "explains",
        "next_steps_en",
        "source_ids",
        "creates_care_gap",
        "crisis_path",
    }

    def build(section: str) -> list[Rule]:
        out = []
        for r in raw.get(section, []):
            out.append(
                Rule(
                    id=r["id"],
                    section=section,
                    when=r["when"],
                    node=expr.parse(r["when"]),
                    urgency=r.get("urgency", "discuss"),
                    title_en=r.get("title_en", ""),
                    message_en=r.get("message_en", ""),
                    explains=r.get("explains", ""),
                    next_steps_en=list(r.get("next_steps_en", [])),
                    source_ids=list(r.get("source_ids", [])),
                    creates_care_gap=r.get("creates_care_gap"),
                    crisis_path=bool(r.get("crisis_path")),
                    extra={k: v for k, v in r.items() if k not in known},
                )
            )
        return out

    return RuleSet(
        version=str(raw.get("version")),
        emergency_number=str(raw.get("emergency_number_uae", "998")),
        red_flags=build("red_flags"),
        observations=build("observations"),
        template=raw.get("template", {}),
        questionnaires=raw.get("validated_questionnaires", []),
        raw=raw,
    )


@dataclass
class Evaluation:
    features: FeatureSet
    red_flags: list[Hit]
    observations: list[Hit]
    crisis: bool
    suppressed: list[str]

    @property
    def all_hits(self) -> list[Hit]:
        return self.red_flags + self.observations


def _values_for(rule: Rule, ctx: dict) -> dict:
    return {n: ctx.get(n) for n in sorted(expr.names(rule.node)) if n in ctx and not n.isupper()}


def evaluate(bundle: dict, ref: date, window_days: int = 14, rules: RuleSet | None = None) -> Evaluation:
    rs = rules or load_rules()
    fs = compute(bundle, ref)
    base = dict(fs.values)
    no_day = {k: False for k in DAY_SYMPTOMS}
    rule_ids = {r.id: False for r in rs.red_flags + rs.observations}
    window = [
        lg
        for lg in bundle.get("daily_logs", [])
        if ref - timedelta(days=window_days) <= date.fromisoformat(str(lg["date"])) <= ref
    ]
    # A date can hold more than one row (a second tab, the phone app, a seeded row plus her own entry). Red flags read
    # every row for a date together, so heavy flow in one row and dizziness in another still raise RF1 (7 Nov, 4a).
    by_day: dict[str, list[dict]] = {}
    for lg in window:
        by_day.setdefault(str(lg["date"]), []).append(lg)
    days = sorted(by_day.items(), reverse=True)  # newest first

    red: list[Hit] = []
    for r in rs.red_flags:
        hit_ids, hit_date, ctx_hit = None, None, None
        ctx0 = {**base, **no_day, **rule_ids}
        if expr.evaluate(r.node, ctx0):
            ctx_hit = ctx0
        else:
            names = expr.names(r.node)
            for day, rows in days:
                row_ctx = [day_context(lg) for lg in rows]
                merged = {k: any(c[k] for c in row_ctx) for k in DAY_SYMPTOMS}
                ctx = {**base, **merged, **rule_ids}
                if expr.evaluate(r.node, ctx):
                    used = [lg["id"] for lg, c in zip(rows, row_ctx, strict=True) if any(c.get(n) for n in names)]
                    hit_ids, hit_date, ctx_hit = used or [rows[0]["id"]], day, ctx
                    break
        if ctx_hit is None:
            continue
        ids = hit_ids if hit_ids else [i for n in expr.names(r.node) for i in fs.evidence.get(n, [])]
        red.append(
            Hit(
                r.id,
                r.kind,
                r.urgency,
                r.title_en or r.message_en,
                r.message_en,
                r.explains,
                r.next_steps_en,
                r.source_ids,
                ids,
                _values_for(r, ctx_hit),
                None,
                r.crisis_path,
                hit_date,
            )
        )

    crisis = any(h.crisis_path for h in red)
    hits_so_far = {h.rule_id for h in red}
    obs: list[Hit] = []
    suppressed: list[str] = []
    evidence_by_rule: dict[str, list[str]] = {}
    for r in rs.observations:
        ctx = {**base, **no_day, **rule_ids, **{rid: True for rid in hits_so_far}}
        if not expr.evaluate(r.node, ctx):
            continue
        hits_so_far.add(r.id)
        ids: list[str] = []
        # Its own clause first (e.g. the androgen-symptom days for the androgen card), then the entries of a pattern it
        # builds on (the irregular cycle starts), so the first entries a doctor sees are the ones the card is about.
        for n in sorted(expr.names(r.node), key=lambda name: (name in evidence_by_rule, name)):
            ids += evidence_by_rule.get(n, []) if n in evidence_by_rule else fs.evidence.get(n, [])
        ids = list(dict.fromkeys(ids))
        evidence_by_rule[r.id] = ids
        if crisis and r.id in SUPPRESSED_BY_CRISIS:
            suppressed.append(r.id)
            continue
        obs.append(
            Hit(
                r.id,
                r.kind,
                r.urgency,
                r.title_en,
                "",
                r.explains,
                r.next_steps_en,
                r.source_ids,
                ids,
                _values_for(r, ctx),
                r.creates_care_gap,
                False,
                None,
            )
        )
    return Evaluation(fs, red, obs, crisis, suppressed)
