// @ts-check
// Người, bàn ghế và món ăn của "Nhậu Đêm 134", vẽ bằng SVG theo tỉ lệ người thật (không chibi): đầu nhỏ cỡ 1/6
// thân, mặt có mắt, mày, mũi, miệng, tai; áo quần có bóng đổ từ đèn trên cao. Mỗi khách có "dáng" (look) riêng
// lấy từ id nên cùng một người lúc nào cũng mặc y như cũ.
// Các bộ phận cử động (tay cụng ly, chân bước, miệng nói) có class riêng; stage.css làm chuyển động.

import { seeded } from './scene.js';

/** @typedef {{ gender: 'm' | 'f'; skin: string; skinDark: string; hair: string; hairStyle: string; top: string; topStyle: string; bottom: string; bottomStyle: string; shoes: string; cap: string; glasses: boolean; stool: string; mouth: number }} Look */

const SKINS = [
  ['#f2cba8', '#d9a27c'],
  ['#ebbd97', '#cf946c'],
  ['#e0ad85', '#c2865d'],
  ['#d39c72', '#b2774f'],
  ['#c58a60', '#a2673f'],
];
const HAIRS = ['#120d0a', '#1c140e', '#2a1c12', '#3b281a', '#4e3321', '#16161a'];
const TOPS = ['#f4f1ea', '#1e1f24', '#22304f', '#7d8187', '#7b2430', '#4f5a33', '#c9962e', '#8fb4d9', '#b8432f', '#2f6b5a', '#5a3f6e', '#d8cfc0'];
const BOTTOMS_M = [
  ['jeans', '#34507a'],
  ['black', '#26262a'],
  ['khaki', '#9c8762'],
  ['shorts', '#4a5560'],
  ['shorts', '#6b604c'],
  ['shorts', '#2f3a4f'],
];
const BOTTOMS_F = [
  ['jeans', '#3d5c8a'],
  ['black', '#232327'],
  ['shorts', '#c9b79a'],
  ['skirt', '#2c2c34'],
  ['jeans', '#5b7fa8'],
];
const STOOLS = ['#1f5fb4', '#c62828', '#1f5fb4', '#e0a100'];

/** Stable little number from a string */
export function hash(/** @type {string} */ s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

/** The look of a person from their id: same viewer, same clothes */
export function lookOf(/** @type {string} */ id, /** @type {'m' | 'f' | ''} */ want = '') {
  const r = seeded(hash(id) + 7);
  const p = (/** @type {any[]} */ l) => l[Math.floor(r() * l.length)];
  const gender = want || (r() < 0.62 ? 'm' : 'f');
  const [skin, skinDark] = p(SKINS);
  const [bottomStyle, bottom] = p(gender === 'm' ? BOTTOMS_M : BOTTOMS_F);
  const style = gender === 'm' ? p(['short', 'short', 'buzz', 'undercut', 'side']) : p(['long', 'long', 'ponytail', 'bob', 'bun']);
  return {
    gender,
    skin,
    skinDark,
    hair: style === 'bob' && r() < 0.4 ? '#5a3524' : p(HAIRS),
    hairStyle: style,
    top: p(TOPS),
    topStyle: gender === 'm' ? p(['tee', 'tee', 'polo', 'plaid', 'tank', 'stripe']) : p(['tee', 'tee', 'blouse', 'stripe', 'tank']),
    bottom,
    bottomStyle,
    shoes: p(['sandal', 'sandal', 'sneaker', 'shoe']),
    cap: gender === 'm' && r() < 0.18 ? p(['#1d1d1f', '#8b1d1d', '#e9e4d8']) : '',
    glasses: r() < 0.2,
    stool: p(STOOLS),
    mouth: Math.floor(r() * 3),
  };
}

/** Shared gradients, put once in the page (url(#id) works across inline SVGs) */
export function peopleDefs() {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="pShadeV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.38"/></linearGradient>
    <linearGradient id="pShadeH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.25"/><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="0.7" stop-color="#000" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.4"/></linearGradient>
    <radialGradient id="pFace" cx="0.42" cy="0.35" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="0.18"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></radialGradient>
    <linearGradient id="pHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/></linearGradient>
    <linearGradient id="pBeer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a1"/><stop offset="1" stop-color="#e8a52c"/></linearGradient>
    <linearGradient id="pSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f6f9"/><stop offset="0.5" stop-color="#b9c1ca"/><stop offset="1" stop-color="#7c8590"/></linearGradient>
    <linearGradient id="pPlastic" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>
    <radialGradient id="pShadow"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs></svg>`;
}

// ------------------------------------------------------------------------------------------------ head

/** Hair drawn behind the head (long hair falls over the shoulders) */
function hairBack(/** @type {Look} */ L) {
  if (L.hairStyle === 'long') return `<path d="M22.6 10 Q20.6 21 22 28 L38 28 Q39.4 21 37.4 10 Q37 2.4 30 2.3 Q23 2.4 22.6 10 Z" fill="${L.hair}"/><path d="M22.6 10 Q20.6 21 22 28 L38 28 Q39.4 21 37.4 10 Z" fill="url(#pHair)"/>`;
  if (L.hairStyle === 'bob') return `<path d="M22.6 11 Q22.2 2.5 30 2.4 Q37.8 2.5 37.4 11 L37.6 18 Q34 19 33 15 L27 15 Q26 19 22.4 18 Z" fill="${L.hair}"/>`;
  if (L.hairStyle === 'ponytail') return `<path d="M35 6 Q41 8 40 17 Q39 22 37 24 Q38 16 34 9 Z" fill="${L.hair}"/>`;
  return '';
}
/** Hair on top of the face */
function hairFront(/** @type {Look} */ L) {
  const h = L.hair;
  /** @type {Record<string, string>} */
  const shapes = {
    short: 'M23.4 10.4 Q22.8 2.8 30 2.5 Q37.2 2.8 36.6 10.4 Q36 6.6 33.2 6 Q30 7.6 26.2 6.2 Q24.2 7 23.4 10.4 Z',
    side: 'M23.4 10.6 Q22.6 2.6 30.4 2.4 Q37.4 2.8 36.6 10 Q35.6 6 32 5.4 Q27.6 5.2 25 7.6 Q24 8.6 23.4 10.6 Z',
    buzz: 'M24 8.8 Q24.4 3.2 30 3 Q35.6 3.2 36 8.8 Q33 5.6 30 5.7 Q27 5.6 24 8.8 Z',
    undercut: 'M24.2 8.4 Q23.4 1.2 30.2 0.9 Q37.2 1.3 36.2 8.2 Q34.4 4.4 30.6 4.8 Q27 4.4 24.2 8.4 Z',
    long: 'M23.5 11 Q23.3 2.9 30 2.7 Q36.7 2.9 36.5 11 Q35.4 6.2 31.6 5.7 Q27.2 6.4 23.5 11 Z',
    ponytail: 'M23.6 10.2 Q23.2 2.8 30 2.6 Q36.8 2.8 36.4 10.2 Q35 5.8 30.8 5.6 Q26.4 5.9 23.6 10.2 Z',
    bob: 'M23.2 11.5 Q23 2.9 30 2.8 Q37 2.9 36.8 11.5 Q35.6 6.6 32.6 6 Q30 7.8 27 6.2 Q24.4 7.2 23.2 11.5 Z',
    bun: 'M23.6 10.2 Q23.2 2.8 30 2.6 Q36.8 2.8 36.4 10.2 Q35 5.8 30.8 5.6 Q26.4 5.9 23.6 10.2 Z',
  };
  const d = shapes[L.hairStyle] ?? shapes.short;
  let out = `<path d="${d}" fill="${h}"/><path d="${d}" fill="url(#pHair)"/>`;
  if (L.hairStyle === 'bun') out = `<circle cx="30" cy="1.6" r="3.3" fill="${h}"/><circle cx="30" cy="1.6" r="3.3" fill="url(#pHair)"/>` + out;
  if (L.hairStyle === 'undercut' || L.hairStyle === 'buzz') out += `<path d="M23.7 9 Q23.6 11.5 24 13 M36.3 9 Q36.4 11.5 36 13" stroke="${h}" stroke-width="1" opacity="0.6" fill="none"/>`;
  // a soft shine on the hair from the bulbs above
  out += `<path d="M26 4.6 Q30 3.2 33.6 4.4" stroke="#fff" stroke-opacity="0.22" stroke-width="0.7" fill="none"/>`;
  if (L.cap) out += `<path d="M23 8.6 Q23.4 2.4 30 2.2 Q36.6 2.4 37 8.6 Z" fill="${L.cap}"/><path d="M23 8.6 Q23.4 2.4 30 2.2 Q36.6 2.4 37 8.6 Z" fill="url(#pHair)"/><path d="M22.2 8.6 Q30 6.8 37.8 8.6 Q38 10 36 9.8 Q30 8.6 24 9.8 Q22 10 22.2 8.6 Z" fill="${L.cap}"/><path d="M22.2 8.6 Q30 6.8 37.8 8.6" stroke="#000" stroke-opacity="0.3" stroke-width="0.4" fill="none"/>`;
  return out;
}
/**
 * A head drawn around (30, 11) in a 60-wide box; `turn` (-1..1) moves the face toward a side (3/4 view)
 * @param {Look} L
 */
function head(L, turn = 0) {
  const t = turn * 1.6;
  const eye = (/** @type {number} */ x) =>
    `<ellipse cx="${x}" cy="11.3" rx="1.15" ry="0.62" fill="#f6efe6"/><circle cx="${x + turn * 0.25}" cy="11.35" r="0.58" fill="#1a120d"/><path d="M${x - 1.3} 10.9 Q${x} 10.2 ${x + 1.3} 10.9" stroke="#1a120d" stroke-width="0.45" fill="none"/>`;
  const mouths = [
    `<path class="mouth" d="M${28.3 + t} 16.1 Q${30 + t} 17.1 ${31.7 + t} 16.1" stroke="#7a3b2e" stroke-width="0.6" fill="none" stroke-linecap="round"/>`,
    `<path class="mouth" d="M${28.6 + t} 16 Q${30 + t} 17.4 ${31.4 + t} 16 Z" fill="#7a2f28"/>`,
    `<path class="mouth" d="M${28.4 + t} 16.3 L${31.6 + t} 16.3" stroke="#7a3b2e" stroke-width="0.6" stroke-linecap="round"/>`,
  ];
  const ear = (/** @type {number} */ x) => `<ellipse cx="${x}" cy="12" rx="1.3" ry="2.1" fill="${L.skin}"/><ellipse cx="${x}" cy="12" rx="0.6" ry="1.2" fill="${L.skinDark}" opacity="0.6"/>`;
  return `<g class="head">
    ${hairBack(L)}
    <path d="M27.2 15.6 L32.8 15.6 L33 21.4 Q30 22.6 27 21.4 Z" fill="${L.skinDark}"/>
    ${turn <= 0.4 ? ear(23.9) : ''}${turn >= -0.4 ? ear(36.1) : ''}
    <path d="M23.9 10.2 Q24 17 30 19.3 Q36 17 36.1 10.2 Q36 3.6 30 3.4 Q24 3.6 23.9 10.2 Z" fill="${L.skin}"/>
    <path d="M23.9 10.2 Q24 17 30 19.3 Q36 17 36.1 10.2 Q36 3.6 30 3.4 Q24 3.6 23.9 10.2 Z" fill="url(#pFace)"/>
    <ellipse cx="${26.8 + t}" cy="14.2" rx="1.5" ry="0.9" fill="#e0786a" opacity="0.18"/><ellipse cx="${33.2 + t}" cy="14.2" rx="1.5" ry="0.9" fill="#e0786a" opacity="0.18"/>
    <path d="M${25.8 + t} 9.3 Q${27.4 + t} 8.5 ${28.9 + t} 9.2 M${31.1 + t} 9.2 Q${32.6 + t} 8.5 ${34.2 + t} 9.3" stroke="${L.hair}" stroke-width="0.75" fill="none" stroke-linecap="round"/>
    ${eye(27.5 + t)}${eye(32.5 + t)}
    <path d="M${30.1 + t * 1.3} 11.4 L${29.4 + t * 1.6} 14.1 Q${30.1 + t * 1.3} 14.6 ${30.9 + t * 1.3} 14.2" stroke="${L.skinDark}" stroke-width="0.55" fill="none" stroke-linecap="round"/>
    ${mouths[L.mouth % 3]}
    ${L.glasses ? `<g fill="none" stroke="#1b1b1b" stroke-width="0.45"><rect x="${25.8 + t}" y="10.1" width="3.5" height="2.5" rx="0.9"/><rect x="${30.7 + t}" y="10.1" width="3.5" height="2.5" rx="0.9"/><path d="M${29.3 + t} 11 L${30.7 + t} 11"/></g>` : ''}
    ${hairFront(L)}
  </g>`;
}

// ------------------------------------------------------------------------------------------------ clothes

/** Torso of a top (shirt shape given), with collar and pattern */
function torso(/** @type {Look} */ L, /** @type {string} */ d, /** @type {number} */ top, /** @type {number} */ bottom) {
  const c = L.top;
  let out = `<path d="${d}" fill="${c}"/>`;
  if (L.topStyle === 'plaid') {
    let lines = '';
    for (let x = 19; x <= 41; x += 4) lines += `<path d="M${x} ${top} V${bottom}"/>`;
    for (let y = top + 3; y < bottom; y += 5) lines += `<path d="M16 ${y} H44"/>`;
    out += `<g stroke="#000" stroke-opacity="0.28" stroke-width="1.3">${lines}</g><g stroke="#fff" stroke-opacity="0.12" stroke-width="0.5">${lines}</g>`;
    out = `<clipPath id="tc${c.slice(1)}${hash(d)}"><path d="${d}"/></clipPath><g clip-path="url(#tc${c.slice(1)}${hash(d)})">${out}</g>`;
  } else if (L.topStyle === 'stripe') {
    let lines = '';
    for (let y = top + 2; y < bottom; y += 3.2) lines += `<path d="M15 ${y} H45"/>`;
    out = `<clipPath id="ts${c.slice(1)}${hash(d)}"><path d="${d}"/></clipPath><g clip-path="url(#ts${c.slice(1)}${hash(d)})">${out}<g stroke="${c === '#f4f1ea' ? '#22304f' : '#f4f1ea'}" stroke-opacity="0.75" stroke-width="1.1">${lines}</g></g>`;
  }
  out += `<path d="${d}" fill="url(#pShadeV)"/><path d="${d}" fill="url(#pShadeH)"/>`;
  // necklines
  if (L.topStyle === 'polo' || L.topStyle === 'plaid') out += `<path d="M26.4 ${top - 0.4} L30 ${top + 3.4} L33.6 ${top - 0.4} L32.2 ${top - 1.2} L30 ${top + 1} L27.8 ${top - 1.2} Z" fill="${c}"/><path d="M26.4 ${top - 0.4} L30 ${top + 3.4} L33.6 ${top - 0.4}" stroke="#000" stroke-opacity="0.35" stroke-width="0.5" fill="none"/><path d="M30 ${top + 3.4} V${top + 9}" stroke="#000" stroke-opacity="0.25" stroke-width="0.5"/>`;
  else if (L.topStyle === 'tank') out += `<path d="M26.6 ${top - 0.6} Q30 ${top + 4.6} 33.4 ${top - 0.6} Z" fill="${L.skin}"/>`;
  else if (L.topStyle === 'blouse') out += `<path d="M26.4 ${top - 0.6} Q30 ${top + 4} 33.6 ${top - 0.6}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7" fill="${L.skin}"/>`;
  else out += `<path d="M27 ${top - 0.5} Q30 ${top + 2.2} 33 ${top - 0.5}" stroke="#000" stroke-opacity="0.3" stroke-width="0.7" fill="${L.skin}"/>`;
  return out;
}
const sleeveLong = (/** @type {Look} */ L) => L.topStyle === 'plaid';
const bare = (/** @type {Look} */ L) => L.topStyle === 'tank';

/** An arm from the shoulder (sx, sy) via the elbow (ex, ey) to the hand (hx, hy) */
/** @param {Look} L @param {number} sx @param {number} sy @param {number} ex @param {number} ey @param {number} hx @param {number} hy */
function arm(L, sx, sy, ex, ey, hx, hy, w = 4.6) {
  const sleeveTo = bare(L) ? 0 : sleeveLong(L) ? 1 : 0.42;
  const seg = (/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2, /** @type {string} */ fill, /** @type {number} */ width) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${fill}" stroke-width="${width}" stroke-linecap="round"/>`;
  let out = seg(sx, sy, ex, ey, L.skin, w) + seg(ex, ey, hx, hy, L.skin, w * 0.86);
  if (sleeveTo > 0) {
    const mx = sx + (ex - sx) * (sleeveTo >= 1 ? 1 : sleeveTo * 2);
    const my = sy + (ey - sy) * (sleeveTo >= 1 ? 1 : sleeveTo * 2);
    out += seg(sx, sy, mx, my, L.top, w + 1.4);
    if (sleeveTo >= 1) out += seg(ex, ey, ex + (hx - ex) * 0.85, ey + (hy - ey) * 0.85, L.top, w * 0.86 + 1);
  }
  out += `<path d="M${sx} ${sy} L${ex} ${ey} L${hx} ${hy}" stroke="#000" stroke-opacity="0.14" stroke-width="${w * 0.5}" stroke-linecap="round" fill="none" transform="translate(0.8 0.4)"/>`;
  out += `<ellipse cx="${hx}" cy="${hy}" rx="${w * 0.48}" ry="${w * 0.55}" fill="${L.skin}"/>`;
  return out;
}

/** A glass of bia hơi (or trà đá), drawn at (x, y) = bottom centre */
const glass = (/** @type {number} */ x, /** @type {number} */ y, s = 1, tea = false) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-2.3 -7 L2.3 -7 L1.9 0 L-1.9 0 Z" fill="${tea ? '#b5651d' : 'url(#pBeer)'}" opacity="0.92"/><path d="M-2.5 -7.6 L2.5 -7.6 L2.3 -6.2 L-2.3 -6.2 Z" fill="${tea ? '#e9e2d6' : '#fffaf0'}"/><path d="M-1.4 -6 L-1.1 -0.8" stroke="#fff" stroke-opacity="0.55" stroke-width="0.5"/><path d="M-2.5 -7.6 L-1.9 0 L1.9 0 L2.5 -7.6" stroke="#fff" stroke-opacity="0.5" stroke-width="0.3" fill="none"/></g>`;

/** Low plastic stool (ghế nhựa đỏ / xanh), seat at y */
const stool = (/** @type {string} */ color, /** @type {number} */ cx, /** @type {number} */ y, h = 22) => {
  const d = `M${cx - 10} ${y} L${cx + 10} ${y} L${cx + 11.6} ${y + h} L${cx + 8.4} ${y + h} L${cx + 6.4} ${y + h * 0.3} L${cx - 6.4} ${y + h * 0.3} L${cx - 8.4} ${y + h} L${cx - 11.6} ${y + h} Z`;
  return `<g><path d="${d}" fill="${color}"/><path d="${d}" fill="url(#pPlastic)"/><ellipse cx="${cx}" cy="${y}" rx="10.4" ry="2.2" fill="${color}"/><ellipse cx="${cx}" cy="${y - 0.3}" rx="8.2" ry="1.3" fill="#fff" opacity="0.2"/></g>`;
};

/** Lower legs + shoes; (x, y) knee, foot at fy */
function shin(/** @type {Look} */ L, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ fx, /** @type {number} */ fy, w = 5.6, dir = 0) {
  const bareShin = L.bottomStyle === 'shorts' || L.bottomStyle === 'skirt';
  let out = `<path d="M${x} ${y} L${fx} ${fy}" stroke="${bareShin ? L.skin : L.bottom}" stroke-width="${w}" stroke-linecap="round"/>`;
  out += `<path d="M${x + w * 0.25} ${y} L${fx + w * 0.25} ${fy}" stroke="#000" stroke-opacity="0.18" stroke-width="${w * 0.45}" stroke-linecap="round"/>`;
  const shoe = L.shoes === 'sneaker' ? '#ecebe6' : L.shoes === 'shoe' ? '#262626' : L.skin;
  out += `<ellipse cx="${fx + dir * 1.6}" cy="${fy + 1.6}" rx="${w * 0.78 + Math.abs(dir) * 1.2}" ry="${w * 0.36}" fill="${shoe}"/>`;
  if (L.shoes === 'sandal') out += `<ellipse cx="${fx + dir * 1.6}" cy="${fy + 2.3}" rx="${w * 0.85 + Math.abs(dir) * 1.2}" ry="${w * 0.24}" fill="#3a6fc4"/><path d="M${fx - w * 0.5} ${fy + 1.2} Q${fx} ${fy - 0.2} ${fx + w * 0.5} ${fy + 1.2}" stroke="#e8eef8" stroke-width="1" fill="none"/>`;
  if (L.shoes === 'sneaker') out += `<path d="M${fx - w * 0.6} ${fy + 2.3} H${fx + w * 0.6}" stroke="#bdb9ae" stroke-width="0.7"/>`;
  return out;
}

// ------------------------------------------------------------------------------------------------ seated people

/**
 * A customer on a low plastic stool (ghế đẩu nhựa), the bia hơi way: knees up, elbows on the knees, glass in hand.
 * 60 x 92 box, stool feet at the bottom. pose 'front' faces the camera (seat behind the table); 'side' sits at the
 * end of a table turned toward it (facing right; the stage mirrors it for the other end). The glass hand is in
 * .arm-cheer for "dzô".
 * @param {Look} L @param {'front' | 'side'} pose
 */
export function seatedSVG(L, pose = 'front') {
  const bareLegs = L.bottomStyle === 'shorts' || L.bottomStyle === 'skirt';
  const knee = (/** @type {number} */ x, /** @type {number} */ y, rx = 5.4, ry = 4.4) =>
    bareLegs ? `<ellipse cx="${x}" cy="${y + 0.6}" rx="${rx * 0.78}" ry="${ry * 0.8}" fill="${L.skin}"/><ellipse cx="${x}" cy="${y + 0.6}" rx="${rx * 0.78}" ry="${ry * 0.8}" fill="url(#pFace)"/>` : `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${L.bottom}"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#pShadeV)"/>`;
  const head112 = (/** @type {number} */ turn, dx = 0) => `<g transform="translate(${-3.6 + dx} -1.2) scale(1.12)">${head(L, turn)}</g>`;
  if (pose === 'side') {
    const hem = bareLegs ? `<path d="M22 63 L33 57.6 L35.6 63.4 L26 70 Z" fill="${L.bottom}"/>` : '';
    return `<svg viewBox="0 0 60 92" class="person seated side" aria-hidden="true">
      <ellipse cx="34" cy="90" rx="21" ry="2.4" fill="url(#pShadow)"/>
      ${stool(L.stool, 24, 70)}
      <g>${shin(L, 40.6, 56, 41.2, 87.6, 5, 1)}<path d="M24 61 L39 52 Q43 51.4 43.6 55.6 L40 58.4 L27 66 Z" fill="${bareLegs ? L.skin : L.bottom}"/><path d="M24 61 L39 52 Q43 51.4 43.6 55.6 L40 58.4 L27 66 Z" fill="#000" opacity="0.28"/></g>
      <g class="body">
        ${torso(L, 'M18.6 26.6 Q19.2 23 24 22.6 L36 22.6 Q40.6 23 41 26.6 L39.6 66 Q29 68 19.6 66 Z', 22.8, 66)}
        <g class="arm-back">${arm(L, 21, 26.4, 24.6, 45, 40, 51.6, 4.4)}</g>
      </g>
      ${shin(L, 45.2, 58, 46, 88.4, 5.6, 1)}
      <path d="M21 62.6 L42 52.8 Q47.6 52 48 57.4 L45.4 61.4 L25.6 70.4 Z" fill="${bareLegs ? L.skin : L.bottom}"/><path d="M21 62.6 L42 52.8 Q47.6 52 48 57.4 L45.4 61.4 L25.6 70.4 Z" fill="url(#pShadeV)"/>${hem}
      <g class="body">
        ${head112(0.75, 1)}
        <g class="arm-cheer" style="transform-origin:38px 26px">${arm(L, 38, 26, 43.6, 49, 49.6, 42.4, 4.6)}${glass(50.6, 45.6, 1.15)}</g>
      </g>
    </svg>`;
  }
  return `<svg viewBox="0 0 60 92" class="person seated front" aria-hidden="true">
    <ellipse cx="30" cy="90" rx="18" ry="2.4" fill="url(#pShadow)"/>
    ${stool(L.stool, 30, 70)}
    <g class="body">
      ${torso(L, 'M16 26.6 Q16.4 23 22 22.6 L38 22.6 Q43.6 23 44 26.6 L42.6 66 Q30 68.6 17.4 66 Z', 22.8, 66)}
    </g>
    ${shin(L, 23, 56, 21.6, 88, 5.8, -0.3)}${shin(L, 37, 56, 38.4, 88, 5.8, 0.3)}
    ${L.bottomStyle === 'skirt' ? `<path d="M15.6 60 Q30 46 44.4 60 L43 64 Q30 58 17 64 Z" fill="${L.bottom}"/>` : ''}
    ${knee(23, 53.6)}${knee(37, 53.6)}
    <g class="body">
      <g class="arm-rest">${arm(L, 17.6, 26.4, 19.6, 49.6, 27.6, 49.2)}</g>
      ${head112(0)}
      <g class="arm-cheer" style="transform-origin:42.4px 26.4px">${arm(L, 42.4, 26.4, 40.6, 49.2, 35, 45.4)}${glass(35, 48.4, 1.2)}</g>
    </g>
  </svg>`;
}

// ------------------------------------------------------------------------------------------------ standing people

/**
 * A standing person in a 60 x 150 box, feet at the bottom. Legs and arms are in .leg-l/.leg-r/.arm-l/.arm-r so the
 * stage can make them walk. `role`: 'guest', 'chef' (apron, head scarf, spatula), 'waiter' (black tee, towel).
 * `carry`: SVG of a dish on a tray held in front (the arms go forward).
 * @param {Look} L @param {{ role?: 'guest' | 'chef' | 'waiter'; carry?: string; cooking?: boolean }} o
 */
export function standingSVG(L, o = {}) {
  const role = o.role ?? 'guest';
  const shortsLen = L.bottomStyle === 'shorts' ? 98 : L.bottomStyle === 'skirt' ? 100 : 140;
  const leg = (/** @type {number} */ hip, /** @type {number} */ foot, /** @type {string} */ cls) => {
    const piv = `transform-origin:${hip}px 70px`;
    const pants = `<path d="M${hip - 5.6} 68 L${hip + 5.6} 68 L${hip + (foot - hip) + 3.2} ${Math.min(shortsLen, 140)} L${hip + (foot - hip) - 3.2} ${Math.min(shortsLen, 140)} Z" fill="${L.bottom}"/><path d="M${hip - 5.6} 68 L${hip + 5.6} 68 L${hip + (foot - hip) + 3.2} ${Math.min(shortsLen, 140)} L${hip + (foot - hip) - 3.2} ${Math.min(shortsLen, 140)} Z" fill="url(#pShadeH)"/>`;
    const skinLeg = shortsLen < 140 ? shin(L, hip + (foot - hip) * 0.78, shortsLen - 2, foot, 141, 5.2) : shin(L, foot, 139, foot, 141, 6.2);
    return `<g class="${cls}" style="${piv}">${skinLeg}${pants}</g>`;
  };
  const skirt = L.bottomStyle === 'skirt' ? `<path d="M17.6 66 L42.4 66 L45 101 Q30 104 15 101 Z" fill="${L.bottom}"/><path d="M17.6 66 L42.4 66 L45 101 Q30 104 15 101 Z" fill="url(#pShadeH)"/>` : '';
  const body = 'M15.4 30 Q15.8 25.6 22 25 L38 25 Q44.2 25.6 44.6 30 L42.4 69 Q30 71 17.6 69 Z';
  const W = role === 'chef' ? { ...L, topStyle: 'tee' } : role === 'waiter' ? { ...L, top: '#1d1d21', topStyle: 'tee' } : L;
  let arms;
  if (o.carry) {
    // both forearms forward holding a tray at chest height
    arms = `<g class="arm-l">${arm(W, 17, 29, 14.6, 50, 21, 56, 5)}</g><g class="arm-r">${arm(W, 43, 29, 45.4, 50, 39, 56, 5)}</g>
      <g class="tray"><ellipse cx="30" cy="57" rx="16" ry="3.6" fill="url(#pSteel)"/><ellipse cx="30" cy="56.4" rx="14.4" ry="2.8" fill="#dfe4ea"/><g transform="translate(16 36) scale(0.56)">${o.carry}</g></g>`;
  } else if (role === 'chef') {
    // left hand on the wok handle, right hand with the spatula
    arms = `<g class="arm-l stir-l" style="transform-origin:17px 29px">${arm(W, 17, 29, 11, 47, 3, 56, 5)}</g>
      <g class="arm-r stir" style="transform-origin:43px 29px">${arm(W, 43, 29, 46, 48, 38, 60, 5)}<path d="M38 60 L24 72" stroke="#6b4a2f" stroke-width="1.6" stroke-linecap="round"/><path d="M24.5 71.5 L20 76 L22.6 78.4 L26.8 74 Z" fill="#c9ced4"/></g>`;
  } else {
    arms = `<g class="arm-l" style="transform-origin:17px 29px">${arm(W, 17, 29, 14.6, 49, 15.2, 67, 5)}</g><g class="arm-r" style="transform-origin:43px 29px">${arm(W, 43, 29, 45.4, 49, 44.8, 67, 5)}</g>`;
  }
  const apron =
    role === 'chef'
      ? `<path d="M20 38 L40 38 L42 104 Q30 107 18 104 Z" fill="#ece5d6"/><path d="M20 38 L40 38 L42 104 Q30 107 18 104 Z" fill="url(#pShadeV)"/><path d="M20 38 L25 25.6 M40 38 L35 25.6" stroke="#ece5d6" stroke-width="1.4"/><path d="M18.5 60 Q30 62 41.5 60" stroke="#b33" stroke-width="1.2" fill="none"/><rect x="25" y="70" width="10" height="7" rx="1" fill="#e2d9c6" stroke="#cfc4ad" stroke-width="0.5"/><path d="M24 92 Q30 90 36 92" stroke="#c9a77a" stroke-width="2" opacity="0.35" fill="none"/>`
      : role === 'waiter'
        ? `<path d="M40 36 Q44 44 41 52" stroke="#f2efe8" stroke-width="3" fill="none"/>`
        : '';
  const scarf = role === 'chef' ? `<path d="M23.2 8.6 Q23.4 2 30 1.8 Q36.6 2 36.8 8.6 Q30 6.2 23.2 8.6 Z" fill="#b8322a"/><path d="M23.2 8.6 Q30 6.2 36.8 8.6" stroke="#fff" stroke-opacity="0.5" stroke-width="0.5" fill="none"/><circle cx="25" cy="4" r="0.5" fill="#fff" opacity="0.7"/><circle cx="31" cy="3" r="0.5" fill="#fff" opacity="0.7"/><circle cx="34.5" cy="5" r="0.5" fill="#fff" opacity="0.7"/>` : '';
  return `<svg viewBox="0 0 60 150" class="person standing ${role}${o.carry ? ' carrying' : ''}" aria-hidden="true">
    <ellipse cx="30" cy="146" rx="17" ry="3" fill="url(#pShadow)"/>
    ${leg(24.6, 24.4, 'leg-l')}${leg(35.4, 35.6, 'leg-r')}
    <g class="body">
      ${torso(W, body, 25.2, 69)}
      ${skirt}${apron}
      <g transform="translate(-4.5 -2.6) scale(1.15)">${head(L, 0)}${scarf}</g>
      ${arms}
    </g>
  </svg>`;
}

// ------------------------------------------------------------------------------------------------ tables and food

/**
 * Low red plastic table (bàn nhựa vỉa hè) in a 100 x 44 box: top seen at an angle, four legs, a number disc on the
 * front so viewers can type "bàn N". Things on it (glasses, dishes) are HTML laid over the top.
 */
export function tableSVG(/** @type {number} */ no) {
  return `<svg viewBox="0 0 100 44" class="table-svg" preserveAspectRatio="none" aria-hidden="true">
    <ellipse cx="50" cy="41" rx="54" ry="5" fill="url(#pShadow)"/>
    <g fill="#9e1b1b"><path d="M13 12 L16 12 L15 35 L12.6 35 Z"/><path d="M84 12 L87 12 L87.4 35 L85 35 Z"/></g>
    <path d="M10 4 L90 4 L98.5 15.5 L1.5 15.5 Z" fill="#d32f2f"/>
    <path d="M10 4 L90 4 L98.5 15.5 L1.5 15.5 Z" fill="url(#pPlastic)"/>
    <path d="M14 5.6 L86 5.6 L93 14 L7 14 Z" fill="none" stroke="#ff8a80" stroke-opacity="0.35" stroke-width="0.6"/>
    <path d="M1.5 15.5 L98.5 15.5 L98.5 19 L1.5 19 Z" fill="#a52020"/>
    <g fill="#b71c1c"><path d="M4 19 L8.4 19 L7.4 42 L3.6 42 Z"/><path d="M91.6 19 L96 19 L96.4 42 L92.6 42 Z"/></g>
    <g fill="#000" opacity="0.25"><path d="M7.4 19 L8.4 19 L7.4 42 L6.6 42 Z"/><path d="M95 19 L96 19 L96.4 42 L95.4 42 Z"/></g>
    <circle cx="50" cy="27" r="6.6" fill="#fff8e6" stroke="#5a1010" stroke-width="0.8"/>
    <text x="50" y="30.4" text-anchor="middle" font-size="9.6" font-weight="900" fill="#7a1414" font-family="Be Vietnam Pro, sans-serif">${no}</text>
  </svg>`;
}

/** Food colours for each dish id (seen from above on a plate) */
const FOOD = /** @type {Record<string, { c: string; d: string; shape: 'dots' | 'chunks' | 'sticks' | 'slices' | 'shells' | 'rolls' | 'eggs' | 'disc' | 'leaf' | 'fish' }>} */ ({
  lac: { c: '#c98a4b', d: '#8a5527', shape: 'dots' },
  dauhanh: { c: '#f0c45e', d: '#b98a2c', shape: 'chunks' },
  dua: { c: '#a5d36a', d: '#3e7d2a', shape: 'slices' },
  khoca: { c: '#e4b36e', d: '#a8722e', shape: 'sticks' },
  nem: { c: '#e88a7a', d: '#3f7d31', shape: 'rolls' },
  khoai: { c: '#f6c844', d: '#c48d14', shape: 'sticks' },
  ngo: { c: '#f7d33a', d: '#c39a0a', shape: 'dots' },
  rau: { c: '#3f8f35', d: '#1f5a1a', shape: 'leaf' },
  trung: { c: '#e9dfcb', d: '#a8977a', shape: 'eggs' },
  banhda: { c: '#e8c27c', d: '#b08a42', shape: 'disc' },
  ganuong: { c: '#c56a2a', d: '#7a3410', shape: 'chunks' },
  mucnuong: { c: '#efc08a', d: '#b06a2c', shape: 'rolls' },
  ochuong: { c: '#b49485', d: '#6a4a3c', shape: 'shells' },
  ngheu: { c: '#cdbfb4', d: '#7d6a5c', shape: 'shells' },
  bolalot: { c: '#3d6b2c', d: '#1d3d14', shape: 'rolls' },
  sunga: { c: '#e7a85e', d: '#a8642a', shape: 'chunks' },
  tomnuong: { c: '#f2733e', d: '#a63c16', shape: 'rolls' },
  ech: { c: '#d9a463', d: '#8f5f28', shape: 'chunks' },
  changa: { c: '#e5ad72', d: '#9c642e', shape: 'sticks' },
  caloc: { c: '#9a7462', d: '#5a3e30', shape: 'fish' },
  hau: { c: '#d8cfc1', d: '#8a7f70', shape: 'shells' },
  long: { c: '#c07a3a', d: '#7a4214', shape: 'rolls' },
});

/**
 * A dish as it sits on a table, in a 50 x 40 box (bottom = table top): a plate of food, a steaming hotpot on a gas
 * burner, or drinks.
 * @param {{ id: string; kind: string }} item
 */
export function dishSVG(item) {
  const r = seeded(hash(item.id) + 3);
  if (item.kind === 'hotpot') {
    const bits = [...Array(9)].map(() => `<ellipse cx="${(17 + r() * 16).toFixed(1)}" cy="${(18.5 + r() * 4).toFixed(1)}" rx="${(1.2 + r() * 1.6).toFixed(1)}" ry="0.9" fill="${['#f5f0e6', '#4f9a3a', '#e9a23b', '#d9534f', '#f2c14e'][Math.floor(r() * 5)]}"/>`).join('');
    return `<svg viewBox="0 0 50 40" class="dish hotpot" aria-hidden="true">
      <ellipse cx="25" cy="38" rx="20" ry="2.2" fill="url(#pShadow)"/>
      <path d="M10 30 L40 30 L38 37 L12 37 Z" fill="#2b2e33"/><ellipse cx="25" cy="30" rx="14" ry="2.4" fill="#41464d"/><ellipse class="burner" cx="25" cy="29.4" rx="10" ry="1.6" fill="#4d9bff" opacity="0.8"/>
      <path d="M11 20 Q11 30 25 30.6 Q39 30 39 20 Z" fill="url(#pSteel)"/>
      <ellipse cx="25" cy="20" rx="14" ry="3.6" fill="#dde3e9"/><ellipse cx="25" cy="20.3" rx="12.4" ry="2.8" fill="#c0431f"/><ellipse cx="25" cy="19.8" rx="9" ry="1.6" fill="#e0602b" opacity="0.7"/>
      ${bits}
      <path d="M9 21 h-3 M41 21 h3" stroke="#9aa2ab" stroke-width="1.4" stroke-linecap="round"/>
      <g class="steam-up"><path d="M19 14 c-2 -4 2 -6 0 -11" stroke="#fff" stroke-opacity="0.5" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M26 14 c-2 -4 2 -6 0 -11" stroke="#fff" stroke-opacity="0.45" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M32 14 c-2 -4 2 -6 0 -11" stroke="#fff" stroke-opacity="0.4" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
    </svg>`;
  }
  if (item.kind === 'drink') {
    const one = (/** @type {number} */ x) =>
      item.id === 'trada'
        ? glass(x, 36, 1.9, true)
        : item.id === 'nuocngot'
          ? `<g transform="translate(${x} 36)"><rect x="-2.6" y="-15" width="5.2" height="15" rx="2" fill="#c62828"/><rect x="-1.4" y="-19" width="2.8" height="4.4" fill="#c62828"/><rect x="-2.6" y="-10" width="5.2" height="4" fill="#fff" opacity="0.85"/><rect x="-1.8" y="-14" width="1" height="12" fill="#fff" opacity="0.35"/></g>`
          : item.id === 'nuocloc'
            ? `<g transform="translate(${x} 36)"><rect x="-2.6" y="-15" width="5.2" height="15" rx="2" fill="#cfeaff" opacity="0.9"/><rect x="-1.4" y="-19" width="2.8" height="4.4" fill="#1e88e5"/><rect x="-2.6" y="-10" width="5.2" height="3.4" fill="#1e88e5" opacity="0.8"/></g>`
            : glass(x, 36, 1.9);
    return `<svg viewBox="0 0 50 40" class="dish drink" aria-hidden="true"><ellipse cx="25" cy="37.5" rx="16" ry="1.8" fill="url(#pShadow)"/>${one(17)}${one(25)}${one(33)}</svg>`;
  }
  const f = FOOD[item.id] ?? { c: '#d89a5a', d: '#8f5a2a', shape: 'chunks' };
  let food = '';
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(r());
    const x = 25 + Math.cos(a) * rr * 10;
    const y = 31 + Math.sin(a) * rr * 2.6 - (1 - rr) * 3.2;
    const rot = Math.round(r() * 180);
    const p = `transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})"`;
    if (f.shape === 'dots') food += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.5" ry="1.1" fill="${f.c}" stroke="${f.d}" stroke-width="0.3"/>`;
    else if (f.shape === 'sticks') food += `<rect x="${(x - 3).toFixed(1)}" y="${(y - 0.7).toFixed(1)}" width="6" height="1.5" rx="0.7" fill="${f.c}" stroke="${f.d}" stroke-width="0.3" ${p}/>`;
    else if (f.shape === 'slices') food += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.4" ry="1.3" fill="${f.c}" stroke="${f.d}" stroke-width="0.6"/>`;
    else if (f.shape === 'shells') food += `<path d="M${(x - 2).toFixed(1)} ${y.toFixed(1)} Q${x.toFixed(1)} ${(y - 2.6).toFixed(1)} ${(x + 2).toFixed(1)} ${y.toFixed(1)} Z" fill="${f.c}" stroke="${f.d}" stroke-width="0.4" ${p}/>`;
    else if (f.shape === 'rolls' && i % 2) food += `<rect x="${(x - 3.2).toFixed(1)}" y="${(y - 1.2).toFixed(1)}" width="6.4" height="2.4" rx="1.2" fill="${f.c}" stroke="${f.d}" stroke-width="0.4" ${p}/>`;
    else if (f.shape === 'eggs' && i % 3 === 0) food += `<ellipse cx="${x.toFixed(1)}" cy="${(y - 1).toFixed(1)}" rx="2.2" ry="2.8" fill="${f.c}" stroke="${f.d}" stroke-width="0.3"/>`;
    else if (f.shape === 'leaf') food += `<path d="M${(x - 3).toFixed(1)} ${y.toFixed(1)} q3 -2.4 6 0 q-3 2.4 -6 0 Z" fill="${i % 2 ? f.c : f.d}" ${p}/>`;
    else if (f.shape === 'chunks') food += `<rect x="${(x - 1.6).toFixed(1)}" y="${(y - 1.4).toFixed(1)}" width="3.2" height="2.6" rx="0.8" fill="${f.c}" stroke="${f.d}" stroke-width="0.35" ${p}/>`;
  }
  if (f.shape === 'disc') food = `<ellipse cx="25" cy="30" rx="10" ry="3.2" fill="${f.c}" stroke="${f.d}" stroke-width="0.5"/>${[...Array(12)].map(() => `<circle cx="${(17 + r() * 16).toFixed(1)}" cy="${(29 + r() * 2.4).toFixed(1)}" r="0.35" fill="#3a2a1a"/>`).join('')}`;
  if (f.shape === 'fish') food = `<path d="M13 30.5 Q22 26 33 30 L38 27.6 L37 30.6 L38.6 33.4 L33 31.4 Q22 35 13 30.5 Z" fill="${f.c}" stroke="${f.d}" stroke-width="0.5"/><circle cx="16" cy="30" r="0.7" fill="#111"/><path d="M20 29 Q22 31 20 33 M24 28.6 Q26 31 24 33.2 M28 28.8 Q30 31 28 32.8" stroke="${f.d}" stroke-width="0.4" fill="none"/>`;
  const herbs = [...Array(4)].map(() => `<circle cx="${(18 + r() * 14).toFixed(1)}" cy="${(29 + r() * 3).toFixed(1)}" r="0.7" fill="#5aa83e"/>`).join('');
  const chili = r() < 0.6 ? `<circle cx="${(20 + r() * 10).toFixed(1)}" cy="${(30 + r() * 2).toFixed(1)}" r="0.55" fill="#e53935"/>` : '';
  return `<svg viewBox="0 0 50 40" class="dish plate" aria-hidden="true">
    <ellipse cx="25" cy="36.4" rx="17" ry="2" fill="url(#pShadow)"/>
    <ellipse cx="25" cy="32.6" rx="15.6" ry="4.4" fill="#f4f1ea"/><ellipse cx="25" cy="32.6" rx="15.6" ry="4.4" fill="none" stroke="#c9c1b2" stroke-width="0.6"/><ellipse cx="25" cy="32.2" rx="11.6" ry="3" fill="#e9e4d8"/>
    <path d="M10 33 Q25 39 40 33" stroke="#2f6fb4" stroke-width="0.7" fill="none" opacity="0.7"/>
    ${food}${herbs}${chili}
    <g class="steam-up thin"><path d="M22 24 c-1.6 -3 1.6 -4.6 0 -8" stroke="#fff" stroke-opacity="0.4" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M28 24 c-1.6 -3 1.6 -4.6 0 -8" stroke="#fff" stroke-opacity="0.35" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>
  </svg>`;
}

/** What every table starts with: a jug of bia hơi, chopsticks and a napkin box */
export function tableBaseSVG(/** @type {number} */ seed) {
  const r = seeded(seed + 41);
  const jug = r() < 0.6;
  return `<svg viewBox="0 0 100 20" class="table-base" aria-hidden="true">
    ${jug ? `<g transform="translate(${30 + r() * 10} 16)"><path d="M-4.6 -12 L4.6 -12 L4 0 L-4 0 Z" fill="url(#pBeer)" opacity="0.85"/><path d="M-5 -13 L5 -13 L4.6 -11 L-4.6 -11 Z" fill="#fffaf0"/><path d="M4.4 -9.6 Q8.4 -9 7.6 -4.6 Q7 -2.4 4.2 -2.6" stroke="#e8eef4" stroke-opacity="0.8" stroke-width="1" fill="none"/><path d="M-3 -10 L-2.6 -1.6" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/></g>` : ''}
    <g transform="translate(${62 + r() * 8} 15)"><rect x="-4.6" y="-5" width="9.2" height="5" rx="0.6" fill="#f2efe6"/><rect x="-4.6" y="-5" width="9.2" height="1.4" fill="#e4dccb"/><path d="M-1.6 -5 q1.6 -3 3.2 0" fill="#fff"/></g>
    <g stroke="#d9c39a" stroke-width="0.8" stroke-linecap="round"><path d="M${48 + r() * 4} 16 L${56 + r() * 4} 12.6"/><path d="M${48.6 + r() * 4} 16.6 L${56.6 + r() * 4} 13.2"/></g>
    <ellipse cx="${18 + r() * 6}" cy="15.6" rx="3.4" ry="1.2" fill="#f4f1ea"/><ellipse cx="${18 + r() * 6}" cy="15.4" rx="2" ry="0.6" fill="#c62828" opacity="0.7"/>
  </svg>`;
}
