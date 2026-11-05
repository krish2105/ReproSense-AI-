"""Hybrid retrieval: Postgres full-text rank + pgvector cosine, fused with reciprocal rank fusion (RRF),
then a light re-rank on query-term coverage. Arabic questions are expanded with English terms so they can
retrieve English passages (and vice versa)."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from functools import lru_cache

from app.db import SYSTEM, session
from app.rag.embed import embed, normalise, stem, to_pg, tokens
from app.rag.kb import chunks, sources

GLOSSARY = {  # Arabic term (normalised) -> English expansion. AR-REVIEW
    "تكيس": "pcos polycystic ovary syndrome",
    "المبايض": "ovary ovaries pcos",
    "متلازمه": "syndrome",
    "الدوره": "period cycle",
    "دوره": "period cycle",
    "الدورات": "cycles periods",
    "منتظمه": "regular irregular",
    "غير": "irregular",
    "بطانه": "endometriosis",
    "الرحم": "womb uterus endometriosis",
    "المهاجره": "endometriosis",
    "الم": "pain",
    "الالم": "pain",
    "نزيف": "bleeding heavy",
    "غزير": "heavy",
    "غزيره": "heavy",
    "جلطات": "clots",
    "سكري": "diabetes gestational",
    "السكر": "glucose diabetes",
    "الحمل": "pregnancy pregnant",
    "حامل": "pregnant pregnancy",
    "الولاده": "birth postpartum after birth",
    "بعد": "after",
    "اختبار": "test",
    "تحمل": "tolerance ogtt",
    "الجلوكوز": "glucose ogtt",
    "الخصوبه": "fertility",
    "العقم": "infertility fertility",
    "الانجاب": "fertility conceive",
    "حمض": "folic acid",
    "الفوليك": "folic acid",
    "المزاج": "mood",
    "اكتئاب": "depression mood",
    "الاكتئاب": "depression mood",
    "ادنبره": "edinburgh epds",
    "انقطاع": "menopause",
    "الطمث": "menopause period",
    "الساخنه": "hot flushes",
    "الهبات": "hot flushes",
    "التعرق": "night sweats",
    "حب": "acne",
    "الشباب": "acne",
    "الشعر": "hair growth",
    "دوخه": "dizziness dizzy",
    "اغماء": "fainting",
    "حركه": "movements",
    "الجنين": "baby fetal movements",
    "صداع": "headache",
    "الرؤيه": "vision",
    "الحديد": "iron ferritin anaemia",
    "تعب": "tiredness fatigue",
    "التبرز": "bowel movements",
    "التبول": "urine passing urine",
    "ملفي": "malaffi",
    "ابوظبي": "abu dhabi",
    "العلامات": "signs symptoms",
    "اعراض": "symptoms",
    "الاعراض": "symptoms",
}
_EN_STOP = set(
    "a an and are as at be but by can do does for from how i if in is it its me my of on or should so that "
    "the their there this to was what when where which who why will with you your about after before".split()
)
_EN_STOP |= {
    "متي",
    "ما",
    "ماذا",
    "هل",
    "كيف",
    "لماذا",
    "في",
    "من",
    "علي",
    "عن",
    "هي",
    "هو",
    "ان",
    "الي",
    "مع",
    "قبل",
    "تعتبر",
    "يعتبر",
    "اي",
    "او",
    "لا",
    "هذا",
    "هذه",
    "ذلك",
    "عند",
    "كان",
    "لدي",
    "عندي",
    "انا",
    "اذا",
}


def expand_query(q: str) -> str:
    words = re.findall(r"[\w؀-ۿ]+", normalise(q))
    extra = [GLOSSARY[w] for w in words if w in GLOSSARY]
    extra += [GLOSSARY[w[2:]] for w in words if w.startswith("ال") and w[2:] in GLOSSARY]
    return q + (" " + " ".join(extra) if extra else "")


def query_terms(q: str) -> set[str]:
    return {
        w for w in tokens(expand_query(q)) if len(w) > 1 and w not in _EN_STOP and w not in {stem(s) for s in _EN_STOP}
    }


@lru_cache
def idf() -> dict[str, float]:
    docs = [set(tokens(sources()[c.source_id].title + " " + c.text)) for c in chunks()]
    df: dict[str, int] = {}
    for d in docs:
        for w in d:
            df[w] = df.get(w, 0) + 1
    n = len(docs)
    return {w: math.log(1 + n / c) for w, c in df.items()}


@dataclass
class Passage:
    chunk_id: int
    source_id: str
    title: str
    url: str
    lang: str
    text: str
    score: float


def search(
    q: str, k: int = 4, lang: str | None = None, source_ids: list[str] | None = None, pool: int = 20
) -> list[Passage]:
    eq = expand_query(q)
    terms = sorted(query_terms(q))
    raw = sorted({w for w in re.findall(r"[\w\u0600-\u06FF]+", normalise(eq)) if len(w) > 2 and w not in _EN_STOP})
    ts = " | ".join(f"{w}:*" for w in {*raw, *terms}) or "x"
    vec = to_pg(embed(eq))
    filt, args = "", []
    if source_ids:
        filt = " WHERE source_id = ANY(%s)"
        args = [source_ids]
    with session(SYSTEM) as cur:
        cur.execute(
            f"SELECT id, source_id, title, url, lang, text, ts_rank(tsv, to_tsquery('simple', %s)) AS r"
            f" FROM kb_chunks{filt} ORDER BY r DESC LIMIT %s",
            [ts, *args, pool],
        )
        lex = cur.fetchall()
        cur.execute(
            f"SELECT id, source_id, title, url, lang, text, 1 - (embedding <=> %s::vector) AS r"
            f" FROM kb_chunks{filt} ORDER BY embedding <=> %s::vector LIMIT %s",
            [vec, *args, vec, pool],
        )
        sem = cur.fetchall()
    fused: dict[int, dict] = {}
    for ranked in (lex, sem):
        for rank, row in enumerate(ranked):
            if ranked is lex and row["r"] <= 0:
                continue
            f = fused.setdefault(row["id"], {**row, "rrf": 0.0})
            f["rrf"] += 1.0 / (60 + rank)
    out = []
    weights = idf()
    total = sum(weights.get(x, 3.0) for x in terms) or 1.0
    for f in fused.values():
        words = set(tokens(f["title"] + " " + f["text"]))
        coverage = sum(weights.get(x, 3.0) for x in terms if x in words) / total
        boost = 0.004 if lang and f["lang"] == lang else 0.0
        out.append(
            Passage(
                f["id"],
                f["source_id"],
                f["title"],
                f["url"],
                f["lang"],
                f["text"],
                round(f["rrf"] + 0.05 * coverage + boost, 5),
            )
        )
    out.sort(key=lambda p: p.score, reverse=True)
    return out[:k]
