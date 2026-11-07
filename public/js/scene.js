// @ts-check
// Cảnh quán vẽ bằng SVG (vector, nét ở mọi độ phân giải): trời đêm, mặt tiền nhà phố, bạt sọc, dây đèn,
// tủ mát, kệ, bảng thực đơn, quầy có bom bia hơi, két bia, thùng đá và vỉa hè lát gạch.
// Khung 430 x 764 = sân khấu 9:16. Chủ quán (HTML) đứng giữa lớp sau (backSVG) và quầy (counterSVG).
import { seeded } from './people.js';

const W = 430;
const H = 764;

function skyline() {
  const r = seeded(77);
  let out = '';
  let x = -10;
  while (x < W + 10) {
    const w = 30 + r() * 46;
    const h = 40 + r() * 70;
    const top = 120 - h;
    out += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 20).toFixed(1)}" fill="#171538"/>`;
    for (let wy = top + 8; wy < 112; wy += 10) {
      for (let wx = x + 5; wx < x + w - 6; wx += 9) {
        if (r() < 0.38) out += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="4" height="5" fill="${r() < 0.7 ? '#ffd98a' : '#9fd3ff'}" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`;
      }
    }
    x += w + 2;
  }
  return out;
}

/** Light bulbs on a sagging string from (x1,y1) to (x2,y2) */
function stringLights(/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2, /** @type {number} */ sag, /** @type {number} */ n, /** @type {number} */ seed) {
  const r = seeded(seed);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + sag * 2;
  let bulbs = '';
  const colors = ['#ffd36b', '#ffb347', '#ff8fa3', '#9be7ff', '#c3ff8f', '#ffd36b'];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    const c = colors[Math.floor(r() * colors.length)];
    bulbs += `<g class="bulb" style="animation-delay:-${(r() * 4).toFixed(2)}s"><line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${(by + 4).toFixed(1)}" stroke="#222" stroke-width="1"/><circle cx="${bx.toFixed(1)}" cy="${(by + 8).toFixed(1)}" r="9" fill="url(#bulbGlow)" opacity="0.55"/><circle cx="${bx.toFixed(1)}" cy="${(by + 7.5).toFixed(1)}" r="3.4" fill="${c}"/><circle cx="${(bx - 1).toFixed(1)}" cy="${(by + 6.5).toFixed(1)}" r="1" fill="#fff" opacity="0.8"/></g>`;
  }
  return `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" fill="none" stroke="#1a1a1a" stroke-width="1.3"/>${bulbs}`;
}

/** Sidewalk tiles in perspective toward a vanishing point above the shop */
function sidewalk() {
  const top = 468;
  const vx = W / 2;
  const vy = 300;
  let lines = '';
  for (let k = 1; k < 14; k++) {
    const y = top + Math.pow(k / 13, 1.7) * (H - top + 20);
    lines += `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}"/>`;
  }
  for (let i = -12; i <= 12; i++) {
    const bx = vx + i * 46;
    const tx = vx + (bx - vx) * ((top - vy) / (H + 20 - vy));
    lines += `<line x1="${tx.toFixed(1)}" y1="${top}" x2="${bx.toFixed(1)}" y2="${H + 20}"/>`;
  }
  return `<rect x="0" y="${top}" width="${W}" height="${H - top}" fill="url(#floor)"/>
  <g stroke="#1d1815" stroke-width="1.1" opacity="0.75">${lines}</g>
  <ellipse cx="${W / 2}" cy="${top + 40}" rx="260" ry="90" fill="url(#warmPool)"/>
  <ellipse cx="${W / 2}" cy="${H - 120}" rx="240" ry="120" fill="url(#warmPool)" opacity="0.6"/>
  <g opacity="0.55"><path d="M60 700 l7 -2 l2 4 l-6 2 Z" fill="#e9e2cf"/><path d="M300 640 l6 -1 l1 4 l-6 1 Z" fill="#e9e2cf"/><circle cx="210" cy="732" r="2" fill="#b9782f"/><circle cx="140" cy="612" r="1.6" fill="#b9782f"/><circle cx="352" cy="720" r="1.8" fill="#b9782f"/></g>`;
}

function crates(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ cols, /** @type {number} */ rows, /** @type {string} */ color) {
  let out = '';
  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      const cx = x + c * 30 + (row % 2) * 4;
      const cy = y - row * 17;
      out += `<g><rect x="${cx}" y="${cy}" width="29" height="16" rx="1.5" fill="${color}" stroke="#00000055" stroke-width="0.8"/><rect x="${cx + 3}" y="${cy + 3}" width="23" height="3" rx="1" fill="#00000033"/><g fill="#1f6b2c">${[0, 1, 2, 3].map((k) => `<circle cx="${cx + 6 + k * 5.6}" cy="${cy - 1}" r="2.2"/>`).join('')}</g></g>`;
    }
  }
  return out;
}

export function backSVG() {
  const r = seeded(5);
  let shelfItems = '';
  for (let i = 0; i < 16; i++) {
    const x = 128 + i * 11.4;
    const c = ['#e63946', '#ffb703', '#2a9d8f', '#f4a261', '#8d5bd6', '#06aed5'][Math.floor(r() * 6)];
    shelfItems += `<rect x="${x.toFixed(1)}" y="${(281 + r() * 4).toFixed(1)}" width="8" height="${(12 + r() * 6).toFixed(1)}" rx="1.5" fill="${c}" opacity="0.9"/>`;
    shelfItems += `<rect x="${x.toFixed(1)}" y="${(310 + r() * 4).toFixed(1)}" width="8" height="${(10 + r() * 5).toFixed(1)}" rx="3" fill="${['#c9a227', '#f1f1f1', '#d62828', '#3a86ff'][Math.floor(r() * 4)]}" opacity="0.85"/>`;
  }
  let fridgeBottles = '';
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 6; i++) {
      fridgeBottles += `<rect x="${30 + i * 10}" y="${292 + row * 38}" width="6" height="20" rx="2" fill="${(i + row) % 3 ? '#2f7d3a' : '#8b4b16'}"/><rect x="${31.5 + i * 10}" y="${286 + row * 38}" width="3" height="7" fill="${(i + row) % 3 ? '#2f7d3a' : '#8b4b16'}"/>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="scene-svg" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a22"/><stop offset="0.6" stop-color="#21123a"/><stop offset="1" stop-color="#3a1b35"/></linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2a1c"/><stop offset="0.5" stop-color="#6b3d27"/><stop offset="1" stop-color="#4a2a1c"/></linearGradient>
    <linearGradient id="inside" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2114"/><stop offset="1" stop-color="#1c0e07"/></linearGradient>
    <radialGradient id="insideGlow" cx="0.5" cy="0.55" r="0.6"><stop offset="0" stop-color="#ffb04a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3d35"/><stop offset="0.5" stop-color="#3a302a"/><stop offset="1" stop-color="#262019"/></linearGradient>
    <radialGradient id="warmPool"><stop offset="0" stop-color="#ffb347" stop-opacity="0.32"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
    <radialGradient id="bulbGlow"><stop offset="0" stop-color="#ffe7a0" stop-opacity="0.9"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></radialGradient>
    <radialGradient id="windowGlow" cx="0.5" cy="0.5" r="0.7"><stop offset="0" stop-color="#ffd58a"/><stop offset="1" stop-color="#c77a2e"/></radialGradient>
    <linearGradient id="fridgeGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dff6ff" stop-opacity="0.95"/><stop offset="1" stop-color="#8fd3ff" stop-opacity="0.8"/></linearGradient>
    <pattern id="awning" width="36" height="40" patternUnits="userSpaceOnUse"><rect width="18" height="40" fill="#c1272d"/><rect x="18" width="18" height="40" fill="#f3e3c3"/></pattern>
    <linearGradient id="awningShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <g opacity="0.9">${skyline()}</g>
  <circle cx="372" cy="70" r="15" fill="#fff6d8" opacity="0.85"/><circle cx="378" cy="66" r="13" fill="#21123a" opacity="0.9"/>

  <!-- upper floor of the shophouse -->
  <rect x="0" y="96" width="${W}" height="130" fill="url(#wall)"/>
  <g stroke="#3a2015" stroke-width="1" opacity="0.5"><line x1="0" y1="132" x2="${W}" y2="132"/><line x1="0" y1="168" x2="${W}" y2="168"/></g>
  <!-- sign board behind the neon title (title is HTML on top) -->
  <rect x="40" y="48" width="350" height="70" rx="12" fill="#0d0710" stroke="#2c1726" stroke-width="3"/>
  <rect x="48" y="56" width="334" height="54" rx="8" fill="none" stroke="#ff3d81" stroke-opacity="0.25" stroke-width="2"/>
  <line x1="80" y1="118" x2="80" y2="132" stroke="#222" stroke-width="3"/><line x1="350" y1="118" x2="350" y2="132" stroke="#222" stroke-width="3"/>
  <!-- windows with warm light -->
  <g><rect x="34" y="140" width="80" height="58" rx="3" fill="url(#windowGlow)" opacity="0.9"/><path d="M34 140 h40 v58 h-40 Z" fill="#b5462e" opacity="0.55"/><rect x="34" y="140" width="80" height="58" rx="3" fill="none" stroke="#2a160d" stroke-width="3"/><line x1="74" y1="140" x2="74" y2="198" stroke="#2a160d" stroke-width="2"/></g>
  <g><rect x="316" y="140" width="80" height="58" rx="3" fill="url(#windowGlow)" opacity="0.75"/><rect x="316" y="140" width="80" height="58" rx="3" fill="none" stroke="#2a160d" stroke-width="3"/><line x1="356" y1="140" x2="356" y2="198" stroke="#2a160d" stroke-width="2"/></g>
  <rect x="160" y="146" width="40" height="24" rx="3" fill="#d9dde2"/><g stroke="#9aa1ab" stroke-width="1"><line x1="164" y1="152" x2="196" y2="152"/><line x1="164" y1="157" x2="196" y2="157"/><line x1="164" y1="162" x2="196" y2="162"/></g>
  <!-- balcony with plants -->
  <rect x="0" y="198" width="${W}" height="6" fill="#2a160d"/>
  <g stroke="#2a160d" stroke-width="2">${Array.from({ length: 30 }, (_, i) => `<line x1="${i * 15 + 4}" y1="204" x2="${i * 15 + 4}" y2="222"/>`).join('')}</g>
  <rect x="0" y="220" width="${W}" height="4" fill="#2a160d"/>
  <g><path d="M240 198 q-6 -16 4 -26 q2 12 6 4 q4 -12 10 -2 q2 10 -2 24 Z" fill="#3f8f3a"/><rect x="242" y="192" width="18" height="8" fill="#b5462e"/></g>
  <g><path d="M120 198 q-4 -12 4 -20 q3 8 6 2 q5 -8 8 2 q0 8 -3 16 Z" fill="#4fa046"/><rect x="122" y="192" width="16" height="8" fill="#e9c46a"/></g>

  <!-- ground floor: inside the shop -->
  <rect x="0" y="226" width="${W}" height="244" fill="url(#inside)"/>
  <rect x="0" y="226" width="${W}" height="244" fill="url(#insideGlow)"/>
  <!-- fridge (tủ mát) -->
  <rect x="18" y="270" width="76" height="186" rx="5" fill="#e9edf1"/>
  <rect x="24" y="278" width="64" height="168" rx="3" fill="url(#fridgeGlass)"/>
  ${fridgeBottles}
  <g stroke="#b9c3cc" stroke-width="1.2">${[0, 1, 2, 3].map((k) => `<line x1="24" y1="${314 + k * 38}" x2="88" y2="${314 + k * 38}"/>`).join('')}</g>
  <rect x="26" y="280" width="6" height="160" fill="#fff" opacity="0.35"/>
  <rect x="18" y="258" width="76" height="14" rx="3" fill="#1f6fd8"/><text x="56" y="269" font-size="9" font-weight="800" fill="#fff" text-anchor="middle" font-family="Baloo 2, sans-serif">NƯỚC MÁT</text>
  <!-- shelves -->
  <g fill="#7a4a2a"><rect x="122" y="298" width="186" height="4"/><rect x="122" y="326" width="186" height="4"/></g>
  ${shelfItems}
  <!-- chalk menu board -->
  <g transform="translate(322 262)"><rect width="88" height="96" rx="4" fill="#5a3a22"/><rect x="5" y="5" width="78" height="86" rx="2" fill="#1f2a24"/>
    <text x="44" y="22" font-size="11" font-weight="800" fill="#f6f1d8" text-anchor="middle" font-family="Baloo 2, sans-serif">THỰC ĐƠN</text>
    <g fill="#f6f1d8" opacity="0.75" font-size="7" font-family="Baloo 2, sans-serif"><text x="11" y="36">Ốc len xào</text><text x="11" y="48">Khô mực</text><text x="11" y="60">Lẩu thái</text><text x="11" y="72">Đậu phộng</text><text x="11" y="84">Nước ngọt</text></g>
    <g fill="#ffd36b" font-size="7" text-anchor="end" font-family="Baloo 2, sans-serif"><text x="78" y="36">★</text><text x="78" y="48">★</text><text x="78" y="60">★★</text><text x="78" y="72">♥</text><text x="78" y="84">♥</text></g>
  </g>
  <!-- wall clock -->
  <circle cx="215" cy="248" r="11" fill="#f6f1e4" stroke="#3a2114" stroke-width="2"/><path d="M215 248 v-7 M215 248 h5" stroke="#222" stroke-width="1.4" stroke-linecap="round"/>

  <!-- awning (bạt sọc) -->
  <rect x="0" y="222" width="${W}" height="30" fill="url(#awning)"/>
  <rect x="0" y="222" width="${W}" height="30" fill="url(#awningShade)"/>
  <g>${Array.from({ length: 13 }, (_, i) => `<path d="M${i * 36} 252 q9 12 18 0 Z" fill="#c1272d"/><path d="M${i * 36 + 18} 252 q9 12 18 0 Z" fill="#f3e3c3"/>`).join('')}</g>
  ${stringLights(-6, 258, 436, 262, 22, 17, 11)}
  ${stringLights(-6, 120, 436, 116, 10, 15, 23)}

  <!-- street lamp on the right -->
  <rect x="414" y="160" width="5" height="320" fill="#262a30"/><path d="M416 162 q-18 -6 -30 4" fill="none" stroke="#262a30" stroke-width="4"/><ellipse cx="386" cy="170" rx="9" ry="4" fill="#ffe7a0"/><ellipse cx="386" cy="200" rx="40" ry="30" fill="url(#bulbGlow)" opacity="0.4"/>

  ${sidewalk()}
  <!-- crates and the ice box outside the counter -->
  ${crates(4, 452, 2, 3, '#e0a100')}
  <g transform="translate(352 404)"><rect width="66" height="54" rx="4" fill="#f5f6f7"/><rect y="-8" width="66" height="12" rx="3" fill="#1f6fd8"/><text x="33" y="34" font-size="14" font-weight="800" fill="#1f6fd8" text-anchor="middle" font-family="Baloo 2, sans-serif">ĐÁ</text></g>
  ${crates(358, 470, 2, 1, '#d62828')}
</svg>`;
}

/** The counter in front of the host, with the beer keg and glasses */
export function counterSVG() {
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="scene-svg" aria-hidden="true">
  <defs>
    <linearGradient id="counterWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5530"/><stop offset="1" stop-color="#5a341b"/></linearGradient>
    <linearGradient id="keg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a929c"/><stop offset="0.4" stop-color="#eef2f6"/><stop offset="1" stop-color="#7d858f"/></linearGradient>
  </defs>
  <!-- keg of bia hơi on the counter -->
  <g transform="translate(128 344)">
    <rect width="46" height="54" rx="6" fill="url(#keg)"/><rect y="12" width="46" height="4" fill="#6b727b"/><rect y="40" width="46" height="4" fill="#6b727b"/>
    <rect x="6" y="20" width="34" height="16" rx="3" fill="#f2a516"/><text x="23" y="31.5" font-size="8" font-weight="800" fill="#5a2d00" text-anchor="middle" font-family="Baloo 2, sans-serif">BIA HƠI</text>
    <rect x="20" y="-8" width="6" height="10" fill="#6b727b"/><path d="M46 22 h8 v10" fill="none" stroke="#6b727b" stroke-width="3"/>
  </g>
  <!-- stacked glasses and a jar -->
  <g transform="translate(262 372)"><g fill="#cfe8ff" opacity="0.75" stroke="#fff" stroke-width="0.6"><path d="M0 26 h12 l-1 -14 h-10 Z"/><path d="M14 26 h12 l-1 -14 h-10 Z"/><path d="M7 12 h12 l-1 -14 h-10 Z"/></g></g>
  <g transform="translate(220 362)"><rect width="22" height="34" rx="5" fill="#f4e9c8" opacity="0.8"/><rect x="2" y="-4" width="18" height="6" rx="2" fill="#d62828"/></g>
  <!-- counter -->
  <rect x="104" y="396" width="222" height="12" rx="3" fill="#b07a46"/>
  <rect x="110" y="406" width="210" height="66" fill="url(#counterWood)"/>
  <g stroke="#3e2210" stroke-width="1.2" opacity="0.6">${Array.from({ length: 8 }, (_, i) => `<line x1="${110 + i * 26.25}" y1="408" x2="${110 + i * 26.25}" y2="472"/>`).join('')}</g>
  <rect x="150" y="424" width="130" height="26" rx="13" fill="#1a0f0a" opacity="0.65"/>
  <text x="215" y="442" font-size="13" font-weight="800" fill="#ffd36b" text-anchor="middle" font-family="Baloo 2, sans-serif" letter-spacing="1">QUÁN NHẬU</text>
</svg>`;
}
