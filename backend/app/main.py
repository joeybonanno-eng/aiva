from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.database import engine, Base
from app.routers import auth, clients, meetings, dashboard, alerts, messages, ws, ideas, call_cycles, scoring, ticker

app = FastAPI(
    title="AIVA — AI Virtual Advisor",
    description="AI-first financial advisor workstation API",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(meetings.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(messages.router)
app.include_router(ws.router)
app.include_router(ideas.router)
app.include_router(call_cycles.router)
app.include_router(scoring.router)
app.include_router(ticker.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Auto-seed if database is empty (needed for ephemeral filesystems like Render)
    from app.database import SessionLocal
    from app.models.advisor import Advisor
    db = SessionLocal()
    try:
        if not db.query(Advisor).first():
            db.close()
            from app.mock.seed import seed_database
            seed_database()
        else:
            db.close()
    except Exception:
        db.close()


@app.get("/")
def root():
    return RedirectResponse(url="/docs")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "aiva-backend"}
