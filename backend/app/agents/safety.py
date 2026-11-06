"""Safety routing for the assistant: crisis, urgent signs, medicine questions and diagnosis requests (EN + AR/Gulf).

Why concepts, not phrases: a held-out test written by independent reviewers (tests/rag_heldout.jsonl, round 1) showed
that phrase lists tuned on our own examples caught 9 of 36 crisis messages and 4 of 44 emergencies. Women describe these
things indirectly ("stood on the balcony", "baby is so quiet today", "c section 5 days ago and the wound smells"). So each
check looks for a combination of ideas anywhere in the message: a pregnancy cue plus a warning sign, heavy bleeding plus
fainting, a medicine plus an action, "me" plus a condition plus a request for a verdict.

Crisis is tuned for recall: showing the support message to someone who did not need it costs little; missing it costs a
life (CLAUDE.md rule 5). This module decides only how to route a message; what to say comes from the rules file and the
knowledge base. It adds no clinical threshold.
"""

from __future__ import annotations

import re

_DIAC = re.compile(r"[ً-ْٰـ]")
_FOLD = str.maketrans(
    {
        "’": "'", "‘": "'", "ʼ": "'", "`": "'", "´": "'",
        "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي",
        "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
        "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
    }
)  # fmt: skip


def norm(text: str) -> str:
    """Lower case; no Arabic diacritics; one form per Arabic letter family; Western digits; straight apostrophes."""
    t = _DIAC.sub("", (text or "").lower()).translate(_FOLD)
    t = re.sub(r"(.)\1{2,}", r"\1", t)  # elongation: وااايد, soooo
    return re.sub(r"\s+", " ", t)


def _c(*patterns: str) -> re.Pattern:
    """One compiled pattern from several alternatives, folded the same way as the text."""
    return re.compile("|".join(f"(?:{norm_pattern(p)})" for p in patterns))


def norm_pattern(p: str) -> str:
    return _DIAC.sub("", p).translate(_FOLD)


# ---------------------------------------------------------------------------------------------------------- crisis
CRISIS = _c(
    # explicit
    r"\bsuicid",
    r"\bkill(ing)? my ?self\b",
    r"\bself[- ]?harm",
    r"\b(harm|hurt|cut|burn)(ing)? (my ?self)\b",
    r"\bend(ing)? (my|it) (own )?(life|all)\b",
    r"\bend(ing)? it all\b",
    r"\b(take|taking) my (own )?life\b",
    r"\boverdos(e|ing) on purpose\b",
    # wishing to die or not to exist
    r"\b(want|wanted|wanting|wish|wishing|rather) (to )?(die|be dead|not (be )?alive|not exist|disappear for good)\b",
    r"\b(rather|better off) (be )?dead\b",
    r"\bbetter off without me\b",
    r"\bmanage (fine |ok )?without me\b",
    r"\b(easier|better) for (everyone|everybody|them|him|all of them) if i\b",
    r"\b(i'?m|i am) (just )?a burden\b",
    r"\b(do not|don'?t|dont) want to (live|be alive|be here|wake up|exist|go on)\b",
    r"\bto (not|never) wake up\b",
    r"\b(not|never) wake up again\b",
    r"\bdon'?t (want|have) to wake up\b",
    r"\bwish i (wouldn'?t|didn'?t|won'?t) wake up\b",
    r"\btakes? me in my sleep\b",
    r"\bnot exist( anymore| any ?more)?\b",
    r"\bstop existing\b",
    r"\bcease to exist\b",
    r"\bwish i (was|were) (dead|gone|never born)\b",
    r"\bgo where (she|he|they) (is|are)\b",
    r"\b(life|it) (is|isn'?t|is not) (not )?worth (living|it anymore)\b",
    r"\bno (reason|point) (in |to )?(living|live|go on)\b",
    r"\bdua\b.{0,40}\btakes? me\b",
    r"\b(ask|asking|beg|begging) (allah|god) to take me\b",
    # thoughts, plans, means, preparation
    r"\bthoughts? (of|about) (harming|hurting|killing|ending|dying)\b",
    r"\b(think|thinking|thought) about (how i would do it|how to do it|ending it|killing)\b",
    r"\bhow i would do it\b",
    r"\bproper plans\b",
    r"\bplans? (to|for) (kill|end|die)\b",
    r"\b(stood|standing|stand) on the (balcony|ledge|roof|bridge)\b.{0,100}\b(floor|how easy|jump|end it|thinking)\b",
    r"\b(balcony|ledge|roof|bridge|jump\w*|floor)\b.{0,80}\bhow easy it would be\b",
    r"\bjump(ing)? (off|from) (the |a )?(balcony|building|bridge|roof)\b",
    r"\bturn(ing)? the wheel into\b",
    r"\b(drive|driving|crash|crashing) (my car )?into (the |a )?(barrier|wall|truck)\b",
    r"\bhow many (panadol|paracetamol|pills|tablets|sleeping pills)\b.{0,60}\b(not wake|die|dead|kill|end|forever)\b",
    r"\b(keeping|saving|hoarding|stockpil\w*|counting) (them|the|my|all|up)?\s?(pills|tablets|sleeping tablets)?\b.{0,40}\b(drawer|count them|instead of taking)\b",
    r"\b(goodbye|farewell) (letter|note|message)s?\b",
    r"\bletters? for (my|her|his) \w+ for when\b",
    r"\bgave (away )?(my|all my) (gold|jewel\w*|things)\b",
    r"\bmade up my mind\b.{0,80}\b(letter|calm|won'?t need)\b",
    # self-harm acts
    r"\b(cutting|cut|slicing) (my )?(thighs?|arms?|wrists?|skin|legs?)\b",
    r"\brazor\b.{0,40}\b(cut|thighs?|arms?|skin)\b",
    r"\bdig (my )?nails into\b",
    r"\bscratch\w*\b.{0,30}\b(till|until) (it |they )?bleed",
    r"\bbang(ing)? my head\b",
    # harming the baby
    r"\bpillow over (her|his|the baby'?s?) face\b",
    r"\bpress\w* (it|the pillow|a pillow) over\b",
    r"\btake (the baby|her|him|my baby|the kids?) with me (when i go|and (go|die|end)|from this)\b",
    r"\b(shake|shaking) (her|him|the baby) (hard|until|till|so)\b",
    r"\b(throw|thrown|throwing) (her|him|the baby|my baby) (out of|from|off) the (window|balcony)\b",
    r"\bget rid of (her|him|the baby)\b",
    r"\b(scared|afraid) (to be alone with|of hurting) (her|him|the baby|my baby)\b",
    r"\b(scared|afraid) of myself\b",
    r"\b(want|wanted|urge|urges|feel like|going|tempted) to (hurt|harm|kill|shake|smother|drown) (my|the|our|her|him) ?(baby|babies|child|newborn|son|daughter|infant)?\b",
    r"\b(kill|smother|drown)(ing)? (my|the|our) (baby|babies|child|newborn|son|daughter|infant)\b",
    # EPDS item 10 disclosed in words
    r"\bharm(ing)? myself\b.{0,60}\b(sometimes|quite often|yes|ticked|still)\b",
    r"\bticked\b.{0,60}\bharm",
    # Arabic (MSA and Gulf)
    r"انتحار",
    r"انتحر",
    r"اقتل (نفسي|حالي)",
    r"ايذاء (نفسي|النفس)",
    r"اذي نفسي",
    r"اذيه نفسي",
    r"انهي حياتي",
    r"انهاء حياتي",
    r"اريد (ان اموت|الموت)",
    r"اتمني (الموت|ان اموت|اني اموت)",
    r"(ابي|ابغي|ابا|ودي) اموت",
    r"\bلو (انا )?مت\b",
    r"(الكل|كلهم|الجميع|اهلي|ريلي|زوجي) (بيرتاح|يرتاح|بيرتاحون|يرتاحون) .{0,20}لو",
    r"(لا اريد|ما ابي|ما ابا|ما ابغي|مابي|مابا|ماابي) (ان )?(اعيش|العيش|اكمل حياتي)",
    r"لا ارغب في الحياه",
    r"الحياه (لا|ما) تستاهل|الحياه لا تستحق",
    r"اتمني (اني )?ما (اقعد|اصحي|اقوم)",
    r"(ربي|الله) ياخذني",
    r"ادعي .{0,20}ياخذني",
    r"ارتاح من (هالدنيا|الدنيا|الحياه|حياتي|هالحياه)",
    r"اخلص من (هالحياه|الحياه|حياتي|الدنيا|هالدنيا)",
    r"(ادعم|اصدم|اطيح) .{0,20}(الحاجز|الجدار|الطوفه|الدرابزين)",
    r"لفيت السكان صوبه",
    r"رسا(يل|ئل) وداع",
    r"(اجرح|جرحت|اقطع) (يدي|ايدي|نفسي|رجلي|ذراعي|يديني)",
    r"اخدش .{0,20}(حتي|لين) ينزف",
    r"(افكار|افكر|ابي|ابا|ودي|اخاف|خايفه|اتخيل) .{0,20}\b(اذي|اوذي|ايذاء|اذيه|اقتل) (البيبي|الطفل|الياهل|بنتي|ابني|ولدي|طفلي|الرضيع|المولود)",
    r"ارميه من (الدريشه|الشباك|النافذه|البلكونه)",
    r"ارميها من (الدريشه|الشباك|النافذه|البلكونه)",
    r"(اهزها|اهزه) بقوه",
    r"(الطفله|البيبي|الياهل|بنتي|ولدي|الطفل).{0,40}اتخلص (منها|منه)",
    r"نروح من (هالدنيا|الدنيا)",
    r"خايفه من نفسي",
    r"scared of myself",
)

# Broader crisis concepts added after held-out round 2 (round 2 is now a development set; round 3 is the measure).
CRISIS_MORE = _c(
    r"\bif i (just )?(wasn'?t|weren'?t|was not|were not) (alive|here|around)\b",
    r"\btired of (existing|living|being alive|my life|life)\b",
    r"\bwhat('?s| is) the (use|point) of (my )?(life|living)\b",
    r"\b(feel|feeling|felt|thinking|think|thought) (like |of |about )?ending (it|my life|everything)\b",
    r"\bwish(ing)? i (hadn'?t|had not|didn'?t|did not|wouldn'?t|would not|never) (woken|woke|wake|wakes)( up)?\b",
    r"\bbetter (if|when|that) (i'?m|im|i am|i was|i were) (not here|gone|dead|not around)\b",
    r"\bnobody (would|will) (even )?(notice|care|miss me)\b",
    r"\b(written|wrote|writing) (goodbye )?letters? (for|to) my (mother|mum|mom|sisters?|family|husband|kids|children|son|daughter)\b",
    r"\bhow many\b.{0,40}\b(kill|kills|end it|end everything|die|not wake)\b",
    r"\b(enough|tablets?|pills?) to (kill|end|die)\b",
    r"\bwant (everything|it all|life|my life) to (stop|end)\b",
    r"\bfinish (my ?self|my life|it all)\b",
    r"\bburn(ing)? (my )?(wrists?|arms?|skin|thighs?)\b",
    r"\b(bang|banging|hit|hitting) my head (on|against)\b",
    r"\b(want|wanna|wish) to (go to|be with|join) (her|him|them|my (baby|daughter|son))\b",
    r"\b(ways|how) to (do it|end it|end my life)\b",
    r"\b(urge|urges) to (shake|hurt|harm|smother|hit)\b",
    r"\bdon'?t trust myself (with|around|alone)\b",
    r"(ياخد|ياخذ) (امانته|روحي)",
    r"(وقفت|واقفه|اقف) (علي|ع) (السور|الحافه|الدرابزين|البلكونه|حافه)",
    r"ارمي (نفسي|حالي)",
    r"انط من (السطح|البلكونه|الشباك|فوق)",
    r"(المخده|مخده|الوساده|وساده) (علي|ع) (وشه|وجهه|وشها|وجهها)",
    r"(مرعوبه|خايفه|اخاف) من (نفسي|حالي)",
    r"(اضرب|اخبط|ادق) راسي",
    r"(اخمش|اخدش|اجرح|اقطع|احرق) (ايدي|يدي|ذراعي|ايديني|جلدي|رجلي|نفسي|حالي|معصمي)",
    r"(فتت|افوت|اصدم|ادعم|اخبط|ادخل).{0,25}(حيط|الحيط|جدار|الجدار|الحاجز|الطوفه)",
    r"(بدي|ابي|ابا|عايزه|اريد) (الحقه|الحقها|الحق فيه|الحق بيه|اروح له|اروحله|اروح لها)",
    r"(ما الي|ماليش|مالي|ما عندي|ماعندي|ما لي) (نفس|خلق|رغبه) (اعيش|للعيش|للحياه|في الحياه|عيش)",
    r"(افكار|فكره|افكر) .{0,15}\b(اذيها|اذيه|اوذيها|اوذيه|اقتلها|اقتله)",
    r"(اخاف|خايفه) (اضل|اقعد|ابقي|اكون) (معها|معه|مع البيبي|مع البنت|مع الولد) (لحالي|بروحي|وحدي)",
    r"(جمعت|اجمع|خبيت|مخبيه|مخبيتها) .{0,25}(حبوب|حبات|دوا|ادويه)",
    r"(الليله|اليوم|بكره) (بسويها|اسويها|بعملها|راح اسويها|حسويها)",
    r"(ما|مب|مش) (اكون|ابقي|بكون) (عايشه|عايش|موجوده|علي قيد الحياه)",
    r"(هزيته|هزيتها|هزه|هزها) (بقوه|جامد)",
    r"(بسوي|اسوي|بعمل|اعمل|حعمل) (فيه|فيها|له|لها) شي",
    r"كم (حبه|قرص).{0,60}(ينتهي|اموت|يموت|انتهي|تقتل|يقتل)",
    r"ينتهي كل (شي|شيء)",
)
_TAKE_WITH = _c(
    r"\b(take|taking|bring) (her|him|the baby|my baby|them|the kids|my kids) with me\b",
    r"(اخذ|اخذه|اخذها|ناخذ|اخدها|اخده) .{0,12}معاي",
)
_GONE = _c(
    r"\bnot here\b|\bgone\b|\bdie\b|\bdead\b|\balive\b|ending it|end it|\bkill|go to (her|him)|when i go\b|from this world",
    r"هالدنيا|الدنيا|اموت|نموت|عايشه|نروح سوا|من بعدي",
)

# ---------------------------------------------------------------------------------------------------------- urgent
_POSTNATAL = _c(
    r"c[- ]?sec(tion)?",
    r"\bcs\b|\bc/s\b",
    r"caesarean|cesarean",
    r"\bdeliver(ed|y)\b|\bdeliverd\b",
    r"gave birth|given birth|had (my|the|our) baby",
    r"postpartum|post[- ]partum|\bpp\b|postnatal",
    r"baby is \d+ (days?|weeks?|months?) old",
    r"since (the )?(birth|delivery)",
    r"after (the )?(birth|delivery)",
    r"newborn",
    r"ولدت|الولاده|ولاده|والده طبيعي|القيصريه|قيصريه|(انا|وانا) نفسه|النفاس|نفاس",  # not bare نفسه ("itself")
)
_PREG = _c(
    r"pregnan",
    r"\b\d{1,2} ?(w|wk|wks|weeks?)\b",
    r"weeks? (along|pregnant)",
    r"ivf baby",
    r"\bexpecting\b",
    r"positive (pregnancy )?test",
    r"\b(first|second|third) trimester\b",
    r"حامل|حبلي|(?<!منع )(?<!اختبار )(?<!تحليل )الحمل|حملي|الجنين|جنيني|ببطني|بالاسبوع \d+|الاسبوع \d+|اسبوع \d+|\d+ (اسبوع|اسابيع)",
    r"(بال|في ال|ال)اسبوع (ال)?(اول|ثاني|ثالث|رابع|خامس|سادس|سابع|ثامن|تاسع|عاشر|حادي|\w*عشر|عشرين|ثلاثين|اربعين)",
    r"بالشهر|الشهر (الاول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع)|\b(my |baby )bump\b",
    r"بالخامس|بالسابع|بالثامن|بالتاسع|\bweek \d+|\d+ week",
)
_HEAVY = _c(
    r"(period|bleed\w*|bleding|flow|pads?|tampons?|blood).{0,30}(heav\w*|soak\w*|gush\w*|pour\w*|flood\w*|clots?)",
    r"(heav\w*|soak\w*|gush\w*|pour\w*|flood\w*).{0,30}(period|bleed\w*|bleding|flow|pads?|tampons?|blood)",
    r"clots? .{0,25}(lemon|plum|golf|size|large|big|huge)|(large|big|huge) clots?",
    r"soak\w* through",
    r"every (half )?(an )?hour.{0,30}(pad|tampon)|fill(ed|ing)? .{0,20}pad",
    r"(نزيف|الدم|الدوره|الفوطه|ينزل|نازله|نازل).{0,25}(غزير|وايد|واجد|كثير|مره|جلطات|جامد)|نزيف غزير|اغير الفوطه كل|بغير الفوطه كل|جلطات كبر|جلطات كبيره",
)
_FAINT = _c(
    r"\bfaint\w*",
    r"pass(ed)? out|nearly passed",
    r"\bdizz\w*",
    r"light ?headed",
    r"white as|\bpale\b",
    r"short of breath|breathless",
    r"can'?t stand|everything went (black|dark)",
    r"دايخ\w*|دوخه|يدوخ|اغمي|اغماء|مب قادره اوقف|ما اقدر اوقف|افقد الوعي|ساغمي",
)
_PREG_SIGN = _c(
    r"\bbleed\w*|\bbleding\b|\bspotting\b|\bclots?\b|\bgush\w*",
    r"(?<!take )(?<!draw )(?<!taking )(?<!drawing )\bblood\b(?! ?(test|tests|sugar|pressure|work|glucose|group|type|count|draws?|drawn|taken|samples?|\d times|twice))",
    r"cramps?.{0,40}(wave|contraction|bleed|blood)",
    r"water.{0,25}(broke|broken|break|leak|gush|trickl)|watery.{0,30}(stuff|fluid|discharge|trickl|leak)",
    r"(fluid|watery|clear).{0,25}leak\w*|leak\w*.{0,25}(fluid|water|watery|clear)",
    r"(face|hands|fingers).{0,30}(swell|swollen|puff)|swell\w*.{0,30}(face|hands|fingers)|ring off",
    r"(sudden\w*|overnight|so fast).{0,30}(swell|swollen|puff)|(swell|swollen|puff)\w*.{0,20}(suddenly|overnight|so fast)",
    r"vision|blurr\w*|flashing|flashes of light|seeing flash|zigzag|(black|dark|little) spots|spots (in|before|in front of)",
    r"(severe|horrible|worst|bad|terrible|awful|pounding|splitting).{0,20}headache|headache.{0,40}(severe|won'?t go|not going|worse|vision|blurr|flash|spots)",
    r"\bfever\b|high temp\w*|temp\w* (of |is |was )?(3[89]|4[01])|3[89](\.\d)? ?(c\b|°)|shiver\w*|\bchills\b",
    r"(baby|him|her|she|he).{0,30}(so quiet|quiet today|not mov|isn'?t mov|hasn'?t mov|stopped mov|moving less|less mov|not kick)",
    r"haven'?t felt (him|her|the baby|it) mov|no (kicks|movement)",
    r"sharp pain|stabbing|severe pain|pain (low )?on (my )?(left|right)|(left|right) side.{0,30}pain|pain.{0,30}shoulder|shoulder.{0,20}pain",
    r"(?<!تحليل )(?<!فحص )(?<!ضغط )(?<!سكر )(?<!يسحبوا )(?<!بيسحبوا )(?<!يسحبون )(?<!سحب )\b(ال)?دم\b(?! ?(تحليل|فحص))|نزيف|تنقيط|نزل علي|نزل مني|spotting",
    r"ماي الراس|ماء الراس|نزل (مني |علي )?(الماي|الماء|ماي|ماء)|يطلع مني|سايل|تسرب|تنزل سوائل|نزول سوائل",
    r"(ويهي|وجهي|يديني|ايديني|يدي|اصابعي).{0,20}(انتفخ|منتفخ|تورم)|(انتفخ|منتفخ|تورم)\w*.{0,20}(ويهي|وجهي|يديني|ايديني|اصابعي)|الخاتم ما يطلع|(فجاه|فجأه).{0,20}(انتفخ|تورم)",
    r"(صداع|راسي يعورني).{0,20}(حيل|شديد|قوي|ماخف|ما خف)|عيوني صايره|blurry|ومضات|نقط سودا|زغلله|تشوش",
    r"حراره|حرارتي|مصخنه|رجفه|\bحمي\b",
    r"ما يتحرك|حركه الجنين|حسيته مرتين|ما يرفس|قلت حركته|حركته (قلت|خفت|قليله)",
    r"(ما|مش|مو|مب) (عم )?(حسه|احسه|حاسه|حاسس|حسيته) (يتحرك|بيتحرك|يرفس)",
    r"عوار قوي|الم فظيع|الم حاد|عوار .{0,10}(قوي|مستمر)|تقلصات .{0,20}(مولمه|قويه|دم|نزيف)",
)
_POSTNATAL_SIGN = _c(
    r"\bfever\b|temperat\w*|temprature|shiver\w*|\bchills\b",
    r"wound.{0,40}(red|smell|pus|ooz|hot|open)|stitches.{0,30}(red|hot|smell|pus|open)|smells? bad",
    r"\bgush\w*|bleed\w*.{0,30}(again|more|heav|suddenly)|clots? .{0,25}(lemon|plum|golf|size|large|big)|(large|big|huge) clots?|fill(ed|ing)? .{0,20}pad",
    r"(horrible|severe|worst|terrible|bad).{0,20}headache|headache.{0,40}(worse|severe|bad|vision|light)",
    r"can'?t breath\w*|cant breath\w*|breathless|short(ness)? of breath|chest pain|pain in (my )?chest|chest (is )?(tight|hurts)|heart (racing|pounding)",
    r"\bleg\b.{0,40}(swollen|swell|red|pain|hurt|warm)|\bcalf\b",
    r"حراره|حرارتي|الجرح .{0,20}(محمر|حار|يطلع)|سايل اصفر|ينزل وايد|ينزل جامد|بغير الفوطه كل|اغير الفوطه كل|جلطات كبر|(حتت|قطع) كبيره",
    r"صدري .{0,30}(نفس|تنفس)|ضيق (في )?النفس|ضيق (في )?التنفس|تنهج|قلبي يدق",
    r"(ريلي|رجلي|ساقي|اجري|اجر).{0,30}(منتفخ|منفوخ|متورم|حمرا|سخنه)|منتفخه وحمرا|راسي يدوخ|صداع شديد",
)
_SUDDEN_PAIN = _c(
    r"(sudden\w*|out of nowhere|came on suddenly).{0,80}(pain|stabbing|cramp)|(pain|stabbing).{0,40}(came on suddenly|out of nowhere)",
    r"woke up .{0,30}pain.{0,60}(couldn'?t|faint|unbear|so bad)",
    r"(pain|stabbing).{0,60}(fainted|passed out|couldn'?t breathe)",
    r"worst pain",
    r"(فجاه|فجاة|فجأه|مفاجي).{0,40}(الم|عوار)",
    r"(الم|عوار).{0,40}(اغمي|افقد الوعي|ساغمي)",
)


def urgent_kind(text: str) -> str | None:
    """Which urgent message applies, if any. After birth is checked before pregnancy, because both mention weeks,
    and a message about the weeks after a birth is never treated as a pregnancy."""
    t = norm(text)
    after_birth = bool(_POSTNATAL.search(t))
    pregnant = bool(_PREG.search(t)) and not after_birth
    if _HEAVY.search(t) and _FAINT.search(t) and not pregnant and not after_birth:
        return "bleed"
    if after_birth and _POSTNATAL_SIGN.search(t):
        return "postnatal"
    if pregnant and _PREG_SIGN.search(t):
        return "pregnancy"
    if _HEAVY.search(t) and _FAINT.search(t):
        return "bleed"
    if _SUDDEN_PAIN.search(t):
        return "pain"
    return None


# ---------------------------------------------------------------------------------------------------------- medicine
_MED = _c(
    r"\bpills?\b|pill packs?|\btablets?\b|\bdos(e|es|age)\b|\bmg\b|\d+ ?mg\b|\bunits?\b|caps\b|capsules?|\biu\b",
    r"clomid|clomiphene|letrozole|metformin|glucophage|insulin|sertraline|fluoxetine|citalopram|antidepress\w*|progesterone|utrogestan|duphaston",
    r"tranexamic|cyklokapron|ibuprofen|brufen|mefenamic|ponstan|panadol|biogesic|paracetamol|aspirin|clexane|iron (tablets?|pills?|supplements?)|ferrous",
    r"contracepti\w*|the pill|birth control|yasmin|\byaz\b|diane|microgynon|cerazette|marvelon|hrt\b|antibiotics?|vitamin d|vit d",
    r"حبوب|حبه|دوا|دواء|ادويه|علاج|انسولين|وحدات|تحاميل|بروجسترون|الحديد|ميتفورمين|منع الحمل|للاكتئاب|بنادول|panadol",
    r"جلوكوفاج|دوفاستون|ياسمين|كلوميد|ليتروزول|بروفين|فيتامين د|ابره|ابر|حقنه|حقن",
)
_MED_ACT = _c(
    r"\b(can|should|could|may|do|shall) i (just )?(take|stop|start|skip|double|up|increase|reduce|lower|switch|change|keep|come off|use|try|mix|run)\b",
    r"\bstop(ping)? (it|them|taking|the (pill|pack|dose|meds?|tablets?))|\bstart(ing)? (it|them|taking|on)\b|\bcome off\b|\bwean\b",
    r"\bdouble (the |my |up )?(dose|pill|tablet)|\bskip(ping)? (a|the|my) (pill|dose)|\bmissed (a |my |the )?(pill|dose|day)",
    r"back to back|together with|at the same time|\bclash\w*|\bon my own\b|without (a )?prescription|\bok or no\b",
    r"is it (ok|okay|safe|fine) to (take|stop|start|use|have|mix|double)|\bkeep taking\b|\btake (it|them|more|less|one) (every|twice|daily)",
    r"اوقف\w*|وقفه|ابدا|ابدأ|اكمل|كمل|انزل\w*|من نفسي|بروحي|لحالي|بنفسي|بدون وصفه|اقدر|عادي|اخلص الشريط|اكمل عليه|ازيد\w*|اقلل",
    r"(ينفع|ممكن|اقدر|فيني) (اخد|اخذ|اكمل|اوقف|اوقفه|وقفه|ازيد)",
)
_FOLIC = _c(r"folic|فوليك")


def medicine(text: str) -> bool:
    t = norm(text)
    return bool(_MED.search(t) and _MED_ACT.search(t) and not _FOLIC.search(t))


# ---------------------------------------------------------------------------------------------------------- diagnosis
_SELF = _c(
    r"\bi\b|\bme\b|\bmy\b|\bam i\b|\bi'?m\b|\bu think i\b",
    r"عندي|فيني|انا|اني|مني|حقي|دورتي|تحاليلي|نتيجتي|نتايجي|طلع|طلعت",
)
_COND = _c(
    r"pcos|polycystic|\bendo\b|endometriosis|diabet\w*|prediabet\w*|hypothyr\w*|hypothyriod|thyroid|an(a)?emi\w*|fibroids?|fibriods?",
    r"menopause|perimenopause|infertil\w*|\bfertile\b|miscarr\w*|ectopic|adenomyosis|cancer|\bcondition\b|what (do|have) i (have|got)",
    r"thrush|\bbv\b|yeast infection|\buti\b|\binfection\b|\bstis?\b|\bstds?\b|chlamydia|pmdd|\bpms\b|depress\w*|anxiety|bipolar|which one i'?ve got",
    r"تكيس|متلازمه|بطانه (ال)?رحم|سكري|السكر|الغده|غده|فقر (ال)?دم|عقيم\w*|ورم|ليفي|الياف|انقطاع الطمث|سن (الياس|اليأس)|يطيح|اسقاط|شو عندي|عقم",
)
_VERDICT = _c(
    r"do (u|you) think|so am i|or what|yes or no|just tell me|tell me straight|straight answer|confirm",
    r"\bam i (a |an )?(pcos|diabetic|infertile|anaemic|anemic|pregnant|in menopause|going into|having|at risk|likely|more likely|fertile|sick|ill)\b",
    r"realistically|out of 10|chances?|\bodds\b|percent|%|how likely|probab\w*|what condition|which condition",
    r"what (do|have) i (have|got)|could (it|this|that) be|might be|is (it|this|that) (a |an )?(sign|pcos|endo|thyroid|diabet|fibroid|menopause|pmdd|depression)",
    r"does (this|that|it) mean|means? i\b|so i (have|am)|i'?m (diabetic|infertile|anemic|anaemic|in menopause)",
    r"رسمي|اكيد|\bصح\b|يعني|معناته|نسبه|احتمال|بالميه|بالمية|في الميه|تاكيد|قولي|قوليلي|تقوليلي|تكوليلي|خبريني|تفتكري",
    r"شو عندي|ايش عندي|هل (عندي|انا|اني)|هل (هذا|هذي) (يعني|علامه)|ممكن يكون|اذا (انا|اني)",
)
_ODDS_OR_VERDICT = _c(  # asking for a probability or a yes/no verdict about a condition: refused even without "I"
    r"yes or no|just tell me|tell me straight|straight answer|\bchances?\b|\bodds\b|percent|%|how likely|probab\w*",
    r"احتمال|نسبه|بالميه|بالمية|في الميه|كم بالم",
)


def diagnosis(text: str) -> bool:
    t = norm(text)
    if _COND.search(t) and _ODDS_OR_VERDICT.search(t):
        return True
    return bool(_SELF.search(t) and _COND.search(t) and _VERDICT.search(t))


def crisis(text: str) -> bool:
    t = norm(text)
    if CRISIS.search(t) or CRISIS_MORE.search(t):
        return True
    return bool(_TAKE_WITH.search(t) and _GONE.search(t))  # "take her with me" only with dying or not being here
