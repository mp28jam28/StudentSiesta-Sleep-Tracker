import math
from datetime import datetime, time, timedelta


def calculate_average_waketime(rows):
    if not rows:
        return None

    sum_sin = 0.0
    sum_cos = 0.0
    count = 0

    for row in rows:
        wake_time = row[0]
        if wake_time is None:
            continue

        if isinstance(wake_time, timedelta):
            seconds = wake_time.total_seconds()

        elif isinstance(wake_time, str):
            try:
                wake_time = datetime.fromisoformat(wake_time)
                seconds = wake_time.hour * 3600 + wake_time.minute * 60 + wake_time.second
            except ValueError:
                continue

        elif isinstance(wake_time, datetime):
            seconds = wake_time.hour * 3600 + wake_time.minute * 60 + wake_time.second

        else:
            continue

        angle = (seconds / (24 * 3600)) * 2 * math.pi

        sum_sin += math.sin(angle)
        sum_cos += math.cos(angle)
        count += 1

    if count == 0:
        return None

    avg_angle = math.atan2(sum_sin / count, sum_cos / count)

    if avg_angle < 0:
        avg_angle += 2 * math.pi

    avg_seconds = (avg_angle / (2 * math.pi)) * (24 * 3600)

    avg_hour = int(avg_seconds // 3600)
    avg_seconds -= avg_hour * 3600
    avg_minute = int(avg_seconds // 60)

    period = "AM" if avg_hour < 12 else "PM"
    display_hour = avg_hour % 12 or 12

    return f"{display_hour}:{str(avg_minute).zfill(2)} {period}"