# Incident process (pilot)

**The demo uses synthetic data only.** Every person in it is fictional. The database refuses any profile or clinic that is not marked synthetic (`CHECK (is_synthetic)` in `backend/app/db/schema.sql`). The profile check is pinned by `backend/tests/test_rls.py::test_database_refuses_non_synthetic_people`. This process is written for a pilot with real women. A pilot starts only after the gates in `research/2026-11-06/03-regulation-and-data.md` §6 are passed ("research 03" below). This file covers part of three of those pilot gates: G5 (24-hour breach plan), G7 (incident process) and G8 (escalation procedure agreed with the clinic).

**This is not an emergency service.** This process handles faults in ReproSense. Anyone in danger now: call 998 or go to the nearest emergency department.

- **Status:** draft for the clinical advisor (issue #45, card A9), 7 Nov 2026. Every time and owner below is a proposal until the clinic's lead agrees it in the pilot agreement. Card A9 and roadmap gates G2 and G3 are in `docs/18_ROADMAP_TO_95.md`, in open PR #48.
- **Owner:** Krishna.
- **Read with:** `docs/safety/HAZARD_LOG.md`, `docs/safety/RULE_SIGNOFF.md`, `docs/safety/CHANGE_LOG.md`.
- **Reviewed by:** chief-healthcare-officer agent: ____ · clinical advisor: ____ · clinic's lead: ____

## 1. What counts as an incident

An incident is any report or finding that ReproSense showed, said, missed or shared something that could harm a woman or mislead her clinician. The hazards are listed in `docs/safety/HAZARD_LOG.md`:

- a missed red flag
- a false alarm
- a false pattern
- a missed pattern or a missed follow-up (care gap)
- wrong or frightening wording
- a crisis message the assistant misses
- a record shown to the wrong clinic
- a wrong number or statement in the record, the clinician's summary or the PDF
- a mistranslated urgent text
- a model outage

Any use of her data outside her consent, or outside the UAE, is also an incident.

**Today (demo, synthetic data):** a finding becomes a row in `QUESTIONS.md`, and a PR once there is a fix. Some examples:

- #48: a false irregular-cycle pattern on short records. Fixed in PR #40, merged 6 Nov. The clinical advisor still has to check the new threshold.
- #53: no 998 card for sudden severe pain while trying to conceive, unless she also had a fever. Fixed in PR #40, merged 6 Nov. The clinical advisor still has to check it, and whether sudden severe pelvic pain alone should lead to 998.
- #56: crisis messages about pills got the medicine reply. Waiting for the clinical advisor.

## 2. People

| Role | Who | What they do |
| --- | --- | --- |
| Incident lead | Krishna (`krish2105`), who owns the backend, AI, data, security and deploy (`BUILD_STATUS.md`) | Sets the level, contains the problem, tells the clinic, approves fixes, closes the incident |
| Backup lead | Atharva (`mercydeez`), who owns the web app | Leads when Krishna cannot answer in time. Fixes screens, web text and Arabic display |
| Clinical advisor | Not recruited yet (`QUESTIONS.md` #2, #18). Needs a named deputy (section 9) | Decides on clinical containment, and always decides for a red flag. Reviews the fix. Signs the changed rule again |
| Clinic's lead | Named by the pilot clinic, usually its medical director or privacy officer (research 03 §7). No clinic and no letter of intent exist yet (`PROGRESS.md`) | Contacts affected women. Tells the clinic's clinicians. Files DoH notices if the agreement says so |
| DoH | Department of Health – Abu Dhabi | Gets the breach notice within 24 hours of first knowledge (`docs/07_SECURITY_PRIVACY.md`; research 03 §4, clause 6.5.1) |

The chief-healthcare-officer agent can review wording, but it cannot sign. Its own brief says it does not replace a licensed clinician (`.claude/agents/chief-healthcare-officer.md`).

## 3. Severity levels

When unsure, pick the higher level. Anyone can raise a level. Only Krishna can lower one, and he writes the reason in the incident record.

| Level | Meaning | Default level for these hazards |
| --- | --- | --- |
| **Urgent** | She could miss urgent care or come to harm now, or her data reached someone she did not choose | A missed red flag. A crisis message the assistant misses. Wrong or missing urgent text in any language, a mistranslation included: a red-flag card, the crisis message or a 998 line. A record shown to the wrong clinic. Her data sent outside the UAE, for example a model hosted abroad switched on with real data (`docs/07_SECURITY_PRIVACY.md`), or a host, backup or log outside the UAE (research 03 §3.4). A model outage while the model's second crisis check is on (below). |
| **Serious** | Health content that could mislead her or her doctor but does not delay urgent care, or the service is down | A false alarm. A false pattern, for example one shown to a woman less than 3 years after her first period. A missed pattern or follow-up. A wrong number or statement in the record, the clinician's summary or the PDF. Other wrong or frightening wording. The API or the web app is down, including when a hanging model makes screens time out (below). |
| **Minor** | Nothing about her health is wrong or delayed | A model that fails quickly while its second crisis check is off: cards fall back to template wording and the assistant to extractive answers (`backend/app/ai/llm.py`). A typo or layout fault that keeps the meaning. |

A model outage is **urgent** if the model's second crisis check (`safety.model_check` in `backend/app/agents/safety.py`) is on in the pilot. When the model fails, crisis routing falls back to the word checks alone. They routed 11 of 30 crisis messages on held-out round 5 (`QUESTIONS.md` #50). Roadmap gate G3 (open PR #48) turns the model check on in production only if it routes at least 27 of 30. The audit log keeps neither her words nor the assistant's route (section 7), so we cannot tell who wrote to the assistant in crisis during the outage.

A model that hangs instead of failing is **serious**. Each model call can wait 30 seconds and retry twice (`backend/app/ai/llm.py`). That is longer than the web app's 15-second limit (`apps/web/src/lib/api/server.ts`). For women with AI on, screens can then show the error state, so the service is down for them.

## 4. Who is told, and how fast (proposed)

| | Urgent | Serious | Minor |
| --- | --- | --- | --- |
| First reply to whoever reported it | Within 1 hour, any day and time | Same working day | Within 1 working day |
| Krishna and Atharva | At once | Same working day | Within 1 working day |
| Clinic's lead | Within 1 hour | Within 1 working day | Monthly summary |
| Clinical advisor | Within 1 hour | Within 1 working day | Monthly summary |
| DoH | Within 24 hours of first knowledge, if her data reached someone she did not choose or left the UAE | n/a | n/a |
| Contained (switched off or fixed) | Same day | Within 5 working days | Next planned release |
| Review held | Within 5 working days | Within 10 working days | Weekly safety review |

Research 03 §7 plans the weekly safety review and the monthly summary for month 5 of its plan (April 2027), the pilot's second month. The planned check for that month is zero unresolved serious incidents. The pilot starts in month 4, so hold the weekly safety review from the first real record (section 9).

### How a report reaches us

- **A woman** tells her clinic. The app has no "report a problem" button. It stores no phone number or email for her (`profiles` in `backend/app/db/schema.sql`), so we answer her through the clinic.
- **A clinician** writes to the support inbox, or tells Krishna directly. /status lists the inbox as "Support for pilot clinics" (`SUPPORT_EMAIL`, `apps/web/src/app/(site)/status/page.tsx`). `SUPPORT_EMAIL` is not set yet because the demo is not deployed (`HANDOFF.md`).
- **The team** finds it in one of these places:
  - CI on every push (`.github/workflows/ci.yml`).
  - The uptime check (`.github/workflows/uptime.yml`). It is off until `LIVE_API_URL` is set. A failed run is the alert. But GitHub emails it only to the person who last changed the workflow's schedule. GitHub also turns scheduled runs off in a public repository after 60 days without activity. And the check expects the 8 demo personas. Fix all three before a pilot (section 9).
  - `make safety-eval`.
  - A review.
- **Whoever gets the report** tells Krishna at once. If Krishna does not answer within the first-reply time, they tell Atharva.

A report names the record by its alias or record id. It never includes a name, phone number or Emirates ID. It gives the date and time, the screen, the language and the exact words she saw. A screenshot is best.

### First steps for an urgent incident

1. If a woman may need care now, ask the clinic's lead to contact her at once. We cannot reach her ourselves. The clinic decides what care she needs.
2. Open an incident record (section 7). Write down the time of first knowledge.
3. Tell everyone in the table above.
4. Keep the evidence before changing anything. This takes minutes, and it must never hold up step 1:
   - Run the chain check (`GET /v1/admin/audit/verify`, also shown on /admin).
   - Export the audit log (`GET /v1/admin/audit/export.csv`).
   - Save the report id, the share id and the screenshots.
5. Contain the problem (section 5). If a safe fix cannot ship the same day, Krishna, the clinical advisor and the clinic's lead agree a stop-gap, for example the clinic checking the affected records by hand.
6. If her data reached the wrong people or left the UAE, start the DoH notice now. The 24 hours run from first knowledge.
7. Send the clinic's lead a written update within 24 hours.

## 5. Switching off a rule or a reply

**No runtime switch exists for a rule, and no switch closes the assistant for everyone.** The only way to switch off a rule is a code change and a redeploy. A runtime switch is the first next action (section 9).

These steps describe today's hosts, Render and Vercel. The API's Render region is Frankfurt (`render.yaml`), outside the UAE. A pilot needs UAE hosting (gate G4, research 03 §6), so rewrite the host steps when that host is chosen.

| To stop | How (exists today) | When it takes effect | Limits |
| --- | --- | --- | --- |
| One rule (red flag or observation) | Change `rules/clinical_rules.yaml` in a PR: remove the rule or narrow its `when`. Merge only with green CI (`docs/08_DEPLOY_RULES.md` rule 2). Render then rebuilds the API (`autoDeploy: true` in `render.yaml`). | After the rebuild. The file is copied into the image (`backend/Dockerfile`) and read once per process (`load_rules` is cached in `backend/app/rules/engine.py`). | Adding a key such as `enabled: false` does nothing. The engine stores unknown keys in `Rule.extra` and still runs the rule. |
| The Arabic message of a red-flag card | Change `rules/translations_ar.yaml`, then PR, merge and rebuild | After the rebuild (it is read once in `backend/app/agents/copy.py`) | Her app card does not show this message. It shows the fixed 998 action line from `apps/web/messages/ar.json` and the title from `RF_TITLES` (`apps/web/src/components/ui/UrgentCard.tsx`, `apps/web/src/components/safety/RedFlagCard.tsx`). The message is only in the API's card text (`summary` in `backend/app/agents/pipeline.py:_template_card`). For wrong urgent text on her card, change the next row and the web text row. |
| A red-flag card's short title (English and Arabic), her questions for the doctor, or the clinician's wording | Change `RF_TITLES`, `QUESTIONS` or `CLINICIAN` in `backend/app/agents/copy.py`, then PR, merge and rebuild | After the rebuild | On her app card this title comes under the fixed 998 action line from `en.json` or `ar.json`, and the rule's own message is not shown (`apps/web/src/components/ui/UrgentCard.tsx`, `apps/web/src/components/safety/RedFlagCard.tsx`). |
| A fixed assistant text (urgent, crisis, medicine, refusal, not found) | Change `URGENT_TEXT` or the other fixed texts in `backend/app/agents/assistant.py`, then PR, merge and rebuild | After the rebuild | |
| A crisis or urgent message the assistant routes wrongly | Change the routing in `backend/app/agents/safety.py`, then PR, merge and rebuild | After the rebuild | Never tune on held-out round 5 in `backend/tests/rag_heldout.jsonl` (`QUESTIONS.md` #50). |
| A wrong passage in an assistant answer | Fix the summary in `knowledge_base/summaries/`, then PR, merge and rebuild. Then rebuild the index: from `backend/` on an up-to-date `main`, run `uv run python -m app.rag.ingest` with `DATABASE_URL` set to the live database. | After the index rebuild. Answers read passages from the `kb_chunks` table, not from the files. | The Render free tier has no shell (`backend/app/db/seed.py`). |
| All model wording: the assistant's rewording, AI wording of cards, and the model's second crisis check | Set `LLM_PROVIDER=none` on the API host and restart. `/readyz` then shows `"llm": "none"`. | After the restart. Settings are read once (`get_settings` is cached in `backend/app/config.py`). | `render.yaml` already sets `none`. The word checks and the 998 strip stay on. That `none` builds no model client and that `/readyz` shows `none` is pinned by `backend/tests/test_demo_safe.py::test_none_never_builds_a_model_client_on_the_demo_path`. |
| The assistant, for one woman | She turns off "Use AI features" in Privacy. The API then answers 403 `ai_off`, and her cards use template wording. | At once | This is her choice, and staff have no switch for it. New records start with AI off (`QUESTIONS.md` #46). Pinned by `backend/tests/test_ai_choice.py::test_turning_ai_off_closes_the_assistant_and_on_opens_it` and `apps/web/e2e/ai-choice.spec.ts`. |
| A clinic's access to her record, or a shared report link | She turns off "Share my record with my clinic" in Privacy, or taps "Stop sharing" on the report screen | At once | No staff tool exists. Links expire after 7 days (`backend/app/api/reports.py`). |
| Web text, in English or Arabic | Change `apps/web/messages/en.json` or `ar.json`, then PR, merge and redeploy on Vercel | After the redeploy | |
| Everything, as a last resort | Stop the API on its host. Her app and the clinic then show the error state, and the 998 line stays visible (`apps/web/e2e/api-down.spec.ts` checks `/app` and `/clinic`). | At once | The clinic loses access too. Krishna decides with the clinic's lead and the clinical advisor. |

**Approval.** Changes to these need Krishna's approval in the PR (roadmap gate G2 in `docs/18_ROADMAP_TO_95.md`, open PR #48; not the device-status gate G2 in research 03):

- `rules/clinical_rules.yaml`
- `URGENT_TEXT` or the crisis citations in `assistant.py`
- the routing in `safety.py`
- authentication and row-level security, which a fix for a record shown to the wrong clinic touches

Krishna also approves urgent text that G2 does not name: `RF_TITLES` in `copy.py`, `rules/translations_ar.yaml`, and the 998 lines in `en.json` and `ar.json`. Arabic urgent text also needs the native Arabic reviewer (`QUESTIONS.md` #10). In a pilot, the clinical advisor also signs every rule change and every urgent-text change. An urgent change still goes through a PR with green CI. If a change makes things worse, revert the merge commit and let the API rebuild.

**Never switch these off as containment:**

- the RF4 crisis path
- the 998 strip in the assistant (`apps/web/src/components/assistant/Chat.tsx`)
- the 998 line in the footer (`apps/web/src/components/chrome/Footer.tsx`)

Never switch off a red flag without the clinical advisor's written yes. To fix a false alarm, write a narrower rule and have the advisor sign it. Do not remove the warning.

**After a rule change, some things change at once and some do not:**

- **At once, after the rebuild:** her Home and Patterns, the clinician's record view and every new report. They run the rules again on each request (`cards_for` and `run` in `backend/app/agents/pipeline.py`).
- **Not at once: what the clinic list and /admin show.** Several things come from the stored `observations` and `care_gaps` tables: the clinic list's red-flag and pattern counts, its urgent tags, its order (most red flags first), and the open care gaps. So do the care-gap counts on /admin. A record's rows are rebuilt only when she logs an entry, completes a check-in, confirms a document or changes a consent. `refresh_all` exists in `pipeline.py`, but only the seed calls it. In the demo, Reset demo data rebuilds everything. But it wipes all data, the audit log included, and it works only in demo mode (`docs/08_DEPLOY_RULES.md` rule 8).
- **Not at once: reports already made and links already shared.** They keep the payload that was stored when they were made (`reports.payload`). A shared link stays open until it expires or she stops sharing.

Tell the clinic's lead about both of these delays. Until the rows are rebuilt, the clinic checks the affected records by hand.

## 6. How the clinic is told

- Krishna tells the clinic's lead. If Krishna cannot, Atharva does.
- The app cannot do it. It cannot message a clinic or a woman, and it pushes nothing to staff. Staff see a problem only when they open a screen. The clinic list shows an urgent tag for a red flag, taken from the stored rows (section 5). The record view shows the red-flag cards, and "Crisis path open" when a mood check opened the crisis path (`apps/web/src/components/clinic/PatientList.tsx`, `apps/web/src/components/clinic/RecordDetail.tsx`).
- Use the contact route in the pilot agreement (not written yet). Send health details only through a channel hosted in the UAE, or in person (research 03 §3.4).
- The clinic decides how to reach affected women and what care they need. Clinicians make the decisions. A card informs care but never decides it.
- Ask the clinic to reach each woman privately, through the contact she gave the clinic, in her chosen language (Arabic or English), and by a woman clinician if she prefers and one is available. Never leave health details in a voicemail or text message, or with a family member or anyone else who answers. Say only who is calling and ask her to call back. If care is urgent and she cannot be reached, the clinic follows its own urgent-contact procedure.
- Tell her plainly what went wrong, that it was a fault in ReproSense and not something she did, what to do now and who to ask. If her data reached someone she did not choose, tell her that too. Remind her that she can stop sharing or turn off AI features in Privacy at any time.
- For an urgent incident, send a written update within 24 hours. Send another when the incident closes.
- Each month, send a summary of all incidents. The clinic can file it with DoH under the Responsible AI risk process (research 03 §2.1 and §7).

**First notice (template)**

```text
ReproSense incident INC-YYYYMMDD-N · level: urgent / serious
What happened: <one or two plain sentences>
Records: <record ids, or "still checking">
What she saw or missed: <the card, answer or PDF line, word for word, and the language>
What we did: <switched off / changed / nothing yet>, at <time>
What we ask of the clinic: <for example: contact these women today; tell clinicians this card is wrong>
Her data outside her consent or the UAE: yes / no / checking. If yes: DoH notice due by <first knowledge + 24 hours>
Next update from us: <time>
Incident lead: Krishna. Backup: Atharva.
```

Never put names, phone numbers or Emirates IDs in the notice.

## 7. How it is logged

### Data events: the hash-chained audit log

- `backend/app/security/audit.py` writes one row per data event: actor id and role, action, record id, target, detail and time.
- Each row stores `sha256(prev_hash + row)`. Changing an old row breaks the chain. A database lock makes chain writes happen one at a time.
- The `audit_log` table is append-only for the app (`REVOKE UPDATE, DELETE` in `backend/app/db/schema.sql`). Pinned by `backend/tests/test_rls.py::test_audit_log_is_append_only`.
- **Check the chain:** `GET /v1/admin/audit/verify` returns `entries`, `chain_ok` and `first_bad_id`. /admin shows the result. Pinned by `backend/tests/test_security.py::test_audit_chain_verifies_and_detects_tampering`.
- **Export it:** `GET /v1/admin/audit/export.csv`. Only the admin role can do this, and the export itself is logged. The free-text `detail` column is left out. Pinned by `backend/tests/test_api.py::test_admin_sees_each_clinic_and_can_export_the_audit_log`.
- She sees her own latest 50 entries in Privacy, under "Who saw my data".
- These actions matter most in an incident: `view_record`, `list_patients`, `ask_record`, `consent_grant`, `consent_revoke`, `create_share`, `revoke_share`, `view_shared_report`, `download_shared_report`, `create_report`, `download_report`, `view_insights`, `assistant_ask`.

**What the audit log does not hold:**

- the words of assistant questions and answers
- the route the assistant took (crisis, urgent, medicine or answer): an `assistant_ask` row has no detail (`backend/app/api/assistant.py`)
- which cards she saw (stored cards are replaced on each refresh)
- who opened a share link (the actor is recorded as `share-link`)
- rule changes, deploys and settings such as `LLM_PROVIDER`
- the incident itself

The incident record and the git history cover these. A change made straight in the database is not in the chain either, so write it in the incident record.

### The incident record

Never keep incident records in this repository, because it is public (`QUESTIONS.md` #34). Keep pilot records in a private store hosted in the UAE and agreed with the clinic (not chosen yet). The repository gets only the outcome, without personal data: the CHANGE_LOG row, the test and the HAZARD_LOG update.

| Field | What to write |
| --- | --- |
| Incident id | INC-YYYYMMDD-N |
| Level | Urgent, serious or minor. If the level changes, who changed it and why |
| First knowledge | Date and time (UAE time), and who knew first |
| Reported by | A woman (through the clinic), a clinician, the team or a monitor |
| Clinic | The clinic's id |
| Records | Record ids only |
| Hazard | The row in `docs/safety/HAZARD_LOG.md` |
| What happened | Facts only. The exact words she saw, and the language |
| Where it came from | Rule id, assistant route, file or code path |
| Harm | None known, possible or happened |
| Contained | What was switched off or changed, when, by whom, with the PR and commit |
| People told | Each person or role, the time, and how |
| DoH notice | Needed or not. Due time, sent time, sent by |
| Audit evidence | Chain check result (`entries`, `chain_ok`, `first_bad_id`) and the audit rows looked at |
| Cause | In plain words |
| Fix | PR, test file and test name |
| Review | Date, CHANGE_LOG row, RULE_SIGNOFF re-sign date, HAZARD_LOG update, QUESTIONS row |
| Closed | Date, closed by Krishna. For urgent and serious incidents, the clinical advisor agrees |

## 8. Review after an incident

Urgent and serious incidents get a review within the time in section 4. Minor ones go to the weekly safety review.

1. Krishna, Atharva and the clinical advisor meet. Invite the clinic's lead.
2. Write the cause in plain words. Name the control in `HAZARD_LOG.md` that failed.
3. Fix it in a PR. Krishna approves (section 5). The chief-healthcare-officer and women-care-lead agents review any health wording (`CLAUDE.md`). CI must pass.
4. Pin the case with a test:
   - a rule case in `backend/tests/test_rules.py`, or in `backend/tests/test_rule_edges.py`
   - an assistant case in `backend/tests/test_safety_routing.py`

   Never add it to held-out round 5.
5. Add a row at the top of `docs/safety/CHANGE_LOG.md` (newest first): date, what changed, files, `QUESTIONS.md` row, PR and incident id.
6. Get the rule signed again in `docs/safety/RULE_SIGNOFF.md`:
   - No rule is signed yet. The reviewer line in `rules/clinical_rules.yaml` is blank (`QUESTIONS.md` #18). The first sign-off is part of pilot gate G8.
   - For each changed rule, clear the reviewer, date and decision, and write "changed after INC-…" in the comment.
   - The clinical advisor signs again: agree, change or remove.
   - Git keeps the old sign-off.
   - The incident stays open until the rule is signed again.
7. Update the hazard's row in `docs/safety/HAZARD_LOG.md`: the new control, the residual risk (low, medium or high) and the next action.
8. Add a `QUESTIONS.md` row for any decision that is still open.
9. Tell the clinic's lead what changed. Krishna then closes the record. For urgent and serious incidents, the clinical advisor agrees first.

## 9. Next actions before a pilot

| Action | Why | Owner |
| --- | --- | --- |
| Add runtime switches, each set by an admin action that is written to the audit chain. One switch skips chosen rule ids (a red flag only with the clinical advisor's yes). One closes the assistant for everyone, in the same closed state as `ai_off`. One turns model wording off without a restart | Today a rule can only be switched off by a code change and a rebuild, and the model switch needs a restart | Krishna |
| Add a staff command that re-runs the rules for every record after a rule change | Stored counts, tags, order and care gaps on the clinic list go stale (section 5) | Krishna |
| Add a staff action to stop a share link, written to the audit chain | Only she can stop sharing today | Krishna |
| Add "Report a problem" on cards and assistant answers, for her and for clinicians, going to the support inbox | The app has no way to report a problem, and she has no contact with us | Atharva |
| Set `SUPPORT_EMAIL` to a pilot inbox hosted in the UAE, read by Krishna and Atharva | /status shows no contact until it is set | Krishna |
| Send uptime alerts to Krishna and Atharva, keep the check running, and make it check the pilot, not the 8 demo personas | GitHub emails a failed scheduled run only to the person who last changed its schedule. It turns scheduled runs off in a public repository after 60 days without activity | Krishna |
| Make `none` the default for real data, or refuse to start with a model hosted outside the UAE | `llm_provider` defaults to `auto` (`backend/app/config.py`), which uses Claude whenever `ANTHROPIC_API_KEY` is set. Claude processes data outside the UAE (research 03 §3.4) | Krishna |
| Hold the weekly safety review from the first real record | The pilot starts in month 4 of research 03 §7, but the review is planned for month 5 | Krishna, with the clinical advisor |
| Give Atharva access to the API and web hosts | The accounts are Krishna's (`docs/16_DEPLOY_NOW.md`, `HANDOFF.md`), so the backup lead cannot switch anything off | Krishna |
| Rewrite section 5 for the UAE host | Today's steps are for Render and Vercel, and the API runs in Frankfurt (`render.yaml`) | Krishna |
| Choose the private, UAE-hosted store for incident records | The repository is public | Krishna |
| Write these into the pilot agreement: the clinic's lead and a deputy, a deputy for the clinical advisor, the contact route, the 24-hour breach route, support hours and the response times above | Pilot gates G5 and G8 (research 03 §6) | Krishna, with the clinic |
| Recruit the clinical advisor | Without one, nobody can sign a rule change or close a clinical incident (`QUESTIONS.md` #2, #18) | Atharva and Krishna |

## 10. Open questions (to log in `QUESTIONS.md`)

1. **DoH and the clinic:** who files the 24-hour breach notice, the clinic or ReproSense? Through which DoH channel? The research names no channel for it.
2. **UAE Data Office:** does an incident also need a report under PDPL Article 9? Its timings are still waiting for the executive regulations (research 03 §3.3).
3. **EDE:** if EDE classes ReproSense as a medical device, which vigilance reports apply? EDE runs device vigilance (research 03 §1.1).
4. **Assistant route in the audit log:** should each `assistant_ask` row record the route (crisis, urgent, medicine or answer), but never her words? Without it, nobody can tell who got which reply during a model outage. The route is health information, and a crisis route is especially sensitive. The clinical advisor and the clinic decide. She is told in Privacy before any route is kept, and the admin export leaves the route out.
