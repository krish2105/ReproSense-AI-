"""Safety-case actions from docs/safety/HAZARD_LOG.md found in the 7 Nov rescore.

1. The crisis path hides only the self-harm card: any other red flag stays on Patterns and in the check-in reply.
2. Her own entry for a day comes back with everything the log form needs to reopen it, so a second save the same
   day keeps the first one's answers instead of replacing them with a blank form.
"""

from tests.conftest import login

CRISIS = "RF4_SELF_HARM_THOUGHTS"
MOOD = "OBS_POSTPARTUM_MOOD"
RF1 = "RF1_heavy_bleeding_with_dizziness"


def test_crisis_keeps_other_red_flags_in_checkin_and_patterns(client, reseed):
    h = login(client, "sara")  # her record has heavy bleeding with dizziness today (RF1)
    r = client.post("/v1/questionnaires/epds", headers=h, json={"answers": [1] * 10}).json()
    assert r["crisis"] and r["total"] is None
    ids = [c["observation_id"] for c in r["cards"]]
    assert RF1 in ids and CRISIS not in ids and MOOD not in ids
    ins = client.get("/v1/insights", headers=h).json()
    ids = [c["observation_id"] for c in ins["cards"]]
    assert ins["crisis"] and RF1 in ids and CRISIS not in ids and MOOD not in ids


def test_her_own_entry_comes_back_whole_for_the_log_form(client, reseed):
    h = login(client, "noura")
    body = {
        "date": "2026-11-22",
        "flow": "heavy",
        "pain": 6,
        "pain_sites": [],
        "symptoms": ["cramps"],
        "impact": "reduced activity",
        "sleep_h": 6.5,
        "pbac_items": {"pads": {"soaked": 2}, "clots": {"small": 1}},
        "note": "",
    }
    assert client.post("/v1/logs", headers=h, json=body).status_code == 200
    days = client.get("/v1/timeline", headers=h).json()["days"]
    mine = [d for d in days if d["date"] == "2026-11-22" and d["source"] == "app"]
    assert len(mine) == 1
    d = mine[0]
    assert d["flow"] == "heavy" and d["sleep_h"] == 6.5 and d["symptoms"] == ["cramps"]
    assert d["pbac_items"] == {"pads": {"soaked": 2}, "tampons": {}, "clots": {"small": 1}}
