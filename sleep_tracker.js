const addDataBtn = document.getElementById('addDataBtn');
const form = document.getElementById('sleepDataForm');
const closeForm = document.getElementById('closeForm');
const sleepData = document.getElementById('sleepData');

// open/close form
addDataBtn.addEventListener('click', () => form.style.display = 'flex');
closeForm.addEventListener('click', () => form.style.display = 'none');
window.addEventListener('click', e => { if(e.target == form) form.style.display = 'none'; });

// save data button
sleepData.addEventListener('submit', function(event){
    event.preventDefault();

    form.style.display = 'none';
    sleepData.reset();
});

let currentWeekOffset = 0;
let chart;

// get dates of the current week
function getWeekDates(offset)
{
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7);

    const week = [];
    for (let i = 0; i < 7; i++)
    {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        week.push(d);
    }
    return week;
}

// hours slept chart
function updateChart()
{
    const weekDates = getWeekDates(currentWeekOffset);
    const labels = weekDates.map(d => d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
    const hoursSlept = weekDates.map(d => null); // load actual sleep hours from storage here, currently null for demo

    const start = weekDates[0];
    const end = weekDates[6];
    document.getElementById("weekTitle").innerText =
        `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

    const ctx = document.getElementById('sleepChart');

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: hoursSlept,
                tension: 0
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
                    beginAtZero: true
                }
            }
        }
    });
}

// buttons to navigate between weeks
document.getElementById("prevWeek").addEventListener("click", () => {
    currentWeekOffset--;
    updateChart();
});
document.getElementById("nextWeek").addEventListener("click", () => {
    currentWeekOffset++;
    updateChart();
});

// initialize chart on page load
document.addEventListener('DOMContentLoaded', function() {
    updateChart();
});