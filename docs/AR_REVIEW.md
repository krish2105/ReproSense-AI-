# Arabic review sheet (AR-REVIEW)

Arabic strings added or changed on 5–6 Nov 2026, next to their English. A native speaker should check meaning, tone
(warm, direct, feminine address where the screen is hers) and medical terms (Arabic term + the English abbreviation a
doctor uses). Also check the judge panel's notes: normal period days must not be called نزيف (haemorrhage), clots must
not be جلطات (thromboses), and flooding must not be الإغراق (QUESTIONS #49, R6). Edit `apps/web/messages/ar.json`
directly and keep numbers and placeholders like `{clinic}` unchanged. Every occurrence of the three flagged terms is
listed at the end ("Flagged terms").

## Assistant safety replies (`backend/app/agents/assistant.py`)

Fixed replies the assistant gives before or instead of an answer. Highest priority for review: these reach a woman
in crisis or in an emergency. Edit them in `assistant.py` (`URGENT_TEXT`, `MEDICINE_TEXT`, `REFUSAL`, `NOT_FOUND`).

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `URGENT_TEXT.crisis` | You deserve support right now. If you took too many tablets or hurt yourself badly, or feel you can't keep yourself or someone else safe, call 998 now. Please also talk to a doctor today, and to someone you trust. You are not alone. | أنتِ تستحقين الدعم الآن. إذا تناولتِ حبوباً أكثر من اللازم أو آذيتِ نفسكِ بشدة، أو شعرتِ بأنكِ لا تستطيعين الحفاظ على سلامتكِ أو سلامة غيركِ، اتصلي بالرقم 998 الآن. وتحدّثي اليوم مع طبيب أو طبيبة، ومع شخص تثقين به. لستِ وحدكِ. | |
| `URGENT_TEXT.bleed` | Call 998 or go to the nearest emergency department if this is happening now. Very heavy bleeding with dizziness or fainting needs urgent care. | اتصلي بالرقم 998 أو توجهي إلى أقرب قسم طوارئ إذا كان هذا يحدث الآن. النزيف الغزير جداً مع الدوخة أو الإغماء يحتاج رعاية عاجلة. | |
| `URGENT_TEXT.pregnancy` | Call 998 or go to your maternity unit now if this is happening. These signs in pregnancy need checking today. | اتصلي بالرقم 998 أو توجهي إلى وحدة الولادة الآن إذا كان هذا يحدث. هذه العلامات أثناء الحمل تحتاج فحصاً اليوم. | |
| `URGENT_TEXT.postnatal` | Call 998 or go to the nearest emergency department if this is happening now. After a birth or a pregnancy loss, get urgent care for a fever, very heavy bleeding or feeling faint. Do the same for tummy pain that is severe or getting worse, or a severe headache. Also get urgent care for chest pain, trouble breathing, or pain or swelling in one leg. You were right to ask. | اتصلي بالرقم 998 أو توجّهي إلى أقرب قسم طوارئ إذا كان هذا يحدث الآن. بعد الولادة أو فقدان الحمل، اطلبي رعاية عاجلة عند ارتفاع الحرارة أو النزيف الغزير جداً أو الشعور بالإغماء. وكذلك عند ألم البطن الشديد أو المتزايد، أو الصداع الشديد. واطلبي رعاية عاجلة أيضاً عند ألم الصدر أو ضيق التنفس أو ألم إحدى الساقين أو تورّمها. سؤالكِ في محلّه. | |
| `URGENT_TEXT.pain` | Call 998 or go to the nearest emergency department if this is happening now. Sudden, severe pain needs urgent care. | اتصلي بالرقم 998 أو توجهي إلى أقرب قسم طوارئ إذا كان هذا يحدث الآن. الألم المفاجئ الشديد يحتاج رعاية عاجلة. | |
| `MEDICINE_TEXT` | I can't advise on medicines, doses or stopping a treatment. Please ask your doctor or pharmacist, and bring your report so they can see your history. | لا أستطيع تقديم نصائح عن الأدوية أو الجرعات أو إيقاف العلاج. اسألي طبيبتك أو الصيدلي، وأحضري تقريرك ليطّلعوا على سجلّك. | |
| `REFUSAL` | I can't tell whether any condition is present, and I don't give chances or percentages. Only a doctor can assess that. Here is what our trusted sources say doctors look at, so you can ask about it: | لا أستطيع أن أخبرك إن كانت لديك حالة مرضية، ولا أعطي نسباً أو احتمالات. الطبيب وحده يستطيع التقييم. هذا ما تقوله مصادرنا الموثوقة عمّا ينظر إليه الأطباء، لتسألي عنه: | |
| `NOT_FOUND` | I could not find this in ReproSense's trusted sources, so I won't guess. Please ask your doctor, and bring your report. | لم أجد إجابة لهذا في مصادر ReproSense الموثوقة، لذلك لن أخمّن. اسألي طبيبتك وأحضري تقريرك. | |

## Safety and crisis copy

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `safety.crisisTitle` | You deserve support right now | أنتِ تستحقين الدعم الآن | |
| `safety.crisisBody` | Please call 998 or speak to your doctor today. You are not alone. | اتصلي بالرقم 998 أو تحدثي مع طبيبتكِ اليوم. لستِ وحدكِ. | |
| `safety.crisisNote` | This shows because of your last mood check. No score is shown. | يظهر هذا بسبب آخر فحص للمزاج. لا تُعرض أي درجة. | |
| `safety.call` | Call 998 | اتصلي بالرقم 998 | |

## Landing evidence (numbers re-checked 6 Nov)

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `landing.ev1` | Up to 70% of women with PCOS are not aware of it, the World Health Organization estimates. In the UAE Healthy Future Study, 25.9% of 1,040 Emirati women aged 25 to 67 reported PCOS; in one Dubai hospital's records, it was coded for 1.6% of women aged 15 to 45. The two studies count different groups in different ways. | تقدّر منظمة الصحة العالمية أن ما يصل إلى 70% من النساء المصابات بمتلازمة تكيّس المبايض لا يعلمن بذلك. وفي دراسة الإمارات للمستقبل الصحي، أفادت 25.9% من 1,040 امرأة إماراتية بين 25 و67 عاماً بإصابتهن بالمتلازمة، بينما سُجّلت في سجلات أحد مستشفيات دبي لدى 1.6% من النساء بين 15 و45 عاماً. وتختلف الدراستان في الفئات المشمولة وطريقة العدّ. | |
| `landing.ev2` | Endometriosis takes years to name. Across 23 studies worldwide, the average delay from first symptoms was 6.8 years. In a UAE study of 518 women with confirmed endometriosis, it was 11.6 years. | يستغرق التعرّف على بطانة الرحم المهاجرة سنوات: في 23 دراسة حول العالم بلغ متوسط التأخر 6.8 سنوات منذ الأعراض الأولى، وفي دراسة إماراتية شملت 518 امرأة مؤكَّدة الإصابة بلغ 11.6 سنة. | |
| `landing.ev3` | About 1 in 5 pregnancies in Al Ain's Mutaba'ah study had gestational diabetes (21.3%). After the birth, the glucose test that catches type 2 diabetes early is easy to miss: at one Al Ain hospital (2013–14 data), only 265 of 1,043 women who had gestational diabetes (25.4%) came back for it. | في دراسة «مُتابعة» في العين، أُصيبت نحو حالة حمل من كل خمس بسكري الحمل (21.3%). وبعد الولادة يسهل أن يُفوَّت اختبار الجلوكوز الذي يكشف السكري من النوع الثاني مبكراً: في أحد مستشفيات العين (بيانات 2013–2014) عادت 265 فقط من أصل 1,043 امرأة أُصبن بسكري الحمل لإجرائه (25.4%). | |
| `landing.ev4` | Abu Dhabi is already moving: in September 2026 the Department of Health launched its Programme for the Future of Reproductive Health, built on prevention and early screening, with a goal of raising IVF success from 59% to 80% by 2030. | أبوظبي تتحرك بالفعل: أطلقت دائرة الصحة في سبتمبر 2026 برنامج مستقبل الصحة الإنجابية، القائم على الوقاية والفحص المبكر، بهدف رفع نسبة نجاح أطفال الأنابيب من 59% إلى 80% بحلول 2030. | |

## AI switch (privacy, assistant, join)

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `assistant.offTitle` | The assistant is off | المساعد متوقف | |
| `assistant.offBody` | AI features are off in Privacy, so nothing you type here is sent to a language model. Your patterns, timeline and report work as before. | ميزات الذكاء الاصطناعي متوقفة في صفحة الخصوصية، لذلك لا يُرسَل أي شيء تكتبينه هنا إلى نموذج لغوي. تعمل أنماطك وسجلك الزمني وتقريرك كما كانت. | |
| `assistant.offAction` | Change this in Privacy | تغيير ذلك من صفحة الخصوصية | |
| `privacy.purpose.assistant` | Use AI features (the assistant, and AI wording of your pattern cards) | استخدام ميزات الذكاء الاصطناعي (المساعد، وصياغة بطاقات الأنماط) | |
| `privacy.aiHint` | Off: the assistant closes and your cards use fixed wording. Your patterns and report stay the same, because rules find them. | عند الإيقاف يتوقف المساعد وتُكتب بطاقاتك بصياغة ثابتة. تبقى أنماطك وتقريرك كما هي، لأن القواعد هي التي تكتشفها. | |
| `join.useAi` | Use AI features: the assistant answers my questions and AI words my pattern cards. I can turn this off in Privacy. | استخدام ميزات الذكاء الاصطناعي: يجيب المساعد عن أسئلتي ويصوغ بطاقات الأنماط. يمكنني إيقاف ذلك من صفحة الخصوصية. | |

## Privacy and sharing

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `clinic.noShareBody` | She hasn't shared her record with this clinic. It appears here only after she shares her record. | لم تشارك سجلّها مع هذه العيادة. يظهر هنا فقط بعد أن تشارك سجلّها. | |
| `report.shareBody` | Anyone you give this link to can open this report for 7 days, so give it only to your doctor or clinic. You can stop sharing at any time, and every opening is logged. | يستطيع أي شخص تعطينه هذا الرابط فتح التقرير لمدة 7 أيام، لذلك أعطيه لطبيبتك أو عيادتك فقط. يمكنك إيقاف المشاركة في أي وقت، ويُسجَّل كل فتح للتقرير. | |
| `report.consent` | I agree to share this report through a link that works for 7 days | أوافق على مشاركة هذا التقرير عبر رابط يعمل لمدة 7 أيام | |
| `report.qrCaption` | Your doctor scans this to open the shared report. It expires {date}, and every opening is logged. | تمسح طبيبتك هذا الرمز لفتح التقرير المشارك. تنتهي صلاحيته في {date}، ويُسجَّل كل فتح له. | |
| `privacy.roles.share_link` | Someone with your share link | شخص لديه رابط المشاركة | |
| `privacy.noClinic` | Not linked to a clinic yet. Join from your clinic's invite to share with it. | سجلّك غير مرتبط بعيادة بعد. انضمي من رابط دعوة عيادتك لتشاركي معها. | |
| `join.share` | Share my record with {clinic} until I stop it. I can stop at any time in Privacy. | مشاركة سجلّي مع {clinic} حتى أوقفها. يمكنني الإيقاف في أي وقت من صفحة الخصوصية. | |

## Home, cycle arc and empty states

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `home.noneTitle` | No patterns to discuss yet | لا توجد أنماط للنقاش بعد | |
| `home.noneBody` | Nothing in your entries matches a pattern doctors look at. We check again every time you log. | لا شيء في إدخالاتك يطابق نمطاً ينظر إليه الأطباء. نتحقق مجدداً في كل مرة تسجّلين فيها. | |
| `arc.estimateNote` | Your cycles vary, so phases are estimates, not predictions. | دوراتكِ متفاوتة، لذا فالمراحل تقديرات وليست توقعات. | |
| `arc.estimateNotePeri` | Cycles often change in perimenopause, so phases are estimates. | كثيراً ما تتغير الدورات في مرحلة ما حول انقطاع الطمث، لذا فالمراحل تقديرات. | |
| `arc.phases.fertile` | Fertile (estimate) | الخصوبة (تقدير) | |
| `arc.notContraception` | Phase estimates are not contraception. | تقديرات المراحل ليست وسيلة لمنع الحمل. | |
| `arc.estimateNoteNew` | Fewer than two full cycles are logged, so phases are rough estimates. | سُجّلت أقل من دورتين كاملتين، لذلك المراحل تقديرات تقريبية. | |

## Join and clinic invite

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `clinic.inviteTitle` | Invite patients | دعوة المرضى | |
| `clinic.inviteBody` | Patients scan this code to start their own record. Each one decides whether to share it with your clinic; nothing is shared by default. | تمسح المريضات هذا الرمز لبدء سجلّهن. كلّ منهن تقرّر إن كانت ستشاركه مع عيادتك، ولا يُشارَك شيء تلقائياً. | |
| `clinic.inviteCopy` | Copy invite link | نسخ رابط الدعوة | |
| `clinic.inviteCopied` | Invite link copied. | تم نسخ رابط الدعوة. | |
| `clinic.inviteOpen` | Open the invite page | فتح صفحة الدعوة | |
| `clinic.inviteQrLabel` | QR code of the patient invite link | رمز QR لرابط دعوة المرضى | |
| `arc.noCycleTitle` | Your cycle day appears here | يظهر يوم دورتك هنا | |
| `arc.noCycleBody` | Log the day your period starts and ReproSense estimates where you are in your cycle. Everything stays in your record. | سجّلي يوم بدء الدورة الشهرية وسيقدّر ReproSense موقعك في الدورة. يبقى كل شيء في سجلّك. | |
| `arc.noCycleAction` | Log your period | سجّلي دورتك | |
| `join.metaTitle` | Start your own record | ابدئي سجلّك | |
| `join.step` | Step {n} of 3 | الخطوة {n} من 3 | |
| `join.invitedBy` | Invited by {clinic} | بدعوة من {clinic} | |
| `join.h1` | Start your own record | ابدئي سجلّك | |
| `join.lede` | Two minutes, a few questions. Your entries stay yours: you decide what a clinic sees. | دقيقتان وبضعة أسئلة. تبقى إدخالاتك ملكك: أنتِ من تقرّر ما تراه العيادة. | |
| `join.promise1` | Only you see your entries. | لا يرى إدخالاتك أحد سواك. | |
| `join.promise2` | A clinic sees your report only if you share it, and you can stop at any time. | لا ترى العيادة تقريرك إلا إذا شاركتِه، ويمكنك إيقاف المشاركة في أي وقت. | |
| `join.promise3` | You can download or delete everything from the privacy page. | يمكنك تنزيل كل شيء أو حذفه من صفحة الخصوصية. | |
| `join.demoNote` | This is a demo. Use a nickname and made-up details, not your real health information. Demo records are deleted at the next reset. | هذا عرض تجريبي. استخدمي اسماً مستعاراً وتفاصيل غير حقيقية، لا معلوماتك الصحية الفعلية. تُحذف سجلات العرض عند إعادة الضبط التالية. | |
| `join.continue` | Continue | متابعة | |
| `join.back` | Back | رجوع | |
| `join.aboutTitle` | About you | عنكِ | |
| `join.name` | First name or nickname | الاسم الأول أو اسم مستعار | |
| `join.age` | Age | العمر | |
| `join.ageHint` | 18 or older | 18 عاماً أو أكثر | |
| `join.region` | Where you live | مكان السكن | |
| `join.stage` | What fits you best right now? | ما الذي يناسب وضعك الآن؟ | |
| `join.detailsTitle` | One more question | سؤال أخير | |
| `join.lastPeriod` | When did your last period start? | متى بدأت آخر دورة شهرية؟ | |
| `join.lastPeriodHint` | Leave it empty if you don't remember. You can log it later. | اتركيه فارغاً إن لم تتذكري. يمكنك تسجيله لاحقاً. | |
| `join.weeksPregnant` | How many weeks pregnant are you? | كم أسبوعاً مضى على حملك؟ | |
| `join.weeksSinceBirth` | How many weeks ago was your baby born? | منذ كم أسبوعاً وُلد طفلك؟ | |
| `join.gdm` | Was diabetes found during this pregnancy (gestational diabetes)? | هل ظهر سكري الحمل خلال هذا الحمل؟ | |
| `join.gdmYes` | Yes | نعم | |
| `join.gdmNo` | No | لا | |
| `join.gdmUnsure` | Not sure | لست متأكدة | |
| `join.gdmHint` | If yes, ReproSense checks whether your follow-up glucose test is recorded and reminds you when it is due. | إذا كانت الإجابة نعم، يتحقّق ReproSense من تسجيل فحص السكر التالي ويذكّرك بموعده. | |
| `join.create` | Create my record | إنشاء سجلّي | |
| `join.creating` | Creating your record | جارٍ إنشاء سجلّك | |
| `join.failed` | Your record wasn't created: {detail} | لم يُنشأ سجلّك: {detail} | |
| `join.required` | Fill in every question on this step to continue. | أجيبي عن كل أسئلة هذه الخطوة للمتابعة. | |
| `join.tryTitle` | Try it as yourself | جرّبيه بنفسك | |
| `join.tryBody` | Start a new record in two minutes, with made-up details. A clinic's QR code opens the same page. | ابدئي سجلاً جديداً في دقيقتين بتفاصيل غير حقيقية. رمز QR الخاص بالعيادة يفتح الصفحة نفسها. | |
| `join.tryAction` | Start your own record | ابدئي سجلّك | |

## Pricing

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `landing.clinicPrice` | From AED 399 per clinician per month, a hypothesis we are testing in clinic interviews. | من 399 درهماً لكل طبيب شهرياً، وهي فرضية نختبرها في مقابلات مع العيادات. | |
| `landing.pricingLink` | See pricing and how we sized the market | الأسعار وكيف قدّرنا حجم السوق | |
| `pricing.metaTitle` | Pricing | الأسعار | |
| `pricing.title` | Free for women. Clinics pay for follow-ups that get done. | مجاني للنساء. تدفع العيادات مقابل متابعات تُنجز فعلاً. | |
| `pricing.intro` | Women use ReproSense free. Clinics pay for a history that arrives before the visit and follow-ups that are tracked until they close. Every price on this page is a hypothesis we are testing in clinic interviews, not a quote. | تستخدم النساء ReproSense مجاناً. تدفع العيادات مقابل تاريخ صحي يصل قبل الزيارة ومتابعات تُتابَع حتى تُغلق. كل سعر في هذه الصفحة فرضية نختبرها في مقابلات مع العيادات، وليس عرض سعر. | |
| `pricing.per` | per clinician per month | لكل طبيب شهرياً | |
| `pricing.perYear` | AED 349 if paid yearly | 349 درهماً عند الدفع السنوي | |
| `pricing.perMonth` | per month | شهرياً | |
| `pricing.tiers.women.name` | Women | النساء | |
| `pricing.tiers.women.price` | Free | مجاناً | |
| `pricing.tiers.women.b1` | Her record: cycles, pain, symptoms and lab results | سجلّها: الدورات والألم والأعراض ونتائج التحاليل | |
| `pricing.tiers.women.b2` | A doctor report as a PDF, and sharing she can stop at any time | تقرير للطبيب بصيغة PDF، ومشاركة يمكنها إيقافها في أي وقت | |
| `pricing.tiers.women.b3` | Arabic and English. No advertising. Health data is never sold. | بالعربية والإنجليزية. بلا إعلانات. لا تُباع البيانات الصحية أبداً. | |
| `pricing.tiers.seat.name` | Clinician seat | مقعد طبيب | |
| `pricing.tiers.seat.price` | AED 399 | 399 درهماً | |
| `pricing.tiers.seat.b1` | Consented patients, most urgent first | المريضات الموافقات، الأكثر إلحاحاً أولاً | |
| `pricing.tiers.seat.b2` | A handover summary (SBAR) with the evidence behind each pattern | ملخص تسليم (SBAR) مع الأدلة وراء كل نمط | |
| `pricing.tiers.seat.b3` | Follow-ups due, with reminder drafts that staff approve | المتابعات المستحقة، مع مسودات تذكير يوافق عليها الفريق | |
| `pricing.tiers.seat.b4` | A patient invite QR for the clinic | رمز QR لدعوة المريضات إلى العيادة | |
| `pricing.tiers.clinic.name` | Small clinic | عيادة صغيرة | |
| `pricing.tiers.clinic.price` | AED 1,990 | 1,990 درهماً | |
| `pricing.tiers.clinic.sub` | up to 5 clinicians | حتى 5 أطباء | |
| `pricing.tiers.clinic.b1` | Everything in a clinician seat, for up to five clinicians | كل ما في مقعد الطبيب، لخمسة أطباء | |
| `pricing.tiers.clinic.b2` | The clinic's own patient invite | دعوة المريضات الخاصة بالعيادة | |
| `pricing.tiers.clinic.b3` | Planned: a monthly report of follow-ups closed | مخطط: تقرير شهري بالمتابعات المغلقة | |
| `pricing.tiers.network.name` | Clinic network | شبكة عيادات | |
| `pricing.tiers.network.price` | From AED 150,000 | من 150,000 درهم | |
| `pricing.tiers.network.sub` | a year | سنوياً | |
| `pricing.tiers.network.b1` | The network dashboard across clinics, with the fairness check | لوحة الشبكة عبر العيادات مع فحص العدالة | |
| `pricing.tiers.network.b2` | FHIR R4 export into the clinic's own record system | تصدير FHIR R4 إلى نظام السجلات الخاص بالعيادة | |
| `pricing.tiers.network.b3` | Planned: single sign-on for staff | قيد التخطيط: تسجيل دخول موحّد للفريق | |
| `pricing.pilotTitle` | Start with a paid pilot | ابدؤوا بتجربة مدفوعة | |
| `pricing.pilotBody` | Three months for AED 5,000–10,000, credited to the first year: up to 3 clinicians and 20 consenting patients, with setup, training and a weekly review of follow-ups with our team. | ثلاثة أشهر مقابل 5,000–10,000 درهم تُحتسب من السنة الأولى: حتى 3 أطباء و20 مريضة موافقة، مع الإعداد والتدريب ومراجعة أسبوعية للمتابعات مع فريقنا. | |
| `pricing.payerTitle` | Payers and employers | شركات التأمين وأصحاب العمل | |
| `pricing.payerBody` | Priced after the pilot, per enrolled woman or per follow-up closed, starting with the glucose test after gestational diabetes. | يُحدَّد السعر بعد التجربة، لكل امرأة مسجّلة أو لكل متابعة منجزة، بدءاً بفحص السكر بعد سكري الحمل. | |
| `pricing.whyTitle` | Why these numbers | لماذا هذه الأرقام | |
| `pricing.whyIntro` | A seat sits between what UAE clinics pay for practice software and what clinicians pay for AI tools. | يقع سعر المقعد بين ما تدفعه عيادات الإمارات لبرامج إدارة العيادات وما يدفعه الأطباء لأدوات الذكاء الاصطناعي. | |
| `pricing.colWhat` | What clinics buy today | ما تشتريه العيادات اليوم | |
| `pricing.colPrice` | Price | السعر | |
| `pricing.colSource` | Source | المصدر | |
| `pricing.rowPractice` | Practice software in the UAE | برامج إدارة العيادات في الإمارات | |
| `pricing.rowPracticePrice` | AED 89–249 per practitioner per month (vendor pages, not fully verified) | 89–249 درهماً لكل ممارس شهرياً (صفحات الموردين، لم تُتحقق بالكامل) | |
| `pricing.rowScribe` | AI clinical tools (scribes) | أدوات الذكاء الاصطناعي السريرية (الكتابة الطبية) | |
| `pricing.rowScribePrice` | About USD 150 (AED 550) per clinician per month | نحو 150 دولاراً (550 درهماً) لكل طبيب شهرياً | |
| `pricing.rowPortal` | Doctor booking portal, UAE (2019) | منصة حجز مواعيد الأطباء، الإمارات (2019) | |
| `pricing.rowPortalPrice` | About AED 500 per doctor per month | نحو 500 درهم لكل طبيب شهرياً | |
| `pricing.marketTitle` | The market we are sizing | السوق الذي نقدّر حجمه | |
| `pricing.market1` | Abu Dhabi has 14 specialised fertility centres, 45 women's health facilities, about 700 OB-GYN specialists and consultants and 375 midwives, and ran more than 6,180 IVF cycles in 2024. | في أبوظبي 14 مركزاً متخصصاً للخصوبة و45 منشأة لصحة المرأة، ونحو 700 أخصائي واستشاري في أمراض النساء والتوليد و375 قابلة، وأُجريت أكثر من 6,180 دورة أطفال أنابيب في 2024. | |
| `pricing.market2` | Seats alone come to about AED 5.2 million a year in Abu Dhabi (1,075 seats × AED 399 × 12). The path to scale is network licences and payer programmes for closed follow-ups. | المقاعد وحدها تبلغ نحو 5.2 مليون درهم سنوياً في أبوظبي (1,075 مقعداً × 399 درهماً × 12). طريق النمو هو تراخيص الشبكات وبرامج شركات التأمين للمتابعات المنجزة. | |
| `pricing.market3` | Since July 2025 the Department of Health's Rewarding Exceptional Quality programme rewards fertility providers that meet quality goals. ReproSense records which recommended follow-ups were closed, the kind of evidence such programmes look for. | منذ يوليو 2025 يكافئ برنامج دائرة الصحة «مكافأة الجودة الاستثنائية» مزوّدي خدمات الخصوبة الذين يحققون أهداف الجودة. يسجّل ReproSense المتابعات الموصى بها التي أُنجزت، وهو نوع الأدلة الذي تبحث عنه هذه البرامج. | |
| `pricing.sourcesTitle` | Sources | المصادر | |
| `pricing.note` | Prices are hypotheses until clinic interviews and a letter of intent back them (docs/12). Market figures come from the Department of Health via the Abu Dhabi Media Office. | الأسعار فرضيات حتى تدعمها مقابلات العيادات وخطاب نوايا (docs/12). أرقام السوق من دائرة الصحة عبر المكتب الإعلامي لأبوظبي. | |
| `pricing.pilotAction` | Open the demo | فتح العرض التجريبي | |

## Network dashboard (PC008, clinics, audit)

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `clinic.gapPc008` | Counts toward DoH Jawda indicator PC008 (after-birth follow-up). | يُحتسب ضمن مؤشر جودة دائرة الصحة PC008 (المتابعة بعد الولادة). | |
| `clinic.moreEntries` | and {n} more in her record | و{n} إدخالات أخرى في سجلّها | |
| `admin.pc008Title` | DoH Jawda PC008: after-birth follow-up | مؤشر جودة دائرة الصحة PC008: المتابعة بعد الولادة | |
| `admin.pc008Body` | Primary-care providers report this quality indicator to DoH every quarter: women seen 7 to 84 days after birth who had breastfeeding support, a depression screen and, after gestational diabetes, a glucose test. ReproSense supports two of those parts: the EPDS mood check in her app and the glucose-test follow-up on the clinic worklist. | يرفع مقدمو الرعاية الأولية هذا المؤشر إلى دائرة الصحة كل ربع سنة: النساء اللواتي رُوجِعن بعد 7 إلى 84 يوماً من الولادة وتلقّين دعم الرضاعة الطبيعية وفحص الاكتئاب، واختبار الجلوكوز بعد سكري الحمل. يدعم ReproSense جزأين منها: فحص المزاج EPDS في تطبيقها، ومتابعة اختبار الجلوكوز في قائمة عمل العيادة. | |
| `admin.pc008Glucose` | Glucose test after gestational diabetes | اختبار الجلوكوز بعد سكري الحمل | |
| `admin.pc008Value` | {done} of {due} done | {done} من {due} مكتمل | |
| `admin.pc008Detail` | {pct}% done · {booked} booked · {open} open | {pct}% مكتمل · {booked} محجوز · {open} مفتوح | |
| `admin.pc008Hidden` | Fewer than 10 women: hidden. | أقل من 10 نساء: مخفي. | |
| `admin.pc008Note` | Synthetic cohort plus the live demo. A real PC008 rate comes from the clinic's own claims and records. | مجموعة اصطناعية مع العرض الحي. يأتي المعدل الحقيقي لمؤشر PC008 من مطالبات العيادة وسجلاتها. | |
| `admin.pc008Source` | DoH Jawda primary-care quality indicators, version 7 (PDF) | مؤشرات جودة الرعاية الأولية من دائرة الصحة، الإصدار 7 (PDF) | |
| `admin.clinicsTitle` | By clinic | بحسب العيادة | |
| `admin.clinicsIntro` | Each clinic sees only the patients who share with it. The network sees each clinic's totals, hidden below 10 women. | ترى كل عيادة المريضات اللواتي يشاركن معها فقط. وترى الشبكة مجاميع كل عيادة، وتُخفى الأعداد التي تقل عن 10 نساء. | |
| `admin.colClinic` | Clinic | العيادة | |
| `admin.colConsented` | Agreed to share | وافقن على المشاركة | |
| `admin.colGaps` | Follow-ups | المتابعات | |
| `admin.auditExport` | Download the audit log (CSV) | تنزيل سجل التدقيق (CSV) | |
| `admin.auditExportHint` | For a compliance review: who did what to which record, and when, without health details. The download is logged too. | لمراجعة الامتثال: من فعل ماذا وبأي سجل ومتى، دون أي تفاصيل صحية. ويُسجَّل التنزيل أيضاً. | |
| `clinics.clinic_alain` | Garden City Women's Clinic, Al Ain (fictional) | عيادة مدينة الحدائق للنساء، العين (خيالية) | |

## Trust centre and footer

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `trust.data5` | We do not connect to Malaffi. Only licensed facilities do, and DoH policy forbids copying Malaffi data into other systems. Her FHIR R4 export goes into her clinic's own system, which reports to Malaffi. | لا نتصل بمنصة ملفي. الاتصال بها مقصور على المنشآت الصحية المرخّصة، وتمنع سياسة دائرة الصحة نسخ بيانات ملفي إلى أنظمة أخرى. يذهب ملفها بصيغة FHIR R4 إلى نظام عيادتها، وهو الذي يرفع البيانات إلى ملفي. | |
| `chrome.footerTrust` | Trust centre | مركز الثقة | |
| `chrome.footerPricing` | Pricing | الأسعار | |
| `chrome.footerLinks` | More about ReproSense | المزيد عن ReproSense | |
| `trust.metaTitle` | Trust centre | مركز الثقة | |
| `trust.title` | Trust centre | مركز الثقة | |
| `trust.intro` | How ReproSense answers the Department of Health's Responsible AI Standard, clause by clause, and what it does not claim. Each clause is summarised in our own words. | كيف يستجيب ReproSense لمعيار الذكاء الاصطناعي المسؤول الصادر عن دائرة الصحة، بنداً بنداً، وما الذي لا يدّعيه. لخّصنا كل بند بكلماتنا. | |
| `trust.tableTitle` | DoH Responsible AI Standard (V1, October 2025) | معيار الذكاء الاصطناعي المسؤول من دائرة الصحة (الإصدار 1، أكتوبر 2025) | |
| `trust.colClause` | Clause | البند | |
| `trust.colAsks` | What it asks | ما يطلبه | |
| `trust.colOurs` | What ReproSense does | ما يفعله ReproSense | |
| `trust.colStatus` | Status | الحالة | |
| `trust.status.built` | Built | مُنجَز | |
| `trust.status.partly` | Partly built | مُنجَز جزئياً | |
| `trust.status.planned` | Planned before a pilot | مخطط قبل التجربة | |
| `trust.rows.r1.clause` | 3.1.1.1 | 3.1.1.1 | |
| `trust.rows.r1.asks` | Design with clinicians and patients, and fit the clinic's workflow. | التصميم مع الأطباء والمريضات، وملاءمة سير عمل العيادة. | |
| `trust.rows.r1.ours` | The clinician view follows a visit: a one-minute summary, the evidence for each line and a visit-note draft she edits. A clinical advisor and pilot clinicians will review it. | تتبع واجهة الطبيب مسار الزيارة: ملخص في دقيقة، والدليل وراء كل سطر، ومسودة ملاحظة زيارة يعدّلها الطبيب. سيراجعها مستشار سريري وأطباء التجربة. | |
| `trust.rows.r1.status` | partly | partly | |
| `trust.rows.r2.clause` | 3.1.1.2 | 3.1.1.2 | |
| `trust.rows.r2.asks` | Keep a human in or on the loop, with escalation by risk. | إبقاء الإنسان في الحلقة أو فوقها، مع تصعيد بحسب الخطورة. | |
| `trust.rows.r2.ours` | Clinicians decide. The care navigator only drafts, and she approves every message; nothing is sent on its own. Red flags come first with 998, and a self-harm answer in the mood check opens the crisis path. | الطبيب يقرّر. منسّق الرعاية يكتب مسودات فقط، وهي توافق على كل رسالة؛ لا يُرسَل شيء تلقائياً. علامات الخطر تأتي أولاً مع الرقم 998، وأي إجابة عن إيذاء النفس في فحص المزاج تفتح مسار الأزمة. | |
| `trust.rows.r2.status` | built | built | |
| `trust.rows.r3.clause` | 3.1.2.1 | 3.1.2.1 | |
| `trust.rows.r3.asks` | Fail safely, with a fallback, and monitor after launch. | الفشل الآمن مع بديل احتياطي، والمراقبة بعد الإطلاق. | |
| `trust.rows.r3.ours` | Without a language model, every card keeps fixed template wording and the assistant quotes the knowledge base. 3D views fall back to static pictures. Monitoring after launch comes with the pilot. | من دون نموذج لغوي تبقى كل بطاقة بصياغة ثابتة ويقتبس المساعد من قاعدة المعرفة. وتتحوّل العروض ثلاثية الأبعاد إلى صور ثابتة. تأتي المراقبة بعد الإطلاق مع التجربة. | |
| `trust.rows.r3.status` | partly | partly | |
| `trust.rows.r4.clause` | 3.1.3.1 | 3.1.3.1 | |
| `trust.rows.r4.asks` | Validate against benchmarks and keep the results. | التحقق مقابل معايير مرجعية وحفظ النتائج. | |
| `trust.rows.r4.ours` | A fixed test set runs on every change: grounded answers, refused diagnosis questions, red-flag recall and banned phrases. The latest results are on the team scorecard. | تعمل مجموعة اختبار ثابتة مع كل تغيير: إجابات مستندة إلى مصادر، ورفض أسئلة التشخيص، والتقاط علامات الخطر، والعبارات المحظورة. أحدث النتائج في لوحة نتائج الفريق. | |
| `trust.rows.r4.status` | built | built | |
| `trust.rows.r5.clause` | 3.1.4.2 | 3.1.4.2 | |
| `trust.rows.r5.asks` | Role-based access, least privilege, and every access logged. | صلاحيات بحسب الدور، وأقل قدر من الامتيازات، وتسجيل كل وصول. | |
| `trust.rows.r5.ours` | Patient, clinician and network-admin roles are separate, and the database enforces them with row-level security. Every view of her record goes into a tamper-evident audit log that she can read. Multi-factor sign-in is planned. | أدوار المريضة والطبيب ومسؤول الشبكة منفصلة، وتفرضها قاعدة البيانات بأمان على مستوى الصف. يُسجَّل كل اطلاع على سجلها في سجل تدقيق يكشف أي تلاعب ويمكنها قراءته. تسجيل الدخول متعدد العوامل مخطط. | |
| `trust.rows.r5.status` | partly | partly | |
| `trust.rows.r6.clause` | 3.1.4.4 | 3.1.4.4 | |
| `trust.rows.r6.asks` | Privacy by design: minimum data, encryption, no training on patient data. | الخصوصية في التصميم: أقل قدر من البيانات، والتشفير، وعدم التدريب على بيانات المرضى. | |
| `trust.rows.r6.ours` | Records use a nickname, not a name. Notes and documents are encrypted (AES-256-GCM). Model calls receive de-identified text only, and no model is trained on her data. | تستخدم السجلات اسماً مستعاراً لا اسماً حقيقياً. الملاحظات والمستندات مشفّرة (AES-256-GCM). تتلقى استدعاءات النموذج نصاً بلا هوية فقط، ولا يُدرَّب أي نموذج على بياناتها. | |
| `trust.rows.r6.status` | built | built | |
| `trust.rows.r7.clause` | 3.1.4.5.1 | 3.1.4.5.1 | |
| `trust.rows.r7.asks` | Compute and storage, disaster recovery included, inside the UAE. | الحوسبة والتخزين، بما فيها التعافي من الكوارث، داخل الإمارات. | |
| `trust.rows.r7.ours` | This demo holds fictional data only. Production will run on UAE-region cloud with disaster recovery in the UAE, a UAE-hosted model or no model, and support access from inside the UAE. | هذا العرض يحتوي بيانات خيالية فقط. سيعمل الإنتاج على سحابة داخل الإمارات مع تعافٍ من الكوارث داخلها، وبنموذج مستضاف في الإمارات أو دون نموذج، ودعم فني من داخل الإمارات. | |
| `trust.rows.r7.status` | planned | planned | |
| `trust.rows.r8.clause` | 3.1.5 | 3.1.5 | |
| `trust.rows.r8.asks` | Data that reflects the population, with gaps between groups checked. | بيانات تمثّل السكان، مع فحص الفجوات بين الفئات. | |
| `trust.rows.r8.ours` | The network dashboard compares flagged and sharing rates by nationality group and age band, marks gaps over 5 points and hides groups under 10 women. A data card for the synthetic data is planned. | تقارن لوحة الشبكة نسب الملاحظات والمشاركة بحسب فئة الجنسية والفئة العمرية، وتنبّه إلى الفجوات التي تتجاوز 5 نقاط، وتخفي الفئات التي تقل عن 10 نساء. بطاقة بيانات للبيانات الاصطناعية مخططة. | |
| `trust.rows.r8.status` | partly | partly | |
| `trust.rows.r9.clause` | 3.1.6.1 | 3.1.6.1 | |
| `trust.rows.r9.asks` | Tell people when AI is used, and let patients opt out. | إبلاغ الناس عند استخدام الذكاء الاصطناعي، والسماح للمريضات بالانسحاب منه. | |
| `trust.rows.r9.ours` | The footer says AI tools are used, and every card says how it was written. Her Privacy switch turns AI off: the assistant closes and no text of hers reaches a model. New records start with AI off. | يذكر تذييل الصفحة استخدام أدوات الذكاء الاصطناعي، وتوضّح كل بطاقة طريقة كتابتها. يوقف مفتاح الخصوصية الذكاء الاصطناعي: يتوقف المساعد ولا يصل أي نص منها إلى نموذج. تبدأ السجلات الجديدة والذكاء الاصطناعي متوقف. | |
| `trust.rows.r9.status` | built | built | |
| `trust.rows.r10.clause` | 3.1.6.2 | 3.1.6.2 | |
| `trust.rows.r10.asks` | Document sources, logic and decision criteria; log inputs, outputs and versions. | توثيق المصادر والمنطق ومعايير القرار، وتسجيل المدخلات والمخرجات والإصدارات. | |
| `trust.rows.r10.ours` | Observation rules live in one versioned file, each with its guideline source. Every card shows the entries and the rule behind it, with a step-by-step trace of how it was produced. | تعيش قواعد الملاحظات في ملف واحد له رقم إصدار، ولكل قاعدة مصدرها من الإرشادات. تعرض كل بطاقة الإدخالات والقاعدة وراءها، مع تتبّع خطوة بخطوة لطريقة إنتاجها. | |
| `trust.rows.r10.status` | built | built | |
| `trust.rows.r11.clause` | 3.1.6.3 | 3.1.6.3 | |
| `trust.rows.r11.asks` | Explain in a way that fits each role. | شرح يناسب كل دور. | |
| `trust.rows.r11.ours` | She reads plain language and questions for her doctor. Her clinician reads a short handover with the evidence for each line. No card shows a probability. | تقرأ هي لغة بسيطة وأسئلة لطبيبها. ويقرأ طبيبها ملخص تسليم قصيراً مع الدليل وراء كل سطر. لا تعرض أي بطاقة احتمالاً. | |
| `trust.rows.r11.status` | built | built | |
| `trust.rows.r12.clause` | 3.1.7 | 3.1.7 | |
| `trust.rows.r12.asks` | Named owners, and clinicians keep final authority, with an audit trail. | مسؤولون محددون، ويحتفظ الأطباء بالقرار النهائي مع سجل تدقيق. | |
| `trust.rows.r12.ours` | Clinicians edit the visit note and book or close each follow-up, and each action is logged. Named owners will be set in the pilot agreement. | يعدّل الأطباء ملاحظة الزيارة ويحجزون كل متابعة أو يغلقونها، وتُسجَّل كل خطوة. يُحدَّد المسؤولون بالاسم في اتفاقية التجربة. | |
| `trust.rows.r12.status` | partly | partly | |
| `trust.rows.r13.clause` | 3.3.1.2 | 3.3.1.2 | |
| `trust.rows.r13.asks` | Keep a risk register; high-risk systems need a DoH conformity assessment. | سجل للمخاطر؛ والأنظمة عالية الخطورة تحتاج تقييم مطابقة من دائرة الصحة. | |
| `trust.rows.r13.ours` | ReproSense is designed to inform, never to diagnose, which supports a lower risk tier. A risk register will be written before the pilot. | صُمّم ReproSense ليُعلِم لا ليشخّص، وهذا يدعم فئة خطورة أدنى. سيُكتب سجل المخاطر قبل التجربة. | |
| `trust.rows.r13.status` | planned | planned | |
| `trust.notTitle` | What we do not claim | ما لا ندّعيه | |
| `trust.not.n1` | ReproSense does not diagnose. It points out patterns worth discussing with a doctor. | لا يشخّص ReproSense. إنه يشير إلى أنماط تستحق النقاش مع الطبيب. | |
| `trust.not.n2` | It is checked against a fixed test set, not clinically validated. We quote no accuracy figure. | جرى التحقق منه بمجموعة اختبار ثابتة، ولم يُتحقق منه سريرياً بعد. لا نذكر أي رقم للدقة. | |
| `trust.not.n3` | Whether it is a medical device is for the regulator to decide. We will ask the Emirates Drug Establishment before any pilot. | تصنيفه جهازاً طبياً أو لا قرارٌ للجهة التنظيمية. سنسأل مؤسسة الإمارات للدواء قبل أي تجربة. | |
| `trust.not.n4` | Every record in this demo is fictional. | كل سجل في هذا العرض خيالي. | |
| `trust.not.n5` | UAE hosting, the ADHICS assessment and a clinician's sign-off on the rules are next steps, not done. | الاستضافة داخل الإمارات وتقييم ADHICS واعتماد طبيب للقواعد خطوات قادمة، لم تُنجَز بعد. | |
| `trust.not.n6` | We never describe it as early detection, screening for PCOS, a risk score, fertile or safe days, or an AI doctor. | لا نصفه أبداً بأنه كشف مبكر، أو فحص لتكيّس المبايض، أو مقياس خطورة، أو أيام خصوبة أو أيام آمنة، أو طبيب ذكاء اصطناعي. | |
| `trust.dataTitle` | Her data, her choices | بياناتها، وخياراتها | |
| `trust.data1` | She decides who sees her record: sharing with a clinic is a separate choice she can stop at any time, and the clinic loses access at once. | هي من تقرّر من يرى سجلها: المشاركة مع العيادة خيار منفصل يمكنها إيقافه في أي وقت، فتفقد العيادة الوصول فوراً. | |
| `trust.data2` | She can read who viewed her record, download everything (including a FHIR R4 export for her clinic's system) and delete her entries. | يمكنها معرفة من اطّلع على سجلها، وتنزيل كل شيء (بما في ذلك تصدير FHIR R4 لنظام عيادتها)، وحذف إدخالاتها. | |
| `trust.data3` | We never sell health data or show ads. | لا نبيع البيانات الصحية ولا نعرض إعلانات. | |
| `trust.sourcesTitle` | Source | المصدر | |
| `trust.sourceDoh` | Department of Health Abu Dhabi, Responsible AI Standard, version 1 (October 2025) | دائرة الصحة – أبوظبي، معيار الذكاء الاصطناعي المسؤول، الإصدار 1 (أكتوبر 2025) | |
| `trust.seeScorecard` | See the test results | عرض نتائج الاختبار | |
| `trust.seePrivacy` | Try the privacy centre as Noura | جرّبي مركز الخصوصية باسم نورة | |
| `trust.intendedTitle` | What ReproSense is for | الغرض من ReproSense | |
| `trust.intendedBody` | ReproSense is a personal health record and consultation-preparation tool. A woman records her own cycles, symptoms, questionnaires and lab results. ReproSense organises them, shows where her entries meet published guideline thresholds that are worth discussing, and creates a summary she can choose to share with her clinic. It does not diagnose, treat, predict or prevent disease, does not give contraceptive advice, and does not replace a clinician's judgement. Clinicians see the entries and the guideline behind every item. | ReproSense سجل صحي شخصي وأداة للتحضير للاستشارة. تسجّل المرأة دوراتها وأعراضها واستبياناتها ونتائج تحاليلها بنفسها. ينظّمها ReproSense، ويبيّن أين تلتقي إدخالاتها مع حدود منشورة في الإرشادات الطبية تستحق النقاش، ويُعدّ ملخصاً يمكنها أن تختار مشاركته مع عيادتها. لا يشخّص المرض ولا يعالجه ولا يتنبأ به ولا يمنعه، ولا يقدّم نصائح لمنع الحمل، ولا يحلّ محل حكم الطبيب. يرى الأطباء الإدخالات والإرشاد وراء كل بند. | |
| `trust.data4` | In this demo, deleting removes your entries at once. UAE law asks health records to be kept for 25 years, so before any real data we will agree with the Department of Health how deletion and that rule work together. | في هذا العرض يحذف الحذف إدخالاتك فوراً. يطلب القانون في الإمارات الاحتفاظ بالسجلات الصحية 25 عاماً، لذلك سنتفق مع دائرة الصحة قبل أي بيانات حقيقية على كيفية التوفيق بين الحذف وهذه القاعدة. | |

## Status: support terms and held-out test

| Key | English | Arabic | OK? |
| --- | --- | --- | --- |
| `status.supportTitle` | Support and service levels | الدعم ومستويات الخدمة | |
| `status.supportIntro` | The terms we offer pilot clinics. This demo is not a hosted service yet and has no service level. | الشروط التي نعرضها على عيادات التجربة. هذا العرض ليس خدمة مستضافة بعد، ولا يشمل مستوى خدمة. | |
| `status.support1` | A named contact for each pilot clinic, Monday to Friday, 9:00 to 18:00 Gulf time, with a first reply within one working day. | جهة اتصال محددة لكل عيادة في التجربة، من الاثنين إلى الجمعة، 9:00 إلى 18:00 بتوقيت الخليج، مع أول رد خلال يوم عمل واحد. | |
| `status.support2` | A suspected data breach is reported to the clinic and to the Department of Health within 24 hours, as the DoH privacy standard requires. | يُبلَّغ عن أي اختراق مشتبه للبيانات إلى العيادة وإلى دائرة الصحة خلال 24 ساعة، كما يشترط معيار الخصوصية لدى الدائرة. | |
| `status.support3` | Target availability of 99.5% a month on UAE hosting, checked every minute against the public health check. | توافر مستهدف 99.5% شهرياً على استضافة داخل الإمارات، يُفحص كل دقيقة عبر فحص الحالة العام. | |
| `status.support4` | Every change passes the automated tests on this page before it reaches a clinic. | يجتاز كل تغيير الاختبارات الآلية المعروضة في هذه الصفحة قبل أن يصل إلى أي عيادة. | |
| `status.heldoutTitle` | Held-out safety test | اختبار أمان بأسئلة لم يرها الفريق | |
| `status.heldoutIntro` | Questions written by reviewers who never saw the code, in English and in Gulf, Egyptian, Levantine and standard Arabic. They check where each message is routed, not medical accuracy. | أسئلة كتبها مراجعون لم يطّلعوا على الشيفرة، بالإنجليزية وباللهجات الخليجية والمصرية والشامية وبالفصحى. تفحص أين يُوجَّه كل سؤال، لا الدقة الطبية. | |
| `status.heldoutCount` | {n} questions, measured once after the last change to the word checks and never used to tune them. | {n} سؤالاً، قيست مرة واحدة بعد آخر تعديل على فحص الكلمات المفتاحية، ولم تُستخدم لضبطه. | |
| `status.heldoutAfter` | Word checks alone miss many crisis messages written in people's own words. That is why the 998 button stays on screen in every chat, whatever the message says. A second check by a language model is built but not yet scored. | فحص الكلمات المفتاحية وحده لا يلتقط كثيراً من رسائل الأزمة، لأن كل شخص يكتب بكلماته. لذلك يبقى زر 998 ظاهراً في كل محادثة مهما كانت الرسالة. بنينا فحصاً ثانياً يعتمد على نموذج لغوي، ولم نقِس أداءه بعد. | |
| `status.heldout.crisis` | Crisis messages given the support path: {pass} of {of} | رسائل الأزمة التي وُجّهت إلى مسار الدعم: {pass} من {of} | |
| `status.heldout.urgent` | Emergencies given 998 first: {pass} of {of} | الحالات الطارئة التي بدأت بالرقم 998: {pass} من {of} | |
| `status.heldout.refuse` | Requests for a diagnosis or a probability refused: {pass} of {of} | طلبات التشخيص أو النسب التي رُفضت: {pass} من {of} | |
| `status.heldout.medicine` | Medicine and dose questions sent to a doctor or pharmacist: {pass} of {of} | أسئلة الأدوية والجرعات التي وُجّهت إلى الطبيب أو الصيدلي: {pass} من {of} | |
| `status.heldout.answer` | Everyday questions answered normally (no false alarm): {pass} of {of} | الأسئلة اليومية التي أُجيبت بشكل طبيعي (دون إنذار خاطئ): {pass} من {of} | |

## Status page service check (#30, draft Arabic, not yet reviewed)
| Key | English | Arabic | OK |
| --- | --- | --- | --- |
| `status.liveTitle` | Service check | فحص الخدمة | |
| `status.liveUp` | Up | تعمل | |
| `status.liveDown` | Not answering | لا تستجيب | |
| `status.liveUpBody` | The API and its database answered in {ms} ms. Checked {at} Gulf time, each time this page opens. | استجابت الواجهة البرمجية وقاعدة بياناتها خلال {ms} ميلي ثانية. فُحصت في {at} بتوقيت الخليج، في كل مرة تُفتح فيها هذه الصفحة. | |
| `status.liveDownBody` | The API did not answer within 10 seconds. Checked {at} Gulf time. The demo may be waking up: reload in a minute. | لم تستجب الواجهة البرمجية خلال 10 ثوانٍ. فُحصت في {at} بتوقيت الخليج. قد يكون العرض التجريبي قيد التشغيل: أعيدي التحميل بعد دقيقة. | |
| `status.liveMonitor` | Uptime history (external monitor, checks every few minutes) | سجل التوفر (مراقب خارجي، يفحص كل بضع دقائق) | |
| `status.liveSupport` | Support for pilot clinics: | الدعم للعيادات التجريبية: | |

## Trust centre clause 3.1.4.5.1 (#25, draft Arabic, not yet reviewed)
| Key | English | Arabic | OK |
| --- | --- | --- | --- |
| `trust…r7.ours` | This demo holds fictional data only, on services without a UAE region. Production will run in a UAE cloud region (AWS Middle East (UAE) or Azure UAE North) with backups and disaster recovery in the UAE, a UAE-hosted model or no model, and support access from inside the UAE. | هذا العرض يحتوي بيانات خيالية فقط، على خدمات ليست لها منطقة في الإمارات. سيعمل الإنتاج في منطقة سحابية داخل الإمارات (AWS الشرق الأوسط (الإمارات) أو Azure الإمارات الشمالية) مع نسخ احتياطية وتعافٍ من الكوارث داخل الإمارات، وبنموذج مستضاف في الإمارات أو دون نموذج، ودعم فني من داخل الإمارات. | |

## Flagged terms: every occurrence (QUESTIONS #49, prepared 6 Nov for #23)
Each row uses نزيف, جلط… or إغراق. Some are right (bleeding in pregnancy is a warning sign); others describe ordinary
period days and need a period word. The reviewer decides each one; nothing here has been changed yet.

| Key | English | Arabic now | Decision |
| --- | --- | --- | --- |
| `clinic.askChips.bleeding` | Heavy bleeding | النزيف الغزير | |
| `safety.pregSigns` | bleeding · severe tummy pain · fewer baby movements · a severe headache with changes in your vision | نزيفاً · ألماً شديداً في البطن · قلة حركة الجنين · صداعاً شديداً مع تغيّر في الرؤية | |
| `symptoms.flooding` | Flooding | نزيف متدفق | |
| `symptoms.bleeding` | Bleeding | نزيف | |
| `symptoms.clots_larger_than_a_coin` | Clots larger than a coin | جلطات أكبر من قطعة نقدية | |
| `log.cellPeriod` | bleeding | نزيف | |
| `log.tileFlow` | Flow | النزيف | |
| `log.tilePbac` | Bleeding score | درجة النزيف | |
| `log.flow` | Flow | النزيف | |
| `log.pbacTitle` | Bleeding score (pictorial chart): {score} | درجة النزيف (المخطط المصوّر): {score} | |
| `log.pbacHint` | Count what you used today. Over a whole period, 100 or more on this chart gynaecologists use suggests heavy bleeding. | عدّي ما استخدمتِه اليوم. على مدى دورة كاملة، تشير درجة 100 أو أكثر على هذا المخطط الذي يستخدمه أطباء النساء إلى نزيف غزير. | |
| `log.pbacItems.clots_small` | Small clots | جلطات صغيرة | |
| `log.pbacItems.clots_large` | Clots coin-sized or larger | جلطات بحجم قطعة نقدية أو أكبر | |
| `analytics.pbacTitle` | Bleeding score per period | درجة النزيف في كل دورة | |
| `analytics.pbacCaption` | Pictorial chart score; 100 or more suggests heavy bleeding | درجة المخطط المصوّر؛ 100 أو أكثر تشير إلى نزيف غزير | |
| `analytics.pbacBar` | Period starting {date}: bleeding score {pbac} | الدورة التي بدأت في {date}: درجة النزيف {pbac} | |
| `analytics.heavy` | {n, plural, =0 {No period reached a bleeding score of 100.} one {# period reached a bleeding score of 100 or more.} other {# periods reached a bleeding score of 100 or more.}} | {n, plural, =0 {لم تصل أي دورة إلى درجة نزيف 100.} one {وصلت دورة واحدة إلى درجة نزيف 100 أو أكثر.} two {وصلت دورتان إلى درجة نزيف 100 أو أكثر.} few {وصلت # دورات إلى درجة نزيف 100 أو أكثر.} many {وصلت # دورة إلى درجة نزيف 100 أو أكثر.} other {وصلت # دورة إلى درجة نزيف 100 أو أكثر.}} | |
| `analytics.colBleed` | Bleeding days | أيام النزيف | |
| `analytics.colPbac` | Bleeding score | درجة النزيف | |
| `analytics.yearCaption` | Each dot is a logged day. Filled: bleeding. Ring: pain 7 or more. Diamond: an event. | كل نقطة يوم مُسجَّل. المملوءة: نزيف. الحلقة: ألم 7 أو أكثر. المعيّن: حدث. | |
| `analytics.yearSummary` | {logged} days logged in the last {months} months, {bleed} with bleeding. | {logged} يوماً مُسجَّلاً خلال آخر {months, plural, few {# أشهر} many {# شهراً} other {# شهر}}، منها {bleed} بنزيف. | |
| `report.stats` | {logs} entries · {periodDays} bleeding days · {severe, plural, =0 {no days} one {# day} other {# days}} with pain 7 or more | {logs} إدخال · {periodDays} يوم نزيف · {severe, plural, =0 {لا أيام} one {يوم واحد} two {يومان} few {# أيام} many {# يوماً} other {# يوم}} بألم 7 أو أكثر | |
| `report.pbac` | Bleeding score by period | درجة النزيف في كل دورة | |
| `landing.legendBleed` | Bleeding day | يوم نزيف | |
| `landing.chartRow` | Cycle starting {date}: {length} days, {bleed} bleeding days | الدورة التي بدأت في {date}: {length} يوماً، منها {bleed} أيام نزيف | |
| `landing.floatQuestion` | “How do I know if my bleeding is heavy?” | «كيف أعرف أن نزيفي غزير؟» | |
| `landing.spiralIntro` | Each bead is one day of one of Noura's cycles. Magenta beads are bleeding days, lavender beads are days past day 35, and peach beads are the rest. A regular year makes short, tidy loops. Hers stretches. | كل حبة يوم واحد من إحدى دورات نورة. الحبات الوردية أيام نزيف، والبنفسجية أيام بعد اليوم 35، والخوخية بقية الأيام. العام المنتظم يرسم حلقات قصيرة مرتبة، أما عامها فيتمدد. | |
| `landing.colBleed` | Bleeding days | أيام النزيف | |
| `landing.stageDesc.periods` | Cycles, bleeding score, pain and the body map | الدورات ودرجة النزيف والألم وخريطة الجسم | |
| `landing.t1Body` | {days} days logged over 12 months: flow, pain, symptoms and a bleeding score. | {days} يوماً مُسجَّلاً خلال 12 شهراً: النزيف والألم والأعراض ودرجة النزيف. | |
| `landing.womenBody` | Logging takes about twenty seconds: flow, pain from 0 to 10, a bleeding score using the same pictorial chart gynaecologists use, or a sentence in Arabic or English. She sees her year on one screen, gets questions to ask, and decides who sees her report and for how long. | يستغرق التسجيل نحو عشرين ثانية: النزيف، والألم من 0 إلى 10، ودرجة النزيف على المخطط المصوّر نفسه الذي يستخدمه أطباء النساء، أو جملة بالعربية أو الإنجليزية. ترى عامها في شاشة واحدة، وتحصل على أسئلة تطرحها، وتقرر من يرى تقريرها ولمدة كم. | |

Outside `ar.json` (same terms):
- `backend/app/agents/assistant.py` lines 97, 99, 101, 110, 124, 127
- `backend/app/agents/copy.py` lines 43, 51, and 183, 200, 202 (`AR_SYMPTOM` repeats `symptoms.flooding`,
  `symptoms.bleeding` and `symptoms.clots_larger_than_a_coin` for the evidence lines, #67: change both together)
- `rules/translations_ar.yaml` lines 4, 8, 14, 33, 34, 49, 62

## Knowledge base: early-pregnancy, crisis and period-pain sources (#42 card A5, draft Arabic, not yet reviewed)
Safety text first: the two crisis sources and every 998 line. Final texts after the CHO review and three rounds of answer judging.
| File | English | Arabic | OK |
| --- | --- | --- | --- |
| `knowledge_base/summaries/nhs_suicidal_thoughts.md` (cite-only: backs the crisis reply) | Call 998 or go to the nearest emergency department now if you took too many tablets or hurt yourself badly. Feeling close to harming yourself is an emergency, so call 998 or go to the nearest emergency department now. A friend or family member can call 998 for you or bring you to the nearest emergency department. Please talk to someone you trust and to a doctor today if you are thinking of ending your life. You deserve support, and nobody should carry painful feelings alone. | اتصلي الآن بالرقم 998 أو توجهي إلى أقرب قسم طوارئ إذا تناولتِ جرعة زائدة من الأقراص أو آذيتِ نفسكِ بشدة. الشعور بأنكِ على وشك إيذاء نفسكِ حالة طارئة، فاتصلي الآن بالرقم 998 أو توجهي إلى أقرب قسم طوارئ. يمكن لأحد أصدقائكِ أو أفراد عائلتكِ أن يتصل بالرقم 998 نيابةً عنكِ أو يصطحبكِ إلى أقرب قسم طوارئ. من فضلكِ، تحدثي اليوم مع شخص تثقين به ومع طبيب إذا كانت تراودكِ أفكار عن إنهاء حياتكِ. أنتِ تستحقين الدعم، ولا ينبغي لأحد أن يتحمّل المشاعر المؤلمة وحده. | |
| `knowledge_base/summaries/nhs_urgent_mental_health.md` (cite-only: backs the crisis reply) | Call 998 or go to the nearest emergency department now if a life is in danger, like after an overdose or serious self-harm. Call 998 or go to the nearest emergency department now if you feel unable to keep yourself or someone else safe. Do not drive yourself to the emergency department; ask someone to take you or call 998. Like a physical emergency, a mental health emergency needs urgent help, so call 998. Asking for help does not waste anyone's time. If you feel safe but need mental health support soon, ask for an urgent doctor's appointment. No matter what you face, you can get help. | اتصلي بالرقم 998 أو توجهي إلى أقرب قسم طوارئ فوراً إذا كانت حياة أي شخص في خطر، كما في حالة تناول جرعة زائدة أو إيذاء النفس بشكل خطير. اتصلي بالرقم 998 أو توجهي إلى أقرب قسم طوارئ فوراً إذا شعرتِ بأنكِ غير قادرة على الحفاظ على سلامتكِ أو سلامة شخص آخر. لا تقودي السيارة بنفسكِ إلى قسم الطوارئ؛ اطلبي من شخص ما أن يوصلكِ، أو اتصلي بالرقم 998. مثل حالة الطوارئ الجسدية، تحتاج حالة الطوارئ النفسية إلى مساعدة عاجلة، لذا اتصلي بالرقم 998. طلب المساعدة لا يضيّع وقت أحد. إذا شعرتِ بالأمان لكنكِ تحتاجين إلى دعم نفسي قريباً، اطلبي موعداً عاجلاً مع طبيب. مهما كان ما تواجهينه، يمكنكِ الحصول على المساعدة. | |
| `knowledge_base/summaries/nice_ng126.md` (indexed, never quoted in answers) | NICE guideline NG126 covers pain and bleeding in the first 13 weeks of pregnancy, including ectopic pregnancy and miscarriage. Call 998 or go to the nearest emergency department now for severe pain, very heavy bleeding, feeling very faint or collapse. If you could be pregnant (for example, a missed period) and have tummy or pelvic pain, bleeding, shoulder-tip pain or dizziness, see a doctor today. Ectopic pregnancy often has unusual signs, such as diarrhoea, vomiting, or pain when passing urine or stools. | تتناول إرشادات NICE رقم NG126 الألم والنزيف في أول 13 أسبوعاً من الحمل، بما في ذلك الحمل خارج الرحم والإجهاض التلقائي. اتصلي بالرقم 998 أو توجهي إلى أقرب قسم طوارئ الآن عند الألم الشديد، أو النزيف الغزير جداً، أو الشعور بأنكِ على وشك الإغماء، أو الانهيار والسقوط أرضاً. إذا كان من الممكن أن تكوني حاملاً (مثلاً عند تأخر الدورة) وكنتِ تعانين من ألم في البطن أو الحوض، أو نزيف، أو ألم في طرف الكتف، أو دوخة، فراجعي الطبيب اليوم. كثيراً ما يظهر الحمل خارج الرحم بعلامات غير معتادة، مثل الإسهال أو القيء أو الألم عند التبول أو التبرز. | |
| `knowledge_base/summaries/nhs_period_pain.md` (replaces the withdrawn ACOG source) | Endometriosis or fibroids can sometimes cause period pain. Painkillers or a heat pad may ease ordinary period pain. Severe period pain that painkillers have not eased needs an urgent appointment with a doctor. See a doctor if periods get more painful, heavier or irregular, or if pain stops your daily activities. If period pain does not improve, a doctor may refer you to a gynaecologist. | قد تسبب بطانة الرحم المهاجرة أو الأورام الليفية ألم الدورة أحياناً. قد تخفف المسكنات أو وسادة التدفئة ألم الدورة العادي. ألم الدورة الشديد الذي لم تخففه المسكنات يحتاج إلى موعد عاجل مع الطبيب. راجعي الطبيب إذا أصبحت الدورة أكثر ألماً أو أغزر أو غير منتظمة، أو إذا كان الألم يمنعك من أنشطتك اليومية. إذا لم يتحسن ألم الدورة، فقد يحيلك الطبيب إلى أخصائي أمراض النساء. | |
| `knowledge_base/summaries/nhs_pcos.md` (rewritten for the PMOS rename) | The NHS page on polycystic ovary syndrome (PCOS, which the NHS now calls PMOS) lists common signs: irregular or infrequent periods, difficulty getting pregnant, excess hair growth, thinning hair, oily skin or acne, and weight gain. It advises seeing a GP if you notice these signs. For PCOS, a doctor may suggest blood tests to check hormone levels and an ultrasound scan. Symptoms can be managed with lifestyle changes and treatments, and a doctor can explain the options that suit you. | تذكر صفحة الخدمة الصحية البريطانية عن متلازمة تكيّس المبايض (PCOS، وتسميها الآن PMOS) علامات شائعة: دورات غير منتظمة أو متباعدة، وصعوبة الحمل، ونمو شعر زائد، وتساقط شعر الرأس، والبشرة الدهنية أو حب الشباب، وزيادة الوزن. تنصح بمراجعة الطبيب عند ملاحظة هذه العلامات، وقد يطلب الطبيب لمتلازمة تكيّس المبايض تحاليل دم وأشعة صوتية. | |

## One count everywhere: days logged (#43 a, draft Arabic reusing the landing page's يوماً مُسجَّلاً, not yet reviewed)
| Key | English | Arabic | OK |
| --- | --- | --- | --- |
| `home.record` | {count} days logged · record strength: {strength} | {count} يوماً مُسجَّلاً · قوة السجلّ: {strength} | |
| `insights.strengthDetail` | {cycles, plural, one {# cycle} other {# cycles}} logged · {days} days logged | {cycles, plural, one {دورة واحدة مُسجَّلة} two {دورتان مُسجَّلتان} few {# دورات مُسجَّلة} many {# دورة مُسجَّلة} other {# دورة مُسجَّلة}} · {days} يوماً مُسجَّلاً | |
| `clinic.sharedNote` | {count} days logged · shared with consent · fictional | {count} يوماً مُسجَّلاً · بموافقتها · بيانات خيالية | |

## Evidence lines on pattern cards (#67, draft Arabic, not yet reviewed)
The "why we noticed" lines under each card (`backend/app/agents/copy.py`, `entry_text`) now give logged values in
Arabic. Flows, symptoms and impacts reuse the log form's words above (`flows.*`, `symptoms.*`, `impacts.*`), so a fix
there must be copied to `AR_FLOW`, `AR_SYMPTOM` and `AR_IMPACT`. These are the strings that are new:

| Key | English | Arabic | OK |
| --- | --- | --- | --- |
| `AR_SYMPTOM["poor sleep"]` | poor sleep | نوم سيئ | |
| `AR_EVENT.lab_test` | lab test | فحص مخبري | |
| `AR_EVENT.breastfeeding` | breastfeeding | الرضاعة الطبيعية | |
| `AR_EVENT.ttc_started` | started trying to conceive | بدء محاولة الحمل | |
| `AR_EVENT.appointment_planned` | appointment planned | موعد مخطط له | |
| questionnaire line | 1 Feb · EPDS total 12 | 1 فبراير · EPDS: المجموع 12 | |
| fallback, unknown flow | (flow) | نزول مسجّل | |
| fallback, unknown symptom | (symptom) | عرض آخر | |
| fallback, unknown impact | (impact) | أثّر على يومها | |
| fallback, unknown event | (event) | حدث | |

Example line: `28 نوفمبر · نزول متوسط، ألم 7/10، PBAC 11، نشاط أقل من المعتاد` (was `نزول medium, … reduced activity`).
Note that two impacts are in her first-person voice, as on the log form: غبتُ عن العمل أو الدراسة، بقيتُ في السرير.

## Log form: reopening a saved day (7 Nov rescore, draft Arabic, not yet reviewed)
Shown above the log form when she already saved that day; her answers are filled in, so she can change any of them and save again.

| Key | English | Arabic | OK |
| --- | --- | --- | --- |
| `log.editing` | You already saved this day. Your answers are below. Change anything you need, then save again. | سبق أن حفظتِ هذا اليوم. إجاباتكِ أدناه، عدّلي ما تريدين ثم احفظي مرة أخرى. | |

## Pain card: days counted (7 Nov rescore, draft Arabic, not yet reviewed)
`OBS_SEVERE_CYCLICAL_PAIN` counts days she logged "missed work or study" and days she logged "stayed in bed"
(`IMPACT_DAYS` in `backend/app/rules/features.py`). The sentence now names both (`backend/app/agents/copy.py`).

| Key | English | Arabic | OK |
| --- | --- | --- | --- |
| `detail.OBS_SEVERE_CYCLICAL_PAIN` | …and on {n} of the last 90 days you logged that you missed work or study or stayed in bed. | …وفي {n} من آخر 90 يوماً سجّلتِ أنكِ غبتِ عن العمل أو الدراسة أو بقيتِ في السرير. | |

"{n} من آخر 90 يوماً" reads right for any n. Nearby sentences in `copy.py` still put a fixed يوماً, أيام, أسابيع or أشهر after a
number that changes, which is wrong for some values (2, 3–10, 11+): a follow-up for the native review (#23).

## Persona names in Arabic script (7 Nov rescore, draft, not yet reviewed)
Arabic screens wrote the fictional personas' names in Latin script ("مرحباً Noura", "فتح سجلّ Mariam"), while the landing
CTA already said نورة. `firstName(alias, "ar")` in `apps/web/src/lib/format.ts` now gives the Arabic spelling on the
greeting, the landing stage cards, the demo roster and the stage switch. A joined record's own name stays as she typed it.
The doctor report keeps the full Latin alias with its initial ("Noura A.").

| Name | Arabic | OK |
| --- | --- | --- |
| Amina | أمينة | |
| Fatima | فاطمة | |
| Hessa | حصة | |
| Layla | ليلى | |
| Mariam | مريم | |
| Noura | نورة | |
| Priya | بريا | |
| Sara | سارة | |

## Counted nouns on pattern cards (7 Nov night, draft Arabic, not yet reviewed)
The "why we noticed" sentences put a fixed أيام / يوماً / أسابيع / أشهر after a number that changes, which was wrong at 2 and
at 11 or more. `_ar_n` in `backend/app/agents/copy.py` now picks the form: 1 يوم واحد · 2 يومين · 3–10 أيام · 11+ يوماً
(the same for أسبوع and شهر). Day counts out of 90 read "{n} من آخر 90 يوماً", which is right for any n.

| Sentence | Arabic now | OK |
| --- | --- | --- |
| Acne or hair growth, fatigue, hot flushes | …في {n} من آخر 90 يوماً… | |
| Longest period | …وأطول دورة استمرت يومين / 8 أيام / 12 يوماً. | |
| Last period started | …قبل 95 يوماً. | |
| Weeks since the birth (glucose test, mood check) | …قبل / بعد أسبوعين / 9 أسابيع / 12 أسبوعاً… | |
| Months trying to conceive | …منذ 14 شهراً… | |

## Demo roster stories and names (second 7 Nov rescore, draft Arabic, not yet reviewed)
The Arabic demo roster showed each fictional woman's story in English and her name as "Noura A.". Stories now come from
`demo.stories.*`, and names, initials and her Arabic report use `shownName` (the Arabic first name).

| Key | English | Arabic | OK |
| --- | --- | --- | --- |
| `demo.stories.amina` | Regular cycles, mild cramps. Shows the calm state of the app. | دورات منتظمة وتقلصات خفيفة. تُظهر حالة التطبيق الهادئة. | |
| `demo.stories.fatima` | Gave birth 9 weeks ago after gestational diabetes; no glucose test logged since. | وضعت مولودها قبل 9 أسابيع بعد سكري الحمل، ولم يُسجَّل فحص سكر منذ ذلك الحين. | |
| `demo.stories.hessa` | 24 weeks pregnant with her first baby; the glucose screening window (24-28 weeks) is open and not yet booked. | حامل في الأسبوع 24 بطفلها الأول؛ موعد فحص السكر (من الأسبوع 24 إلى 28) متاح ولم يُحجز بعد. | |
| `demo.stories.layla` | Periods have become unpredictable over the past year, with hot flushes and night sweats most weeks. | أصبحت الدورة غير متوقعة خلال العام الماضي، مع هبّات ساخنة وتعرّق ليلي في معظم الأسابيع. | |
| `demo.stories.mariam` | Trying to conceive for 7 months with regular cycles; wants to know when to ask for help. | تحاول الحمل منذ 7 أشهر ودوراتها منتظمة؛ تريد أن تعرف متى تطلب المساعدة. | |
| `demo.stories.noura` | Long and irregular cycles with acne and excess hair growth logged often. | دورات طويلة وغير منتظمة، وتسجّل حب الشباب ونمو الشعر الزائد كثيراً. | |
| `demo.stories.priya` | Severe period pain each month, missing work, pain with bowel movements during periods. | ألم شديد في الدورة كل شهر، وغياب عن العمل، وألم أثناء التبرز في أيام الدورة. | |
| `demo.stories.sara` | Long, very heavy periods with clots; one recent day of dizziness (red-flag demo). | دورات طويلة وغزيرة جداً مع جلطات، ويوم دوخة واحد مؤخراً (عرض علامة الخطر). | |
