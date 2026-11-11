// A singing-bowl tone, synthesized with Web Audio: a few inharmonic partials with slow decay
// and a little beating. Any pitch the person likes; no claims about special frequencies.

let ctx = null;
function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Partial ratios roughly like a real bowl (not a harmonic series), with relative loudness and decay.
const PARTIALS = [
  { ratio: 1, gain: 1, decay: 9 },
  { ratio: 2.71, gain: 0.45, decay: 6 },
  { ratio: 5.15, gain: 0.2, decay: 4 },
  { ratio: 8.43, gain: 0.08, decay: 2.5 },
];

export const PITCHES = [
  { label: "Low", hz: 174 },
  { label: "Warm", hz: 220 },
  { label: "Clear", hz: 293 },
  { label: "Bright", hz: 392 },
];

export function ringBowl(hz = 220, volume = 0.5) {
  const ac = audio();
  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = volume;
  master.connect(ac.destination);
  for (const p of PARTIALS) {
    for (const detune of [-1.2, 1.2]) { // two close oscillators per partial give the bowl's slow shimmer
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = hz * p.ratio + detune * p.ratio;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(p.gain * 0.5, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
      osc.connect(g).connect(master);
      osc.start(now);
      osc.stop(now + p.decay + 0.1);
    }
  }
}
