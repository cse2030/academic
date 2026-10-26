# Study Desk

Personal academic dashboard (React + Vite + TypeScript) that reads **Google Sheets published as CSV**. Hosted free on GitHub Pages; no backend, no secrets.

## How data is read
Each tab is **File → Share → Publish to web → (tab) → CSV**. Paste the 5 links into `src/config.ts`. Limits: data is public to anyone with the link; updates can take a few minutes to appear; the app is **read-only** (status changes are saved only in your browser's localStorage). Safe editing from the web would need a backend (e.g. an Apps Script web app with its own auth); never put API keys or tokens in this repo.

## Sheet schema (row 1 = headers; names are case/space-insensitive, extra columns are ignored)
| Tab | Columns (**required**) |
|---|---|
| Subjects | **Subject ID**, **Subject Name**, Category, Color (#hex), Instructor, Description, Semester |
| Tasks | **Task ID**, Subject ID, **Title**, Description, Priority (high/medium/low), Status (todo/in progress/done), Due Date (YYYY-MM-DD), Completion Date |
| Resources | **Resource ID**, Subject ID, Resource Type (YouTube/Book/PDF/Website…), **Title**, URL, Description, Notes |
| Schedules (weekly timetable) | **Session ID**, Subject ID, **Day** (Saturday…Friday), Start Time (HH:MM), End Time or Duration (minutes), Location, Type (Lecture/Lab/Section) |
| Exams | **Exam ID**, Subject ID, Title, **Date**, Notes |

`Subject ID` in other tabs links to Subjects. Invalid rows/URLs are skipped and listed under "data warnings". Add new columns freely.
Sample rows: see `src/sample.ts` (demo data, shown only while `config.ts` is empty).

## Run locally
`npm install` → `npm run dev` → open the printed URL.

## Deploy
1. Create a GitHub repo and push this project to `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds with `BASE_PATH=/<repo-name>/` and publishes. Site: `https://<user>.github.io/<repo-name>/`.
Routing uses `#/` hashes, so refreshes never 404.

## Production checklist
- [ ] Page loads without console errors; assets load from `/<repo-name>/`
- [ ] Demo banner is gone; your subjects/tasks appear
- [ ] Each nav tab and a subject page open; reload on a subject page works
- [ ] Filters, sort, and search work; status change survives reload
- [ ] Overdue vs upcoming matches today's date
- [ ] Bad URL shows "link missing or invalid"; blank cells don't break rows
- [ ] Disconnect network or break a link: a clear error appears
- [ ] Check at phone width and dark mode
