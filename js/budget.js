// Yearly budget guardrails. Everything stays on this device.
// The budget can be lowered during the year but never raised; once it's spent, play stops
// until January. There is no top-up.
import { CHEAPEST_PRICE } from "./games.js";

const KEY = "conscious-picker.budget.v1";
export const HELPLINE = "1-800-GAMBLER";

function localDate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Weeks counted from a fixed Monday, so consecutive weeks differ by 1.
function weekIndex(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2024, 0, 1)) / 86400000);
  return Math.floor(days / 7);
}

export class Budget {
  constructor(storage, now = () => new Date()) {
    this.storage = storage;
    this.now = now;
    this.state = this.load();
  }

  load() {
    const year = this.now().getFullYear();
    let s = null;
    try { s = JSON.parse(this.storage.getItem(KEY)); } catch { s = null; }
    if (!s || s.year !== year) {
      const history = s ? [...(s.history || []), { year: s.year, budget: s.budget, plays: s.plays, wins: s.wins }] : [];
      s = { year, budget: null, plays: [], wins: [], history };
      this.state = s;
      this.save();
    }
    return s;
  }

  save() {
    try { this.storage.setItem(KEY, JSON.stringify(this.state)); } catch { /* storage unavailable */ }
  }

  get budget() { return this.state.budget; }
  get spent() { return this.state.plays.reduce((a, p) => a + p.cost, 0); }
  get remaining() { return this.budget == null ? 0 : this.budget - this.spent; }
  get isSet() { return this.budget != null; }
  get locked() { return this.isSet && this.remaining < CHEAPEST_PRICE; }
  get plays() { return this.state.plays; }
  get wins() { return this.state.wins; }

  canAfford(cost) { return this.isSet && this.spent + cost <= this.budget; }

  setBudget(amount) {
    amount = Math.floor(Number(amount));
    if (!(amount > 0)) return { ok: false, reason: "invalid" };
    if (this.isSet && amount > this.budget) return { ok: false, reason: "raise", warn: true };
    this.state.budget = amount;
    this.save();
    return { ok: true };
  }

  // `extra` carries ritual data (the ticket itself and which draw it's for).
  logPlay({ game, tickets, cost, numbers, goodMoment = false, ...extra }) {
    if (!this.canAfford(cost)) return { ok: false, reason: "over", warn: true };
    const now = this.now();
    const date = localDate(now);
    const play = { ...extra, id: `${now.getTime()}-${this.state.plays.length}`, date, at: now.toISOString(), game, tickets, cost, numbers, goodMoment };
    this.state.plays.push(play);
    this.save();
    return { ok: true, play, warn: this.warningSign(date) };
  }

  // Ritual bookkeeping only (sealed, result seen). Cost and date can't be changed this way.
  markPlay(id, fields) {
    const p = this.state.plays.find((x) => x.id === id);
    if (!p) return false;
    for (const k of ["sealedAt", "resultSeenAt"]) if (k in fields) p[k] = fields[k];
    this.save();
    return true;
  }

  // Warning signs after a play: many plays in a day, or a long streak of ordinary-jackpot weeks.
  warningSign(today) {
    if (this.state.plays.filter((p) => p.date === today).length > 3) return "many-today";
    const weeks = new Set(this.state.plays.filter((p) => !p.goodMoment).map((p) => weekIndex(p.date)));
    const w = weekIndex(today);
    if ([0, 1, 2, 3].every((k) => weeks.has(w - k))) return "streak";
    return null;
  }

  // Only same-day entries can be deleted (to fix a mistake), so deleting can't free up budget later.
  canDeletePlay(p) { return p.date === localDate(this.now()); }

  deletePlay(id) {
    const p = this.state.plays.find((x) => x.id === id);
    if (!p || !this.canDeletePlay(p)) return false;
    this.state.plays = this.state.plays.filter((x) => x.id !== id);
    this.save();
    return true;
  }

  logWin({ game, amount }) {
    amount = Number(amount);
    if (!(amount > 0)) return { ok: false };
    this.state.wins.push({ id: `${Date.now()}-w${this.state.wins.length}`, date: localDate(this.now()), game, amount });
    this.save();
    return { ok: true };
  }

  deleteWin(id) {
    this.state.wins = this.state.wins.filter((w) => w.id !== id);
    this.save();
  }
}
