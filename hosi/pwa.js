// Agnes Memorial Medical Hospital: install app banner + "internet required" lock screen.
// Add <script src="pwa.js"></script> at the end of any page that should be locked when offline.
(function () {
  const BASE = document.currentScript ? document.currentScript.src : location.href;
  const url = (f) => new URL(f, BASE).href;

  // ---------- service worker + styles ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register(url("sw.js")).catch(() => {}));
  }
  const css = document.createElement("link");
  css.rel = "stylesheet"; css.href = url("pwa.css"); document.head.appendChild(css);

  // ---------- build the banner and the offline screen ----------
  const banner = document.createElement("div");
  banner.className = "pwa-banner"; banner.hidden = true;
  banner.innerHTML =
    '<img src="' + url("icon-192.png") + '" alt="">' +
    '<div class="pb-text"><strong>Install Agnes Hospital</strong>' +
    '<span id="pbText">Open the staff app straight from your home screen.</span></div>' +
    '<button type="button" class="pb-install" id="pbInstall">Install</button>' +
    '<button type="button" class="pb-close" id="pbClose" aria-label="Dismiss">&#10005;</button>';
  document.body.prepend(banner);

  const off = document.createElement("dialog");
  off.className = "pwa-offline";
  off.innerHTML =
    '<svg viewBox="0 0 220 60" aria-hidden="true"><path d="M4 30h60l10-16 14 38 12-30 8 8h28" fill="none" stroke="#fde68a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M146 30h70" fill="none" stroke="#fde68a" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9" opacity=".6"/></svg>' +
    "<h2>No internet connection</h2>" +
    "<p>The Agnes Memorial staff app needs internet to work. Connect to Wi-Fi or mobile data, then try again.</p>" +
    '<p class="po-msg" role="status"></p>' +
    '<button type="button" class="po-retry">Try again</button>';
  document.body.appendChild(off);
  const offMsg = off.querySelector(".po-msg"), retry = off.querySelector(".po-retry");
  off.addEventListener("cancel", (e) => e.preventDefault());   // Esc cannot close it

  // ---------- install app ----------
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const KEY = "agnesHospitalInstallDismissed", DAYS = 7;
  let deferred = null;

  const dismissed = () => { try { const t = Number(localStorage.getItem(KEY)); return t && Date.now() - t < DAYS * 864e5; } catch (e) { return false; } };
  const showBanner = () => { if (standalone || dismissed()) return; banner.hidden = false; document.body.classList.add("has-install-banner"); };
  const hideBanner = () => { banner.hidden = true; document.body.classList.remove("has-install-banner"); };

  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; showBanner(); });
  banner.querySelector("#pbInstall").onclick = async () => {
    if (!deferred) return;
    deferred.prompt(); await deferred.userChoice; deferred = null; hideBanner();
  };
  banner.querySelector("#pbClose").onclick = () => {
    hideBanner();
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* ignore */ }
  };
  window.addEventListener("appinstalled", hideBanner);

  // iPhone/iPad Safari has no install prompt, so explain the manual steps.
  if (isIOS && !standalone) {
    banner.querySelector("#pbText").textContent = "Tap Share, then Add to Home Screen.";
    banner.querySelector("#pbInstall").hidden = true;
    showBanner();
  }

  // ---------- internet required ----------
  const lock = () => { if (off.open) return; offMsg.textContent = ""; off.showModal(); };
  const unlock = () => { if (off.open) off.close(); };

  // Asks the real network (the service worker skips "ping" requests) so a cached page can't fake a connection.
  async function checkOnline() {
    if (!navigator.onLine) return false;
    try {
      const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 8000);
      await fetch(url("manifest.json") + "?ping=" + Date.now(), { cache: "no-store", signal: ctrl.signal });
      clearTimeout(t);
      return true;
    } catch (e) { return false; }
  }
  const refresh = async () => ((await checkOnline()) ? unlock() : lock());

  window.addEventListener("offline", lock);
  window.addEventListener("online", refresh);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  setInterval(() => { if (off.open) refresh(); }, 5000);

  retry.onclick = async () => {
    retry.disabled = true; offMsg.textContent = "Checking connection...";
    if (await checkOnline()) unlock(); else offMsg.textContent = "Still offline. Check your Wi-Fi or mobile data.";
    retry.disabled = false;
  };

  if (!navigator.onLine) lock();
})();