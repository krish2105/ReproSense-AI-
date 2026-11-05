"""Build the RAG index in Postgres (kb_chunks: text + tsvector + pgvector). Run: uv run python -m app.rag.ingest"""

from __future__ import annotations

from app.db import SYSTEM, session
from app.rag.embed import embed, to_pg
from app.rag.kb import chunks, sources


def ingest() -> int:
    srcs = sources()
    rows = chunks()
    with session(SYSTEM) as cur:
        cur.execute("DELETE FROM kb_chunks")
        for c in rows:
            s = srcs[c.source_id]
            cur.execute(
                "INSERT INTO kb_chunks (source_id, title, url, section, lang, text, embedding)"
                " VALUES (%s,%s,%s,%s,%s,%s,%s::vector)",
                (c.source_id, s.title, s.url, c.section, c.lang, c.text, to_pg(embed(f"{s.title}\n{c.text}"))),
            )
    return len(rows)


if __name__ == "__main__":
    print(f"indexed {ingest()} chunks")
