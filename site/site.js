/* Utah County Wedding Venues — hi-fi site, built from the team's Figma design.
 * Data: ../data/venues.js (generated from data/venues.csv), ../data/tasks.js (test scenarios).
 * Same information architecture as the tested wireframe, updated by decisions D1–D7 and the
 * team's 2026-10-12/14 answers: Location/Style menus replace filters and offer Undo, Explore has an
 * always-visible filter sidebar, every card has a photo carousel, search matches every field that
 * has content, and every venue opens a full page.
 */
(function () {
  "use strict";

  // ---------- Data & constants ----------
  const alpha = (x, y) => x.localeCompare(y, "en", { sensitivity: "base" });
  const VENUES = (window.VENUES || []).slice().sort((x, y) => alpha(x.name, y.name));
  const BY_ID = Object.fromEntries(VENUES.map((v) => [v.id, v]));
  const TASKS = (window.TASKS || []).filter((t) => t.text && t.text.trim());
  const STYLES = ["Classic", "Luxury", "Modern", "Outdoors", "Rustic"];
  const CITIES = [...new Set(VENUES.map((v) => v.city).filter(Boolean))].sort(alpha);
  const AV = ["Microphone", "Projector", "Sound system", "TV"];
  const ACCESS = ["Accessible parking", "ADA restrooms", "Elevator", "Wheelchair accessible"];
  const FEATURES = ["Bridal room", "Cleanup crew", "Event coordinator", "Groom's room", "Indoors",
    "Linens included", "Outdoors", "Outside catering allowed", "Sparklers allowed"];
  const AESTHETICS = ["Centerpieces", "Ceremony arch / backdrop", "Draping / chair covers", "Fireplace", "Greenery / florals", "Signs / easels"];
  const LIGHTING = ["Candles / lanterns", "Chandeliers", "String / bistro lights"];
  const OTHER = ["Cake table", "Drink / beverage station", "Firepit", "Photo booth / backdrop", "Piano", "Sweetheart table"]; // D3: moved out of Decor
  const PMAX = 10000, PSTEP = 250, CMAX = 1000, CSTEP = 25;
  const FEATURED_ID = "the-bungalow-event-venue";

  const SEARCH = new URLSearchParams(location.search);
  const MODE = SEARCH.has("results") ? "results" : SEARCH.has("test") ? "test" : "normal";
  // Separate from the wireframe's keys (same origin), so the two sites never share logs or results.
  const KEY_LOG = "uc-hifi-clicklog";
  const KEY_RESULTS = "uc-hifi-tt-results";
  const KEY_SESSION = "uc-hifi-tt-session";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const app = $("#app"), overlay = $("#overlay"), taskbar = $("#taskbar"), testbar = $("#testbar");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const money = (n) => "$" + Number(n).toLocaleString("en-US");
  const priceText = (n) => (n >= PMAX ? money(PMAX) + "+" : money(n));
  const capText = (n) => (n >= CMAX ? CMAX + "+" : String(n));
  const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;

  function load(key, fallback) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch (e) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) { /* storage unavailable */ } }

  // ---------- Icons ----------
  const I = {
    chevL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
    undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    dash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></svg>',
    arch: '<svg class="arch" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V11a7 7 0 0 1 14 0v10"/><path d="M8.5 21v-9a3.5 3.5 0 0 1 7 0v9"/><path d="M3 21h18"/></svg>',
  };

  // ---------- Venue fields ----------
  // Every CSV column, with the label people see. Used for search (every field with content, Q4)
  // and for the Detailed information dropdown, which must show every field a venue has.
  const FIELD_LABELS = {
    "Venue Name": "Name", "Description": "Description", "City": "City", "Full Address": "Address",
    "Style": "The venue's own style words", "Standard Price Range": "Standard price range",
    "Packages and Prices": "Packages and prices", "Deposit Policy": "Deposit", "Seated Capacity": "Seated",
    "Standing Capacity": "Standing", "Time slots": "Time slots", "Length of Rental": "Length of rental",
    "outside/inside": "Indoor / outdoor", "Linens Included": "Linens included", "Other Decor Included": "Decor and furniture included",
    "Other Decor for Rent": "Decor for rent", "Prep Area": "Prep area", "Bride/Groom Rooms": "Bride and groom rooms",
    "extras": "Extras", "sound system": "Sound and A/V", "Event Coordinator": "Event coordinator", "cleanup crew": "Cleanup",
    "Catering": "Catering", "Alcohol policy": "Alcohol", "parking?": "Parking", "Accessibility": "Accessibility",
    "sparklers allowed": "Sparklers", "Restrictions": "Restrictions", "Important Notes": "Good to know",
    "Contact Information": "Contact", "link": "Website",
  };
  // Detailed information rows: concise groups, but every field (shown elsewhere on the page or not) is here.
  const DETAIL_GROUPS = [
    ["Pricing", ["Standard Price Range", "Packages and Prices", "Deposit Policy"]],
    ["Capacity & times", ["Seated Capacity", "Standing Capacity", "Time slots", "Length of Rental"]],
    ["Spaces & setup", ["outside/inside", "Bride/Groom Rooms", "Prep Area", "Linens Included", "Other Decor Included", "Other Decor for Rent"]],
    ["Services & extras", ["Event Coordinator", "cleanup crew", "sound system", "extras"]],
    ["Food & drink", ["Catering", "Alcohol policy"]],
    ["Getting there", ["parking?", "Accessibility"]],
    ["Rules & notes", ["sparklers allowed", "Restrictions", "Important Notes"]],
    ["Style", ["Style"]],
    ["Contact & location", ["Full Address", "City", "Contact Information", "link"]],
  ];
  const raw = (v, k) => ((v.raw && v.raw[k]) || "").trim();
  const lines = (t) => t.split("\n").map((l) => l.trim()).filter(Boolean);
  // A field "has information" unless it is blank, a plain no, or says the venue didn't state it.
  function hasInfo(t) {
    const s = t.trim().toLowerCase();
    return !!s && !["false", "no", "none", "n/a", "na", "-"].includes(s) && !s.includes("not stated") && !s.includes("stated on the") && !s.includes("no pricing information");
  }
  function fieldText(k, t) { return t === "TRUE" ? (k === "Linens Included" ? "Included" : "Yes") : t === "FALSE" ? "No" : t; }

  // ---------- Search: every field that has content (Q4) ----------
  VENUES.forEach((v) => {
    const fields = Object.keys(FIELD_LABELS).filter((k) => k !== "link").map((k) => [FIELD_LABELS[k], fieldText(k, raw(v, k))]).filter(([, t]) => hasInfo(t));
    const tags = [...v.styles, ...FEATURES.filter((k) => v.flags[k]), ...AV.filter((k) => v.av[k]), ...ACCESS.filter((k) => v.access[k]), ...Object.keys(v.decor)];
    v._search = [...fields, ["Filters", tags.join(", ")]].filter(([, t]) => t).map(([l, t]) => [l, t, t.toLowerCase()]);
  });
  const words = (q) => q.toLowerCase().split(/\s+/).filter(Boolean);
  const searchHit = (v, q) => words(q).every((w) => v._search.some(([, , low]) => low.includes(w)));
  const hitFields = (v, q) => { const ws = words(q); return v._search.filter(([, , low]) => ws.some((w) => low.includes(w))); };
  function highlight(text, q) {
    let s = esc(text);
    words(q).forEach((w) => { s = s.replace(new RegExp("(" + reEsc(esc(w)) + ")", "ig"), "<mark>$1</mark>"); });
    return s;
  }
  function snippet(v, q) {
    const ws = words(q), hits = hitFields(v, q);
    if (!ws.length || !hits.length) return "";
    const [label, text, low] = hits.find(([l]) => l !== "Filters") || hits[0];
    const flat = text.replace(/\s*\n\s*/g, " · "), at = flat.toLowerCase().indexOf(ws.find((w) => low.includes(w)));
    const start = Math.max(0, at - 40), end = Math.min(flat.length, Math.max(at, 0) + 70);
    const piece = (start > 0 ? "…" : "") + flat.slice(start, end) + (end < flat.length ? "…" : "");
    return `<b>${esc(label === "Filters" ? "Matched" : label)}:</b> ${highlight(piece, q)}`;
  }

  // ---------- Filter state ----------
  const ARRAYS = ["styles", "cities", "decor", "dmodes", "other", "omodes", "av", "access", "flags"];
  const URLKEYS = { styles: "s", cities: "city", decor: "d", dmodes: "dm", other: "o", omodes: "om", av: "av", access: "ac", flags: "f" };
  function fresh() { return { q: "", pmin: 0, pmax: PMAX, cmin: 0, cmax: CMAX, styles: [], cities: [], decor: [], dmodes: [], other: [], omodes: [], av: [], access: [], flags: [] }; }
  const clone = (st) => JSON.parse(JSON.stringify(st));
  function readState(q) {
    const st = fresh();
    const range = (k, max) => { const [a, b] = (q.get(k) || "").split("-").map(Number); return [Number.isFinite(a) ? a : 0, q.get(k) && Number.isFinite(b) ? b : max]; };
    [st.pmin, st.pmax] = range("p", PMAX);
    [st.cmin, st.cmax] = range("c", CMAX);
    ARRAYS.forEach((k) => { st[k] = (q.get(URLKEYS[k]) || "").split("|").filter(Boolean); });
    st.q = q.get("q") || "";
    return st;
  }
  function writeState(st) {
    const q = new URLSearchParams();
    if (st.q) q.set("q", st.q);
    if (st.pmin > 0 || st.pmax < PMAX) q.set("p", `${st.pmin}-${st.pmax}`);
    if (st.cmin > 0 || st.cmax < CMAX) q.set("c", `${st.cmin}-${st.cmax}`);
    ARRAYS.forEach((k) => st[k].length && q.set(URLKEYS[k], st[k].join("|")));
    return q.toString();
  }
  const exploreHash = (st) => { const qs = writeState(st); return "#/explore" + (qs ? "?" + qs : ""); };
  const priceOn = (st) => st.pmin > 0 || st.pmax < PMAX;
  const capOn = (st) => st.cmin > 0 || st.cmax < CMAX;

  function matches(v, st) {
    if (st.q && !searchHit(v, st.q)) return false;
    if (priceOn(st)) {
      if (v.priceMin == null) return false;
      const hi = st.pmax >= PMAX ? Infinity : st.pmax;
      if (!(v.priceMin <= hi && v.priceMax >= st.pmin)) return false;
    }
    if (capOn(st)) {
      if (v.seated == null) return false;
      const hi = st.cmax >= CMAX ? Infinity : st.cmax;
      if (v.seated < st.cmin || v.seated > hi) return false;
    }
    if (st.styles.length && !st.styles.some((s) => v.styles.includes(s))) return false;
    if (st.cities.length && !st.cities.includes(v.city)) return false;
    const dm = st.dmodes.length ? st.dmodes : ["included", "rent"];
    if (!st.decor.every((i) => (v.decor[i] || []).some((m) => dm.includes(m)))) return false;
    const om = st.omodes.length ? st.omodes : ["included", "rent"];
    if (!st.other.every((i) => (v.decor[i] || []).some((m) => om.includes(m)))) return false;
    if (!st.av.every((k) => v.av[k])) return false;
    if (!st.access.every((k) => v.access[k])) return false;
    if (!st.flags.every((k) => v.flags[k])) return false;
    return true;
  }
  const results = (st) => VENUES.filter((v) => matches(v, st));
  // Count beside an option: venues you'd see with it on. Style and City are either/or, so theirs is that option alone.
  function countWith(st, f, val) {
    const s = clone(st);
    if (f === "styles" || f === "cities") s[f] = [val]; else if (!s[f].includes(val)) s[f].push(val);
    return results(s).length;
  }
  function sectionActive(st, key) {
    if (key === "price") return priceOn(st) ? 1 : 0;
    if (key === "cap") return capOn(st) ? 1 : 0;
    return (st[key] || []).length;
  }
  function activeCount(st) {
    return ARRAYS.filter((k) => !k.endsWith("modes")).reduce((n, k) => n + st[k].length, 0) + (st.q ? 1 : 0) + (priceOn(st) ? 1 : 0) + (capOn(st) ? 1 : 0);
  }
  function chipsFor(st) {
    const out = [];
    if (st.q) out.push({ label: `Search: “${st.q}”`, f: "q" });
    if (priceOn(st)) out.push({ label: st.pmin === st.pmax ? `Price includes ${priceText(st.pmin)}` : `Price ${priceText(st.pmin)} – ${priceText(st.pmax)}`, f: "price" });
    if (capOn(st)) out.push({ label: `${capText(st.cmin)} – ${capText(st.cmax)} guests`, f: "cap" });
    st.cities.forEach((v) => out.push({ label: `City: ${v}`, f: "cities", v }));
    st.styles.forEach((v) => out.push({ label: `Style: ${v}`, f: "styles", v }));
    ["flags", "access", "av", "decor", "other"].forEach((f) => st[f].forEach((v) => out.push({ label: v, f, v })));
    return out;
  }
  function removeChip(st, f, v) {
    if (f === "q") st.q = "";
    else if (f === "price") { st.pmin = 0; st.pmax = PMAX; }
    else if (f === "cap") { st.cmin = 0; st.cmax = CMAX; }
    else st[f] = st[f].filter((x) => x !== v);
  }
  const PRESETS = {
    budget: { label: "Budget Venues", desc: "Venue rental from $2,000 or less", apply: (st) => { st.pmax = 2000; } },
    spacious: { label: "Spacious Venues", desc: "Seats 200 or more guests", apply: (st) => { st.cmin = 200; } },
    catering: { label: "Outside catering allowed", desc: "Bring your own caterer or family cooks", apply: (st) => { st.flags.push("Outside catering allowed"); } },
  };
  const presetState = (k) => { const st = fresh(); PRESETS[k].apply(st); return st; };

  // ---------- App state ----------
  const S = {
    st: fresh(),        // current Explore filters
    open: new Set(),    // open filter groups
    undo: null,         // { prev, label, summary } after Location/Style replaced filters (Q1)
    sort: "az",
    sideOpen: false,    // filter panel on narrow screens
    lastExplore: "#/explore",
    photo: {},          // carousel position per venue
  };
  // Filter groups start closed; only groups with a filter already set open (e.g. Price after "Budget Venues").
  function openActive(extra = []) { S.open = new Set([...GROUPS.map((g) => g.key).filter((k) => sectionActive(S.st, k)), ...extra]); }

  // ---------- Shared renderers ----------
  // Real photos come from ../data/photos.js, linked from each venue's own website (credited on the
  // venue page and on #/credits). A venue without photos keeps the placeholder look.
  const PHOTOS = window.PHOTOS || {};
  // Lead photo is the front if there is one, then the indoor (reception hall), then the outdoor.
  const KIND_ORDER = { front: 0, indoor: 1, outdoor: 2, extra: 3 };
  const shots = (v) => (PHOTOS[v.id] ? PHOTOS[v.id].photos.slice().sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) : []);
  const KIND_LABEL = { front: "Front of venue", indoor: "Reception hall", outdoor: "Outdoors", extra: "More of the venue" };
  function photoCount(v) {
    if (shots(v).length) return shots(v).length;
    let h = 0; for (const c of v.id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return 3 + (h % 3); // front + 2–4 more (D6)
  }
  const PHOTO_LABELS = ["Front of venue", "Reception hall", "Ceremony space", "Grounds", "Details"];
  const ph = (cap, cls = "") => `<div class="ph ${cls}" role="img" aria-label="Photo placeholder: ${esc(cap)}">${I.arch}<span class="cap">${esc(cap)}</span></div>`;
  // Photo i of venue v (real if available, otherwise the placeholder with the old caption).
  function pic(v, i, cls = "") {
    const s = shots(v)[i];
    if (!s) return ph(i === 0 ? "Front of venue" : PHOTO_LABELS[i] || "Photo", cls);
    return `<div class="ph photo ${cls}"><img src="${esc(s.src)}" alt="${esc(`${v.name}: ${KIND_LABEL[s.kind]}`)}" loading="lazy" referrerpolicy="no-referrer"></div>`;
  }
  const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url; } };
  const creditLink = (v) => PHOTOS[v.id] ? `<a href="${esc(PHOTOS[v.id].source)}" target="_blank" rel="noopener" data-log="Photo credit: ${esc(v.name)}">${esc(hostOf(PHOTOS[v.id].source))}</a>` : "";
  // A hot-linked photo the venue stops serving falls back to the placeholder background.
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName === "IMG" && img.parentElement && img.parentElement.classList.contains("photo")) {
      img.parentElement.classList.remove("photo"); img.parentElement.innerHTML = `${I.arch}<span class="cap">Photo unavailable</span>`;
    }
  }, true);
  function carousel(v) {
    const n = photoCount(v), i = S.photo[v.id] || 0;
    return `<div class="carousel" data-car="${v.id}">
      ${pic(v, i)}
      <button type="button" class="car-btn prev" data-act="photo" data-id="${v.id}" data-dir="-1" aria-label="Previous photo of ${esc(v.name)}" data-log="Photo back: ${esc(v.name)}">${I.chevL}</button>
      <button type="button" class="car-btn next" data-act="photo" data-id="${v.id}" data-dir="1" aria-label="Next photo of ${esc(v.name)}" data-log="Photo forward: ${esc(v.name)}">${I.chevR}</button>
      <div class="dots" aria-label="Photo ${i + 1} of ${n}">${Array.from({ length: n }, (_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
    </div>`;
  }
  const priceLine = (v) => (v.priceMin != null && v.priceText ? v.priceText.replace(/\s*-\s*/g, " – ") : "Price on request");
  const seatsLine = (v) => (v.seated != null ? `Seats ${lines(v.seatedText || String(v.seated))[0].replace(/\s*seated.*$/i, "").replace(/(\d)\s*-\s*(\d)/, "$1–$2")}` : "Seats not listed");
  function card(v, q = "") {
    return `<article class="card">
      ${carousel(v)}
      <div class="card-body">
        <p class="eyebrow">${esc(v.city || "City not listed")}</p>
        <a class="card-name" href="#/venue/${v.id}" data-log="Venue: ${esc(v.name)}">${esc(v.name)}</a>
        <p class="small muted" style="margin:0">${esc(v.styles.join(" · "))}</p>
        ${q ? `<p class="snip" style="margin:0">${snippet(v, q)}</p>` : ""}
        <div class="card-meta"><span>${esc(priceLine(v))}</span><span class="small muted">${esc(seatsLine(v))}</span></div>
      </div></article>`;
  }

  // ---------- Header menus & footer (categorization 1: Location / Style) ----------
  function buildChrome() {
    $("#menu-location").innerHTML = `<p class="eyebrow menu-head">Venues by city</p>` + CITIES.map((c) =>
      `<a href="${exploreHash({ ...fresh(), cities: [c] })}" data-nav="cities" data-v="${esc(c)}" data-log="Location: ${esc(c)}">${esc(c)} <span>${VENUES.filter((v) => v.city === c).length}</span></a>`).join("");
    $("#menu-style").innerHTML = `<p class="eyebrow menu-head">Venues by style</p>` + STYLES.map((s) =>
      `<a href="${exploreHash({ ...fresh(), styles: [s] })}" data-nav="styles" data-v="${s}" data-log="Style: ${s}">${s} <span>${VENUES.filter((v) => v.styles.includes(s)).length}</span></a>`).join("");
    const top = ["Provo", "Orem", "Lehi", "Alpine", "Spanish Fork"].filter((c) => CITIES.includes(c));
    $("#site-footer").innerHTML = `<div class="wrap footer-inner">
        <div class="footer-brand"><p class="display-l">Utah County</p><p class="small" style="margin:0;max-width:360px">${VENUES.length} reception venues from Alpine to Sundance, compared side by side.</p></div>
        <nav class="footer-col" aria-label="Location"><p class="eyebrow">Location</p>${top.map((c) => `<a href="${exploreHash({ ...fresh(), cities: [c] })}" data-nav="cities" data-v="${esc(c)}" data-log="Footer Location: ${esc(c)}">${esc(c)}</a>`).join("")}
          <a href="#/explore" data-fresh data-open="cities" data-log="Footer: All ${CITIES.length} cities">All ${CITIES.length} cities</a></nav>
        <nav class="footer-col" aria-label="Style"><p class="eyebrow">Style</p>${STYLES.map((s) => `<a href="${exploreHash({ ...fresh(), styles: [s] })}" data-nav="styles" data-v="${s}" data-log="Footer Style: ${s}">${s}</a>`).join("")}</nav>
        <nav class="footer-col" aria-label="Explore"><p class="eyebrow">Explore</p><a href="#/explore" data-fresh data-log="Footer: All venues">All venues</a>
          ${Object.entries(PRESETS).map(([k, p]) => `<a href="${exploreHash(presetState(k))}" data-preset="${k}" data-log="Footer popular search: ${esc(p.label)}">${esc(p.label)}</a>`).join("")}</nav>
      </div>
      <div class="wrap footer-base"><span>A CS 356 prototype · venue details and photos from each venue's official website · <a href="#/credits" data-log="Footer: Photo credits">Photo credits</a></span>${MODE === "normal" ? `<a href="#/log" data-log="Click log">Click log</a>` : ""}</div>`;
  }
  function closeMenus(except) {
    $$(".nav-link[data-menu]").forEach((b) => { if (b !== except) { b.setAttribute("aria-expanded", "false"); $("#" + b.getAttribute("aria-controls")).hidden = true; } });
  }
  function initMenus() {
    $$(".nav-link[data-menu]").forEach((b) => b.addEventListener("click", () => {
      const open = b.getAttribute("aria-expanded") !== "true";
      closeMenus(b);
      b.setAttribute("aria-expanded", String(open));
      $("#" + b.getAttribute("aria-controls")).hidden = !open;
    }));
    document.addEventListener("click", (e) => { if (!e.target.closest(".menu-wrap")) closeMenus(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMenus(); if (!overlay.hidden && overlay.dataset.dismiss) hideOverlay(); } });
    attachSuggest($("#header-search"), $("#header-q"), "Header search");
  }
  // A submitted search becomes filters where it can (a price, a guest count, an exact filter name),
  // and a text search over every venue detail otherwise.
  function runSearch(q, where) {
    q = q.trim();
    record(null, "search", `${where}: ${q || "(empty)"}`, "Search");
    S.st = interpret(q); S.undo = null; openActive();
    go(exploreHash(S.st));
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  // ---------- Search understanding & suggestions ----------
  // Every filterable option, with the Explore group it lives in.
  const OPTIONS = [
    ...STYLES.map((v) => ({ f: "styles", v, group: "Style" })),
    ...CITIES.map((v) => ({ f: "cities", v, group: "City" })),
    ...FEATURES.map((v) => ({ f: "flags", v, group: "Features" })),
    ...ACCESS.map((v) => ({ f: "access", v, group: "Accessibility options" })),
    ...AV.map((v) => ({ f: "av", v, group: "Audio/Visual" })),
    ...[...AESTHETICS, ...LIGHTING].map((v) => ({ f: "decor", v, group: "Decor" })),
    ...OTHER.map((v) => ({ f: "other", v, group: "Other" })),
  ];
  // Everyday words people type, pointed at the filter that means it.
  const SYNONYMS = {
    barn: ["styles", "Rustic"], farm: ["styles", "Rustic"], country: ["styles", "Rustic"], ranch: ["styles", "Rustic"],
    elegant: ["styles", "Classic"], traditional: ["styles", "Classic"], timeless: ["styles", "Classic"], ballroom: ["styles", "Classic"],
    fancy: ["styles", "Luxury"], upscale: ["styles", "Luxury"], luxurious: ["styles", "Luxury"], "high end": ["styles", "Luxury"], "high-end": ["styles", "Luxury"],
    sleek: ["styles", "Modern"], contemporary: ["styles", "Modern"], minimalist: ["styles", "Modern"], minimal: ["styles", "Modern"], industrial: ["styles", "Modern"],
    garden: ["styles", "Outdoors"], outside: ["flags", "Outdoors"], outdoor: ["flags", "Outdoors"], nature: ["styles", "Outdoors"],
    inside: ["flags", "Indoors"], indoor: ["flags", "Indoors"],
    wheelchair: ["access", "Wheelchair accessible"], handicap: ["access", "Wheelchair accessible"], accessible: ["access", "Wheelchair accessible"], ada: ["access", "ADA restrooms"],
    music: ["av", "Sound system"], dj: ["av", "Sound system"], speakers: ["av", "Sound system"], mic: ["av", "Microphone"], slideshow: ["av", "Projector"], screen: ["av", "Projector"],
    cake: ["other", "Cake table"], fire: ["other", "Firepit"], "s'mores": ["other", "Firepit"], smores: ["other", "Firepit"], drinks: ["other", "Drink / beverage station"], bar: ["other", "Drink / beverage station"], photobooth: ["other", "Photo booth / backdrop"],
    flowers: ["decor", "Greenery / florals"], florals: ["decor", "Greenery / florals"], lights: ["decor", "String / bistro lights"], candles: ["decor", "Candles / lanterns"], arch: ["decor", "Ceremony arch / backdrop"],
    caterer: ["flags", "Outside catering allowed"], catering: ["flags", "Outside catering allowed"], food: ["flags", "Outside catering allowed"], coordinator: ["flags", "Event coordinator"], planner: ["flags", "Event coordinator"],
    cleanup: ["flags", "Cleanup crew"], linens: ["flags", "Linens included"], tablecloths: ["flags", "Linens included"], sparkler: ["flags", "Sparklers allowed"], "bridal suite": ["flags", "Bridal room"],
  };
  const PRESET_WORDS = { budget: ["budget", "cheap", "affordable", "inexpensive", "low cost"], spacious: ["spacious", "big", "large", "huge", "lots of guests"], catering: ["catering", "caterer", "bring our own food", "own food"] };
  const HELP_RE = /^\s*(help|\?+|how\b|what\b|where\b|which\b|can you|could you|i need|i want|i'?m looking|not sure|idk|i don'?t know|where do i|how do i)|\bhelp\b|\?\s*$/i;
  const isHelp = (q) => HELP_RE.test(q) && !parseAmounts(q).length;

  // Prices and guest counts typed as words: "under $2,000", "$2k-$4k", "$2500", "150 guests", "at least 200 people".
  const num = (s, k) => { const n = parseFloat(String(s).replace(/[,$\s]/g, "")); return Number.isFinite(n) ? Math.round(k ? n * 1000 : n) : null; };
  // Reads up to one price and one guest count, each judged by the words right around it.
  function parseAmounts(q) {
    const out = [];
    let t = q.toLowerCase();
    for (let i = 0; i < 2; i++) {
      const a = parseOne(t);
      if (!a || out.some((x) => x.kind === a.kind)) break;
      out.push(a);
      t = t.replace(a.text, " ");
    }
    return out;
  }
  function parseOne(t) {
    const guestWord = /(guests?|people|persons|ppl|seats?|seated|capacity|attendees|heads)/;
    const priceWord = /(\$|dollars?|price|budget|cost|spend|\dk\b)/;
    const N = String.raw`\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?`;
    const near = (m) => t.slice(Math.max(0, m.index - 14), m.index + m[0].length);
    const kindOf = (m, n) => {
      const own = m[0], f = near(m);
      if (guestWord.test(own)) return "cap";
      if (priceWord.test(own)) return "price";
      return guestWord.test(f) ? "cap" : priceWord.test(f) ? "price" : n >= 1000 ? "price" : "cap";
    };
    let m;
    if ((m = t.match(new RegExp(String.raw`(?:between\s+)?${N}\s*(?:-|–|to|and)\s*${N}\s*([a-z$]*)`, "i")))) {
      const a = num(m[1], m[2]), b = num(m[3], m[4]);
      if (a != null && b != null) return { kind: kindOf(m, Math.max(a, b)), lo: Math.min(a, b), hi: Math.max(a, b), text: m[0] };
    }
    if ((m = t.match(new RegExp(String.raw`(under|below|less than|up to|max(?:imum)?|no more than|at most|within|<)\s*${N}\s*([a-z$]*)`, "i")))) {
      const n = num(m[2], m[3]); if (n != null) return { kind: kindOf(m, n), lo: 0, hi: n, text: m[0] };
    }
    if ((m = t.match(new RegExp(String.raw`(over|above|more than|at least|min(?:imum)?|>|\bfor)\s*${N}\s*([a-z$]*)`, "i")))) {
      const n = num(m[2], m[3]); if (n != null) { const kind = kindOf(m, n); return { kind, lo: n, hi: kind === "price" ? PMAX : CMAX, text: m[0], open: true }; }
    }
    if ((m = t.match(new RegExp(String.raw`${N}\s*([a-z$]*)`, "i")))) {
      // A single amount: a price inside the venue's range, or a guest count the venue can seat.
      const n = num(m[1], m[2]);
      if (n != null) { const kind = kindOf(m, n); return kind === "price" ? { kind, lo: n, hi: n, text: m[0] } : { kind, lo: n, hi: CMAX, text: m[0], open: true }; }
    }
    return null;
  }
  function amountLabel(a) {
    if (a.kind === "price") return a.lo === a.hi ? `Price includes ${money(a.lo)}` : a.lo === 0 ? `Price up to ${money(a.hi)}` : a.hi >= PMAX ? `Price from ${money(a.lo)}` : `Price ${money(a.lo)} – ${money(a.hi)}`;
    return a.lo === 0 ? `Seats up to ${a.hi} guests` : a.hi >= CMAX ? `Seats ${a.lo}+ guests` : `Seats ${a.lo}–${a.hi} guests`;
  }
  function applyAmount(st, a) { if (a.kind === "price") { st.pmin = a.lo; st.pmax = a.hi; } else { st.cmin = a.lo; st.cmax = a.hi; } }
  const FILLER = /\b(a|an|the|venues?|place|places|with|for|in|near|that|has|have|and|of|our|my|we|wedding|reception|guests?|people|price|budget|dollars?)\b/g;
  function exactOption(text) {
    const t = text.toLowerCase().trim();
    if (!t) return null;
    const hits = OPTIONS.filter((o) => o.v.toLowerCase() === t);
    if (hits.length === 1) return hits[0];
    const syn = SYNONYMS[t];
    return syn && hits.length === 0 ? OPTIONS.find((o) => o.f === syn[0] && o.v === syn[1]) : null;
  }
  function interpret(q) {
    const st = fresh();
    if (!q) return st;
    let rest = q;
    parseAmounts(q).forEach((a) => { applyAmount(st, a); rest = rest.replace(new RegExp(reEsc(a.text), "i"), " "); });
    if (rest !== q) rest = rest.toLowerCase().replace(FILLER, " ").replace(/[^\w\s'/&-]/g, " ").replace(/\s+/g, " ").trim();
    const opt = exactOption(rest);
    if (opt) st[opt.f] = [opt.v];
    else if (rest.trim()) st.q = rest.trim();
    return st;
  }
  // Edit distance, for small typos ("rustik", "provoo").
  function editDistance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function optionScore(label, q) {
    const l = label.toLowerCase(), t = q.toLowerCase().trim();
    if (!t) return 0;
    if (l === t) return 100;
    if (l.startsWith(t)) return 85;
    const lw = l.split(/[\s/]+/).filter(Boolean), tw = t.split(/\s+/).filter(Boolean);
    if (lw.some((w) => w.startsWith(t))) return 75;
    if (t.length >= 3 && l.includes(t)) return 60;
    if (tw.length > 1 && tw.every((w) => l.includes(w))) return 55;
    if (t.length >= 4 && lw.some((w) => w.length >= 4 && editDistance(w, t) <= (t.length >= 7 ? 2 : 1))) return 40;
    return 0;
  }
  const countOf = (mod) => { const st = fresh(); mod(st); return results(st).length; };
  // Suggestions for what someone has typed so far. Each item says what it does and how many venues it shows.
  function suggestions(q, limit = 8) {
    const t = q.trim();
    if (!t) return [];
    if (isHelp(t)) return [{ type: "help" }];
    const items = [];
    parseAmounts(t).forEach((a) => items.push({ type: "amount", a, label: amountLabel(a), group: a.kind === "price" ? "Price" : "Capacity", n: countOf((st) => applyAmount(st, a)), score: 120 }));
    const low = t.toLowerCase(), seen = new Set();
    const addOpt = (o, score) => { const key = o.f + "|" + o.v; if (seen.has(key)) return; seen.add(key); items.push({ type: "filter", f: o.f, v: o.v, label: o.v, group: o.group, n: countOf((st) => { st[o.f] = [o.v]; }), score }); };
    OPTIONS.forEach((o) => { const sc = optionScore(o.v, t); if (sc) addOpt(o, sc); });
    Object.entries(SYNONYMS).forEach(([w, [f, v]]) => { if (w === low || (low.length >= 3 && w.startsWith(low)) || low.split(/\s+/).includes(w)) addOpt(OPTIONS.find((o) => o.f === f && o.v === v), 70); });
    Object.entries(PRESET_WORDS).forEach(([k, ws]) => { if (ws.some((w) => w.includes(low) && low.length >= 3 || low.includes(w))) items.push({ type: "preset", k, label: PRESETS[k].label, group: "Popular search", n: results(presetState(k)).length, score: 65 }); });
    VENUES.forEach((v) => { const sc = optionScore(v.name, t); if (sc >= 55) items.push({ type: "venue", id: v.id, label: v.name, group: "Venue", sub: v.city, score: sc - 5 }); });
    items.sort((a, b) => b.score - a.score || (b.n || 0) - (a.n || 0));
    const top = items.slice(0, limit - 1);
    const textN = results({ ...fresh(), q: t }).length;
    if (textN || !top.length) top.push({ type: "search", q: t, label: `Search every detail for “${t}”`, group: "Search", n: textN });
    return top;
  }
  function applySuggestion(it) {
    if (it.type === "venue") return go("#/venue/" + it.id);
    if (it.type === "search") return runSearch(it.q, "Suggestion search");
    let st = fresh();
    if (it.type === "amount") applyAmount(st, it.a);
    else if (it.type === "filter") st[it.f] = [it.v];
    else if (it.type === "preset") st = presetState(it.k);
    S.st = st; S.undo = null; openActive();
    go(exploreHash(st));
  }
  const HELP_TIPS = [
    { label: "Type a budget", eg: "under $2,000", type: "amount", a: { kind: "price", lo: 0, hi: 2000 } },
    { label: "Type how many guests", eg: "150 guests", type: "amount", a: { kind: "cap", lo: 150, hi: CMAX, open: true } },
    { label: "Type a city", eg: "Provo", type: "filter", f: "cities", v: "Provo" },
    { label: "Type a feel", eg: "rustic, modern, garden", type: "filter", f: "styles", v: "Rustic" },
    { label: "Type something you want there", eg: "firepit, piano, sparklers", type: "filter", f: "other", v: "Firepit" },
    { label: "Not sure yet?", eg: "Browse every venue", type: "all" },
  ];
  function helpHtml(inDropdown) {
    return `<div class="help${inDropdown ? " in-dd" : ""}"><p class="eyebrow">Ways to search</p>
      <p class="small muted" style="margin:0 0 8px">Search understands budgets, guest counts, places, styles and anything a venue lists. Try one of these:</p>
      <div class="help-grid">${HELP_TIPS.map((h, i) => `<button type="button" class="help-tip" data-help="${i}" data-log="Help tip: ${esc(h.label)}"><span class="label">${esc(h.label)}</span><span class="small muted">e.g. ${esc(h.eg)}</span></button>`).join("")}</div></div>`;
  }
  function applyHelp(i) {
    const h = HELP_TIPS[i];
    if (h.type === "all") { S.st = fresh(); S.undo = null; openActive(); return go("#/explore"); }
    applySuggestion(h.type === "amount" ? { type: "amount", a: h.a } : { type: "filter", f: h.f, v: h.v });
  }
  function suggestionButton(it, i, active) {
    if (it.type === "help") return helpHtml(true);
    const icon = it.type === "venue" ? "Venue" : it.group;
    return `<li role="option" id="sg-${i}" class="sg${active ? " active" : ""}" aria-selected="${active}" data-sg="${i}" data-log="Suggestion: ${esc(it.label)}">
      <span class="sg-label">${esc(it.label)}</span><span class="sg-meta">${esc(icon)}${it.sub ? " · " + esc(it.sub) : ""}${it.n != null ? ` · ${plural(it.n, "venue")}` : ""}</span></li>`;
  }
  // Type-ahead under a search box. Arrow keys move, Enter picks, Escape closes.
  function attachSuggest(form, input, where) {
    const box = document.createElement("div");
    box.className = "suggest"; box.hidden = true; box.id = input.id + "-suggest";
    form.appendChild(box);
    input.setAttribute("role", "combobox"); input.setAttribute("aria-autocomplete", "list"); input.setAttribute("aria-expanded", "false"); input.setAttribute("aria-controls", box.id);
    let items = [], active = -1;
    const draw = () => {
      items = suggestions(input.value);
      if (!items.length) { box.hidden = true; input.setAttribute("aria-expanded", "false"); return; }
      box.innerHTML = items[0].type === "help" ? helpHtml(true) : `<ul role="listbox" aria-label="Suggestions">${items.map((it, i) => suggestionButton(it, i, i === active)).join("")}</ul>`;
      box.hidden = false; input.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-activedescendant", active >= 0 ? "sg-" + active : "");
    };
    const close = () => { box.hidden = true; active = -1; input.setAttribute("aria-expanded", "false"); };
    const pick = (i) => { const it = items[i]; close(); input.blur(); if (it.type !== "search") record(null, "click", `Suggestion: ${it.label}`, it.type === "venue" ? "Search" : "Search suggestion"); applySuggestion(it); };
    input.addEventListener("input", () => { active = -1; draw(); });
    input.addEventListener("focus", () => { if (input.value.trim()) draw(); });
    input.addEventListener("keydown", (e) => {
      if (box.hidden || items[0]?.type === "help") { if (e.key === "Escape") close(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % items.length; draw(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + items.length) % items.length; draw(); }
      else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(active); }
      else if (e.key === "Escape") close();
    });
    box.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus in the input while clicking
    box.addEventListener("click", (e) => {
      const sg = e.target.closest("[data-sg]"), hp = e.target.closest("[data-help]");
      if (sg) pick(Number(sg.dataset.sg));
      else if (hp) { close(); applyHelp(Number(hp.dataset.help)); }
    });
    const outside = (e) => { if (!form.isConnected) return document.removeEventListener("click", outside); if (!form.contains(e.target)) close(); };
    document.addEventListener("click", outside);
    form.addEventListener("submit", (e) => { e.preventDefault(); if (isHelp(input.value)) { draw(); return; } close(); runSearch(input.value, where); input.blur(); });
  }
  // What the results area offers when nothing matches, or when someone asked for help.
  function emptyHtml(st) {
    if (st.q && isHelp(st.q)) return `<div class="empty-panel">${helpHtml(false)}</div>`;
    const parts = [];
    if (st.q) {
      const sg = suggestions(st.q, 7).filter((it) => it.type !== "search" && it.type !== "help" && (it.n == null || it.n > 0));
      parts.push(`<h3 class="heading-s">No venues match “${esc(st.q)}”${activeCount(st) > 1 ? " with these filters" : ""}</h3>`);
      if (sg.length) parts.push(`<p class="small muted" style="margin:0">Did you mean one of these?</p><div class="sg-chips">${sg.map((it, i) => `<button type="button" class="sg-chip" data-esg="${i}" data-log="No-results suggestion: ${esc(it.label)}">${esc(it.label)} <span>${esc(it.group)}${it.n != null ? " · " + it.n : ""}</span></button>`).join("")}</div>`);
      S.emptySuggest = sg;
    } else {
      parts.push(`<h3 class="heading-s">No venues match all of these filters</h3>`);
      S.emptySuggest = [];
    }
    // Which single filter, if removed, brings venues back.
    const loosen = chipsFor(st).map((c) => { const s2 = clone(st); removeChip(s2, c.f, c.v); return { c, n: results(s2).length }; }).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 4);
    if (loosen.length) parts.push(`<p class="small muted" style="margin:8px 0 0">Or remove a filter:</p><div class="sg-chips">${loosen.map((x) => `<button type="button" class="sg-chip" data-act="unchip" data-f="${x.c.f}" data-v="${esc(x.c.v || "")}" data-log="No-results: remove ${esc(x.c.label)}">Remove ${esc(x.c.label)} <span>${plural(x.n, "venue")}</span></button>`).join("")}</div>`);
    parts.push(`<p class="small muted" style="margin:8px 0 0">Popular searches:</p><div class="sg-chips">${Object.entries(PRESETS).map(([k, p]) => `<a class="sg-chip" href="${exploreHash(presetState(k))}" data-preset="${k}" data-log="No-results popular search: ${esc(p.label)}">${esc(p.label)} <span>${results(presetState(k)).length}</span></a>`).join("")}</div>`);
    return `<div class="empty-panel">${parts.join("")}</div>`;
  }

  // Clicks on links that set filters: Location/Style replace the current filters and offer Undo (Q1, draft B).
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-nav], a[data-preset], a[data-fresh]");
    if (!a) return;
    e.preventDefault();
    closeMenus();
    if (a.dataset.nav) {
      const prev = S.lastState || fresh(), label = (a.dataset.nav === "cities" ? "City: " : "Style: ") + a.dataset.v;
      const st = fresh(); st[a.dataset.nav] = [a.dataset.v];
      S.undo = activeCount(prev) && writeState(prev) !== writeState(st) ? { prev: clone(prev), label, summary: chipsFor(prev).map((c) => c.label).join(", ") } : null;
      S.st = st; openActive();
    } else if (a.dataset.preset) {
      S.st = presetState(a.dataset.preset); S.undo = null; openActive();
    } else {
      S.st = fresh(); S.undo = null; openActive(a.dataset.open ? [a.dataset.open] : []);
    }
    S.fromLink = true;
    go(exploreHash(S.st));
  });

  // ---------- Routing ----------
  function parseHash() {
    const rawHash = location.hash.replace(/^#/, "") || "/";
    const [path, q = ""] = rawHash.split("?");
    return { path: path || "/", parts: path.split("/").filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(q) };
  }
  function render() {
    const r = parseHash(), [section, arg] = r.parts;
    closeMenus();
    if (section !== "explore") S.undo = null;
    if (!section) viewHome();
    else if (section === "explore") viewExplore(r.query);
    else if (section === "venue" && BY_ID[arg]) viewVenue(BY_ID[arg]);
    else if (section === "credits") viewCredits();
    else if (section === "log" && MODE === "normal") viewLog();
    else viewNotFound();
    $("#header-q").value = section === "explore" ? S.st.q : "";
    window.scrollTo(0, 0);
    if (MODE === "test") testOnRoute(r);
  }

  // ---------- Home ----------
  function viewHome() {
    document.title = "Utah County Wedding Venues";
    const feat = BY_ID[FEATURED_ID] || VENUES[0];
    // Each style tile shows the front photo of a different venue that has that style.
    const used = new Set([feat.id]), cover = {};
    STYLES.forEach((s) => {
      const v = VENUES.find((x) => x.styles.includes(s) && shots(x).length && shots(x)[0].kind === "front" && !used.has(x.id));
      if (v) { used.add(v.id); cover[s] = v; }
    });
    app.innerHTML = `
      <section class="wrap hero">
        <div>
          <h1 class="display-xl">A beautiful place<br>to <span class="accent">begin.</span></h1>
          <form class="big-search" id="home-search" role="search">${I.search}
            <input id="home-q" type="search" placeholder="Try “firepit”, “piano”, “outside catering”…" aria-label="Search every venue detail" autocomplete="off">
            <button class="btn btn-accent" data-log="Home search button">Search ${I.chevR}</button>
          </form>
        </div>
        <div class="hero-photo">
          <span class="ring" aria-hidden="true"></span>
          ${shots(feat).length ? pic(feat, 0) : ph("Featured venue photo")}
          <a class="featured" href="#/venue/${feat.id}" data-log="Featured: ${esc(feat.name)}"><span class="eyebrow">Featured · ${esc(feat.city)}</span><span class="heading-s">${esc(feat.name)}</span></a>
        </div>
      </section>
      <section class="band-cream section" aria-labelledby="pop-h">
        <div class="wrap">
          <div class="section-head">
            <div><p class="eyebrow">Popular searches</p><h2 class="display-l" id="pop-h">Start with a <span class="accent">shortcut</span></h2></div>
            <a class="link-arrow" href="#/explore" data-fresh data-log="Explore all venues (home)">Explore all ${VENUES.length} venues ${I.arrow}</a>
          </div>
          <div class="pop-grid">${Object.entries(PRESETS).map(([k, p]) => `
            <a class="pop-card" href="${exploreHash(presetState(k))}" data-preset="${k}" data-log="Popular search: ${esc(p.label)}">
              <span class="pop-num">${results(presetState(k)).length}</span>
              <span class="txt"><h3 class="heading-s">${esc(p.label)}</h3><span class="small muted">${esc(p.desc)}</span></span>
              <svg class="arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a>`).join("")}</div>
        </div>
      </section>
      <section class="section" aria-labelledby="style-h">
        <div class="wrap">
          <div class="section-head"><div><p class="eyebrow">Browse by style</p><h2 class="display-l" id="style-h">Find your <span class="accent">aesthetic</span></h2></div></div>
          <div class="style-grid">${STYLES.map((s) => `
            <a class="style-tile" href="${exploreHash({ ...fresh(), styles: [s] })}" data-nav="styles" data-v="${s}" data-log="Style: ${s}">
              ${cover[s] ? pic(cover[s], 0) : ph(s + " photo")}<span class="cap-wrap"><span class="heading-m">${s}</span><span class="label">${plural(VENUES.filter((v) => v.styles.includes(s)).length, "venue")}</span></span></a>`).join("")}</div>
          <p class="small muted note-line">A venue can carry more than one style, so you will see some favorites in several places.</p>
        </div>
      </section>`;
    attachSuggest($("#home-search"), $("#home-q"), "Home search");
  }

  // ---------- Explore (categorization 2: faceted filters) ----------
  function checks(st, f, list, withCount = true) {
    return list.map((val) => {
      const on = st[f].includes(val), n = withCount ? countWith(st, f, val) : null;
      return `<label class="check ${n === 0 && !on ? "zero" : ""}"><input type="checkbox" data-f="${f}" value="${esc(val)}"${on ? " checked" : ""}><span class="box" aria-hidden="true"></span><span class="lbl">${esc(val)}</span>${withCount ? `<span class="n" data-cnt="${f}|${esc(val)}">${n}</span>` : ""}</label>`;
    }).join("");
  }
  function modes(st, f) {
    return `<div class="modes"><span class="modes-label">Show items that are</span>${[["included", "Included"], ["rent", "For rent"]].map(([v, l]) =>
      `<label class="check"><input type="checkbox" data-f="${f}" value="${v}"${st[f].includes(v) ? " checked" : ""}><span class="box" aria-hidden="true"></span><span class="lbl">${l}</span></label>`).join("")}</div>`;
  }
  const fillStyle = (lo, hi, max) => `left:${(lo / max) * 100}%;width:${((hi - lo) / max) * 100}%`;
  function range(st, key) {
    const isP = key === "p", lo = isP ? st.pmin : st.cmin, hi = isP ? st.pmax : st.cmax, max = isP ? PMAX : CMAX, step = isP ? PSTEP : CSTEP, fmt = isP ? priceText : capText;
    const nm = isP ? "Price" : "Seated guests";
    return `<div class="range-vals"><span data-rv="${key}lo">${fmt(lo)}</span><span data-rv="${key}hi">${fmt(hi)}</span></div>
      <div class="dual" data-dual="${key}"><span class="track"></span><span class="fill" style="${fillStyle(lo, hi, max)}"></span>
        <input type="range" min="0" max="${max}" step="${step}" value="${lo}" data-range="${key}" data-end="lo" aria-label="${nm} minimum" style="z-index:${lo === hi && lo > max / 2 ? 3 : 1}">
        <input type="range" min="0" max="${max}" step="${step}" value="${hi}" data-range="${key}" data-end="hi" aria-label="${nm} maximum" style="z-index:2"></div>
      <div class="range-scale"><span>${fmt(0)}</span><span>${fmt(max)}</span></div>`;
  }
  // The Explore hierarchy, in order: Price first, then alphabetical. No Parking filter (D4); "Other" out of Decor (D3).
  const GROUPS = [
    { key: "price", title: "Price", html: (st) => range(st, "p") },
    { key: "access", title: "Accessibility options", html: (st) => checks(st, "access", ACCESS) },
    { key: "av", title: "Audio/Visual", html: (st) => checks(st, "av", AV) },
    { key: "cap", title: "Capacity (seated guests)", html: (st) => range(st, "c") },
    { key: "cities", title: "City", html: (st) => checks(st, "cities", CITIES) },
    { key: "decor", title: "Decor", html: (st) => modes(st, "dmodes") + `<p class="fsub">Aesthetics</p>${checks(st, "decor", AESTHETICS)}<p class="fsub">Lighting items</p>${checks(st, "decor", LIGHTING)}` },
    { key: "flags", title: "Features", html: (st) => checks(st, "flags", FEATURES) },
    { key: "other", title: "Other", html: (st) => modes(st, "omodes") + checks(st, "other", OTHER) },
    { key: "styles", title: "Style", html: (st) => checks(st, "styles", STYLES) },
  ];
  const onText = (st, key) => { const n = sectionActive(st, key); return n ? (key === "price" || key === "cap" ? "set" : `${n} selected`) : ""; };

  function viewExplore(q) {
    document.title = "Explore venues — Utah County Wedding Venues";
    const st = readState(q);
    // Arriving from a link already set S.st and the open groups; back/forward or a typed URL starts fresh from the URL.
    if (!S.fromLink || writeState(st) !== writeState(S.st)) { S.st = st; openActive(); }
    S.fromLink = false;
    app.innerHTML = `
      <div class="wrap title-band">
        <ol class="crumbs"><li><a href="#/" data-log="Breadcrumb: Home">Home</a></li><li>Explore</li></ol>
        <h1 class="display-l">Explore <span class="accent">venues</span></h1>
      </div>
      <div class="wrap">
        <div id="undo-slot"></div>
        <div class="explore">
          <div class="side-col">
            <button type="button" class="btn btn-outline filters-toggle" data-act="toggle-side" aria-expanded="${S.sideOpen}" aria-controls="filters" data-log="Show filters (small screen)">Filters</button>
            <aside class="filters ${S.sideOpen ? "" : "closed"}" id="filters" aria-label="Filters">
              <div class="filters-head"><h2 class="heading-s">Filters</h2><button type="button" class="textbtn" data-act="clear" data-log="Clear all filters">Clear all</button></div>
              ${GROUPS.map((g) => `<details class="fgroup" data-sec="${g.key}"${S.open.has(g.key) ? " open" : ""}>
                <summary data-log="${esc(g.title)} (open/close)">${esc(g.title)} <span class="on" data-on="${g.key}">${onText(S.st, g.key)}</span><span class="chev" aria-hidden="true"></span></summary>
                <div class="fbody">${g.html(S.st)}</div></details>`).join("")}
            </aside>
          </div>
          <section aria-labelledby="results-h">
            <div class="results-head">
              <div class="left"><h2 class="heading-m" id="results-h" aria-live="polite"></h2><div class="chips" id="chips"></div></div>
              <label class="sort">Sort <select id="sort" aria-label="Sort venues">
                <option value="az"${S.sort === "az" ? " selected" : ""}>A – Z</option>
                <option value="price"${S.sort === "price" ? " selected" : ""}>Price: low to high</option>
                <option value="cap"${S.sort === "cap" ? " selected" : ""}>Capacity: high to low</option></select></label>
            </div>
            <div id="results"></div>
          </section>
        </div>
      </div>`;
    renderUndo();
    updateExplore(false);
    const side = $("#filters");
    side.addEventListener("toggle", (e) => { const k = e.target.dataset && e.target.dataset.sec; if (k) { if (e.target.open) S.open.add(k); else S.open.delete(k); } }, true);
    side.addEventListener("change", (e) => {
      const el = e.target, f = el.dataset.f;
      if (!f) return;
      S.st[f] = el.checked ? [...new Set([...S.st[f], el.value])] : S.st[f].filter((x) => x !== el.value);
      updateExplore(true);
    });
    side.addEventListener("input", (e) => {
      const el = e.target;
      if (!el.dataset.range) return;
      const key = el.dataset.range, isP = key === "p", loK = isP ? "pmin" : "cmin", hiK = isP ? "pmax" : "cmax", max = isP ? PMAX : CMAX, val = Number(el.value);
      if (el.dataset.end === "lo") { S.st[loK] = Math.min(val, S.st[hiK]); el.value = S.st[loK]; } else { S.st[hiK] = Math.max(val, S.st[loK]); el.value = S.st[hiK]; }
      const fmt = isP ? priceText : capText;
      $(`[data-rv="${key}lo"]`).textContent = fmt(S.st[loK]);
      $(`[data-rv="${key}hi"]`).textContent = fmt(S.st[hiK]);
      const dual = el.closest(".dual");
      $(".fill", dual).style.cssText = fillStyle(S.st[loK], S.st[hiK], max);
      $('[data-end="lo"]', dual).style.zIndex = S.st[loK] === S.st[hiK] && S.st[loK] > max / 2 ? 3 : 1;
      updateExplore(true);
    });
    $("#sort").addEventListener("change", (e) => { S.sort = e.target.value; updateExplore(false); });
  }
  function renderUndo() {
    const slot = $("#undo-slot");
    if (!slot) return;
    slot.innerHTML = S.undo ? `<div class="undo-bar" role="status">
      <p>Showing <strong>${esc(S.undo.label.replace(/^\w+: /, ""))}</strong> venues. Your earlier filters were cleared: ${esc(S.undo.summary)}.</p>
      <button type="button" class="undo-btn" data-act="undo" data-log="Undo (restore earlier filters)">${I.undo} Undo</button>
      <button type="button" class="icon-btn" data-act="dismiss" aria-label="Dismiss" data-log="Dismiss undo bar">${I.x}</button></div>` : "";
  }
  function sorted(list) {
    const l = list.slice();
    if (S.sort === "price") l.sort((a, b) => (a.priceMin ?? Infinity) - (b.priceMin ?? Infinity) || alpha(a.name, b.name));
    if (S.sort === "cap") l.sort((a, b) => (b.seated ?? -1) - (a.seated ?? -1) || alpha(a.name, b.name));
    return l;
  }
  function updateExplore(changed) {
    const st = S.st;
    if (changed && S.undo) { S.undo = null; renderUndo(); }
    if (MODE === "test" && testSession && testSession.active) noteFilters(st);
    const list = results(st);
    $("#results-h").innerHTML = `${plural(list.length, "venue")}<span class="small muted" style="font-family:var(--sans)"> of ${VENUES.length}</span>`;
    $("#results").innerHTML = st.q && isHelp(st.q) ? emptyHtml(st)
      : list.length ? `<div class="card-grid">${sorted(list).map((v) => card(v, st.q)).join("")}</div>` : emptyHtml(st);
    const c = chipsFor(st);
    $("#chips").innerHTML = c.map((x) => `<span class="chip">${esc(x.label)}<button type="button" data-act="unchip" data-f="${x.f}" data-v="${esc(x.v || "")}" aria-label="Remove ${esc(x.label)}" data-log="Remove filter: ${esc(x.label)}">×</button></span>`).join("")
      + (c.length > 1 ? `<button type="button" class="textbtn" data-act="clear" data-log="Clear all filters">Clear all</button>` : "");
    $$("[data-cnt]").forEach((el) => {
      const [f, val] = el.dataset.cnt.split("|"), n = countWith(st, f, val);
      el.textContent = n;
      el.closest(".check").classList.toggle("zero", n === 0 && !st[f].includes(val));
    });
    $$("[data-on]").forEach((el) => (el.textContent = onText(st, el.dataset.on)));
    $(".filters-toggle").textContent = `Filters${activeCount(st) ? ` (${activeCount(st)})` : ""}`;
    S.lastState = clone(st);
    S.lastExplore = exploreHash(st);
    history.replaceState(null, "", location.pathname + location.search + S.lastExplore);
  }

  // ---------- Venue page (every venue is an endpoint, Q7) ----------
  const FEATURE_SOURCE = {
    "Bridal room": ["Bride/Groom Rooms", /brid/i], "Groom's room": ["Bride/Groom Rooms", /groom/i],
    "Event coordinator": ["Event Coordinator"], "Cleanup crew": ["cleanup crew"], "Linens included": ["Linens Included"],
    "Outside catering allowed": ["Catering"], "Sparklers allowed": ["sparklers allowed"],
  };
  function featureDetail(v, f) {
    if (f === "Indoors" || f === "Outdoors") { const io = raw(v, "outside/inside").toLowerCase(); return io === "both" ? "Indoor and outdoor spaces" : io === "inside" ? "Indoor spaces" : io === "outside" ? "Outdoor spaces" : ""; }
    const src = FEATURE_SOURCE[f];
    if (!src) return "";
    const t = raw(v, src[0]);
    if (!t || /^(true|false)$/i.test(t)) return "";
    const ls = lines(t).filter((l) => !/^(yes|no|included)$/i.test(l) && (!src[1] || src[1].test(l)));
    if (src[1] && ls.length === 1 && ls[0].length < 20) return "";
    return ls.slice(0, 1).join("");
  }
  const sentence = (list) => { const l = list.map((t, i) => (i && /^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t)); return l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " and " + l[l.length - 1]; };
  function itemsByMode(v, list) {
    const inc = list.filter((i) => (v.decor[i] || []).includes("included")), rent = list.filter((i) => (v.decor[i] || []).includes("rent"));
    return [[inc, "Included"], [rent, "For rent"]].filter(([l]) => l.length);
  }
  function catCard(title, what, body) { return `<div class="cat"><h3 class="label">${esc(title)}</h3><p class="what" style="margin:0">${esc(what)}</p>${body}</div>`; }
  const noneP = (t) => `<p class="none">${esc(t)}</p>`;
  const ulist = (arr) => `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;

  function featuresSection(v) {
    const n = FEATURES.filter((f) => v.flags[f]).length;
    const checklist = FEATURES.map((f) => {
      const on = !!v.flags[f], d = featureDetail(v, f);
      return `<li class="${on ? "" : "no"}"><span class="dot">${on ? I.check : I.dash}</span><span><span class="nm">${esc(f)}</span>${on || d ? `<span class="d">${esc(d || (on ? "" : "Not listed"))}</span>` : `<span class="d">Not listed</span>`}</span></li>`;
    }).join("");
    const modeBlock = (list) => { const g = itemsByMode(v, list); return g.length ? g.map(([items, m]) => `<p class="tag" style="margin:6px 0 0">${m}</p>${ulist(items)}`).join("") : null; };
    const parking = lines(raw(v, "parking?"));
    const accessHave = ACCESS.filter((k) => v.access[k]), accessText = lines(raw(v, "Accessibility")).filter((l) => !accessHave.some((a) => a.toLowerCase() === l.toLowerCase()));
    const avLines = lines(raw(v, "sound system")).filter((l) => !/^(yes|no)$/i.test(l)), avHave = AV.filter((k) => v.av[k]);
    return `<section class="features" aria-labelledby="features-h">
      <header><h2 class="heading-m" id="features-h">Features</h2><p class="small muted" style="margin:0">${plural(n, "feature")} listed. What this venue offers, using the same groups as the Explore filters; items the venue doesn't list are faded.</p></header>
      <ul class="checklist">${checklist}</ul>
      <div class="cat-grid">
        ${catCard("Decor", "Aesthetic and lighting items, included or for rent.", modeBlock([...AESTHETICS, ...LIGHTING]) || noneP("No decor items listed."))}
        ${catCard("Other", "Stations and extras, like a cake table, piano or photo booth.", modeBlock(OTHER) || noneP("None listed."))}
        ${catCard("Parking", "Where guests park on the day.", parking.length ? ulist(parking) : noneP("Not listed by the venue. Ask on your tour."))}
        ${catCard("Accessibility options", "Wheelchair access, elevator, ADA restrooms and accessible parking.", accessHave.length || accessText.length ? ulist([...accessHave, ...accessText]) : noneP("None listed."))}
        ${catCard("Audio/Visual", "Sound, microphones, screens and projectors.", avLines.length || avHave.length ? `<p style="margin:4px 0 0">${esc(sentence(avLines.length ? avLines : avHave))}.</p>` : noneP("No audio/visual equipment listed."))}
      </div>
    </section>`;
  }
  function detailValue(k, t, q) {
    if (k === "link") return /^https?:\/\//i.test(t) ? `<a href="${esc(t)}" target="_blank" rel="noopener" data-log="Venue website (details)">${esc(t.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a>` : esc(t);
    const ls = lines(fieldText(k, t)), fmt = (x) => (q ? highlight(x, q) : esc(x));
    return ls.length > 1 ? `<ul>${ls.map((l) => `<li>${fmt(l)}</li>`).join("")}</ul>` : fmt(ls[0] || "");
  }
  function detailsSection(v, q) {
    const hitLabels = q ? hitFields(v, q).map(([l]) => l) : [];
    const rows = DETAIL_GROUPS.map(([title, keys]) => {
      const items = keys.filter((k) => raw(v, k)).map((k) => {
        const hit = hitLabels.includes(FIELD_LABELS[k]);
        return `<div${hit ? ' class="hit"' : ""}><dt>${esc(FIELD_LABELS[k])}</dt><dd>${detailValue(k, raw(v, k), hit ? q : "")}</dd></div>`;
      });
      return items.length ? `<div class="drow"><p class="eyebrow">${esc(title)}</p><dl>${items.join("")}</dl></div>` : "";
    }).join("");
    return `<details class="details"${q ? " open" : ""}>
      <summary data-log="Detailed information (open/close)"><span class="t"><span class="heading-s">Detailed information</span><span class="small muted">Pricing, times, food, rules and contact: everything the venue lists${q ? `. Matches for “${esc(q)}” are highlighted.` : "."}</span></span><span class="chev" aria-hidden="true"></span></summary>
      ${rows}</details>`;
  }
  function similar(v) {
    return VENUES.filter((x) => x.id !== v.id).map((x) => [x, x.styles.filter((s) => v.styles.includes(s)).length * 2 + (x.city === v.city ? 1 : 0)])
      .filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1] || alpha(a[0].name, b[0].name)).slice(0, 4).map(([x]) => x);
  }
  function viewVenue(v) {
    document.title = `${v.name} — Utah County Wedding Venues`;
    const q = S.st.q;
    const contact = raw(v, "Contact Information"), phone = (contact.match(/Phone:\s*([\d().\-\s]{7,})/i) || [])[1];
    const link = raw(v, "link"), n = photoCount(v), addr = raw(v, "Full Address");
    const seatedSub = v.seatedText && v.seatedText.trim() !== String(v.seated) ? lines(v.seatedText).join(" · ") : "";
    const sims = similar(v);
    app.innerHTML = `
      <div class="wrap venue-top">
        <a class="back" href="${esc(S.lastExplore)}" data-log="Back to results">${I.chevL} Back to results</a>
        <div class="venue-title">
          <div><p class="eyebrow">${esc([v.city || "City not listed", ...v.styles].join("  ·  "))}</p><h1 class="display-l">${esc(v.name)}</h1></div>
          <div class="venue-actions">
            ${phone ? `<a class="btn btn-outline" href="tel:${esc(phone.replace(/[^\d]/g, ""))}" data-log="Call venue">Call ${esc(phone.trim())} ${I.chevR}</a>` : ""}
            ${/^https?:/i.test(link) ? `<a class="btn btn-accent" href="${esc(link)}" target="_blank" rel="noopener" data-log="Visit website (top)">Visit website</a>` : ""}
          </div>
        </div>
        <div class="gallery">
          ${carousel(v)}
          <div class="side n${n - 1}">${Array.from({ length: n - 1 }, (_, k) => pic(v, k + 1)).join("")}</div>
          <button type="button" class="all-photos" data-act="all-photos" data-id="${v.id}" data-log="All photos: ${esc(v.name)}">${I.grid} All ${n} photos</button>
        </div>
        ${PHOTOS[v.id] ? `<p class="small muted photo-credit">Photos: ${creditLink(v)} · <a href="#/credits" data-log="Photo credits (venue)">Photo credits</a></p>` : ""}
        <div class="glance">
          <div><p class="eyebrow">Price</p><p class="heading-s" style="margin:0">${esc(priceLine(v))}</p><p class="small muted" style="margin:0">${v.priceMin != null ? (raw(v, "Packages and Prices") ? "Venue rental; packages in Detailed information" : "Venue rental") : "Not listed on the venue's website"}</p></div>
          <div><p class="eyebrow">Capacity</p><p class="heading-s" style="margin:0">${v.seated != null ? esc(v.seated + " seated") : "Not listed"}</p><p class="small muted" style="margin:0">${esc([seatedSub, v.standing != null ? v.standing + " standing" : ""].filter(Boolean).join(" · "))}</p></div>
          <div><p class="eyebrow">Style</p><p class="heading-s" style="margin:0">${esc(v.styles.join(" · "))}</p><p class="small muted" style="margin:0">${v.styles.length > 1 ? "A venue can have more than one style" : ""}</p></div>
        </div>
      </div>
      <div class="wrap venue-body">
        <div class="venue-main">
          <p class="quote">“${esc(v.description)}”</p>
          ${featuresSection(v)}
          ${detailsSection(v, q)}
        </div>
        <aside class="visit" aria-label="Plan a visit">
          <p class="eyebrow">Plan a visit</p>
          <p class="heading-m" style="margin:0;font-size:32px">${v.priceMin != null ? esc(priceLine(v)) : "Ask the venue for pricing"}</p>
          ${addr ? `<div class="kv"><p class="eyebrow">Address</p><p class="pre" style="margin:0">${esc(addr)}</p></div>` : ""}
          ${contact ? `<div class="kv"><p class="eyebrow">Contact</p><p class="pre" style="margin:0">${esc(contact)}</p></div>` : ""}
          ${/^https?:/i.test(link) ? `<a class="btn btn-primary" href="${esc(link)}" target="_blank" rel="noopener" data-log="Visit website (plan a visit)">Visit website</a>` : ""}
          ${sims.length ? `<a class="btn btn-outline" href="#similar" data-act="to-similar" data-log="Compare with similar">Compare with similar ${I.chevR}</a>` : ""}
        </aside>
      </div>
      ${sims.length ? `<section class="band-cream section" id="similar" aria-labelledby="sim-h"><div class="wrap">
        <div class="section-head"><div><p class="eyebrow">You might also like</p><h2 class="display-l" id="sim-h">More <span class="accent">${esc(v.styles.join(" & "))}</span> venues</h2></div></div>
        <div class="similar-grid">${sims.map((x) => card(x)).join("")}</div></div></section>` : ""}`;
  }

  // ---------- Photo credits ----------
  function viewCredits() {
    document.title = "Photo credits — Utah County Wedding Venues";
    app.innerHTML = `<div class="wrap page credits">
      <p class="eyebrow">Photo credits</p>
      <h1 class="display-l">Every photo, <span class="accent">credited</span></h1>
      <p class="body-l muted">Venue photos are shown directly from each venue's own website and belong to that venue or its photographers. They appear here for a CS 356 class prototype only.</p>
      <div class="credit-list">${VENUES.map((v) => `<div class="credit-row">
        <a href="#/venue/${v.id}" data-log="Credits venue: ${esc(v.name)}">${esc(v.name)}</a>
        <span>${PHOTOS[v.id] ? creditLink(v) : "No photos"}</span>
        <span class="small muted">${plural(shots(v).length, "photo")}</span></div>`).join("")}</div>
    </div>`;
  }

  // ---------- Not found ----------
  function viewNotFound() {
    document.title = "Page not found — Utah County Wedding Venues";
    app.innerHTML = `<div class="wrap page"><h1 class="display-l">Page not found</h1><p class="body-l muted">Use the menu above, or <a href="#/explore" data-fresh>explore all venues</a>.</p></div>`;
  }

  // ---------- Page-level clicks ----------
  app.addEventListener("click", (e) => {
    const esg = e.target.closest("[data-esg]"), hp = e.target.closest("[data-help]");
    if (esg) return applySuggestion(S.emptySuggest[Number(esg.dataset.esg)]);
    if (hp && !hp.closest(".suggest")) return applyHelp(Number(hp.dataset.help));
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (act === "photo") {
      const v = BY_ID[el.dataset.id], n = photoCount(v);
      S.photo[v.id] = ((S.photo[v.id] || 0) + Number(el.dataset.dir) + n) % n;
      $$(`[data-car="${v.id}"]`).forEach((box) => { box.outerHTML = carousel(v); });
    } else if (act === "unchip") { removeChip(S.st, el.dataset.f, el.dataset.v); S.undo = null; refreshExplore(); }
    else if (act === "clear") { S.st = fresh(); S.undo = null; refreshExplore(); }
    else if (act === "undo") { S.st = S.undo.prev; S.undo = null; openActive(); refreshExplore(); }
    else if (act === "dismiss") { S.undo = null; renderUndo(); }
    else if (act === "toggle-side") { S.sideOpen = !S.sideOpen; $("#filters").classList.toggle("closed", !S.sideOpen); el.setAttribute("aria-expanded", String(S.sideOpen)); }
    else if (act === "all-photos") {
      const v = BY_ID[el.dataset.id];
      showOverlay(`<div class="dialog wide" role="dialog" aria-modal="true" aria-label="Photos of ${esc(v.name)}"><div style="display:flex;justify-content:space-between;align-items:center"><h1>${esc(v.name)}</h1><button type="button" class="icon-btn" id="close-photos" aria-label="Close" data-log="Close photos">${I.x}</button></div>
        <div class="photo-grid">${Array.from({ length: photoCount(v) }, (_, i) => `<figure>${pic(v, i)}${shots(v)[i]
          ? `<figcaption class="small muted">${esc(KIND_LABEL[shots(v)[i].kind])} · Photo: ${creditLink(v)}</figcaption>` : ""}</figure>`).join("")}</div></div>`, true);
      $("#close-photos").onclick = hideOverlay;
    } else if (act === "to-similar") { e.preventDefault(); $("#similar").scrollIntoView({ behavior: "smooth" }); }
  });
  // Re-render Explore in place (keeps open groups), updating the URL without a new history entry.
  function refreshExplore() {
    S.fromLink = true;
    history.replaceState(null, "", location.pathname + location.search + exploreHash(S.st));
    const keepOpen = new Set(S.open);
    viewExplore(new URLSearchParams(writeState(S.st)));
    S.open = keepOpen;
    $$(".fgroup").forEach((d) => { d.open = S.open.has(d.dataset.sec); });
  }

  // ---------- Click recording (exportable log) ----------
  function labelOf(el) {
    if (el.matches("input[type=checkbox]")) {
      const group = el.closest(".fgroup"), title = group ? $("summary", group).firstChild.textContent.trim() : "";
      const text = $(".lbl", el.closest("label")).textContent.trim();
      return `${title ? title + ": " : ""}${text} ${el.checked ? "on" : "off"}`;
    }
    if (el.matches("input[type=range]")) return `${el.getAttribute("aria-label")}: ${el.dataset.range === "p" ? priceText(Number(el.value)) : capText(Number(el.value))}`;
    if (el.tagName === "SELECT") return `${el.getAttribute("aria-label") || "Select"}: ${el.selectedOptions[0] ? el.selectedOptions[0].text : ""}`;
    if (el.dataset.log) return el.dataset.log;
    return (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
  }
  // Which way in a click belongs to (test mode: categorization used).
  function routeOf(el, label) {
    if (!el) return "";
    if (el.closest("#filters") || label === "Explore" || label.startsWith("Remove filter") || label.startsWith("Clear all")) return "Explore filters";
    if (el.dataset.nav || el.closest("#menu-location, #menu-style")) return "Location/Style";
    if (el.dataset.preset) return "Popular searches";
    return "";
  }
  function record(el, type, forcedLabel, forcedRoute) {
    const label = forcedLabel || labelOf(el);
    const entry = {
      time: new Date().toISOString(), mode: MODE,
      participant: testSession ? testSession.participant : "",
      task_id: testSession && testSession.active ? testSession.order[testSession.idx] : "",
      page: location.hash || "#/", event: type,
      element: el ? el.tagName.toLowerCase() + (el.type ? `[${el.type}]` : "") : "form",
      label,
    };
    const log = load(KEY_LOG, []);
    log.push(entry);
    save(KEY_LOG, log);
    // Opening the Location/Style menu is logged, but the participant's path starts with what they pick in it.
    if (testSession && testSession.active && !(el && el.dataset.menu)) {
      testSession.path.push(label);
      testSession.clickTimes.push(Date.now() - testSession.taskStart);
      const route = forcedRoute || routeOf(el, label);
      if (route && !testSession.used.includes(route)) testSession.used.push(route);
      save(KEY_SESSION, testSession);
    }
  }
  function initRecording() {
    document.addEventListener("click", (e) => {
      const el = e.target.closest("a, button, summary");
      if (!el || el.closest("[data-nolog]") || el.closest("form[role=search]") && el.tagName === "BUTTON") return;
      record(el, "click");
    }, true);
    document.addEventListener("change", (e) => {
      const el = e.target;
      if (!el.matches("input, select") || el.matches("[type=search]") || el.closest("[data-nolog]")) return;
      record(el, "change");
    }, true);
  }
  function toCSV(rows, cols) {
    const cell = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
  }
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a"); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  function table(rows, cols) {
    if (!rows.length) return `<p class="empty">Nothing recorded yet.</p>`;
    return `<div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td>${esc(r[c])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  const LOG_COLS = ["time", "mode", "participant", "task_id", "page", "event", "element", "label"];
  function viewLog() {
    document.title = "Click log — Utah County Wedding Venues";
    const log = load(KEY_LOG, []);
    app.innerHTML = `<div class="wrap page">
      <ol class="crumbs"><li><a href="#/">Home</a></li><li>Click log</li></ol>
      <h1 class="display-l">Click log</h1>
      <p class="muted">${plural(log.length, "click")} recorded in this browser, newest first.</p>
      <div class="actions" data-nolog>
        <button type="button" class="btn btn-primary" id="log-json">Download JSON</button>
        <button type="button" class="btn btn-primary" id="log-csv">Download CSV</button>
        <button type="button" class="btn btn-outline" id="log-copy">Copy JSON</button>
        <button type="button" class="btn btn-outline" id="log-clear">Clear log</button>
      </div>
      ${table(log.slice().reverse(), LOG_COLS)}</div>`;
    $("#log-json").onclick = () => download(`click-log-${stamp()}.json`, JSON.stringify(log, null, 2), "application/json");
    $("#log-csv").onclick = () => download(`click-log-${stamp()}.csv`, toCSV(log, LOG_COLS), "text/csv");
    $("#log-copy").onclick = async (e) => { try { await navigator.clipboard.writeText(JSON.stringify(log, null, 2)); e.target.textContent = "Copied"; } catch (err) { e.target.textContent = "Copy failed"; } };
    $("#log-clear").onclick = () => { if (confirm("Clear the click log in this browser?")) { remove(KEY_LOG); viewLog(); } };
  }

  // ---------- Overlay ----------
  function showOverlay(html, dismissable = false) {
    overlay.innerHTML = html.trim().startsWith('<div class="dialog') ? html : `<div class="dialog" role="dialog" aria-modal="true">${html}</div>`;
    overlay.hidden = false;
    overlay.dataset.dismiss = dismissable ? "1" : "";
    const f = $("input, button", overlay); if (f) f.focus();
  }
  function hideOverlay() { overlay.hidden = true; overlay.innerHTML = ""; }
  overlay.addEventListener("click", (e) => { if (e.target === overlay && overlay.dataset.dismiss) hideOverlay(); });

  // ---------- Test mode (?test): 10 randomized scenarios, timed, results persist (?results) ----------
  let testSession = null;
  const taskById = (id) => TASKS.find((t) => t.id === id);
  function shuffle(a) { const arr = a.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  function newParticipantNumber() { const used = load(KEY_RESULTS, []).map((r) => r.participant); let n; do { n = 100000 + Math.floor(Math.random() * 900000); } while (used.includes(n)); return n; }

  function testStartScreen() {
    if (!TASKS.length) return showOverlay(`<h1>Usability test</h1><p>No scenarios are set up yet.</p><p><a href="./">Go to the normal site</a></p>`);
    showOverlay(`<h1>Welcome</h1>
      <p>We are testing the website, not you. There are no wrong answers.</p>
      <p>You'll get ${TASKS.length} short tasks. For each one, use the site to find venues that fit. Please think aloud as you go.</p>
      <p>Two buttons stay at the bottom of every page. Press "I think I'm done" when you feel you've found what the task asks for. If you can't find it, press "I give up". That is a useful result, not a failure.</p>
      <form id="start-form"><label for="pname">First name</label><input type="text" id="pname" required autocomplete="off"><button type="submit" class="btn btn-primary">Start</button></form>`);
    $("#start-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#pname").value.trim().replace(/\s+/g, " ");
      if (!name) return;
      testSession = { participant: newParticipantNumber(), participant_name: name, session_start: new Date().toISOString(), order: shuffle(TASKS.map((t) => t.id)),
        idx: 0, active: false, taskStart: 0, introStart: 0, readingMs: 0, path: [], clickTimes: [], visited: [], backtracks: 0, filters: null, undone: [], used: [], rating: null };
      save(KEY_SESSION, testSession);
      testTaskIntro();
    });
  }
  function testTaskIntro() {
    hideTaskbar();
    if (!testSession.introStart) { testSession.introStart = Date.now(); save(KEY_SESSION, testSession); }
    const t = taskById(testSession.order[testSession.idx]);
    showOverlay(`<p class="eyebrow">Task ${testSession.idx + 1} of ${testSession.order.length}</p><div class="scenario">${esc(t.text)}</div>
      <p class="muted">Press OK when you're ready. The site will open at the home page.</p><button type="button" class="btn btn-primary" id="task-ok">OK, start</button>`);
    $("#task-ok").addEventListener("click", () => {
      const now = Date.now();
      Object.assign(testSession, { active: true, taskStart: now, readingMs: now - testSession.introStart, introStart: 0, path: [], clickTimes: [], visited: ["/"], backtracks: 0, filters: null, undone: [], used: [] });
      save(KEY_SESSION, testSession);
      S.st = fresh(); S.undo = null; S.lastState = fresh(); S.lastExplore = "#/explore";
      hideOverlay(); showTaskbar();
      if (location.hash && parseHash().path === "/") render(); else location.hash = "#/";
    });
  }
  function showTaskbar() {
    const t = taskById(testSession.order[testSession.idx]);
    taskbar.innerHTML = `<div class="wrap"><p><strong>Task ${testSession.idx + 1} of ${testSession.order.length}:</strong> ${esc(t.text)}</p></div>`;
    testbar.innerHTML = `<div class="wrap testbar-inner"><button type="button" class="btn btn-outline" id="give-up">I give up</button><button type="button" class="btn btn-primary" id="task-done">I think I'm done</button></div>`;
    taskbar.hidden = false; testbar.hidden = false;
    document.body.classList.add("has-testbar");
    document.documentElement.style.setProperty("--taskbar-h", taskbar.offsetHeight + "px");
    $("#give-up").addEventListener("click", () => testFinish("gave_up"));
    $("#task-done").addEventListener("click", () => testFinish("done"));
  }
  function hideTaskbar() { taskbar.hidden = true; testbar.hidden = true; document.body.classList.remove("has-testbar"); document.documentElement.style.setProperty("--taskbar-h", "0px"); }
  function testOnRoute(r) {
    if (!testSession || !testSession.active) return;
    const v = testSession.visited;
    if (v[v.length - 1] === r.path) return;
    if (v.includes(r.path)) testSession.backtracks++;
    v.push(r.path);
    if (r.parts[0] === "explore") noteFilters(S.st);
    save(KEY_SESSION, testSession);
  }
  // Remember the filters applied right now, and note any filter that was on and is now off.
  function noteFilters(st) {
    const now = appliedItems(st).map((i) => i.key);
    appliedItems(testSession.filters || fresh()).forEach((i) => { if (i.kind !== "mode" && !now.includes(i.key)) testSession.undone.push(i.key); });
    testSession.filters = clone(st);
    save(KEY_SESSION, testSession);
  }

  // Facet scoring, as in the wireframe, mapped onto this site: City allows several; Decor's
  // "Specialty stations" items now live under Other (D3); there is no Parking filter (D4), so a parking
  // part counts as met when the participant opened a venue page that lists parking.
  const sameText = (x, y) => String(x).toLowerCase() === String(y).toLowerCase();
  const hasIn = (list, value) => list.some((x) => sameText(x, value));
  const GROUP_ITEMS = { "specialty stations": OTHER, "other": OTHER, "aesthetics": AESTHETICS, "lighting items": LIGHTING };
  const decorGroupOf = (item) => (OTHER.includes(item) ? "Other" : AESTHETICS.includes(item) ? "Decor > Aesthetics" : "Decor > Lighting items");
  function rangeLabel(name, p, fmt) {
    if (p.min != null && p.max != null) return `${name}: ${fmt(p.min)} to ${fmt(p.max)}`;
    if (p.max != null) return `${name}: up to ${fmt(p.max)}`;
    if (p.min != null) return `${name}: at least ${fmt(p.min)}`;
    return `${name}: range adjusted`;
  }
  function rangeMet(lo, hi, top, p) { if (!(lo > 0 || hi < top)) return false; if (p.max != null && hi > p.max) return false; if (p.min != null && lo < p.min) return false; return true; }
  function partLabel(p) {
    if (p.anyOf) return p.anyOf.map(partLabel).join(" or ");
    switch (p.facet) {
      case "style": return `Style: ${p.value}`;
      case "city": return `City: ${p.value}`;
      case "feature": return `Features: ${p.value}`;
      case "access": return `Accessibility options: ${p.value}`;
      case "av": return `Audio/Visual: ${p.value}`;
      case "parking": return "Parking: opened a venue page that lists parking";
      case "decor": return `${decorGroupOf(p.value)}: ${p.value}`;
      case "decorGroup": return `${sameText(p.group, "Specialty stations") ? "Other" : "Decor > " + p.group}: any ${p.min || 1} or more`;
      case "price": return rangeLabel("Price", p, priceText);
      case "capacity": return rangeLabel("Capacity", p, capText);
      default: return `Unknown facet "${p.facet}"`;
    }
  }
  function partMet(p, st, s) {
    if (p.anyOf) return p.anyOf.some((x) => partMet(x, st, s));
    switch (p.facet) {
      case "style": return hasIn(st.styles, p.value);
      case "city": return hasIn(st.cities, p.value);
      case "feature": return hasIn(st.flags, p.value);
      case "access": return hasIn(st.access, p.value);
      case "av": return hasIn(st.av, p.value);
      case "parking": return s.visited.some((path) => { const id = path.split("/")[2]; return BY_ID[id] && hasInfo(raw(BY_ID[id], "parking?")); });
      case "decor": return hasIn(st.decor, p.value) || hasIn(st.other, p.value);
      case "decorGroup": { const items = GROUP_ITEMS[String(p.group).toLowerCase()] || []; return [...st.decor, ...st.other].filter((d) => items.includes(d)).length >= (p.min || 1); }
      case "price": return rangeMet(st.pmin, st.pmax, PMAX, p);
      case "capacity": return rangeMet(st.cmin, st.cmax, CMAX, p);
      default: return false;
    }
  }
  function appliedItems(st) {
    const out = [], add = (kind, value, label, key = label) => out.push({ kind, value, label, key });
    if (st.q) add("search", st.q, `Search: ${st.q}`, "Search");
    if (priceOn(st)) add("price", "", `Price: ${priceText(st.pmin)} to ${priceText(st.pmax)}`, "Price range");
    st.access.forEach((x) => add("access", x, `Accessibility options: ${x}`));
    st.av.forEach((x) => add("av", x, `Audio/Visual: ${x}`));
    if (capOn(st)) add("capacity", "", `Capacity: ${capText(st.cmin)} to ${capText(st.cmax)}`, "Capacity range");
    st.cities.forEach((x) => add("city", x, `City: ${x}`));
    st.dmodes.forEach((x) => add("mode", x, `Decor: ${x === "rent" ? "For rent" : "Included"}`));
    st.decor.forEach((x) => add("decor", x, `${decorGroupOf(x)}: ${x}`));
    st.flags.forEach((x) => add("feature", x, `Features: ${x}`));
    st.omodes.forEach((x) => add("mode", x, `Other: ${x === "rent" ? "For rent" : "Included"}`));
    st.other.forEach((x) => add("decor", x, `Other: ${x}`));
    st.styles.forEach((x) => add("style", x, `Style: ${x}`));
    return out;
  }
  function partCovers(p, item) {
    if (p.anyOf) return p.anyOf.some((x) => partCovers(x, item));
    if (p.facet === "decorGroup") return item.kind === "decor" && (GROUP_ITEMS[String(p.group).toLowerCase()] || []).includes(item.value);
    return p.facet === item.kind && (p.value == null || sameText(p.value, item.value));
  }
  function pageName(path) {
    const [section, arg] = path.split("/").filter(Boolean).map(decodeURIComponent);
    if (!section) return "Home";
    if (section === "explore") return "Explore";
    if (section === "venue") return `Venue: ${(BY_ID[arg] || { name: arg }).name}`;
    return path;
  }
  function testFinish(kind) {
    const s = testSession, t = taskById(s.order[s.idx]), filters = s.filters || fresh();
    const expected = Array.isArray(t.expected) ? t.expected : [];
    const correct = expected.filter((p) => partMet(p, filters, s)), missed = expected.filter((p) => !correct.includes(p));
    const score = expected.length ? Math.round((100 * correct.length) / expected.length) / 100 : "";
    const outcome = kind === "gave_up" ? "gave_up" : !expected.length ? "no_target_set" : score === 1 ? "success" : score === 0 ? "fail" : "partial";
    const here = parseHash(), venue = here.parts[0] === "venue" ? BY_ID[here.parts[1]] : null, first = s.path[0] || "";
    const extra = appliedItems(filters).filter((i) => i.kind !== "mode" && i.kind !== "search" && !expected.some((p) => partCovers(p, i)));
    const opened = [...new Set(s.visited.filter((p) => p.startsWith("/venue/")).map((p) => pageName(p).replace(/^Venue: /, "")))];
    const rows = load(KEY_RESULTS, []);
    rows.push({
      participant: s.participant, participant_name: s.participant_name, session_start: s.session_start,
      task_id: t.id, task_order: s.idx + 1, task_text: t.text, target: expected.map(partLabel).join("; "), outcome, score,
      directness: s.backtracks === 0 && s.undone.length === 0 ? "direct" : "indirect",
      facets_correct_count: expected.length ? `${correct.length} of ${expected.length}` : "",
      facets_correct: correct.map(partLabel).join("; "), facets_missed: missed.map(partLabel).join("; "),
      filters_applied: appliedItems(filters).map((i) => i.label).join("; "),
      extra_filters_count: extra.length, extra_filters: extra.map((i) => i.label).join("; "),
      filters_undone_count: s.undone.length, filters_undone: s.undone.join("; "), wrong_turns: extra.length + s.undone.length,
      categorization_used: s.used.join(" + ") || "None", finish_page: here.path, finish_block: venue ? venue.name : "",
      first_click: first, first_click_expected: t.expectedFirstClick || "",
      first_click_match: t.expectedFirstClick ? (sameText(first, t.expectedFirstClick) ? "yes" : "no") : "",
      click_path: s.path.join(" > "), click_times_s: s.clickTimes.map((ms) => (ms / 1000).toFixed(1)).join(" > "), click_count: s.path.length,
      pages_visited: s.visited.map(pageName).join(" > "), venues_opened_count: opened.length, venues_opened: opened.join("; "),
      backtracks: s.backtracks, reading_ms: s.readingMs, time_to_first_click_ms: s.clickTimes.length ? s.clickTimes[0] : "",
      elapsed_ms: Date.now() - s.taskStart, ease_rating_1to7: "", confidence_rating_1to7: "",
    });
    save(KEY_RESULTS, rows);
    s.active = false; s.rating = { task_id: t.id, kind };
    save(KEY_SESSION, s);
    hideTaskbar();
    testRatingScreen();
  }
  function updateRow(taskId, fields) {
    const s = testSession, rows = load(KEY_RESULTS, []);
    rows.forEach((r) => { if (r.participant === s.participant && r.session_start === s.session_start && r.task_id === taskId) Object.assign(r, fields); });
    save(KEY_RESULTS, rows);
  }
  const ratingScale = (name, question, low, high) => `<fieldset class="rating"><legend>${question}</legend><div class="rating-row"><span>${low}</span>
    ${[1, 2, 3, 4, 5, 6, 7].map((n) => `<label><input type="radio" name="${name}" value="${n}" required><span>${n}</span></label>`).join("")}<span>${high}</span></div></fieldset>`;
  function testRatingScreen() {
    const s = testSession, gaveUp = s.rating.kind === "gave_up";
    showOverlay(`<p class="eyebrow">Task ${s.idx + 1} of ${s.order.length} finished</p><form id="rating-form">
      ${ratingScale("ease", "Overall, how difficult or easy was this task?", "Very difficult", "Very easy")}
      ${gaveUp ? "" : ratingScale("confidence", "How confident are you that you found what the task asked for?", "Not at all confident", "Very confident")}
      <button type="submit" class="btn btn-primary">Continue</button></form>`);
    $("#rating-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const picked = (name) => { const el = $(`input[name="${name}"]:checked`, overlay); return el ? Number(el.value) : ""; };
      updateRow(s.rating.task_id, { ease_rating_1to7: picked("ease"), confidence_rating_1to7: gaveUp ? "" : picked("confidence") });
      s.rating = null; s.idx++;
      if (s.idx >= s.order.length) { remove(KEY_SESSION); testSession = null; showOverlay(`<h1>All done</h1><p>Thank you! Your responses have been saved.</p>`); }
      else { save(KEY_SESSION, s); testTaskIntro(); }
    });
  }
  function initTest() {
    testSession = load(KEY_SESSION, null);
    if (testSession && !TASKS.length) testSession = null;
    if (!testSession) return testStartScreen();
    if (testSession.rating) testRatingScreen(); else if (testSession.active) showTaskbar(); else testTaskIntro();
  }

  // ---------- Results (?results) ----------
  const RESULT_COLS = ["participant", "participant_name", "session_start", "task_id", "task_order", "task_text", "target", "outcome", "score", "directness",
    "facets_correct_count", "facets_correct", "facets_missed", "filters_applied", "extra_filters_count", "extra_filters", "filters_undone_count", "filters_undone",
    "wrong_turns", "categorization_used", "finish_page", "finish_block", "first_click", "first_click_expected", "first_click_match", "click_path", "click_times_s",
    "click_count", "pages_visited", "venues_opened_count", "venues_opened", "backtracks", "reading_ms", "time_to_first_click_ms", "elapsed_ms", "ease_rating_1to7", "confidence_rating_1to7"];
  function viewResults() {
    document.title = "Test results — Utah County Wedding Venues";
    const rows = load(KEY_RESULTS, []), session = load(KEY_SESSION, null);
    const ids = TASKS.map((t) => t.id).filter((id) => rows.some((r) => r.task_id === id));
    const pct = (n, d) => (d ? Math.round((100 * n) / d) + "%" : "");
    const mean = (rs, col) => { const nums = rs.map((r) => r[col]).filter((x) => typeof x === "number"); return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : ""; };
    const summary = ids.map((id) => {
      const rs = rows.filter((r) => r.task_id === id), firsts = {};
      rs.forEach((r) => { firsts[r.first_click || "(none)"] = (firsts[r.first_click || "(none)"] || 0) + 1; });
      const top = Object.entries(firsts).sort((a, b) => b[1] - a[1])[0], times = rs.map((r) => r.elapsed_ms).sort((a, b) => a - b);
      return { task: id, participants: rs.length, mean_score: mean(rs, "score"), success: pct(rs.filter((r) => r.outcome === "success").length, rs.length),
        partial: pct(rs.filter((r) => r.outcome === "partial").length, rs.length), fail: pct(rs.filter((r) => r.outcome === "fail").length, rs.length),
        gave_up: pct(rs.filter((r) => r.outcome === "gave_up").length, rs.length), mean_ease: mean(rs, "ease_rating_1to7"),
        median_seconds: times.length ? (times[Math.floor(times.length / 2)] / 1000).toFixed(1) : "", top_first_click: top ? `${top[0]} (${top[1]} of ${rs.length})` : "" };
    });
    const participants = new Set(rows.map((r) => r.participant + "|" + r.session_start)).size;
    app.innerHTML = `<div class="wrap page">
      <h1 class="display-l">Test results</h1>
      <p class="muted">${plural(rows.length, "task result")} from ${plural(participants, "participant")}, stored in this browser.</p>
      <div class="actions">
        <button type="button" class="btn btn-primary" id="res-csv">Download CSV</button>
        <button type="button" class="btn btn-primary" id="res-json">Download JSON</button>
        <button type="button" class="btn btn-outline" id="res-clear">Clear all results</button>
        ${session ? `<button type="button" class="btn btn-outline" id="res-reset">Discard in-progress session</button>` : ""}
        <a class="btn btn-outline" href="./?test">Start a test</a><a class="btn btn-outline" href="./">Normal site</a>
      </div>
      <h2 class="heading-s" style="margin:24px 0 12px">Summary by task</h2>
      ${table(summary, ["task", "participants", "mean_score", "success", "partial", "fail", "gave_up", "mean_ease", "median_seconds", "top_first_click"])}
      <h2 class="heading-s" style="margin:32px 0 12px">Every task result</h2>
      ${table(rows, RESULT_COLS)}</div>`;
    $("#res-csv").onclick = () => download(`hifi-test-results-${stamp()}.csv`, toCSV(rows, RESULT_COLS), "text/csv");
    $("#res-json").onclick = () => download(`hifi-test-results-${stamp()}.json`, JSON.stringify(rows, null, 2), "application/json");
    $("#res-clear").onclick = () => { if (confirm("Delete all test results in this browser? Download them first if you need them.")) { remove(KEY_RESULTS); viewResults(); } };
    if (session) $("#res-reset").onclick = () => { if (confirm("Discard the unfinished session? Its completed tasks stay in the results.")) { remove(KEY_SESSION); viewResults(); } };
  }

  // ---------- Boot ----------
  buildChrome();
  if (MODE === "results") { $("#site-header").hidden = true; viewResults(); return; }
  initMenus();
  initRecording();
  window.addEventListener("hashchange", render);
  render();
  if (MODE === "test") initTest();
})();
