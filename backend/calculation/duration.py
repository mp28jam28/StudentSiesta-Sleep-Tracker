from datetime import datetime, timedelta

# ---- Amount of time user has slept in one night ----
def calculate_duration_hours(bedtime_str, wake_time_str):
    bedtime = datetime.strptime(bedtime_str, "%H:%M")
    wake_time = datetime.strptime(wake_time_str, "%H:%M")

    if wake_time <= bedtime:
        wake_time += timedelta(days=1)

    duration = wake_time - bedtime
    return round(duration.total_seconds() / 3600, 2)