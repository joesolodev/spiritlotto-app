// Screens follow the Stage 1 mockups in design/mockups/ (Main, Picker, PlayToday).
import { GAMES, GAME_ORDER } from "./games.js";
import { generateTicket, formatTicket } from "./picker.js";
import { evPerDollar, goodMoment } from "./ev.js";
import { Budget, HELPLINE } from "./budget.js";
import { sproutScene, sproutSmall, ritualArt, ICONS, CHECK } from "./art.js";
import { initStage2 } from "./stage2.js";
import { ritualSteps, LOSS_PRACTICE, targetDraw, findDraw, resultReadyAt, scoreTicket, tierLabel } from "./ritual.js";

const screen = document.getElementById("screen");
const tabbar = document.getElementById("tabbar");
const DEFAULT_SANKALPA = "I live in abundance, security and freedom, and I share it generously.";

// ---------- storage ----------
function safeStorage() {
  try {
    const s = window.localStorage;
    s.setItem("cp.test", "1");
    s.removeItem("cp.test");
    return s;
  } catch {
    const m = new Map(); // private window etc.: works for this visit only
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
  }
}
const storage = safeStorage();
const budget = new Budget(storage);
const getJson = (k, d) => { try { return JSON.parse(storage.getItem(k)) ?? d; } catch { return d; } };
const setJson = (k, v) => { try { storage.setItem(k, JSON.stringify(v)); } catch {} };
let profile = getJson("cp.profile", null); // { name, sankalpa }

// ---------- data ----------
let model = null, jackpots = null, results = null;
const past = {};
async function loadJson(path) {
  try {
    const r = await fetch(path, { cache: "no-cache" });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

// ---------- helpers ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (x) => "$" + Math.round(x).toLocaleString("en-US");
const short = (x) => (x >= 1e9 ? `$${+(x / 1e9).toFixed(2)}B` : x >= 1e6 ? `$${Math.round(x / 1e6)}M` : x >= 1e3 ? `$${Math.round(x / 1e3)}K` : money(x));
const longDate = (d) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function partOfDay(h) { return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"; }

// ---------- today's numbers ----------
function todayRows() {
  if (!model) return [];
  const rows = [];
  for (const k of GAME_ORDER) {
    const g = GAMES[k];
    if (g.digits) {
      rows.push({ game: g, label: "about $536", ev: evPerDollar(model, g.name, null) });
      continue;
    }
    const info = jackpots?.games?.[g.name];
    if (!info?.jackpot) continue;
    rows.push({
      game: g,
      label: short(info.jackpot),
      jackpot: info.jackpot,
      ev: evPerDollar(model, g.name, info.jackpot, { cash: info.cash ?? null }),
      moment: goodMoment(g.name, info.jackpot),
    });
  }
  return rows.sort((a, b) => b.ev - a.ev);
}
function verdict() {
  const m = todayRows().find((r) => r.moment);
  if (m) {
    return {
      good: true, row: m,
      title: "A rare good moment.",
      text: `${m.moment.text} It's still a losing bet on average, so stay inside your budget.`,
      short: `${m.game.name} is at ${m.label}. A rare good moment.`,
    };
  }
  return { good: false, title: "Not today. Rest.", text: "No game is near a good moment. Your budget stays safe.", short: "Not today. A good day to rest." };
}

// ---------- tab bar ----------
// The mockups' tab bar: Home, Pick, Ritual, Journal. Budget and the 30 days open from Home.
const TABS = [["home", "Home"], ["pick", "Pick"], ["ritual", "Ritual"], ["journal", "Journal"]];
function renderTabs(active) {
  document.body.classList.remove("dusk", "skyday");
  tabbar.hidden = false;
  tabbar.innerHTML = TABS.map(([id, label]) =>
    `<a href="#${id}"${id === active ? ' aria-current="page"' : ""}>${ICONS[id]}${label}</a>`).join("");
}

// ---------- first-time setup ----------
function renderSetup() {
  tabbar.hidden = true;
  const newYear = !!profile; // returning user: only the budget needs setting
  screen.innerHTML = `
    <div class="head">
      <h1 class="title">${newYear ? `Happy new year, ${esc(profile.name)}.` : "Hi, I'm Sprout."}</h1>
      <p class="sub">${newYear ? "Time to set this year's play budget." : "Let's set things up. It takes a minute."}</p>
    </div>
    <div class="card sky">${sproutSmall()}<p class="card-text">I'll help you play lightly: random numbers, honest odds, and a budget that keeps play fun.</p></div>
    <form id="setup" class="card" novalidate>
      <label class="field"><span>Your name</span><input id="s-name" autocomplete="given-name" required maxlength="40" value="${esc(profile?.name)}"></label>
      <label class="field"><span>Yearly play budget</span><div class="money"><input id="s-budget" type="number" min="1" step="1" inputmode="numeric" placeholder="240" required></div></label>
      <p class="small muted">You can lower it during the year, but not raise it. When it's spent, play rests until January.</p>
      <label class="field"><span>Your sankalpa</span><textarea id="s-sankalpa" maxlength="240">${esc(profile?.sankalpa || DEFAULT_SANKALPA)}</textarea></label>
      <p class="msg" id="s-msg" role="status"></p>
      <button class="btn">Begin</button>
    </form>`;
  document.getElementById("setup").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("s-name").value.trim();
    const amount = document.getElementById("s-budget").value;
    const sankalpa = document.getElementById("s-sankalpa").value.trim() || DEFAULT_SANKALPA;
    if (!name) return (document.getElementById("s-msg").textContent = "What should I call you?");
    if (!budget.isSet) {
      const r = budget.setBudget(amount);
      if (!r.ok) return (document.getElementById("s-msg").textContent = "Enter a whole dollar amount for your budget.");
    }
    profile = { name, sankalpa };
    setJson("cp.profile", profile);
    location.hash = "#home";
    route();
  });
}

// ---------- home ----------
function renderHome() {
  renderTabs("home");
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const v = verdict();
  const status = budget.locked ? "Sprout is resting until January" : v.good ? "Sprout perked up today" : "Sprout is resting easy";
  const pct = budget.isSet ? Math.min(100, (budget.spent / budget.budget) * 100) : 0;
  const seenKey = v.good ? `cp.moment.${v.row.game.name}.${jackpots?.games?.[v.row.game.name]?.drawDate}` : null;
  const showMoment = v.good && !storage.getItem(seenKey);
  if (showMoment) { try { storage.setItem(seenKey, "1"); } catch {} }

  screen.innerHTML = `
    <div class="head-row">
      <div class="head">
        <div class="sub small" style="font-size:14px">${weekday} ${partOfDay(now.getHours())}</div>
        <h1 class="title">Good ${partOfDay(now.getHours())}, ${esc(profile.name)}</h1>
      </div>
      ${stage2.homePill()}
    </div>
    ${readyResults().map((p) => `<a class="row-card" href="#result/${p.id}" style="background:var(--soft-sun);color:var(--soft-sun-ink)">
      <div class="icon-tile" style="background:#FFF8E6">${ICONS.sun}</div>
      <div class="grow"><div class="row-title">Your ${esc(p.game)} result is ready</div><div class="row-sub" style="color:var(--soft-sun-ink)">Open it after your morning practice. It shows once.</div></div>${ICONS.chevron}</a>`).join("")}
    ${showMoment ? `<div class="card sun"><p class="card-title">A good moment is here.</p><p class="card-text">${esc(v.short)} I'll only tell you this once.</p></div>` : ""}
    <div class="scene">${sproutScene()}<div class="scene-label">${status}</div></div>
    <div class="card">
      <div class="label">My sankalpa</div>
      <div class="sankalpa">${esc(profile.sankalpa)}</div>
    </div>
    ${stage2.homeCard()}
    <a class="row-card" href="#today">
      <div class="icon-tile">${ICONS.moon}</div>
      <div class="grow"><div class="row-title">Should I play today?</div><div class="row-sub">${model ? esc(v.short) : "Loading…"}</div></div>
      ${ICONS.chevron}
    </a>
    <a class="row-card" href="#budget" style="flex-direction:column;align-items:stretch;gap:10px">
      <div class="split"><div>Yearly play budget</div><div class="muted" style="font-size:14px">${money(budget.spent)} of ${money(budget.budget || 0)}</div></div>
      <div class="track"><div class="fill" style="width:${pct}%"></div></div>
    </a>`;
}

// ---------- picker ----------
let pickKey = GAMES[storage.getItem("cp.game")] ? storage.getItem("cp.game") : "powerball";
let ticket = null;
let pickMsg = "";

const SPECIAL_NOTE = { powerball: "The gold ball is the Powerball.", megamillions: "The gold ball is the Mega Ball.", superlotto: "The gold ball is the Mega number." };
function filterChecks(g) {
  if (g.digits) return ["Three different digits, no triples", "No straight runs like 123", "Play as a straight bet, in this order"];
  const low = { 0: "All above 31, away from birthdays", 1: "Mostly above 31, away from birthdays", 2: "Mostly above 31, away from birthdays" }[g.lowLimit];
  return [low, "No runs or even spacing", "Not a past winning combination"];
}

function renderPick() {
  renderTabs("pick");
  const g = GAMES[pickKey];
  if (!ticket && budget.canAfford(g.price)) ticket = generateTicket(g, { filter: true, pastWinners: past[g.name] });
  const afford = budget.canAfford(g.price);
  let balls = "";
  if (ticket) {
    balls = ticket.digits
      ? ticket.digits.map((d) => `<div class="ball">${d}</div>`).join("")
      : ticket.main.map((n) => `<div class="ball">${n}</div>`).join("") + (g.special ? `<div class="ball special" aria-label="${g.special.name} ${ticket.special}">${ticket.special}</div>` : "");
  }
  const note = g.digits ? "Three digits, in this order." : SPECIAL_NOTE[pickKey] || "Five numbers, no bonus ball.";

  screen.innerHTML = `
    <div class="head">
      <h1 class="title">Pick my numbers</h1>
      <p class="sub">Truly random, then filtered for you.</p>
    </div>
    <div class="chips" role="group" aria-label="Game">
      ${GAME_ORDER.map((k) => `<button class="chip" data-game="${k}" aria-pressed="${k === pickKey}">${GAMES[k].name}</button>`).join("")}
    </div>
    ${budget.locked
      ? `<div class="card sun"><p class="card-title">Your budget for this year is spent.</p><p class="card-text">Sprout says rest. See you in January.</p></div>`
      : !afford
        ? `<div class="card sun"><p class="card-title">Not enough budget left for ${g.name}.</p><p class="card-text">You have ${money(budget.remaining)} left. A ${money(g.price)} game won't fit.</p></div>`
        : `<div class="card big">
            <div class="label">Your ${g.name} numbers</div>
            <div class="balls">${balls}</div>
            <div class="small muted">${note}</div>
            <button class="btn" id="draw">Draw new numbers</button>
          </div>`}
    <div class="card sun" style="gap:4px">
      <p class="card-title">Same odds of winning.</p>
      <p class="card-text">If you win, you're less likely to share the prize, because few people play numbers like these.</p>
    </div>
    <div class="card" style="gap:12px">
      <div class="label">Filters applied</div>
      ${filterChecks(g).map((t) => `<div class="check">${CHECK}${t}</div>`).join("")}
    </div>
    <button class="btn outline" id="log" ${ticket && afford ? "" : "disabled"}>Log this ticket (${money(g.price)} of budget)</button>
    <p class="msg" role="status">${esc(pickMsg)}</p>`;

  screen.querySelectorAll("[data-game]").forEach((b) => b.addEventListener("click", () => {
    pickKey = b.dataset.game;
    try { storage.setItem("cp.game", pickKey); } catch {}
    ticket = null; pickMsg = "";
    renderPick();
  }));
  document.getElementById("draw")?.addEventListener("click", () => {
    ticket = generateTicket(g, { filter: true, pastWinners: past[g.name] });
    pickMsg = "";
    renderPick();
  });
  document.getElementById("log").addEventListener("click", () => {
    const jp = jackpots?.games?.[g.name]?.jackpot;
    const r = budget.logPlay({
      game: g.name, tickets: 1, cost: g.price, numbers: [formatTicket(g, ticket)], goodMoment: !!(jp && goodMoment(g.name, jp)),
      ticket, target: targetDraw(g.name, new Date()),
    });
    if (!r.ok) { pickMsg = "That would go over your budget, so it wasn't logged."; care(); }
    else {
      pickMsg = `Logged. ${money(budget.remaining)} left this year. Copy these onto your playslip.`;
      if (r.warn) care();
    }
    renderPick(); // keeps showing the numbers just logged
    document.getElementById("log").disabled = true;
    if (r.ok) {
      const a = document.createElement("a");
      a.href = "#ritual";
      a.className = "btn";
      a.style.cssText = "display:flex;align-items:center;justify-content:center;text-decoration:none;background:var(--sun);color:var(--sun-ink)";
      a.textContent = "Begin the drawing-day ritual";
      screen.append(a);
    }
  });
}

// ---------- should I play today ----------
function renderToday() {
  renderTabs("home");
  const v = verdict();
  const rows = todayRows();
  const updated = jackpots?.updated ? new Date(jackpots.updated) : null;
  const stale = updated && (Date.now() - updated) / 86400000 > 4;
  screen.innerHTML = `
    <div class="head">
      <h1 class="title">Should I play today?</h1>
      <p class="sub">${updated ? `Jackpots as of ${longDate(updated)}${stale ? ". These may be out of date." : ""}` : "Jackpot data is missing."}</p>
    </div>
    <div class="card sky">${sproutSmall()}
      <div class="grow" style="gap:2px">
        <div style="font-size:22px;font-weight:900">${v.title}</div>
        <div class="card-text" style="color:#2F4F49">${esc(v.text)}</div>
      </div>
    </div>
    <div class="card" style="gap:13px">
      <div class="split label"><div>Game and jackpot</div><div>Back per $1, after tax</div></div>
      ${rows.map((r) => `
        <div style="display:flex;flex-direction:column;gap:5px">
          <div class="split"><div>${r.game.name} · ${r.label}</div><div>$${r.ev.toFixed(2)}</div></div>
          <div class="track thin"><div class="fill" style="width:${Math.min(100, r.ev * 100)}%"></div></div>
        </div>`).join("") || `<p class="muted">Couldn't load the numbers.</p>`}
    </div>
    <div class="card sun" style="gap:4px">
      <p class="card-title">When is a good moment?</p>
      <p class="card-text">Powerball near $1 billion. I'll let you know, once, when it gets there.</p>
    </div>
    <div class="card" style="gap:8px">
      <div class="label">Best game for your goal</div>
      <div class="split"><div class="muted">Any win</div><div>Fantasy 5</div></div>
      <div class="split"><div class="muted">About $500</div><div>Daily 3</div></div>
      <div class="split"><div class="muted">Millions per dollar</div><div>SuperLotto Plus</div></div>
    </div>
    <p class="helpline">A full bar would be $1 back for every $1. Need to talk? <a href="tel:18004262537">${HELPLINE}</a></p>`;
}

// ---------- budget ----------
let budgetMsg = "";
function renderBudget() {
  renderTabs("home");
  const pct = budget.isSet ? Math.min(100, (budget.spent / budget.budget) * 100) : 0;
  const plays = [...budget.plays].reverse();
  const wins = [...budget.wins].reverse();
  screen.innerHTML = `
    <div class="head">
      <h1 class="title">My budget</h1>
      <p class="sub">${budget.state.year}. It resets each January.</p>
    </div>
    <div class="card">
      <div class="split"><div>Yearly play budget</div><div class="muted" style="font-size:14px">${money(budget.spent)} of ${money(budget.budget || 0)}</div></div>
      <div class="track"><div class="fill" style="width:${pct}%"></div></div>
      <p class="small muted">${money(Math.max(0, budget.remaining))} left. You can lower your budget, but not raise it.</p>
      <form id="lower" class="inline">
        <label class="sr" for="b-in">New budget</label>
        <div class="money"><input id="b-in" type="number" min="1" step="1" inputmode="numeric" placeholder="Lower to…"></div>
        <button class="btn small">Lower</button>
      </form>
      <p class="msg" role="status">${esc(budgetMsg)}</p>
    </div>
    <div class="card">
      <div class="label">Tickets this year</div>
      <ul class="log">${plays.length ? plays.map((p) => `
        <li><div><div>${p.date} · ${esc(p.game)} · ${money(p.cost)}</div><div class="nums">${p.numbers.map(esc).join("<br>")}</div></div>
        ${budget.canDeletePlay(p) ? `<button class="link" data-del-play="${p.id}">Delete</button>` : ""}</li>`).join("") : `<li class="muted">None yet.</li>`}
      </ul>
    </div>
    <div class="card">
      <div class="label">Wins</div>
      <p class="small muted">Kept separate. Wins never add to your budget.</p>
      <form id="win" class="inline">
        <select id="w-game" aria-label="Game">${GAME_ORDER.map((k) => `<option>${GAMES[k].name}</option>`).join("")}</select>
        <div class="money"><input id="w-amt" type="number" min="1" step="1" inputmode="numeric" placeholder="Amount" aria-label="Amount"></div>
        <button class="btn small">Log</button>
      </form>
      <ul class="log">${wins.map((w) => `
        <li><div>${w.date} · ${esc(w.game)} · ${money(w.amount)}</div><button class="link" data-del-win="${w.id}">Delete</button></li>`).join("")}
      </ul>
    </div>
    <div class="card">
      <div class="label">About me</div>
      <form id="me" style="display:flex;flex-direction:column;gap:10px">
        <label class="field"><span>Name</span><input id="m-name" maxlength="40" value="${esc(profile.name)}"></label>
        <label class="field"><span>Sankalpa</span><textarea id="m-sank" maxlength="240">${esc(profile.sankalpa)}</textarea></label>
        <button class="btn small" style="align-self:flex-start">Save</button>
      </form>
    </div>
    <p class="helpline">Need to talk? Free, confidential help any time: <a href="tel:18004262537">${HELPLINE}</a></p>`;

  document.getElementById("lower").addEventListener("submit", (e) => {
    e.preventDefault();
    const r = budget.setBudget(document.getElementById("b-in").value);
    budgetMsg = r.ok ? "Saved." : r.reason === "raise" ? "The budget can't be raised during the year." : "Enter a whole dollar amount.";
    renderBudget();
    if (r.reason === "raise") care();
  });
  document.getElementById("win").addEventListener("submit", (e) => {
    e.preventDefault();
    budget.logWin({ game: document.getElementById("w-game").value, amount: document.getElementById("w-amt").value });
    renderBudget();
  });
  document.getElementById("me").addEventListener("submit", (e) => {
    e.preventDefault();
    profile = { name: document.getElementById("m-name").value.trim() || profile.name, sankalpa: document.getElementById("m-sank").value.trim() || profile.sankalpa };
    setJson("cp.profile", profile);
    budgetMsg = "Saved.";
    renderBudget();
  });
  screen.querySelectorAll("[data-del-play]").forEach((b) => b.addEventListener("click", () => {
    if (confirm("Delete this ticket? Only do this for a mistake. Tickets can only be deleted on the day you log them.")) { budget.deletePlay(b.dataset.delPlay); renderBudget(); }
  }));
  screen.querySelectorAll("[data-del-win]").forEach((b) => b.addEventListener("click", () => {
    if (confirm("Delete this win?")) { budget.deleteWin(b.dataset.delWin); renderBudget(); }
  }));
}

// ---------- ritual ----------
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const ritualPlays = () => budget.plays.filter((p) => p.ticket && p.target);
const unsealed = () => ritualPlays().filter((p) => !p.sealedAt && p.target.date >= todayStr());
const waiting = () => ritualPlays().filter((p) => p.sealedAt && !p.resultSeenAt && new Date() < resultReadyAt(p.target));
// Every logged ticket gets its result once, the morning after, sealed or not.
const readyResults = () => ritualPlays().filter((p) => !p.resultSeenAt && new Date() >= resultReadyAt(p.target));
const drawLabel = (t) => {
  const [y, m, d] = t.date.split("-").map(Number);
  const day = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return t.slot ? `${day}, ${t.slot} draw` : day;
};

let timer = null;
function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

function renderRitualHome() {
  renderTabs("ritual");
  const open = unsealed();
  const wait = waiting();
  screen.innerHTML = `
    <div class="head">
      <h1 class="title">Drawing-day ritual</h1>
      <p class="sub">About 15 minutes, eight small steps.</p>
    </div>
    ${open.length ? `
      <div class="card">
        <div class="label">Ready when you are</div>
        ${open.map((p) => `<div class="split"><div>${esc(p.game)}</div><div class="muted small">${esc(drawLabel(p.target))}</div></div><div class="nums small">${esc(p.numbers[0])}</div>`).join("")}
        <a class="btn" href="#ritual/1" style="display:flex;align-items:center;justify-content:center;text-decoration:none;margin-top:6px">Begin the ritual</a>
      </div>`
    : `<div class="card sky">${sproutSmall()}<div class="grow" style="gap:4px"><div class="card-title">No ticket waiting</div><div class="card-text">The ritual is for a ticket you've logged from your budget. Pick and log one first.</div></div></div>
       <a class="btn outline" href="#pick" style="display:flex;align-items:center;justify-content:center;text-decoration:none">Pick my numbers</a>`}
    ${wait.length ? `
      <div class="card">
        <div class="label">Sealed</div>
        ${wait.map((p) => `<div class="split"><div>${esc(p.game)}</div><div class="muted small">${esc(drawLabel(p.target))}</div></div>`).join("")}
        <p class="small muted">Each result opens once, the morning after its draw. No alerts tonight.</p>
      </div>` : ""}
    <div class="card sun" style="gap:4px">
      <p class="card-title">The ritual doesn't change the odds.</p>
      <p class="card-text">It's there to make the day about presence, gratitude and letting go, instead of anxious hoping.</p>
    </div>`;
}

function renderRitualStep(n) {
  stopTimer();
  const steps = ritualSteps(profile.sankalpa);
  const step = steps[n - 1];
  if (!step) { location.hash = "#ritual"; return; }
  document.body.classList.add("dusk");
  tabbar.hidden = true;
  let panel = ritualArt(step.art);
  if (step.art === "counter") {
    panel = `<button class="counter" id="count" aria-live="polite"><span id="count-n">0</span><small>of 21</small></button>`;
  } else if (step.art === "gratitude") {
    panel = `<div class="grat">${[1, 2, 3].map((i) => `<label class="sr" for="g${i}">Gratitude ${i}</label><input id="g${i}" placeholder="${["Someone I love", "Something in my body", "A small daily joy"][i - 1]}" autocomplete="off">`).join("")}</div>`;
  }
  screen.innerHTML = `
    <div class="head-row">
      <a class="round" href="#ritual" aria-label="Close ritual">${ICONS.close}</a>
      <div class="dusk-muted" style="font-size:14px;font-weight:800">Step ${n} of ${steps.length}</div>
    </div>
    <div class="segs">${steps.map((_, i) => `<div class="${i < n ? "on" : ""}"></div>`).join("")}</div>
    <div class="head" style="text-align:center;padding-top:6px;gap:4px">
      <div class="label dusk-muted">${step.eyebrow}</div>
      <h1 class="title" style="font-size:30px">${step.title}</h1>
    </div>
    <div class="dusk-panel">${panel}</div>
    <p class="ritual-text">${esc(step.text)}</p>
    ${step.quote ? `<p class="ritual-quote">"${esc(step.quote)}"</p>` : ""}
    ${step.after ? `<p class="ritual-text">${esc(step.after)}</p>` : ""}
    ${step.minutes >= 2 ? `<button class="timer" id="timer">Start a ${step.minutes}-minute timer</button>` : `<p class="dusk-muted small" style="text-align:center">About ${step.minutes} minute</p>`}
    <div style="flex-grow:1"></div>
    ${step.notice ? `<div class="dusk-note">${ICONS.sun}<div>${esc(step.notice)}</div></div>` : ""}
    <button class="btn sunny" id="next">${step.seals ? "Seal the ticket" : n === steps.length ? "Return to my day" : "Next"}</button>`;

  document.getElementById("next").addEventListener("click", () => {
    stopTimer();
    if (step.seals) {
      const at = new Date().toISOString();
      for (const p of unsealed()) budget.markPlay(p.id, { sealedAt: at });
    }
    location.hash = n === steps.length ? "#home" : `#ritual/${n + 1}`;
  });
  const t = document.getElementById("timer");
  t?.addEventListener("click", () => {
    if (timer) return;
    const end = Date.now() + step.minutes * 60000;
    const tick = () => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      t.textContent = left ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "Time's up. Continue when you're ready.";
      if (!left) stopTimer();
    };
    tick();
    timer = setInterval(tick, 1000);
  });
  const c = document.getElementById("count");
  c?.addEventListener("click", () => {
    const el = document.getElementById("count-n");
    const v = Math.min(21, Number(el.textContent) + 1);
    el.textContent = String(v);
    if (v === 21) c.classList.add("done");
  });
}

// ---------- the morning-after result ----------
function renderResult(id) {
  renderTabs("home");
  const p = budget.plays.find((x) => x.id === id);
  if (!p || !p.ticket) { location.hash = "#home"; return; }
  const g = GAMES[Object.keys(GAMES).find((k) => GAMES[k].name === p.game)];
  const ready = resultReadyAt(p.target);
  const head = `<div class="head"><h1 class="title">${esc(p.game)}</h1><p class="sub">${esc(drawLabel(p.target))}</p></div>`;
  if (new Date() < ready) {
    screen.innerHTML = `${head}<div class="card sky">${sproutSmall()}<div class="card-text">Not yet. Your result opens at 6 a.m. on ${ready.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, after your practice.</div></div>`;
    return;
  }
  const draw = findDraw(results?.games?.[p.game], p.target);
  if (!draw) {
    screen.innerHTML = `${head}<div class="card sky">${sproutSmall()}<div class="card-text">The results for this draw haven't been downloaded yet. Check back a little later.</div></div>`;
    return;
  }
  if (!p.resultSeenAt) budget.markPlay(p.id, { resultSeenAt: new Date().toISOString() });
  const s = scoreTicket(p.game, p.ticket, draw);
  const drawnSet = new Set(draw.main);
  const mineBalls = p.ticket.digits
    ? p.ticket.digits.map((d, i) => `<div class="ball${d === draw.main[i] ? " hit" : ""}">${d}</div>`).join("")
    : p.ticket.main.map((n) => `<div class="ball${drawnSet.has(n) ? " hit" : ""}">${n}</div>`).join("") +
      (g.special ? `<div class="ball special${s.specialMatch ? " hit" : ""}">${p.ticket.special}</div>` : "");
  const drawnBalls = draw.main.map((n) => `<div class="ball">${n}</div>`).join("") + (g.special ? `<div class="ball special">${draw.special}</div>` : "");
  const listed = s.prize ? money(s.prize) : null;

  let body;
  if (!s.win) {
    body = `
      <div class="card sky">${sproutSmall()}<div class="grow" style="gap:2px"><div style="font-size:22px;font-weight:900">Not this time.</div><div class="card-text">The draw was random. Your practice is measured by your peace, not by the balls.</div></div></div>
      <div class="card">
        <div class="label">Loss as practice · 2 minutes</div>
        ${LOSS_PRACTICE.map((t, i) => `<div class="check"><span class="stepnum">${i + 1}</span>${esc(t)}</div>${i === 2 ? `<div class="sankalpa" style="font-size:16px;padding-left:38px">${esc(profile.sankalpa)}</div>` : ""}${i === 3 ? `<input placeholder="One abundance I already have" aria-label="One abundance I already have" style="margin-left:38px;width:calc(100% - 38px)">` : ""}`).join("")}
      </div>
      <p class="small muted" style="text-align:center">A lost drawing is never a sign that you are spiritually failing.</p>`;
  } else {
    const what = s.jackpot ? "the jackpot" : s.freePlay ? "a free ticket" : listed ? `about ${listed}` : "a prize";
    body = `
      <div class="card sky">${sproutSmall()}<div class="grow" style="gap:2px"><div style="font-size:22px;font-weight:900">You won ${what}.</div><div class="card-text">${esc(tierLabel(p.game, s.tier))}. Take a breath before anything else.</div></div></div>
      ${p.game === "Mega Millions" && listed ? `<p class="small muted">California lists ${listed} as the base prize. Your ticket's multiplier raises it.</p>` : ""}
      <div class="card">
        <div class="label">How to claim</div>
        <p class="card-text">Sign the back of your ticket. Prizes of $599 or less can be claimed at any California Lottery retailer. Larger prizes are claimed at a Lottery District Office or by mail.</p>
        ${s.jackpot || (s.prize || 0) >= 100000 ? `<p class="card-text"><strong>Before you claim:</strong> talk to a fee-only fiduciary advisor, a tax professional and an estate attorney, as in your "If I Win" plan. California makes winners' names public, so plan for privacy.</p>` : ""}
      </div>
      ${s.prize ? `<button class="btn outline" id="logwin">Log this win</button>` : ""}
      <p class="msg" id="win-msg" role="status"></p>`;
  }
  screen.innerHTML = `${head}
    <div class="card big" style="gap:12px">
      <div class="label">Drawn</div><div class="balls">${drawnBalls}</div>
      <div class="label">Yours</div><div class="balls">${mineBalls}</div>
    </div>
    ${body}
    <a class="btn outline" href="#home" style="display:flex;align-items:center;justify-content:center;text-decoration:none">Close</a>`;
  document.getElementById("logwin")?.addEventListener("click", (e) => {
    budget.logWin({ game: p.game, amount: s.prize });
    e.target.disabled = true;
    document.getElementById("win-msg").textContent = "Logged under Wins. It doesn't add to your budget.";
  });
}

// ---------- care note ----------
function care() {
  const div = document.createElement("div");
  div.className = "card sun";
  div.setAttribute("role", "alert");
  div.innerHTML = `<p class="card-title">It might be worth a pause.</p>
    <p class="card-text">Free, confidential help is available any time: <a href="tel:18004262537">${HELPLINE}</a>.</p>
    <button class="link" style="align-self:flex-start">Close</button>`;
  div.querySelector("button").addEventListener("click", () => div.remove());
  screen.prepend(div);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- router ----------
function route() {
  if (!profile || !budget.isSet) return renderSetup();
  stopTimer();
  stage2.leave();
  const [page, arg] = (location.hash.slice(1) || "home").split("/");
  if (page === "ritual" && arg) renderRitualStep(Number(arg));
  else if (page === "result" && arg) renderResult(arg);
  else if (stage2.routes[page]) stage2.routes[page](arg);
  else ({ home: renderHome, pick: renderPick, today: renderToday, ritual: renderRitualHome, budget: renderBudget }[page] || renderHome)();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", () => { budgetMsg = ""; pickMsg = ""; route(); });

const stage2 = initStage2({
  screen, tabbar, renderTabs, esc, storage,
  getProfile: () => profile,
  setProfile: (p) => { profile = p; setJson("cp.profile", profile); },
});

route();
const [m, j, p, res, prac] = await Promise.all([loadJson("data/model.json"), loadJson("data/jackpots.json"), loadJson("data/past_winners.json"), loadJson("data/results.json"), loadJson("data/practice.json")]);
stage2.setContent(prac);
model = m;
jackpots = j;
results = res;
for (const [name, list] of Object.entries(p?.games || {})) past[name] = new Set(list);
ticket = null; // redraw now that the past-winners list is loaded
if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA" && !location.hash.startsWith("#timer")) route();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
