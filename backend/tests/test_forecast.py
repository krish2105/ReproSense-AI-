"""docs/31 §G: her next period as an honest date range worked out from her own cycles, never a fixed 28 days and never a
percentage.

- regular cycles: centred on the median of her last 6 lengths, half-width max(2, ceil(1.4826 x MAD)) days, at most 7;
- cycles that vary (the irregular pattern, a spread over 7 days, perimenopause): from her shortest to her longest
  recent cycle, said plainly;
- fewer than 2 complete cycles: no date at all.
"""

from datetime import date

from app.services.forecast import forecast

START = date(2026, 11, 10)


def test_fewer_than_two_complete_cycles_gives_no_date():
    assert forecast([], START, varied=False) is None
    assert forecast([29], START, varied=False) is None
    assert forecast([29, None], START, varied=False) is None  # the running cycle has no length yet


def test_regular_cycles_give_a_narrow_range_round_her_median():
    f = forecast([28, 29, 30, 29, 28, 29], START, varied=False)
    # median 29, MAD 0.5 -> 1.4826 x 0.5 = 0.74 -> at least 2 days either side
    assert (f["from"], f["to"]) == ("2026-12-07", "2026-12-11")
    assert f["kind"] == "regular" and f["cycles_used"] == 6


def test_the_range_widens_with_her_own_spread_but_never_past_7_days():
    f = forecast([26, 31, 28, 33, 27, 30], START, varied=False)  # median 29, MAD 2 -> ceil(2.97) = 3
    assert (f["from"], f["to"]) == ("2026-12-06", "2026-12-12")
    wide = forecast([20, 40, 22, 38, 24, 36], START, varied=False)  # median 30, MAD 8 -> 12, capped at 7
    assert (wide["from"], wide["to"]) == ("2026-12-03", "2026-12-17")


def test_varied_cycles_say_so_with_her_shortest_and_longest():
    f = forecast([51, 46, 45, 55, 42, 46, 56], START, varied=True)  # uses the last 6: 46..56
    assert f["kind"] == "varied" and (f["shortest"], f["longest"]) == (42, 56)
    assert (f["from"], f["to"]) == ("2026-12-22", "2027-01-05")


def test_only_her_last_six_cycles_count():
    old_then_new = [60, 60, 60, 29, 29, 29, 29, 29, 29]
    assert forecast(old_then_new, START, varied=False)["cycles_used"] == 6
    assert forecast(old_then_new, START, varied=False)["to"] == "2026-12-11"


def test_never_a_percentage():
    f = forecast([28, 29, 30], START, varied=False)
    assert set(f) == {"from", "to", "kind", "cycles_used", "shortest", "longest"}
    assert not any("%" in str(v) for v in f.values())
