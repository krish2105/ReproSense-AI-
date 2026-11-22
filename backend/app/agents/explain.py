"""Nura's explain lane (22 Nov 2026, showcase day; G2: Krishna): what a condition is, in plain words, plus what HER own
record shows. Written by code from fixed sentences, never by a model, so nothing can be made up.

Three questions it answers (after the safety word checks, which run first and are unchanged):
- "What is PCOS?" / "Which hormones cause PCOS?" / "اشرحي لي بطانة الرحم المهاجرة": a short explainer for that
  condition, each sentence checked against the page it cites (NHS condition pages and the guidelines already in
  knowledge_base/sources.yaml, read on 22 Nov 2026). When her own Patterns include a related pattern, it is added with
  her numbers (the same deterministic copy the Patterns page shows).
- "What is happening with my body?": her own active patterns, red flags first, each with her numbers and its source.
- "Do I have PCOS?": the refusal comes first and `refused` stays true (CLAUDE.md rule 1: never diagnose); then the same
  cited facts and what her record shows that doctors look at, so she has something to take to her doctor.

No medicine names, no doses, no probabilities. "Learn more" gives the cited pages and, only where checked to exist and
to come from an official health body, a video (VIDEOS; empty means none was verified).
"""

from __future__ import annotations

import re
from datetime import date

from app.agents import assistant, record
from app.agents import copy as cp
from app.rules.engine import evaluate

MAX_WORDS = 20

# ---------------- the conditions: fixed sentences, each with the source that supports it ----------------
# (en, ar, source_id). Every English sentence was checked against the cited page on 22 Nov 2026; the Arabic is our own
# translation (docs/AR_REVIEW.md, native review pending).
CONDITIONS: dict[str, dict] = {
    "pcos": {
        "name": {"en": "PCOS (the NHS now calls it PMOS)", "ar": "متلازمة تكيّس المبايض (PCOS، وتسمّيها الخدمة الصحية البريطانية الآن PMOS)"},
        "en": r"\b(pcos|pmos|polycystic|poly cystic|polyendocrine)\b",
        "ar": r"(تكيس المبايض|تكيس مبايض|المبايض المتعدده الكيسات|pcos|pmos)",
        "lines": [
            (
                "PCOS, which the NHS now calls PMOS (polyendocrine metabolic ovarian syndrome), is a hormone condition that can affect periods, hair growth, skin, fertility and mood.",
                "متلازمة تكيّس المبايض، التي تسمّيها الخدمة الصحية البريطانية الآن PMOS، حالة هرمونية قد تؤثر على الدورة ونمو الشعر والبشرة والخصوبة والمزاج.",
                "nhs_pcos",
            ),
            (
                "Its cause is not known, but it may be linked to hormones such as insulin and testosterone not working properly, and it is more likely if a close relative has it.",
                "سببها غير معروف، لكنها قد ترتبط بعدم عمل هرمونات مثل الإنسولين والتستوستيرون بالشكل الصحيح، وتزيد احتمالها إذا كانت لدى قريبة مباشرة.",
                "nhs_pcos",
            ),
            (
                "Common signs are irregular periods or long gaps between periods, extra hair growth or hair loss, oily skin and acne, weight gain, tiredness and difficulty getting pregnant. Some women have no symptoms.",
                "من علاماتها الشائعة: دورات غير منتظمة أو فترات طويلة بين الدورات، ونمو شعر زائد أو تساقط الشعر، والبشرة الدهنية وحب الشباب، وزيادة الوزن، والتعب، وصعوبة الحمل. وبعض النساء لا تظهر عليهن أعراض.",
                "nhs_pcos",
            ),
            (
                "A doctor considers it when two of three features are present: irregular cycles, signs of higher androgens (such as extra hair or acne, or a blood test), and polycystic ovaries on ultrasound or a raised AMH level, after checking other causes such as thyroid or prolactin problems.",
                "يفكّر الطبيب فيها عند وجود اثنتين من ثلاث علامات: دورات غير منتظمة، وعلامات ارتفاع الأندروجين (مثل الشعر الزائد أو حب الشباب، أو تحليل دم)، وشكل المبايض في الأشعة الصوتية أو ارتفاع هرمون AMH، بعد استبعاد أسباب أخرى مثل مشكلات الغدة الدرقية أو البرولاكتين.",
                "pcos_guideline_2023",
            ),
            (
                "Treatment and lifestyle changes can help with symptoms, and regular check-ups lower the risk of later problems such as type 2 diabetes and high blood pressure.",
                "يمكن للعلاج وتغييرات نمط الحياة أن تساعد في الأعراض، والفحوصات المنتظمة تقلّل خطر مشكلات لاحقة مثل السكري من النوع الثاني وارتفاع ضغط الدم.",
                "nhs_pcos",
            ),
        ],
        "rules": ["OBS_IRREGULAR_PLUS_ANDROGEN", "OBS_IRREGULAR_CYCLES"],
        "pages": ["nhs_pcos", "pcos_guideline_2023"],
    },
    "endometriosis": {
        "name": {"en": "endometriosis", "ar": "بطانة الرحم المهاجرة"},
        "en": r"\b(endometriosis|endo)\b",
        "ar": r"(بطانه الرحم المهاجره|بطانه الرحم|الانتباذ البطاني|endometriosis)",
        "lines": [
            (
                "Endometriosis is where cells similar to the lining of the womb grow in other places, most often around the womb, ovaries, fallopian tubes and the lining of the pelvis.",
                "بطانة الرحم المهاجرة هي نموّ خلايا تشبه بطانة الرحم في أماكن أخرى، غالباً حول الرحم والمبيضين وقناتي فالوب وبطانة الحوض.",
                "nhs_endometriosis",
            ),
            (
                "Symptoms happen when these patches break down and bleed but the blood cannot leave the body: severe period pain that stops normal activities, heavy periods, pelvic pain, pain when you poo or pee or during sex, extreme tiredness, and sometimes difficulty getting pregnant.",
                "تظهر الأعراض عندما تتفتت هذه البقع وتنزف دون أن يخرج الدم من الجسم: ألم دورة شديد يمنع الأنشطة المعتادة، ودورة غزيرة، وألم في الحوض، وألم عند التبرز أو التبول أو أثناء العلاقة الزوجية، وتعب شديد، وأحياناً صعوبة الحمل.",
                "nhs_endometriosis",
            ),
            (
                "Its cause is not known, and it can take a long time to recognise because the symptoms look like other conditions.",
                "سببها غير معروف، وقد يستغرق التعرّف عليها وقتاً طويلاً لأن أعراضها تشبه حالات أخرى.",
                "nhs_endometriosis",
            ),
            (
                "A doctor may examine you and arrange an ultrasound or MRI scan, and a keyhole operation (laparoscopy) can confirm it. Treatment can help manage symptoms such as pain.",
                "قد يفحصكِ الطبيب ويطلب أشعة صوتية أو رنيناً مغناطيسياً، ويمكن لعملية المنظار تأكيدها. ويساعد العلاج في التحكم بالأعراض مثل الألم.",
                "nhs_endometriosis",
            ),
            (
                "NICE notes that endometriosis can be hard to recognise and that a symptom diary helps, which is what your log does.",
                "تشير إرشادات NICE إلى أن التعرّف على بطانة الرحم المهاجرة قد يكون صعباً وأن مذكرة الأعراض تساعد، وهذا ما يفعله سجلّكِ.",
                "nice_endometriosis_ng73",
            ),
        ],
        "rules": ["OBS_SEVERE_CYCLICAL_PAIN", "OBS_CYCLICAL_BOWEL_BLADDER_PAIN"],
        "pages": ["nhs_endometriosis", "nice_endometriosis_ng73"],
    },
    "heavy_periods": {
        "name": {"en": "heavy periods", "ar": "الدورة الغزيرة"},
        "en": r"\b(heavy (periods?|bleeding|menstrual bleeding|flow)|menorrhagia)\b",
        "ar": r"(الدوره الغزيره|دوره غزيره|النزيف الغزير|نزيف غزير|غزاره الدوره)",
        "lines": [
            (
                "Heavy periods (menorrhagia) are common and can be normal for you, and treatment can help if they affect your daily life.",
                "الدورة الغزيرة شائعة وقد تكون طبيعية بالنسبة لكِ، ويمكن للعلاج أن يساعد إذا كانت تؤثر على حياتك اليومية.",
                "nhs_heavy_periods",
            ),
            (
                "Signs include changing a pad or tampon every 1 to 2 hours, using two products together, bleeding for more than 7 days, clots larger than about 2.5 cm, bleeding through to clothes or bedding, and feeling tired or short of breath a lot.",
                "من علاماتها: تغيير الفوطة كل ساعة أو ساعتين، أو استخدام منتجين معاً، أو نزيف أكثر من 7 أيام، أو جلطات أكبر من نحو 2.5 سم، أو تسرّب الدم إلى الملابس أو الفراش، أو الشعور بالتعب أو ضيق النفس كثيراً.",
                "nhs_heavy_periods",
            ),
            (
                "It can be normal to have heavy periods, but they can also be caused by conditions of the womb or ovaries such as fibroids, endometriosis or PMOS, by conditions that make you bleed more easily, or by some medicines.",
                "قد تكون الدورة الغزيرة طبيعية، لكنها قد تنتج أيضاً عن حالات في الرحم أو المبيضين مثل الأورام الليفية أو بطانة الرحم المهاجرة أو تكيّس المبايض، أو عن حالات تجعل النزيف أسهل، أو عن بعض الأدوية.",
                "nhs_heavy_periods",
            ),
            (
                "See a doctor if heavy periods affect your life, if the pain is severe, or if you bleed between periods or after sex. Feeling very tired can be a sign of low iron.",
                "راجعي الطبيب إذا كانت الدورة الغزيرة تؤثر على حياتك، أو إذا كان الألم شديداً، أو إذا حدث نزيف بين الدورات أو بعد العلاقة الزوجية. والتعب الشديد قد يكون علامة على نقص الحديد.",
                "nhs_heavy_periods",
            ),
            (
                "If you are bleeding very heavily and feel dizzy, faint or short of breath, call 998 or go to the nearest emergency department.",
                "إذا كان النزيف غزيراً جداً مع دوخة أو إغماء أو ضيق في النفس، اتصلي بالرقم 998 أو توجّهي إلى أقرب قسم طوارئ.",
                "nhs_heavy_periods",
            ),
        ],
        "rules": ["RF1_heavy_bleeding_with_dizziness", "OBS_HEAVY_OR_LONG_PERIODS", "OBS_HEAVY_WITH_FATIGUE"],
        "pages": ["nhs_heavy_periods"],
    },
    "period_pain": {
        "name": {"en": "period pain", "ar": "ألم الدورة"},
        "en": r"\b(period pain|painful periods?|menstrual (pain|cramps?)|period cramps?|dysmenorrh\w*)\b",
        "ar": r"(الم الدوره|الام الدوره|وجع الدوره|اوجاع الدوره|مغص الدوره|تقلصات الدوره)",
        "lines": [
            (
                "Period pain is common: cramps in the tummy that can spread to the back and thighs, usually around the start of a period and lasting up to 3 days.",
                "ألم الدورة شائع: تقلّصات في البطن قد تمتد إلى الظهر والفخذين، عادةً مع بداية الدورة، وتستمر حتى 3 أيام.",
                "nhs_period_pain",
            ),
            (
                "It happens when the womb tightens during a period and is often a normal part of the menstrual cycle.",
                "يحدث عندما ينقبض الرحم أثناء الدورة، وغالباً ما يكون جزءاً طبيعياً من الدورة الشهرية.",
                "nhs_period_pain",
            ),
            (
                "Sometimes a condition causes it, such as endometriosis or adenomyosis, fibroids, or an infection of the womb, tubes and ovaries.",
                "أحياناً تسبّبه حالة مثل بطانة الرحم المهاجرة أو العضال الغدي، أو الأورام الليفية، أو التهاب في الرحم والقناتين والمبيضين.",
                "nhs_period_pain",
            ),
            (
                "A warm bath, a heat pad on your tummy, gentle exercise and massage can help.",
                "قد يساعد الحمّام الدافئ، ووضع وسادة تدفئة على البطن، والرياضة الخفيفة، والتدليك.",
                "nhs_period_pain",
            ),
            (
                "Ask for an urgent appointment if the pain is severe or worse than usual and painkillers have not helped. See a doctor if periods become more painful, heavier or irregular, or if the pain stops your usual activities.",
                "اطلبي موعداً عاجلاً إذا كان الألم شديداً أو أسوأ من المعتاد ولم تساعد المسكنات. وراجعي الطبيب إذا أصبحت الدورة أكثر ألماً أو أغزر أو غير منتظمة، أو إذا كان الألم يمنعك من أنشطتك المعتادة.",
                "nhs_period_pain",
            ),
        ],
        "rules": ["OBS_SEVERE_CYCLICAL_PAIN"],
        "pages": ["nhs_period_pain"],
    },
    "irregular_periods": {
        "name": {"en": "irregular or missed periods", "ar": "الدورة غير المنتظمة أو الغائبة"},
        "en": r"\b(irregular (periods?|cycles?|menstruation)|missed (a )?periods?|late periods?|no periods?|absent periods?|amenorrh\w*)\b",
        "ar": r"(دوره غير منتظمه|الدوره غير منتظمه|دورات غير منتظمه|عدم انتظام الدوره|غياب الدوره|تاخر الدوره|انقطاع الدوره)",
        "lines": [
            (
                "More than three years after the first period, cycles shorter than 21 days or longer than 35 days, or fewer than eight periods a year, are described as irregular.",
                "بعد مرور أكثر من ثلاث سنوات على أول دورة، تُعدّ الدورة غير منتظمة إذا كانت أقصر من 21 يوماً أو أطول من 35 يوماً، أو أقل من ثماني دورات في السنة.",
                "pcos_guideline_2023",
            ),
            (
                "Common causes of missed or late periods include pregnancy, stress, sudden weight loss or being overweight, a lot of exercise, hormonal contraception, breastfeeding, perimenopause and PMOS (PCOS). Thyroid problems can also affect periods.",
                "من الأسباب الشائعة لتأخّر الدورة أو غيابها: الحمل، والتوتر، وفقدان الوزن المفاجئ أو زيادة الوزن، والرياضة الشاقة، ووسائل منع الحمل الهرمونية، والرضاعة، ومرحلة ما قبل انقطاع الطمث، وتكيّس المبايض. وقد تؤثر مشكلات الغدة الدرقية أيضاً على الدورة.",
                "nhs_absent_periods",
            ),
            (
                "If there is any chance of pregnancy, a pregnancy test is a sensible first step.",
                "إذا كان هناك أي احتمال للحمل، فاختبار الحمل خطوة أولى مناسبة.",
                "nhs_absent_periods",
            ),
            (
                "See a doctor if you have missed 3 periods in a row, if your periods have become irregular, or if you also notice weight change, tiredness, facial hair or skin changes.",
                "راجعي الطبيب إذا غابت الدورة 3 مرات متتالية، أو إذا أصبحت غير منتظمة، أو إذا لاحظتِ أيضاً تغيّر الوزن أو التعب أو شعر الوجه أو تغيّرات البشرة.",
                "nhs_absent_periods",
            ),
        ],
        "rules": ["OBS_IRREGULAR_CYCLES"],
        "pages": ["nhs_absent_periods", "pcos_guideline_2023"],
    },
    "menopause": {
        "name": {"en": "perimenopause and menopause", "ar": "مرحلة ما قبل انقطاع الطمث وانقطاع الطمث"},
        "en": r"\b(perimenopaus\w*|menopaus\w*|hot flush\w*|hot flash\w*)\b",
        "ar": r"(انقطاع الطمث|سن الياس|ما قبل انقطاع الطمث|الهبات الساخنه|هبات ساخنه)",
        "lines": [
            (
                "Perimenopause is when periods become irregular, and menopause is when they stop altogether. Menopause is defined as no period for 12 months when you are not using hormonal contraception.",
                "مرحلة ما قبل انقطاع الطمث هي عندما تصبح الدورة غير منتظمة، وانقطاع الطمث هو توقّفها تماماً، ويُعرَّف بغياب الدورة 12 شهراً دون استخدام وسائل منع حمل هرمونية.",
                "nhs_menopause",
            ),
            (
                "It is caused by a fall in hormone levels and usually happens between 45 and 55, but it can happen earlier.",
                "يحدث بسبب انخفاض مستويات الهرمونات، وعادةً بين 45 و55 عاماً، لكنه قد يحدث قبل ذلك.",
                "nhs_menopause",
            ),
            (
                "Common symptoms include hot flushes, low mood, sleep problems and memory problems.",
                "من الأعراض الشائعة: الهبّات الساخنة، وانخفاض المزاج، ومشكلات النوم، ومشكلات الذاكرة.",
                "nhs_menopause",
            ),
            (
                "There is no routine test, and a doctor may diagnose it from your age and symptoms. Menopause before 45 is called early menopause and is worth discussing with a doctor.",
                "لا يوجد تحليل روتيني، وقد يشخّصه الطبيب بناءً على العمر والأعراض. وانقطاع الطمث قبل 45 عاماً يسمّى انقطاع الطمث المبكر، ومن المفيد مناقشته مع الطبيب.",
                "nhs_menopause",
            ),
        ],
        "rules": ["OBS_PERIMENOPAUSE_SYMPTOMS"],
        "pages": ["nhs_menopause"],
    },
    "gestational_diabetes": {
        "name": {"en": "gestational diabetes", "ar": "سكري الحمل"},
        "en": r"\b(gestational diabetes|gdm|diabetes (in|during) pregnancy|pregnancy diabetes)\b",
        "ar": r"(سكري الحمل|سكر الحمل|السكري اثناء الحمل|السكري في الحمل)",
        "lines": [
            (
                "Gestational diabetes is high blood sugar that develops during pregnancy and usually goes away after the birth.",
                "سكري الحمل هو ارتفاع سكر الدم الذي يظهر أثناء الحمل ويزول عادةً بعد الولادة.",
                "nhs_gestational_diabetes",
            ),
            (
                "It happens when the body cannot make enough insulin, the hormone that controls blood sugar, to meet the extra needs of pregnancy. It is most common in the second or third trimester.",
                "يحدث عندما لا يستطيع الجسم إنتاج ما يكفي من الإنسولين، وهو الهرمون الذي يضبط سكر الدم، لتلبية احتياجات الحمل الإضافية. وهو أكثر شيوعاً في الثلثين الثاني والثالث من الحمل.",
                "nhs_gestational_diabetes",
            ),
            (
                "It usually causes no symptoms, so it is found by screening: women with risk factors are offered a glucose test at 24 to 28 weeks.",
                "لا يسبّب عادةً أعراضاً، لذلك يُكتشف بالفحص: تُعرض على النساء المعرّضات للخطر تحليلة سكر بين الأسبوع 24 و28.",
                "nice_ng3",
            ),
            (
                "The risk is higher with a BMI above 30, a previous baby of 4.5 kg or more, gestational diabetes before, a parent or sibling with diabetes, or a South Asian, Black, African-Caribbean or Middle Eastern family origin.",
                "يرتفع الخطر مع مؤشر كتلة جسم أعلى من 30، أو مولود سابق وزنه 4.5 كغ أو أكثر، أو سكري حمل سابق، أو إصابة أحد الوالدين أو الإخوة بالسكري، أو أصول من جنوب آسيا أو أفريقيا أو الكاريبي الأفريقي أو الشرق الأوسط.",
                "nhs_gestational_diabetes",
            ),
            (
                "Afterwards the risk of type 2 diabetes is higher, so a blood test is advised 6 to 13 weeks after the birth and then once a year if it is normal.",
                "بعد ذلك يرتفع خطر السكري من النوع الثاني، لذا يُنصح بتحليل دم بعد 6 إلى 13 أسبوعاً من الولادة، ثم مرة كل سنة إذا كانت النتيجة طبيعية.",
                "nhs_gestational_diabetes",
            ),
        ],
        "rules": ["CARE_POSTPARTUM_GLUCOSE_TEST", "CARE_PREGNANCY_GLUCOSE_SCREEN"],
        "pages": ["nhs_gestational_diabetes", "nice_ng3"],
    },
    "postnatal_depression": {
        "name": {"en": "postnatal depression", "ar": "اكتئاب ما بعد الولادة"},
        "en": r"\b(postnatal depression|postpartum depression|post natal depression|post partum depression|baby blues|pnd|ppd)\b",
        "ar": r"(اكتئاب ما بعد الولاده|اكتئاب بعد الولاده|كابه ما بعد الولاده|كابه النفاس|اكتئاب النفاس)",
        "lines": [
            (
                "Postnatal depression is a common mental health condition that can happen after having a baby, and it usually gets better with treatment.",
                "اكتئاب ما بعد الولادة حالة نفسية شائعة قد تحدث بعد إنجاب طفل، وعادةً ما تتحسّن بالعلاج.",
                "nhs_postnatal_depression",
            ),
            (
                "Signs include low mood, finding it hard to enjoy anything, feeling hopeless, guilty or anxious, sleep and concentration problems, and difficult feelings about the baby. They can start in pregnancy or up to a year after the birth.",
                "من علاماته: انخفاض المزاج، وصعوبة الاستمتاع بأي شيء، والشعور باليأس أو الذنب أو القلق، ومشكلات النوم والتركيز، ومشاعر صعبة تجاه الطفل. وقد تبدأ أثناء الحمل أو حتى سنة بعد الولادة.",
                "nhs_postnatal_depression",
            ),
            (
                "Feeling down for a few days after the birth, the baby blues, is very common and usually passes within 2 weeks. If it lasts or gets worse, it is important to get help.",
                "الشعور بالحزن لبضعة أيام بعد الولادة شائع جداً ويزول عادةً خلال أسبوعين. وإذا استمر أو ازداد سوءاً، فمن المهم طلب المساعدة.",
                "nhs_postnatal_depression",
            ),
            (
                "Speak to your doctor or midwife even with only some of the signs: treatment makes getting better more likely. The EPDS mood check in your app is a screen, not a diagnosis.",
                "تحدّثي مع طبيبتك أو القابلة حتى لو كانت لديكِ بعض العلامات فقط، فالتحسّن أرجح مع العلاج. وفحص المزاج EPDS في تطبيقك أداة فحص وليس تشخيصاً.",
                "nhs_postnatal_depression",
            ),
            (
                "Thoughts of harming yourself or your baby need help now: call 998, or 800-SAKINA (800 725462) for support.",
                "إذا راودتكِ أفكار بإيذاء نفسك أو طفلك، اتصلي الآن بالرقم 998، أو بخط الدعم 800-SAKINA (800725462).",
                "doh_800_sakina",
            ),
        ],
        "rules": ["OBS_POSTPARTUM_MOOD"],
        "pages": ["nhs_postnatal_depression"],
    },
    "pre_eclampsia": {
        "name": {"en": "pre-eclampsia", "ar": "تسمّم الحمل (مقدّمات الارتعاج)"},
        "en": r"\b(pre ?eclampsia|preeclampsia)\b",
        "ar": r"(تسمم الحمل|مقدمات الارتعاج|ما قبل الارتعاج)",
        "lines": [
            (
                "Pre-eclampsia is a pregnancy condition that causes high blood pressure. It is most likely from 20 weeks of pregnancy, and sometimes develops in the days or weeks after the birth.",
                "تسمّم الحمل حالة مرتبطة بالحمل تسبّب ارتفاع ضغط الدم، وهي أكثر احتمالاً من الأسبوع 20 من الحمل، وقد تظهر أحياناً في الأيام أو الأسابيع التي تلي الولادة.",
                "nhs_pre_eclampsia",
            ),
            (
                "Early signs are high blood pressure and protein in the urine, which is why both are checked at pregnancy appointments.",
                "علاماته المبكرة ارتفاع ضغط الدم ووجود بروتين في البول، ولهذا يُفحصان في مواعيد متابعة الحمل.",
                "nhs_pre_eclampsia",
            ),
            (
                "Get help now, call 998 or your maternity unit, if you are pregnant or gave birth in the last few weeks and have a severe headache, problems with vision, pain below the ribs, sudden swelling of the face, hands or feet, or you feel very unwell.",
                "اطلبي المساعدة فوراً، واتصلي بالرقم 998 أو بقسم الولادة، إذا كنتِ حاملاً أو أنجبتِ خلال الأسابيع الأخيرة وظهر صداع شديد، أو مشكلات في الرؤية، أو ألم تحت الأضلاع، أو تورّم مفاجئ في الوجه أو اليدين أو القدمين، أو شعرتِ بتوعّك شديد.",
                "nhs_pre_eclampsia",
            ),
        ],
        "rules": [],
        "pages": ["nhs_pre_eclampsia"],
    },
    "infertility": {
        "name": {"en": "trying to conceive and fertility checks", "ar": "محاولة الحمل وفحوصات الخصوبة"},
        "en": r"\b(infertil\w*|fertility (check|test|assessment|problems?)|can'?t get pregnant|trouble (getting|conceiving)|trying to conceive|ttc)\b",
        "ar": r"(العقم|تاخر الحمل|تاخر الانجاب|فحوصات الخصوبه|فحص الخصوبه|مشاكل الخصوبه|محاوله الحمل)",
        "lines": [
            (
                "Many couples take time to conceive: more than 8 in 10 couples where the woman is under 40 conceive within a year of regular unprotected sex.",
                "كثير من الأزواج يحتاجون وقتاً للحمل: أكثر من 8 من كل 10 أزواج تكون فيهم الزوجة دون الأربعين يحدث لديهم الحمل خلال سنة من العلاقة المنتظمة دون وسيلة منع.",
                "nhs_infertility",
            ),
            (
                "It is a good idea to see a doctor after a year of trying, or sooner if you are 36 or over or already know of a possible fertility problem.",
                "من المفيد مراجعة الطبيب بعد سنة من المحاولة، أو قبل ذلك إذا كان عمركِ 36 عاماً أو أكثر أو كنتِ تعرفين بوجود مشكلة محتملة في الخصوبة.",
                "nhs_infertility",
            ),
            (
                "Irregular or absent periods are a reason to ask for an earlier check, and a doctor can look for common causes such as ovulation that does not happen regularly.",
                "الدورة غير المنتظمة أو الغائبة سبب لطلب فحص مبكر، ويمكن للطبيب البحث عن أسباب شائعة مثل عدم حدوث الإباضة بانتظام.",
                "asrm_2021_infertile_eval",
            ),
        ],
        "rules": ["OBS_TTC_FERTILITY_ASSESSMENT"],  # only when she is trying to conceive, never for irregular cycles alone
        "pages": ["nhs_infertility", "asrm_2021_infertile_eval"],
    },
}

# "Learn more" videos: official health bodies only (NHS channels first), each checked to exist with YouTube's oEmbed
# endpoint on 22 Nov 2026; title and channel exactly as oEmbed returned them. They are links, never embedded, and never
# the source of a sentence above. No official Arabic video passed the check, so Arabic answers add WHO's Arabic fact sheet.
def _yt(vid: str, title: str, channel: str) -> dict:
    return {"kind": "video", "url": f"https://www.youtube.com/watch?v={vid}", "title": title, "publisher": channel}


VIDEOS: dict[str, list[dict]] = {
    "pcos": [_yt("uBsP9XUhIYg", "Understanding polycystic ovary syndrome", "South East London ICS (NHS)")],
    "endometriosis": [_yt("ABi1ncHorBY", "What is endometriosis? Symptoms and treatment | NHS", "NHS")],
    "heavy_periods": [_yt("sogxysm5hWE", "Heavy periods: Signs and treatment | NHS", "NHS")],
    "period_pain": [_yt("P9ddmRiKM_g", "Painful periods: Pain relief and when to seek help | NHS", "NHS")],
    "irregular_periods": [_yt("A7A_a94ghas", "What you need to know about irregular periods", "NHS 24")],
    "menopause": [_yt("fPmvThZi2i4", "Perimenopause explained: symptoms, signs and what to expect", "NHS 24")],
    "gestational_diabetes": [_yt("TOlTrQvNCKo", "Gestational diabetes | NHS", "NHS")],
    "postnatal_depression": [_yt("HcTtHp2aD6Q", "Symptoms of postnatal depression | NHS", "NHS")],
    "pre_eclampsia": [_yt("EglNVFq4w68", "What is Pre-Eclampsia", "APEC-UK (Action on Pre-eclampsia)")],
    "infertility": [_yt("evMW17odXN4", "Understanding Infertility | Ask Cleveland Clinic's Expert", "Cleveland Clinic")],
}
_WHO_AR = "https://www.who.int/ar/news-room/fact-sheets/detail/"
AR_PAGES: dict[str, dict] = {  # WHO Arabic fact sheets, each returned 200 on 22 Nov 2026
    "pcos": {"kind": "page", "url": _WHO_AR + "polycystic-ovary-syndrome", "title": "مُتلازمة المبيض المتعدد الكيسات", "publisher": "منظمة الصحة العالمية"},
    "endometriosis": {"kind": "page", "url": _WHO_AR + "endometriosis", "title": "الانتباذ البطاني الرحمي", "publisher": "منظمة الصحة العالمية"},
    "menopause": {"kind": "page", "url": _WHO_AR + "menopause", "title": "الإياس (سن اليأس)", "publisher": "منظمة الصحة العالمية"},
    "gestational_diabetes": {"kind": "page", "url": _WHO_AR + "diabetes", "title": "داء السكري", "publisher": "منظمة الصحة العالمية"},
    "pre_eclampsia": {"kind": "page", "url": _WHO_AR + "pre-eclampsia", "title": "مقدمات الارتعاج", "publisher": "منظمة الصحة العالمية"},
    "infertility": {"kind": "page", "url": _WHO_AR + "infertility", "title": "العُقم", "publisher": "منظمة الصحة العالمية"},
}

# ---------------- matching ----------------
_ASK_EN = (
    r"\b(what('s| is| are| was)|whats|tell me|explain|define|definition|meaning|mean by|what causes|causes?|why|"
    r"symptoms?|signs?|how (do|does|is|are|can)|which hormones?|what hormones?|hormones?|learn|info|information|about|"
    r"understand)\b"
)
_ASK_AR = r"(ما هو|ما هي|ماهو|ماهي|ما |وش|ايش|شو|شنو|اشرحي|اشرح|فسري|عرفيني|عرفني|حدثيني|كلميني|معني|سبب|اسباب|اعراض|علامات|هرمون|عن )"
_BODY_EN = (
    r"\b(what('s| is) (happening|going on|wrong|up) (with|to|in) (my body|me)|what('s| is) happening to my body|"
    r"(explain|describe|summari[sz]e) (my )?(body|patterns|record|entries|symptoms)|what do my (patterns|entries|symptoms|records?) (mean|show|say)|"
    r"what does my (record|body|data) (show|say|mean)|is something wrong with (me|my body)|what('s| is) wrong with (me|my body))\b"
)
_BODY_AR = (
    r"((ماذا|ايش|وش|شو|شنو|ما الذي) (يحدث|يصير|صاير|يجري|فيه|في) (في|ب|مع|ل)? ?(جسمي|جسدي)|"
    r"(اشرحي|فسري|لخصي) (لي )?(جسمي|انماطي|سجلي|اعراضي)|(ايش|وش|شو|ماذا) (فيني|بي)|ما (بال|حال) جسمي)"
)


def condition(question: str) -> str | None:
    """The condition a short question names (EN or Gulf Arabic, after folding), or None."""
    t = record.clean(question)
    if len(t.split()) > MAX_WORDS:
        return None
    ar = bool(assistant.AR.search(question or ""))
    for cid, c in CONDITIONS.items():
        if re.search(c["en"], t) or (ar and re.search(c["ar"], t)):
            return cid
    return None


def is_explain_question(question: str) -> str | None:
    """A 'what is X / explain X / which hormones' question about a known condition: its id, else None."""
    cid = condition(question)
    if not cid:
        return None
    t = record.clean(question)
    ar = bool(assistant.AR.search(question or ""))
    short = len(t.split()) <= 4  # "PCOS?" or "endometriosis" on its own
    return cid if short or re.search(_ASK_EN, t) or (ar and re.search(_ASK_AR, t)) else None


_MED_EN = r"\b(medicines?|medications?|meds|drugs?|pills?|tablets?|prescription|prescribe\w*|dose|dosage|supplements?)\b"
_MED_AR = r"(دواء|ادويه|دوا|علاج دوائي|حبوب|اقراص|جرعه|مكملات)"


def asks_medicine(question: str) -> bool:
    """A medicine question about a named condition ("what medicine is good for PCOS?") that the word checks missed:
    it gets the assistant's fixed medicine reply first (never a medicine name), then what the condition is."""
    if not condition(question):
        return False
    t = record.clean(question)
    ar = bool(assistant.AR.search(question or ""))
    return bool(re.search(_MED_EN, t) or (ar and re.search(_MED_AR, t)))


def is_body_question(question: str) -> bool:
    t = record.clean(question)
    if len(t.split()) > MAX_WORDS:
        return False
    ar = bool(assistant.AR.search(question or ""))
    return bool(re.search(_BODY_EN, t) or (ar and re.search(_BODY_AR, t)))


# ---------------- her own record ----------------
def _her_patterns(bundle: dict | None, ref: date, lang: str, only: list[str] | None = None) -> tuple[list[dict], bool]:
    """Her active patterns as (lines, any red flag): title, her numbers and the rule's source; red flags first."""
    if not bundle:
        return [], False
    ev = evaluate(bundle, ref)
    f = ev.features.values
    out, red = [], False
    for h in ev.all_hits:  # red flags come first in all_hits
        if only is not None and h.rule_id not in only:
            continue
        tr = cp.ar_rules().get(h.rule_id, {}) if lang == "ar" else {}
        title = cp.title(h.rule_id, lang) or tr.get("title") or h.title  # the Patterns page's own title
        if h.kind == "red_flag":
            red = True
            msg = tr.get("message") or h.message
            text = f"{title}: {msg}"
        else:
            detail = cp.detail(h.rule_id, h.values, f, lang, h.entry_date).strip()
            text = f"{title}. {detail}" if detail else f"{title}."
        out.append({"rule_id": h.rule_id, "kind": h.kind, "text": text, "cite": (h.source_ids or [None])[0]})
    return out, red


LEADS = {
    "explain": {"en": "Here is what {name} is, in plain words.", "ar": "إليكِ شرح {name} بكلمات بسيطة."},
    "yours": {
        "en": "In your own record: your Patterns page shows a related pattern. It is not a diagnosis; it is worth discussing with a doctor.",
        "ar": "في سجلّكِ: تُظهر صفحة الأنماط نمطاً مرتبطاً. هذا ليس تشخيصاً، ومن المفيد مناقشته مع طبيبة.",
    },
    "yours_none": {
        "en": "Your own entries do not meet the pattern rules related to {name} right now. That is not a sign that nothing is wrong: if something worries you, talk to your doctor.",
        "ar": "لا تستوفي تسجيلاتكِ حالياً قواعد الأنماط المرتبطة بـ{name}. وهذا لا يعني أن كل شيء على ما يرام: إذا كان هناك ما يقلقكِ فتحدّثي مع طبيبتك.",
    },
    "body": {
        "en": "Here is what your own entries show. Rules written from published guidelines found these patterns. They are not a diagnosis, and only a doctor can tell what is behind them.",
        "ar": "إليكِ ما تُظهره تسجيلاتكِ. وجدت قواعد مكتوبة من إرشادات منشورة هذه الأنماط، وهي ليست تشخيصاً، والطبيب وحده يستطيع معرفة سببها.",
    },
    "body_none": {
        "en": "None of the pattern rules is met by your entries right now. That is not a sign that nothing is wrong: if something worries you, talk to your doctor. In an emergency call 998.",
        "ar": "لا تستوفي تسجيلاتكِ حالياً أيّاً من قواعد الأنماط. وهذا لا يعني أن كل شيء على ما يرام: إذا كان هناك ما يقلقكِ فتحدّثي مع طبيبتك. في حالات الطوارئ اتصلي بالرقم 998.",
    },
    "close": {
        "en": "Your Patterns page shows the exact days behind each one, and the Report tab turns them into a two-page summary for your doctor.",
        "ar": "تعرض صفحة الأنماط الأيام التي استندت إليها كل نتيجة، ويحوّلها تبويب التقرير إلى ملخّص من صفحتين لطبيبتك.",
    },
    "no_record": {
        "en": "Sign in to your record and I can also show what your own entries say.",
        "ar": "سجّلي الدخول إلى سجلّكِ لأعرض لكِ أيضاً ما تقوله تسجيلاتكِ.",
    },
}


def refusal(lang: str) -> str:
    """The assistant's own refusal, without its 'here is what our sources say' tail (the explainer follows instead)."""
    text = assistant.REFUSAL[lang]
    return text.split(" Here is")[0] if lang == "en" else text.split(" هذا ما تقوله")[0]


def answer(question: str, lang: str, bundle: dict | None, ref: date, *, mode: str, refuse: bool = False) -> dict:
    """mode: "explain" (what is X), "diagnosis" (do I have X: refusal first), "medicine" (medicine for X: the fixed
    medicine reply first) or "body" (what is happening with my body).
    Returns {"lines": [{"text", "cite"}], "condition", "personal": [...], "red_flag": bool, "refused": bool, "pages"}."""
    lang = "ar" if lang == "ar" else "en"
    lines: list[dict] = []
    personal: list[dict] = []
    red = False
    cid = condition(question) if mode != "body" else None
    pages: list[str] = []
    related: list[str] = []
    if mode == "body":
        pats, red = _her_patterns(bundle, ref, lang)
        if refuse:  # "what is wrong with me?" read as a diagnosis request: the refusal first
            lines.append({"text": refusal(lang), "cite": None})
        if bundle is None:
            lines.append({"text": LEADS["no_record"][lang], "cite": None})
        elif pats:
            lines.append({"text": LEADS["body"][lang], "cite": None})
            personal = pats[:5]
            lines.extend({"text": p["text"], "cite": p["cite"]} for p in personal)
            lines.append({"text": LEADS["close"][lang], "cite": None})
            for p in personal:  # the related condition pages and videos, so she can read and watch more
                for rcid, c in CONDITIONS.items():
                    if p["rule_id"] in c["rules"]:
                        pages.extend(c["pages"][:1])
                        related.append(rcid)
        else:
            lines.append({"text": LEADS["body_none"][lang], "cite": None})
        return {"lines": lines, "condition": None, "personal": personal, "red_flag": red, "refused": refuse,
                "pages": list(dict.fromkeys(pages)), "related": list(dict.fromkeys(related))}

    c = CONDITIONS[cid]
    name = c["name"][lang]
    facts = c["lines"] if mode == "explain" else c["lines"][:4]
    if mode == "medicine":  # what it is and how a doctor checks, no treatment sentences beyond "a doctor can explain"
        facts = c["lines"][:3]
    if mode == "diagnosis":
        lines.append({"text": refusal(lang), "cite": None})
    elif mode == "medicine":
        lines.append({"text": assistant.MEDICINE_TEXT[lang], "cite": None})
    else:
        lines.append({"text": LEADS["explain"][lang].format(name=name), "cite": None})
    lines.extend({"text": (en if lang == "en" else ar), "cite": src} for en, ar, src in facts)
    if bundle is not None:
        pats, red = _her_patterns(bundle, ref, lang, only=c["rules"])
        if pats:
            personal = pats[:3]
            lines.append({"text": LEADS["yours"][lang], "cite": None})
            lines.extend({"text": p["text"], "cite": p["cite"]} for p in personal)
        elif mode == "diagnosis":
            lines.append({"text": LEADS["yours_none"][lang].format(name=name), "cite": None})
    return {"lines": lines, "condition": cid, "personal": personal, "red_flag": red, "refused": mode == "diagnosis",
            "pages": list(c["pages"]), "related": [cid]}
