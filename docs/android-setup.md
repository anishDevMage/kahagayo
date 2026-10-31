# Creating the Android project

Android Studio creates the project so the Gradle wrapper and plugin versions are current and match.

1. Open Android Studio → **New Project** → **Empty Activity** (Jetpack Compose).
2. Fill in:
   - Name: `Kahagayo`
   - Package name: `app.kahagayo`
   - Save location: `D:\ait\kagayo\android`
   - Minimum SDK: API 26 (Android 8.0)
   - Build configuration language: Kotlin DSL
3. Wait for the first Gradle sync to finish, then press **Run** with the emulator to see the default screen.
4. On your phone: Settings → About phone → tap **Build number** 7 times → Developer options → turn on **USB debugging**. Plug it in and pick it in Android Studio's device list.
5. Commit: `git add android && git commit -m "Create Android project"`.

## First Claude Code prompt

Open PowerShell in `D:\ait\kagayo`, run `claude`, and paste:

```
Read CLAUDE.md and docs/architecture.md. In android/, build the first version:
1. Room entities and DAOs for transactions, accounts and raw_events (money as Long satang).
2. A home screen with the month total, a day-by-day list of entries and a quick-add sheet
   (amount, category, account, date, note).
3. Port shared/parser/parser.js to Kotlin for the chat-style input line, and turn every case
   in shared/parser/test.js into a unit test.
4. An importer for the Kahagayo JSON export (see lab/sample-data/example-export.json).
5. A notification logger: a NotificationListenerService that stores raw notifications from
   packages I pick into raw_events, plus a screen to browse them. No alert parsing yet.
Explain Android-specific choices briefly. Stop when ./gradlew test passes and tell me how
to install it on my phone over USB.
```
