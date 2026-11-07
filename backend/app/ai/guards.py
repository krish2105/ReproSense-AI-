"""Output guard: rejects diagnostic language and fake probabilities (EN + AR). See .claude/skills/clinical-copy-guard.

Plain-substring matching is too blunt ("how you have been feeling" is kind, not diagnostic), so "you have" is
blocked unless it continues with a reporting verb from the allowlist. Hedged forms ("you likely have") use the same
allowlist. Arabic is matched after removing short vowels and tatweel and unifying alef forms, so the app's own
feminine forms (لديكِ، أنتِ) and plain spellings (انتي) match one pattern.
"""

from __future__ import annotations

import re

_YOU_HAVE_OK = (
    r"(?:been|had|missed|felt|started|stopped|logged|noticed|recorded|told|tried|said|mentioned|entered|shared|marked|chosen|asked|"
    r"the right|a right|control|questions?|options|time|any)"
)
_HEDGE = r"(?:likely|probably|possibly|may|might|could)"
_CONDITION_EN = (
    r"(?:pcos|polycystic|endometriosis|adenomyosis|fibroids|infertility|an? ectopic|a miscarriage|anaemia|anemia|"
    r"diabetes|a thyroid|thyroid disease|postnatal depression|postpartum depression)"
)
# Arabic condition words, written as they look after _norm (no short vowels, bare alef).
_CONDITION_AR = r"(?:متلازمة|تكيس|انتباذ|بطانة الرحم المهاجرة|عقم|فقر الدم|سكري|اكتئاب|قصور الغدة|خمول الغدة)"
BANNED_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("you have <condition>", re.compile(rf"\byou have (?!{_YOU_HAVE_OK}\b)", re.I)),
    ("you likely have <condition>", re.compile(rf"\byou {_HEDGE} have (?!{_YOU_HAVE_OK}\b)", re.I)),
    ("this looks like <condition>", re.compile(rf"\b(?:this|that|it) (?:looks|sounds|seems) like {_CONDITION_EN}\b", re.I)),
    ("you are diagnosed", re.compile(r"\byou (?:are|were|have been) diagnosed\b", re.I)),
    ("diagnosis of", re.compile(r"\bdiagnosis of\b", re.I)),
    ("% chance", re.compile(r"\d+(?:\.\d+)?\s*%\s*(?:chance|risk|likely|likelihood|probability)", re.I)),
    ("probability of", re.compile(r"\bprobability of\b", re.I)),
    ("you are infertile", re.compile(r"\byou (?:are|might be|may be) infertile\b", re.I)),
    ("cure", re.compile(r"\bcur(?:e|es|ed)\b", re.I)),
    ("guaranteed", re.compile(r"\bguarantee(?:d|s)?\b", re.I)),
    ("لديك متلازمة", re.compile(rf"(?:لديك|عندك)\s+{_CONDITION_AR}")),
    ("تم تشخيصك", re.compile(r"تم\s+تشخيصك")),
    ("نسبة احتمال", re.compile(r"نسبة\s+احتمال")),
    ("أنت مصابة", re.compile(r"انت(?:ي)?\s+مصابة")),
]
_TASHKEEL = re.compile(r"[\u064B-\u0652\u0670\u0640]")  # short vowels, shadda, sukun, dagger alef, tatweel
_ALEF = str.maketrans("أإآ", "ااا")


def _norm(text: str) -> str:
    return _TASHKEEL.sub("", text or "").translate(_ALEF)


def violations(text: str) -> list[str]:
    t = _norm(text)
    return [name for name, pat in BANNED_PATTERNS if pat.search(t)]


def is_safe(text: str) -> bool:
    return not violations(text)
