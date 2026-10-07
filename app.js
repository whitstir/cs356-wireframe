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
    document.documentElement.style.setProperty("--explore-h", Math.max(320, window.innerHeight - top - 16) + "px");
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
    return `<label class="check"><input type="checkbox" data-f="${group}" value="${esc(value)}"${checked ? " checked" : ""}><span>${esc(label)}</span></label>`;
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
              ${CITIES.map((c) => `<option${st.city === c ? " selected" : ""}>${esc(c)}</option>`).join("")}
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
    const update = () => {
      const s = fromDom();
      const list = VENUES.filter((v) => matches(v, s));
      $("#results-count").textContent = `Showing ${list.length} of ${VENUES.length} venues`;
      $("#results").innerHTML = venueList(list);
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
      const text = el.closest("label") ? el.closest("label").textContent.trim() : el.value;
      return `${text}: ${el.checked ? "on" : "off"}`;
    }
    if (el.matches("input[type=range]")) {
      const n = Number(el.value);
      return `${el.getAttribute("aria-label")}: ${el.dataset.fmt === "p" ? priceText(n) : capText(n)}`;
    }
    if (el.tagName === "SELECT") {
      return `${el.getAttribute("aria-label") || "Select"}: ${el.selectedOptions[0] ? el.selectedOptions[0].text : ""}`;
    }
    if (el.dataset.log) return el.dataset.log;
    return (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
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

  function testStartScreen() {
    if (!TASKS.length) {
      showOverlay(`<h1>Tree test</h1>
        <p>No scenarios are set up yet. Add them to <code>data/tasks.js</code>, then reload this page.</p>
        <p><a href="./">Go to the normal site</a></p>`);
      return;
    }
    showOverlay(`<h1>Welcome</h1>
      <p>We are testing the website's structure, not you. There are no wrong answers.</p>
      <p>You'll get ${TASKS.length} short tasks. For each one, click through the site to where you think you'd find the answer. Please think aloud as you go.</p>
      <p>If you can't find it, press "I would give up". That is a useful result, not a failure.</p>
      <form id="start-form">
        <label for="pid">Participant ID</label>
        <input type="text" id="pid" required autocomplete="off">
        <button type="submit">Start</button>
      </form>`);
    $("#start-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const pid = $("#pid").value.trim();
      if (!pid) return;
      testSession = {
        participant: pid,
        session_start: new Date().toISOString(),
        order: shuffle(TASKS.map((t) => t.id)),
        idx: 0, active: false, taskStart: 0, path: [], visited: [], backtracks: 0,
      };
      save(KEY_SESSION, testSession);
      testTaskIntro();
    });
  }

  function testTaskIntro() {
    taskbar.hidden = true;
    syncExploreHeight();
    const t = taskById(testSession.order[testSession.idx]);
    showOverlay(`<p>Task ${testSession.idx + 1} of ${testSession.order.length}</p>
      <div class="scenario">${esc(t.text)}</div>
      <p class="muted">Press OK when you're ready. The site will open at the home page.</p>
      <button type="button" id="task-ok">OK, start</button>`);
    $("#task-ok").addEventListener("click", () => {
      Object.assign(testSession, { active: true, taskStart: Date.now(), path: [], visited: ["/"], backtracks: 0 });
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
      <p class="taskbar-text">Task ${testSession.idx + 1} of ${testSession.order.length}: ${esc(t.text)}</p>
      <button type="button" id="give-up">I would give up</button></div>`;
    taskbar.hidden = false;
    syncExploreHeight();
    $("#give-up").addEventListener("click", () => testFinish("gave_up", null));
  }

  function testOnRoute(r) {
    if (!testSession || !testSession.active) return;
    if (r.parts[0] === "venue") { testFinish("venue", r.parts[1]); return; }
    const key = r.path;
    const v = testSession.visited;
    if (v[v.length - 1] === key) return;
    if (v.includes(key)) testSession.backtracks++;
    v.push(key);
    save(KEY_SESSION, testSession);
  }

  function testFinish(kind, venueId) {
    const s = testSession;
    const t = taskById(s.order[s.idx]);
    const venue = venueId ? venueById(venueId) : null;
    const target = (t.target || "").trim();
    let outcome = "gave_up";
    if (kind === "venue") {
      outcome = !target ? "no_target_set"
        : venue && (venue.id === target || venue.name.toLowerCase() === target.toLowerCase()) ? "success" : "fail";
    }
    const targetVenue = venueById(target) || VENUES.find((x) => x.name.toLowerCase() === target.toLowerCase());
    const results = load(KEY_RESULTS, []);
    results.push({
      participant: s.participant,
      session_start: s.session_start,
      task_id: t.id,
      task_order: s.idx + 1,
      task_text: t.text,
      target: targetVenue ? targetVenue.name : target,
      outcome,
      finish_block: venue ? venue.name : "",
      first_click: s.path[0] || "",
      first_click_expected: t.expectedFirstClick || "",
      click_path: s.path.join(" > "),
      click_count: s.path.length,
      backtracks: s.backtracks,
      elapsed_ms: Date.now() - s.taskStart,
    });
    save(KEY_RESULTS, results);

    s.active = false;
    s.idx++;
    taskbar.hidden = true;
    syncExploreHeight();
    if (s.idx >= s.order.length) {
      remove(KEY_SESSION);
      testSession = null;
      showOverlay(`<h1>All done</h1><p>Thank you! Your responses have been saved.</p>`);
    } else {
      save(KEY_SESSION, s);
      testTaskIntro();
    }
  }

  function initTest() {
    $("#site-footer").hidden = true;
    testSession = load(KEY_SESSION, null);
    if (testSession && !TASKS.length) testSession = null;
    if (!testSession) return testStartScreen();
    if (testSession.active) showTaskbar();
    else testTaskIntro();
  }

  // ---------- Results (?results) ----------
  const RESULT_COLS = ["participant", "session_start", "task_id", "task_order", "task_text", "target", "outcome",
    "finish_block", "first_click", "first_click_expected", "click_path", "click_count", "backtracks", "elapsed_ms"];

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
    const summary = ids.map((id) => {
      const rs = rows.filter((r) => r.task_id === id);
      const firsts = {};
      rs.forEach((r) => { firsts[r.first_click || "(none)"] = (firsts[r.first_click || "(none)"] || 0) + 1; });
      const top = Object.entries(firsts).sort((a, b) => b[1] - a[1])[0];
      const med = median(rs.map((r) => r.elapsed_ms));
      return {
        task: id,
        participants: rs.length,
        success: pct(rs.filter((r) => r.outcome === "success").length, rs.length),
        wrong_venue: pct(rs.filter((r) => r.outcome === "fail").length, rs.length),
        gave_up: pct(rs.filter((r) => r.outcome === "gave_up").length, rs.length),
        median_seconds: med == null ? "" : (med / 1000).toFixed(1),
        top_first_click: top ? `${top[0]} (${top[1]} of ${rs.length})` : "",
        expected_first_click: rs[0] ? rs[0].first_click_expected : "",
      };
    });
    const participants = new Set(rows.map((r) => r.participant)).size;

    app.innerHTML = `
      <h1>Tree test results</h1>
      <p class="muted">${rows.length} task result${rows.length === 1 ? "" : "s"} from ${participants} participant${participants === 1 ? "" : "s"}, stored in this browser.</p>
      <div class="actions">
        <button type="button" id="res-csv">Download CSV</button>
        <button type="button" id="res-json">Download JSON</button>
        <button type="button" id="res-clear">Clear all results</button>
        ${session ? `<button type="button" id="res-reset">Discard in-progress session (${esc(session.participant)})</button>` : ""}
        <a class="nav-btn" href="./?test">Start a test</a>
        <a class="nav-btn" href="./">Normal site</a>
      </div>
      <h2>Summary by task</h2>
      ${table(summary, ["task", "participants", "success", "wrong_venue", "gave_up", "median_seconds", "top_first_click", "expected_first_click"])}
      <h2 style="margin-top:24px">All task results</h2>
      ${table(rows, RESULT_COLS)}`;
    $("#res-csv").onclick = () => download(`tree-test-results-${stamp()}.csv`, toCSV(rows, RESULT_COLS), "text/csv");
    $("#res-json").onclick = () => download(`tree-test-results-${stamp()}.json`, JSON.stringify(rows, null, 2), "application/json");
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
