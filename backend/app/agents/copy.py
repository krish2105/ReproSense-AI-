"""Deterministic card copy built from her own numbers (clinical-copy-guard: non-diagnostic, traceable, actionable, kind).
Logic stays in rules/clinical_rules.yaml; this file only turns rule values into plain sentences. Arabic: AR-REVIEW."""

from __future__ import annotations

from datetime import date
from functools import lru_cache

import yaml

from app.config import ROOT


@lru_cache
def ar_rules() -> dict:
    return yaml.safe_load((ROOT / "rules" / "translations_ar.yaml").read_text(encoding="utf-8")) or {}


def _fmt_day(s: str, lang: str = "en", year: bool = False) -> str:
    d = date.fromisoformat(s)
    if lang == "ar":
        months = [
            "يناير",
            "فبراير",
            "مارس",
            "أبريل",
            "مايو",
            "يونيو",
            "يوليو",
            "أغسطس",
            "سبتمبر",
            "أكتوبر",
            "نوفمبر",
            "ديسمبر",
        ]
        return f"{d.day} {months[d.month - 1]}" + (f" {d.year}" if year else "")
    return f"{d.day} {d:%b}" + (f" {d.year}" if year else "")  # %-d is glibc-only


RF_TITLES = {  # short urgent titles; the full message comes from the rules file
    "RF1_heavy_bleeding_with_dizziness": (
        "Very heavy bleeding with dizziness needs urgent care",
        "النزيف الغزير مع الدوخة يحتاج رعاية عاجلة",
    ),
    "RF2_severe_sudden_pain_possible_pregnancy": (
        "Sudden severe pelvic pain needs urgent care",
        "الألم الحوضي المفاجئ الشديد يحتاج رعاية عاجلة",
    ),
    "RF3_postmenopausal_or_pregnancy_bleeding": (
        "Bleeding in pregnancy should be checked today",
        "النزيف أثناء الحمل يجب فحصه اليوم",
    ),
    "RF4_SELF_HARM_THOUGHTS": ("You deserve support right now", "أنتِ تستحقين الدعم الآن"),
    "RF5_PREGNANCY_WARNING_SIGNS": ("These pregnancy signs need checking today", "علامات الحمل هذه تحتاج فحصاً اليوم"),
    "RF6_POSTPARTUM_WARNING_SIGNS": (
        "These signs after birth need urgent care",
        "هذه العلامات بعد الولادة تحتاج رعاية عاجلة",
    ),
}


def title(rule_id: str, lang: str = "en") -> str | None:
    t = RF_TITLES.get(rule_id)
    return (t[1] if lang == "ar" else t[0]) if t else None


def detail(rule_id: str, v: dict, f: dict, lang: str = "en", entry_date: str | None = None) -> str:
    """One sentence with the numbers behind the pattern."""
    lens = f.get("cycle_lengths_last6") or []
    rng = f"{min(lens)}–{max(lens)}" if lens else ""
    en = {
        "OBS_IRREGULAR_CYCLES": f"{f.get('irregular_cycle_count_6')} of your last {len(lens)} cycles were shorter than 21 or longer than 35 days (they ranged from {rng} days).",
        "OBS_IRREGULAR_PLUS_ANDROGEN": f"You logged acne or extra hair growth on {f.get('androgen_symptom_days_90')} days in the last 90 days, alongside irregular cycles.",
        "OBS_SEVERE_CYCLICAL_PAIN": f"Your period pain reached 7 out of 10 or more in {f.get('severe_pain_cycles_6')} of your last 6 periods, and you logged missing work or study on {f.get('pain_impact_days_90')} days in the last 90 days.",
        "OBS_CYCLICAL_BOWEL_BLADDER_PAIN": "You logged pain with bowel movements or passing urine during your periods in at least 2 cycles.",
        "OBS_HEAVY_OR_LONG_PERIODS": f"Your highest bleeding score (PBAC) in the last 6 periods was {f.get('pbac_max_6')}, and your longest period lasted {f.get('period_duration_max')} days.",
        "OBS_HEAVY_WITH_FATIGUE": f"You logged tiredness on {f.get('fatigue_days_90')} days in the last 90 days, alongside heavy periods.",
        "OBS_NO_PERIOD_90_DAYS": f"Your last logged period started {f.get('days_since_last_period')} days ago.",
        "CARE_POSTPARTUM_GLUCOSE_TEST": f"You had gestational diabetes in your last pregnancy, your baby was born {f.get('weeks_since_delivery')} weeks ago, and no glucose test after birth is recorded.",
        "OBS_TTC_FERTILITY_ASSESSMENT": f"You have been trying to conceive for {f.get('ttc_months')} months and you are {f.get('age')}.",
        "CARE_PREGNANCY_GLUCOSE_SCREEN": f"You are {f.get('pregnancy_weeks')} weeks pregnant and no glucose test in this pregnancy is recorded yet.",
        "OBS_POSTPARTUM_MOOD": f"Your latest mood check (EPDS) total was {f.get('epds_latest_total')}, {f.get('weeks_since_delivery')} weeks after birth.",
        "OBS_PERIMENOPAUSE_SYMPTOMS": f"You logged hot flushes or night sweats on {f.get('vasomotor_days_90')} days in the last 90 days.",
    }
    ar = {
        "OBS_IRREGULAR_CYCLES": f"{f.get('irregular_cycle_count_6')} من آخر {len(lens)} دورات كانت أقصر من 21 يوماً أو أطول من 35 يوماً (تراوحت بين {rng} يوماً).",
        "OBS_IRREGULAR_PLUS_ANDROGEN": f"سجّلتِ حب الشباب أو نمو الشعر الزائد في {f.get('androgen_symptom_days_90')} يوماً خلال آخر 90 يوماً، مع دورات غير منتظمة.",
        "OBS_SEVERE_CYCLICAL_PAIN": f"وصل ألم الدورة إلى 7 من 10 أو أكثر في {f.get('severe_pain_cycles_6')} من آخر 6 دورات، وسجّلتِ الغياب عن العمل أو الدراسة في {f.get('pain_impact_days_90')} أيام خلال آخر 90 يوماً.",
        "OBS_CYCLICAL_BOWEL_BLADDER_PAIN": "سجّلتِ ألماً أثناء التبرز أو التبول خلال الدورة في دورتين على الأقل.",
        "OBS_HEAVY_OR_LONG_PERIODS": f"أعلى مجموع لفقدان الدم (PBAC) في آخر 6 دورات كان {f.get('pbac_max_6')}، وأطول دورة استمرت {f.get('period_duration_max')} أيام.",
        "OBS_HEAVY_WITH_FATIGUE": f"سجّلتِ التعب في {f.get('fatigue_days_90')} يوماً خلال آخر 90 يوماً، مع دورات غزيرة.",
        "OBS_NO_PERIOD_90_DAYS": f"بدأت آخر دورة مسجّلة قبل {f.get('days_since_last_period')} يوماً.",
        "CARE_POSTPARTUM_GLUCOSE_TEST": f"كان لديكِ سكري الحمل في حملك الأخير، ووُلد طفلك قبل {f.get('weeks_since_delivery')} أسابيع، ولا يوجد فحص سكر مسجّل بعد الولادة.",
        "OBS_TTC_FERTILITY_ASSESSMENT": f"تحاولين الحمل منذ {f.get('ttc_months')} أشهر وعمرك {f.get('age')} سنة.",
        "CARE_PREGNANCY_GLUCOSE_SCREEN": f"أنتِ في الأسبوع {f.get('pregnancy_weeks')} من الحمل ولا يوجد فحص سكر مسجّل في هذا الحمل بعد.",
        "OBS_POSTPARTUM_MOOD": f"كان مجموع آخر فحص للمزاج (EPDS) {f.get('epds_latest_total')}، بعد {f.get('weeks_since_delivery')} أسابيع من الولادة.",
        "OBS_PERIMENOPAUSE_SYMPTOMS": f"سجّلتِ الهبّات الساخنة أو التعرق الليلي في {f.get('vasomotor_days_90')} يوماً خلال آخر 90 يوماً.",
    }
    if rule_id.startswith("RF"):
        when = _fmt_day(entry_date, lang) if entry_date else ""
        return (f"Logged on {when}." if lang == "en" else f"مسجّل في {when}.") if when else ""
    return (ar if lang == "ar" else en).get(rule_id, "")


QUESTIONS = {  # consultation prep: ranked questions tied to the pattern (EN, AR)
    "OBS_IRREGULAR_CYCLES": (
        ["What could be causing my cycles to be this irregular?", "Should my thyroid or other hormones be checked?"],
        ["ما الذي قد يسبب عدم انتظام دوراتي بهذا الشكل؟", "هل يجب فحص الغدة الدرقية أو هرمونات أخرى؟"],
    ),
    "OBS_IRREGULAR_PLUS_ANDROGEN": (
        ["Is a PCOS assessment right for me?", "Which blood tests or scans would help?"],
        ["هل تقييم متلازمة تكيّس المبايض مناسب لي؟", "ما التحاليل أو الأشعة التي قد تساعد؟"],
    ),
    "OBS_SEVERE_CYCLICAL_PAIN": (
        ["Could my period pain be checked for endometriosis or other causes?", "What pain relief options can I try?"],
        [
            "هل يمكن فحص ألم الدورة لمعرفة إن كان سببه بطانة الرحم المهاجرة أو سبباً آخر؟",
            "ما خيارات تخفيف الألم التي يمكنني تجربتها؟",
        ],
    ),
    "OBS_CYCLICAL_BOWEL_BLADDER_PAIN": (
        ["Is the bowel or bladder pain during my periods worth investigating?"],
        ["هل يستحق ألم التبرز أو التبول خلال الدورة الفحص؟"],
    ),
    "OBS_HEAVY_OR_LONG_PERIODS": (
        ["Should I have a blood count to check for low iron?", "What options are there to make my periods lighter?"],
        ["هل أحتاج تعداد دم كامل لفحص نقص الحديد؟", "ما الخيارات المتاحة لتخفيف غزارة الدورة؟"],
    ),
    "OBS_HEAVY_WITH_FATIGUE": (
        ["Could my tiredness be related to my heavy periods?"],
        ["هل قد يكون تعبي مرتبطاً بغزارة الدورة؟"],
    ),
    "OBS_NO_PERIOD_90_DAYS": (
        ["What tests do you suggest for my missed periods?"],
        ["ما الفحوص التي تقترحينها لغياب الدورة؟"],
    ),
    "CARE_POSTPARTUM_GLUCOSE_TEST": (
        ["Can you book my glucose tolerance test?", "How often should my sugar be checked after this?"],
        ["هل يمكن حجز اختبار تحمّل الجلوكوز لي؟", "كم مرة يجب فحص السكر بعد ذلك؟"],
    ),
    "OBS_TTC_FERTILITY_ASSESSMENT": (
        ["Can my partner and I both be assessed?", "Which tests come first in a fertility check?"],
        ["هل يمكن تقييمي أنا وزوجي معاً؟", "ما الفحوص الأولى في تقييم الخصوبة؟"],
    ),
    "CARE_PREGNANCY_GLUCOSE_SCREEN": (
        ["Can my glucose test be booked before week 28?", "Do I need to fast before the test?"],
        ["هل يمكن حجز فحص السكر قبل الأسبوع 28؟", "هل أحتاج إلى الصيام قبل الفحص؟"],
    ),
    "OBS_POSTPARTUM_MOOD": (
        ["Who can I talk to about how I have been feeling?", "What support is available after birth?"],
        ["مع من يمكنني التحدث عن شعوري؟", "ما الدعم المتاح بعد الولادة؟"],
    ),
    "OBS_PERIMENOPAUSE_SYMPTOMS": (
        [
            "What treatment options could help my hot flushes and sleep?",
            "What are the benefits and risks of each option?",
        ],
        ["ما خيارات العلاج التي قد تساعد في الهبّات الساخنة والنوم؟", "ما فوائد ومخاطر كل خيار؟"],
    ),
}


def questions(rule_id: str, lang: str = "en") -> list[str]:
    en, ar = QUESTIONS.get(rule_id, ([], []))
    return ar if lang == "ar" else en


def entry_text(e: dict, lang: str = "en") -> str:
    """Short description of a log or event used in 'Why we noticed' chips."""
    day = _fmt_day(str(e["date"]), lang)
    if "type" in e:  # event
        t = e["type"].replace("_", " ")
        d = e.get("details") or {}
        if e["type"] == "questionnaire":
            return f"{day} · {d.get('tool')} total {d.get('total')}"
        return f"{day} · {t}"
    bits = []
    if e.get("flow") and e["flow"] != "none":
        bits.append(f"{e['flow']} flow" if lang == "en" else f"نزول {e['flow']}")
    if e.get("pain"):
        bits.append(f"pain {e['pain']}/10" if lang == "en" else f"ألم {e['pain']}/10")
    if e.get("pbac"):
        bits.append(f"PBAC {e['pbac']}")
    syms = [s for s in e.get("symptoms", []) if s not in ("cravings",)][:3]
    bits += syms
    if e.get("impact") and e["impact"] != "none":
        bits.append(e["impact"])
    return f"{day} · " + ", ".join(bits) if bits else day


# ---------- clinician voice (QUESTIONS #41) ----------
# The same rules, said to the clinician about her: third person, no "you", no advice to "ask your doctor". Each line
# restates the rule's own next steps in rules/clinical_rules.yaml; nothing here adds a threshold or a new step.
CLINICIAN = {
    "RF1_heavy_bleeding_with_dizziness": ("Red flag: heavy bleeding with dizziness or fainting", []),
    "RF2_severe_sudden_pain_possible_pregnancy": ("Red flag: sudden severe pelvic pain with a possible pregnancy", []),
    "RF3_postmenopausal_or_pregnancy_bleeding": ("Red flag: bleeding in pregnancy or after menopause", []),
    "RF4_SELF_HARM_THOUGHTS": ("Red flag: self-harm thoughts reported (EPDS item 10)", []),
    "RF5_PREGNANCY_WARNING_SIGNS": ("Red flag: pregnancy warning signs", []),
    "RF6_POSTPARTUM_WARNING_SIGNS": ("Red flag: after-birth warning signs", []),
    "OBS_IRREGULAR_CYCLES": (
        "Irregular cycle lengths",
        ["Review the cycle history; causes include stress, thyroid changes, weight change and PCOS."],
    ),
    "OBS_IRREGULAR_PLUS_ANDROGEN": (
        "Irregular cycles with acne or excess hair growth",
        ["Consider whether a PCOS assessment is appropriate (2023 International PCOS Guideline)."],
    ),
    "OBS_SEVERE_CYCLICAL_PAIN": (
        "Severe cyclical pain affecting daily life",
        ["Review her pain timeline and the pain relief she has tried."],
    ),
    "OBS_CYCLICAL_BOWEL_BLADDER_PAIN": (
        "Pain on bowel movements or passing urine during periods",
        ["Ask about bowel and bladder symptoms during periods."],
    ),
    "OBS_HEAVY_OR_LONG_PERIODS": ("Heavy or prolonged periods", ["Consider a full blood count (NICE NG88)."]),
    "OBS_NO_PERIOD_90_DAYS": ("No period logged for 90 days or more", ["Consider a pregnancy test and a review."]),
    "CARE_POSTPARTUM_GLUCOSE_TEST": (
        "After-birth glucose test due after gestational diabetes",
        ["Consider booking a glucose tolerance test."],
    ),
    "OBS_TTC_FERTILITY_ASSESSMENT": (
        "Trying to conceive beyond the usual interval for her age",
        ["Consider a fertility assessment; both partners can be assessed."],
    ),
    "OBS_HEAVY_WITH_FATIGUE": (
        "Heavy periods with tiredness",
        ["Consider a full blood count (NICE NG88)."],
    ),
    "CARE_PREGNANCY_GLUCOSE_SCREEN": (
        "Pregnancy glucose test not yet recorded",
        ["Consider booking the glucose test before week 28."],
    ),
    "OBS_POSTPARTUM_MOOD": (
        "Raised EPDS score after birth",
        ["Consider a mood review; the EPDS is a screen, not a diagnosis."],
    ),
    "OBS_PERIMENOPAUSE_SYMPTOMS": (
        "Symptoms that often come with perimenopause",
        ["Consider discussing symptoms and treatment options; her symptom calendar is in the record."],
    ),
}


def clinician_title(rule_id: str, fallback: str) -> str:
    return CLINICIAN.get(rule_id, (fallback, []))[0]


def clinician_steps(rule_id: str) -> list[str]:
    return CLINICIAN.get(rule_id, ("", []))[1]


def clinician_detail(rule_id: str, f: dict) -> str:
    """The numbers behind the pattern, about her (third person)."""
    lens = f.get("cycle_lengths_last6") or []
    rng = f"{min(lens)}–{max(lens)}" if lens else ""
    return {
        "OBS_IRREGULAR_CYCLES": f"{f.get('irregular_cycle_count_6')} of her last {len(lens)} cycles were shorter than 21 or longer than 35 days (range {rng} days).",
        "OBS_IRREGULAR_PLUS_ANDROGEN": f"Acne or excess hair growth logged on {f.get('androgen_symptom_days_90')} of the last 90 days, alongside irregular cycles.",
        "OBS_SEVERE_CYCLICAL_PAIN": f"Period pain 7/10 or more in {f.get('severe_pain_cycles_6')} of her last 6 periods; missed work or study on {f.get('pain_impact_days_90')} of the last 90 days.",
        "OBS_CYCLICAL_BOWEL_BLADDER_PAIN": "Pain on bowel movements or passing urine during periods, logged in at least 2 cycles.",
        "OBS_HEAVY_OR_LONG_PERIODS": f"Highest PBAC {f.get('pbac_max_6')} in the last 6 periods; longest period {f.get('period_duration_max')} days.",
        "OBS_HEAVY_WITH_FATIGUE": f"Tiredness logged on {f.get('fatigue_days_90')} of the last 90 days, alongside heavy periods.",
        "OBS_NO_PERIOD_90_DAYS": f"Last logged period started {f.get('days_since_last_period')} days ago.",
        "CARE_POSTPARTUM_GLUCOSE_TEST": f"Gestational diabetes in her last pregnancy; delivered {f.get('weeks_since_delivery')} weeks ago; no glucose test after birth recorded.",
        "OBS_TTC_FERTILITY_ASSESSMENT": f"Trying to conceive for {f.get('ttc_months')} months; age {f.get('age')}.",
        "CARE_PREGNANCY_GLUCOSE_SCREEN": f"{f.get('pregnancy_weeks')} weeks pregnant; no glucose test in this pregnancy recorded.",
        "OBS_POSTPARTUM_MOOD": f"Latest EPDS total {f.get('epds_latest_total')}, {f.get('weeks_since_delivery')} weeks after birth.",
        "OBS_PERIMENOPAUSE_SYMPTOMS": f"Hot flushes or night sweats logged on {f.get('vasomotor_days_90')} of the last 90 days.",
    }.get(rule_id, "")
