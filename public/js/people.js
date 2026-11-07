// @ts-check
// Nhân vật vẽ bằng SVG: khách ngồi ghế nhựa cầm ly bia, nhân viên bưng mâm, chủ quán sau quầy.
// Mỗi người được tạo từ một "seed" nên cùng một tên luôn ra cùng một dáng (màu áo, kiểu tóc, kính...).

/** Deterministic pseudo-random numbers from a seed (mulberry32) */
export const seeded = (/** @type {number} */ seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const hash = (/** @type {string} */ s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

const SKINS = ['#f5cfa8', '#eab98c', '#d9a274', '#c18656', '#f8dcc0', '#a86d44'];
const HAIRS = ['#16100c', '#2a1c12', '#3b281a', '#5a3a22', '#0f0f12', '#7a5532', '#9a9a9a', '#6b2f1f'];
const SHIRTS = ['#e63946', '#2a9d8f', '#457b9d', '#f4a261', '#e9c46a', '#8d5bd6', '#ef476f', '#06aed5', '#3a86ff', '#6a994e', '#ededed', '#264653', '#ff7f50', '#ffb703', '#118ab2'];
const PANTS = ['#2b2d42', '#3d405b', '#1d3557', '#4a3f35', '#333333', '#5c4d3c'];
const STOOLS = ['#d62828', '#1f6fd8', '#d62828', '#1f6fd8', '#f2a007'];
const pick = (/** @type {() => number} */ r, /** @type {any[]} */ list) => list[Math.floor(r() * list.length)];

// Hair drawn over a head centered at (20,16), radius 8.5
/** @param {number} style @param {string} c @param {string} accent */
function hair(style, c, accent) {
  switch (style) {
    case 0: // short crop
      return `<path d="M11.3 15.5 C11 8 16 6.2 20 6.2 C24.6 6.2 29.2 8.4 28.7 15.5 C27.6 11.8 25 10.6 20 10.8 C15.2 10.6 12.6 11.6 11.3 15.5 Z" fill="${c}"/>`;
    case 1: // long hair falling behind the shoulders
      return `<path d="M10.6 17 C9.6 8 15 5.6 20 5.6 C25.4 5.6 30.6 8 29.4 17 L30.4 29 C27.6 30 26.8 27 27.6 22 C27.6 15 26 11.6 20 11.4 C14 11.6 12.4 15 12.4 22 C13.2 27 12.4 30 9.6 29 Z" fill="${c}"/>`;
    case 2: // bun on top
      return `<circle cx="20" cy="5.4" r="3.6" fill="${c}"/><path d="M11.4 16 C11 8.6 15.6 6.4 20 6.4 C24.4 6.4 29 8.6 28.6 16 C27.4 12.4 24.6 10.8 20 10.8 C15.4 10.8 12.6 12.4 11.4 16 Z" fill="${c}"/>`;
    case 3: // cap
      return `<path d="M11.2 14.4 C11.2 8.2 15.4 6 20 6 C24.6 6 28.8 8.2 28.8 14.4 Z" fill="${accent}"/><path d="M11 14.2 H33.4 C33.4 15.8 31.6 16.4 28.6 16.2 H11 Z" fill="${accent}" opacity="0.85"/><circle cx="20" cy="6.4" r="1" fill="#fff" opacity="0.7"/>`;
    case 4: // bald uncle with a shine and side hair
      return `<path d="M11.6 18.6 C11 15.6 11.6 13.6 12.6 13 L13.4 17.6 Z M28.4 18.6 C29 15.6 28.4 13.6 27.4 13 L26.6 17.6 Z" fill="${c}"/><ellipse cx="17" cy="9.6" rx="2.6" ry="1.4" fill="#fff" opacity="0.35"/>`;
    case 5: // spiky
      return `<path d="M11.2 15.6 L11.6 9.6 L14 10.4 L14.6 5.6 L17.4 8.2 L19.6 3.8 L21.8 8 L25 5.2 L25.6 9.6 L28.6 9 L28.8 15.6 C27 12 24.4 11 20 11 C15.6 11 13 12 11.2 15.6 Z" fill="${c}"/>`;
    case 6: // side part
      return `<path d="M11.2 16.6 C10.4 8.2 15.6 6 20.6 6 C26 6 29.6 9 28.8 16 C27.8 12.6 26.4 11.6 23.6 11 C20 10.6 15.6 11.8 13.4 13.6 C12.4 14.4 11.8 15.4 11.2 16.6 Z" fill="${c}"/>`;
    default: // curly
      return `<g fill="${c}"><circle cx="13" cy="11.6" r="3"/><circle cx="16.4" cy="8.2" r="3.2"/><circle cx="20.4" cy="7" r="3.2"/><circle cx="24.4" cy="8.2" r="3.2"/><circle cx="27.4" cy="11.6" r="3"/><circle cx="11.8" cy="15" r="2.2"/><circle cx="28.4" cy="15" r="2.2"/></g>`;
  }
}

/** Beer mug (vại bia), drawn around its center (cx, cy) */
const mug = (/** @type {number} */ cx, /** @type {number} */ cy) =>
  `<g class="mug-shape"><rect x="${cx - 3.2}" y="${cy - 4.2}" width="6.4" height="8.6" rx="1.2" fill="#f2a516" stroke="#fff4d6" stroke-width="0.7"/><rect x="${cx - 2.4}" y="${cy - 1.6}" width="1.2" height="5" rx="0.6" fill="#ffd77a" opacity="0.8"/><path d="M${cx + 3.2} ${cy - 2.4} h1.6 a1.6 1.6 0 0 1 1.6 1.6 v1.8 a1.6 1.6 0 0 1 -1.6 1.6 h-1.6" fill="none" stroke="#fff4d6" stroke-width="0.9"/><path d="M${cx - 3.8} ${cy - 4} c0 -2 1.6 -2.6 2.6 -2 c0.6 -1.4 2.6 -1.4 3 0 c1.2 -0.6 2.4 0.4 2 2 Z" fill="#fffdf6"/></g>`;

/**
 * A customer sitting on a plastic stool, facing the camera, holding a beer mug in their left hand
 * (the right of the picture). Animated by CSS: .arm (sip / cheers) and .mug-wrap (kept upright), see app.css.
 * @param {number} seed
 * @param {{ npc?: boolean }} [opts]
 */
export function customerSVG(seed, opts = {}) {
  const r = seeded(seed);
  const skin = pick(r, SKINS);
  const hairColor = pick(r, HAIRS);
  const shirt = pick(r, SHIRTS);
  const pants = pick(r, PANTS);
  const stool = pick(r, STOOLS);
  const hairStyle = Math.floor(r() * 8);
  const shirtStyle = Math.floor(r() * 5); // 0 plain, 1 stripes, 2 singlet, 3 polka dots, 4 collar
  const glasses = r() < 0.16;
  const mustache = hairStyle === 4 || (hairStyle !== 1 && hairStyle !== 2 && r() < 0.12);
  const accent = pick(r, SHIRTS);
  const id = `p${seed.toString(36)}${opts.npc ? 'n' : ''}`;

  const torsoPath = 'M10.4 27.4 C12 25 15 24.6 20 24.6 C25 24.6 28 25 29.6 27.4 L28.4 45 H11.6 Z';
  let shirtFill = shirt;
  let extra = '';
  if (shirtStyle === 1) {
    extra = `<defs><pattern id="${id}s" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1.4" fill="#ffffff" opacity="0.55"/></pattern></defs>`;
    shirtFill = shirt;
  }
  const shirtLayer =
    shirtStyle === 2
      ? // áo ba lỗ: white singlet, bare shoulders
        `<path d="${torsoPath}" fill="${skin}"/><path d="M13.6 26 C14.6 30 17 31 20 31 C23 31 25.4 30 26.4 26 L28.4 45 H11.6 Z" fill="#f4f4f0"/>`
      : `<path d="${torsoPath}" fill="${shirtFill}"/>` +
        (shirtStyle === 1 ? `<path d="${torsoPath}" fill="url(#${id}s)"/>` : '') +
        (shirtStyle === 3 ? `<g fill="#fff" opacity="0.6"><circle cx="15" cy="31" r="1"/><circle cx="23" cy="30" r="1"/><circle cx="19" cy="36" r="1"/><circle cx="26" cy="38" r="1"/><circle cx="14" cy="40" r="1"/><circle cx="22" cy="42" r="1"/></g>` : '') +
        (shirtStyle === 4 ? `<path d="M16.4 25 L20 29.6 L23.6 25 L22 24.6 L20 27 L18 24.6 Z" fill="#ffffff" opacity="0.85"/>` : `<path d="M17 24.8 C18 26.6 22 26.6 23 24.8" fill="none" stroke="${skin}" stroke-width="1.6"/>`);

  return `<svg viewBox="0 0 40 60" class="person-svg" aria-hidden="true">${extra}
  <g class="body">
    <!-- plastic stool -->
    <g class="stool"><path d="M10.6 46 H29.4 L28 59.6 H26.4 L25.6 50 H14.4 L13.6 59.6 H12 Z" fill="${stool}"/>
    <ellipse cx="20" cy="46" rx="10" ry="2.2" fill="${stool}" stroke="#000" stroke-opacity="0.2" stroke-width="0.4"/></g>
    <!-- legs -->
    <path d="M12.6 43 H27.4 L27 47.6 H13 Z" fill="${pants}"/>
    <path d="M13.4 47 H18.2 L17.8 56 H13.8 Z M21.8 47 H26.6 L26.2 56 H22.2 Z" fill="${pants}"/>
    <path d="M13 56 H18.6 L19 58.4 H12.6 Z M21.4 56 H27 L27.4 58.4 H21 Z" fill="#2a2a2a"/>
    <!-- back hair for long styles goes behind the torso -->
    ${hairStyle === 1 ? hair(1, hairColor, accent) : ''}
    ${shirtLayer}
    <!-- resting arm (right of the person, left of the picture) -->
    <path d="M10.8 28 C9 32 9.4 38 12.4 41.4" fill="none" stroke="${shirtStyle === 2 ? skin : shirt}" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="12.8" cy="41.6" r="1.8" fill="${skin}"/>
    <!-- head -->
    <g class="head">
      <rect x="17.6" y="21.6" width="4.8" height="3.8" fill="${skin}"/>
      <circle cx="20" cy="16" r="8.5" fill="${skin}"/>
      <circle cx="11.6" cy="16.6" r="1.6" fill="${skin}"/><circle cx="28.4" cy="16.6" r="1.6" fill="${skin}"/>
      ${hairStyle === 1 ? `<path d="M11.4 15.6 C11.4 9.6 15 7.4 20 7.4 C25 7.4 28.6 9.6 28.6 15.6 C26.6 12 24 11.2 20 11.4 C16 11.2 13.4 12 11.4 15.6 Z" fill="${hairColor}"/>` : hair(hairStyle, hairColor, accent)}
      <ellipse class="cheek" cx="15.2" cy="19.4" rx="1.8" ry="1.1" fill="#ff6b6b"/>
      <ellipse class="cheek" cx="24.8" cy="19.4" rx="1.8" ry="1.1" fill="#ff6b6b"/>
      <g class="eyes-open" fill="#1b1b1b"><ellipse cx="16.6" cy="16.6" rx="1" ry="1.25"/><ellipse cx="23.4" cy="16.6" rx="1" ry="1.25"/></g>
      <g class="eyes-happy" fill="none" stroke="#1b1b1b" stroke-width="0.9" stroke-linecap="round"><path d="M15.4 17 q1.2 -1.6 2.4 0"/><path d="M22.2 17 q1.2 -1.6 2.4 0"/></g>
      ${glasses ? '<g fill="none" stroke="#151515" stroke-width="0.7"><circle cx="16.6" cy="16.6" r="2.3"/><circle cx="23.4" cy="16.6" r="2.3"/><path d="M18.9 16.4 h2.2"/></g>' : ''}
      ${mustache ? `<path d="M16.6 19.8 q3.4 -1.4 6.8 0 q-3.4 0.6 -6.8 0 Z" fill="${hairColor}"/>` : ''}
      <path class="mouth-smile" d="M17.6 20.8 q2.4 2 4.8 0" fill="none" stroke="#7a2b1e" stroke-width="0.9" stroke-linecap="round"/>
      <ellipse class="mouth-open" cx="20" cy="21.2" rx="1.9" ry="1.5" fill="#7a2b1e"/>
    </g>
    <!-- arm holding the mug: rotates around the shoulder; the mug counter-rotates to stay upright -->
    <g class="arm">
      <path d="M29.2 28 C30.4 32 30.2 36 29.4 39.4" fill="none" stroke="${shirtStyle === 2 ? skin : shirt}" stroke-width="3.4" stroke-linecap="round"/>
      <g class="mug-wrap">${mug(29.4, 38.2)}<circle cx="29.4" cy="40.6" r="1.8" fill="${skin}"/></g>
    </g>
  </g>
</svg>`;
}

/** Waiter carrying a tray above the shoulder; `load` is SVG drawn on the tray (centered at x=26, bottom y=12) */
export function waiterSVG(/** @type {string} */ load) {
  return `<svg viewBox="0 0 44 78" class="waiter-svg" aria-hidden="true">
  <g class="tray-load">${load}</g>
  <rect x="15" y="12" width="22" height="2.4" rx="1.2" fill="#c9ced6" stroke="#8a919c" stroke-width="0.5"/>
  <path d="M30 14.4 C31 18 31.4 22 30 28" fill="none" stroke="#f2f2f2" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="20" cy="24" r="7.6" fill="#eab98c"/>
  <path d="M12.6 22.6 C12 15.6 16.4 14 20 14 C24.2 14 28 15.8 27.4 22.6 C26.4 19.6 24 18.6 20 18.8 C16 18.6 13.8 19.6 12.6 22.6 Z" fill="#1b130d"/>
  <g fill="#1b1b1b"><circle cx="17.4" cy="24.4" r="0.9"/><circle cx="22.6" cy="24.4" r="0.9"/></g>
  <path d="M17.8 27.6 q2.2 1.6 4.4 0" fill="none" stroke="#7a2b1e" stroke-width="0.8" stroke-linecap="round"/>
  <path d="M11 35 C12.6 32.4 15.6 31.6 20 31.6 C24.4 31.6 27.4 32.4 29 35 L28 54 H12 Z" fill="#f2f2f2"/>
  <path d="M13.4 38 H26.6 L27.4 56 H12.6 Z" fill="#b5462e"/>
  <rect x="16.4" y="42" width="7.2" height="5" rx="1" fill="#93361f"/>
  <path d="M11.4 35.6 C9.4 40 9.6 45 11.4 48" fill="none" stroke="#f2f2f2" stroke-width="3.2" stroke-linecap="round"/>
  <g class="legs"><path class="leg-a" d="M14 55 H19.4 L19 75 H14.4 Z" fill="#2b2d42"/><path class="leg-b" d="M20.6 55 H26 L25.6 75 H21 Z" fill="#2b2d42"/></g>
  <path d="M13.4 75 H19.6 L20 77.6 H13 Z M20.4 75 H26.6 L27 77.6 H20 Z" fill="#141414"/>
</svg>`;
}

/** The host behind the counter (only the upper body shows over it). Female or male to match the voice. */
export function hostSVG(/** @type {'female' | 'male'} */ kind) {
  const female = kind === 'female';
  const hairBack = female
    ? '<path d="M17 24 C15 9 23 5 30 5 C37 5 45 9 43 24 L44 40 C40 42 39 36 39.6 30 C40 21 37.6 16 30 16 C22.4 16 20 21 20.4 30 C21 36 20 42 16 40 Z" fill="#20140c"/><circle cx="30" cy="5" r="4.6" fill="#20140c"/>'
    : '';
  const hairFront = female
    ? '<path d="M19.6 22 C19.6 12 24.6 9.4 30 9.4 C35.4 9.4 40.4 12 40.4 22 C38 16.6 34.6 15.4 30 15.6 C25.4 15.4 22 16.6 19.6 22 Z" fill="#20140c"/>'
    : '<path d="M19.4 21.6 C18.8 11.4 24.6 9 30 9 C36 9 41.4 11.6 40.6 21.6 C39.4 16.8 36 15.4 30 15.6 C24.6 15.4 20.6 16.8 19.4 21.6 Z" fill="#17110c"/>';
  return `<svg viewBox="0 0 60 64" class="host-svg" aria-hidden="true">
  ${hairBack}
  <path d="M10 64 C10 48 16 41 30 41 C44 41 50 48 50 64 Z" fill="${female ? '#e05a7a' : '#3a7bd5'}"/>
  <path d="M19 44 H41 L43 64 H17 Z" fill="${female ? '#fff2d8' : '#2f2f2f'}" opacity="0.95"/>
  ${female ? '' : '<path d="M14 46 C20 43 23 47 21 54 L17 64 H12 Z" fill="#f2f2f2"/>'}
  <rect x="26.6" y="33" width="6.8" height="9" fill="#efc196"/>
  <circle cx="30" cy="24" r="11" fill="#efc196"/>
  ${hairFront}
  <ellipse cx="24.4" cy="28.4" rx="2.2" ry="1.3" fill="#ff7b7b" opacity="0.45"/><ellipse cx="35.6" cy="28.4" rx="2.2" ry="1.3" fill="#ff7b7b" opacity="0.45"/>
  <g fill="#1b1b1b"><ellipse cx="25.8" cy="24.6" rx="1.2" ry="1.5"/><ellipse cx="34.2" cy="24.6" rx="1.2" ry="1.5"/></g>
  ${female ? '' : '<path d="M25 29.6 q5 -2 10 0 q-5 1 -10 0 Z" fill="#17110c"/>'}
  <path class="host-smile" d="M26.6 30.6 q3.4 2.6 6.8 0" fill="none" stroke="#7a2b1e" stroke-width="1.1" stroke-linecap="round"/>
  <path class="host-sad" d="M26.6 32.8 q3.4 -2.8 6.8 0" fill="none" stroke="#7a2b1e" stroke-width="1.2" stroke-linecap="round"/>
  <g class="host-brows" fill="none" stroke="#17110c" stroke-width="0.9" stroke-linecap="round"><path d="M23.6 21.4 l3.6 -1.4"/><path d="M36.4 21.4 l-3.6 -1.4"/></g>
  <path class="host-tear t1" d="M24.4 26.6 q-1.6 3.2 0 4.4 q1.6 -1.2 0 -4.4 Z" fill="#7fd0ff"/><path class="host-tear t2" d="M35.6 26.6 q-1.6 3.2 0 4.4 q1.6 -1.2 0 -4.4 Z" fill="#7fd0ff"/>
  <ellipse class="host-talk" cx="30" cy="31.2" rx="2.2" ry="1.7" fill="#7a2b1e"/>
  <g class="host-arm"><path d="M47 50 C52 44 53 36 51 30" fill="none" stroke="${female ? '#e05a7a' : '#3a7bd5'}" stroke-width="5" stroke-linecap="round"/><circle cx="51" cy="28.4" r="3" fill="#efc196"/></g>
</svg>`;
}

// ---- Things on the tables (SVG fragments drawn on a table top; the table's viewBox is 100 x 50, top at y≈14..30)

/** Bottles, glasses and a snack plate that sit on a table from the start */
export function tableClutter(/** @type {number} */ seed) {
  const r = seeded(seed * 7 + 3);
  const parts = [];
  const bottles = 2 + Math.floor(r() * 3);
  for (let i = 0; i < bottles; i++) {
    const x = 18 + r() * 64;
    const green = r() < 0.55;
    parts.push(
      `<g transform="translate(${x.toFixed(1)} ${(15 + r() * 6).toFixed(1)})"><rect x="-2.6" y="-11" width="5.2" height="11" rx="1.6" fill="${green ? '#2f7d3a' : '#7a4416'}" opacity="0.95"/><rect x="-1.1" y="-15.4" width="2.2" height="5" fill="${green ? '#2f7d3a' : '#7a4416'}"/><rect x="-2.6" y="-7.4" width="5.2" height="3.6" fill="#f3e6c4"/><rect x="-1.9" y="-10" width="1" height="8" fill="#fff" opacity="0.35"/></g>`
    );
  }
  if (r() < 0.8) parts.push(`<g transform="translate(${(30 + r() * 40).toFixed(1)} 24)"><ellipse rx="8" ry="2.6" fill="#f4f1ea" stroke="#c9c3b6" stroke-width="0.4"/><g fill="#b9782f"><circle cx="-3" cy="-0.6" r="1.1"/><circle cx="-0.6" cy="-1" r="1.1"/><circle cx="1.8" cy="-0.4" r="1.1"/><circle cx="3.6" cy="-1.1" r="1"/><circle cx="0.6" cy="0.4" r="1"/></g></g>`);
  if (r() < 0.5) parts.push(`<g transform="translate(${(40 + r() * 20).toFixed(1)} 22)"><path d="M-5 -8 H5 L4 1 H-4 Z" fill="#d8dee6" opacity="0.9"/><g fill="#ffffff" opacity="0.8"><rect x="-3.6" y="-10.6" width="3" height="3" rx="0.6"/><rect x="0" y="-11" width="3" height="3" rx="0.6"/></g></g>`);
  return parts.join('');
}

/** Items brought by the waiter: tier 1 a round of mugs, 2 a dish, 3 a beer tower, 4 a hotpot and a tower */
/** An empty plastic stool (free seat) */
export function stoolSVG(/** @type {number} */ seed) {
  const color = STOOLS[seed % STOOLS.length];
  return `<svg viewBox="0 0 40 60" class="person-svg" aria-hidden="true"><path d="M10.6 46 H29.4 L28 59.6 H26.4 L25.6 50 H14.4 L13.6 59.6 H12 Z" fill="${color}"/><ellipse cx="20" cy="46" rx="10" ry="2.2" fill="${color}" stroke="#000" stroke-opacity="0.2" stroke-width="0.4"/></svg>`;
}

/**
 * Low red plastic table (bàn nhựa đỏ) seen from the front, slightly from above, with its number plate (BÀN 3).
 * viewBox `vbw` x 50.
 */
export function tableSVG(/** @type {number} */ seed, /** @type {boolean} */ _vip, vbw = 100, no = 0) {
  const k = vbw / 100;
  return `<svg viewBox="0 0 ${vbw} 50" class="table-svg" aria-hidden="true">
  <g transform="scale(${k} 1)">
    <g fill="#a3161c"><path d="M8 30 L12 30 L10 50 H6 Z"/><path d="M88 30 L92 30 L94 50 H90 Z"/><path d="M24 30 H28 L27 46 H24 Z" opacity="0.7"/><path d="M72 30 H76 L76 46 H73 Z" opacity="0.7"/></g>
    <path d="M5 13 Q5 10 9 10 H91 Q95 10 95 13 L97 28 Q97 31 93 31 H7 Q3 31 3 28 Z" fill="#d62828"/>
    <path d="M3 28 Q3 31 7 31 H93 Q97 31 97 28 V34 Q97 36 93 36 H7 Q3 36 3 34 Z" fill="#a3161c"/>
    <path d="M12 13 H58 L54 16.5 H11 Z" fill="#fff" opacity="0.3"/>
    <g stroke="#b81d22" stroke-width="0.6" opacity="0.6"><line x1="20" y1="12" x2="17" y2="29"/><line x1="40" y1="12" x2="39" y2="29"/><line x1="60" y1="12" x2="61" y2="29"/><line x1="80" y1="12" x2="83" y2="29"/></g>
  </g>
  <g class="items" data-w="${vbw}">${tableClutter(seed)}</g>
  ${no ? `<g transform="translate(${vbw / 2} 40)"><rect x="-11" y="-5" width="22" height="10" rx="2.5" fill="#ffd166" stroke="#7a4a00" stroke-width="0.8"/><text y="2.6" text-anchor="middle" font-size="7.4" font-weight="900" fill="#5a1d00" font-family="Baloo 2, sans-serif">BÀN ${no}</text></g>` : ''}
</svg>`;
}

/** The host walking out with a dish (full body, apron), `load` drawn on the tray like waiterSVG */
export function hostWalkerSVG(/** @type {'female' | 'male'} */ kind, /** @type {string} */ load) {
  const female = kind === 'female';
  const shirt = female ? '#e05a7a' : '#3a7bd5';
  const hair = female
    ? '<path d="M12 24 C10 13 15 10 20 10 C25 10 30 13 28 24 C27 19 24 17.6 20 17.8 C16 17.6 13 19 12 24 Z" fill="#20140c"/><circle cx="20" cy="9.6" r="3.6" fill="#20140c"/>'
    : '<path d="M12.6 22.6 C12 15.6 16.4 13.6 20 13.6 C24.2 13.6 28 15.8 27.4 22.6 C26.4 19.6 24 18.6 20 18.8 C16 18.6 13.8 19.6 12.6 22.6 Z" fill="#17110c"/>';
  return `<svg viewBox="0 0 44 78" class="waiter-svg host-walker" aria-hidden="true">
  <g class="tray-load">${load}</g>
  <rect x="15" y="12" width="22" height="2.4" rx="1.2" fill="#c9ced6" stroke="#8a919c" stroke-width="0.5"/>
  <path d="M30 14.4 C31 18 31.4 22 30 28" fill="none" stroke="${shirt}" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="20" cy="24" r="7.6" fill="#efc196"/>${hair}
  <g fill="#1b1b1b"><circle cx="17.4" cy="24.4" r="0.9"/><circle cx="22.6" cy="24.4" r="0.9"/></g>
  <path d="M17.8 27.6 q2.2 1.6 4.4 0" fill="none" stroke="#7a2b1e" stroke-width="0.8" stroke-linecap="round"/>
  <path d="M11 35 C12.6 32.4 15.6 31.6 20 31.6 C24.4 31.6 27.4 32.4 29 35 L28 54 H12 Z" fill="${shirt}"/>
  <path d="M13.4 36 H26.6 L27.6 58 H12.4 Z" fill="#fff2d8"/><path d="M16 36 L20 33 L24 36" fill="none" stroke="#e6d6b8" stroke-width="1"/>
  <rect x="16.4" y="44" width="7.2" height="5" rx="1" fill="#e6d6b8"/>
  <path d="M11.4 35.6 C9.4 40 9.6 45 11.4 48" fill="none" stroke="${shirt}" stroke-width="3.2" stroke-linecap="round"/>
  <g class="legs"><path class="leg-a" d="M14 55 H19.4 L19 75 H14.4 Z" fill="#2b2d42"/><path class="leg-b" d="M20.6 55 H26 L25.6 75 H21 Z" fill="#2b2d42"/></g>
  <path d="M13.4 75 H19.6 L20 77.6 H13 Z M20.4 75 H26.6 L27 77.6 H20 Z" fill="#141414"/>
</svg>`;
}

/** A served dish on the table: a plate with the dish, a steaming hotpot (lẩu), or drinks */
export function dishItem(/** @type {'plate' | 'hotpot' | 'drink'} */ kind, /** @type {string} */ icon = '🍢') {
  if (kind === 'hotpot')
    return `<g class="gift-item steam" transform="translate(50 22)"><rect x="-4" y="1" width="8" height="5" fill="#3a3f46"/><ellipse cy="6" rx="9" ry="2.4" fill="#2a2e34"/><circle cy="3" r="3" fill="#2f7cff" opacity="0.7"/><ellipse rx="13" ry="4.4" fill="#5c5f66"/><path d="M-12 -6 H12 L11 1 H-11 Z" fill="#8b9099"/><ellipse cy="-6" rx="12" ry="3.6" fill="#d9472b"/><circle cx="-4" cy="-6.4" r="1.4" fill="#ffd166"/><circle cx="3" cy="-6" r="1.6" fill="#90be6d"/><circle cx="7" cy="-6.6" r="1.2" fill="#f7f1e3"/><path class="steam-a" d="M-5 -10 c-2 -3 2 -5 0 -8" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="1.2"/><path class="steam-b" d="M4 -10 c-2 -3 2 -5 0 -8" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="1.2"/></g>`;
  if (kind === 'drink') return `<g class="gift-item"><g transform="translate(44 22)">${mug(0, -4)}</g><g transform="translate(56 23)">${mug(0, -4)}</g></g>`;
  return `<g class="gift-item" transform="translate(50 23)"><ellipse rx="11" ry="3.6" fill="#fbfaf6" stroke="#cfc8b8" stroke-width="0.5"/><text y="-0.6" font-size="10" text-anchor="middle" dominant-baseline="middle">${icon}</text></g>`;
}

export function giftItem(/** @type {number} */ tier, /** @type {string} */ dishIcon = '🍢') {
  if (tier >= 4)
    return `<g class="gift-item steam"><g transform="translate(36 22)"><ellipse rx="13" ry="4.4" fill="#5c5f66"/><path d="M-12 -6 H12 L11 1 H-11 Z" fill="#8b9099"/><ellipse cy="-6" rx="12" ry="3.6" fill="#d9472b"/><circle cx="-4" cy="-6.4" r="1.4" fill="#ffd166"/><circle cx="3" cy="-6" r="1.6" fill="#90be6d"/><path class="steam-a" d="M-5 -10 c-2 -3 2 -5 0 -8" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="1.2"/><path class="steam-b" d="M4 -10 c-2 -3 2 -5 0 -8" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="1.2"/></g>${tower(66)}</g>`;
  if (tier === 3) return `<g class="gift-item">${tower(52)}</g>`;
  if (tier === 2)
    return `<g class="gift-item" transform="translate(50 23)"><ellipse rx="11" ry="3.6" fill="#fbfaf6" stroke="#cfc8b8" stroke-width="0.5"/><text y="-0.6" font-size="10" text-anchor="middle" dominant-baseline="middle">${dishIcon}</text></g>`;
  return `<g class="gift-item"><g transform="translate(40 22)">${mug(0, -4)}</g><g transform="translate(56 23)">${mug(0, -4)}</g></g>`;
}
/** Beer tower (tháp bia): a tall tube with a tap */
const tower = (/** @type {number} */ x) =>
  `<g transform="translate(${x} 25)"><ellipse rx="6" ry="2" fill="#4a4f57"/><rect x="-3.6" y="-30" width="7.2" height="29" rx="3.4" fill="#f2a516" stroke="#fff6dc" stroke-width="0.8"/><rect x="-2.4" y="-27" width="1.4" height="22" rx="0.7" fill="#ffe08a" opacity="0.8"/><rect x="-3.6" y="-31.6" width="7.2" height="4" rx="2" fill="#fffdf4"/><rect x="-1.2" y="-35" width="2.4" height="4" fill="#9aa1ab"/><path d="M3.6 -6 h3 v2.4 h-1.4" fill="none" stroke="#9aa1ab" stroke-width="1.2"/></g>`;
