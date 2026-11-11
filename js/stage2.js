// Stage 2 screens: the 30-day calendar, meditation timers with the bowl, the journal and the
// symbol journal. Layouts follow design/mockups/Calendar, Timer, Journal and Symbols.
import { Practice, PARTS, PART_LABEL, ymd } from "./practice.js";
import { Journal, Symbols, SYMBOL_RULE, standingPrompt } from "./journal.js";
import { MEDITATIONS, MEDITATION_ORDER, totalSeconds, phaseAt, clock } from "./meditations.js";
import { ringBowl, PITCHES } from "./bowl.js";
import { getRecording, saveRecording, deleteRecording, canRecord, startRecording } from "./voice.js";

const SANKALPA_RULES = ["Short (under 15 words).", "Present tense.", "Positive (name what is, not what isn't).", "Personal.", "Felt as true at some level when you say it.", "Once chosen, keep it for at least the 30 days. Changing it often weakens it."];
const TICK = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`;
const LOCK = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F6B64" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
const STAR = `<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4A3300" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 3l2.5 5.5 6 .7-4.5 4 1.3 5.8L12 16l-5.3 3 1.3-5.8-4.5-4 6-.7z"/></svg>`;
const BACK = `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A34" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>`;
const PLUS = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
const PLAY = `<svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>`;
const PAUSE = `<svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="#FFFFFF"><rect x="5" y="4" width="5" height="16" rx="2"/><rect x="14" y="4" width="5" height="16" rx="2"/></svg>`;
const BOWL = `<svg aria-hidden="true" width="28" height="22" viewBox="0 0 28 22" fill="none" stroke="#4A3300" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h22c0 7-4 12-11 12S3 15 3 8z"/><path d="M19 2l6 5"/></svg>`;
const MIC = `<svg aria-hidden="true" width="24" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A34" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;

export function initStage2({ screen, tabbar, renderTabs, esc, storage, getProfile, setProfile }) {
  const practice = new Practice(storage);
  const journal = new Journal(storage);
  const symbols = new Symbols(storage);
  let content = null; // app/data/practice.json
  let selectedDay = null;
  let msg = "";

  const linkBtn = (href, label, cls = "btn") => `<a class="${cls}" href="${href}" style="display:flex;align-items:center;justify-content:center;text-decoration:none">${label}</a>`;
  const dayData = (n) => content?.days?.[n - 1];
  const shortDate = (iso) => {
    const d = new Date(iso);
    const t = new Date(); const y = new Date(); y.setDate(t.getDate() - 1);
    if (ymd(d) === ymd(t)) return "Today";
    if (ymd(d) === ymd(y)) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const flash = (t) => { msg = t; };
  const takeMsg = () => { const m = msg; msg = ""; return m; };

  // ---------- home bits ----------
  function homePill() {
    if (!practice.started) return `<a class="pill" href="#practice" style="text-decoration:none">Start 30 days</a>`;
    if (practice.complete) return `<a class="pill" href="#practice" style="text-decoration:none">30 days done</a>`;
    return `<a class="pill" href="#practice" style="text-decoration:none">${practice.paused ? "Paused" : `Day ${practice.day} of 30`}</a>`;
  }
  function homeCard() {
    if (!content || !practice.started || practice.paused) return "";
    if (practice.complete) {
      return `<a class="row-card" href="#journal"><div class="grow"><div class="row-title">Today's reflection</div><div class="row-sub">${esc(standingPrompt(new Date()))}</div></div></a>`;
    }
    const d = dayData(practice.day);
    return `<a class="row-card" href="#practice"><div class="grow"><div class="row-title">Day ${d.n}: ${esc(d.title)}</div><div class="row-sub">"${esc(d.intention)}" · ${practice.doneCount(d.n)} of 5</div></div></a>`;
  }

  // ---------- 30-day calendar ----------
  function renderPractice(arg) {
    renderTabs("home");
    if (!content) { screen.innerHTML = `<p class="muted">Loading…</p>`; return; }
    if (!practice.started) {
      screen.innerHTML = `
        <div class="head"><h1 class="title">My 30 days</h1><p class="sub">A practice of clearing, embodiment, surrender and action.</p></div>
        <div class="card">
          <div class="label">Every day</div>
          <p class="card-text">${esc(cap(content.dailyCore))}</p>
        </div>
        <div class="card" style="gap:8px">
          ${content.weeks.map((w) => `<div><div class="row-title">Week ${w.n}: ${esc(w.title)}</div><div class="row-sub">${esc(cap(w.theme))}</div></div>`).join("")}
        </div>
        <div class="card sun" style="gap:4px"><p class="card-title">Gentle by design.</p><p class="card-text">You can pause any time. A day you miss is simply rested, never failed.</p></div>
        <button class="btn" id="begin">Begin Day 1</button>`;
      document.getElementById("begin").addEventListener("click", () => { practice.start(); renderPractice(); });
      return;
    }
    const day = Math.min(practice.day, 30);
    const n = arg ? Math.max(1, Math.min(Number(arg) || day, day)) : day;
    selectedDay = n;
    const d = dayData(n);
    const week = content.weeks[d.week - 1];
    const COLORS = { done: ["#1F7A68", "#FFFFFF"], today: ["#F5B83D", "#2B2000"], rested: ["#D6ECF5", "#1E3A34"], upcoming: ["#EAF4EA", "#4F6B64"] };
    const grid = Array.from({ length: 30 }, (_, i) => {
      const k = i + 1, st = practice.complete ? (practice.doneCount(k) ? "done" : "rested") : practice.status(k);
      const [bg, fg] = COLORS[st];
      const sel = k === n ? "box-shadow:0 0 0 3px #1E3A34;" : "";
      const tag = st === "upcoming" ? "div" : "a";
      return `<${tag} ${tag === "a" ? `href="#practice/${k}"` : ""} class="daycell" style="background:${bg};color:${fg};${sel}" aria-label="Day ${k}, ${st}">${k}</${tag}>`;
    }).join("");
    const t = practice.ticks(n);
    const row = (part, label, text, extra = "") => `
      <div class="partrow">
        <button class="tick${t[part] ? " on" : ""}" data-part="${part}" aria-pressed="${!!t[part]}" aria-label="Mark ${PART_LABEL[part]} done">${t[part] ? TICK : ""}</button>
        <div class="grow"><div class="label" style="letter-spacing:.5px">${label}</div><div class="parttext">${esc(text)}</div>${extra}</div>
      </div>`;
    const med = d.practice.meditation && MEDITATIONS[d.practice.meditation];
    const ex = d.exercise;
    const exHref = ex === "if-i-win" ? "#keep/plan" : ex === "abundance-statement" ? "#keep/statement" : ex ? `#exercise/${ex}` : null;
    const practiceExtra = med ? `<a class="minilink" href="#timer/${med.id}">Open the timer: ${esc(med.title)}</a>`
      : exHref ? `<a class="minilink" href="${exHref}">Open the exercise</a>` : "";

    screen.innerHTML = `
      <div class="head-row">
        <div class="head"><h1 class="title">My 30 days</h1><p class="sub">Week ${week.n}: ${esc(week.title)}</p></div>
        ${practice.complete ? "" : `<button class="chip" id="pause">${practice.paused ? "Resume" : "Pause"}</button>`}
      </div>
      ${practice.paused ? `<div class="card sun" style="gap:4px"><p class="card-title">Paused.</p><p class="card-text">Your days are waiting, and nothing is lost. Resume whenever you're ready.</p></div>` : ""}
      ${practice.complete ? renderOngoing() : ""}
      <div class="card daygrid">${grid}</div>
      <div class="legend"><span><i style="background:#1F7A68"></i>Done</span><span><i style="background:#F5B83D"></i>Today</span><span><i style="background:#D6ECF5"></i>Rested, no penalty</span></div>
      <div class="card" style="gap:12px">
        <div class="split"><div style="font-size:18px;font-weight:900">Day ${n}: ${esc(d.title)}</div><div class="muted" style="font-size:14px">${practice.doneCount(n)} of 5</div></div>
        ${row("intention", "Morning intention", `"${d.intention}"`)}
        ${row("practice", `Practice${d.practice.minutes ? ` · ${d.practice.minutes} min` : ""}`, d.practice.text, practiceExtra)}
        ${row("journal", "Journal", d.journal, `<a class="minilink" href="#journal/${n}">Write in the journal</a>`)}
        ${row("embodiment", "Embodiment", d.embodiment)}
        ${row("evening", "Evening reflection", d.evening)}
      </div>
      <div class="card">
        <div class="label">Every day</div>
        <p class="card-text">${esc(cap(content.dailyCore))}</p>
      </div>
      <div class="card" style="gap:4px">
        <div class="label">Meditations</div>
        ${MEDITATION_ORDER.map((id) => `<a class="listrow" href="#timer/${id}"><div>${esc(MEDITATIONS[id].title)}</div><div class="muted small">${Math.round(totalSeconds(MEDITATIONS[id]) / 60)} min</div></a>`).join("")}
      </div>`;

    document.getElementById("pause")?.addEventListener("click", () => { practice.paused ? practice.resume() : practice.pause(); renderPractice(arg); });
    screen.querySelectorAll(".tick").forEach((b) => b.addEventListener("click", () => {
      practice.tick(n, b.dataset.part, !t[b.dataset.part]);
      renderPractice(arg);
    }));
    document.getElementById("ongoing-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = document.getElementById("ongoing-in").value.trim();
      if (v) { practice.chooseOngoing(v); renderPractice(arg); }
    });
  }

  function renderOngoing() {
    const chosen = practice.ongoing;
    return `<div class="card sky" style="flex-direction:column;align-items:stretch;gap:8px">
      <div class="card-title">You've completed the 30 days.</div>
      ${chosen ? `<div class="card-text"><strong>My ongoing practice:</strong> ${esc(chosen)}</div>
        <div class="card-text">The journal now offers a standing reflection each day.</div>`
      : `<div class="card-text">${esc(content.afterDay30.text)}</div>
        <form id="ongoing-form" style="display:flex;flex-direction:column;gap:8px">
          <label class="sr" for="ongoing-in">My ongoing practice</label>
          <input id="ongoing-in" value="${esc(content.afterDay30.options[0] || "")}">
          <button class="btn small" style="align-self:flex-start">Make my vow</button>
        </form>`}
    </div>`;
  }

  // ---------- meditation timer ----------
  let session = null; // { id, elapsed, running, last, interval, lastPhase, audio }
  const pitch = () => Number(storage.getItem("spiritlotto.bowlHz")) || PITCHES[1].hz;

  function stopSession() {
    if (!session) return;
    clearInterval(session.interval);
    session.audio?.pause();
    session = null;
  }

  async function renderTimer(id) {
    const m = MEDITATIONS[id];
    if (!m) { location.hash = "#practice"; return; }
    if (!session || session.id !== id) { stopSession(); session = { id, elapsed: 0, running: false, last: 0, lastPhase: -1, useVoice: false, audio: null }; }
    document.body.classList.add("skyday");
    tabbar.hidden = true;
    const rec = await getRecording(id);
    if (!session || session.id !== id) return; // navigated away while loading
    drawTimer(m, rec);
  }

  function drawTimer(m, rec) {
    const total = totalSeconds(m);
    const s = session;
    const at = phaseAt(m, s.elapsed);
    const C = 2 * Math.PI * 112;
    const started = s.elapsed > 0 || s.running;
    const done = s.elapsed >= total;
    const prev = m.phases[at.index - 1], next = m.phases[at.index + 1];
    screen.innerHTML = `
      <div class="head-row">
        <a class="round light" href="#practice" aria-label="Back to my 30 days">${BACK}</a>
        <div style="font-size:14px;font-weight:800;color:#2F4F49">${esc(m.kind)} · ${Math.round(total / 60)} min</div>
        <div style="width:44px"></div>
      </div>
      <div class="head" style="text-align:center">
        <h1 class="title">${esc(m.title)}</h1>
        <p class="sub" style="color:#2F4F49">${done ? "Complete" : `Phase ${at.index + 1} of ${m.phases.length}`}</p>
      </div>
      <div class="ring">
        <svg aria-hidden="true" width="260" height="260" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="112" fill="#FFFFFF"/>
          <circle cx="130" cy="130" r="112" fill="none" stroke="#EAF4EA" stroke-width="16"/>
          <circle id="arc" cx="130" cy="130" r="112" fill="none" stroke="#1F7A68" stroke-width="16" stroke-linecap="round"
            stroke-dasharray="${(Math.min(s.elapsed, total) / total) * C} ${C}" transform="rotate(-90 130 130)"/>
        </svg>
        <div class="ring-in">
          <div id="elapsed" style="font-size:52px;font-weight:900;line-height:1">${clock(Math.min(s.elapsed, total))}</div>
          <div style="font-size:17px;font-weight:900;color:#17604F">${done ? "Rest here a moment" : esc(at.phase.name)}</div>
          <div id="phase-left" style="font-size:13px;font-weight:700;color:#4F6B64">${done ? "" : `${clock(at.phaseLeft)} left in this phase`}</div>
        </div>
      </div>
      <div class="card" style="text-align:center;gap:6px">
        <div class="label">${done ? "Done" : started ? "Now" : "First"}</div>
        <div style="font-size:16px;font-weight:800;line-height:1.4">${done ? "Take a breath before you move on." : esc(at.phase.cue)}</div>
      </div>
      <div class="segs light">${m.phases.map((_, i) => `<div class="${i < at.index || done ? "on" : i === at.index ? "now" : ""}"></div>`).join("")}</div>
      <div class="split" style="font-size:13px;color:#2F4F49"><div>${prev && !done ? `Before: ${esc(prev.name)}` : ""}</div><div>${next && !done ? `Next: ${esc(next.name)}` : ""}</div></div>
      ${!started ? `<p class="small" style="text-align:center;color:#2F4F49">${esc(m.note)}</p>` : ""}
      <div style="flex-grow:1"></div>
      <div class="controls">
        <button class="ctl sun" id="bowl">${BOWL}Ring the bowl</button>
        <button class="play" id="play" aria-label="${s.running ? "Pause" : done ? "Start again" : "Play"}">${s.running ? PAUSE : PLAY}</button>
        <button class="ctl" id="voice" aria-expanded="false">${MIC}My own voice</button>
      </div>
      <div id="voice-panel" class="card" hidden></div>
      <div class="pitches" role="group" aria-label="Bowl pitch">${PITCHES.map((p) => `<button class="chip small${p.hz === pitch() ? " on" : ""}" data-hz="${p.hz}">${p.label}</button>`).join("")}</div>
      ${done && practice.started && !practice.complete && dayData(practice.day)?.practice.meditation === m.id && !practice.ticks(practice.day).practice
        ? `<button class="btn" id="tickit">Mark today's practice done</button>` : ""}`;

    document.getElementById("bowl").addEventListener("click", () => ringBowl(pitch()));
    screen.querySelectorAll("[data-hz]").forEach((b) => b.addEventListener("click", () => {
      try { storage.setItem("spiritlotto.bowlHz", b.dataset.hz); } catch {}
      ringBowl(Number(b.dataset.hz));
      drawTimer(m, rec);
    }));
    document.getElementById("tickit")?.addEventListener("click", () => { practice.tick(practice.day, "practice", true); location.hash = "#practice"; });
    document.getElementById("play").addEventListener("click", () => {
      if (s.running) {
        s.running = false;
        clearInterval(s.interval);
        s.audio?.pause();
      } else {
        if (s.elapsed >= total) { s.elapsed = 0; s.lastPhase = -1; }
        s.running = true;
        s.last = Date.now();
        if (s.lastPhase === -1) { ringBowl(pitch()); s.lastPhase = 0; }
        if (s.useVoice && rec) {
          if (!s.audio) { s.audio = new Audio(URL.createObjectURL(rec)); s.audio.volume = 1; }
          s.audio.currentTime = Math.min(s.elapsed, s.audio.duration || s.elapsed);
          s.audio.play().catch(() => {});
        }
        s.interval = setInterval(() => tickTimer(m, rec), 250);
      }
      drawTimer(m, rec);
    });
    document.getElementById("voice").addEventListener("click", (e) => {
      const panel = document.getElementById("voice-panel");
      panel.hidden = !panel.hidden;
      e.currentTarget.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) drawVoicePanel(m, rec);
    });
  }

  function tickTimer(m, rec) {
    const s = session;
    if (!s || !s.running) return;
    const now = Date.now();
    s.elapsed += (now - s.last) / 1000;
    s.last = now;
    const total = totalSeconds(m);
    const at = phaseAt(m, s.elapsed);
    if (s.elapsed >= total) {
      s.elapsed = total;
      s.running = false;
      clearInterval(s.interval);
      ringBowl(pitch());
      drawTimer(m, rec);
      return;
    }
    if (at.index !== s.lastPhase) {
      s.lastPhase = at.index;
      ringBowl(pitch());
      drawTimer(m, rec);
      return;
    }
    // Light update between phases.
    const C = 2 * Math.PI * 112;
    document.getElementById("elapsed").textContent = clock(s.elapsed);
    document.getElementById("phase-left").textContent = `${clock(at.phaseLeft)} left in this phase`;
    document.getElementById("arc").setAttribute("stroke-dasharray", `${(s.elapsed / total) * C} ${C}`);
  }

  function drawVoicePanel(m, rec) {
    const panel = document.getElementById("voice-panel");
    const s = session;
    if (!canRecord()) {
      panel.innerHTML = `<p class="card-text">This browser can't record audio. You can still read the script aloud as you go.</p>`;
      return;
    }
    panel.innerHTML = `
      <div class="label">My own voice</div>
      <p class="card-text">Record the script for ${esc(m.title)} slowly, in your own voice, and it plays back with the timer. It stays on this device.</p>
      ${rec ? `<label class="switch-row"><input type="checkbox" id="usevoice" ${s.useVoice ? "checked" : ""}> Play my recording with the timer</label>
               <audio controls src="${URL.createObjectURL(rec)}" style="width:100%"></audio>` : ""}
      <div class="inline">
        <button class="btn small" id="rec">${rec ? "Record again" : "Start recording"}</button>
        ${rec ? `<button class="btn small outline" id="delrec">Delete</button>` : ""}
      </div>
      <p class="msg" id="rec-msg" role="status"></p>`;
    document.getElementById("usevoice")?.addEventListener("change", (e) => { s.useVoice = e.target.checked; });
    document.getElementById("delrec")?.addEventListener("click", async () => {
      if (!confirm("Delete this recording?")) return;
      await deleteRecording(m.id);
      s.useVoice = false; s.audio = null;
      renderTimer(m.id);
    });
    let active = null;
    document.getElementById("rec").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      if (!active) {
        try {
          active = await startRecording();
          btn.textContent = "Stop and save";
          document.getElementById("rec-msg").textContent = "Recording… speak slowly, with pauses.";
        } catch {
          document.getElementById("rec-msg").textContent = "The microphone isn't available. Check the browser's permission.";
        }
      } else {
        const blob = await active.stop();
        active = null;
        await saveRecording(m.id, blob);
        s.useVoice = true; s.audio = null;
        renderTimer(m.id);
      }
    });
  }

  // ---------- journal ----------
  function journalTabs(active) {
    return `<div class="seg2"><a href="#journal" class="${active === "daily" ? "on" : ""}">Daily</a><a href="#symbols" class="${active === "symbols" ? "on" : ""}">Symbols</a></div>`;
  }

  function currentPrompt(arg) {
    if (content && practice.started && !practice.complete) {
      const n = arg ? Math.max(1, Math.min(Number(arg), practice.day)) : practice.day;
      const d = dayData(n);
      return { key: `day-${n}`, label: `Day ${n} prompt`, title: `Day ${n}: ${d.title}`, prompt: d.journal, day: n };
    }
    const today = new Date();
    return { key: `standing-${ymd(today)}`, label: "Today's prompt", title: today.toLocaleDateString("en-US", { month: "long", day: "numeric" }), prompt: standingPrompt(today), day: null };
  }

  function renderJournal(arg) {
    renderTabs("journal");
    const p = currentPrompt(arg);
    const existing = journal.entryFor(p.key);
    const earlier = journal.entries.filter((e) => e.key !== p.key);
    screen.innerHTML = `
      <div class="head-row"><h1 class="title">Journal</h1><div class="lock">${LOCK}Kept on this device only</div></div>
      ${journalTabs("daily")}
      <form class="card" id="entry-form" style="gap:10px">
        <div class="label">${esc(p.label)}</div>
        <label for="entry" style="font-size:19px;font-weight:900;line-height:1.3">${esc(p.prompt)}</label>
        <textarea id="entry" class="paper" placeholder="Write freely. No one else reads this.">${esc(existing?.text || "")}</textarea>
        <button class="btn" style="min-height:50px;font-size:16px">Save entry</button>
        <p class="msg" role="status">${esc(takeMsg())}</p>
      </form>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="label">Kept close</div>
        <div class="keep">
          <a href="#keep/sankalpa" style="background:#FFF1CC;color:#4A3300">My sankalpa</a>
          <a href="#keep/plan" style="background:#D6ECF5">"If I Win" plan</a>
          <a href="#keep/statement" style="background:#FFFFFF">Abundance statement</a>
        </div>
      </div>
      ${content ? `<div class="card" style="gap:2px;padding:6px 16px">
        <div class="label" style="padding-top:10px">Week 1 exercises</div>
        ${content.exercises.map((x) => `<a class="listrow" href="#exercise/${x.id}"><div>${esc(x.title)}</div><div class="muted small">${Object.values(journal.exercise(x.id)).some((v) => v) ? "Written" : ""}</div></a>`).join("")}
      </div>` : ""}
      ${earlier.length ? `<div class="card" style="gap:0;padding:6px 16px">
        ${earlier.map((e) => `<a class="listrow" href="#entry/${e.id}"><div>${esc(e.title)}</div><div class="muted small">${shortDate(e.at)}</div></a>`).join("")}
      </div>` : ""}`;
    document.getElementById("entry-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = document.getElementById("entry").value;
      journal.saveEntry({ key: p.key, title: p.title, prompt: p.prompt, text });
      if (p.day && text.trim()) practice.tick(p.day, "journal", true);
      flash("Saved.");
      renderJournal(arg);
    });
  }

  function renderEntry(entryId) {
    renderTabs("journal");
    const e = journal.entry(entryId);
    if (!e) { location.hash = "#journal"; return; }
    screen.innerHTML = `
      <div class="head-row"><a class="round light" href="#journal" aria-label="Back to the journal">${BACK}</a><div class="lock">${LOCK}Kept on this device only</div></div>
      <div class="head"><h1 class="title">${esc(e.title)}</h1><p class="sub">${new Date(e.at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p></div>
      <form class="card" id="f" style="gap:10px">
        <label for="t" style="font-size:17px;font-weight:900;line-height:1.3">${esc(e.prompt)}</label>
        <textarea id="t" class="paper">${esc(e.text)}</textarea>
        <button class="btn" style="min-height:50px;font-size:16px">Save</button>
        <p class="msg" role="status">${esc(takeMsg())}</p>
      </form>
      <button class="link" id="del" style="align-self:flex-start">Delete this entry</button>`;
    document.getElementById("f").addEventListener("submit", (ev) => {
      ev.preventDefault();
      journal.saveEntry({ key: e.key, title: e.title, prompt: e.prompt, text: document.getElementById("t").value });
      flash("Saved.");
      renderEntry(entryId);
    });
    document.getElementById("del").addEventListener("click", () => {
      if (confirm("Delete this entry? It can't be undone.")) { journal.deleteEntry(entryId); location.hash = "#journal"; }
    });
  }

  function renderKeep(which) {
    renderTabs("journal");
    const back = `<div class="head-row"><a class="round light" href="#journal" aria-label="Back to the journal">${BACK}</a><div class="lock">${LOCK}Kept on this device only</div></div>`;
    const profile = getProfile();
    if (which === "sankalpa") {
      screen.innerHTML = `${back}
        <div class="head"><h1 class="title">My sankalpa</h1><p class="sub">A resolve formed in the heart.</p></div>
        <form class="card" id="f" style="gap:10px;background:#FFF1CC">
          <label class="sr" for="t">My sankalpa</label>
          <textarea id="t" class="paper" style="font-size:18px;font-weight:800">${esc(profile.sankalpa)}</textarea>
          <button class="btn" style="min-height:50px;font-size:16px">Save</button>
          <p class="msg" role="status">${esc(takeMsg())}</p>
        </form>
        <div class="card" style="gap:6px"><div class="label">Writing your own</div>${SANKALPA_RULES.map((r) => `<div class="card-text">· ${esc(r)}</div>`).join("")}</div>`;
      document.getElementById("f").addEventListener("submit", (e) => {
        e.preventDefault();
        const v = document.getElementById("t").value.trim();
        if (v) setProfile({ ...profile, sankalpa: v });
        flash("Saved.");
        renderKeep("sankalpa");
      });
      return;
    }
    if (!content) { screen.innerHTML = `${back}<p class="muted">Loading…</p>`; return; }
    if (which === "plan") {
      const plan = journal.plan;
      screen.innerHTML = `${back}
        <div class="head"><h1 class="title">"If I Win" plan</h1><p class="sub">Written in advance, so a win lands in a steady life.</p></div>
        <form id="f" style="display:flex;flex-direction:column;gap:12px">
          ${content.ifIWin.map((r, i) => `<div class="card" style="gap:8px">
            <div class="row-title">${esc(r.area)}</div>
            <label class="field"><span>My intention</span><textarea id="pi${i}" placeholder="${esc(r.example)}">${esc(plan[i]?.intention || "")}</textarea></label>
            <label class="field"><span>First concrete step</span><textarea id="ps${i}" placeholder="${esc(r.firstStep.replace(/^_+$/, ""))}">${esc(plan[i]?.step || "")}</textarea></label>
          </div>`).join("")}
          <button class="btn">Save my plan</button>
          <p class="msg" role="status">${esc(takeMsg())}</p>
        </form>`;
      document.getElementById("f").addEventListener("submit", (e) => {
        e.preventDefault();
        journal.savePlan(Object.fromEntries(content.ifIWin.map((_, i) => [i, { intention: document.getElementById(`pi${i}`).value, step: document.getElementById(`ps${i}`).value }])));
        tickExercise("if-i-win");
        flash("Saved.");
        renderKeep("plan");
      });
      return;
    }
    if (which === "statement") {
      screen.innerHTML = `${back}
        <div class="head"><h1 class="title">Abundance statement</h1><p class="sub">${esc(content.abundanceNote)}</p></div>
        <form class="card" id="f" style="gap:10px">
          <label class="sr" for="t">My abundance statement</label>
          <textarea id="t" class="paper" style="min-height:200px">${esc(journal.statement || content.abundanceTemplate)}</textarea>
          <button class="btn" style="min-height:50px;font-size:16px">Save</button>
          <p class="msg" role="status">${esc(takeMsg())}</p>
        </form>`;
      document.getElementById("f").addEventListener("submit", (e) => {
        e.preventDefault();
        journal.saveStatement(document.getElementById("t").value);
        tickExercise("abundance-statement");
        flash("Saved.");
        renderKeep("statement");
      });
      return;
    }
    location.hash = "#journal";
  }

  // Ticks today's practice when today's practice is this exercise.
  function tickExercise(exId) {
    if (practice.started && !practice.complete && dayData(practice.day)?.exercise === exId) practice.tick(practice.day, "practice", true);
  }

  function renderExercise(exId) {
    renderTabs("journal");
    const x = content?.exercises.find((e) => e.id === exId);
    if (!x) { location.hash = "#journal"; return; }
    const saved = journal.exercise(exId);
    const items = x.items.length ? x.items : [null];
    screen.innerHTML = `
      <div class="head-row"><a class="round light" href="#journal" aria-label="Back to the journal">${BACK}</a><div class="lock">${LOCK}Kept on this device only</div></div>
      <div class="head"><h1 class="title" style="font-size:26px">${esc(x.title)}</h1><p class="sub">${esc(x.source)}</p></div>
      <div class="card">${x.intro.split("\n\n").map((p) => `<p class="card-text">${esc(p)}</p>`).join("")}</div>
      <form id="f" style="display:flex;flex-direction:column;gap:12px">
        ${items.map((it, i) => `<div class="card" style="gap:8px">
          ${it ? `<label for="x${i}" class="row-title">${esc(it)}</label>` : `<label class="sr" for="x${i}">My writing</label>`}
          <textarea id="x${i}" class="paper"${it ? "" : ' style="min-height:240px"'}>${esc(saved[i] || "")}</textarea>
        </div>`).join("")}
        <button class="btn">Save</button>
        <p class="msg" role="status">${esc(takeMsg())}</p>
      </form>`;
    document.getElementById("f").addEventListener("submit", (e) => {
      e.preventDefault();
      journal.saveExercise(exId, Object.fromEntries(items.map((_, i) => [i, document.getElementById(`x${i}`).value])));
      tickExercise(exId);
      flash("Saved.");
      renderExercise(exId);
    });
  }

  // ---------- symbol journal ----------
  // No link from here to the picker's numbers, and nothing here is ever used to choose numbers.
  const SYMBOL_FIELDS = [
    ["happened", "What happened"], ["feeling", "What I was feeling"], ["meaning", "What it means to me"], ["invites", "What it invites"],
  ];

  function renderSymbols() {
    renderTabs("journal");
    const list = symbols.entries;
    const week = symbols.themesThisWeek();
    screen.innerHTML = `
      <div class="head-row"><h1 class="title">Symbol journal</h1><a class="fab" href="#symbol/new" aria-label="New symbol entry">${PLUS}</a></div>
      ${journalTabs("symbols")}
      <div class="card sun" style="flex-direction:row;align-items:center;gap:12px">${STAR}<div style="font-size:15px;font-weight:900;line-height:1.35">${SYMBOL_RULE}</div></div>
      ${list.length ? "" : `<div class="card"><p class="card-text">Coincidences, dreams, repeating numbers: write down what happened, what you felt, what it means to you, and what it invites in your life.</p>${linkBtn("#symbol/new", "Write the first entry", "btn outline")}</div>`}
      ${list.map((e) => `<div class="card" style="gap:12px">
        <div class="split"><div style="font-size:18px;font-weight:900">${esc(e.title || "Untitled")}</div><div class="muted" style="font-size:13px">${shortDate(e.at)}</div></div>
        ${SYMBOL_FIELDS.slice(0, 3).filter(([k]) => e[k]).map(([k, l]) => `<div><div class="label">${l}</div><div class="card-text">${esc(e[k])}</div></div>`).join("")}
        ${e.invites ? `<div class="invites"><div class="label" style="color:#17604F">What it invites</div><div style="font-size:15px;font-weight:800;line-height:1.4">${esc(e.invites)}</div></div>` : ""}
        ${(e.themes || []).length ? `<div class="tags">${e.themes.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
        <div class="split"><div class="small muted">${SYMBOL_RULE}</div><a class="minilink" href="#symbol/${e.id}">Edit</a></div>
      </div>`).join("")}
      ${week.entries ? `<div class="card" style="gap:10px">
        <div class="split"><div class="card-title">Themes this week</div><div class="muted" style="font-size:13px">${week.entries} entr${week.entries === 1 ? "y" : "ies"}</div></div>
        ${week.themes.length ? `<div class="tags">${week.themes.map((t) => `<span>${esc(t.theme)}${t.count > 1 ? ` · ${t.count}` : ""}</span>`).join("")}</div>` : `<p class="small muted">Add a few theme words to your entries to see what keeps returning.</p>`}
        <div class="card-text muted">What is my deeper self asking for?</div>
      </div>` : ""}`;
  }

  function renderSymbolForm(entryId) {
    renderTabs("journal");
    const e = entryId === "new" ? null : symbols.get(entryId);
    if (entryId !== "new" && !e) { location.hash = "#symbols"; return; }
    const hints = content?.symbolJournal?.fields || [];
    screen.innerHTML = `
      <div class="head-row"><a class="round light" href="#symbols" aria-label="Back to the symbol journal">${BACK}</a><div class="lock">${LOCK}Kept on this device only</div></div>
      <div class="head"><h1 class="title">${e ? "Edit entry" : "New entry"}</h1></div>
      <div class="card sun" style="flex-direction:row;align-items:center;gap:12px">${STAR}<div style="font-size:15px;font-weight:900;line-height:1.35">${SYMBOL_RULE}</div></div>
      <form class="card" id="f" style="gap:12px">
        <label class="field"><span>Title</span><input id="s-title" maxlength="80" value="${esc(e?.title || "")}" placeholder="A heron at the creek, twice"></label>
        ${SYMBOL_FIELDS.map(([k, l], i) => `<label class="field"><span>${l}</span><textarea id="s-${k}" placeholder="${esc(hints[i] || "")}">${esc(e?.[k] || "")}</textarea></label>`).join("")}
        <label class="field"><span>Themes</span><input id="s-themes" value="${esc((e?.themes || []).join(", "))}" placeholder="rest, patience, my art"></label>
        <p class="small muted">Separate themes with commas. They gather in "Themes this week."</p>
        <button class="btn">Save entry</button>
      </form>
      ${e ? `<button class="link" id="del" style="align-self:flex-start">Delete this entry</button>` : ""}`;
    document.getElementById("f").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fields = { title: document.getElementById("s-title").value, themes: document.getElementById("s-themes").value };
      for (const [k] of SYMBOL_FIELDS) fields[k] = document.getElementById(`s-${k}`).value;
      if (e) symbols.update(e.id, fields); else symbols.add(fields);
      location.hash = "#symbols";
    });
    document.getElementById("del")?.addEventListener("click", () => {
      if (confirm("Delete this entry?")) { symbols.remove(e.id); location.hash = "#symbols"; }
    });
  }

  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

  return {
    setContent(c) { content = c; },
    homePill, homeCard,
    routes: {
      practice: renderPractice, timer: renderTimer, journal: renderJournal, entry: renderEntry,
      keep: renderKeep, exercise: renderExercise, symbols: renderSymbols, symbol: renderSymbolForm,
    },
    leave() { stopSession(); document.body.classList.remove("skyday"); },
  };
}
