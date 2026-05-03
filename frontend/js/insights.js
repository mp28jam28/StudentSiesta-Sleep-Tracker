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

// ---- Wake-up goal logic ----
const wakeUpInput = document.getElementById("wakeUpInput");
const wakeUpDisplay = document.getElementById("wake-up-display");
const wakeUpBtn = document.getElementById("setWakeUpBtn");
const wakeStatusMessage = document.getElementById("wakeStatusMessage");

function formatTimeDisplay(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}:${m.toString().padStart(2, "0")} ${period}`;
}

wakeUpInput.addEventListener("input", () => {
    wakeUpDisplay.textContent = formatTimeDisplay(wakeUpInput.value);
});

wakeUpBtn.addEventListener("click", async () => {
    const wakeUpGoal = wakeUpInput.value;

    try {
        const res = await fetch("http://127.0.0.1:5000/update_wake_up_goal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ wake_up_goal: wakeUpGoal })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to save");

        wakeStatusMessage.textContent =
            `Wake-up time set to ${formatTimeDisplay(wakeUpGoal)} 🎉`;
        wakeStatusMessage.style.color = "#cce8cc";
        confetti();
    } catch (err) {
        wakeStatusMessage.textContent = `Error: ${err.message}`;
        wakeStatusMessage.style.color = "red";
    }
});

// Load saved wake-up goal when page opens
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch("http://127.0.0.1:5000/get_wake_up_goal", {
            credentials: "include"
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.wake_up_goal) {
            wakeUpInput.value = data.wake_up_goal;
            wakeUpDisplay.textContent = formatTimeDisplay(data.wake_up_goal);
        }
    } catch (err) {
        console.error("Failed to load wake-up goal:", err);
    }
});