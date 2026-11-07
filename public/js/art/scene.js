// @ts-check
// Cảnh "Nhậu Đêm 134" vẽ kiểu tranh chi tiết: mặt tiền nhà phố về đêm, quán dưới mái bạt, trong quán gạch men,
// tủ mát, TV chiếu bóng đá, biển số nhà xanh 134; vỉa hè gạch block có vũng sáng vàng, mép đường ướt phản chiếu
// đèn neon. Có lớp hạt (grain), đổ bóng mềm, ánh đèn ấm và viền tối (vignette) cho cảm giác tranh vẽ, không
// phải hoạt hình phẳng. Khung 430 x 764 = sân khấu 9:16.

const W = 430;
const H = 764;
export const GROUND = 418; // vỉa hè bắt đầu
export const CURB = 686;

/** tiny seeded random, so the picture is the same every time */
export function seeded(/** @type {number} */ seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const DEFS = `
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05081a"/><stop offset="0.7" stop-color="#151532"/><stop offset="1" stop-color="#2a1f3d"/></linearGradient>
  <linearGradient id="facade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3f3a"/><stop offset="0.55" stop-color="#7d6a55"/><stop offset="1" stop-color="#a88a62"/></linearGradient>
  <linearGradient id="facadeSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="0.25" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
  <linearGradient id="inside" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3d6"/><stop offset="0.6" stop-color="#f0d29a"/><stop offset="1" stop-color="#b98a52"/></linearGradient>
  <pattern id="wallTiles" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#f4ede0"/><path d="M0 0 H10 M0 0 V10" stroke="#cdbfa6" stroke-width="0.6"/></pattern>
  <linearGradient id="awning" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a1013"/><stop offset="1" stop-color="#8e1d1f"/></linearGradient>
  <linearGradient id="walk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c4640"/><stop offset="1" stop-color="#6b6259"/></linearGradient>
  <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18181f"/><stop offset="1" stop-color="#0c0c12"/></linearGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f5f8"/><stop offset="0.5" stop-color="#b6bec7"/><stop offset="1" stop-color="#7b848f"/></linearGradient>
  <linearGradient id="fridgeGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9f2ff" stop-opacity="0.85"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="1" stop-color="#cfe9ff" stop-opacity="0.85"/></linearGradient>
  <radialGradient id="warm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffcf7a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>
  <radialGradient id="bulb" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff2b8" stop-opacity="0.95"/><stop offset="0.35" stop-color="#ffcf6a" stop-opacity="0.45"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.48" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></radialGradient>
  <linearGradient id="neonPink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5fa2"/><stop offset="1" stop-color="#ff2d6f"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="softer" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 -1.4 1.05"/></filter>
  <filter id="stain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.03 0.08" numOctaves="3" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 -2.2 1.3"/></filter>
`;

/** A window upstairs: iron grille (song sắt), sometimes lit with a curtain */
function upstairsWindow(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ h, /** @type {() => number} */ r) {
  const lit = r() < 0.6;
  const glass = lit ? '#ffcf86' : '#1b1e2c';
  let bars = '';
  for (let k = x + 4; k < x + w; k += 5) bars += `<line x1="${k}" y1="${y}" x2="${k}" y2="${y + h}"/>`;
  return `<g>
    <rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" fill="#2a2420"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${glass}"/>
    ${lit ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#warm)" opacity="0.8"/><path d="M${x} ${y} h${w * 0.35} q-4 ${h / 2} 0 ${h} h-${w * 0.35} Z" fill="#c9543d" opacity="0.75"/>` : ''}
    <g stroke="#1a1714" stroke-width="1.2">${bars}<line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}"/></g>
    <rect x="${x - 5}" y="${y + h + 2}" width="${w + 10}" height="3" fill="#00000055"/>
  </g>`;
}

/** Air conditioner box hanging on the wall */
const aircon = (/** @type {number} */ x, /** @type {number} */ y) =>
  `<g><rect x="${x}" y="${y}" width="26" height="18" rx="1.5" fill="#d8d6cf"/><rect x="${x}" y="${y}" width="26" height="18" rx="1.5" fill="url(#facadeSide)" opacity="0.4"/><circle cx="${x + 9}" cy="${y + 9}" r="6" fill="#9a978f"/>${[0, 1, 2].map((i) => `<line x1="${x + 18}" y1="${y + 4 + i * 4}" x2="${x + 24}" y2="${y + 4 + i * 4}" stroke="#8a877f" stroke-width="1"/>`).join('')}<path d="M${x + 13} ${y + 18} q2 10 -6 14" fill="none" stroke="#3a3a3a" stroke-width="1"/></g>`;

/** Glass-door fridge (tủ mát) with rows of bottles, lit from inside; no brands */
function fridge(/** @type {number} */ x, /** @type {number} */ y) {
  const r = seeded(17);
  let bottles = '';
  for (let row = 0; row < 5; row++) {
    for (let c = 0; c < 6; c++) {
      const bx = x + 5 + c * 6;
      const by = y + 14 + row * 17;
      const col = ['#2e7d32', '#6d3b14', '#c62828', '#f9a825', '#1565c0', '#ececec'][Math.floor(r() * 6)];
      bottles += `<rect x="${bx}" y="${by}" width="4.2" height="11" rx="1.6" fill="${col}"/><rect x="${bx + 0.8}" y="${by - 3}" width="2.6" height="4" fill="${col}"/><rect x="${bx + 0.6}" y="${by + 1}" width="1" height="8" fill="#fff" opacity="0.4"/>`;
    }
  }
  return `<g>
    <rect x="${x - 3}" y="${y - 8}" width="${48}" height="${104}" rx="2" fill="#1c3d78"/>
    <rect x="${x - 3}" y="${y - 8}" width="${48}" height="8" fill="#e53935"/>
    <rect x="${x}" y="${y}" width="42" height="92" fill="#eaf6ff"/>
    ${bottles}
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${x}" y="${y + 26 + i * 17}" width="42" height="1.4" fill="#9fb7c9"/>`).join('')}
    <rect x="${x}" y="${y}" width="42" height="92" fill="url(#fridgeGlass)" opacity="0.35"/>
    <path d="M${x + 4} ${y} L${x + 14} ${y} L${x + 2} ${y + 92} L${x - 8 + 8} ${y + 92} Z" fill="#fff" opacity="0.25"/>
    <rect x="${x + 36}" y="${y + 36}" width="2" height="18" rx="1" fill="#9aa"/>
  </g>`;
}

/** Old TV on a wall bracket showing a football match */
const tv = (/** @type {number} */ x, /** @type {number} */ y) =>
  `<g><path d="M${x + 22} ${y - 10} V${y}" stroke="#333" stroke-width="2"/><rect x="${x}" y="${y}" width="46" height="30" rx="2" fill="#141414"/><rect x="${x + 3}" y="${y + 3}" width="40" height="23" fill="#2e8b3e" class="tv-screen"/><path d="M${x + 23} ${y + 3} V${y + 26}" stroke="#bfe8c4" stroke-width="0.6"/><circle cx="${x + 23}" cy="${y + 14.5}" r="4" fill="none" stroke="#bfe8c4" stroke-width="0.6"/><g fill="#ffd54f"><circle cx="${x + 12}" cy="${y + 11}" r="1"/><circle cx="${x + 30}" cy="${y + 18}" r="1"/></g><g fill="#e53935"><circle cx="${x + 17}" cy="${y + 19}" r="1"/><circle cx="${x + 35}" cy="${y + 9}" r="1"/></g><rect x="${x + 3}" y="${y + 3}" width="40" height="5" fill="#000" opacity="0.35"/><rect x="${x + 3}" y="${y + 3}" width="40" height="23" fill="#9ff" opacity="0.08"/></g>`;

/** Sagging cable with warm bulbs (dây bóng đèn) */
function bulbs(/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2, /** @type {number} */ sag, /** @type {number} */ n) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + sag * 2;
  let out = `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" fill="none" stroke="#0e0e0e" stroke-width="1.2"/>`;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    out += `<g class="bulb" style="animation-delay:-${(i * 0.73) % 4}s"><circle cx="${bx.toFixed(1)}" cy="${(by + 7).toFixed(1)}" r="16" fill="url(#bulb)"/><line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${(by + 4).toFixed(1)}" stroke="#111" stroke-width="1"/><ellipse cx="${bx.toFixed(1)}" cy="${(by + 7).toFixed(1)}" rx="2.8" ry="3.6" fill="#fff6cf"/></g>`;
  }
  return out;
}

/** Sidewalk of grey concrete blocks, worn, with litter of a nhậu night */
function sidewalk() {
  const r = seeded(23);
  let joints = '';
  const vx = W / 2;
  const vy = 230;
  for (let k = 1; k < 11; k++) {
    const y = GROUND + Math.pow(k / 10, 1.55) * (CURB - GROUND);
    joints += `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}"/>`;
  }
  for (let i = -12; i <= 12; i++) {
    const bx = vx + i * 46;
    const tx = vx + (bx - vx) * ((GROUND - vy) / (CURB - vy));
    joints += `<line x1="${tx.toFixed(1)}" y1="${GROUND}" x2="${bx.toFixed(1)}" y2="${CURB}"/>`;
  }
  let litter = '';
  for (let i = 0; i < 22; i++) {
    const x = r() * W;
    const y = GROUND + 30 + r() * (CURB - GROUND - 40);
    const k = r();
    if (k < 0.45) litter += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${(3 + r() * 4).toFixed(1)} -2 l2 ${(2 + r() * 3).toFixed(1)} l-5 2 Z" fill="#ece6d8" opacity="0.8"/>`; // khăn giấy
    else if (k < 0.85) litter += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.6" ry="1" fill="#b98953"/>`; // vỏ lạc
    else litter += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="7" height="1.4" rx="0.7" fill="#d9c7a0" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; // tăm
  }
  return `<rect x="0" y="${GROUND}" width="${W}" height="${CURB - GROUND}" fill="url(#walk)"/>
    <rect x="0" y="${GROUND}" width="${W}" height="${CURB - GROUND}" filter="url(#stain)" opacity="0.7"/>
    <g stroke="#2c2824" stroke-width="1.1" opacity="0.75">${joints}</g>
    <ellipse cx="${W / 2}" cy="${GROUND + 60}" rx="250" ry="110" fill="url(#warm)" opacity="0.9"/>
    <ellipse cx="${W * 0.22}" cy="${GROUND + 190}" rx="150" ry="70" fill="url(#warm)" opacity="0.45"/>
    <ellipse cx="${W * 0.78}" cy="${GROUND + 190}" rx="150" ry="70" fill="url(#warm)" opacity="0.45"/>
    ${litter}`;
}

/** Curb and the wet street, reflecting the neon and bulbs */
function street() {
  return `<rect x="0" y="${CURB}" width="${W}" height="12" fill="#77716a"/><rect x="0" y="${CURB}" width="${W}" height="2.5" fill="#a49d93"/>
    <rect x="0" y="${CURB + 12}" width="${W}" height="${H - CURB - 12}" fill="url(#road)"/>
    <g filter="url(#softer)" opacity="0.55"><rect x="150" y="${CURB + 16}" width="22" height="60" fill="#ff3d82"/><rect x="250" y="${CURB + 16}" width="16" height="60" fill="#ffd166"/><rect x="60" y="${CURB + 18}" width="10" height="50" fill="#ffcf7a"/><rect x="360" y="${CURB + 18}" width="10" height="50" fill="#ffcf7a"/></g>
    <g fill="#e8e1cf" opacity="0.5">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${i * 70 + 6}" y="${CURB + 46}" width="38" height="3" rx="1.5"/>`).join('')}</g>`;
}

export function backSVG() {
  const r = seeded(134);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="scene-svg" aria-hidden="true">
  <defs>${DEFS}</defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <g fill="#fff" opacity="0.7">${[...Array(26)].map(() => `<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * 40).toFixed(1)}" r="${(0.4 + r() * 0.8).toFixed(2)}"/>`).join('')}</g>
  <!-- far buildings -->
  <g fill="#0f1024">${[...Array(9)].map((_, i) => `<rect x="${i * 50 - 10}" y="${8 + ((i * 37) % 30)}" width="${46}" height="80"/>`).join('')}</g>
  <g>${[...Array(40)].map(() => `<rect x="${(r() * W).toFixed(1)}" y="${(16 + r() * 50).toFixed(1)}" width="2.4" height="3" fill="${r() < 0.75 ? '#f6c66f' : '#8fc3ff'}" opacity="${(0.3 + r() * 0.5).toFixed(2)}"/>`).join('')}</g>

  <!-- the building: three storeys of a Hanoi tube house -->
  <rect x="0" y="60" width="${W}" height="${GROUND - 60}" fill="url(#facade)"/>
  <rect x="0" y="60" width="${W}" height="${GROUND - 60}" filter="url(#stain)" opacity="0.9"/>
  <rect x="0" y="60" width="${W}" height="6" fill="#2a2420"/>
  ${upstairsWindow(30, 84, 44, 46, r)}${upstairsWindow(112, 84, 44, 46, r)}${upstairsWindow(274, 84, 44, 46, r)}${upstairsWindow(356, 84, 44, 46, r)}
  ${aircon(80, 100)}${aircon(320, 92)}
  <rect x="0" y="138" width="${W}" height="5" fill="#2a2420" opacity="0.8"/>
  <!-- sign brackets (the lit sign itself is HTML, over this) -->
  <g fill="#1a1714"><rect x="64" y="143" width="3" height="8"/><rect x="363" y="143" width="3" height="8"/></g>
  <ellipse cx="215" cy="170" rx="200" ry="40" fill="#ff3d3d" opacity="0.12" filter="url(#softer)"/>
  <!-- tangled cables in front of the facade -->
  <g fill="none" stroke="#0b0b0b" stroke-width="1.1" opacity="0.85"><path d="M-5 70 Q120 92 250 76 T440 80"/><path d="M-5 76 Q140 104 300 84 T440 92"/><path d="M380 64 Q396 110 424 214"/></g>

  <!-- ground floor: the quán, wide open -->
  <rect x="96" y="214" width="238" height="${GROUND - 214}" fill="#2a2420"/>
  <rect x="102" y="232" width="226" height="${GROUND - 232}" fill="url(#wallTiles)"/>
  <rect x="102" y="232" width="226" height="${GROUND - 232}" fill="url(#inside)" opacity="0.55"/>
  <rect x="150" y="238" width="120" height="3.5" rx="1.5" fill="#fbffff"/><ellipse cx="210" cy="246" rx="90" ry="22" fill="#fffbe8" opacity="0.35" filter="url(#softer)"/>
  ${fridge(124, 300)}
  ${tv(262, 256)}
  <!-- shelf with jars and glasses -->
  <g transform="translate(166 286)"><rect width="78" height="3" fill="#6b4a2f"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${4 + i * 10.5}" y="-12" width="7" height="12" rx="1.5" fill="${['#e9dcc0', '#c99a4b', '#e9dcc0', '#8a4b1f'][i % 4]}" opacity="0.9"/>`).join('')}</g>
  <!-- calendar and the little altar in the corner -->
  <g transform="translate(276 296)"><rect width="22" height="28" fill="#fffaf0"/><rect width="22" height="8" fill="#c62828"/><text x="11" y="23" text-anchor="middle" font-size="12" font-weight="900" fill="#c62828" font-family="Be Vietnam Pro, sans-serif">8</text></g>
  <g transform="translate(268 384)"><rect width="34" height="28" fill="#8e1b1b"/><rect x="3" y="3" width="28" height="12" fill="#c62828"/><circle cx="10" cy="9" r="2" fill="#ffcf6a"/><circle cx="24" cy="9" r="2" fill="#ffcf6a"/><rect x="14" y="5" width="6" height="8" fill="#ffd54f"/><ellipse cx="17" cy="9" rx="20" ry="10" fill="url(#bulb)" opacity="0.6"/></g>
  <!-- crates of empties against the wall -->
  <g transform="translate(240 372)">${[0, 1, 2].map((row) => [0, 1].map((c) => `<rect x="${c * 24 + (row % 2) * 2}" y="${-row * 13}" width="23" height="12" rx="1" fill="#c79c2e" stroke="#00000066"/>`).join('')).join('')}</g>
  <!-- side walls in shadow, roll-up door at the top -->
  <rect x="96" y="214" width="238" height="18" fill="#3b3b40"/>${[...Array(4)].map((_, i) => `<line x1="96" y1="${217 + i * 4}" x2="334" y2="${217 + i * 4}" stroke="#2a2a2e" stroke-width="1.2"/>`).join('')}
  <rect x="96" y="214" width="238" height="${GROUND - 214}" fill="url(#facadeSide)" opacity="0.6"/>
  <!-- house number plate, blue like every Hanoi house -->
  <g transform="translate(384 147)"><rect width="42" height="30" rx="2.5" fill="#1d4fa3" stroke="#e8eef8" stroke-width="1.3"/><rect x="2.4" y="2.4" width="37.2" height="25.2" rx="1.5" fill="none" stroke="#e8eef8" stroke-opacity="0.5" stroke-width="0.5"/><text x="21" y="15.6" text-anchor="middle" font-size="13" font-weight="900" fill="#fff" font-family="Be Vietnam Pro, sans-serif">134</text><path d="M6 18.4 H36" stroke="#e8eef8" stroke-opacity="0.6" stroke-width="0.5"/><text x="21" y="25" text-anchor="middle" font-size="6.2" font-weight="800" fill="#fff" letter-spacing="0.3" font-family="Be Vietnam Pro, sans-serif">TRẦN PHÚ</text></g>
  <!-- awning (bạt) pulled out over the sidewalk -->
  <path d="M100 252 L330 252 L346 278 L84 278 Z" fill="url(#awning)"/>
  <path d="M84 278 ${[...Array(13)].map(() => 'q10 8 20 0').join(' ')}" fill="#7a1717"/>
  <path d="M84 278 L346 278" stroke="#d94a4a" stroke-width="1.2" opacity="0.6"/>
  <path d="M100 252 L330 252 L346 278 L84 278 Z" fill="#000" opacity="0.15"/>
  ${bulbs(84, 282, 346, 282, 6, 9)}
  ${sidewalk()}
  ${street()}
  <!-- lamp post and tree trunk at the edges -->
  <!-- wall lights over the two boards -->
  <ellipse cx="58" cy="300" rx="70" ry="110" fill="url(#bulb)" opacity="0.22"/><ellipse cx="372" cy="300" rx="70" ry="110" fill="url(#bulb)" opacity="0.22"/>
</svg>`;
}

/** Front layer: the cooking station at the shop entrance (gas stove and wok, broth pot, charcoal grill) */
export function kitchenSVG() {
  const coals = [...Array(12)].map((_, i) => `<circle cx="${262 + (i % 6) * 6}" cy="${372 + Math.floor(i / 6) * 4}" r="2.6" fill="${i % 3 ? '#ff6a1f' : '#ffb347'}" class="coal" style="animation-delay:-${(i * 0.37).toFixed(2)}s"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="scene-svg kitchen-svg" aria-hidden="true">
  <defs>
    <linearGradient id="kSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset="0.45" stop-color="#bcc4cd"/><stop offset="1" stop-color="#6f7882"/></linearGradient>
    <linearGradient id="kFront" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8b949e"/><stop offset="0.5" stop-color="#c7ced6"/><stop offset="1" stop-color="#7d8690"/></linearGradient>
    <radialGradient id="kFire"><stop offset="0" stop-color="#fff7c2"/><stop offset="0.45" stop-color="#ff9a2e"/><stop offset="1" stop-color="#ff3d0f" stop-opacity="0"/></radialGradient>
    <radialGradient id="kBlue"><stop offset="0" stop-color="#bfe3ff"/><stop offset="0.6" stop-color="#3d8bff"/><stop offset="1" stop-color="#3d8bff" stop-opacity="0"/></radialGradient>
    <filter id="kShadow" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <ellipse cx="215" cy="424" rx="120" ry="8" fill="#000" opacity="0.55" filter="url(#kShadow)"/>
  <!-- counter -->
  <rect x="128" y="380" width="174" height="7" rx="1.5" fill="url(#kSteel)"/>
  <rect x="132" y="387" width="166" height="34" fill="url(#kFront)"/>
  <rect x="132" y="387" width="166" height="34" fill="#000" opacity="0.12"/>
  <g stroke="#6b737c" stroke-width="1"><line x1="187" y1="389" x2="187" y2="419"/><line x1="243" y1="389" x2="243" y2="419"/></g>
  <g fill="#f8f5ee"><ellipse cx="160" cy="404" rx="12" ry="3"/><ellipse cx="160" cy="401" rx="12" ry="3"/><ellipse cx="160" cy="398" rx="12" ry="3"/></g>
  <g fill="#3c3f44"><rect x="134" y="419" width="4" height="6"/><rect x="292" y="419" width="4" height="6"/></g>
  <!-- gas stove with a big wok -->
  <g class="stove">
    <rect x="140" y="368" width="44" height="13" rx="2" fill="#2b2e33"/>
    <ellipse class="flame blue" cx="162" cy="367" rx="14" ry="4" fill="url(#kBlue)"/>
    <ellipse class="flame f1" cx="162" cy="362" rx="20" ry="9" fill="url(#kFire)"/>
    <g class="wok"><path d="M138 356 Q162 376 186 356 Z" fill="#1d1f22"/><ellipse cx="162" cy="356" rx="24" ry="4.6" fill="#33373c"/><path d="M146 355 Q162 351 178 355" fill="none" stroke="#5a5f66" stroke-width="0.8"/>
      <g class="wok-food"><circle cx="155" cy="355" r="3" fill="#e9a23b"/><circle cx="162" cy="353.6" r="2.4" fill="#6aa84f"/><circle cx="168" cy="355.4" r="2.6" fill="#c0392b"/><circle cx="159" cy="352.6" r="1.8" fill="#f4e3b0"/></g>
      <path d="M186 356 L206 349" stroke="#1d1f22" stroke-width="3.4" stroke-linecap="round"/></g>
    <g class="smoke"><path class="steam s1" d="M152 346 c-4 -8 4 -12 0 -22" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round"/><path class="steam s2" d="M168 346 c-4 -8 4 -12 0 -22" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round"/></g>
  </g>
  <!-- herbs and a chopping board in front of the cook -->
  <g><rect x="196" y="373" width="40" height="8" rx="1.5" fill="#b9864f"/><rect x="196" y="373" width="40" height="2" fill="#d6a46c"/><g fill="#4f9a3a"><circle cx="203" cy="372" r="2.2"/><circle cx="208" cy="371.4" r="2"/><circle cx="213" cy="372.4" r="1.8"/></g><path d="M222 372 L236 368" stroke="#d7dde4" stroke-width="2.4"/><rect x="232" y="366" width="7" height="3" fill="#2b2b2b" transform="rotate(-16 232 366)"/></g>
  <!-- charcoal grill with skewers -->
  <g><rect x="256" y="368" width="42" height="13" rx="2" fill="#2b2e33"/>${coals}
    <g stroke="#b9c0c8" stroke-width="0.7">${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${258 + i * 7.6}" y1="364" x2="${258 + i * 7.6}" y2="370"/>`).join('')}<line x1="256" y1="368" x2="298" y2="368"/></g>
    ${[0, 1, 2, 3].map((i) => `<g transform="translate(${263 + i * 9} 364)"><line x1="-3" y1="-1" x2="4" y2="9" stroke="#e1cfa3" stroke-width="0.9"/><rect x="-2.6" y="0" width="5.2" height="7" rx="2" fill="${['#8b3a1e', '#b5582c', '#a0522d', '#7a2e16'][i]}" transform="rotate(-25)"/></g>`).join('')}
    <ellipse class="flame f2" cx="277" cy="366" rx="20" ry="6" fill="url(#kFire)" opacity="0.65"/>
    <path class="steam s1" d="M270 358 c-4 -8 4 -12 0 -24" fill="none" stroke="#ddd" stroke-opacity="0.3" stroke-width="4" stroke-linecap="round"/></g>
  <!-- broth pot on its own burner -->
  <g><rect x="306" y="402" width="30" height="20" rx="2" fill="#2b2e33"/><circle cx="314" cy="410" r="2" fill="#ff7a1f" class="coal"/><circle cx="328" cy="410" r="2" fill="#ff7a1f" class="coal"/>
    <rect x="303" y="374" width="36" height="29" rx="3" fill="url(#kSteel)"/><ellipse cx="321" cy="374" rx="18" ry="4.4" fill="#d5dbe2"/><ellipse cx="321" cy="374" rx="15" ry="3.2" fill="#a8461f"/>
    <path class="steam s1" d="M314 368 c-3 -7 3 -9 0 -17" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="2.4" stroke-linecap="round"/><path class="steam s2" d="M327 368 c-3 -7 3 -9 0 -17" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="2.4" stroke-linecap="round"/></g>
</svg>`;
}

/** Last layer, over everything in the room: soft vignette and a little grain, like a painting */
export function finishSVG() {
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="scene-svg" aria-hidden="true">
    <defs><radialGradient id="vg" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05030a" stop-opacity="0.6"/></radialGradient>
    <filter id="fg" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 -1.6 1.1"/></filter></defs>
    <rect width="${W}" height="${H}" fill="url(#vg)"/>
    <rect width="${W}" height="${H}" filter="url(#fg)" opacity="0.07"/>
  </svg>`;
}
