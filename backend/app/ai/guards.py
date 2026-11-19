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
    r"diabetes|a thyroid|thyroid disease|postnatal depression|postpartum depression|pre-?eclampsia)"
)
# Arabic condition words, written as they look after _norm (no short vowels, bare alef).
_CONDITION_AR = r"(?:متلازمة|تكيس|انتباذ|بطانة الرحم المهاجرة|عقم|فقر الدم|سكري|اكتئاب|قصور الغدة|خمول الغدة|تسمم الحمل|حمل خارج الرحم)"
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
    # Issue #99 (19 Nov audit): diagnosis by inference or hedging. Teaching sentences ("doctors look at when
    # considering PCOS", "symptoms that suggest heavy bleeding") still pass: these need a condition name right after.
    (
        "suggests <condition>",
        re.compile(
            rf"\b(?:suggests?|suggesting|indicates?|indicating|points? to|(?:is |are )?consistent with|typical of)\s+(?:an?\s+|the\s+)?{_CONDITION_EN}\b",
            re.I,
        ),
    ),
    ("you seem to have", re.compile(rf"\byou (?:seem|appear) to have (?!{_YOU_HAVE_OK}\b)", re.I)),
    (
        "it is likely <condition>",
        re.compile(rf"\b(?:it|this|that)(?:'s|’s| is| was) (?:likely|probably|possibly|most likely|definitely)\s+(?:an?\s+)?{_CONDITION_EN}\b", re.I),
    ),
    (
        "you are suffering from <condition>",
        re.compile(rf"\byou(?:'re|’re| are| might be| may be| could be)?\s+suffer(?:ing|s)? from\s+(?:an?\s+)?{_CONDITION_EN}\b", re.I),
    ),
    ("you've got <condition>", re.compile(rf"\byou(?:'ve|’ve| have)? got\s+(?:an?\s+)?{_CONDITION_EN}\b", re.I)),
    ("this could be <condition>", re.compile(rf"\b(?:this|that|it) (?:could|may|might|must) be\s+(?:an?\s+)?{_CONDITION_EN}\b", re.I)),
    ("تعانين من <condition>", re.compile(rf"تعانين\s+من\s+{_CONDITION_AR}")),
    ("قد تكونين مصابة", re.compile(r"(?:قد|ربما)\s+تكونين\s+مصاب")),
    ("يبدو أنك مصابة", re.compile(r"يبدو\s+ان(?:ك|كي)\s+مصاب")),
    ("فيك / عندج <condition>", re.compile(rf"(?:فيك|فيج|عندج|عندكي)\s+{_CONDITION_AR}")),
    ("تدل على <condition>", re.compile(rf"(?:تدل|يدل|تشير|يشير)\s+(?:على|علي|الى|الي)\s+{_CONDITION_AR}")),
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
