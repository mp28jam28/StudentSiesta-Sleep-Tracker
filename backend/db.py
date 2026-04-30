from dotenv import load_dotenv
import os
import mysql.connector

# # Load environment variables from the .env file
# We use environment variables instead of hardcoding database credentials
# We do this for security/standard practice since we are pushing these things to github(which may or may not be public
load_dotenv()

# Load database credentials from the .env file
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# Function that creates a database connection
def get_db_connection():
    connection = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        ssl_disabled=True,
        use_pure=True
    )
    return connection