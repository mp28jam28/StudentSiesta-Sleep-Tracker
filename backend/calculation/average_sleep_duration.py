from calculation.duration import calculate_duration_hours

from datetime import datetime, time

from db import get_db_connection

def average_sleep_duration(user_id):
    connection = get_db_connection()
    cur = connection.cursor()

    cur.execute(
        """SELECT bed_time, sleep_time FROM Sleep_Log WHERE user_id = %s""", (user_id,)
    )
    rows = cur.fetchall()
    connection.close()

    if not rows:
        return None

    total_seconds = 0.0
    count = 0

    
    