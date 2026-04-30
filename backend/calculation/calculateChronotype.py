                                                                                                                                
from db import get_db_connection
from datetime import datetime, timedelta

def calculate_chronotype(user_id):
    connection = get_db_connection()
    cur = connection.cursor()

    cur.execute(
        """SELECT sleep_time FROM Sleep_Log WHERE user_id = %s""", (user_id,)
    )
    rows = cur.fetchall()
    connection.close()

    if not rows:
        return None

    # Average sleep time in minutes from midnight
    total_minutes = 0
    for (sleep_time,) in rows:
        # sleep_time is a timedelta when returned from MySQL TIME column
        seconds = sleep_time.seconds if hasattr(sleep_time, 'seconds') else int(sleep_time.total_seconds())
        minutes = seconds // 60
        # Treat times before noon (< 720 min) as past midnight (e.g. 1:00 AM = 60 min -> 1500 min)
        if minutes < 720:
            minutes += 1440
        total_minutes += minutes

    avg_minutes = total_minutes / len(rows)
    avg_minutes = avg_minutes % 1440  # normalize back to 0-1439

    # Chronotype thresholds based on average sleep time
    if avg_minutes < 360:       # before 6:00 AM (past midnight sleepers)
        return "Night Owl"
    elif avg_minutes < 1320:    # before 10:00 PM
        return "Early Bird"
    else:                       # 10:00 PM - midnight
        return "Intermediate"
