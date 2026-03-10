"""Mock meeting data for demo."""

MOCK_MEETINGS = [
    {
        "client_last_name": "Chen",
        "title": "Q1 Portfolio Review",
        "meeting_type": "review",
        "status": "completed",
        "days_ago": 3,
        "summary": "Reviewed Margaret's portfolio performance. Up 12.3% YTD driven by tech holdings. Discussed increasing allocation to AI/ML sector. She mentioned Jessica's upcoming graduation and potential gift of stock. Agreed to research 529 plan conversion options for younger child.",
        "action_items": [
            {"description": "Research 529-to-Roth conversion rules for Margaret's younger child", "assignee": "Advisor", "priority": "medium", "days_due": 7},
            {"description": "Prepare AI/ML sector analysis for next meeting", "assignee": "Advisor", "priority": "high", "days_due": 5},
            {"description": "Send updated beneficiary forms for trust accounts", "assignee": "Advisor", "priority": "low", "days_due": 14},
        ],
    },
    {
        "client_last_name": "Worthington III",
        "title": "Trust Distribution Planning",
        "meeting_type": "planning",
        "status": "completed",
        "days_ago": 5,
        "summary": "Met with James to review annual trust distribution strategy. Discussed impact of upcoming 65th birthday on Medicare enrollment. Reviewed charitable giving strategy for museum donations. James expressed interest in establishing a donor-advised fund for more tax-efficient giving.",
        "action_items": [
            {"description": "Prepare donor-advised fund comparison for James", "assignee": "Advisor", "priority": "high", "days_due": 10},
            {"description": "Schedule call with estate attorney about trust modifications", "assignee": "Advisor", "priority": "medium", "days_due": 7},
            {"description": "Send Medicare Part B enrollment reminder", "assignee": "Advisor", "priority": "high", "days_due": 3},
        ],
    },
    {
        "client_last_name": "Reeves",
        "title": "Stock Options Vesting Strategy",
        "meeting_type": "planning",
        "status": "completed",
        "days_ago": 7,
        "summary": "Diana's $2.4M RSU vest coming in 28 days. Discussed tax implications and diversification strategy. Recommended selling 60% at vest and spreading remaining sales over Q2-Q3. Reviewed 10b5-1 plan setup. Diana wants to maximize charitable deductions this year.",
        "action_items": [
            {"description": "Draft 10b5-1 plan for Diana's review", "assignee": "Advisor", "priority": "high", "days_due": 5},
            {"description": "Model tax scenarios for RSU vest (sell all vs. staged)", "assignee": "Advisor", "priority": "high", "days_due": 3},
            {"description": "Connect Diana with tax attorney for charitable remainder trust", "assignee": "Advisor", "priority": "medium", "days_due": 14},
        ],
    },
    {
        "client_last_name": "Kowalski",
        "title": "ESOP & Family Health Planning",
        "meeting_type": "check_in",
        "status": "completed",
        "days_ago": 2,
        "summary": "David is under significant stress with Susan's diagnosis. Reviewed health insurance coverage and discussed potential need for increased liquidity. ESOP valuation is up 15% — good news for succession timeline. David wants to accelerate retirement timeline by 2 years.",
        "action_items": [
            {"description": "Review supplemental health insurance options for David and Susan", "assignee": "Advisor", "priority": "high", "days_due": 3},
            {"description": "Model early retirement scenarios (3 years vs 5 years)", "assignee": "Advisor", "priority": "high", "days_due": 7},
            {"description": "Get updated ESOP valuation from company administrator", "assignee": "David", "priority": "medium", "days_due": 14},
        ],
    },
    {
        "client_last_name": "Torres",
        "title": "Property Sale Reinvestment",
        "meeting_type": "planning",
        "status": "scheduled",
        "days_ago": -2,
        "summary": None,
        "action_items": [],
    },
    {
        "client_last_name": "Beaumont",
        "title": "Estate Restructuring Review",
        "meeting_type": "review",
        "status": "scheduled",
        "days_ago": -5,
        "summary": None,
        "action_items": [],
    },
]
