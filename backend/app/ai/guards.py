"""Output guard: rejects diagnostic language and fake probabilities (EN + AR). See .claude/skills/clinical-copy-guard.

Plain-substring matching is too blunt ("how you have been feeling" is kind, not diagnostic), so "you have" is
blocked unless it continues with a reporting verb from the allowlist.
"""

from __future__ import annotations

import re

_YOU_HAVE_OK = (
    r"(?:been|had|missed|felt|started|stopped|logged|noticed|recorded|told|tried|said|mentioned|entered|shared|marked|chosen|asked|"
    r"the right|a right|control|questions?|options|time|any)"
)
BANNED_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("you have <condition>", re.compile(rf"\byou have (?!{_YOU_HAVE_OK}\b)", re.I)),
    ("you are diagnosed", re.compile(r"\byou (?:are|were|have been) diagnosed\b", re.I)),
    ("diagnosis of", re.compile(r"\bdiagnosis of\b", re.I)),
    ("% chance", re.compile(r"\d+(?:\.\d+)?\s*%\s*(?:chance|risk|likely|likelihood|probability)", re.I)),
    ("probability of", re.compile(r"\bprobability of\b", re.I)),
    ("you are infertile", re.compile(r"\byou (?:are|might be|may be) infertile\b", re.I)),
    ("cure", re.compile(r"\bcur(?:e|es|ed)\b", re.I)),
    ("guaranteed", re.compile(r"\bguarantee(?:d|s)?\b", re.I)),
    ("لديك متلازمة", re.compile(r"لديك\s+متلازمة")),
    ("تم تشخيصك", re.compile(r"تم\s+تشخيصك")),
    ("نسبة احتمال", re.compile(r"نسبة\s+احتمال")),
    ("أنت مصابة", re.compile(r"أنت\s+مصابة")),
]


def violations(text: str) -> list[str]:
    return [name for name, pat in BANNED_PATTERNS if pat.search(text or "")]


def is_safe(text: str) -> bool:
    return not violations(text)
