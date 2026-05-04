# __StudentSiesta__: a Smart Sleep Tracker for Students 😴

## Overview
Over 70% of college students are sleep-deprived, getting less than eight hours of sleep each night. Studies, including those at California universities, show about 60% to 80% experience daytime sleepiness or poor sleep quality during the week.

Modern sleep trackers are designed for general use, but how does it truly resolve this health crisis for students? 

With this project, we propose an intelligent sleep tracker that monitors sleep activity, considering these factors:
1. **Schedule integration** -- 
once users input their class schedule in the application, 
the app flags nights before early classes or exams as high-stakes events
2. **Exam stress tagging** --
users can log when they have a midterm or final coming up
app and access how their sleep degrades in the week before exams
3. **Sleep debt tracking** — 
students tend to undersleep during the week and crash on weekends
students may oversleep on weekends
4. **Semester-long view** — 
sleep trends mapped against the academic calendar 
midterms week, finals week, spring break recovery, work schedule 

                                                                                                                           
  ## How to Run Locally                                                                                                                                      
                                                                                                                                                             
  ### Prerequisites                                                                                                                                          
  - Python 3.10+                                                                                                                                             
  - A MySQL database (local or Cloud SQL)                                                                                                                  
  - A Google Cloud project with an OAuth 2.0 client ID (for Google sign-in)
                                                                                                                                                                                                                                                                                     
## How to Run Locally                                                                                                                                      
                                                                                                                                                             
  ### Prerequisites                                                                                                                                          
  - Python 3.10+                                                                                                                                             
  - A MySQL database (local or Cloud SQL)                                                                                                                    
  - A Google Cloud project with an OAuth 2.0 client ID (for Google sign-in)                                                                                  
                                                                                                                                                             
  ### 1. Install dependencies
  ```                                                                                                                                                        
  pip install -r requirements.txt                                                                                                                          
  ```

  ### 2. Configure environment variables
  Create a `.env` file inside the `backend/` directory:
  ```
  DB_HOST=<your_database_host>
  DB_USER=<your_database_user>
  DB_PASSWORD=<your_database_password>                                                                                                                       
  DB_NAME=studentsiesta
  APP_SECRET_KEY=<your_secret_key>                                                                                                                           
  ```                                                                                                                                                      

  ### 3. Set up the database
  ```
  cd backend
  python schema.py
  ```                                                                                                                                                        
   
  ### 4. Start the backend                                                                                                                                   
  ```                                                                                                                                                      
  cd backend
  python app.py
  ```
  The Flask server will start at `http://127.0.0.1:5000`.

  ### 5. Open the app
  Navigate to `http://127.0.0.1:5000/login` in your browser.

To run it locally, first install the required dependencies by running this command in the terminal.
`bash pip install -r requirements.txt`

### Programming languages
- **HTML/CSS/Javascript** will cover of the visual elements of the application
- **Python** will serve as the primary language to support backend logic components


### Core Cloud Components
1. Data synchronization
2. Sleep data is stored in the cloud instead of  static storage
3. The program will be accessible through mobile devices, laptops, and others

### Google Cloud modules
* Cloud SQL
* Big Query
* Cloud Run
* API: Anthos

## Project Deliverables
- A webpage accessible through any device   
- Sleep data stored on the cloud, instead of the local machine
- Unique UI features for users to input their sleep data and school schedule

## Log Sleep Page
<img width="955" height="784" alt="Screenshot 2026-04-18 at 2 44 20 AM" src="https://github.com/user-attachments/assets/e995100b-f373-46c6-9af3-e36ea18da8f4" />

## Schedule Page
<img width="885" height="784" alt="Screenshot 2026-04-18 at 2 49 24 AM" src="https://github.com/user-attachments/assets/4a5966fc-b1bf-439e-a56f-5c6ad78fcc40" />

<img width="885" height="722" alt="Screenshot 2026-04-18 at 2 47 57 AM" src="https://github.com/user-attachments/assets/10197c95-5e86-4181-893e-13269480d4bf" />

## Insights Page
- Users can set and adjust their sleep goals here
- Sleep suggestions are generated according to user's sleep habits
<img width="885" height="741" alt="Screenshot 2026-04-18 at 2 50 38 AM" src="https://github.com/user-attachments/assets/e0ce3c6f-032c-4370-8377-65e644dfe05d" />



  

