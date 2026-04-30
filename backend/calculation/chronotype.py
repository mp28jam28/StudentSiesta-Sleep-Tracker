
from db import get_db_connection
from calculation.duration import calculate_duration_hours
import math

def calculate_chronotype(user_id):
    connection = get_db_connection()
    cur = connection.cursor()

    cur.execute(
        """SELECT sleep_time, wake_time FROM Sleep_Log WHERE user_id = %s""", (user_id,)
    )
    rows = cur.fetchall()
    connection.close()

    if not rows:
        return None

    def to_hhmm(t):
        total_seconds = int(t.total_seconds())
        hours = (total_seconds // 3600) % 24
        minutes = (total_seconds % 3600) // 60
        return f"{hours:02}:{minutes:02}"

    midpoints = []
    sin_sum = 0
    cos_sum = 0

    for (sleep_time, wake_time) in rows:
        sleep_str = to_hhmm(sleep_time)
        wake_str = to_hhmm(wake_time)

        sleep_min = int(sleep_str[:2]) * 60 + int(sleep_str[3:])

        # Normalize past-midnight sleep times (e.g. 01:00 AM = 60 -> 1500)
        if sleep_min < 720:
            sleep_min += 1440

        duration_hours = calculate_duration_hours(sleep_str, wake_str)
        duration_min = duration_hours * 60
        midpoint_min = (sleep_min + duration_min / 2) % 1440
        midpoints.append(midpoint_min)

        angle = 2 * math.pi * midpoint_min / 1440
        sin_sum += math.sin(angle)
        cos_sum += math.cos(angle)

    # Circular mean of midpoints
    avg_angle = math.atan2(sin_sum / len(rows), cos_sum / len(rows))
    if avg_angle < 0:
        avg_angle += 2 * math.pi
    avg_midpoint = avg_angle * 1440 / (2 * math.pi)

    # Standard deviation of midpoints (detect irregular sleepers → Dolphin)
    variance = sum((m - avg_midpoint) ** 2 for m in midpoints) / len(midpoints)
    std_dev = math.sqrt(variance)

    # High variability (>90 min std dev) = Dolphin regardless of midpoint
    if std_dev > 90:
        return "Dolphin 🐬"

    # Lion: midpoint before 01:30 AM (0-90 min) — sleeps early, wakes very early
    if avg_midpoint <= 90:
        return "Lion 🦁"
    # Bear: midpoint 01:30–03:30 AM (90-210 min) — follows the sun
    elif avg_midpoint <= 210:
        return "Bear 🐻"
    # Wolf: midpoint after 03:30 AM (210+ min) — sleeps and wakes late
    else:
        return "Wolf 🐺"
