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

