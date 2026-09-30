// AGNES MEMORIAL MEDICAL HOSPITAL - STAFF LOGIN
// Accounts are created by the Admin in the staff portal. There is no sign-up here.

const LOGIN_API = ((typeof API_URL !== "undefined" && API_URL) || (typeof API_BASE !== "undefined" && API_BASE) || "").replace(/\/$/, "");

// Page opened after a successful login. Change it if your dashboard has another name.
const AFTER_LOGIN_PAGE = "dashboard.html";

const $ = (id) => document.getElementById(id);
let pendingToken = null;

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

        if (data.employee && data.employee.must_change_password) {
            // must choose their own password before entering
            pendingToken = data.token;
            form.hidden = true;
            $("changeForm").hidden = false;
            return;
        }

        sessionStorage.setItem("staffToken", data.token);
        sessionStorage.setItem("currentUser", JSON.stringify(data.employee));
        show("Login successful", "ok");
        setTimeout(() => { window.location.href = AFTER_LOGIN_PAGE; }, 600);
    } catch (err) {
        show("Cannot reach the server. Check your connection.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Login";
    }
});

// ---------- forgot password ----------
function showPanel(name) {
    form.hidden = name !== "login";
    $("forgotForm").hidden = name !== "forgot";
    $("changeForm").hidden = name !== "change";
}
$("forgotLink").addEventListener("click", () => { $("forgotMessage").textContent = ""; showPanel("forgot"); });
$("backLink").addEventListener("click", () => showPanel("login"));

$("forgotForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const m = $("forgotMessage"), b = $("fBtn");
    m.textContent = ""; b.disabled = true;
    try {
        const res = await fetch(LOGIN_API + "/staff/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: $("fUser").value.trim(), email: $("fEmail").value.trim() })
        });
        const data = await res.json().catch(() => ({}));
        m.textContent = data.message || "Request failed";
        m.className = res.ok ? "ok" : "error";
    } catch (err) {
        m.textContent = "Cannot reach the server. Check your connection.";
        m.className = "error";
    }
    b.disabled = false;
});

// ---------- first login: choose own password ----------
$("changeForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const m = $("changeMessage"), b = $("cBtn");
    m.textContent = ""; m.className = "";
    if ($("nPw").value !== $("nPw2").value) { m.textContent = "New passwords do not match"; m.className = "error"; return; }
    b.disabled = true;
    try {
        const res = await fetch(LOGIN_API + "/staff/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + pendingToken },
            body: JSON.stringify({ current_password: pw.value, new_password: $("nPw").value })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { m.textContent = data.message || "Could not change password"; m.className = "error"; b.disabled = false; return; }
        sessionStorage.setItem("staffToken", data.token);
        sessionStorage.setItem("currentUser", JSON.stringify(data.employee));
        window.location.href = AFTER_LOGIN_PAGE;
    } catch (err) {
        m.textContent = "Cannot reach the server. Check your connection."; m.className = "error";
        b.disabled = false;
    }
});