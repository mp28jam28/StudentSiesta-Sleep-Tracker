const form = document.getElementById("sleepDataForm");
const sleepData = document.getElementById("sleepData");
const statusMessage = document.getElementById("statusMessage");

let currentWeekOffset = 0;
let chart;

// ---------- form logic (log_sleep.html) ----------
if (sleepData) {
    sleepData.addEventListener("submit", async function (event) {
        event.preventDefault();

        const payload = {
            date: document.getElementById("sleepDate").value,
            bedtime: document.getElementById("bedtime").value,
            wake_time: document.getElementById("wakeTime").value,
            quality_rating: parseInt(document.getElementById("quality").value, 10)
        };

        try {
            const response = await fetch("http://127.0.0.1:5000/add_sleep", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials:"include",
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to save sleep data");
            }

            sleepData.reset();

            if (statusMessage) {
                statusMessage.textContent = `Sleep logged successfully. Duration: ${result.duration_hours} hours`;
                statusMessage.style.color = "green";
            } else {
                alert(`Sleep logged successfully. Duration: ${result.duration_hours} hours`);
            }

            // refresh chart if this JS is also loaded on homepage
            updateChart();
        } catch (error) {
            console.error("Error saving sleep data:", error);

            if (statusMessage) {
                statusMessage.textContent = `Error: ${error.message}`;
                statusMessage.style.color = "red";
            } else {
                alert(`Error: ${error.message}`);
            }
        }
    });
}

// ---------- chart logic (homepage.html) ----------
function getWeekDates(offset) {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7);

    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        week.push(d);
    }
    return week;
}

async function updateChart() {
    const chartCanvas = document.getElementById("sleepChart");
    if (!chartCanvas) return;

    const weekDates = getWeekDates(currentWeekOffset);
    const labels = weekDates.map(d =>
        d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
    );

    let sleepEntries = [];

    try {
        console.time("chartFetch");
        const response = await fetch("http://127.0.0.1:5000/sleep_data",{
            credentials:"include"
        });
        console.timeEnd("chartFetch");

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        sleepEntries = await response.json();
    } catch (error) {
        console.error("Failed to fetch sleep data:", error);
        sleepEntries = [];
    }

    const hoursSlept = weekDates.map(d => {
        const yyyyMmDd = d.toISOString().split("T")[0];
        const entry = sleepEntries.find(item => String(item.date).split("T")[0] === yyyyMmDd);
        return entry ? entry.duration_hours : null;
    });

    const weekTitle = document.getElementById("weekTitle");
    if (weekTitle) {
        const start = weekDates[0];
        const end = weekDates[6];
        weekTitle.innerText =
            `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
            })}`;
    }

    if (chart) chart.destroy();

    chart = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Hours Slept",
                data: hoursSlept,
                tension: 0,
                fill: true,
                borderColor: "#ffffff",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                pointBackgroundColor: "#ffcc00",
                pointBorderColor: "#ffcc00",
                pointRadius: 5,
                borderWidth: 3
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Hours Slept",
                        color: "white"
                    },
                    ticks: {
                        color: "white"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.2)"
                    }
                },
                x: {
                    ticks: {
                        color: "white"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.1)"
                    }
                }
            }
        }
    });
}

// ---------- week navigation ----------
const prevWeekBtn = document.getElementById("prevWeek");
const nextWeekBtn = document.getElementById("nextWeek");

if (prevWeekBtn) {
    prevWeekBtn.addEventListener("click", () => {
        currentWeekOffset--;
        updateChart();
    });
}

if (nextWeekBtn) {
    nextWeekBtn.addEventListener("click", () => {
        currentWeekOffset++;
        updateChart();
    });
}

// ---------- initial load ----------
document.addEventListener("DOMContentLoaded", function () {
    updateChart();
});