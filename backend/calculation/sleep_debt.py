def calculate_sleep_debt(rows, sleep_goal_hours):
    if not rows:
        return 0

    goal = sleep_goal_hours[0]
    total_debt = 0.0

    for row in rows:
        duration = row[0]
        if duration is None:
            continue

        debt = goal - duration
        total_debt += debt

    return round(total_debt, 2)