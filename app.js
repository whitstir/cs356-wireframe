/* Utah County Wedding Venues — wireframe + tree-test instrument.
 * Spec: wireframe-spec.md. Data: data/venues.js (generated), data/tasks.js (scenarios).
 */
(function () {
  "use strict";

  // ---------- Data & constants ----------
  const alpha = (x, y) => x.localeCompare(y, "en", { sensitivity: "base" });
  const VENUES = (window.VENUES || []).slice().sort((x, y) => alpha(x.name, y.name));
  // Decor sub-groups and their items, alphabetized.
  const DECOR = Object.fromEntries(Object.entries(window.DECOR_CATEGORIES || {})
    .sort(([x], [y]) => alpha(x, y)).map(([cat, items]) => [cat, items.slice().sort(alpha)]));
  const TASKS = (window.TASKS || []).filter((t) => t.text && t.text.trim());
  const STYLES = ["Classic", "Luxury", "Modern", "Outdoors", "Rustic"];
  const CITIES = [...new Set(VENUES.map((v) => v.city).filter(Boolean))].sort(alpha);
  const AV = ["Microphone", "Projector", "Sound system", "TV"];
  const ACCESS = ["Accessible parking", "ADA restrooms", "Elevator", "Wheelchair accessible"];
  const FEATURES = ["Bridal room", "Cleanup crew", "Event coordinator", "Groom's room", "Indoors",
    "Linens included", "Outdoors", "Outside catering allowed", "Sparklers allowed"];
  const PRICE_MAX = 10000, PRICE_STEP = 250;
  const CAP_MAX = 1000, CAP_STEP = 25;

  const SEARCH = new URLSearchParams(location.search);
  const MODE = SEARCH.has("results") ? "results" : SEARCH.has("test") ? "test" : "normal";

  const KEY_LOG = "uc-venues-clicklog";
  const KEY_RESULTS = "uc-venues-tt-results";
  const KEY_SESSION = "uc-venues-tt-session";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const app = $("#app");
  const overlay = $("#overlay");
  const taskbar = $("#taskbar");
  const testbar = $("#testbar");

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + Number(n).toLocaleString("en-US");
  const venueById = (id) => VENUES.find((v) => v.id === id);

  function load(key, fallback) {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* storage unavailable */ }
  }

  // ---------- Routing ----------
  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, q = ""] = raw.split("?");
    return {
      path: path || "/",
      parts: path.split("/").filter(Boolean).map(decodeURIComponent),
      query: new URLSearchParams(q),
    };
  }
  const href = (...parts) => "#/" + parts.map(encodeURIComponent).join("/");

  function render() {
    const r = parseHash();
    const [section, arg] = r.parts;
    if (!section) viewHome();
    else if (section === "location") viewList("Location", arg, VENUES.filter((v) => v.city === arg), CITIES.includes(arg));
    else if (section === "style") viewList("Style", arg, VENUES.filter((v) => v.styles.includes(arg)), STYLES.includes(arg));
    else if (section === "explore") viewExplore(r.query);
    else if (section === "venue") viewVenue(arg);
    else if (section === "log" && MODE === "normal") viewLog();
    else viewNotFound();
    window.scrollTo(0, 0);
    if (MODE === "test") testOnRoute(r);
  }

  // ---------- Global nav (plain link lists) ----------
  function buildNav() {
    $("#nav-location").innerHTML = CITIES.map((c) =>
      `<li><a href="#/explore?city=${encodeURIComponent(c)}" data-log="Location: ${esc(c)}">${esc(c)}</a></li>`).join("");
    $("#nav-style").innerHTML = STYLES.map((s) =>
      `<li><a href="#/explore?s=${encodeURIComponent(s)}" data-log="Style: ${esc(s)}">${esc(s)}</a></li>`).join("");
    // Picking a city/style opens Explore with that filter pre-set. Re-render even if the
    // hash is unchanged so the filters reset to just that choice.
    $(".global-nav").addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); render(); }
    });
  }

  // Size the Explore area to fill the rest of the screen below the header/heading, so the
  // filter column and the results column can each scroll to their ends independently.
  function syncExploreHeight() {
    const grid = $(".explore");
    if (!grid) return;
    const top = grid.getBoundingClientRect().top + window.scrollY;
    const bar = testbar && !testbar.hidden ? testbar.offsetHeight : 0;
    document.documentElement.style.setProperty("--explore-h", Math.max(320, window.innerHeight - top - bar - 16) + "px");
  }

  // ---------- Shared bits ----------
  function crumbs(items) {
    return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([label, link]) =>
      `<li>${link ? `<a href="${link}">${esc(label)}</a>` : esc(label)}</li>`).join("")}</ol></nav>`;
  }

  function priceLabel(v) {
    if (v.priceMin == null) return "Price not listed";
    return v.priceMin === v.priceMax ? money(v.priceMin) : `${money(v.priceMin)} – ${money(v.priceMax)}`;
  }
  const seatedLabel = (v) => (v.seated == null ? "Capacity not listed" : `Seats ${v.seated}`);

  function venueCard(v) {
    return `<a class="venue-card" href="${href("venue", v.id)}" data-log="Venue: ${esc(v.name)}">
      <span class="vc-name">${esc(v.name)}</span>
      <span class="vc-line">${esc(v.city || "City not listed")}</span>
      <span class="vc-line">${esc(priceLabel(v))}</span>
      <span class="vc-line">${esc(seatedLabel(v))}</span>
      <span class="vc-line">Style: ${esc(v.styles.join(", "))}</span>
    </a>`;
  }
  function venueList(list) {
    return list.length
      ? `<div class="venue-list">${list.map(venueCard).join("")}</div>`
      : `<p class="empty">No venues match. Try removing a filter.</p>`;
  }

  // ---------- Views ----------
  function viewHome() {
    document.title = "Utah County Wedding Venues";
    const shortcuts = [
      ["Budget", "#/explore?p=0-2000"],
      ["Capacity", "#/explore?c=200-" + CAP_MAX],
      ["Outside catering allowed", "#/explore?f=" + encodeURIComponent("Outside catering allowed")],
    ];
    app.innerHTML = `
      <h1>Find a wedding venue in Utah County</h1>
      <p class="muted">${VENUES.length} reception venues.</p>
      <section class="box" aria-labelledby="popular-title">
        <h2 id="popular-title">Popular searches</h2>
        <ul class="shortcuts">
          ${shortcuts.map(([title, link]) => `
            <li><a href="${link}" data-log="Popular search: ${esc(title)}">${esc(title)}</a></li>`).join("")}
        </ul>
      </section>`;
  }

  function viewList(kind, value, list, valid) {
    if (!valid) return viewNotFound();
    document.title = `${value} — Utah County Wedding Venues`;
    app.innerHTML = `
      ${crumbs([["Home", "#/"], [kind], [value]])}
      <div class="list-head">
        <h1>${esc(value)}</h1>
        <p class="muted">${list.length} venue${list.length === 1 ? "" : "s"}</p>
      </div>
      ${venueList(list)}`;
  }

  function viewNotFound() {
    document.title = "Page not found";
    app.innerHTML = `${crumbs([["Home", "#/"]])}<div class="box"><h1>Page not found</h1><p class="muted">Use the menu above to keep browsing.</p></div>`;
  }

  // ---------- Explore (faceted filters) ----------
  function readState(q) {
    const list = (k) => (q.get(k) || "").split("|").filter(Boolean);
    const range = (k, max) => {
      const [a, b] = (q.get(k) || "").split("-").map(Number);
      return [Number.isFinite(a) ? a : 0, q.get(k) && Number.isFinite(b) ? b : max];
    };
    const [pmin, pmax] = range("p", PRICE_MAX);
    const [cmin, cmax] = range("c", CAP_MAX);
    return {
      pmin, pmax, cmin, cmax,
      styles: list("s"), city: q.get("city") || "",
      decor: list("d"), modes: list("dm"),
      av: list("av"), access: list("ac"), flags: list("f"),
      lot: q.get("lot") === "1",
    };
  }
  function writeState(st) {
    const q = new URLSearchParams();
    if (st.pmin > 0 || st.pmax < PRICE_MAX) q.set("p", `${st.pmin}-${st.pmax}`);
    if (st.cmin > 0 || st.cmax < CAP_MAX) q.set("c", `${st.cmin}-${st.cmax}`);
    if (st.styles.length) q.set("s", st.styles.join("|"));
    if (st.city) q.set("city", st.city);
    if (st.decor.length) q.set("d", st.decor.join("|"));
    if (st.modes.length) q.set("dm", st.modes.join("|"));
    if (st.av.length) q.set("av", st.av.join("|"));
    if (st.access.length) q.set("ac", st.access.join("|"));
    if (st.flags.length) q.set("f", st.flags.join("|"));
    if (st.lot) q.set("lot", "1");
    return q.toString();
  }

  function matches(v, st) {
    if (st.pmin > 0 || st.pmax < PRICE_MAX) {
      if (v.priceMin == null) return false;
      const hi = st.pmax >= PRICE_MAX ? Infinity : st.pmax;
      if (!(v.priceMin <= hi && v.priceMax >= st.pmin)) return false;
    }
    if (st.cmin > 0 || st.cmax < CAP_MAX) {
      if (v.seated == null) return false;
      const hi = st.cmax >= CAP_MAX ? Infinity : st.cmax;
      if (v.seated < st.cmin || v.seated > hi) return false;
    }
    if (st.styles.length && !st.styles.some((s) => v.styles.includes(s))) return false;
    if (st.city && v.city !== st.city) return false;
    const modes = st.modes.length ? st.modes : ["included", "rent"];
    if (!st.decor.every((item) => (v.decor[item] || []).some((m) => modes.includes(m)))) return false;
    if (!st.av.every((k) => v.av[k])) return false;
    if (!st.access.every((k) => v.access[k])) return false;
    if (!st.flags.every((k) => v.flags[k])) return false;
    if (st.lot && !v.flags["Designated lot"]) return false;
    return true;
  }

  const priceText = (n) => (n >= PRICE_MAX ? money(PRICE_MAX) + "+" : money(n));
  const capText = (n) => (n >= CAP_MAX ? CAP_MAX + "+" : String(n));

  function checkbox(group, value, checked, label = value) {
    const count = group === "dm" || group === "s" ? "" : `<span class="count"></span>`;
    return `<label class="check"><input type="checkbox" data-f="${group}" value="${esc(value)}"${checked ? " checked" : ""}><span>${esc(label)}</span>${count}</label>`;
  }
  function dual(name, label, min, max, step, lo, hi, fmt) {
    return `<fieldset class="f-group">
      <legend>${label}</legend>
      <div class="readout" id="${name}-out">${fmt(lo)} – ${fmt(hi)}</div>
      <div class="dual">
        <div class="track"></div>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${lo}" data-f="${name}min" data-fmt="${name}" aria-label="${label} minimum">
        <input type="range" min="${min}" max="${max}" step="${step}" value="${hi}" data-f="${name}max" data-fmt="${name}" aria-label="${label} maximum">
      </div>
      <div class="scale"><span>${fmt(min)}</span><span>${fmt(max)}</span></div>
    </fieldset>`;
  }
  function accordion(title, open, body) {
    return `<details class="f-group"${open ? " open" : ""}><summary data-log="${esc(title)} (expand/collapse)">${esc(title)}</summary><div class="f-body">${body}</div></details>`;
  }

  function viewExplore(q) {
    document.title = "Explore — Utah County Wedding Venues";
    const st = readState(q);
    const decorBody = `
      <div class="f-modes">
        <div>Show items that are:</div>
        ${checkbox("dm", "included", st.modes.includes("included"), "Included")}
        ${checkbox("dm", "rent", st.modes.includes("rent"), "For rent")}
      </div>
      ${Object.entries(DECOR).map(([cat, items]) => `
        <div class="f-sub">${esc(cat)}</div>
        ${items.map((i) => checkbox("d", i, st.decor.includes(i))).join("")}`).join("")}`;

    app.innerHTML = `
      ${crumbs([["Home", "#/"], ["Explore"]])}
      <h1>Explore all venues</h1>
      <div class="explore">
        <aside class="filters" aria-label="Filters" id="filters">
          <div class="filters-head"><h2>Filters</h2><button type="button" id="clear-filters" data-log="Clear all filters">Clear all</button></div>
          ${dual("p", "Price", 0, PRICE_MAX, PRICE_STEP, st.pmin, st.pmax, priceText)}
          ${accordion("Accessibility options", st.access.length, ACCESS.map((a) => checkbox("ac", a, st.access.includes(a))).join(""))}
          ${accordion("Audio/Visual", st.av.length, AV.map((a) => checkbox("av", a, st.av.includes(a))).join(""))}
          ${dual("c", "Capacity (seated guests)", 0, CAP_MAX, CAP_STEP, st.cmin, st.cmax, capText)}
          <fieldset class="f-group"><legend>City</legend>
            <select data-f="city" aria-label="City">
              <option value="">Any city</option>
              ${CITIES.map((c) => `<option value="${esc(c)}"${st.city === c ? " selected" : ""}>${esc(c)}</option>`).join("")}
            </select>
          </fieldset>
          ${accordion("Decor", st.decor.length || st.modes.length, decorBody)}
          <fieldset class="f-group"><legend>Features</legend>
            ${FEATURES.map((f) => checkbox("f", f, st.flags.includes(f))).join("")}
          </fieldset>
          <fieldset class="f-group"><legend>Parking</legend>
            ${checkbox("lot", "1", st.lot, "Designated lot")}
          </fieldset>
          <fieldset class="f-group"><legend>Style</legend>
            ${STYLES.map((s) => checkbox("s", s, st.styles.includes(s))).join("")}
          </fieldset>
        </aside>
        <section class="results" aria-labelledby="results-count">
          <div class="list-head"><h2 id="results-count" aria-live="polite"></h2></div>
          <div id="results"></div>
        </section>
      </div>`;

    const filters = $("#filters");
    const fromDom = () => {
      const vals = (g) => $$(`[data-f="${g}"]:checked`, filters).map((i) => i.value);
      const num = (g) => Number($(`[data-f="${g}"]`, filters).value);
      return {
        pmin: num("pmin"), pmax: num("pmax"), cmin: num("cmin"), cmax: num("cmax"),
        styles: vals("s"), city: $('[data-f="city"]', filters).value,
        decor: vals("d"), modes: vals("dm"), av: vals("av"), access: vals("ac"), flags: vals("f"),
        lot: vals("lot").length > 0,
      };
    };
    // Next to each option: how many venues would show with it on, given every other filter as it is now.
    const COUNT_KEYS = { ac: "access", av: "av", d: "decor", f: "flags" };
    const countWith = (s, change) => VENUES.filter((v) => matches(v, { ...s, ...change })).length;
    const updateCounts = (s) => {
      $$("input[type=checkbox]", filters).forEach((box) => {
        const out = $(".count", box.closest("label"));
        if (!out) return;
        const g = box.dataset.f, key = COUNT_KEYS[g];
        const change = g === "lot" ? { lot: true } : { [key]: [...new Set([...s[key], box.value])] };
        out.textContent = `(${countWith(s, change)})`;
      });
      $$('[data-f="city"] option', filters).forEach((opt) => {
        if (opt.value) opt.textContent = `${opt.value} (${countWith(s, { city: opt.value })})`;
      });
    };
    const update = () => {
      const s = fromDom();
      // Test mode: remember the filters currently applied, so the task can be scored on them,
      // and note any filter that was on and is now off.
      if (testSession && testSession.active) {
        const now = appliedItems(s).map((i) => i.key);
        appliedItems(testSession.filters || emptyFilters()).forEach((i) => {
          if (i.kind !== "mode" && !now.includes(i.key)) testSession.undone.push(i.key);
        });
        testSession.filters = s;
        save(KEY_SESSION, testSession);
      }
      const list = VENUES.filter((v) => matches(v, s));
      $("#results-count").textContent = `Showing ${list.length} of ${VENUES.length} venues`;
      $("#results").innerHTML = venueList(list);
      updateCounts(s);
      const qs = writeState(s);
      history.replaceState(null, "", location.pathname + location.search + "#/explore" + (qs ? "?" + qs : ""));
    };
    filters.addEventListener("input", (e) => {
      const el = e.target;
      if (el.type === "range") {
        const name = el.dataset.fmt;
        const lo = $(`[data-f="${name}min"]`, filters), hi = $(`[data-f="${name}max"]`, filters);
        if (Number(lo.value) > Number(hi.value)) {
          if (el === lo) hi.value = lo.value; else lo.value = hi.value;
        }
        const fmt = name === "p" ? priceText : capText;
        $(`#${name}-out`).textContent = `${fmt(Number(lo.value))} – ${fmt(Number(hi.value))}`;
      }
      update();
    });
    filters.addEventListener("change", update);
    $("#clear-filters").addEventListener("click", () => {
      history.replaceState(null, "", location.pathname + location.search + "#/explore");
      render();
    });
    update();
    syncExploreHeight();
  }

  // ---------- Venue endpoint ----------
  const DETAIL_GROUPS = [
    ["Overview", [["Description", "Description"], ["Full Address", "Address"], ["Style", "Venue's own style words"]]],
    ["Pricing & packages", [["Standard Price Range", "Standard price range"], ["Packages and Prices", "Packages and prices"], ["Deposit Policy", "Deposit policy"]]],
    ["Capacity & timing", [["Seated Capacity", "Seated capacity"], ["Standing Capacity", "Standing capacity"], ["Time slots", "Time slots"], ["Length of Rental", "Length of rental"]]],
    ["Space & decor", [["outside/inside", "Indoor / outdoor"], ["Linens Included", "Linens included"], ["Other Decor Included", "Decor included"], ["Other Decor for Rent", "Decor for rent"], ["Prep Area", "Prep area"], ["Bride/Groom Rooms", "Bride / groom rooms"], ["parking?", "Parking"], ["Accessibility", "Accessibility"]]],
    ["Services", [["sound system", "Sound system"], ["Catering", "Catering"], ["Event Coordinator", "Event coordinator"], ["cleanup crew", "Cleanup crew"], ["extras", "Extras"]]],
    ["Policies", [["sparklers allowed", "Sparklers"], ["Alcohol policy", "Alcohol policy"], ["Restrictions", "Restrictions"], ["Important Notes", "Important notes"]]],
    ["Contact", [["Contact Information", "Contact information"], ["link", "Website"]]],
  ];

  function fieldValue(val) {
    const v = val === "TRUE" ? "Yes" : val === "FALSE" ? "No" : val;
    const lines = v.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.length > 1 ? `<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : esc(lines[0] || "");
  }
  const yesList = (obj) => Object.keys(obj).filter((k) => obj[k]);
  function websiteLink(url) {
    const u = (url || "").trim();
    if (!/^https?:\/\//i.test(u)) return u ? esc(u) : "Not listed";
    return `<a href="${esc(u)}" target="_blank" rel="noopener" data-log="Venue website">${esc(u)}</a>`;
  }

  function viewVenue(id) {
    const v = venueById(id);
    if (!v) return viewNotFound();
    document.title = `${v.name} — Utah County Wedding Venues`;
    const decor = Object.entries(v.decor).map(([item, modes]) =>
      `${item} (${modes.map((m) => (m === "rent" ? "for rent" : "included")).join(", ")})`);
    const facts = [
      ["City", v.city || "Not listed"],
      ["Website", { html: websiteLink(v.raw.link) }],
      ["Price", priceLabel(v)],
      ["Seated capacity", v.seated == null ? "Not listed" : String(v.seated)],
      ["Standing capacity", v.standing == null ? "Not listed" : String(v.standing)],
      ["Style", v.styles.join(", ")],
      ["Features", yesList(v.flags).join(", ") || "None listed"],
      ["Audio/Visual", yesList(v.av).join(", ") || "None listed"],
      ["Accessibility", yesList(v.access).join(", ") || "None listed"],
      ["Decor", decor.length ? decor : "None listed"],
    ];
    const groups = DETAIL_GROUPS.map(([title, fields]) => {
      const rows = fields.filter(([k]) => v.raw[k]).map(([k, label]) =>
        `<dt>${esc(label)}</dt><dd>${k === "link" ? websiteLink(v.raw[k]) : fieldValue(v.raw[k])}</dd>`);
      return rows.length ? `<h3>${esc(title)}</h3><dl class="facts">${rows.join("")}</dl>` : "";
    }).join("");

    app.innerHTML = `
      ${crumbs([["Home", "#/"], ["Venue"], [v.name]])}
      <p class="endstate">You reached: ${esc(v.name)}</p>
      <section class="box summary" aria-labelledby="venue-name">
        <h1 id="venue-name">${esc(v.name)}</h1>
        <p class="muted">${esc(v.description)}</p>
        <dl class="facts">
          ${facts.map(([k, val]) => `<dt>${esc(k)}</dt><dd>${val && val.html ? val.html : Array.isArray(val)
            ? `<ul>${val.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : esc(val)}</dd>`).join("")}
        </dl>
      </section>
      <details class="box all-details">
        <summary data-log="All venue details (expand/collapse)">All venue details</summary>
        <div class="detail-body">${groups}</div>
      </details>`;
  }

  // ---------- Click recording ----------
  function labelOf(el) {
    if (el.matches("input[type=checkbox]")) {
      const text = el.closest("label") ? $("span", el.closest("label")).textContent.trim() : el.value;
      return `${text}: ${el.checked ? "on" : "off"}`;
    }
    if (el.matches("input[type=range]")) {
      const n = Number(el.value);
      return `${el.getAttribute("aria-label")}: ${el.dataset.fmt === "p" ? priceText(n) : capText(n)}`;
    }
    if (el.tagName === "SELECT") {
      const opt = el.selectedOptions[0];
      return `${el.getAttribute("aria-label") || "Select"}: ${opt ? opt.value || opt.text : ""}`;
    }
    if (el.dataset.log) return el.dataset.log;
    return (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
  }

  // Which of the site's ways in a click belongs to (test mode: categorization used).
  function routeOf(el, type, label) {
    if (type === "change" || el.closest("#filters") || label === "Explore") return "Explore filters";
    if (el.closest(".global-nav")) return "Global nav";
    if (label.startsWith("Popular search: ")) return "Popular searches";
    return "";
  }

  function record(el, type) {
    const label = labelOf(el);
    const entry = {
      time: new Date().toISOString(),
      mode: MODE,
      participant: testSession ? testSession.participant : "",
      task_id: testSession && testSession.active ? testSession.order[testSession.idx] : "",
      page: location.hash || "#/",
      event: type,
      element: el.tagName.toLowerCase() + (el.type ? `[${el.type}]` : ""),
      label,
    };
    const log = load(KEY_LOG, []);
    log.push(entry);
    save(KEY_LOG, log);
    if (testSession && testSession.active) {
      testSession.path.push(label);
      testSession.clickTimes.push(Date.now() - testSession.taskStart);
      const route = routeOf(el, type, label);
      if (route && !testSession.used.includes(route)) testSession.used.push(route);
      save(KEY_SESSION, testSession);
    }
  }

  function initRecording() {
    document.addEventListener("click", (e) => {
      const el = e.target.closest("a, button, summary");
      if (!el || el.closest("[data-nolog]")) return;
      record(el, "click");
    }, true);
    document.addEventListener("change", (e) => {
      const el = e.target;
      if (!el.matches("input, select") || el.closest("[data-nolog]")) return;
      record(el, "change");
    }, true);
  }

  // ---------- Export helpers ----------
  function toCSV(rows, cols) {
    const cell = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
  }
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  function table(rows, cols) {
    if (!rows.length) return `<p class="empty">Nothing recorded yet.</p>`;
    return `<div class="table-wrap"><table>
      <thead><tr>${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td>${esc(r[c])}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>`;
  }

  const LOG_COLS = ["time", "mode", "participant", "task_id", "page", "event", "element", "label"];

  function viewLog() {
    document.title = "Click log";
    const log = load(KEY_LOG, []);
    app.innerHTML = `
      ${crumbs([["Home", "#/"], ["Click log"]])}
      <h1>Click log</h1>
      <p class="muted">${log.length} click${log.length === 1 ? "" : "s"} recorded in this browser.</p>
      <div class="actions" data-nolog>
        <button type="button" id="log-json">Download JSON</button>
        <button type="button" id="log-csv">Download CSV</button>
        <button type="button" id="log-copy">Copy JSON</button>
        <button type="button" id="log-clear">Clear log</button>
      </div>
      ${table(log.slice().reverse(), LOG_COLS)}`;
    $("#log-json").onclick = () => download(`click-log-${stamp()}.json`, JSON.stringify(log, null, 2), "application/json");
    $("#log-csv").onclick = () => download(`click-log-${stamp()}.csv`, toCSV(log, LOG_COLS), "text/csv");
    $("#log-copy").onclick = async (e) => {
      try { await navigator.clipboard.writeText(JSON.stringify(log, null, 2)); e.target.textContent = "Copied"; }
      catch (err) { e.target.textContent = "Copy failed"; }
    };
    $("#log-clear").onclick = () => {
      if (confirm("Clear the click log in this browser?")) { remove(KEY_LOG); viewLog(); }
    };
  }

  // ---------- Tree test mode (?test) ----------
  let testSession = null;
  const taskById = (id) => TASKS.find((t) => t.id === id);

  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function showOverlay(html) {
    overlay.innerHTML = `<div class="dialog" role="dialog" aria-modal="true">${html}</div>`;
    overlay.hidden = false;
    const focusable = $("input, button", overlay);
    if (focusable) focusable.focus();
  }
  function hideOverlay() { overlay.hidden = true; overlay.innerHTML = ""; }

  // Each participant gets a random 6-digit number, so numbers stay unique when sessions are run
  // on different computers and the CSV files are combined.
  function newParticipantNumber() {
    const used = load(KEY_RESULTS, []).map((r) => r.participant);
    let n;
    do { n = 100000 + Math.floor(Math.random() * 900000); } while (used.includes(n));
    return n;
  }

  function testStartScreen() {
    if (!TASKS.length) {
      showOverlay(`<h1>Tree test</h1>
        <p>No scenarios are set up yet. Add them to <code>data/tasks.js</code>, then reload this page.</p>
        <p><a href="./">Go to the normal site</a></p>`);
      return;
    }
    showOverlay(`<h1>Welcome</h1>
      <p>We are testing the website's structure, not you. There are no wrong answers.</p>
      <p>You'll get ${TASKS.length} short tasks. For each one, use the site to find venues that fit. Please think aloud as you go.</p>
      <p>Two buttons stay at the bottom of every page. Press "I think I'm done" when you feel you've found what the task asks for. If you can't find it, press "I give up". That is a useful result, not a failure.</p>
      <form id="start-form">
        <label for="pname">First name</label>
        <input type="text" id="pname" required autocomplete="off">
        <button type="submit">Start</button>
      </form>`);
    $("#start-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#pname").value.trim().replace(/\s+/g, " ");
      if (!name) return;
      testSession = {
        participant: newParticipantNumber(),
        participant_name: name,
        session_start: new Date().toISOString(),
        order: shuffle(TASKS.map((t) => t.id)),
        idx: 0, active: false, taskStart: 0, introStart: 0, readingMs: 0, path: [], clickTimes: [], visited: [],
        backtracks: 0, filters: null, undone: [], used: [], rating: null,
      };
      save(KEY_SESSION, testSession);
      testTaskIntro();
    });
  }

  function testTaskIntro() {
    hideTaskbar();
    if (!testSession.introStart) { testSession.introStart = Date.now(); save(KEY_SESSION, testSession); }
    const t = taskById(testSession.order[testSession.idx]);
    showOverlay(`<p>Task ${testSession.idx + 1} of ${testSession.order.length}</p>
      <div class="scenario">${esc(t.text)}</div>
      <p class="muted">Press OK when you're ready. The site will open at the home page.</p>
      <button type="button" id="task-ok">OK, start</button>`);
    $("#task-ok").addEventListener("click", () => {
      const now = Date.now();
      Object.assign(testSession, { active: true, taskStart: now, readingMs: now - testSession.introStart, introStart: 0,
        path: [], clickTimes: [], visited: ["/"], backtracks: 0, filters: null, undone: [], used: [] });
      save(KEY_SESSION, testSession);
      hideOverlay();
      showTaskbar();
      if (parseHash().path === "/" && location.hash) render();
      else location.hash = "#/";
    });
  }

  function showTaskbar() {
    const t = taskById(testSession.order[testSession.idx]);
    taskbar.innerHTML = `<div class="wrap taskbar-inner">
      <p class="taskbar-text">Task ${testSession.idx + 1} of ${testSession.order.length}: ${esc(t.text)}</p></div>`;
    // Bottom bar, shown on every page during a task. The task only ends when one of these is pressed.
    testbar.innerHTML = `<div class="wrap testbar-inner">
      <button type="button" id="give-up">I give up</button>
      <button type="button" id="task-done">I think I'm done</button></div>`;
    taskbar.hidden = false;
    testbar.hidden = false;
    document.body.classList.add("has-testbar");
    syncExploreHeight();
    $("#give-up").addEventListener("click", () => testFinish("gave_up"));
    $("#task-done").addEventListener("click", () => testFinish("done"));
  }
  function hideTaskbar() {
    taskbar.hidden = true;
    testbar.hidden = true;
    document.body.classList.remove("has-testbar");
    syncExploreHeight();
  }

  function testOnRoute(r) {
    if (!testSession || !testSession.active) return;
    const key = r.path;
    const v = testSession.visited;
    if (v[v.length - 1] === key) return;
    if (v.includes(key)) testSession.backtracks++;
    v.push(key);
    save(KEY_SESSION, testSession);
  }

  // ---------- Facet scoring ----------
  // A task's `expected` is a list of facet parts (see data/tasks.js). The score is the share of
  // parts that are satisfied by the filters applied when the participant ends the task.
  const emptyFilters = () => readState(new URLSearchParams());
  const decorGroupOf = (item) => (Object.entries(DECOR).find(([, items]) => items.includes(item)) || [""])[0];
  const sameText = (x, y) => String(x).toLowerCase() === String(y).toLowerCase();
  const has = (list, value) => list.some((x) => sameText(x, value));

  function rangeLabel(name, p, fmt) {
    if (p.min != null && p.max != null) return `${name}: ${fmt(p.min)} to ${fmt(p.max)}`;
    if (p.max != null) return `${name}: up to ${fmt(p.max)}`;
    if (p.min != null) return `${name}: at least ${fmt(p.min)}`;
    return `${name}: range adjusted`;
  }
  function rangeMet(lo, hi, top, p) {
    if (!(lo > 0 || hi < top)) return false;            // slider untouched
    if (p.max != null && hi > p.max) return false;
    if (p.min != null && lo < p.min) return false;
    return true;
  }

  function partLabel(p) {
    if (p.anyOf) return p.anyOf.map(partLabel).join(" or ");
    switch (p.facet) {
      case "style": return `Style: ${p.value}`;
      case "city": return `City: ${p.value}`;
      case "feature": return `Features: ${p.value}`;
      case "access": return `Accessibility options: ${p.value}`;
      case "av": return `Audio/Visual: ${p.value}`;
      case "parking": return "Parking: Designated lot";
      case "decor": return `Decor > ${decorGroupOf(p.value)}: ${p.value}`;
      case "decorGroup": return `Decor > ${p.group}: any ${p.min || 1} or more`;
      case "price": return rangeLabel("Price", p, priceText);
      case "capacity": return rangeLabel("Capacity", p, capText);
      default: return `Unknown facet "${p.facet}"`;
    }
  }
  function partMet(p, st) {
    if (p.anyOf) return p.anyOf.some((x) => partMet(x, st));
    switch (p.facet) {
      case "style": return has(st.styles, p.value);
      case "city": return sameText(st.city, p.value);
      case "feature": return has(st.flags, p.value);
      case "access": return has(st.access, p.value);
      case "av": return has(st.av, p.value);
      case "parking": return !!st.lot;
      case "decor": return has(st.decor, p.value);
      case "decorGroup": {
        const group = Object.entries(DECOR).find(([cat]) => sameText(cat, p.group));
        return !!group && st.decor.filter((d) => group[1].includes(d)).length >= (p.min || 1);
      }
      case "price": return rangeMet(st.pmin, st.pmax, PRICE_MAX, p);
      case "capacity": return rangeMet(st.cmin, st.cmax, CAP_MAX, p);
      default: return false;
    }
  }
  // Everything the participant had applied, in the same wording as the expected parts.
  // `key` is the label, except sliders, which keep one key however far they are moved.
  function appliedItems(st) {
    const out = [];
    const add = (kind, value, label, key = label) => out.push({ kind, value, label, key });
    if (st.pmin > 0 || st.pmax < PRICE_MAX) add("price", "", `Price: ${priceText(st.pmin)} to ${priceText(st.pmax)}`, "Price range");
    st.access.forEach((x) => add("access", x, `Accessibility options: ${x}`));
    st.av.forEach((x) => add("av", x, `Audio/Visual: ${x}`));
    if (st.cmin > 0 || st.cmax < CAP_MAX) add("capacity", "", `Capacity: ${capText(st.cmin)} to ${capText(st.cmax)}`, "Capacity range");
    if (st.city) add("city", st.city, `City: ${st.city}`);
    st.modes.forEach((x) => add("mode", x, `Decor: ${x === "rent" ? "For rent" : "Included"}`));
    st.decor.forEach((x) => add("decor", x, `Decor > ${decorGroupOf(x)}: ${x}`));
    st.flags.forEach((x) => add("feature", x, `Features: ${x}`));
    if (st.lot) add("parking", "", "Parking: Designated lot");
    st.styles.forEach((x) => add("style", x, `Style: ${x}`));
    return out;
  }
  const describeFilters = (st) => appliedItems(st).map((i) => i.label);
  // Does an expected part call for this applied filter at all (whatever value a slider is at)?
  function partCovers(p, item) {
    if (p.anyOf) return p.anyOf.some((x) => partCovers(x, item));
    if (p.facet === "decorGroup") return item.kind === "decor" && sameText(decorGroupOf(item.value), p.group);
    return p.facet === item.kind && (p.value == null || sameText(p.value, item.value));
  }

  function pageName(path) {
    const [section, arg] = path.split("/").filter(Boolean).map(decodeURIComponent);
    if (!section) return "Home";
    if (section === "explore") return "Explore";
    if (section === "venue") return `Venue: ${(venueById(arg) || { name: arg }).name}`;
    return path;
  }

  function testFinish(kind) {
    const s = testSession;
    const t = taskById(s.order[s.idx]);
    const filters = s.filters || emptyFilters();
    const expected = Array.isArray(t.expected) ? t.expected : [];
    const correct = expected.filter((p) => partMet(p, filters));
    const missed = expected.filter((p) => !correct.includes(p));
    const score = expected.length ? Math.round((100 * correct.length) / expected.length) / 100 : "";
    const outcome = kind === "gave_up" ? "gave_up"
      : !expected.length ? "no_target_set"
      : score === 1 ? "success" : score === 0 ? "fail" : "partial";
    const here = parseHash();
    const venue = here.parts[0] === "venue" ? venueById(here.parts[1]) : null;
    const first = s.path[0] || "";
    // Filters still on that the task did not call for. Decor's Included / For rent only narrow other filters.
    const extra = appliedItems(filters).filter((i) => i.kind !== "mode" && !expected.some((p) => partCovers(p, i)));
    const venuesOpened = [...new Set(s.visited.filter((v) => v.startsWith("/venue/")).map((v) => pageName(v).replace(/^Venue: /, "")))];
    const results = load(KEY_RESULTS, []);
    results.push({
      participant: s.participant,
      participant_name: s.participant_name,
      session_start: s.session_start,
      task_id: t.id,
      task_order: s.idx + 1,
      task_text: t.text,
      target: expected.map(partLabel).join("; "),
      outcome,
      score,
      directness: s.backtracks === 0 && s.undone.length === 0 ? "direct" : "indirect",
      facets_correct_count: expected.length ? `${correct.length} of ${expected.length}` : "",
      facets_correct: correct.map(partLabel).join("; "),
      facets_missed: missed.map(partLabel).join("; "),
      filters_applied: describeFilters(filters).join("; "),
      extra_filters_count: extra.length,
      extra_filters: extra.map((i) => i.label).join("; "),
      filters_undone_count: s.undone.length,
      filters_undone: s.undone.join("; "),
      wrong_turns: extra.length + s.undone.length,
      categorization_used: s.used.join(" + ") || "None",
      finish_page: here.path,
      finish_block: venue ? venue.name : "",
      first_click: first,
      first_click_expected: t.expectedFirstClick || "",
      first_click_match: t.expectedFirstClick ? (sameText(first, t.expectedFirstClick) ? "yes" : "no") : "",
      click_path: s.path.join(" > "),
      click_times_s: s.clickTimes.map((ms) => (ms / 1000).toFixed(1)).join(" > "),
      click_count: s.path.length,
      pages_visited: s.visited.map(pageName).join(" > "),
      venues_opened_count: venuesOpened.length,
      venues_opened: venuesOpened.join("; "),
      backtracks: s.backtracks,
      reading_ms: s.readingMs,
      time_to_first_click_ms: s.clickTimes.length ? s.clickTimes[0] : "",
      elapsed_ms: Date.now() - s.taskStart,
      ease_rating_1to7: "",
      confidence_rating_1to7: "",
    });
    save(KEY_RESULTS, results);

    // The row is saved already; the rating screen fills in its last columns.
    s.active = false;
    s.rating = { task_id: t.id, kind };
    save(KEY_SESSION, s);
    hideTaskbar();
    testRatingScreen();
  }

  // Add fields to one of this session's saved result rows.
  function updateRow(taskId, fields) {
    const s = testSession;
    const results = load(KEY_RESULTS, []);
    results.forEach((r) => {
      if (r.participant === s.participant && r.session_start === s.session_start && r.task_id === taskId) Object.assign(r, fields);
    });
    save(KEY_RESULTS, results);
  }

  function ratingScale(name, question, low, high) {
    return `<fieldset class="rating"><legend>${question}</legend>
      <div class="rating-row"><span>${low}</span>
        ${[1, 2, 3, 4, 5, 6, 7].map((n) =>
          `<label><input type="radio" name="${name}" value="${n}" required><span>${n}</span></label>`).join("")}
        <span>${high}</span></div></fieldset>`;
  }

  // After every task: an ease rating, plus a confidence rating unless they gave up.
  function testRatingScreen() {
    const s = testSession;
    const gaveUp = s.rating.kind === "gave_up";
    showOverlay(`<p>Task ${s.idx + 1} of ${s.order.length} finished</p>
      <form id="rating-form">
        ${ratingScale("ease", "Overall, how difficult or easy was this task?", "Very difficult", "Very easy")}
        ${gaveUp ? "" : ratingScale("confidence", "How confident are you that you found what the task asked for?", "Not at all confident", "Very confident")}
        <button type="submit">Continue</button>
      </form>`);
    $("#rating-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const picked = (name) => { const el = $(`input[name="${name}"]:checked`, overlay); return el ? Number(el.value) : ""; };
      updateRow(s.rating.task_id, {
        ease_rating_1to7: picked("ease"),
        confidence_rating_1to7: gaveUp ? "" : picked("confidence"),
      });
      s.rating = null;
      s.idx++;
      if (s.idx >= s.order.length) {
        remove(KEY_SESSION);
        testSession = null;
        showOverlay(`<h1>All done</h1><p>Thank you! Your responses have been saved.</p>`);
      } else {
        save(KEY_SESSION, s);
        testTaskIntro();
      }
    });
  }

  function initTest() {
    $("#site-footer").hidden = true;
    testSession = load(KEY_SESSION, null);
    if (testSession && !TASKS.length) testSession = null;
    if (!testSession) return testStartScreen();
    testSession = Object.assign({ clickTimes: [], undone: [], used: [] }, testSession);
    if (testSession.rating) testRatingScreen();
    else if (testSession.active) showTaskbar();
    else testTaskIntro();
  }

  // ---------- Results (?results) ----------
  const RESULT_COLS = ["participant", "participant_name", "session_start", "task_id", "task_order", "task_text", "target", "outcome",
    "score", "directness", "facets_correct_count", "facets_correct", "facets_missed", "filters_applied",
    "extra_filters_count", "extra_filters", "filters_undone_count", "filters_undone", "wrong_turns",
    "categorization_used", "finish_page", "finish_block", "first_click", "first_click_expected", "first_click_match",
    "click_path", "click_times_s", "click_count", "pages_visited", "venues_opened_count", "venues_opened", "backtracks",
    "reading_ms", "time_to_first_click_ms", "elapsed_ms", "ease_rating_1to7", "confidence_rating_1to7"];
  const TASK_COLS = RESULT_COLS.filter((c) => !["participant", "participant_name", "session_start"].includes(c));
  const PARTICIPANT_COLS = ["participant", "participant_name", "session_start", "status", "tasks_completed", "task_order", "mean_score",
    "success", "partial", "fail", "gave_up", "first_click_matches", "mean_ease", "mean_confidence", "total_clicks",
    "total_backtracks", "total_seconds"];

  function median(nums) {
    if (!nums.length) return null;
    const s = nums.slice().sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function viewResults() {
    document.title = "Tree test results";
    $("#site-header").hidden = true;
    $("#site-footer").hidden = true;
    const rows = load(KEY_RESULTS, []);
    const session = load(KEY_SESSION, null);
    const ids = [...new Set(rows.map((r) => r.task_id))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }));
    const pct = (n, d) => (d ? Math.round((100 * n) / d) + "%" : "");
    const mean = (rs, col) => {
      const nums = rs.map((r) => r[col]).filter((x) => typeof x === "number");
      return nums.length ? (nums.reduce((x, y) => x + y, 0) / nums.length).toFixed(1) : "";
    };
    const summary = ids.map((id) => {
      const rs = rows.filter((r) => r.task_id === id);
      const firsts = {};
      rs.forEach((r) => { firsts[r.first_click || "(none)"] = (firsts[r.first_click || "(none)"] || 0) + 1; });
      const top = Object.entries(firsts).sort((a, b) => b[1] - a[1])[0];
      const med = median(rs.map((r) => r.elapsed_ms));
      const scores = rs.map((r) => r.score).filter((x) => typeof x === "number");
      const misses = {};
      rs.forEach((r) => (r.facets_missed || "").split("; ").filter(Boolean).forEach((m) => { misses[m] = (misses[m] || 0) + 1; }));
      const topMiss = Object.entries(misses).sort((a, b) => b[1] - a[1])[0];
      return {
        task: id,
        participants: rs.length,
        mean_score: scores.length ? (scores.reduce((x, y) => x + y, 0) / scores.length).toFixed(2) : "",
        success: pct(rs.filter((r) => r.outcome === "success").length, rs.length),
        partial: pct(rs.filter((r) => r.outcome === "partial").length, rs.length),
        fail: pct(rs.filter((r) => r.outcome === "fail").length, rs.length),
        gave_up: pct(rs.filter((r) => r.outcome === "gave_up").length, rs.length),
        direct: pct(rs.filter((r) => r.directness === "direct").length, rs.length),
        mean_ease: mean(rs, "ease_rating_1to7"),
        mean_confidence: mean(rs, "confidence_rating_1to7"),
        most_missed_facet: topMiss ? `${topMiss[0]} (${topMiss[1]} of ${rs.length})` : "",
        median_seconds: med == null ? "" : (med / 1000).toFixed(1),
        top_first_click: top ? `${top[0]} (${top[1]} of ${rs.length})` : "",
        expected_first_click: rs[0] ? rs[0].first_click_expected : "",
      };
    });
    // One group per participant session, in the order the sessions were run.
    const groups = [];
    rows.forEach((r) => {
      const key = r.participant + "|" + r.session_start;
      let g = groups.find((x) => x.key === key);
      if (!g) groups.push(g = { key, participant: r.participant, name: r.participant_name || "", session_start: r.session_start, rows: [] });
      g.rows.push(r);
    });
    const sum = (rs, col) => rs.reduce((n, r) => n + (Number(r[col]) || 0), 0);
    const count = (rs, outcome) => rs.filter((r) => r.outcome === outcome).length;
    groups.forEach((g) => {
      g.rows.sort((a, b) => a.task_order - b.task_order);
      const scores = g.rows.map((r) => r.score).filter((x) => typeof x === "number");
      const firsts = g.rows.filter((r) => r.first_click_match);
      const running = session && session.participant === g.participant && session.session_start === g.session_start;
      g.summary = {
        participant: g.participant,
        participant_name: g.name,
        session_start: g.session_start,
        status: running ? "in progress" : g.rows.length >= TASKS.length ? "complete" : "incomplete",
        tasks_completed: `${g.rows.length} of ${TASKS.length}`,
        task_order: g.rows.map((r) => r.task_id).join(", "),
        mean_score: scores.length ? (scores.reduce((x, y) => x + y, 0) / scores.length).toFixed(2) : "",
        success: count(g.rows, "success"),
        partial: count(g.rows, "partial"),
        fail: count(g.rows, "fail"),
        gave_up: count(g.rows, "gave_up"),
        first_click_matches: firsts.length ? `${firsts.filter((r) => r.first_click_match === "yes").length} of ${firsts.length}` : "",
        mean_ease: mean(g.rows, "ease_rating_1to7"),
        mean_confidence: mean(g.rows, "confidence_rating_1to7"),
        total_clicks: sum(g.rows, "click_count"),
        total_backtracks: sum(g.rows, "backtracks"),
        total_seconds: (sum(g.rows, "elapsed_ms") / 1000).toFixed(1),
      };
    });
    // One row per participant, one column per task.
    const taskIds = TASKS.map((t) => t.id);
    const grid = groups.map((g) => {
      const row = { participant: g.participant, participant_name: g.name };
      taskIds.forEach((id) => {
        const r = g.rows.find((x) => x.task_id === id);
        row[id] = r ? r.outcome + (typeof r.score === "number" ? ` (${r.score})` : "") : "";
      });
      return row;
    });
    const participants = groups.length;

    app.innerHTML = `
      <h1>Tree test results</h1>
      <p class="muted">${rows.length} task result${rows.length === 1 ? "" : "s"} from ${participants} participant${participants === 1 ? "" : "s"}, stored in this browser.</p>
      <div class="actions">
        <button type="button" id="res-csv">Download CSV</button>
        <button type="button" id="res-json">Download JSON</button>
        <button type="button" id="res-clear">Clear all results</button>
        ${session ? `<button type="button" id="res-reset">Discard in-progress session (${esc(session.participant_name || session.participant)})</button>` : ""}
        <a class="nav-btn" href="./?test">Start a test</a>
        <a class="nav-btn" href="./">Normal site</a>
      </div>
      <h2>Summary by task</h2>
      ${table(summary, ["task", "participants", "mean_score", "success", "partial", "fail", "gave_up", "direct", "mean_ease", "mean_confidence", "most_missed_facet", "median_seconds", "top_first_click", "expected_first_click"])}
      <h2 style="margin-top:24px">Summary by participant</h2>
      ${table(groups.map((g) => g.summary), PARTICIPANT_COLS)}
      <h2 style="margin-top:24px">Participant by task</h2>
      ${table(grid, ["participant", "participant_name", ...taskIds])}
      <h2 style="margin-top:24px">Results by participant</h2>
      ${groups.length ? groups.map((g) => `
        <h3>Participant ${esc(g.participant)}${g.name ? `: ${esc(g.name)}` : ""}</h3>
        <p class="muted">${esc(g.summary.status)}, ${esc(g.summary.tasks_completed)} tasks, in the order they were shown. Started ${esc(g.session_start)}.</p>
        ${table(g.rows, TASK_COLS)}`).join("") : `<p class="empty">Nothing recorded yet.</p>`}`;
    // Export file name: the most recent participant's number, plus how many others are in the file.
    const last = groups[groups.length - 1];
    const fileName = ["tree-test-results", ...(last ? [last.participant] : []),
      ...(groups.length > 1 ? [`and-${groups.length - 1}-more`] : [])]
      .map((part) => String(part).trim().replace(/[\\/:*?"<>|\s]+/g, "-")).filter(Boolean).join("-");
    $("#res-csv").onclick = () => download(`${fileName}.csv`, toCSV(rows, RESULT_COLS), "text/csv");
    $("#res-json").onclick = () => download(`${fileName}.json`, JSON.stringify(rows.map((r) => Object.fromEntries(RESULT_COLS.map((c) => [c, r[c] ?? ""]))), null, 2), "application/json");
    $("#res-clear").onclick = () => {
      if (confirm("Delete all tree-test results in this browser? Download them first if you need them.")) {
        remove(KEY_RESULTS); viewResults();
      }
    };
    if (session) $("#res-reset").onclick = () => {
      if (confirm("Discard the unfinished session? Its completed tasks stay in the results.")) {
        remove(KEY_SESSION); viewResults();
      }
    };
  }

  // ---------- Boot ----------
  if (MODE === "results") {
    viewResults();
    return;
  }
  buildNav();
  initRecording();
  window.addEventListener("hashchange", render);
  window.addEventListener("resize", syncExploreHeight);
  if (MODE === "test") initTest();
  render();
})();
