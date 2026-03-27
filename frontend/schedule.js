const tabs = document.querySelectorAll(".schedule-tabs .tab");
const contents = document.querySelectorAll(".tab-content");

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
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
});

// Initial render
renderCalendar(currentMonth, currentYear);