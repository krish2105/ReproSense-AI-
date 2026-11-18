"""Curated knowledge base: sources.yaml (links) + knowledge_base/summaries/*.md (our own words, EN + AR)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache

import yaml

from app.config import GRAPH_PATH, SOURCES_PATH, SUMMARIES_DIR


@dataclass(frozen=True)
class Source:
    id: str
    title: str
    url: str
    publisher: str = ""
    answers: bool = True  # false: cite-only (backs a fixed urgent or crisis reply; never quoted in general answers)
    quote: bool = True  # false: indexed (evidence, model answers) but never quoted by the word-match picker


@dataclass(frozen=True)
class Chunk:
    source_id: str
    lang: str
    section: str
    text: str


@lru_cache
def sources() -> dict[str, Source]:
    return {
        s["id"]: Source(
            s["id"], s["title"], s["url"], s.get("publisher", ""), s.get("answers", True), s.get("quote", True)
        )
        for s in yaml.safe_load(SOURCES_PATH.read_text())
    }


@lru_cache
def graph() -> dict[str, dict]:
    return {n["rule"]: n for n in yaml.safe_load(GRAPH_PATH.read_text())["nodes"]}


def _sections(md: str) -> dict[str, str]:
    body = re.sub(r"^---.*?---\s*", "", md, flags=re.S)
    out, cur = {}, None
    for line in body.splitlines():
        m = re.match(r"^##\s+(en|ar)\s*$", line.strip())
        if m:
            cur = m.group(1)
            out[cur] = []
        elif cur:
            out[cur].append(line)
    return {k: "\n".join(v).strip() for k, v in out.items()}


@lru_cache
def chunks() -> list[Chunk]:
    out: list[Chunk] = []
    for sid, src in sources().items():
        if not src.answers:
            continue
        md = (SUMMARIES_DIR / f"{sid}.md").read_text(encoding="utf-8")
        for lang, text in _sections(md).items():
            for i, para in enumerate(p.strip() for p in text.split("\n\n") if p.strip()):
                out.append(Chunk(sid, lang, f"{lang}-{i + 1}", para))
    return out


def summary(source_id: str, lang: str = "en") -> str:
    return " ".join(c.text for c in chunks() if c.source_id == source_id and c.lang == lang)
