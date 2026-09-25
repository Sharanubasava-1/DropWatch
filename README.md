# DropWatch

Live leaderboard of new AI model drops, pulled from Hacker News and Reddit, classified with Claude (or a keyword fallback), and ranked by discussion velocity over the last 24–48 hours.

X/Twitter is skipped on purpose — the API is paywalled.

## Stack

- **Backend:** Node.js + Express
- **DB:** SQLite (`better-sqlite3`) locally; swap `src/db/client.js` to `pg` on Render if you want Postgres
- **Sources:** [Algolia HN Search](https://hn.algolia.com/api) and Reddit public JSON
- **Classify:** Anthropic Claude Haiku, with a keyword fallback if `ANTHROPIC_API_KEY` is empty
- **Frontend:** static HTML + Chart.js (Vercel-ready)

## Local setup

```bash
cd backend
copy .env.example .env
npm install
npm run refresh
npm run dev
```

Then open `frontend/index.html` in a browser (Live Server, or `npx serve ../frontend`). The dashboard fetches `http://localhost:3001/api/releases`. Override with `?api=https://your-api/api/releases`.

Set `ANTHROPIC_API_KEY` in `.env` for real “is this a release?” classification. Without it, titles matching GPT/Claude/Llama/etc. still get ranked so Day 1 works offline.

## API

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | liveness |
| GET | `/api/releases?limit=20` | leaderboard |
| POST | `/api/refresh` | header `x-refresh-secret` must match `REFRESH_SECRET` |

## Deploy

- **Frontend:** Vercel, `frontend/` as root. Edit `vercel.json` so `/api/*` rewrites to your Render URL.
- **Backend + cron:** Render Blueprint (`backend/render.yaml`) — web service + cron every 3 hours running `npm run refresh`.

Free Render web services sleep. Use the **cron job**, not an in-process timer, so the dashboard actually stays live.

## Interview one-liner

Scrapes HN and Reddit for model launches, uses an LLM to filter noise and extract a one-line summary, then ranks by mention/comment/upvote velocity on a dashboard that refreshes on a schedule.
