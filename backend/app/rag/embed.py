"""Embeddings. Built-in `hashing` provider: character 3-5-grams + words hashed into 256 dimensions (L2-normalised).
It is deterministic, offline and language-agnostic, so the demo needs no model download or key. It is a lexical
stand-in for a multilingual embedding model (QUESTIONS #14): swap via EMBEDDINGS_PROVIDER without changing callers."""

from __future__ import annotations

import hashlib
import math
import re

DIM = 256
_WORD = re.compile(r"[\w؀-ۿ]+", re.U)
_AR_DIACRITICS = re.compile(r"[ً-ْٰـ]")


def normalise(text: str) -> str:
    t = _AR_DIACRITICS.sub("", text.lower())
    return t.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ى", "ي").replace("ة", "ه")


def _h(s: str) -> int:
    return int.from_bytes(hashlib.blake2b(s.encode(), digest_size=4).digest(), "little")


def embed(text: str) -> list[float]:
    v = [0.0] * DIM
    for w in _WORD.findall(normalise(text)):
        v[_h("w:" + w) % DIM] += 2.0
        g = f" {w} "
        for n in (3, 4, 5):
            for i in range(len(g) - n + 1):
                v[_h(g[i : i + n]) % DIM] += 1.0
    norm = math.sqrt(sum(x * x for x in v)) or 1.0
    return [round(x / norm, 6) for x in v]


def to_pg(vec: list[float]) -> str:
    return "[" + ",".join(f"{x:.6f}" for x in vec) + "]"


_AR_PREFIXES = ("وال", "بال", "كال", "فال", "لل", "ال", "و", "ب", "ل", "ف")
_AR_SUFFIXES = ("ات", "ون", "ين", "ها", "ه", "ا", "ي")


def stem(w: str) -> str:
    """Very light stemming so 'bleeding'~'bleed', 'scoring'~'score', «الغزيرة»~«غزيرة». Matching only, never display."""
    if re.search(r"[؀-ۿ]", w):
        for p in _AR_PREFIXES:
            if w.startswith(p) and len(w) - len(p) >= 3:
                w = w[len(p) :]
                break
        for s in _AR_SUFFIXES:
            if w.endswith(s) and len(w) - len(s) >= 3:
                return w[: -len(s)]
        return w
    for s, n in (("'s", 3), ("ing", 6), ("ed", 5), ("es", 5), ("s", 4)):
        if w.endswith(s) and len(w) > n and not w.endswith("ss"):
            w = w[: -len(s)]
            break
    return w[:-1] if w.endswith("e") and len(w) > 4 else w


def tokens(text: str) -> list[str]:
    return [stem(w) for w in _WORD.findall(normalise(text))]
