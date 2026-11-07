"""Truth and data-loss fixes from the second 7 Nov rescore (senior judge on d6b298a)."""

from pathlib import Path

from app.reports.pdf import lab_range
from tests.conftest import login

ROOT = Path(__file__).resolve().parents[2]


def test_a_log_save_keeps_the_mood_she_tapped(client, reseed):
    # The log form sends no mood; the upsert wrote NULL over the mood she had just set on Home.
    h = login(client, "noura")
    assert client.post("/v1/mood", headers=h, json={"mood": "tired"}).status_code == 200
    log = {"date": "2026-11-22", "flow": "light", "pain": 2, "symptoms": [], "impact": "none", "note": ""}
    assert client.post("/v1/logs", headers=h, json=log).status_code == 200
    days = client.get("/v1/timeline", headers=h).json()["days"]
    mine = [d for d in days if d["date"] == "2026-11-22" and d["source"] == "app"]
    assert mine and mine[0]["mood"] == "tired" and mine[0]["flow"] == "light"


def test_the_server_sets_the_lab_flag_from_the_value_she_confirms(client, reseed):
    # She corrected a misread value; the flag from extraction time was stored and printed in the doctor PDF.
    h = login(client, "fatima")
    text = (ROOT / "data/synthetic/demo_uploads/fatima_postnatal_ogtt.txt").read_bytes()
    up = client.post("/v1/documents", headers=h, files={"file": ("ogtt.txt", text, "text/plain")}).json()
    rows = {r["code"]: dict(r) for r in up["rows"]}
    rows["FPG"].update(value="7.0", flag="")  # above its < 6.1 range: must be H
    rows["OGTT2H"].update(value="7.1", flag="H")  # inside its < 7.8 range: must not be H
    rows["HBA1C"].update(value="<5", flag="H")  # a bound inside < 5.7 settles nothing: no flag
    client.post(f"/v1/documents/{up['id']}/confirm", headers=h, json={"rows": list(rows.values())})
    labs = {lab["code"]: lab for lab in client.get("/v1/timeline", headers=h).json()["labs"] if lab["date"] == "2026-11-20"}
    assert (labs["FPG"]["flag"], labs["OGTT2H"]["flag"], labs["HBA1C"]["flag"]) == ("H", "", "")


def test_one_sided_ranges_print_with_their_sign():
    assert lab_range(12.0, 15.0) == "12.0–15.0"
    assert lab_range(None, 5.6) == "&lt; 5.6"  # was "–5.6", which reads as minus 5.6
    assert lab_range(15, None) == "&gt; 15"
    assert lab_range(None, None) == ""
