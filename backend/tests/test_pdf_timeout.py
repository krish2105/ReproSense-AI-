"""docs/31 §H, M6: an uploaded PDF is read in a separate process with a time limit. A file that would keep the parser busy
(a crafted or simply enormous PDF) is stopped after PDF_PARSE_TIMEOUT_S and answered with a clear 422, and the API keeps
answering everyone else. An ordinary report still reads exactly as before."""

import time

import pytest
from conftest import login

from app.config import get_settings
from app.services import documents
from tests.test_attack_suite import _pdf


def stuck(data: bytes, max_pages: int) -> str:  # stands in for a parser that never finishes
    time.sleep(30)
    return ""


def test_a_stuck_parse_is_stopped_at_the_time_limit():
    t0 = time.perf_counter()
    with pytest.raises(documents.UnreadablePdf, match="took too long"):
        documents.pdf_text(b"%PDF-1.4 whatever", 30, timeout_s=1, _target=stuck)
    assert time.perf_counter() - t0 < 4


def test_an_ordinary_report_still_reads():
    blob = _pdf([("Sample date: 2026-11-01", False), ("Ferritin   9 ng/mL 15-150 L", False)])
    assert "Ferritin" in documents.pdf_text(blob, 30)


def test_a_stuck_upload_answers_422_and_the_api_keeps_answering(client, monkeypatch, reseed):
    monkeypatch.setattr(documents, "_pdf_text_inner", stuck)
    monkeypatch.setattr(get_settings(), "pdf_parse_timeout_s", 1.0)
    h = login(client, "noura")
    t0 = time.perf_counter()
    r = client.post("/v1/documents", headers=h, files={"file": ("lab.pdf", _pdf([("x", False)]), "application/pdf")})
    assert r.status_code == 422 and "took too long" in r.json()["detail"]
    assert time.perf_counter() - t0 < 5
    assert client.get("/healthz").json() == {"ok": True}
