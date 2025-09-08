# Recruiter Assistant

A small app that scans resumes (from a local folder or Google Drive), parses candidate data, stores it in MongoDB, and optionally logs results to Google Sheets and sends emails.

## What this repo contains

- `client/` — React (Vite) frontend
- `server/` — Express API, MongoDB models, Google Drive/Sheets helpers

## Quick setup (Windows / PowerShell)

Prerequisites:
- Node.js (16+ recommended)
- MongoDB running locally or accessible via URI
- A Google service account JSON if you want Drive/Sheets integration

1. Copy the example env variables into `server/.env` and `client/.env` (create if missing).

Required server env vars (add to `server/.env`):

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/recruiter_assistant
# Optional: local resume dir fallback
RESUME_DIR=C:\Users\<you>\Documents\Resumes
# Path to your Google service account JSON file (for Drive & Sheets)
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json
# Email (SMTP) settings if you plan to send emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-smtp-password
```

Important: Do NOT commit your Google service account JSON or `.env` files. They are included in `.gitignore`.

2. Install dependencies and run the apps (two terminals)

```powershell
# server
cd server
npm install
npm run dev

# client
cd client
npm install
npm run dev
```

3. Open the frontend (Vite usually runs on http://localhost:5173) and use the Resume Scanner:
- Paste a Google Drive *folder* link into the Drive Link field
- Make sure the service account email has Viewer access on that folder (share the folder with the service account email)
- Click `Scan Resumes from Drive` to download & parse files and add candidates to the DB

## Google Drive & Service Account notes
- The app reads the service account JSON referenced by `GOOGLE_APPLICATION_CREDENTIALS`.
- Ensure the service account JSON contains `client_email` and the service account has access to the Drive folder.
- Share the Drive folder with the service account email (the `client_email` from the JSON) for read access.

## API
- `POST /api/candidates/scan` — triggers a scan (accepts `{ driveLink }` in body)
- `GET /api/candidates` — list candidates
- `PATCH /api/candidates/:id` — update candidate notes/status
- `POST /api/email/send/:id` — send email to candidate (if configured)

## Git
A remote origin has been added (https://github.com/MahikaWakankar/Recruiter_assistant). To push your local initial commit:

```powershell
# from repo root
git push -u origin master
```

If your GitHub repo uses `main` as default, push to that branch instead:

```powershell
git push -u origin master:main
```

If you see a `dubious ownership` Git error on Windows, add the safe directory:

```powershell
git config --global --add safe.directory 'C:/Users/YourUser/Desktop/recruiter-assistant'
```

## Troubleshooting
- "The incoming JSON object does not contain a client_email field" — make sure `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account JSON file and that file contains `client_email`.
- If the Drive scan fails with permission errors, ensure the folder is shared with the service account email.
- Use browser devtools / server logs to inspect API errors.

## Next steps / improvements
- Add pagination & filtering to the candidate list UI
- Add unit tests for resume parsing logic
- Add authentication and upload flow for Google Drive links

---

If you want, I can push the local commit to GitHub now (I will run `git push -u origin master`). Reply `push` to proceed.
