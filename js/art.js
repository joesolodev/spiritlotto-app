// Sprout and the line icons, drawn as inline SVG (from design/mockups/Main.dc.html and PlayToday.dc.html).

export function sproutScene() {
  return `<svg aria-hidden="true" width="350" height="230" viewBox="0 0 350 230">
    <circle cx="285" cy="52" r="26" fill="#F5B83D"/>
    <ellipse cx="80" cy="60" rx="38" ry="14" fill="#FFFFFF"/>
    <ellipse cx="110" cy="52" rx="26" ry="12" fill="#FFFFFF"/>
    <path d="M0 170 Q90 120 180 160 T350 150 V230 H0 Z" fill="#BFE3C4"/>
    <path d="M0 195 Q120 160 230 190 T350 185 V230 H0 Z" fill="#9BD3A5"/>
    <ellipse cx="175" cy="196" rx="52" ry="8" fill="#7FBF8C"/>
    <path d="M175 92 C215 92 232 128 232 156 C232 184 208 198 175 198 C142 198 118 184 118 156 C118 128 135 92 175 92 Z" fill="#FFF8E6"/>
    <path d="M175 92 C175 74 186 64 200 62 C200 78 190 90 175 92 Z" fill="#3FA07C"/>
    <path d="M175 92 C172 78 162 70 150 70 C152 84 162 92 175 92 Z" fill="#5BB98F"/>
    <path d="M152 150 Q158 143 164 150" stroke="#1E3A34" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M186 150 Q192 143 198 150" stroke="#1E3A34" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M168 164 Q175 171 182 164" stroke="#1E3A34" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="146" cy="162" r="6" fill="#F9C9B6"/>
    <circle cx="204" cy="162" r="6" fill="#F9C9B6"/>
  </svg>`;
}

export function sproutSmall() {
  return `<svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" style="flex-shrink:0">
    <path d="M36 12 C56 12 64 30 64 44 C64 58 52 66 36 66 C20 66 8 58 8 44 C8 30 16 12 36 12 Z" fill="#FFF8E6"/>
    <path d="M36 12 C36 4 42 0 48 0 C48 8 43 12 36 12 Z" fill="#3FA07C"/>
    <path d="M24 42 Q27 38 30 42" stroke="#1E3A34" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M42 42 Q45 38 48 42" stroke="#1E3A34" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M32 50 Q36 54 40 50" stroke="#1E3A34" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="20" cy="49" r="4" fill="#F9C9B6"/>
    <circle cx="52" cy="49" r="4" fill="#F9C9B6"/>
  </svg>`;
}

const icon = (paths, size = 26) =>
  `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const ICONS = {
  home: icon('<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>'),
  pick: icon('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>'),
  budget: icon('<rect x="3.5" y="6" width="17" height="13" rx="3"/><path d="M3.5 10h17M15.5 14.5h2"/>'),
  moon: `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E3A34" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10z"/></svg>`,
  chevron: `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F6B64" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
};

export const CHECK = `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F7A68" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`;

// Ritual tab icon (flame over a candle), from the mockups' tab bar.
ICONS.ritual = icon('<path d="M12 3c2 3 3 4.5 3 6.5a3 3 0 0 1-6 0C9 7.5 10 6 12 3z"/><path d="M8 14h8v6H8z"/>');
ICONS.close = `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF8E6" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
ICONS.sun = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5B83D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>`;

// A small resting Sprout for the dark ritual panels, placed at (x, y) = top of its body.
function duskSprout(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0 C24 0 34 20 34 38 C34 58 20 70 0 70 C-20 70 -34 58 -34 38 C-34 20 -24 0 0 0 Z" fill="#FFF8E6"/>
    <path d="M0 0 C0 -12 8 -18 16 -19 C16 -8 10 -1 0 0 Z" fill="#5BB98F"/>
    <path d="M-14 36 Q-10 31 -6 36" stroke="#1E3A34" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M6 36 Q10 31 14 36" stroke="#1E3A34" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M-5 46 Q0 51 5 46" stroke="#1E3A34" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="-20" cy="45" r="4" fill="#F9C9B6"/><circle cx="20" cy="45" r="4" fill="#F9C9B6"/>
  </g>`;
}
const candle = (x, lit = true) => `
  <rect x="${x}" y="120" width="34" height="92" rx="8" fill="#FFF8E6"/>
  ${lit ? `<path d="M${x + 17} 70 C${x + 28} 88 ${x + 32} 96 ${x + 32} 104 a15 15 0 0 1-30 0 C${x + 2} 96 ${x + 6} 88 ${x + 17} 70 Z" fill="#F5B83D"/>
  <path d="M${x + 17} 90 C${x + 22} 98 ${x + 24} 102 ${x + 24} 106 a7 7 0 0 1-14 0 C${x + 10} 102 ${x + 12} 98 ${x + 17} 90 Z" fill="#FFF1CC"/>`
  : `<path d="M${x + 17} 118 v-10" stroke="#CFE3DC" stroke-width="3" stroke-linecap="round"/><path d="M${x + 17} 104 q6 -10 0 -20 q-6 -10 0 -20" stroke="#4E6F67" stroke-width="3" fill="none" stroke-linecap="round"/>`}`;
const floor = `<ellipse cx="155" cy="214" rx="130" ry="12" fill="#23423B"/>`;

export function ritualArt(kind) {
  const wrap = (inner, label) => `<svg role="img" aria-label="${label}" width="100%" height="240" viewBox="0 0 310 240" preserveAspectRatio="xMidYMid meet">${floor}${inner}</svg>`;
  switch (kind) {
    case "candle":
      return wrap(`${candle(60)}
        <rect x="120" y="176" width="70" height="36" rx="6" fill="#FFF8E6" transform="rotate(-4 155 194)"/>
        <circle cx="214" cy="204" r="9" fill="#F5B83D"/>${duskSprout(250, 142, 0.85)}`, "A lit candle beside a face-down ticket, with Sprout watching");
    case "breath":
      return wrap(`${duskSprout(155, 110, 1.2)}
        <path d="M40 90 q20 -16 40 0 t40 0" stroke="#CFE3DC" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M190 70 q20 -16 40 0 t40 0" stroke="#CFE3DC" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M60 130 q16 -12 32 0 t32 0" stroke="#CFE3DC" stroke-width="4" fill="none" stroke-linecap="round" opacity=".45"/>`, "Sprout breathing slowly");
    case "heart":
      return wrap(`${duskSprout(155, 110, 1.2)}
        <path d="M232 66 c-8 -14 -30 -10 -30 6 c0 14 30 30 30 30 s30 -16 30 -30 c0 -16 -22 -20 -30 -6 z" fill="#F5B83D"/>`, "Sprout with a glowing heart");
    case "sunrise":
      return wrap(`<circle cx="155" cy="190" r="70" fill="#F5B83D" opacity=".9"/>
        <path d="M20 200 Q155 160 290 200 V214 H20 Z" fill="#2C5048"/>
        <path d="M70 96 l-14 -10 M240 96 l14 -10 M155 70 v-18 M110 78 l-8 -14 M200 78 l8 -14" stroke="#F5B83D" stroke-width="4" stroke-linecap="round"/>
        ${duskSprout(155, 136, 0.9)}`, "Sunrise behind Sprout");
    case "seal":
      return wrap(`${candle(34)}
        <rect x="92" y="130" width="126" height="82" rx="12" fill="#FFF8E6"/>
        <path d="M92 142 L155 180 L218 142" stroke="#CDBF99" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="155" cy="180" r="12" fill="#F5B83D"/>${duskSprout(258, 140, 0.95)}`, "A candle beside a sealed envelope, with Sprout resting");
    case "hands":
      return wrap(`${candle(40, false)}
        <rect x="104" y="160" width="100" height="52" rx="10" fill="#FFF8E6"/>
        <path d="M104 172 L154 196 L204 172" stroke="#CDBF99" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="154" cy="196" r="9" fill="#F5B83D"/>${duskSprout(255, 140, 0.95)}
        <path d="M240 96 q6 10 0 14 q-6 -4 0 -14z M262 84 q6 10 0 14 q-6 -4 0 -14z" fill="#D6ECF5"/>`, "The candle blown out and the envelope sealed, Sprout at peace");
    default:
      return "";
  }
}
ICONS.journal = icon('<path d="M6 4h11a1 1 0 0 1 1 1v15H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z"/><path d="M9 9h6M9 13h4"/>');
