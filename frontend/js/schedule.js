const tabs = document.querySelectorAll(".schedule-tabs .tab");
const contents = document.querySelectorAll(".tab-content");
const classMsg = document.getElementById("classAddedMsg");
const examMsg = document.getElementById("examAddedMsg");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        // deactivate all tabs
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        // disable all contents
        contents.forEach(c => c.style.display = "none");

        // show target content
        const target = document.getElementById(tab.dataset.target);
        target.style.display = "block";
    });
});

// Calendar
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

const monthYear = document.getElementById("monthYear");
const calendarBody = document.getElementById("calendar-body");

function renderCalendar(month, year)
{
    calendarBody.innerHTML = "";

    monthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let date = 1;
    for (let i = 0; i < 6; i++)
    {
        const row = document.createElement("tr");

        for (let j = 0; j < 7; j++)
        {
            const cell = document.createElement("td");

            if (i === 0 && j < firstDay)
            {
                cell.textContent = "";
            }
            else if (date > daysInMonth)
            {
                break;
            }
            else
            {
                cell.textContent = date;

                cell.dataset.day = date;

                const weekdayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                cell.dataset.weekday = weekdayNames[j];

                // mark today
                if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    cell.classList.add("today");
                }

                date++;
            }
            row.appendChild(cell);
        }
        calendarBody.appendChild(row);
    }
}

// Navigation
document.getElementById("prevMonth").addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
    loadEvents();
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
    loadEvents();
});

// Initial render
renderCalendar(currentMonth, currentYear);
loadEvents();

// Day toggle buttons
document.querySelectorAll(".day-btn").forEach(btn => {
    btn.addEventListener("click", () => btn.classList.toggle("selected"));
});

// Add Class form
document.getElementById("addClasses").addEventListener("submit", async function (event) {
    event.preventDefault();
    
    const className = event.target.querySelector("input[type='text']").value.trim();
    const days = [...document.querySelectorAll(".day-btn.selected")]
        .map(btn => btn.dataset.day);
    const time = event.target.querySelector("input[type='time']").value;

    if (days.length === 0) {
        alert("Please select at least one day");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/add_class", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                className: className,
                days: days.join(","),
                time: time
            })
        });

        const result = await response.json();
        console.log(result);

        if (!response.ok) {
                throw new Error(result.error || "Failed to save class");
            }

        classMsg.textContent = `${className || "Class"} got added to Calendar!`;
        classMsg.style.display = "block";

        loadEvents();
        event.target.reset();
    } catch (error) {
        console.error("Error saving class:", error);
        classMsg.textContent = `Error: ${error.message}`;
        classMsg.style.color = "red";
        classMsg.style.display = "block";
    }
});

// Add Exam form
document.getElementById("addExams").addEventListener("submit", async function (event) {
    event.preventDefault();

    const examName = event.target.elements.examName.value.trim();
    const examDate = event.target.elements.examDate.value;
    const examType = event.target.querySelector("input[name='examType']:checked")?.value;

    if (!examType) {
        alert("Please select the exam type");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/add_exam", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                examName: examName,
                examDate: examDate,
                examType: examType
            })
        });

        const result = await response.json();
        console.log(result);

        if (!response.ok) {
                throw new Error(result.error || "Failed to save exam");
            }
        
        examMsg.textContent = `${examName || "Exam"} got added to Calendar!`;
        examMsg.style.display = "block";

        loadEvents();
        event.target.reset();
    } catch (error) {
        console.error("Error saving exam:", error);
        examMsg.textContent = `Error: ${error.message}`;
        examMsg.style.color = "red";
        examMsg.style.display = "block";
    }
});

function renderEvents(events) {
    document.querySelectorAll(".event").forEach(e => e.remove());

    events.forEach(event => {

        // Exams
        if (event.exam_date) {
            const date = new Date(event.exam_date);

            const day = date.getDate();
            const month = date.getMonth();
            const year = date.getFullYear();

            if (month !== currentMonth || year !== currentYear) {
                return;
            }

            const cell = document.querySelector(`[data-day='${day}']`);
            if (!cell) return;

            const el = document.createElement("div");
            el.classList.add("event");
            el.style.background = "red";
            el.style.fontSize = "14px";
            el.style.marginTop = "5px";
            el.style.borderRadius = "5px";
            el.style.padding = "2px";

            el.textContent = event.class_name;

            cell.appendChild(el);
        }

        // Classes
        else if (event.days) {
            const days = event.days.split(",");

            days.forEach(dayStr => {
                const cells = document.querySelectorAll(`[data-weekday='${dayStr}']`);

                cells.forEach(cell => {
                    const el = document.createElement("div");
                    el.classList.add("event");
                    el.style.background = "orange";
                    el.style.fontSize = "14px";
                    el.style.marginTop = "5px";
                    el.style.borderRadius = "5px";
                    el.style.padding = "2px";

                    el.textContent = `${event.start_time.split(":").slice(0, 2).join(":")} ${event.class_name}`;

                    cell.appendChild(el);
                });
            });
        }
    });
}

async function deleteClass(event) {
    const id = event.currentTarget.dataset.id;

    try {
        const response = await fetch(`http://127.0.0.1:5000/delete_class/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Delete failed");
        }

        loadEvents();
    } catch (error) {
        console.error("Error deleting class:", error);
        examMsg.textContent = `Error: ${error.message}`;
        examMsg.style.color = "red";
        examMsg.style.display = "block";
    }
}

function renderClassList(events) {
    const container = document.getElementById("classList");
    container.innerHTML = "";

    events.forEach(event => {
        const div = document.createElement("div");
        div.classList.add("class-card");

        div.innerHTML = `
            <div class="class-left">
                <div class="class-info">
                    <div class="class-title">${event.class_name}</div>
                    <div class="class-days">${event.days} at ${event.start_time.split(":").slice(0, 2).join(":")}</div>
                </div>
            </div>
            <button class="delete-btn" data-id="${event.event_id}">🗑️</button>
        `;

        container.appendChild(div);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", deleteClass);
    });
}

async function deleteExam(event) {
    const id = event.currentTarget.dataset.id;

    try {
        const response = await fetch(`http://127.0.0.1:5000/delete_exam/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Delete failed");
        }

        loadEvents();
    } catch (error) {
        console.error("Error deleting exam:", error);
        examMsg.textContent = `Error: ${error.message}`;
        examMsg.style.color = "red";
        examMsg.style.display = "block";
    }
}

function renderExamList(events) {
    const container = document.getElementById("examList");
    container.innerHTML = "";

    events.forEach(event => {
        const div = document.createElement("div");
        div.classList.add("exam-card");

        const formattedDate = new Date(event.exam_date)
            .toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });

        div.innerHTML = `
            <div class="exam-left">
                <div class="exam-info">
                    <div class="exam-title">${event.class_name}</div>
                    <div class="exam-date">${formattedDate}</div>
                </div>
            </div>
            <button class="delete-btn" data-id="${event.event_id}">🗑️</button>
        `;

        container.appendChild(div);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", deleteExam);
    });
}

// Load events to calendar
async function loadEvents() {
    const response = await fetch("http://127.0.0.1:5000/get_events", {
        credentials: "include"
    });

    const events = await response.json();

    console.log("Events:", events);

    renderEvents(events);
    renderClassList(events.filter(e => e.event_type === "class"));
    renderExamList(events.filter(e => e.event_type === "exam"));
}