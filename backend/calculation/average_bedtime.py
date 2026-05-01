import math
from datetime import datetime, time, timedelta


def calculate_average_bedtime(rows):
    if not rows:
        return None

    sum_sin = 0.0
    sum_cos = 0.0
    count = 0

    for row in rows:
        bed_time = row[0]
        if bed_time is None:
            continue

        if isinstance(bed_time, timedelta):
            seconds = bed_time.total_seconds()

        elif isinstance(bed_time, str):
            try:
                bed_time = datetime.fromisoformat(bed_time)
                seconds = bed_time.hour * 3600 + bed_time.minute * 60 + bed_time.second
            except ValueError:
                continue

        elif isinstance(bed_time, datetime):
            seconds = bed_time.hour * 3600 + bed_time.minute * 60 + bed_time.second

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
    display_hour = avg_hour % 12
    if display_hour == 0:
        display_hour = 12

    return f"{display_hour}:{str(avg_minute).zfill(2)} {period}"