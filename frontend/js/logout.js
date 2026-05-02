document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async () => {
        try {
            const res = await fetch("http://127.0.0.1:5000/logout", {
                method: "POST",
                credentials: "include"
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Logout failed");
            }

            alert("Logged out successfully");

            // redirect to login page
            window.location.href = "login.html";

        } catch (err) {
            console.error(err);
            alert("Logout error: " + err.message);
        }
    });
});