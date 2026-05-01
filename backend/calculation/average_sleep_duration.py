from calculation.duration import calculate_duration_hours

from datetime import datetime, time, timedelta

def calculate_average_sleep_duration(rows):
    if not rows:
        return None

    total_hours = 0
    count = 0

    for row in rows:
        bed_time, wake_time = row

        if not bed_time or not wake_time:
            continue

        if not isinstance(bed_time, timedelta) or not isinstance(wake_time, timedelta):
            continue

        duration = calculate_duration_hours(bed_time, wake_time)

        total_hours += duration
        count += 1

    if count == 0:
        return None

    avg = total_hours / count

    return f"{round(avg, 1)} hrs"