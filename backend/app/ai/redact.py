"""De-identify text before any LLM call: aliases, emails, phone numbers, Emirates ID numbers, exact dates."""

from __future__ import annotations

import re
from datetime import date

_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
_PHONE = re.compile(r"(?:\+?971|00971|0)\s?(?:5\d|[2-9])[\s-]?\d{3}[\s-]?\d{4}")
_EID = re.compile(r"\b784[- ]?\d{4}[- ]?\d{7}[- ]?\d\b")
_DATE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")


def redact(text: str, names: list[str] | None = None, ref: date | None = None) -> str:
    t = _EMAIL.sub("[email]", text or "")
    t = _EID.sub("[id]", t)
    t = _PHONE.sub("[phone]", t)
    for n in names or []:
        for part in {n, *n.replace("(fictional)", "").split()}:
            part = part.strip(" .")
            if len(part) > 2:
                t = re.sub(rf"\b{re.escape(part)}\b", "[name]", t)
    if ref:

        def rel(m: re.Match) -> str:
            try:
                d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            except ValueError:
                return "[date]"
            return f"day {(d - ref).days}"

        t = _DATE.sub(rel, t)
    return t
