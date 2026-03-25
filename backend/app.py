
# Load environment variables from the .env file
# We use environment variables instead of hardcoding database credentials
# We do this for security/standard practice since we are pushing these 
# things to github(which may or may not be public)

from dotenv import load_dotenv
import os

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")