"""Seed script to populate database with mock data."""

import sys
import os
from datetime import datetime, date, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import engine, SessionLocal, Base
from app.models.advisor import Advisor
from app.models.client import Client
from app.models.portfolio import ClientPortfolio
from app.models.meeting import Meeting, TranscriptSegment, MeetingAction
from app.models.alert import Alert
from app.models.task import AdvisorTask
from app.models.life_event import LifeEvent
from app.models.communication import CommunicationLog, MessageDraft
from app.services.auth_service import hash_password
from app.mock.clients import MOCK_CLIENTS
from app.mock.portfolios import generate_portfolio_for_client
from app.mock.life_events import get_life_events_for_client
from app.mock.meetings import MOCK_MEETINGS
from app.mock.communications import MOCK_COMMUNICATIONS
from app.models.call_cycle import ClientCallCycle
from app.models.idea_template import IdeaTemplate
from app.models.client_score import ClientScore
from app.models.client_activity import ClientActivityLog
from app.mock.idea_templates import IDEA_TEMPLATES


def seed_database():
    """Populate the database with realistic mock data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(Advisor).first()
        if existing:
            print("Database already seeded. Use --force to re-seed.")
            if "--force" not in sys.argv:
                return
            print("Force re-seeding — dropping all data...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        # 1. Create demo advisor
        advisor = Advisor(
            email="advisor@aiva.com",
            hashed_password=hash_password("demo123"),
            full_name="Alexandra Rivera",
        )
        db.add(advisor)
        db.flush()
        print(f"Created advisor: {advisor.full_name} ({advisor.email})")

        # 2. Create clients
        client_map = {}  # last_name -> Client object
        for client_data in MOCK_CLIENTS:
            client = Client(
                advisor_id=advisor.id,
                first_name=client_data["first_name"],
                last_name=client_data["last_name"],
                email=client_data["email"],
                phone=client_data["phone"],
                company=client_data["company"],
                title=client_data["title"],
                aum=client_data["aum"],
                risk_profile=client_data["risk_profile"],
                status=client_data["status"],
                notes=client_data["notes"],
            )
            db.add(client)
            db.flush()
            client_map[client_data["last_name"]] = client

        print(f"Created {len(client_map)} clients")

        # 3. Create portfolios
        portfolio_count = 0
        for client_data in MOCK_CLIENTS:
            client = client_map[client_data["last_name"]]
            holdings = generate_portfolio_for_client(client_data)
            for holding in holdings:
                portfolio = ClientPortfolio(
                    client_id=client.id,
                    asset_class=holding["asset_class"],
                    ticker=holding["ticker"],
                    name=holding["name"],
                    value=holding["value"],
                    allocation_pct=holding["allocation_pct"],
                    gain_loss_pct=holding["gain_loss_pct"],
                )
                db.add(portfolio)
                portfolio_count += 1

        print(f"Created {portfolio_count} portfolio holdings")

        # 4. Create life events
        event_count = 0
        for client_data in MOCK_CLIENTS:
            client = client_map[client_data["last_name"]]
            events = get_life_events_for_client(client_data["last_name"])
            for event_data in events:
                event = LifeEvent(
                    client_id=client.id,
                    event_type=event_data["event_type"],
                    title=event_data["title"],
                    description=event_data["description"],
                    event_date=event_data["event_date"],
                    impact=event_data["impact"],
                )
                db.add(event)
                event_count += 1

        print(f"Created {event_count} life events")

        # 5. Create meetings
        meeting_count = 0
        for meeting_data in MOCK_MEETINGS:
            client = client_map.get(meeting_data["client_last_name"])
            if not client:
                continue

            now = datetime.utcnow()
            meeting_date = now + timedelta(days=-meeting_data["days_ago"])

            meeting = Meeting(
                advisor_id=advisor.id,
                client_id=client.id,
                title=meeting_data["title"],
                meeting_type=meeting_data["meeting_type"],
                status=meeting_data["status"],
                started_at=meeting_date if meeting_data["status"] == "completed" else None,
                ended_at=meeting_date + timedelta(minutes=45) if meeting_data["status"] == "completed" else None,
                summary=meeting_data["summary"],
                created_at=meeting_date,
            )
            db.add(meeting)
            db.flush()

            # Add action items for completed meetings
            for action_data in meeting_data.get("action_items", []):
                action = MeetingAction(
                    meeting_id=meeting.id,
                    description=action_data["description"],
                    assignee=action_data["assignee"],
                    priority=action_data["priority"],
                    due_date=date.today() + timedelta(days=action_data["days_due"]),
                    status="pending",
                )
                db.add(action)

            meeting_count += 1

        print(f"Created {meeting_count} meetings with action items")

        # 6. Create communication logs
        comm_count = 0
        for last_name, comms in MOCK_COMMUNICATIONS.items():
            client = client_map.get(last_name)
            if not client:
                continue
            for comm_data in comms:
                comm = CommunicationLog(
                    client_id=client.id,
                    advisor_id=advisor.id,
                    channel=comm_data["channel"],
                    direction=comm_data["direction"],
                    subject=comm_data["subject"],
                    content=comm_data["content"],
                    created_at=datetime.utcnow() - timedelta(days=comm_data["days_ago"]),
                )
                db.add(comm)
                comm_count += 1

        print(f"Created {comm_count} communication logs")

        # 7. Create alerts
        alerts_data = [
            {"type": "portfolio", "title": "Large RSU Vest Approaching", "description": "Diana Reeves has $2.4M in RSUs vesting in 28 days. Tax planning and diversification strategy needed.", "severity": "critical", "client_last_name": "Reeves"},
            {"type": "client", "title": "Client Health Event", "description": "David Kowalski's wife Susan starting treatment — review insurance coverage and liquidity needs.", "severity": "critical", "client_last_name": "Kowalski"},
            {"type": "market", "title": "Tech Sector Rally", "description": "Technology sector up 2.34% today. 8 clients have >30% tech allocation — review for rebalancing.", "severity": "warning", "client_last_name": None},
            {"type": "opportunity", "title": "Tax-Loss Harvesting Opportunity", "description": "ARKK position down 12% — potential tax-loss harvest for 3 clients.", "severity": "info", "client_last_name": None},
            {"type": "compliance", "title": "RMD Deadline Approaching", "description": "Richard Blackwell turns 70 in 50 days. Verify RMD calculations and distribution schedule.", "severity": "warning", "client_last_name": "Blackwell"},
            {"type": "client", "title": "New Baby — Estate Update Needed", "description": "Alexander Petrov had a baby last month. Estate plan and beneficiary updates required.", "severity": "warning", "client_last_name": "Petrov"},
            {"type": "opportunity", "title": "Property Sale Reinvestment", "description": "Michael Torres closing on $3.2M property sale in 21 days. Reinvestment strategy needed.", "severity": "info", "client_last_name": "Torres"},
            {"type": "portfolio", "title": "Concentrated Position Alert", "description": "Priya Sharma has 45% portfolio concentration in private tech companies. Diversification review recommended.", "severity": "warning", "client_last_name": "Sharma"},
        ]

        for alert_data in alerts_data:
            client = client_map.get(alert_data["client_last_name"]) if alert_data["client_last_name"] else None
            alert = Alert(
                advisor_id=advisor.id,
                type=alert_data["type"],
                title=alert_data["title"],
                description=alert_data["description"],
                severity=alert_data["severity"],
                client_id=client.id if client else None,
                is_read=False,
            )
            db.add(alert)

        print(f"Created {len(alerts_data)} alerts")

        # 8. Create tasks
        tasks_data = [
            {"title": "Prepare 10b5-1 plan for Diana Reeves", "description": "Draft trading plan for RSU vest diversification", "priority": "high", "status": "pending", "days_due": 5, "client_last_name": "Reeves"},
            {"title": "Model retirement scenarios for David Kowalski", "description": "Compare 3-year vs 5-year retirement timeline with ESOP distributions", "priority": "high", "status": "in_progress", "days_due": 7, "client_last_name": "Kowalski"},
            {"title": "Research donor-advised fund options", "description": "Compare Fidelity Charitable, Schwab Charitable, and Vanguard Charitable for James Worthington", "priority": "medium", "status": "pending", "days_due": 10, "client_last_name": "Worthington III"},
            {"title": "Send Medicare enrollment reminder", "description": "James Worthington III turning 65 — Medicare Part B enrollment deadline", "priority": "high", "status": "pending", "days_due": 3, "client_last_name": "Worthington III"},
            {"title": "Review 529 plan conversion options", "description": "Research new 529-to-Roth conversion rules for Margaret Chen's younger child", "priority": "medium", "status": "pending", "days_due": 7, "client_last_name": "Chen"},
            {"title": "Schedule Torres reinvestment meeting", "description": "Michael Torres property sale closing in 21 days — need reinvestment strategy", "priority": "medium", "status": "pending", "days_due": 5, "client_last_name": "Torres"},
            {"title": "Update Petrov estate plan", "description": "New baby — update will, beneficiaries, and life insurance", "priority": "medium", "status": "pending", "days_due": 14, "client_last_name": "Petrov"},
            {"title": "Beaumont estate probate follow-up", "description": "Check with probate attorney on Q2 resolution timeline", "priority": "low", "status": "pending", "days_due": 14, "client_last_name": "Beaumont"},
        ]

        for task_data in tasks_data:
            client = client_map.get(task_data["client_last_name"])
            task = AdvisorTask(
                advisor_id=advisor.id,
                title=task_data["title"],
                description=task_data["description"],
                priority=task_data["priority"],
                status=task_data["status"],
                due_date=date.today() + timedelta(days=task_data["days_due"]),
                client_id=client.id if client else None,
            )
            db.add(task)

        print(f"Created {len(tasks_data)} tasks")

        # 9. Create idea templates
        for tmpl_data in IDEA_TEMPLATES:
            template = IdeaTemplate(
                trigger_type=tmpl_data["trigger_type"],
                category=tmpl_data["category"],
                subject_template=tmpl_data["subject_template"],
                body_template=tmpl_data["body_template"],
                default_channel=tmpl_data["default_channel"],
                default_priority=tmpl_data["default_priority"],
            )
            db.add(template)
        print(f"Created {len(IDEA_TEMPLATES)} idea templates")

        # 10. Create call cycles (AUM-tier defaults)
        def get_default_cycle_days(aum):
            if aum >= 10_000_000:
                return 30
            elif aum >= 5_000_000:
                return 60
            elif aum >= 1_000_000:
                return 90
            else:
                return 180

        cycle_count = 0
        for client_data in MOCK_CLIENTS:
            client = client_map[client_data["last_name"]]
            # Find last communication for this client
            last_comm = None
            comms = MOCK_COMMUNICATIONS.get(client_data["last_name"], [])
            if comms:
                min_days = min(c["days_ago"] for c in comms)
                last_comm = datetime.utcnow() - timedelta(days=min_days)

            cycle_days = get_default_cycle_days(client_data["aum"])
            next_due = None
            status = "on_track"
            if last_comm:
                next_due = (last_comm + timedelta(days=cycle_days)).date()
                days_until_due = (next_due - date.today()).days
                if days_until_due < 0:
                    status = "overdue"
                elif days_until_due <= 7:
                    status = "due_soon"

            cycle = ClientCallCycle(
                client_id=client.id,
                call_cycle_days=cycle_days,
                last_contacted_at=last_comm,
                next_due_at=next_due,
                status=status,
            )
            db.add(cycle)
            cycle_count += 1
        print(f"Created {cycle_count} call cycles")

        # 11. Create initial client scores
        import math
        score_count = 0
        for client_data in MOCK_CLIENTS:
            client = client_map[client_data["last_name"]]
            aum = client_data["aum"]
            revenue_score = min(100, (math.log10(max(aum, 1)) - 4) * 25)
            engagement_score = 50.0  # baseline
            urgency_score = 30.0
            risk_score = 40.0
            composite = revenue_score * 0.3 + engagement_score * 0.25 + urgency_score * 0.25 + risk_score * 0.2

            score = ClientScore(
                client_id=client.id,
                engagement_score=round(engagement_score, 1),
                urgency_score=round(urgency_score, 1),
                revenue_score=round(revenue_score, 1),
                risk_score=round(risk_score, 1),
                composite_score=round(composite, 1),
                factors={"initial_seed": True},
            )
            db.add(score)
            score_count += 1
        print(f"Created {score_count} client scores")

        # 12. Create mock activity logs
        import random
        activity_count = 0
        activity_types = ["portal_login", "performance_check", "document_download", "settings_change"]
        for client_data in MOCK_CLIENTS:
            client = client_map[client_data["last_name"]]
            num_activities = random.randint(2, 8)
            for _ in range(num_activities):
                activity = ClientActivityLog(
                    client_id=client.id,
                    activity_type=random.choice(activity_types),
                    activity_metadata={"source": "mock"},
                    timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23)),
                )
                db.add(activity)
                activity_count += 1
        print(f"Created {activity_count} activity logs")

        db.commit()
        print("\nDatabase seeded successfully!")
        print(f"  Login: advisor@aiva.com / demo123")
        print(f"  Clients: {len(client_map)}")
        print(f"  Total AUM: ${sum(c['aum'] for c in MOCK_CLIENTS):,.0f}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
