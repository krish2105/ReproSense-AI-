// Speaker notes for the 4-slide deck, as they show in PowerPoint's Presenter View (22 Nov, showcase day).
// Who says what: KRISHNA opens (15 s) and closes (10 s) and leads Q&A; ZEBO presents all four slides (about 80 s);
// YASH talks and ATHARVA clicks for the live demo (about 85 s). About 3 minutes in all.
// The same words, plus the likely questions, are in ReproSense-Stage-Script.pdf and ReproSense-Demo-Script-and-QA.pdf.

const SLIDE_1 = `KRISHNA opens · 15 seconds (before Zebo starts; stand next to her)
"Good afternoon. We're Team Nova. I'm Krishna, and with me are Zebo, Yash and Atharva. We built ReproSense. Zebo will tell you why, and Yash and Atharva will show you, live."
(Nod to Zebo.)

ZEBO · slide 1, the problem · about 25 seconds
(Wait a beat. Look at the judges, not the screen. Speak slowly.)

"Meet Noura. She's 24, from Al Ain. She's fictional, but her story isn't.

For a year, her periods have come every six to eight weeks, with acne and extra hair. She knows something is wrong. But in a ten-minute appointment she can't remember the dates, she feels embarrassed, and she leaves with 'come back if it gets worse'.

That's how up to 70 percent of women with PCOS end up not knowing they have it. And in a UAE study, endometriosis took eleven and a half years to diagnose.

So the problem isn't tracking. It's explaining."
(Click to slide 2.)

IF ASKED (Zebo)
- 70%: WHO PCOS fact sheet, 2026.
- 11.6 years: 518 women in the UAE, Frontiers in Global Women's Health, 2021.
- Not sure? "Good question. Krishna, could you take that?"`;

const SLIDE_2 = `ZEBO · slide 2, the solution · about 30 seconds

"So ReproSense does the explaining for her.

She logs in seconds: a tap, or one sentence in Gulf Arabic.

Over the year, rules written from published guidelines spot patterns worth discussing with a doctor, and show the exact days behind each one, with the guideline. It never diagnoses. Urgent signs come first, with 998.

She can ask Nura, our assistant, what's happening in her body, and get plain words from NHS sources, with her own numbers.

And with her consent, her doctor gets a two-page report to read in a minute.

Noura doesn't have to explain any more. Her record does it for her."
(Click to slide 3.)

IF ASKED (Zebo)
- AI, safety or technology: "Krishna built that part. Krishna?"
- Never say "independent reviewers". Never say a clinic or clinician has signed.`;

const SLIDE_3 = `ZEBO · slide 3, who uses it and what's next · about 20 seconds

"Women like Noura use it free, always. Clinics and primary-care networks subscribe, because the follow-ups that guidelines recommend actually get done, and they can see it. We'll set the price with our first pilot clinic.

Next: one clinic pilot, UAE hosting with UAE PASS sign-in, and a licensed company by May."
(Click to slide 4.)

IF ASKED (Zebo, or hand to Yash)
- Price: "There isn't one yet, on purpose. Women always use it free. Clinics and networks subscribe. We set the number with our first pilot clinic."
- Tested with real women? "Not yet. Everything you see runs on fictional data, by design. Our first 90 days are ten interviews, a clinic letter of intent and a consented pilot at one clinic."`;

const SLIDE_4 = `ZEBO · slide 4 · 5 seconds
"Here it is, live. Yash, Atharva."
(Atharva switches to the browser: reprosense.vercel.app/demo, already open, English, light theme.)

YASH talks, ATHARVA clicks · the live demo · about 85 seconds

1. Demo people > Open Noura's record > Patterns > first card > Why we noticed
"This is Noura's record. These chips are the days she actually logged, cycles of 42 to 56 days, and this is the guideline behind the pattern. It doesn't say PCOS. It says: worth discussing with a doctor."

2. Ask Nura > tap "What is happening with my body?"
"If she's worried, she asks Nura. Nura answers from her own record, with the source, and NHS pages and an NHS video if she wants to learn more. No diagnosis. No guessing."

3. (Only if on time) عربي > ask «ماذا يحدث في جسمي؟» > back to English
"And she can ask in Arabic, too."

4. Report
"Before her visit, this is what her doctor gets: what changed, and the days behind each pattern, on two pages."

5. Demo people > Open clinician view > Fatima K. > glucose follow-up > Mark booked
"Now the clinic. It only sees women who chose to share. Fatima had diabetes in pregnancy and gave birth nine weeks ago, so her glucose test is due. One tap: booked. It stays open until the test is done."

6. Demo people > Open clinic network
"And the network sees each follow-up move from due, to booked, to done. Counts only, never names."

KRISHNA closes · 10 seconds
"So Noura doesn't have to explain. Her record does. We're asking for one pilot clinic, a clinical advisor to sign off our rules, and the grant. Thank you."

TIMING AND FALLBACK
- Behind? Skip step 3 (Arabic).
- Site slow? Keep talking over it. Down? Play ReproSense-demo-2min30-4K.mp4.
- There's no clinician link inside her app: go through Demo people.
- Never press Reset demo data during judging.`;

module.exports = { SLIDE_1, SLIDE_2, SLIDE_3, SLIDE_4 };
