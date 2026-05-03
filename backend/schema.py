from dotenv import load_dotenv
from db import get_db_connection
load_dotenv()

# Manages connection and table creation
class Schema:
    def __init__(self): 
        self.connection = get_db_connection()
        self.cur = self.connection.cursor()

    def create_user_table(self):
        self.cur.execute("""
            CREATE TABLE IF NOT EXISTS User(
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                password VARCHAR(255) NOT NULL,
                sleep_goal FLOAT,
                chronotype VARCHAR(50) 
            )
        """)

    def create_sleep_log_table(self):
        self.cur.execute("""
            CREATE TABLE IF NOT EXISTS Sleep_Log(
                log_id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
                user_id INT NOT NULL,
                log_date DATE,
                sleep_time TIME,
                wake_time TIME,
                duration_hours FLOAT,
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            )
        """)

    def create_calendar_table(self):
        self.cur.execute("""
            CREATE TABLE IF NOT EXISTS Calendar_Event(
                event_id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
                user_id INT NOT NULL,
                class_name VARCHAR(255),
                days VARCHAR(255),
                start_time TIME,
                exam_date DATE,
                event_type VARCHAR(255),    
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            )
        """)
    
    # If you need to add another column to a table
    def add_new_column(self, table, column, datatype): 
        self.cur.execute(
            f"""ALTER TABLE {table} ADD COLUMN {column} {datatype}"""
        )
    
    # If you need to delete a column in a table
    def delete_column(self, table, column):
        self.cur.execute(
            f"""ALTER TABLE {table} DROP COLUMN {column}"""
        )

    def delete_all_tables(self):
        self.cur.execute("""DROP TABLE IF EXISTS Sleep_Log;""")
        self.cur.execute("""DROP TABLE IF EXISTS Calendar_Event;""")
        self.cur.execute("""DROP TABLE IF EXISTS User;""")
        self.connection.commit()


    def run(self):
        self.create_user_table()
        self.create_sleep_log_table()
        self.create_calendar_table()
        # self.delete_column("User", "email")
        # self.add_new_column("User", "email", "VARCHAR(255)")

        # self.delete_all_tables()
        self.connection.commit()
        self.connection.close()

# if __name__ == "__main__":
#     schema = Schema()