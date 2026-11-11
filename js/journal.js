// The journal and the symbol journal. Stored on this device only.
// The symbol journal is deliberately separate from the number picker: nothing here is ever read
// by picker.js, and no entry can be turned into numbers.

const JKEY = "spiritlotto.journal.v1";
const SKEY = "spiritlotto.symbols.v1";
export const SYMBOL_RULE = "A message for my life, not a prediction for the lottery.";

const load = (storage, key, d) => { try { return JSON.parse(storage.getItem(key)) ?? d; } catch { return d; } };
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export class Journal {
  constructor(storage, now = () => new Date()) {
    this.storage = storage;
    this.now = now;
    this.state = load(storage, JKEY, { entries: [], exercises: {}, plan: {}, statement: "" });
  }
  save() { try { this.storage.setItem(JKEY, JSON.stringify(this.state)); } catch {} }

  get entries() { return [...this.state.entries].sort((a, b) => (a.at < b.at ? 1 : -1)); }
  entryFor(key) { return this.state.entries.find((e) => e.key === key) || null; }
  entry(entryId) { return this.state.entries.find((e) => e.id === entryId) || null; }

  // key identifies the prompt slot, e.g. "day-9" or "standing-2026-11-12".
  saveEntry({ key, title, prompt, text }) {
    let e = this.entryFor(key);
    if (!e) { e = { id: id(), key, title, prompt, text: "", at: this.now().toISOString() }; this.state.entries.push(e); }
    e.text = text;
    e.updated = this.now().toISOString();
    this.save();
    return e;
  }

  deleteEntry(entryId) {
    this.state.entries = this.state.entries.filter((e) => e.id !== entryId);
    this.save();
  }

  exercise(exId) { return this.state.exercises[exId] || {}; }
  saveExercise(exId, answers) { this.state.exercises[exId] = answers; this.save(); }

  get plan() { return this.state.plan; }
  savePlan(plan) { this.state.plan = plan; this.save(); }

  get statement() { return this.state.statement; }
  saveStatement(text) { this.state.statement = text; this.save(); }
}

export class Symbols {
  constructor(storage, now = () => new Date()) {
    this.storage = storage;
    this.now = now;
    this.list = load(storage, SKEY, []);
  }
  save() { try { this.storage.setItem(SKEY, JSON.stringify(this.list)); } catch {} }

  get entries() { return [...this.list].sort((a, b) => (a.at < b.at ? 1 : -1)); }
  get(entryId) { return this.list.find((e) => e.id === entryId) || null; }

  add(fields) {
    const e = { id: id(), at: this.now().toISOString(), ...clean(fields) };
    this.list.push(e);
    this.save();
    return e;
  }

  update(entryId, fields) {
    const e = this.get(entryId);
    if (!e) return null;
    Object.assign(e, clean(fields));
    this.save();
    return e;
  }

  remove(entryId) { this.list = this.list.filter((e) => e.id !== entryId); this.save(); }

  // Themes from the last 7 days, most frequent first.
  themesThisWeek() {
    const cutoff = this.now().getTime() - 7 * 86400000;
    const recent = this.list.filter((e) => new Date(e.at).getTime() >= cutoff);
    const counts = new Map();
    for (const e of recent) for (const t of e.themes || []) {
      const k = t.toLowerCase();
      const cur = counts.get(k) || { theme: t, count: 0 };
      cur.count++;
      counts.set(k, cur);
    }
    return { entries: recent.length, themes: [...counts.values()].sort((a, b) => b.count - a.count) };
  }
}

function clean(f) {
  const out = {};
  for (const k of ["title", "happened", "feeling", "meaning", "invites"]) if (k in f) out[k] = String(f[k] ?? "").trim();
  if ("themes" in f) {
    const arr = Array.isArray(f.themes) ? f.themes : String(f.themes || "").split(",");
    out.themes = [...new Set(arr.map((t) => t.trim()).filter(Boolean))].slice(0, 8);
  }
  return out;
}

// Standing prompts (Part 12.7) for after the 30 days: one a day, rotating.
export const STANDING_PROMPTS = [
  "Where did I feel abundant today, with no money involved?",
  "What did I want today, and what was the feeling beneath the want?",
  "When did I grasp, and when did I open?",
  "What did I give, and how did it feel?",
  "What symbol, coincidence or dream touched me, and what does it ask of my life?",
  "What financial step did I take, however small, as the steward?",
  "If I won tomorrow, what would I want to have already practiced today?",
  "If I never win, what will I be glad I became?",
  "What am I grateful for that I used to pray for?",
  "How is my peace? Does it depend on anything it shouldn't?",
];
export function standingPrompt(date) {
  const n = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return STANDING_PROMPTS[n % STANDING_PROMPTS.length];
}
