// Ritual mode: the drawing-day ritual (Part 9 of SPIRITUAL_ABUNDANCE_PRACTICE.md), which draw a
// sealed ticket is for, and the once-only result the next morning.
// Nothing here changes the odds, and nothing here may suggest it does.

export const INTENTION = "I welcome extraordinary abundance, this or something better, under grace, in a perfect way.";
export const SURRENDER = "I release this to chance, and my life to grace. Whatever comes, I am whole.";

export function ritualSteps(sankalpa) {
  return [
    { eyebrow: "Prepare the space", title: "Make a small altar", minutes: 1, art: "candle",
      text: "Light a candle, or set out something that means abundance to you: a coin, a seed, a flower. Put your ticket beside it, face down." },
    { eyebrow: "Ground through breath", title: "Breathe and hum", minutes: 3, art: "breath",
      text: "Five cyclic sighs: two breaths in through the nose, one long breath out through the mouth. Then a minute of soft humming. Feel your seat and your feet." },
    { eyebrow: "State the intention", title: "Hand on heart", minutes: 1, art: "heart",
      text: "Say it aloud:", quote: `${INTENTION} ${sankalpa}` },
    { eyebrow: "Visualize freedom", title: "The quiet morning", minutes: 5, art: "sunrise",
      text: "Close your eyes. A quiet morning. A message from someone you love. The feeling of it is done." },
    { eyebrow: "Mantra", title: "Thank you", minutes: 2, art: "counter",
      text: "Your chosen mantra 21 times, or simply \"Thank you, thank you, thank you.\" Tap once for each." },
    { eyebrow: "Gratitude", title: "Three true riches", minutes: 1, art: "gratitude",
      text: "Name three things you're grateful for that no jackpot could buy." },
    { eyebrow: "The act of surrender", title: "Seal the ticket", minutes: 1, art: "seal",
      text: "Turn the ticket over once, then put it in a box, envelope or drawer. Close it, and say:", quote: SURRENDER,
      after: "Blow out the candle.", seals: true },
    { eyebrow: "Return to ordinary life", title: "Back to your day", minutes: 1, art: "hands",
      text: "Wash your hands, as a threshold. Then do something ordinary and good: cook, walk, call someone. Don't watch the drawing.",
      notice: "Your result will be waiting tomorrow morning, after your practice. No alerts tonight." },
  ];
}

export const LOSS_PRACTICE = [
  "Notice the feeling.",
  "Say: \"Loss, I see you.\"",
  "Recall your sankalpa.",
  "Name one abundance you already have.",
  "Close.",
];

// Which draw a ticket logged at `at` is for. Times are approximate California sales cutoffs.
// Daily 3 draws twice a day (midday and evening); the others at most once.
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ymd(new Date(y, m - 1, d + n));
}

export function targetDraw(gameName, at) {
  const mins = at.getHours() * 60 + at.getMinutes();
  const today = ymd(at);
  if (gameName === "Daily 3") {
    if (mins < 12 * 60 + 30) return { date: today, slot: "midday" };
    if (mins < 18 * 60) return { date: today, slot: "evening" };
    return { date: addDays(today, 1), slot: "midday" };
  }
  const cutoff = gameName === "Fantasy 5" ? 18 * 60 + 30 : 19 * 60 + 45;
  return { date: mins < cutoff ? today : addDays(today, 1), slot: null };
}

// The draw result for a target, or null if it isn't in the downloaded results yet.
export function findDraw(draws, target) {
  if (!draws) return null;
  const sorted = [...draws].sort((a, b) => a.draw - b.draw);
  if (target.slot) {
    const sameDay = sorted.filter((d) => d.date === target.date);
    const want = target.slot === "midday" ? 0 : 1;
    if (sameDay.length > want) return sameDay[want];
    return null;
  }
  return sorted.find((d) => d.date >= target.date) || null;
}

// Results open once, from 6 a.m. the morning after the draw.
export function resultReadyAt(target) {
  const [y, m, d] = target.date.split("-").map(Number);
  return new Date(y, m - 1, d + 1, 6, 0, 0);
}

const SPECIAL_WORD = { Powerball: "Powerball", "Mega Millions": "Mega", "SuperLotto Plus": "Mega" };

// Compare a ticket with a draw. Returns { mainMatches, specialMatch, tier, prize, jackpot, freePlay, win }.
export function scoreTicket(gameName, ticket, draw) {
  if (gameName === "Daily 3") {
    const straight = ticket.digits.every((d, i) => d === draw.main[i]);
    const prize = straight ? draw.prizes["Straight"] ?? null : 0;
    return { mainMatches: ticket.digits.filter((d, i) => d === draw.main[i]).length, specialMatch: false,
      tier: straight ? "Straight" : null, prize, jackpot: false, freePlay: false, win: straight };
  }
  const drawn = new Set(draw.main);
  const m = ticket.main.filter((n) => drawn.has(n)).length;
  if (gameName === "Fantasy 5") {
    const tier = m >= 2 ? `Matched ${m} of 5 numbers` : null;
    return { mainMatches: m, specialMatch: false, tier, prize: tier ? draw.prizes[tier] ?? null : 0,
      jackpot: m === 5, freePlay: m === 2, win: m >= 2 };
  }
  const sp = ticket.special === draw.special;
  const word = SPECIAL_WORD[gameName];
  let tier = null;
  if (sp) tier = m === 0 ? word : `${m} + ${word}`;
  else if (m >= 3) tier = String(m);
  const prize = tier ? draw.prizes[tier] ?? null : 0;
  return { mainMatches: m, specialMatch: sp, tier, prize, jackpot: m === 5 && sp, freePlay: false, win: !!tier };
}

// Plain words for a prize tier: "3" -> "3 numbers matched", "1 + Powerball" -> "1 number plus the Powerball".
export function tierLabel(gameName, tier) {
  if (!tier) return "";
  if (gameName === "Daily 3") return "All three digits, in order";
  const f5 = tier.match(/^Matched (\d) of 5/);
  if (f5) return `${f5[1]} of 5 numbers matched`;
  const word = SPECIAL_WORD[gameName];
  const special = gameName === "Powerball" ? "the Powerball" : "the Mega number";
  if (tier === word) return `${special[0].toUpperCase()}${special.slice(1)} matched`;
  const [m, plus] = tier.split(" + ");
  const nums = `${m} number${m === "1" ? "" : "s"}`;
  return plus ? `${nums} plus ${special} matched` : `${nums} matched`;
}
