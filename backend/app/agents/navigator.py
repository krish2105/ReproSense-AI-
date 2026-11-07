"""Care navigator: drafts an appointment request, questions and a what-to-bring list from a rule hit and her entries.
It ONLY drafts. Nothing is sent or booked by the app: she approves the draft, then copies or shows it herself.
(CLAUDE.md rule 11.) Arabic: AR-REVIEW."""

from __future__ import annotations

from app.agents import copy as cp
from app.rules.engine import Evaluation, Hit

TEMPLATES = {
    "CARE_PREGNANCY_GLUCOSE_SCREEN": {
        "to": "Antenatal team",
        "subject": "Request: glucose test (24–28 weeks)",
        "en": "Hello, I am {weeks} weeks pregnant and my glucose tolerance test has not been booked yet. Could you please book it before week 28? Thank you.",
        "ar": "مرحباً، أنا في الأسبوع {weeks} من الحمل ولم يُحجز لي اختبار تحمّل الجلوكوز بعد. هل يمكن حجزه قبل الأسبوع 28؟ شكراً لكم.",
        "bring": [
            "Your pregnancy record or antenatal card",
            "A list of any medicines you take",
            "This ReproSense summary",
        ],
        "bring_ar": ["سجل الحمل أو بطاقة متابعة الحمل", "قائمة الأدوية التي تتناولينها", "ملخص ReproSense هذا"],
    },
    "CARE_POSTPARTUM_GLUCOSE_TEST": {
        "to": "Clinic reception",
        "subject": "Request: glucose tolerance test after gestational diabetes",
        "en": "Hello, I had gestational diabetes and my baby was born {weeks_pp} weeks ago. Guidelines suggest a glucose tolerance test 4–12 weeks after birth. Could you please book one for me? Thank you.",
        "ar": "مرحباً، كان لديّ سكري الحمل ووُلد طفلي قبل {weeks_pp} أسابيع. تقترح الإرشادات اختبار تحمّل الجلوكوز بعد 4 إلى 12 أسبوعاً من الولادة. هل يمكن حجزه لي؟ شكراً لكم.",
        "bring": ["Your discharge summary from the birth", "Your pregnancy glucose results", "This ReproSense summary"],
        "bring_ar": ["ملخص الخروج من المستشفى بعد الولادة", "نتائج فحوص السكر أثناء الحمل", "ملخص ReproSense هذا"],
    },
    "OBS_TTC_FERTILITY_ASSESSMENT": {
        "to": "Gynaecology clinic",
        "subject": "Request: fertility assessment appointment",
        "en": "Hello, I am {age} and have been trying to conceive for {ttc} months. I would like to book a fertility assessment. Thank you.",
        "ar": "مرحباً، عمري {age} سنة وأحاول الحمل منذ {ttc} أشهر. أرغب في حجز موعد لتقييم الخصوبة. شكراً لكم.",
        "bring": [
            "Your cycle record (this report)",
            "Any previous test results",
            "A list of medicines and supplements",
        ],
        "bring_ar": ["سجل دوراتك (هذا التقرير)", "أي نتائج فحوص سابقة", "قائمة الأدوية والمكملات"],
    },
}
GENERIC = {
    "to": "Gynaecology clinic",
    "subject": "Request: appointment to discuss a pattern in my record",
    "en": "Hello, I would like an appointment to discuss a pattern I noticed in my record: {title}. I will bring my ReproSense summary. Thank you.",
    "ar": "مرحباً، أرغب في موعد لمناقشة نمط لاحظته في سجلي: {title}. سأحضر ملخص ReproSense. شكراً لكم.",
    "bring": ["This ReproSense summary", "A list of pain relief or medicines you tried", "Any previous test results"],
    "bring_ar": ["ملخص ReproSense هذا", "قائمة المسكنات أو الأدوية التي جربتها", "أي نتائج فحوص سابقة"],
}
# The generic message is written as her ("a pattern I noticed in my record: ..."), but some card titles speak to her
# ("Your cycle lengths...", "دوراتك"). These patterns get their name in her own voice (issue #66). AR-REVIEW
OWN_VOICE = {
    "OBS_IRREGULAR_CYCLES": ("my cycle lengths have been irregular", "أطوال دوراتي كانت غير منتظمة"),
    "OBS_SEVERE_CYCLICAL_PAIN": (
        "my period pain has been severe and is affecting my daily life",
        "ألم الدورة كان شديداً ويؤثر على حياتي اليومية",
    ),
    "OBS_POSTPARTUM_MOOD": (
        "my mood check suggests talking to someone",
        "فحص المزاج يشير إلى أن الحديث مع أحد قد يفيدني",
    ),
}


def draft(hit: Hit, ev: Evaluation, clinic_name: str) -> dict:
    f = ev.features.values
    t = TEMPLATES.get(hit.rule_id, GENERIC)
    vals = {
        "weeks": f.get("pregnancy_weeks"),
        "weeks_pp": f.get("weeks_since_delivery"),
        "age": f.get("age"),
        "ttc": f.get("ttc_months"),
        "title": hit.title.lower(),
    }
    title_ar = (cp.ar_rules().get(hit.rule_id) or {}).get("title", hit.title)
    if hit.rule_id in OWN_VOICE:
        vals["title"], title_ar = OWN_VOICE[hit.rule_id]
    return {
        "rule_id": hit.rule_id,
        "to": f"{t['to']}, {clinic_name}",
        "subject": t["subject"],
        "message_en": t["en"].format(**vals),
        "message_ar": t["ar"].format(**{**vals, "title": title_ar}),
        "questions_en": cp.questions(hit.rule_id, "en"),
        "questions_ar": cp.questions(hit.rule_id, "ar"),
        "bring_en": t["bring"],
        "bring_ar": t["bring_ar"],
        "sources": hit.source_ids,
        "note": "Draft only. ReproSense does not send or book anything. After you approve, copy the message or show it at the desk.",
    }
