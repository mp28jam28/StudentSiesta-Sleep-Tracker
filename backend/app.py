
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
from calculation.chronotype import calculate_chronotype
from calculation.duration import calculate_duration_hours

from werkzeug.security import generate_password_hash
from dotenv import load_dotenv
import os
from werkzeug.security import generate_password_hash, check_password_hash
load_dotenv()
BASE = os.path.dirname(__file__)

app = Flask(
    __name__,
    template_folder="../frontend/html",
    static_folder="../frontend",
    static_url_path=""
)
app.secret_key = os.getenv("APP_SECRET_KEY")
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True

GOOGLE_CLIENT_ID = "1036286878464-5v0om0r4rcgov918sn18q5l61dd1nka1.apps.googleusercontent.com"
CORS(app, supports_credentials= True)


# ---- GET Chronotype ----#
@app.route("/get_chronotype")
def get_chronotype():
    user = session.get("user")
    if not user: # If no user is logged in
        return jsonify({"error": "No user is currently logged in"}), 401
    
    result = calculate_chronotype(user["user_id"])
    return jsonify({"chronotype": result})
    
# ---- Home Page ----
@app.route("/")
def home():
    return render_template("homepage.html")
    # return jsonify({"message": "StudentSiesta backend is running"})
    
@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"message": "Logged out"}), 200
@app.route("/homepage.html")
def homepage():
    return render_template("homepage.html")

@app.route("/login.html")
def login():
    return render_template("login.html")

@app.route("/registration.html")
def registration():
    return render_template("registration.html")

@app.route("/log_sleep.html")
def log_sleep():
    return render_template("log_sleep.html")

@app.route("/schedule.html")
def schedule():
    return render_template("schedule.html")

@app.route("/insights.html")
def insights():
    return render_template("insights.html")

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
          INSERT INTO Sleep_Log (user_id, sleep_time, wake_time, duration_hours, log_date)
          VALUES (%s, %s, %s, %s, %s)
          """

        sleep_dt = datetime.strptime(f"{date} {bedtime}", "%Y-%m-%d %H:%M")
        wake_dt = datetime.strptime(f"{date} {wake_time}", "%Y-%m-%d %H:%M")

        if wake_dt <= sleep_dt:
            wake_dt += timedelta(days=1)


        values = (user_id, bedtime, wake_time, duration_hours, date)

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
        print("ERROR IN /add_sleep:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/sleep_data", methods=["GET"])
def get_sleep_data():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    user_id = user["user_id"]

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT log_date, log_date, sleep_time, wake_time, duration_hours
            FROM Sleep_Log
            WHERE user_id = %s
            ORDER BY log_date ASC
        """, (user_id,))

        rows = cursor.fetchall()

        def timedelta_to_hhmm(td):
            total_seconds = int(td.total_seconds())
            hours = (total_seconds // 3600) % 24
            minutes = (total_seconds % 3600) // 60
            return f"{hours:02}:{minutes:02}"

        cleaned_rows = []
        for row in rows:
            cleaned_rows.append({
                "date": str(row["log_date"]),
                "bedtime": timedelta_to_hhmm(row["sleep_time"]),
                "wake_time": timedelta_to_hhmm(row["wake_time"]),
                "date": row["log_date"].strftime("%Y-%m-%d"),
                "bedtime": str(row["sleep_time"]),
                "wake_time": str(row["wake_time"]),
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
    
    # ---- Traditional Registration ---- #
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    username = (data.get("username") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if "@" not in email or "." not in email:
        return jsonify({"error": "Please enter a valid email"}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT username, email FROM User WHERE username = %s OR email = %s",
            (username, email)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.close()
            connection.close()
            if existing["username"] == username:
                return jsonify({"error": "Username already taken"}), 409
            return jsonify({"error": "An account with this email already exists"}), 409

        hashed = generate_password_hash(password)

        cursor.execute(
            """
            INSERT INTO User (username, email, password)
            VALUES (%s, %s, %s)
            """,
            (username, email, hashed)
        )
        connection.commit()

        user_id = cursor.lastrowid
        cursor.close()
        connection.close()

        session["user"] = {
            "user_id": user_id,
            "username": username,
            "email": email,
            "name": username
        }

        return jsonify({
            "message": "Account created successfully",
            "user_id": user_id,
            "username": username,
            "email": email
        }), 201

    except Exception as e:
        print("ERROR IN /register:", e)
        return jsonify({"error": str(e)}), 500
    

@app.route("/login", methods=["POST"])
def login_user():
    data = request.get_json() or {}

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT user_id, username, email, password FROM User WHERE username = %s",
            (username,)
        )
        user_row = cursor.fetchone()

        cursor.close()
        connection.close()

        if not user_row:
            return jsonify({"error": "Invalid username or password"}), 401

        if not check_password_hash(user_row["password"], password):
            return jsonify({"error": "Invalid username or password"}), 401

        session["user"] = {
            "user_id": user_row["user_id"],
            "username": user_row["username"],
            "email": user_row["email"],
            "name": user_row["username"]
        }

        return jsonify({
            "message": "Login successful",
            "user_id": user_row["user_id"],
            "username": user_row["username"],
            "email": user_row["email"]
        }), 200

    except Exception as e:
        print("ERROR IN /login:", e)
        return jsonify({"error": str(e)}), 500

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

# ---- Calendar Events (Classes and Exams) ---- #
@app.route("/add_class", methods=["POST"])
def add_class():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    user_id = user["user_id"]

    data = request.get_json()

    class_name = data.get("className")
    days = data.get("days")
    start_time = data.get("time")

    if not all([class_name, days, start_time]):
        return jsonify({"error": "Missing fields"}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
        INSERT INTO Calendar_Event (user_id, class_name, days, start_time, exam_date, event_type)
        VALUES (%s, %s, %s, %s, %s, %s)
        """

        values = (
            user_id,
            class_name,
            days,
            start_time,
            None,
            "class"
        )

        print("LOGGED IN USER ID:", user_id)
        print("VALUES BEING INSERTED:", values)

        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Class saved successfully"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/add_exam", methods=["POST"])
def add_exam():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    user_id = user["user_id"]

    data = request.get_json()

    exam_name = data.get("examName")
    exam_date = data.get("examDate")
    exam_type = data.get("examType")

    if not all([exam_name, exam_date, exam_type]):
        return jsonify({"error": "Missing fields"}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
        INSERT INTO Calendar_Event (user_id, class_name, days, start_time, exam_date, event_type)
        VALUES (%s, %s, %s, %s, %s, %s)
        """

        values = (
            user_id,
            exam_name,
            None,
            None,
            exam_date,
            "exam"
        )

        print("LOGGED IN USER ID:", user_id)
        print("VALUES BEING INSERTED:", values)

        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Exam saved successfully"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/get_events", methods=["GET"])
def get_events():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    user_id = user["user_id"]

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
        SELECT 
            event_id,
            user_id,
            class_name,
            days,
            start_time,
            exam_date,
            event_type
        FROM Calendar_Event
        WHERE user_id = %s
        """

        cursor.execute(query, (user_id,))
        events = cursor.fetchall()

        cleaned_events = []
        for event in events:
            cleaned_events.append({
                "event_id": str(event["event_id"]),
                "user_id": str(event["user_id"]),
                "class_name": str(event["class_name"]),
                "days": str(event["days"]) if event["days"] else None,
                "start_time": str(event["start_time"]) if event["start_time"] else None,
                "exam_date": str(event["exam_date"]) if event["exam_date"] else None,
                "event_type": str(event["event_type"])
            })

        cursor.close()
        connection.close()

        return jsonify(cleaned_events), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/delete_class/<int:class_id>", methods=["DELETE"])
def delete_class(class_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("DELETE FROM Calendar_Event WHERE event_id = %s", (class_id,))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({"message": "Class deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/delete_exam/<int:exam_id>", methods=["DELETE"])
def delete_exam(exam_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("DELETE FROM Calendar_Event WHERE event_id = %s", (exam_id,))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({"message": "Exam deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Schema().run()
    print("New tables User, Sleep_Log, Calendar_Event have been created in the database")
    app.run(debug=True, port=5000)
    print("The backend is now running")
    