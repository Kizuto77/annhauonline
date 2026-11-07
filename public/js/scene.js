// @ts-check
// Cảnh quán vỉa hè phố cổ ban đêm, vẽ bằng SVG (nét ở mọi độ phân giải): dãy nhà ống có ban công, cửa chớp,
// cột điện chằng chịt dây, cây sấu, quán dưới mái bạt cam có bàn thờ ông Địa, vỉa hè lát gạch tàu, mép đường
// có xe máy chạy ngang. Lớp trước (kitchenSVG) là xe bếp ngoài trời: bếp than, chảo, nồi nước dùng, vỉ nướng,
// thùng đá. Khung 430 x 764 = sân khấu 9:16. Chủ quán (HTML) đứng giữa hai lớp này.
import { seeded } from './people.js';

const W = 430;
const H = 764;
/** where the sidewalk starts, the curb, the road */
const WALK = 415;
const CURB = 690;
const ROAD = 702;

/** Light bulbs on a sagging string from (x1,y1) to (x2,y2) */
function stringLights(/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2, /** @type {number} */ sag, /** @type {number} */ n, /** @type {number} */ seed) {
  const r = seeded(seed);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + sag * 2;
  let bulbs = '';
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    bulbs += `<g class="bulb" style="animation-delay:-${(r() * 4).toFixed(2)}s"><line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${(by + 4).toFixed(1)}" stroke="#222" stroke-width="1"/><circle cx="${bx.toFixed(1)}" cy="${(by + 8).toFixed(1)}" r="11" fill="url(#bulbGlow)" opacity="0.6"/><circle cx="${bx.toFixed(1)}" cy="${(by + 7.5).toFixed(1)}" r="3.4" fill="#ffd36b"/><circle cx="${(bx - 1).toFixed(1)}" cy="${(by + 6.5).toFixed(1)}" r="1" fill="#fff" opacity="0.85"/></g>`;
  }
  return `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" fill="none" stroke="#141414" stroke-width="1.3"/>${bulbs}`;
}

/** A window with green wooden shutters (cửa chớp), lit or dark */
function shutterWindow(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ h, /** @type {boolean} */ lit, /** @type {boolean} */ open) {
  const glass = lit ? '#ffcf73' : '#2a2a3a';
  const slats = (/** @type {number} */ sx) => {
    let s = '';
    for (let k = y + 4; k < y + h - 2; k += 4) s += `<line x1="${sx + 1.5}" y1="${k}" x2="${sx + w / 2 - 1.5}" y2="${k}"/>`;
    return s;
  };
  const panes = open
    ? `<rect x="${x - w / 2 + 2}" y="${y}" width="${w / 2 - 2}" height="${h}" fill="#2f6b4f"/><rect x="${x + w}" y="${y}" width="${w / 2 - 2}" height="${h}" fill="#2f6b4f"/><g stroke="#24543d" stroke-width="1">${slats(x - w / 2 + 2)}${slats(x + w)}</g>`
    : `<rect x="${x}" y="${y}" width="${w / 2}" height="${h}" fill="#2f6b4f"/><rect x="${x + w / 2}" y="${y}" width="${w / 2}" height="${h}" fill="#2f6b4f"/><g stroke="#24543d" stroke-width="1">${slats(x)}${slats(x + w / 2)}</g><line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#1d3f2e" stroke-width="1"/>`;
  return `<g><rect x="${x - 3}" y="${y - 4}" width="${w + 6}" height="${h + 7}" fill="#00000030"/><rect class="${lit ? 'win' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" fill="${glass}"/>${lit && open ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#roomGlow)"/>` : ''}${panes}<rect x="${x - 4}" y="${y + h}" width="${w + 8}" height="3" fill="#00000040"/></g>`;
}

/** Iron balcony railing with flower pots */
function balcony(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ seed) {
  const r = seeded(seed);
  let bars = '';
  for (let k = x + 3; k < x + w; k += 5) bars += `<line x1="${k}" y1="${y - 14}" x2="${k}" y2="${y}"/>`;
  let pots = '';
  for (let k = x + 6; k < x + w - 6; k += 14 + r() * 8) {
    if (r() < 0.35) continue;
    pots += `<g><rect x="${k - 3}" y="${y - 20}" width="6" height="5" fill="#b5532e"/><circle cx="${k}" cy="${y - 23}" r="${4 + r() * 2}" fill="${r() < 0.5 ? '#3e8e41' : '#2f7a3a'}"/>${r() < 0.4 ? `<circle cx="${k + 1}" cy="${y - 25}" r="1.4" fill="#ff6b8b"/>` : ''}</g>`;
  }
  return `<g><rect x="${x - 2}" y="${y}" width="${w + 4}" height="4" fill="#5a4636"/>${pots}<g stroke="#2c2c2c" stroke-width="1.1">${bars}</g><rect x="${x}" y="${y - 16}" width="${w}" height="2" fill="#2c2c2c"/></g>`;
}

/** Gạch tàu: square terracotta tiles in perspective */
function sidewalk() {
  const vx = W / 2;
  const vy = 250;
  let lines = '';
  for (let k = 1; k < 13; k++) {
    const y = WALK + Math.pow(k / 12, 1.6) * (CURB - WALK);
    lines += `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}"/>`;
  }
  for (let i = -14; i <= 14; i++) {
    const bx = vx + i * 40;
    const tx = vx + (bx - vx) * ((WALK - vy) / (CURB - vy));
    lines += `<line x1="${tx.toFixed(1)}" y1="${WALK}" x2="${bx.toFixed(1)}" y2="${CURB}"/>`;
  }
  const r = seeded(91);
  let stains = '';
  for (let i = 0; i < 14; i++) stains += `<ellipse cx="${(r() * W).toFixed(1)}" cy="${(WALK + 20 + r() * (CURB - WALK - 30)).toFixed(1)}" rx="${(6 + r() * 16).toFixed(1)}" ry="${(2 + r() * 4).toFixed(1)}" fill="#00000022"/>`;
  return `<rect x="0" y="${WALK}" width="${W}" height="${CURB - WALK}" fill="url(#tiles)"/>
  <g stroke="#3a1c12" stroke-width="1" opacity="0.6">${lines}</g>${stains}
  <ellipse cx="${W / 2}" cy="${WALK + 60}" rx="250" ry="95" fill="url(#warmPool)"/>
  <ellipse cx="${W / 2}" cy="${CURB - 80}" rx="240" ry="110" fill="url(#warmPool)" opacity="0.55"/>
  <g opacity="0.6"><path d="M60 640 l7 -2 l2 4 l-6 2 Z" fill="#e9e2cf"/><path d="M330 600 l6 -1 l1 4 l-6 1 Z" fill="#e9e2cf"/><circle cx="210" cy="660" r="2" fill="#b9782f"/><circle cx="140" cy="560" r="1.6" fill="#b9782f"/><circle cx="352" cy="650" r="1.8" fill="#b9782f"/></g>
  <!-- curb and road -->
  <rect x="0" y="${CURB}" width="${W}" height="${ROAD - CURB}" fill="#8d8a86"/><rect x="0" y="${CURB}" width="${W}" height="3" fill="#b9b5ae"/>
  <rect x="0" y="${ROAD}" width="${W}" height="${H - ROAD}" fill="#1f1f26"/>
  <g fill="#e8e3d3" opacity="0.65">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${i * 70 + 8}" y="${ROAD + 34}" width="36" height="3" rx="1"/>`).join('')}</g>
  <ellipse cx="${W / 2}" cy="${ROAD + 8}" rx="220" ry="16" fill="#ffb04a" opacity="0.08"/>`;
}

/** Concrete power pole with a tangle of cables (dây điện chằng chịt) */
function powerPole(/** @type {number} */ x) {
  return `<g>
    <rect x="${x - 5}" y="18" width="10" height="${WALK - 12}" fill="#9b968c"/><rect x="${x - 5}" y="18" width="3" height="${WALK - 12}" fill="#b7b2a6"/>
    <rect x="${x - 14}" y="70" width="28" height="18" rx="2" fill="#4c5a5e"/><rect x="${x - 12}" y="72" width="24" height="4" fill="#6c7c80"/>
    <g fill="none" stroke="#111" stroke-width="1.2">
      <path d="M${x} 40 Q${x + 40} 70 ${x + 120} 54"/><path d="M${x} 44 Q${x + 60} 90 ${x + 200} 70"/><path d="M${x} 48 Q${x + 80} 110 ${x + 300} 82"/><path d="M${x} 52 Q${x + 90} 128 ${W + 10} 100"/>
      <path d="M${x} 56 Q${x + 30} 90 ${x + 70} 120"/><path d="M${x} 60 Q${x - 6} 100 ${x - 20} 140"/>
      <ellipse cx="${x + 2}" cy="96" rx="16" ry="9"/><ellipse cx="${x - 2}" cy="102" rx="12" ry="7"/><ellipse cx="${x + 4}" cy="108" rx="18" ry="10"/><path d="M${x - 16} 100 q16 18 34 -2"/>
    </g>
  </g>`;
}

/** Cây sấu: trunk with whitewashed base, round canopy */
function tree(/** @type {number} */ x) {
  const r = seeded(5);
  let leaves = '';
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 70;
    leaves += `<circle cx="${(x + Math.cos(a) * d).toFixed(1)}" cy="${(70 + Math.sin(a) * d * 0.7).toFixed(1)}" r="${(16 + r() * 18).toFixed(1)}" fill="${['#1f4d2b', '#24592f', '#2b6636', '#1a4226'][i % 4]}"/>`;
  }
  return `<g><path d="M${x - 7} ${WALK + 50} L${x - 5} 120 Q${x} 100 ${x + 6} 120 L${x + 8} ${WALK + 50} Z" fill="#4a3426"/><rect x="${x - 8}" y="${WALK - 20}" width="16" height="70" fill="#e9e4d8"/><ellipse cx="${x}" cy="${WALK + 50}" rx="22" ry="5" fill="#00000040"/>${leaves}<g fill="#ffd36b" opacity="0.35">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${x - 50 + i * 24}" cy="${100 + (i % 2) * 18}" r="2"/>`).join('')}</g></g>`;
}

export function backSVG() {
  const r = seeded(31);
  // lit or dark upper windows, a few open
  const win = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ h) => shutterWindow(x, y, w, h, r() < 0.7, r() < 0.45);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="scene-svg" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090d26"/><stop offset="1" stop-color="#22193f"/></linearGradient>
    <linearGradient id="tiles" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d3b26"/><stop offset="1" stop-color="#a24e31"/></linearGradient>
    <linearGradient id="shopIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd48a"/><stop offset="1" stop-color="#c47a35"/></linearGradient>
    <linearGradient id="tarp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2672b"/><stop offset="1" stop-color="#b8461c"/></linearGradient>
    <radialGradient id="warmPool"><stop offset="0" stop-color="#ffb04a" stop-opacity="0.35"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>
    <radialGradient id="bulbGlow"><stop offset="0" stop-color="#ffd36b" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
    <radialGradient id="roomGlow" cx="0.5" cy="0.3"><stop offset="0" stop-color="#fff2c4" stop-opacity="0.8"/><stop offset="1" stop-color="#ff9d3b" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="356" cy="26" r="12" fill="#fff6d6" opacity="0.9"/><circle cx="356" cy="26" r="26" fill="#fff6d6" opacity="0.08"/>
  <!-- far rooftops -->
  <path d="M0 52 L30 40 L60 52 V120 H0 Z M150 30 h60 v90 h-60 Z M250 44 l20 -14 l20 14 V120 H250 Z" fill="#141233"/>

  <!-- left house: mustard yellow, tiled roof -->
  <rect x="-10" y="44" width="134" height="${WALK - 44}" fill="#c99a3f"/>
  <path d="M-14 46 L60 26 L128 46 Z" fill="#7d2f22"/><path d="M-14 46 H128 V52 H-14 Z" fill="#5c2219"/>
  ${win(18, 70, 36, 42)}${win(72, 70, 36, 42)}
  ${balcony(6, 168, 110, 3)}${win(22, 178, 30, 52)}${win(70, 178, 30, 52)}
  <rect x="-10" y="300" width="134" height="${WALK - 300}" fill="#a37a2e"/>
  <rect x="4" y="318" width="108" height="${WALK - 318}" fill="#6e6e72"/>${[...Array(18)].map((_, i) => `<line x1="4" y1="${322 + i * 5}" x2="112" y2="${322 + i * 5}" stroke="#58585c" stroke-width="1.4"/>`).join('')}
  <rect x="10" y="300" width="96" height="16" rx="2" fill="#1d5fa8"/><text x="58" y="312" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" font-family="Be Vietnam Pro, sans-serif">TẠP HÓA</text>

  <!-- the quán's house: old cream-yellow, three floors -->
  <rect x="122" y="20" width="190" height="${WALK - 20}" fill="#e2c271"/>
  <rect x="122" y="20" width="190" height="6" fill="#b8963f"/>
  ${win(142, 40, 40, 50)}${win(196, 40, 40, 50)}${win(250, 40, 40, 50)}
  ${balcony(130, 150, 174, 11)}${win(150, 158, 34, 46)}${win(200, 158, 34, 46)}${win(250, 158, 34, 46)}
  <!-- ground floor: open shopfront, warm light inside -->
  <rect x="128" y="250" width="178" height="${WALK - 250}" fill="url(#shopIn)"/>
  <rect x="128" y="250" width="178" height="${WALK - 250}" fill="url(#roomGlow)"/>
  <rect x="160" y="258" width="58" height="3" fill="#f8fbff"/><rect x="160" y="258" width="58" height="3" fill="#ffffff" opacity="0.6" class="tube"/>
  <!-- shelves with bottles, crates, a calendar and the little altar (bàn thờ ông Địa) -->
  <g transform="translate(236 268)"><rect width="62" height="4" fill="#6b4226"/><rect y="22" width="62" height="4" fill="#6b4226"/>${[...Array(9)].map((_, i) => `<rect x="${3 + i * 6.6}" y="${-12 + (i % 2)}" width="4" height="12" rx="1.4" fill="${['#2f7d3a', '#7a4416', '#2f7d3a', '#c9a227'][i % 4]}"/><rect x="${3 + i * 6.6}" y="${10 + (i % 3)}" width="4" height="12" rx="1.4" fill="${['#7a4416', '#2f7d3a', '#d9472b'][i % 3]}"/>`).join('')}</g>
  <g transform="translate(138 262)"><rect width="34" height="24" rx="2" fill="#a3161c"/><rect x="3" y="3" width="28" height="16" fill="#d62828"/><text x="17" y="15" text-anchor="middle" font-size="7" font-weight="900" fill="#ffd166" font-family="Be Vietnam Pro, sans-serif">TÀI LỘC</text><circle cx="6" cy="22" r="1.4" fill="#ffd166"/><circle cx="28" cy="22" r="1.4" fill="#ffd166"/><rect x="10" y="24" width="14" height="5" fill="#7a1010"/></g>
  <g transform="translate(184 266)"><rect width="22" height="28" fill="#fff8e8"/><rect width="22" height="8" fill="#d62828"/><text x="11" y="23" text-anchor="middle" font-size="12" font-weight="900" fill="#d62828" font-family="Be Vietnam Pro, sans-serif">7</text></g>
  <g transform="translate(240 318)">${[0, 1].map((row) => [0, 1, 2].map((c) => `<rect x="${c * 21}" y="${-row * 13}" width="20" height="12" rx="1" fill="#d9a520" stroke="#00000044"/>`).join('')).join('')}</g>
  <!-- orange tarp awning over the shopfront -->
  <path d="M116 236 L318 236 L330 268 L104 268 Z" fill="url(#tarp)"/>
  <path d="M104 268 ${[...Array(15)].map((_, i) => `q${7.5} 8 15 0`).join(' ')}" fill="#b8461c"/>
  <g stroke="#7a2e10" stroke-width="1" opacity="0.6">${[...Array(9)].map((_, i) => `<line x1="${128 + i * 22}" y1="236" x2="${120 + i * 24}" y2="268"/>`).join('')}</g>
  <rect x="122" y="268" width="5" height="${WALK - 268}" fill="#5a4a3a"/><rect x="306" y="268" width="5" height="${WALK - 268}" fill="#5a4a3a"/>

  <!-- right house: faded blue -->
  <rect x="312" y="36" width="130" height="${WALK - 36}" fill="#7f9fb8"/>
  <rect x="312" y="36" width="130" height="6" fill="#5c7a92"/>
  ${win(330, 60, 34, 46)}${win(378, 60, 34, 46)}
  ${balcony(318, 160, 112, 21)}${win(334, 170, 30, 50)}${win(380, 170, 30, 50)}
  <rect x="312" y="300" width="130" height="${WALK - 300}" fill="#5f7d94"/>
  <rect x="322" y="316" width="96" height="${WALK - 316}" fill="#2b2b33"/><rect x="326" y="320" width="88" height="${WALK - 326}" fill="#ffcf73" opacity="0.18"/>
  <g transform="translate(330 300)"><rect width="72" height="14" rx="2" fill="#ffd166"/><text x="36" y="10.6" text-anchor="middle" font-size="8.5" font-weight="900" fill="#7a1010" font-family="Be Vietnam Pro, sans-serif">CƠM BÌNH DÂN</text></g>

  ${powerPole(12)}
  <!-- bulbs strung across the street and over the sidewalk -->
  ${stringLights(-6, 128, 436, 140, 18, 14, 2)}
  ${stringLights(104, 272, 330, 272, 8, 9, 3)}
  ${stringLights(-6, WALK + 8, 436, WALK + 12, 16, 12, 4)}
  ${sidewalk()}
  ${tree(414)}
  <!-- parked motorbike at the curb -->
  <g transform="translate(26 ${CURB + 8})" opacity="0.95"><circle cx="0" cy="22" r="9" fill="#141414"/><circle cx="0" cy="22" r="4" fill="#555"/><circle cx="38" cy="22" r="9" fill="#141414"/><circle cx="38" cy="22" r="4" fill="#555"/><path d="M-4 14 H30 L40 4 H44 L36 18 H-6 Z" fill="#c0392b"/><path d="M6 6 H26 L24 12 H8 Z" fill="#2a2a2a"/><path d="M40 4 L44 -8 L48 -8" fill="none" stroke="#999" stroke-width="2"/></g>
</svg>`;
}

/** The outdoor kitchen cart in front of the shop: charcoal stove and wok, stock pot, grill, ice box */
export function kitchenSVG() {
  const coals = [...Array(10)].map((_, i) => `<circle cx="${246 + (i % 5) * 7}" cy="${370 + Math.floor(i / 5) * 4}" r="3" fill="${i % 3 ? '#ff6a1f' : '#ffb347'}" class="coal" style="animation-delay:-${(i * 0.37).toFixed(2)}s"/>`).join('');
  const skewers = [0, 1, 2, 3].map((i) => `<g transform="translate(${248 + i * 8} 362)"><line x1="0" y1="-2" x2="0" y2="12" stroke="#d9c49a" stroke-width="1"/><rect x="-2.4" y="0" width="4.8" height="8" rx="2" fill="${i % 2 ? '#8b3a1e' : '#b5582c'}"/></g>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="scene-svg kitchen-svg" aria-hidden="true">
  <defs><linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8edf2"/><stop offset="1" stop-color="#9aa4ae"/></linearGradient>
  <radialGradient id="fire"><stop offset="0" stop-color="#fff1a8"/><stop offset="0.5" stop-color="#ff8a1f"/><stop offset="1" stop-color="#ff3b0f" stop-opacity="0"/></radialGradient></defs>
  <!-- crates of empty bottles beside the cart -->
  <g transform="translate(112 380)">${[0, 1, 2].map((row) => `<rect x="${(row % 2) * 3}" y="${18 - row * 13}" width="28" height="12" rx="1" fill="#d9a520" stroke="#00000055"/>`).join('')}</g>
  <!-- cart -->
  <rect x="140" y="378" width="152" height="9" rx="2" fill="url(#steel)"/>
  <rect x="144" y="387" width="144" height="31" fill="#8c96a0"/><rect x="148" y="391" width="136" height="2" fill="#6d7680"/>
  <g fill="#f6f2e8"><ellipse cx="166" cy="404" rx="10" ry="3"/><ellipse cx="166" cy="401" rx="10" ry="3"/><ellipse cx="190" cy="404" rx="8" ry="2.6"/></g>
  <g fill="#3a3f46"><rect x="146" y="416" width="4" height="8"/><rect x="282" y="416" width="4" height="8"/></g>
  <!-- charcoal stove (bếp than tổ ong) and wok -->
  <g class="stove"><rect x="154" y="356" width="30" height="24" rx="3" fill="#a9643a"/><rect x="154" y="356" width="30" height="5" fill="#8a4e2c"/>${[0, 1, 2].map((i) => `<circle cx="${161 + i * 8}" cy="368" r="2" fill="#ff7a1f" class="coal"/>`).join('')}
    <ellipse class="flame f1" cx="169" cy="352" rx="13" ry="7" fill="url(#fire)"/>
    <g class="wok"><path d="M150 346 Q169 362 188 346 Z" fill="#26292e"/><ellipse cx="169" cy="346" rx="19" ry="4" fill="#3a3f46"/><g class="wok-food"><circle cx="164" cy="345" r="2.6" fill="#e9a23b"/><circle cx="170" cy="344" r="2.2" fill="#6aa84f"/><circle cx="175" cy="345.6" r="2.4" fill="#d9472b"/></g><path d="M188 346 L204 340" stroke="#26292e" stroke-width="3" stroke-linecap="round"/></g>
  </g>
  <!-- stock pot with steam, on its own little stove beside the cart -->
  <g transform="translate(110 30)"><rect x="196" y="372" width="30" height="16" rx="2" fill="#3a3f46"/><circle cx="204" cy="380" r="2" fill="#ff7a1f" class="coal"/><circle cx="218" cy="380" r="2" fill="#ff7a1f" class="coal"/>
    <rect x="194" y="346" width="34" height="27" rx="3" fill="url(#steel)"/><ellipse cx="211" cy="346" rx="17" ry="4" fill="#c9d1db"/><ellipse cx="211" cy="346" rx="14" ry="3" fill="#b5582c"/><rect x="190" y="352" width="5" height="3" fill="#8a929c"/><rect x="227" y="352" width="5" height="3" fill="#8a929c"/>
    <path class="steam s1" d="M204 340 c-3 -6 3 -8 0 -15" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/><path class="steam s2" d="M216 340 c-3 -6 3 -8 0 -15" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/></g>
  <g><rect x="198" y="372" width="34" height="7" rx="1.5" fill="#c9905a"/><g fill="#5fae3f"><circle cx="205" cy="371" r="2"/><circle cx="210" cy="372" r="1.8"/><circle cx="214" cy="370.6" r="1.6"/></g><path d="M220 371 L231 368" stroke="#c9d1db" stroke-width="2"/></g>
  <!-- grill (vỉ nướng) on glowing coals -->
  <g><rect x="240" y="366" width="42" height="13" rx="2" fill="#3a3f46"/>${coals}<g stroke="#b9c0c8" stroke-width="0.8">${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${242 + i * 7.6}" y1="362" x2="${242 + i * 7.6}" y2="368"/>`).join('')}<line x1="240" y1="366" x2="282" y2="366"/></g>${skewers}
    <ellipse class="flame f2" cx="261" cy="364" rx="18" ry="6" fill="url(#fire)" opacity="0.7"/></g>
  <!-- styrofoam ice box with bottles -->
  <g transform="translate(346 384)"><rect width="38" height="34" rx="2" fill="#f4f6f8" stroke="#c9d1db"/><rect y="0" width="38" height="6" fill="#e3e8ee"/>${[0, 1, 2, 3].map((i) => `<rect x="${5 + i * 8}" y="-12" width="5" height="14" rx="2" fill="${i % 2 ? '#2f7d3a' : '#7a4416'}"/>`).join('')}<g fill="#cfe9ff" opacity="0.8"><rect x="3" y="2" width="6" height="4" rx="1"/><rect x="26" y="1" width="7" height="4" rx="1"/></g></g>
</svg>`;
}

/** @deprecated the indoor counter of the first version; the quán is on the sidewalk now */
export const counterSVG = kitchenSVG;
