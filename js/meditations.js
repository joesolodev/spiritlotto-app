// The four guided meditations, with phase timings and cues from SPIRITUAL_ABUNDANCE_PRACTICE.md
// (Part 3.2, Part 5.4, Part 4.4, Part 12.6). Each phase: { name, seconds, cue }.

const min = (m) => Math.round(m * 60);

export const MEDITATIONS = {
  "quiet-morning": {
    id: "quiet-morning",
    title: "The Quiet Morning",
    kind: "Guided visualization",
    source: "Part 3.2",
    note: "Record this slowly in your own voice, or have someone read it to you.",
    phases: [
      { name: "Settling", seconds: min(3), cue: "Let your eyes close. Breathe in through your nose, and let it go slowly through your mouth, longer than the in-breath. Feel the weight of your body. Let your face relax." },
      { name: "Entering the scene", seconds: min(4), cue: "It is morning. Everything has been taken care of. Notice the light, the sheets, the sounds. The low hum of worry about money is simply not there." },
      { name: "The message", seconds: min(4), cue: "A message from someone you love: \"Thank you. We're okay now. We're really okay.\" Feel what rises: relief, a settled gratitude, the feeling of it is done." },
      { name: "Security in the body", seconds: min(1.5), cue: "Where in your body do you feel that security? Let the feeling of being provided for spread through you like warm water. Silently say: Thank you. It is done." },
      { name: "Releasing", seconds: min(2.5), cue: "Let the scene soften, like a dream fading at dawn. What remains is the feeling. Wiggle your fingers and toes. Say once, quietly: I release this with trust. I am already whole." },
    ],
  },
  "open-vessel": {
    id: "open-vessel",
    title: "The Open Vessel",
    kind: "Sound meditation",
    source: "Part 5.4",
    note: "Sit upright and relaxed. The bowl marks each phase.",
    phases: [
      { name: "Arrival", seconds: min(2), cue: "Follow the sound of the bowl until it completely disappears. Notice the exact moment it becomes silence." },
      { name: "Pranayama", seconds: min(3), cue: "Alternate-nostril breathing: in through the left for 4, out through the right for 6, in through the right for 4, out through the left for 6. Then three cyclic sighs." },
      { name: "Bhramari", seconds: min(3), cue: "Inhale through the nose. Exhale with a steady, low hum, lips closed and jaw soft. Feel the vibration in your face, skull and chest." },
      { name: "Om", seconds: min(2), cue: "Chant a long Om: A in the belly, U in the chest, M in the head, then silence. Five rounds." },
      { name: "Mantra", seconds: min(4), cue: "Repeat your mantra aloud, then in a whisper. Let it settle into silence." },
      { name: "Silence", seconds: min(2), cue: "Stop everything. Rest in the vibration that remains. This is the heart of the practice." },
      { name: "Visualization", seconds: min(2), cue: "A golden light at your heart, like a vessel filling from within. With each exhale it overflows to people you love, your community, the world." },
      { name: "Gratitude", seconds: min(1.5), cue: "Silently name three things you already have that once seemed impossible, or that someone, somewhere, prays for." },
      { name: "Close", seconds: min(0.5), cue: "Listen to the bowl until silence. Say your sankalpa once." },
    ],
  },
  "sankalpa-ritual": {
    id: "sankalpa-ritual",
    title: "The Sankalpa Ritual",
    kind: "Yoga nidra",
    source: "Part 4.4",
    note: "Lie on your back with a blanket. This simplified form isn't a substitute for learning from a qualified teacher.",
    phases: [
      { name: "Preparation", seconds: min(2), cue: "Make the intention: \"I will stay awake and aware.\" Hear the sounds around you, near and far." },
      { name: "First planting", seconds: min(1), cue: "Say your sankalpa silently three times, with feeling, as though it's already true." },
      { name: "Rotation of awareness", seconds: min(6), cue: "Move attention through the body: right thumb, each finger, palm, wrist, forearm, elbow… then the left side, the back, the front, the face. Name each part and feel it." },
      { name: "Breath awareness", seconds: min(3), cue: "Count breaths backward from 27 to 1. If you lose count, start again without judgment." },
      { name: "Pairs of opposites", seconds: min(3), cue: "Heaviness, then lightness. Cold, then warmth. Scarcity, then abundance. Then hold both at once, and rest as the awareness that contains them." },
      { name: "Images", seconds: min(2), cue: "A lotus opening. A full grain store. Sunlight on water. An open hand giving. Your quiet morning, for a few seconds." },
      { name: "Second planting", seconds: min(1), cue: "Repeat your sankalpa three times. This is said to be the most receptive moment." },
      { name: "Return", seconds: min(2), cue: "Become aware of the body, the room, the breath. Move your fingers. Roll to your right side. Sit up slowly." },
    ],
  },
  closing: {
    id: "closing",
    title: "Closing Meditation",
    kind: "Surrender, abundance and trust",
    source: "Part 12.6",
    note: "Sit comfortably.",
    phases: [
      { name: "The great wish", seconds: min(1), cue: "Bring to mind the great wish, as large as it truly is. Now notice who is holding the wish: the quiet, spacious awareness behind it." },
      { name: "The sky", seconds: min(1.5), cue: "The wish is a cloud. You are the sky. From the sky, look down at what's already here: the people, the breath, the morning light." },
      { name: "Trust", seconds: min(1), cue: "Silently say: I trust life. I trust myself. I am already wealthy in what matters." },
      { name: "Open hands", seconds: min(1.5), cue: "Open your hands, palms up. Place the wish in them like a small bird. You don't grip it. Feel the open hands, the open heart. Thank you. It is done. It is beginning." },
    ],
  },
};

export const MEDITATION_ORDER = ["quiet-morning", "open-vessel", "sankalpa-ritual", "closing"];

export const totalSeconds = (m) => m.phases.reduce((a, p) => a + p.seconds, 0);

// Where a session is after `elapsed` seconds: { index, phase, phaseLeft, done }.
export function phaseAt(m, elapsed) {
  let t = 0;
  for (let i = 0; i < m.phases.length; i++) {
    t += m.phases[i].seconds;
    if (elapsed < t) return { index: i, phase: m.phases[i], phaseLeft: t - elapsed, done: false };
  }
  return { index: m.phases.length - 1, phase: m.phases.at(-1), phaseLeft: 0, done: true };
}

export const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
