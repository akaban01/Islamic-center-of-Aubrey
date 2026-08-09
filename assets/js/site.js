/* =========================================================
   Islamic Center of Aubrey — site behaviour
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- Theme ---------------- */

  var root = document.documentElement;
  try {
    var saved = localStorage.getItem("ica-theme");
    if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  } catch (e) {}

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  document.addEventListener("click", function (ev) {
    var toggle = ev.target.closest("[data-theme-toggle]");
    if (!toggle) return;
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("ica-theme", next); } catch (e) {}
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-label", next === "dark" ? "Switch to light theme" : "Switch to dark theme");
    });
  });

  /* ---------------- Mobile nav ---------------- */

  var navToggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("primary-nav");
  var backdrop = document.querySelector(".nav-backdrop");

  function setNav(open) {
    if (!nav) return;
    if (open) {
      var header = document.querySelector(".site-header");
      // The drawer is fixed to the viewport, so its top padding has to clear
      // whatever the header currently occupies (taller at the top of the page,
      // where the topbar is still in flow).
      if (header) nav.style.setProperty("--nav-top", (header.getBoundingClientRect().bottom + 14) + "px");
    }
    nav.setAttribute("data-open", String(open));
    if (backdrop) backdrop.setAttribute("data-open", String(open));
    if (navToggle) navToggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open && window.innerWidth <= 1024 ? "hidden" : "";
  }

  if (navToggle) navToggle.addEventListener("click", function () {
    setNav(nav.getAttribute("data-open") !== "true");
  });
  if (backdrop) backdrop.addEventListener("click", function () { setNav(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 1024) setNav(false); });

  /* ---------------- Footer year ---------------- */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------------- Prayer times ---------------- */
  /*  Times are *calculated* adhan (beginning) times for the masjid's
      coordinates using the ISNA method (Aladhan API). They are not the
      masjid's iqamah times, which are announced at the masjid.          */

  var LAT = 33.2204958;      // 26875 US Hwy 380 E, Aubrey, TX 76227
  var LON = -96.9078617;
  var METHOD = 2;            // Islamic Society of North America (ISNA)
  var TZ = "America/Chicago";
  var API = "https://api.aladhan.com/v1/calendar";

  var ORDER = [
    { key: "Fajr",    label: "Fajr",    note: "Dawn" },
    { key: "Sunrise", label: "Sunrise", note: "Shurooq — no prayer", sun: true },
    { key: "Dhuhr",   label: "Dhuhr",   note: "Midday" },
    { key: "Asr",     label: "Asr",     note: "Afternoon" },
    { key: "Maghrib", label: "Maghrib", note: "Sunset" },
    { key: "Isha",    label: "Isha",    note: "Night" }
  ];

  var ICONS = {
    Fajr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3v2M5 8l1.4 1.4M19 8l-1.4 1.4M2 18h20M6 18a6 6 0 0 1 12 0"/></svg>',
    Sunrise: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 2v4M4.9 7.9 7 10M19.1 7.9 17 10M2 18h20M8 22h8M6 18a6 6 0 0 1 12 0"/></svg>',
    Dhuhr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4"/></svg>',
    Asr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="11" r="3.4"/><path d="M12 3.5v1.6M4.6 11H3M21 11h-1.6M6.6 5.6 5.5 4.5M17.4 5.6l1.1-1.1M3 19h18"/></svg>',
    Maghrib: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 10V2M8.5 5.5 12 2l3.5 3.5M2 18h20M6 18a6 6 0 0 1 12 0M8 22h8"/></svg>',
    Isha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></svg>'
  };

  var host = document.querySelector("[data-prayer-widget]");
  if (!host) return;

  /* Parts of "now" as seen in the masjid's timezone. */
  function localParts(date) {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
    var out = {};
    fmt.formatToParts(date).forEach(function (p) {
      if (p.type !== "literal") out[p.type] = p.value;
    });
    return {
      year: +out.year, month: +out.month, day: +out.day,
      hour: +(out.hour === "24" ? "0" : out.hour), minute: +out.minute, second: +out.second
    };
  }

  function toMinutes(hhmm) {
    var m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
    return m ? +m[1] * 60 + +m[2] : null;
  }

  function to12h(hhmm) {
    var m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
    if (!m) return hhmm;
    var h = +m[1], suffix = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + m[2] + " " + suffix;
  }

  function cacheKey(y, mo) { return "ica-cal-" + y + "-" + mo; }

  function loadMonth(y, mo) {
    try {
      var raw = localStorage.getItem(cacheKey(y, mo));
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.length) return Promise.resolve(parsed);
      }
    } catch (e) {}

    var url = API + "/" + y + "/" + mo + "?latitude=" + LAT + "&longitude=" + LON +
              "&method=" + METHOD + "&school=0";
    return fetch(url, { mode: "cors" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (json) {
        var days = json && json.data;
        if (!days || !days.length) throw new Error("empty calendar");
        var slim = days.map(function (d) {
          return {
            g: d.date.gregorian.date,
            hijri: d.date.hijri.day + " " + d.date.hijri.month.en + " " + d.date.hijri.year + " AH",
            t: {
              Fajr: d.timings.Fajr, Sunrise: d.timings.Sunrise, Dhuhr: d.timings.Dhuhr,
              Asr: d.timings.Asr, Maghrib: d.timings.Maghrib, Isha: d.timings.Isha
            }
          };
        });
        try { localStorage.setItem(cacheKey(y, mo), JSON.stringify(slim)); } catch (e) {}
        return slim;
      });
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function findDay(days, p) {
    var stamp = pad(p.day) + "-" + pad(p.month) + "-" + p.year;
    for (var i = 0; i < days.length; i++) if (days[i].g === stamp) return days[i];
    return null;
  }

  var state = { today: null, tomorrowFajr: null };

  function render(day) {
    var list = host.querySelector("[data-prayer-rows]");
    var dateEl = host.querySelector("[data-prayer-date]");
    var hijriEl = host.querySelector("[data-prayer-hijri]");
    var skeleton = host.querySelector("[data-prayer-loading]");
    var errEl = host.querySelector("[data-prayer-error]");

    if (skeleton) skeleton.hidden = true;
    if (errEl) errEl.hidden = true;
    if (list) list.hidden = false;

    if (dateEl) {
      dateEl.textContent = new Intl.DateTimeFormat("en-US", {
        timeZone: TZ, weekday: "long", month: "long", day: "numeric", year: "numeric"
      }).format(new Date());
    }
    if (hijriEl) hijriEl.textContent = day.hijri;

    if (!list) return;
    list.innerHTML = ORDER.map(function (row) {
      var raw = day.t[row.key];
      return '<li data-slot="' + row.key + '"' + (row.sun ? ' class="is-sun"' : "") + '>' +
        '<span class="p-icon" aria-hidden="true">' + (ICONS[row.key] || "") + "</span>" +
        '<span class="p-name">' + row.label + "<small>" + row.note + "</small></span>" +
        '<span class="p-time">' + to12h(raw) + "</span>" +
      "</li>";
    }).join("");
  }

  function tick() {
    if (!state.today) return;
    var p = localParts(new Date());
    var nowMin = p.hour * 60 + p.minute;
    var nowSec = nowMin * 60 + p.second;

    var next = null;
    for (var i = 0; i < ORDER.length; i++) {
      var row = ORDER[i];
      if (row.sun) continue;
      var mins = toMinutes(state.today.t[row.key]);
      if (mins !== null && mins > nowMin) { next = { label: row.label, at: mins * 60 }; break; }
    }
    if (!next && state.tomorrowFajr !== null) {
      next = { label: "Fajr", at: (24 * 60 + toMinutes(state.tomorrowFajr)) * 60, tomorrow: true };
    }

    var nameEl = host.querySelector("[data-countdown-name]");
    var valEl = host.querySelector("[data-countdown-value]");
    host.querySelectorAll("[data-prayer-rows] li").forEach(function (li) {
      li.removeAttribute("data-next");
    });

    if (!next || !valEl) return;

    var diff = Math.max(0, next.at - nowSec);
    var h = Math.floor(diff / 3600);
    var m = Math.floor((diff % 3600) / 60);
    var s = diff % 60;
    valEl.textContent = (h > 0 ? h + "h " : "") + m + "m " + pad(s) + "s";
    if (nameEl) nameEl.textContent = "until " + next.label + (next.tomorrow ? " (tomorrow)" : "");

    if (!next.tomorrow) {
      var el = host.querySelector('[data-prayer-rows] li[data-slot="' + next.label + '"]');
      if (el) el.setAttribute("data-next", "true");
    }
  }

  function fail() {
    var skeleton = host.querySelector("[data-prayer-loading]");
    var errEl = host.querySelector("[data-prayer-error]");
    var list = host.querySelector("[data-prayer-rows]");
    if (skeleton) skeleton.hidden = true;
    if (list) list.hidden = true;
    if (errEl) errEl.hidden = false;
  }

  function start() {
    var p = localParts(new Date());
    loadMonth(p.year, p.month)
      .then(function (days) {
        var today = findDay(days, p);
        if (!today) throw new Error("day not found");
        state.today = today;

        // Tomorrow's Fajr — may roll into next month.
        var tomorrow = new Date(Date.now() + 86400000);
        var tp = localParts(tomorrow);
        var next = findDay(days, tp);
        if (next) {
          state.tomorrowFajr = next.t.Fajr;
          return;
        }
        return loadMonth(tp.year, tp.month).then(function (nextDays) {
          var d = findDay(nextDays, tp);
          if (d) state.tomorrowFajr = d.t.Fajr;
        }).catch(function () {});
      })
      .then(function () {
        render(state.today);
        tick();
        setInterval(tick, 1000);
      })
      .catch(function (err) {
        if (window.console) console.warn("Prayer times unavailable:", err);
        fail();
      });
  }

  start();
})();
