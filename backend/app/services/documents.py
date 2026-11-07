"""Document AI for lab reports: text (or PDF text) -> extracted values with units and the reference range printed on
the report -> she confirms before anything is saved. Uploaded text is treated strictly as data: instruction-like
lines are stripped and never passed to a model as instructions."""

from __future__ import annotations

import re

TESTS = [  # (code, patterns, canonical unit)
    ("HGB", [r"ha?emoglobin\b(?!\s*a1c)", r"\bhb\b(?!a1c)"], "g/dL"),
    ("FERR", [r"ferritin"], "ng/mL"),
    ("TSH", [r"\btsh\b", r"thyroid stimulating"], "mIU/L"),
    ("PRL", [r"prolactin"], "ng/mL"),
    ("AMH", [r"anti-?m[uü]llerian", r"\bamh\b"], "ng/mL"),
    ("TESTO", [r"testosterone"], "nmol/L"),
    ("HBA1C", [r"hba1c", r"a1c"], "%"),
    ("OGTT2H", [r"ogtt", r"2[- ]?h(ou)?r? glucose", r"glucose tolerance"], "mmol/L"),
    ("FPG", [r"fasting (plasma )?glucose"], "mmol/L"),
]
INJECTION = re.compile(
    r"(ignore (all|previous|the above)|disregard|system prompt|you are now|act as|assistant:|"
    r"instructions?:|<\s*/?\s*script|follow these)",
    re.I,
)
ROW = re.compile(
    r"^(?P<name>.+?)\s{2,}(?P<value>[<>]?\d+(?:\.\d+)?)\s*(?P<unit>[A-Za-z%/µ]+(?:/[A-Za-z]+)?)?\s*"
    r"(?P<ref>(?:[<>]\s*\d+(?:\.\d+)?)|(?:\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?))?\s*(?P<flag>\b[HL]\b)?\s*$"
)
DATE = re.compile(r"(?:sample|collection|collected|date)[^\n:]*:\s*(\d{4}-\d{2}-\d{2})", re.I)


def sanitise(text: str) -> tuple[str, int]:
    kept, dropped = [], 0
    for line in (text or "").splitlines():
        if INJECTION.search(line):
            dropped += 1
            continue
        kept.append(line)
    return "\n".join(kept), dropped


def _normalise(code: str, value: float, unit: str | None) -> tuple[float, str, str | None]:
    """The divisor to the canonical unit, that unit, and a note. The value and its printed range both use the divisor."""
    u = (unit or "").strip()
    if code in ("OGTT2H", "FPG") and u.lower() == "mg/dl":
        return 18.0, "mmol/L", f"converted from {value} mg/dL"
    if code == "HGB" and u.lower() == "g/l":
        return 10.0, "g/dL", f"converted from {value} g/L"
    if code == "FERR" and u.lower() == "µg/l":
        return 1.0, "ng/mL", "µg/L equals ng/mL"
    return 1.0, u or dict((c, cu) for c, _, cu in TESTS)[code], None


def _flag(cmp: str, value: float, lo: float | None, hi: float | None) -> str:
    """H or L from the range. A value printed as "<5" or ">100" is a bound: flag it only when the bound settles it."""
    if cmp == "<":
        return "L" if lo is not None and value <= lo else ""
    if cmp == ">":
        return "H" if hi is not None and value >= hi else ""
    return "H" if hi is not None and value > hi else "L" if lo is not None and value < lo else ""


def extract(text: str) -> dict:
    clean, dropped = sanitise(text)
    m = DATE.search(clean)
    sample_date = m.group(1) if m else None
    rows = []
    for line in clean.splitlines():
        r = ROW.match(line.strip())
        if not r:
            continue
        name = r.group("name").strip()
        code = next((c for c, pats, _ in TESTS if any(re.search(p, name, re.I) for p in pats)), None)
        if not code:
            continue
        raw = r.group("value")
        cmp = raw[0] if raw[0] in "<>" else ""
        num = float(raw.lstrip("<>"))
        div, unit, note = _normalise(code, num, r.group("unit"))
        num = round(num / div, 1) if div != 1.0 else num
        value = f"{cmp}{num:g}" if cmp else num  # "<5" stays "<5": it is saved as text, never as exactly 5
        lo = hi = None
        ref = (r.group("ref") or "").replace(" ", "")
        if "-" in ref:
            lo, hi = (float(x) for x in ref.split("-"))
        elif ref.startswith("<"):
            hi = float(ref[1:])
        elif ref.startswith(">"):
            lo = float(ref[1:])
        if div != 1.0:
            lo, hi = (round(x / div, 1) if x is not None else None for x in (lo, hi))
        flag = r.group("flag") or _flag(cmp, num, lo, hi)
        rows.append(
            {
                "code": code,
                "test": name,
                "value": value,
                "unit": unit,
                "ref_low": lo,
                "ref_high": hi,
                "flag": flag,
                "date": sample_date,
                "note": note,
            }
        )
    return {
        "rows": rows,
        "sample_date": sample_date,
        "injection_lines_removed": dropped,
        "message": "Check each value against your paper report, then confirm. Nothing is saved until you confirm.",
    }


def pdf_text(data: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        return ""
    import io

    return "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(data)).pages)
