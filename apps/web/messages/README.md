# Messages (next-intl)

`en.json` and `ar.json` must have the same keys (a unit test checks parity, ICU arguments and the banned
diagnostic phrases from `backend/app/ai/guards.py`).

**AR-REVIEW:** every Arabic string here is a draft in Modern Standard Arabic and still needs review by a native
speaker before the pitch (QUESTIONS #10). Patient screens address her in the feminine; shared chrome (footer,
demo page, clinician screens) uses neutral forms. Numbers use Western digits (`ar-AE-u-nu-latn`).

Clinical text (observation cards, assistant answers, SBAR) comes from the API and is never rewritten here.
