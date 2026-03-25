
# Load environment variables from the .env file
# We use environment variables instead of hardcoding database credentials
# We do this for security/standard practice since we are pushing these 
# things to github(which may or may not be public)

from flask import Flask, request, jsonify
from datetime import datetime, timedelta
from db import get_db_connection
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def calculate_duration_hours(bedtime_str, wake_time_str):
    bedtime = datetime.strptime(bedtime_str, "%H:%M")
    wake_time = datetime.strptime(wake_time_str, "%H:%M")

    # Handle overnight sleep, e.g. 23:30 to 07:15
    if wake_time <= bedtime:
        wake_time += timedelta(days=1)

    duration = wake_time - bedtime
    return round(duration.total_seconds() / 3600, 2)

@app.route("/")
def home():
    return jsonify({"message": "StudentSiesta backend is running"})

@app.route("/add_sleep", methods=["POST"])
def add_sleep():
    data = request.get_json()

    date = data.get("date")
    bedtime = data.get("bedtime")
    wake_time = data.get("wake_time")
    quality_rating = data.get("quality_rating")

    if not all([date, bedtime, wake_time, quality_rating]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        duration_hours = calculate_duration_hours(bedtime, wake_time)

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
        INSERT INTO sleep_data (date, bedtime, wake_time, duration_hours, quality_rating)
        VALUES (%s, %s, %s, %s, %s)
        """
        values = (date, bedtime, wake_time, duration_hours, quality_rating)

        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Sleep data saved successfully",
            "duration_hours": duration_hours
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/sleep_data", methods=["GET"])
def get_sleep_data():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT date, bedtime, wake_time, duration_hours, quality_rating
            FROM sleep_data
            ORDER BY date ASC
        """)
        rows = cursor.fetchall()

        cleaned_rows = []
        for row in rows:
            cleaned_rows.append({
                "date": str(row["date"]),
                "bedtime": str(row["bedtime"]),
                "wake_time": str(row["wake_time"]),
                "duration_hours": float(row["duration_hours"]),
                "quality_rating": int(row["quality_rating"])
            })

        cursor.close()
        connection.close()

        return jsonify(cleaned_rows), 200

    except Exception as e:
        print("ERROR IN /sleep_data:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)