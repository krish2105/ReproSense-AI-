"""Nura's food lane (22 Nov 2026, G2: Krishna). "What should I eat on my period?" gets food and drink guidance from
the NHS and never a medicine.

- Written by code from fixed sentences, each tied to its NHS page (no model call, so nothing can be invented).
- Her own record personalises the lead: heavy-flow days she logged in the last 90 days put iron first.
- If she names an allergy or a food she can't eat, foods containing it are left out of the list, she is reminded to
  check labels and menus and not to cut food groups without her doctor, and 998 is given for a serious reaction.
- Safety routing runs first and is unchanged: a medicine word, an urgent sign or a crisis never reaches this lane.
- Pregnancy and breastfeeding questions stay with the knowledge answer: this guidance is about periods.
"""

from __future__ import annotations

import re
from datetime import date, timedelta

SOURCES = {
    "iron": "nhs_iron_deficiency_anaemia",
    "water": "nhs_water_drinks",
    "pain": "nhs_period_pain",
    "allergy": "nhs_food_allergy",
}

_FOOD_EN = re.compile(
    r"\b(eat|eating|food|foods|diet|drink|drinks|drinking|meal|meals|snack|snacks|nutrition|nutrients?|cravings?)\b"
)
_ASK_EN = re.compile(
    r"\b(what|which|should|can i|could i|is it ok|good|best|better|avoid|help|helps|recommend\w*|ideas?|suggest\w*|"
    r"tips?|any)\b|\?"
)
_FOOD_AR = re.compile(r"(آكل|اكل|أكل|ناكل|تاكل|طعام|أطعمة|اطعمة|اكلات|أكلات|غذاء|غذائي|تغذية|أشرب|اشرب|مشروب|وجب|حمية|رجيم)")
_ASK_AR = re.compile(r"(ماذا|وش|ايش|إيش|شو|هل|ممكن|أفضل|افضل|انسب|أنسب|اتجنب|أتجنب|يساعد|تنصح|انصح|مفيد|نصائح|\?|؟)")
_PERIOD = re.compile(r"\b(period|periods|menstrua\w*|cramps?|bleeding|cycle)\b|(الدورة|دورتي|الحيض|العادة|عادتي|مغص|تقلصات)")
_NOT_THIS_LANE = re.compile(
    r"\b(pregnan\w*|breastfeed\w*|breast-?feed\w*|baby|babies|newborn|formula)\b|(حامل|الحمل|حملي|رضاع|الرضاعة|طفلي|رضيع|مولود)"
)

# Allergy or "can't eat" phrases. The captured words are matched against each food below.
_ALLERGY_EN = re.compile(
    r"(?:allergic to|allergy to|allergies to|intolerant to|intolerance to|can'?t eat|cannot eat|don'?t eat|do not eat)\s+([a-z][a-z \-]{1,40}?)(?=[,.!?]|\s+(?:and|so|but|what|which|during|on|in)\b|$)"
)
_ALLERGY_EN_2 = re.compile(r"\b([a-z]+)\s+(?:allergy|intolerance)\b")
_ALLERGY_AR = re.compile(r"(?:حساسية\s+(?:من|ضد|تجاه|على)|ما\s+أقدر\s+آكل|ما\s+اقدر\s+اكل|لا\s+أستطيع\s+أكل|لا\s+آكل|ما\s+آكل)\s+([^\s،,.؟?!]+)")

# Each iron-rich food, with the words that rule it out.
FOODS = [
    {
        "en": "dark-green leafy vegetables like kale and watercress",
        "ar": "الخضار الورقية الداكنة مثل الكرنب الأجعد والجرجير المائي",
        "out": r"kale|watercress|greens|leafy|vegetables|كرنب|جرجير|خضار|سبانخ",
    },
    {
        "en": "cereals and bread with added iron",
        "ar": "الحبوب والخبز المدعّمة بالحديد",
        "out": r"gluten|wheat|bread|cereals?|grains?|coeliac|celiac|قمح|غلوتين|جلوتين|خبز|حبوب|سيلياك",
    },
    {"en": "meat", "ar": "اللحوم", "out": r"meat|red meat|beef|lamb|mutton|vegetarian|vegan|لحم|لحوم|نباتي"},
    {
        "en": "dried fruit like apricots, prunes and raisins",
        "ar": "الفواكه المجففة مثل المشمش والبرقوق والزبيب",
        "out": r"dried fruit|apricots?|prunes?|raisins?|fruit|مشمش|برقوق|زبيب|فواكه|تمر",
    },
    {
        "en": "pulses like beans, peas and lentils",
        "ar": "البقوليات مثل الفاصوليا والبازلاء والعدس",
        "out": r"pulses|legumes?|beans?|peas?|lentils?|chickpeas?|soy|soya|بقوليات|فاصوليا|فول|بازلاء|عدس|حمص|صويا",
    },
]


def _lower(q: str) -> str:
    return (q or "").lower().replace("’", "'")


def is_food_question(question: str, bundle: dict | None = None) -> bool:
    """A question asking what to eat or drink, about periods (not pregnancy or a baby)."""
    q = _lower(question)
    if _NOT_THIS_LANE.search(q):
        return False
    food = (_FOOD_EN.search(q) and _ASK_EN.search(q)) or (_FOOD_AR.search(q) and _ASK_AR.search(q))
    if not food:
        return False
    pregnant = bool(((bundle or {}).get("profile") or {}).get("pregnant"))
    return not pregnant or bool(_PERIOD.search(q))


def allergens(question: str) -> list[str]:
    """The foods she says she's allergic to or can't eat, as she wrote them (trimmed)."""
    q = _lower(question)
    found = [m.group(1).strip(" -") for m in _ALLERGY_EN.finditer(q)]
    found += [m.group(1) for m in _ALLERGY_EN_2.finditer(q) if m.group(1) not in ("food", "my", "an", "a")]
    found += [m.group(1).strip("،.؟?!") for m in _ALLERGY_AR.finditer(question or "")]
    out: list[str] = []
    for f in found:
        f = re.sub(r"^(any|eating|eat)\s+", "", f).strip()
        if f and f not in out and len(f) <= 40:
            out.append(f)
    return out


def _heavy_days(bundle: dict | None, ref: date) -> int:
    if not bundle:
        return 0
    lo = ref - timedelta(days=90)
    n = 0
    for lg in bundle.get("daily_logs", []):
        try:
            d = date.fromisoformat(str(lg["date"])[:10])
        except (KeyError, ValueError):
            continue
        if lo <= d <= ref and lg.get("flow") == "heavy":
            n += 1
    return n


def _ar_days(n: int) -> str:
    if n == 1:
        return "يوم واحد"
    if n == 2:
        return "يومين"
    return f"{n} أيام" if n <= 10 else f"{n} يوماً"


def _join(items: list[str], lang: str) -> str:
    if len(items) <= 1:
        return "".join(items)
    if lang == "ar":
        return "، ".join(items[:-1]) + " و" + items[-1]
    return ", ".join(items[:-1]) + " and " + items[-1]


def answer(question: str, lang: str, bundle: dict | None, ref: date) -> dict:
    """The food answer: {"lead", "lines": [{"text", "cite"}], "allergens", "dropped", "heavy_days"}."""
    avoid = allergens(question)
    avoid_re = [re.compile(f["out"]) for f in FOODS]
    dropped = [
        f[lang] for f, rx in zip(FOODS, avoid_re, strict=True) if any(rx.search(_lower(a)) for a in avoid)
    ]
    foods = [f[lang] for f in FOODS if f[lang] not in dropped]
    heavy = _heavy_days(bundle, ref)
    ar = lang == "ar"
    if heavy:
        lead = (
            f"سجّلتِ نزولاً غزيراً في {_ar_days(heavy)} خلال آخر 3 أشهر، لذلك يهمّك الحديد أكثر من غيره."
            if ar
            else f"You logged heavy bleeding on {heavy} day{'s' if heavy != 1 else ''} in the last 3 months, so iron matters most for you."
        )
        iron = ("كُلي المزيد من الأطعمة الغنية بالحديد: " if ar else "Eat more iron-rich foods: ") + _join(foods, lang) + "."
    else:
        lead = (
            "لا يوجد نظام غذائي خاص بالدورة، لكن هذه الأمور قد تساعدك."
            if ar
            else "There's no special period diet, but these can help."
        )
        iron = (
            "إذا كانت دورتك غزيرة، فكُلي المزيد من الأطعمة الغنية بالحديد: "
            if ar
            else "If your periods are heavy, eat more iron-rich foods: "
        ) + _join(foods, lang) + "."
    lines = [
        {"text": iron, "cite": "iron"},
        {
            "text": "الكميات الكبيرة من الشاي والقهوة والحليب ومنتجات الألبان تصعّب امتصاص الحديد، فأبعديها عن الوجبات الغنية بالحديد."
            if ar
            else "Large amounts of tea, coffee, milk and other dairy make it harder for your body to absorb iron, so keep them away from iron-rich meals.",
            "cite": "iron",
        },
        {
            "text": "اشربي بانتظام: نحو 6 إلى 8 أكواب من السوائل يومياً، وأكثر إذا كان الجو حاراً أو كنتِ نشيطة."
            if ar
            else "Drink regularly: about 6 to 8 cups or glasses of fluid a day, more if it's hot or you're active.",
            "cite": "water",
        },
        {
            "text": "لتخفيف التقلصات بلا أدوية: حمّام أو دش دافئ، ووسادة تدفئة أو قِربة ماء دافئ على البطن، وتدليك خفيف للبطن والظهر، ونشاط خفيف كالمشي أو السباحة أو اليوغا. وقد يساعد أيضاً عدم التدخين."
            if ar
            else "For cramps without medicine: a warm bath or shower, a heat pad or hot water bottle on your tummy, a gentle tummy and back massage, and gentle exercise like walking, swimming or yoga. Not smoking may also help.",
            "cite": "pain",
        },
    ]
    if avoid:
        names = _join(avoid, lang)
        lines.append(
            {
                "text": (
                    f"ذكرتِ أنك لا تستطيعين تناول {names}: تجنّبي أي طعام يحتوي عليه، وتحققي من ملصقات الأطعمة وقوائم المطاعم، ولا تحذفي مجموعات غذائية كاملة دون استشارة طبيبك. إذا تورّمت شفتاك أو لسانك أو حلقك أو صعب عليك التنفس بعد الأكل، اتصلي بالرقم 998 فوراً."
                    if ar
                    else f"You said you can't eat {names}: leave out any food with it in, check food labels and restaurant menus, and don't cut whole food groups without speaking to your doctor. If your lips, tongue or throat swell or you struggle to breathe after eating, call 998 now."
                ),
                "cite": "allergy",
            }
        )
    lines.append(
        {
            "text": "نورا لا تقترح أدوية؛ اسألي الصيدلي أو طبيبك عنها. وإذا كان الألم يمنعك من يومك المعتاد أو أصبحت دورتك أغزر، فراجعي طبيبك."
            if ar
            else "Nura doesn't suggest medicines; a pharmacist or your doctor can help with those. If pain stops your usual day or your periods get heavier, see your doctor.",
            "cite": "pain",
        }
    )
    return {"lead": lead, "lines": lines, "allergens": avoid, "dropped": dropped, "heavy_days": heavy}


MEDICINE_WORDS = re.compile(
    r"\b(painkillers?|ibuprofen|paracetamol|naproxen|mefenamic|aspirin|tablets?|pills?|medicines?|medication|drugs?|"
    r"tranexamic|supplements?)\b|(مسكن|مسكنات|دواء|أدوية|ادوية|حبوب|بروفين|باراسيتامول|بنادول)"
)
