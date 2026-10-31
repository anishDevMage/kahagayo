# Kahagayo

Personal finance tracker for one person in Bangkok. Currency THB.
Name: Kahagayo (Nepali कहाँ गयो, "where did it go?"). Mascot line: "Hatti khoi?" (the elephant on the 1,000-rupee note).
The folder is `kagayo`; the repository and app are `kahagayo`.

## Parts of this repo
- `android/` Kotlin app, the main product. Runs on my Android phone, installed over USB, not the Play Store.
- `shared/parser/` reference chat-line parser in JavaScript; `test.js` is the spec. The Kotlin port must pass the same cases.
- `lab/` Python 3.12, standard library only, for imports, summaries and graph experiments. Runs in Docker.
- `docs/` architecture, setup notes. Keep `docs/architecture.md` current when the design changes.

## Android stack
- Kotlin, Jetpack Compose, Material 3, Room, Hilt, WorkManager, Coroutines/Flow; minSdk 26.
- Claude API over HTTPS for: chat-line fallback, receipts, entity extraction, why questions.
  The key is entered in Settings and stored with the Android Keystore. Never in code or git.

## Money rules (all parts)
- Store amounts as integer satang (1 THB = 100 satang). Never Float/Double for money.
- Types: expense, income, transfer. A transfer moves money between my own accounts
  (bank -> TrueMoney top-up, ATM withdrawal) and never counts as spending.
- Default accounts: cash (CSH), truemoney (TMN), bank (BNK).
- Dates are local Asia/Bangkok. Thai receipts may print Buddhist-era years (BE = CE + 543).
- Export format: JSON with `"format": "kahagayo"`, version 1 (older files say "baht-book"; accept both).

## Capture (Android)
- Save every SMS or notification in raw_events BEFORE parsing; transactions link back via raw_event_id.
- NotificationListenerService only for packages listed on an account (bank apps, TrueMoney, LINE).
- Parse: regex template per sender -> Claude fallback -> review inbox. Deduplicate on amount + account within 2 minutes.

## Privacy
- Never commit real spending data. Real exports live in `private/` (git-ignored).
- `lab/sample-data/` holds clearly marked EXAMPLE data only.

## Working agreements
- I'm on Windows (D:\ait\kagayo); give commands for PowerShell or CMD and say which.
- Every parser gets unit tests from real but anonymised samples.
- Before calling a task done: run the tests for the part you changed
  (`node shared/parser/test.js`, `python -m unittest discover -s tests` in lab/, `./gradlew test` in android/).
- When you make an Android-specific choice, explain it in two or three lines; I'm learning Android.
- Small commits with clear messages; never push without asking me.
