"""Mock life events for clients — upcoming and recent events for dashboard."""

from __future__ import annotations

from datetime import date, timedelta
import random

# Map client last names to their life events
MOCK_LIFE_EVENTS = {
    "Chen": [
        {"event_type": "graduation", "title": "Daughter's College Graduation", "description": "Jessica graduating from Stanford with CS degree", "days_offset": 45, "impact": "medium"},
        {"event_type": "property_purchase", "title": "Considering Vacation Home", "description": "Looking at properties in Lake Tahoe area", "days_offset": 90, "impact": "high"},
    ],
    "Fitzgerald": [
        {"event_type": "retirement", "title": "Planned Retirement", "description": "Retiring from law firm after 35 years", "days_offset": 730, "impact": "high"},
        {"event_type": "anniversary", "title": "40th Wedding Anniversary", "description": "Planning trip to Italy with wife", "days_offset": 60, "impact": "low"},
    ],
    "Okafor": [
        {"event_type": "marriage", "title": "Recently Married", "description": "Married to Dr. James Okafor in December", "days_offset": -30, "impact": "high"},
        {"event_type": "property_purchase", "title": "Second Home Purchase", "description": "Looking at condos in Aspen for ski season", "days_offset": 120, "impact": "high"},
    ],
    "Worthington III": [
        {"event_type": "birthday", "title": "65th Birthday", "description": "Medicare eligibility milestone", "days_offset": 14, "impact": "medium"},
        {"event_type": "inheritance", "title": "Trust Distribution Review", "description": "Annual family trust distribution review", "days_offset": 30, "impact": "high"},
    ],
    "Reeves": [
        {"event_type": "new_job", "title": "Stock Options Vesting", "description": "$2.4M in RSUs vesting next quarter", "days_offset": 28, "impact": "high"},
    ],
    "Torres": [
        {"event_type": "property_purchase", "title": "Commercial Property Sale", "description": "Closing on Miami warehouse sale — $3.2M proceeds", "days_offset": 21, "impact": "high"},
    ],
    "Sharma": [
        {"event_type": "birthday", "title": "50th Birthday", "description": "Milestone birthday celebration", "days_offset": 35, "impact": "low"},
        {"event_type": "new_job", "title": "Series C Fundraise", "description": "Company raising $50M Series C — dilution implications", "days_offset": 60, "impact": "high"},
    ],
    "Harper": [
        {"event_type": "retirement", "title": "Semi-Retirement Transition", "description": "Handing day-to-day ranch operations to eldest son", "days_offset": 180, "impact": "high"},
        {"event_type": "health", "title": "Knee Surgery Scheduled", "description": "Elective surgery, 6-week recovery", "days_offset": 18, "impact": "low"},
    ],
    "Nakamura": [
        {"event_type": "new_job", "title": "Sabbatical Year Starting", "description": "Year-long sabbatical in Tokyo starting June", "days_offset": 85, "impact": "medium"},
    ],
    "Kowalski": [
        {"event_type": "health", "title": "Wife's Treatment Plan", "description": "Susan starting treatment program, reviewing health insurance coverage", "days_offset": 7, "impact": "high"},
    ],
    "Beaumont": [
        {"event_type": "inheritance", "title": "Estate Settlement Ongoing", "description": "Husband's estate still in probate — expected resolution Q2", "days_offset": 45, "impact": "high"},
        {"event_type": "birthday", "title": "Son's 30th Birthday", "description": "Trust distribution trigger at age 30", "days_offset": 22, "impact": "medium"},
    ],
    "Russo": [
        {"event_type": "property_purchase", "title": "New Development Closing", "description": "Hudson Yards mixed-use project closing — $12M equity call", "days_offset": 14, "impact": "high"},
    ],
    "Johansson": [
        {"event_type": "baby", "title": "First Child Expected", "description": "Baby due in April — needs 529 plan setup", "days_offset": 40, "impact": "high"},
    ],
    "Washington": [
        {"event_type": "graduation", "title": "Eldest Starting College", "description": "Marcus Jr. starting at Howard University in fall", "days_offset": 170, "impact": "medium"},
    ],
    "Fontaine": [
        {"event_type": "inheritance", "title": "French Property Inheritance", "description": "Family chateau in Provence — cross-border tax implications", "days_offset": -15, "impact": "high"},
    ],
    "Blackwell": [
        {"event_type": "birthday", "title": "70th Birthday", "description": "RMD considerations starting", "days_offset": 50, "impact": "high"},
    ],
    "Rahman": [
        {"event_type": "new_job", "title": "IPO Timeline Update", "description": "NexGen AI targeting Q3 IPO — lockup period planning", "days_offset": 120, "impact": "high"},
    ],
    "O'Brien": [
        {"event_type": "retirement", "title": "Retirement Planning Review", "description": "5-year countdown — pension optimization meeting needed", "days_offset": 30, "impact": "high"},
    ],
    "Tanaka": [
        {"event_type": "health", "title": "Mother's Care Transition", "description": "Moving mother to assisted living in Kyoto — financial planning needed", "days_offset": 25, "impact": "medium"},
    ],
    "Petrov": [
        {"event_type": "baby", "title": "New Baby", "description": "First child born last month — estate planning update needed", "days_offset": -20, "impact": "high"},
        {"event_type": "new_job", "title": "Company Pre-IPO", "description": "Petrov Technologies exploring IPO in 18 months", "days_offset": 540, "impact": "high"},
    ],
}


def get_life_events_for_client(last_name: str, base_date: date = None) -> list[dict]:
    """Get life events for a client, with dates relative to base_date."""
    if base_date is None:
        base_date = date.today()

    events = MOCK_LIFE_EVENTS.get(last_name, [])
    result = []
    for event in events:
        event_date = base_date + timedelta(days=event["days_offset"])
        result.append({
            "event_type": event["event_type"],
            "title": event["title"],
            "description": event["description"],
            "event_date": event_date,
            "impact": event["impact"],
        })
    return result
