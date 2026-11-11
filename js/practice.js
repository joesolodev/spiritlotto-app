// The 30-day practice calendar. One day per calendar day from the start date, minus paused days.
// A past day with nothing ticked is "rested", never failed. Pausing freezes the count.
// Everything stays on this device.

const KEY = "spiritlotto.practice.v1";
export const PARTS = ["intention", "practice", "journal", "embodiment", "evening"];
export const PART_LABEL = {
  intention: "Morning intention", practice: "Practice", journal: "Journal",
  embodiment: "Embodiment", evening: "Evening reflection",
};

const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function dayNum(s) {
  const [y, m, d] = s.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export class Practice {
  constructor(storage, now = () => new Date()) {
    this.storage = storage;
    this.now = now;
    let s = null;
    try { s = JSON.parse(storage.getItem(KEY)); } catch { s = null; }
    this.state = s || { start: null, pauses: [], ticks: {}, ongoing: null };
  }

  save() { try { this.storage.setItem(KEY, JSON.stringify(this.state)); } catch {} }
  today() { return ymd(this.now()); }

  get started() { return !!this.state.start; }
  get paused() { const p = this.state.pauses.at(-1); return !!p && !p.to; }
  get ongoing() { return this.state.ongoing; }

  start() {
    if (this.started) return;
    this.state.start = this.today();
    this.save();
  }

  pause() {
    if (!this.started || this.paused) return;
    this.state.pauses.push({ from: this.today(), to: null });
    this.save();
  }

  resume() {
    if (!this.paused) return;
    this.state.pauses.at(-1).to = this.today();
    this.save();
  }

  pausedDays() {
    const t = dayNum(this.today());
    return this.state.pauses.reduce((a, p) => a + ((p.to ? dayNum(p.to) : t) - dayNum(p.from)), 0);
  }

  // The current day number (1-based). Above 30 means the 30 days are complete.
  get day() {
    if (!this.started) return 0;
    return dayNum(this.today()) - dayNum(this.state.start) - this.pausedDays() + 1;
  }

  get complete() { return this.day > 30; }

  ticks(n) { return this.state.ticks[n] || {}; }
  doneCount(n) { return PARTS.filter((p) => this.ticks(n)[p]).length; }

  tick(n, part, on = true) {
    if (!PARTS.includes(part) || n < 1 || n > 30 || n > this.day) return false;
    const t = (this.state.ticks[n] ||= {});
    if (on) t[part] = true; else delete t[part];
    this.save();
    return true;
  }

  status(n) {
    const d = this.day;
    if (n === d) return "today";
    if (n > d) return "upcoming";
    return this.doneCount(n) > 0 ? "done" : "rested";
  }

  chooseOngoing(option) {
    this.state.ongoing = option;
    this.save();
  }
}
