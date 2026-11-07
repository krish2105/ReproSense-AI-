"""Arabic counted nouns on pattern cards (women-care-lead review, 7 Nov): a fixed أيام / يوماً / أسابيع / أشهر after a
number that changes is wrong at 2 (dual) and at 11 or more (singular). These must read right for any count."""

from app.agents import copy as cp


def test_counted_noun_follows_the_number():
    days = ("يوم واحد", "يومين", "أيام", "يوماً")
    assert cp._ar_n(1, *days) == "يوم واحد"
    assert cp._ar_n(2, *days) == "يومين"
    assert cp._ar_n(8, *days) == "8 أيام"
    assert cp._ar_n(12, *days) == "12 يوماً"


def test_card_sentences_agree_at_2_and_at_11_plus():
    ar = lambda rule, **f: cp.detail(rule, {}, f, "ar")  # noqa: E731
    assert "استمرت يومين" in ar("OBS_HEAVY_OR_LONG_PERIODS", pbac_max_6=120, period_duration_max=2)
    assert "استمرت 12 يوماً" in ar("OBS_HEAVY_OR_LONG_PERIODS", pbac_max_6=120, period_duration_max=12)
    assert "قبل 12 أسبوعاً" in ar("CARE_POSTPARTUM_GLUCOSE_TEST", weeks_since_delivery=12)
    assert "بعد 9 أسابيع" in ar("OBS_POSTPARTUM_MOOD", epds_latest_total=12, weeks_since_delivery=9)
    assert "منذ 14 شهراً" in ar("OBS_TTC_FERTILITY_ASSESSMENT", ttc_months=14, age=36)
    for rule, key in (
        ("OBS_IRREGULAR_PLUS_ANDROGEN", "androgen_symptom_days_90"),
        ("OBS_HEAVY_WITH_FATIGUE", "fatigue_days_90"),
        ("OBS_PERIMENOPAUSE_SYMPTOMS", "vasomotor_days_90"),
    ):
        assert "في 2 من آخر 90 يوماً" in ar(rule, **{key: 2}), rule
