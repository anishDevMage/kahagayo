# First-time setup on Windows

Commands below are for **PowerShell**. Open it from the Start menu, then go to the project:

```powershell
cd D:\ait\kagayo
```

## 1. Check what's installed

```powershell
git --version
docker --version
node --version
python --version
```

Install whatever is missing:

- Git: https://git-scm.com/download/win (accept the defaults)
- Docker Desktop: https://www.docker.com/products/docker-desktop/ (restart Windows after installing, then start Docker Desktop once)
- Node.js LTS (optional, for parser tests without Docker): https://nodejs.org
- Android Studio (for the app): https://developer.android.com/studio

## 2. Tell Git who you are (once per laptop)

```powershell
git config --global user.name "Anish Lal Manandhar"
git config --global user.email "you@example.com"   # use the email on your GitHub account
git config --global init.defaultBranch main
```

## 3. Make the first commit

```powershell
git init
git add .
git status          # check that nothing from private/ is listed
git commit -m "Scaffold Kahagayo: docs, parser, lab API, Docker"
```

## 4. Put it on GitHub

1. Go to https://github.com/new
2. Repository name: `kahagayo`. Choose **Private**. Do **not** add a README, .gitignore or licence (the repo already has them).
3. Click **Create repository**, then run the two lines GitHub shows under "push an existing repository", which look like:

```powershell
git remote add origin https://github.com/<your-username>/kahagayo.git
git push -u origin main
```

A browser window asks you to sign in to GitHub the first time. After the push, the **Actions** tab on GitHub runs the tests automatically.

## 5. Run it in Docker

Start Docker Desktop and wait until it says "Engine running". Then:

```powershell
docker compose --profile test run --rm test-parser
docker compose --profile test run --rm test-lab
docker compose up --build lab
```

Open http://localhost:8000/health in a browser. Stop it with Ctrl+C.

Import the example data (in a second PowerShell window):

```powershell
curl.exe -X POST http://localhost:8000/import -H "Content-Type: application/json" --data-binary "@lab/sample-data/example-export.json"
curl.exe http://localhost:8000/months/2026-11/summary
```

## 6. Daily Git routine

```powershell
git status
git add .
git commit -m "Describe what changed"
git push
```

Or ask Claude Code: "commit these changes with a clear message", then check `git log` before you push.
