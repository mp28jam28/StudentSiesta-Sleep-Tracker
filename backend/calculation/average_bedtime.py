from datetime import datetime, time

from db import get_db_connection


def calculate_average_waketime(user_id):
    connection = get_db_connection()
    cur = connection.cursor()

    cur.execute(
        """SELECT bed_time FROM Sleep_Log WHERE user_id = %s""", (user_id,)
    )
    rows = cur.fetchall()
    connection.close()

    if not rows:
        return None

    total_seconds = 0.0
    count = 0

    for row in rows:
        bed_time = row[0]
        if bed_time is None:
            continue

        if isinstance(bed_time, str):
            try:
                bed_time = datetime.fromisoformat(bed_time)
            except ValueError:
                continue

        if isinstance(bed_time, datetime):
            bed_time = bed_time.time()

        if not isinstance(bed_time, time):
            continue

        total_seconds += (
            bed_time.hour * 3600
            + bed_time.minute * 60
            + bed_time.second
            + bed_time.microsecond / 1_000_000
        )
        count += 1

    if count == 0:
        return None

    average_seconds = (total_seconds / count) % (24 * 3600)
    average_hour = int(average_seconds // 3600)
    average_seconds -= average_hour * 3600
    average_minute = int(average_seconds // 60)
    average_seconds -= average_minute * 60
    average_second = int(round(average_seconds))

    if average_second == 60:
        average_second = 0
        average_minute += 1
    if average_minute == 60:
        average_minute = 0
        average_hour = (average_hour + 1) % 24

    return time(average_hour, average_minute, average_second)
    

