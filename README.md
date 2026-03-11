# AIVA — AI-Powered Financial Advisor Workstation

A full-stack intelligent workstation built for financial advisors to manage clients, automate outreach, and surface actionable insights — powered by algorithmic scoring and proactive idea generation.

## Features

- **Command Center** — Morning briefing, priority tasks, market movers, recommended contacts, and top ideas in a single dashboard
- **Client Management** — Full client profiles with AUM, risk profiles, portfolio holdings, life events, and communication history
- **Proactive Ideas Engine** — Template-driven outreach triggered by portfolio concentration, life events, call cycle overdue, market events, and behavioral signals
- **Algorithmic Scoring** — Deterministic weighted scoring (contact recency, AUM, portfolio risk, life event proximity, alert severity, behavioral signals) to rank clients and ideas by urgency
- **Call Cycle Management** — AUM-tiered contact cadence (30/60/90/180 days) with algorithmic override detection for concentrated positions, unusual activity, and critical life events
- **Meeting Intelligence** — Live meeting recording, AI-generated summaries, action item extraction, and follow-up drafts
- **Light/Dark Mode** — Premium dual-theme UI with Bloomberg-style dark mode and clean light mode

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4, TypeScript |
| Backend | FastAPI, SQLAlchemy, Pydantic v2, Python 3.9+ |
| Database | SQLite (dev), PostgreSQL-ready |
| Auth | JWT with httpOnly cookies |

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Seed the database with mock data
python -m app.mock.seed

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:

```
Email: advisor@aiva.com
Password: demo123
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models (client, portfolio, call_cycle, etc.)
│   │   ├── routers/         # FastAPI endpoints (clients, ideas, scoring, call_cycles)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic (scoring, idea engine, call cycles)
│   │   └── mock/            # Seed data and templates
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/             # Next.js pages (command-center, clients, ideas, etc.)
│       ├── components/      # Reusable UI components
│       ├── hooks/           # Custom React hooks (useAIVA, useWebSocket)
│       ├── lib/             # API client, utilities
│       ├── providers/       # Context providers (Theme, Session, WebSocket)
│       └── types/           # TypeScript interfaces
```

## License

MIT
