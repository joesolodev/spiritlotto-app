// Ticket generation and the popularity filter.
// With the filter on, fresh random tickets are drawn until one passes every rule, so each kept
// ticket is a uniformly random pick among the tickets that pass.
import { randomInt, sampleDistinct } from "./random.js";

const MAX_TRIES = 100000;

export function drawRaw(game) {
  if (game.digits) {
    const digits = [];
    for (let i = 0; i < game.digits; i++) digits.push(randomInt(0, 9));
    return { digits };
  }
  const t = { main: sampleDistinct(game.main.count, game.main.min, game.main.max) };
  if (game.special) t.special = randomInt(game.special.min, game.special.max);
  return t;
}

export function comboKey(main) {
  return [...main].sort((a, b) => a - b).join("-");
}

// Returns the list of popularity rules a ticket breaks (empty means it passes).
export function ruleFailures(game, ticket, pastWinners) {
  const fails = [];
  if (game.digits) {
    const d = ticket.digits;
    if (new Set(d).size < d.length) fails.push("repeated digit");
    const up = d.every((x, i) => i === 0 || x === d[i - 1] + 1);
    const down = d.every((x, i) => i === 0 || x === d[i - 1] - 1);
    if (up || down) fails.push("straight run");
    return fails;
  }
  const m = ticket.main; // sorted
  const low = m.filter((n) => n <= 31).length;
  if (low > game.lowLimit) fails.push("too many calendar numbers");
  let run = 1;
  for (let i = 1; i < m.length; i++) {
    run = m[i] === m[i - 1] + 1 ? run + 1 : 1;
    if (run >= 3) { fails.push("run of consecutive numbers"); break; }
  }
  const gap = m[1] - m[0];
  if (m.every((n, i) => i === 0 || n - m[i - 1] === gap)) fails.push("evenly spaced");
  if (pastWinners && pastWinners.has(comboKey(m))) fails.push("past winning combination");
  return fails;
}

export function generateTicket(game, { filter = true, pastWinners = null } = {}) {
  if (!filter) return drawRaw(game);
  for (let i = 0; i < MAX_TRIES; i++) {
    const t = drawRaw(game);
    if (ruleFailures(game, t, pastWinners).length === 0) return t;
  }
  throw new Error("Could not find a ticket that passes the filter");
}

// A set of distinct tickets (no duplicates within one batch).
export function generateTickets(game, count, opts) {
  const out = [];
  const seen = new Set();
  while (out.length < count) {
    const t = generateTicket(game, opts);
    const k = t.digits ? t.digits.join("") : comboKey(t.main) + "|" + (t.special ?? "");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

export function formatTicket(game, t) {
  if (t.digits) return t.digits.join(" ");
  const main = t.main.map((n) => String(n).padStart(2, "0")).join(" ");
  return game.special ? `${main}  ${game.special.name} ${String(t.special).padStart(2, "0")}` : main;
}
