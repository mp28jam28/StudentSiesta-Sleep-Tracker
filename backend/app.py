
# Load environment variables from the .env file
# We use environment variables instead of hardcoding database credentials
# We do this for security/standard practice since we are pushing these 
# things to github(which may or may not be public)

from datetime import datetime, timedelta
from db import get_db_connection
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from flask import Flask, request, jsonify, session, render_template
from schema import Schema
from calculation import calculateChronotype
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__, template_folder="../frontend/html", static_folder="../frontend/css")
app.secret_key = os.getenv("APP_SECRET_KEY")
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True

GOOGLE_CLIENT_ID = "1036286878464-5v0om0r4rcgov918sn18q5l61dd1nka1.apps.googleusercontent.com"
CORS(app, supports_credentials= True)

# ---- Amount of time user has slept in one night ----
def calculate_duration_hours(bedtime_str, wake_time_str):
    bedtime = datetime.strptime(bedtime_str, "%H:%M")
    wake_time = datetime.strptime(wake_time_str, "%H:%M")

    if wake_time <= bedtime:
        wake_time += timedelta(days=1)

    duration = wake_time - bedtime
    return round(duration.total_seconds() / 3600, 2)

# ---- GET Chronotype ----#
@app.route("/get_chronotype")
def get_chronotype():
    user = session.get("user")
    if not user: # If no user is logged in
        return jsonify({"error": "No user is currently logged in"}), 401
    
    result = calculateChronotype(user["user_id"])
    return jsonify({"chronotype": result})
    

# ---- Home Page ----
@app.route("/")
def home():
    return render_template("homepage.html")
    # return jsonify({"message": "StudentSiesta backend is running"})

# ---- Logging Sleep ----
@app.route("/add_sleep", methods=["POST"])
def add_sleep():

    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    user_id = user["user_id"]

    data = request.get_json()

    date = data.get("date")
    bedtime = data.get("bedtime")
    wake_time = data.get("wake_time")

    if not all([date, bedtime, wake_time]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        duration_hours = calculate_duration_hours(bedtime, wake_time)

        connection = get_db_connection()
        cursor = connection.cursor()
        query = """
          INSERT INTO Sleep_Log (user_id, sleep_time, wake_time, duration_hours, log_time)
          VALUES (%s, %s, %s, %s, NOW())
          """


        sleep_dt = datetime.strptime(f"{date} {bedtime}", "%Y-%m-%d %H:%M")
        wake_dt = datetime.strptime(f"{date} {wake_time}", "%Y-%m-%d %H:%M")

        if wake_dt <= sleep_dt:
         wake_dt += timedelta(days=1)

        values = (user_id, sleep_dt, wake_dt, duration_hours)

        print("LOGGED IN USER ID:", user_id)
        print("VALUES BEING INSERTED:", values)

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
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    user_id = user["user_id"]
    user_email = user["email"]

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT sleep_time, wake_time, duration_hours
            FROM Sleep_Log
            WHERE user_id = %s
            ORDER BY sleep_time ASC
        """, (user_id,))

        rows = cursor.fetchall()

        cleaned_rows = []
        for row in rows:
            cleaned_rows.append({
                "date": row["sleep_time"].strftime("%Y-%m-%d"),
                "bedtime": row["sleep_time"].strftime("%H:%M"),
                "wake_time": row["wake_time"].strftime("%H:%M"),
                "duration_hours": float(row["duration_hours"])
            })

        cursor.close()
        connection.close()

        return jsonify(cleaned_rows), 200

    except Exception as e:
        print("ERROR IN /sleep_data:", e)
        return jsonify({"error": str(e)}), 500


# ---- Google Login ---- #
@app.route("/google-login", methods=["POST"])
def google_login():
    data = request.get_json()
    credential = data.get("credential")

    if not credential:
        return jsonify({"error": "Missing credential"}), 400

    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            grequests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo.get("email")
        name = idinfo.get("name")
        sub = idinfo.get("sub")

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # check if user already exists
        cursor.execute("SELECT user_id, username, email FROM User WHERE email = %s", (email,))
        user_row = cursor.fetchone()

        # if user does not exist, create them
        if not user_row:
            cursor.execute(
                """
                INSERT INTO User (username, email, password)
                VALUES (%s, %s, %s)
                """,
                (name, email, "GOOGLE_AUTH")
            )
            connection.commit()

            user_id = cursor.lastrowid
            username = name
        else:
            user_id = user_row["user_id"]
            username = user_row["username"]

        cursor.close()
        connection.close()

        session["user"] = {
            "user_id": user_id,
            "email": email,
            "name": username,
            "google_id": sub
        }

        return jsonify({
            "message": "Login successful",
            "user_id": user_id,
            "email": email,
            "name": username
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 401
    
# ---- TEMPORARY HARD-CODED CREDENTIALS: Test login as Natalie (remove when registration is done) ----
@app.route("/dev-login", methods=["GET"])
def dev_login():
    session["user"] = {
        "user_id": 1,
        "username": "natalie",
        "email": "mp28jam@gmail.com",
        "name": "natalie"
    }
    return jsonify({"message": "Logged in as natalie (dev mode)"}), 200

@app.route("/me", methods=["GET"])
def me():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify(user), 200

@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"message": "Logged out"}), 200

if __name__ == "__main__":
    Schema().run()
    print("New tables User, Sleep_Log, Calendar_Event have been created in the database")
    app.run(debug=True, port=5000)
    print("The backend is now running")