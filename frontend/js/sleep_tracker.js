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

            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

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

// ---------- Sleep Debt Logic ----------
async function loadSleepDebt() {
    const response = await fetch("http://127.0.0.1:5000/sleep_debt", {
        credentials: "include"
    });

    const data = await response.json();

    document.getElementById("sleepDebtValue").textContent = data.sleep_debt + " hrs";
    document.getElementById("sleepDebtValue").className = data.sleep_debt > 0 ? "bad" : "good";
}

function toggleChronoBanner() {
    const banner = document.querySelector(".chrono-banner");
    const btn = document.getElementById("learnMoreBtn");
    if (banner.style.opacity === "1") {
        banner.style.opacity = "0";
        banner.style.maxHeight = "0";
        banner.style.margin = "0 auto";
        setTimeout(() => banner.style.visibility = "hidden", 500);
        btn.textContent = "Learn more";
    } else {
        banner.style.visibility = "visible";
        banner.style.opacity = "1";
        banner.style.maxHeight = "500px";
        banner.style.margin = "20px auto";
        btn.textContent = "Show less";
    }
}

// ---------- Chronotype Logic ---------- //
async function updateChronotype() {
    const value = document.getElementById("chronotypeValue");
    const descriptions = {
        "Lion 🦁" : "According to your chronotype, you're an early riser. You fall asleep early and naturally embrace the mornings. Peak focus in the morning is common for lions ☀️✨<br>" +
                    "<span style='color: lightgray'>Sleep tip 💡: Take a power nap & energize in the afternoon.</span>", 
        "Bear 🐻" : "According to your chronotype, your sleep follows the sun. You feel most productive mid-morning and tend to hit an afternoon slump.<br>" + 
                    "<span style='color: lightgray'>Sleep tip 💡: Get 8 hours of sleep to stay active the next day.</span>",
        "Wolf 🐺" : "According to your chronotype, you are naturally active a night. It is difficult to wake up early while your energy really kicks in during the evening. <br>" +
                    "<span style='color: lightgray'>Sleep tip 💡: Give allow yourself to get more rest—8 to 10 hours can work well for you!</span>",
        "Dolphin 🐬" : "According to your chronotype, you're an light, irregular sleeper. You often lack momentum but have spontaneous bursts of energy throughout the day. <br>" +
                    "<span style='color: lightgray'>Sleep tip 💡: Unwind before bedtime to avoid anxious thoughts.</span>"
    };

    let desc = document.getElementById("chronotypeDesc");
    
    if (!value) return;

    try {
        const response = await fetch("http://127.0.0.1:5000/get_chronotype", {
            credentials: "include"
        });
        if (!response.ok) throw new Error("not ok");
        const data = await response.json();             // Returns either Lion, Wolf, Dolphin
        value.textContent = data.chronotype ?? "--";

        const label = document.getElementById("chronotypeLabel");
        if (label) label.textContent = data.chronotype ?? "";
        if (desc) desc.innerHTML = descriptions[data.chronotype] ?? "";
    } catch {
        value.textContent = "--";
    }
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
    const yyyyMmDd = d.toLocaleDateString("en-CA");

    const entriesForDay = sleepEntries.filter(item => {
        return String(item.date).split("T")[0] === yyyyMmDd;
    });

    if (entriesForDay.length === 0) {
        return null;
    }

    // !!! If multiple sleep logs exist for the same day,
    // use the most recent one returned from the backend
    return entriesForDay[entriesForDay.length - 1].duration_hours;
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


async function updateGoalProgress() {
    try {
        const res = await fetch("http://127.0.0.1:5000/goal_progress", {
            credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load goal progress");
        }
        let goalPercentage = document.getElementById("goalPercent")

        document.getElementById("goalAvgValue").textContent = `${data.avg_sleep} hrs`;
        goalPercentage.textContent = `${data.percent}% of your sleep goal!`;
        if (data.percent == 100) {
            goalPercentage.textContent += " 🎉";
        } 
        document.getElementById("goalFill").style.width = `${data.percent}%`;



    } catch (err) {
        console.error("Goal progress error:", err);
        document.getElementById("goalAvgValue").textContent = data.avg_sleep ?? "-- hrs";
    }
}

// ---------- Upcoming events logic ----------
function renderUpcomingEvents(events) {
    const container = document.getElementById("upcomingEvents");
    container.innerHTML = "";

    const today = new Date();

    const upcoming = events
        .flatMap(e => {
            if (e.event_type !== "class" || !e.days || !e.start_time) {
                return [];
            }

            const days = e.days.split(",");

            return days.map(day => {
                const date = getNextWeekday(day, e.start_time);
                return {...e, parsedDate: date, displayDay: day};
            });
        })
        .concat(
            events
            .filter(e => e.event_type === "exam" && e.exam_date)
            .map(e => ({...e, parsedDate: new Date(e.exam_date)}))
        )
        .filter(e => e.parsedDate >= new Date())
        .sort((a, b) => a.parsedDate - b.parsedDate)
        .slice(0, 4);
    
    upcoming.forEach(event => {
        const div = document.createElement("div");
        div.classList.add("event-card");

        const formattedDate = event.parsedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });

        const type = event.event_type;

        div.innerHTML = `
            <div class="event-left">
                <div class="dot ${type === "exam" ? "red" : "yellow"}"></div>
                <div>
                    <div class="event-title">${type === "class" ? `${event.start_time.split(":").slice(0, 2).join(":")} - ` : ""}${event.class_name}</div>
                    <div class="event-date">${formattedDate}</div>
                </div>
            </div>

            <div class="badge ${type === "exam" ? "red" : "yellow"}">${type === "exam" ? "Exam" : "Early Class"}</div>
        `;

        container.appendChild(div);
    });
}

function getNextWeekday(dayStr, timeStr) {
    const dayMap = {Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6};
    const targetDay = dayMap[dayStr];

    const result = new Date();

    const currentDay = result.getDay();
    let diff = targetDay - currentDay;

    if (diff < 0 || (diff === 0 && isTimePast(timeStr))) {
        diff += 7;
    }

    result.setDate(result.getDate() + diff);

    const [h, m, s] = timeStr.split(":").map(Number);
    result.setHours(h, m, s || 0, 0);

    return result;
}

function isTimePast(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const now = new Date();

    return (
        now.getHours() > h ||
        (now.getHours() === h && now.getMinutes() > m)
    );
}

async function loadEvents() {
    const response = await fetch("http://127.0.0.1:5000/get_events", {
        credentials: "include"
    });

    const events = await response.json();
    
    console.log("Events:", events);

    renderUpcomingEvents(events);
}

// ---------- initial load ----------
document.addEventListener("DOMContentLoaded", function () {
    loadSleepDebt();
    updateChart();
    updateChronotype();
    updateGoalProgress();
    loadEvents();
});