from datetime import datetime, timedelta

# ---- Amount of time user has slept in one night ----
def calculate_duration_hours(bedtime, wake_time):
    if isinstance(bedtime, timedelta):
        bedtime = timedelta_to_str(bedtime)
    if isinstance(wake_time, timedelta):
        wake_time = timedelta_to_str(wake_time)

    bedtime = datetime.strptime(bedtime, "%H:%M")
    wake_time = datetime.strptime(wake_time, "%H:%M")

    if wake_time <= bedtime:
        wake_time += timedelta(days=1)

    duration = wake_time - bedtime
    return round(duration.total_seconds() / 3600, 2)

def timedelta_to_str(td):
    total_seconds = int(td.total_seconds())
    hours = (total_seconds // 3600) % 24
    minutes = (total_seconds % 3600) // 60
    return f"{hours:02}:{minutes:02}"