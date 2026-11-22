"""What a health department would see (showcase day, 22 Nov 2026).

The network dashboard gains a population block: women whose entries match a pattern worth discussing, how many of them
have shared a report with a clinic (by region), patterns by age band, and fertility-assessment timing. Synthetic cohort
only; counts, never rows; every group under 10 is hidden, including parts that could be worked out by subtraction.
"""

import json
import re

from conftest import login

from app.api import admin


def pop(client):
    r = client.get("/v1/admin/metrics", headers=login(client, role="admin"))
    assert r.status_code == 200, r.text
    return r.json()


def test_the_overall_split_adds_up_and_matches_the_fairness_share(client):
    m = pop(client)
    o = m["population"]["overall"]
    assert o["shared"] + o["not_shared"] == o["with_pattern"] > 0
    assert o["with_pattern"] == round(m["fairness"]["overall"]["pct_obs"] * m["cohort"]["n"] / 100)
    assert o["shared_pct"] == round(100.0 * o["shared"] / o["with_pattern"], 1)


def test_regions_and_age_bands_cover_the_cohort(client):
    m = pop(client)
    p = m["population"]
    assert [r["region"] for r in p["regions"]] == [r["region"] for r in m["regions"]]
    assert sum(r["n"] for r in p["regions"]) == m["cohort"]["n"] == sum(a["n"] for a in p["age_bands"])
    assert sum(r["with_pattern"] for r in p["regions"]) == p["overall"]["with_pattern"]
    for a in p["age_bands"]:
        assert all(0 <= a[k] <= 100 for k in ("cycles", "pain", "heavy")), a


def test_fertility_timing_counts_are_consistent(client):
    t = pop(client)["population"]["trying"]
    assert t["trying"] >= t["due"] == t["shared"] + t["not_shared"]


def test_a_part_under_10_hides_the_whole_split():
    hidden = {"with_pattern": None, "shared": None, "not_shared": None, "shared_pct": None}
    assert admin._split(9, 3) == hidden  # the group itself is small
    assert admin._split(40, 4) == hidden  # 4 shared could identify women
    assert admin._split(40, 35) == hidden  # 5 not shared could be worked out by subtraction
    assert admin._split(40, 10) == {"with_pattern": 40, "shared": 10, "not_shared": 30, "shared_pct": 25.0}


def test_counts_only_no_identifiers_no_diagnosis_words(client):
    p = pop(client)["population"]
    text = json.dumps(p)
    assert "SYN-" not in text and "patient_id" not in text
    assert not re.search(r"pcos|endometriosis|diagnos(ed|is of)|prevalence of|detected|screened", text, re.I)
    assert "not diagnoses" in p["note"] and "Synthetic" in p["note"]


def test_only_the_network_role_sees_it(client):
    for h in (login(client, "noura"), login(client, role="clinician")):
        assert client.get("/v1/admin/metrics", headers=h).status_code == 403
    assert client.get("/v1/admin/metrics").status_code in (401, 403)
