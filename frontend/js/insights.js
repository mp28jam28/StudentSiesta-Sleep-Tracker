const slider = document.getElementById("sleepGoalInput")
const goalValue = document.getElementById("goal-value")

slider.addEventListener("input", () => {
    goalValue.textContent = slider.value + " hrs";
})