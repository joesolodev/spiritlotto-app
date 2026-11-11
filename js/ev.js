// "Should I play today?" math, ported from ev_per_dollar in research/scripts/lotto_research.py.
// Constants come from app/data/model.json (written by tools/export_model.py).

export function share(lam) {
  return lam < 1e-9 ? 1 : (1 - Math.exp(-lam)) / lam;
}

export function predictedTickets(gm, jackpot) {
  const [b0, b1, b2] = gm.sales.b;
  const x = Math.log(jackpot);
  return Math.exp(b0 + b1 * x + b2 * x * x);
}

// Return per $1 for one ticket. `cash` is California's posted cash value when known.
export function evPerDollar(model, gameName, jackpot, { cash = null, taxed = true } = {}) {
  const gm = model.games[gameName];
  if (gm.fixedEvPerDollarPreTax != null) {
    return gm.fixedEvPerDollarPreTax * (taxed ? 1 - model.taxSmall : 1);
  }
  const cashValue = gm.cashIsJackpot ? jackpot : cash ?? model.cashRatio * jackpot;
  const lam = predictedTickets(gm, jackpot) / gm.combinations;
  const tj = taxed ? gm.jackpotTax : 0;
  const ts = taxed ? model.taxSmall : 0;
  let ev = (cashValue * (1 - tj) / gm.combinations) * share(lam) + gm.nonJackpotEvPerPlay * (1 - ts);
  if (gm.freePlayProb) ev = ev / (1 - gm.freePlayProb); // Fantasy 5 free play for 2 of 5
  return ev / gm.price;
}

// The rare moments the research flags as the least-bad times to play.
export function goodMoment(gameName, jackpot) {
  if (gameName === "Powerball" && jackpot >= 1e9) {
    return { text: "This is the least-bad time to play Powerball.", estimated: false };
  }
  if (gameName === "SuperLotto Plus" && jackpot >= 137e6) {
    return { text: "This may be a least-bad time to play SuperLotto Plus.", estimated: true };
  }
  return null;
}
