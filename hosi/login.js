// AGNES MEMORIAL MEDICAL HOSPITAL - STAFF LOGIN
// Accounts are created by the Admin in the staff portal. There is no sign-up here.

const LOGIN_API = ((typeof API_URL !== "undefined" && API_URL) || (typeof API_BASE !== "undefined" && API_BASE) || "").replace(/\/$/, "");

const form = document.getElementById("loginForm");
const msg = document.getElementById("loginMessage");
const btn = document.getElementById("loginBtn");
const pw = document.getElementById("password");

function show(text, type) { msg.textContent = text; msg.className = type || ""; }

document.getElementById("togglePw").addEventListener("click", function () {
    const hidden = pw.type === "password";
    pw.type = hidden ? "text" : "password";
    this.innerHTML = '<i class="fa fa-eye' + (hidden ? "-slash" : "") + '"></i>';
    this.setAttribute("aria-label", hidden ? "Hide password" : "Show password");
});

form.addEventListener("submit", async function (e) {
    e.preventDefault();
    show("");
    btn.disabled = true;
    btn.textContent = "Signing in...";

    try {
        const res = await fetch(LOGIN_API + "/staff/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: document.getElementById("username").value.trim(),
                password: pw.value,
                role: document.getElementById("role").value
            })
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            show(data.message || "Login failed", "error");
            return;
        }

        sessionStorage.setItem("staffToken", data.token);
        sessionStorage.setItem("currentUser", JSON.stringify(data.employee));
        show("Login successful", "ok");
        setTimeout(() => { window.location.href = "staff-portal.html"; }, 600);
    } catch (err) {
        show("Cannot reach the server. Check your connection.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Login";
    }
});