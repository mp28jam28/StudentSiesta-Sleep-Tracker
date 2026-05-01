const slider = document.getElementById("sleepGoalInput")
const goalValue = document.getElementById("goal-value")
const button = document.getElementById("setGoalBtn")
const statusMessage = document.getElementById("statusMessage")
const time_range = 12;

function updateTips(hours) {
    const tipsGoal = document.getElementById("tips-goal");
    const bedtimeSuggestion = document.getElementById("bedtime-suggestion");
    const wakeSuggestion = document.getElementById("wake-suggestion");

    if (tipsGoal) tipsGoal.textContent = hours;

    // Calculate bedtime based on waking at 8:00 AM
    const wakeHour = 8; // TO-DO: get average wake-time
    const totalMinutes = wakeHour * 60 - hours * 60;
    let bedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const bedH = Math.floor(bedMinutes / 60);
    const bedM = bedMinutes % 60;
    const period = bedH >= 12 ? "PM" : "AM";
    const displayHour = bedH % 12 === 0 ? 12 : bedH % 12;
    const displayMin = bedM.toString().padStart(2, "0");
    if (bedtimeSuggestion) bedtimeSuggestion.textContent = `Go to bed at ${displayHour}:${displayMin} ${period}`;
    if (bedtimeSuggestion) bedtimeSuggestion.innerHTML = `Go to bed at <span class="goal-highlight">${displayHour}:${displayMin} ${period}</span>`;

    if (wakeSuggestion) wakeSuggestion.textContent = `to wake up at 8:00 AM`;
}

slider.addEventListener("input", () => {
    goalValue.textContent = slider.value + " hrs";
    updateTips(slider.value);
})

button.addEventListener("click", async () => {
    const goal = slider.value;
    localStorage.setItem("sleepGoal", goal);
    
    await fetch("http://127.0.0.1:5000/update_sleep_goal", {
        "method": "POST",
        "headers": {"Content-Type" :"application/json"},
        credentials: "include",
        body: JSON.stringify({sleep_goal: goal})
    });

    statusMessage.innerHTML = "Congrats! Your new sleep goal is: " + goal + " hours</span>";
    console.log("Goal set to " + goal + "!")
})

async function loadAverageBedtime() {
    try {
        const response = await fetch("http://127.0.0.1:5000/average_bedtime", {
            credentials: "include"
        });
        
        const result = await response.json();

        if (result.average_bedtime) {
            document.getElementById("avg-bedtime").textContent = result.average_bedtime;
        }
    } catch (error) {
        console.error("Error loading average bedtime:", error);
    }
}

async function loadAverageWakeTime() {
    try {
        const response = await fetch("http://127.0.0.1:5000/average_wake_time", {
            credentials: "include"
        });
        
        const result = await response.json();

        if (result.average_wake_time) {
            document.getElementById("avg-wake-time").textContent = result.average_wake_time;
        }
    } catch (error) {
        console.error("Error loading average wake time:", error);
    }
}

async function loadAverageSleepDuration() {
    try {
        const response = await fetch("http://127.0.0.1:5000/average_sleep_duration", {
            credentials: "include"
        });
        
        const result = await response.json();

        if (result.average_sleep_duration) {
            document.getElementById("avg-sleep-duration").textContent = result.average_sleep_duration;
        }
    } catch (error) {
        console.error("Error loading average sleep duration:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadAverageBedtime();
    loadAverageWakeTime();
    loadAverageSleepDuration();
});