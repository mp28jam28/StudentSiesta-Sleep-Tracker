const slider = document.getElementById("sleepGoalInput")
const goalValue = document.getElementById("goal-value")
const button = document.getElementById("setGoalBtn")
const statusMessage = document.getElementById("statusMessage")
const time_range = 12;

let savedWakeUpMinutes = 8 * 60; // default 8:00 AM until loaded from DB

function updateTips(hours) {
    const tipsGoal = document.getElementById("tips-goal");
    const bedtimeSuggestion = document.getElementById("bedtime-suggestion");
    const wakeSuggestion = document.getElementById("wake-suggestion");

    if (tipsGoal) tipsGoal.textContent = hours;

    const totalMinutes = savedWakeUpMinutes - hours * 60;
    let bedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const bedH = Math.floor(bedMinutes / 60);
    const bedM = bedMinutes % 60;
    const period = bedH >= 12 ? "PM" : "AM";
    const displayHour = bedH % 12 === 0 ? 12 : bedH % 12;
    const displayMin = bedM.toString().padStart(2, "0");
    if (bedtimeSuggestion) bedtimeSuggestion.innerHTML = `Go to bed at <span class="goal-highlight">${displayHour}:${displayMin} ${period}</span>`;

    const wakeH = Math.floor(savedWakeUpMinutes / 60) % 24;
    const wakeM = savedWakeUpMinutes % 60;
    const wakePeriod = wakeH >= 12 ? "PM" : "AM";
    const wakeDisplay = wakeH % 12 === 0 ? 12 : wakeH % 12;
    if (wakeSuggestion) wakeSuggestion.textContent = `to wake up at ${wakeDisplay}:${wakeM.toString().padStart(2, "0")} ${wakePeriod}`;
}

slider.addEventListener("input", () => {
    goalValue.textContent = slider.value + " hrs";
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

    updateTips(goal);
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

        const [h, m] = wakeUpGoal.split(":").map(Number);
        savedWakeUpMinutes = h * 60 + m;
        updateTips(slider.value);
        wakeStatusMessage.textContent =
            `Wake-up time set to ${formatTimeDisplay(wakeUpGoal)} 🎉`;
        wakeStatusMessage.style.color = "#cce8cc";
        confetti();
    } catch (err) {
        wakeStatusMessage.textContent = `Error: ${err.message}`;
        wakeStatusMessage.style.color = "red";
    }
});

// Load saved wake-up goal and sleep goal when page opens
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const [wakeRes, goalRes] = await Promise.all([
            fetch("http://127.0.0.1:5000/get_wake_up_goal", { credentials: "include" }),
            fetch("http://127.0.0.1:5000/goal_progress", { credentials: "include" })
        ]);

        if (wakeRes.ok) {
            const data = await wakeRes.json();
            if (data.wake_up_goal) {
                wakeUpInput.value = data.wake_up_goal;
                wakeUpDisplay.textContent = formatTimeDisplay(data.wake_up_goal);
                const [h, m] = data.wake_up_goal.split(":").map(Number);
                savedWakeUpMinutes = h * 60 + m;
            }
        }

        if (goalRes.ok) {
            const data = await goalRes.json();
            if (data.sleep_goal) {
                slider.value = data.sleep_goal;
                goalValue.textContent = data.sleep_goal + " hrs";
            }
        }

        updateTips(slider.value);
    } catch (err) {
        console.error("Failed to load goals:", err);
    }
});