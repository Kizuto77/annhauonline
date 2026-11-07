// @ts-check
// Quán "sống": sao lấp lánh, mây trôi, đèn nhà phố bật tắt, đèn lồng đung đưa, quạt treo tường quay, con mèo đi dạo
// trên ban công, thiêu thân quanh cột đèn, ánh đèn trong quán phập phồng. Toàn bộ là SVG + CSS (nhẹ cho LIVE Studio).
// Lớp này nằm ngay trên cảnh vẽ sẵn, cùng hệ tọa độ 430 x 764; ẩn đi khi chủ quán dùng ảnh nền riêng.

const W = 430;
const H = 764;

/** @param {number} seed */
function rand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function stars() {
  const r = rand(91);
  let out = '';
  for (let i = 0; i < 28; i++) {
    const x = r() * W;
    const y = 3 + r() * 40;
    if (x > 34 && x < 396 && y > 44) continue; // behind the sign board
    out += `<circle class="lv-star" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.5 + r() * 0.9).toFixed(2)}" style="animation-delay:-${(r() * 5).toFixed(2)}s;animation-duration:${(2.5 + r() * 3).toFixed(2)}s"/>`;
  }
  return out;
}

function cloud(/** @type {number} */ y, /** @type {number} */ s, /** @type {number} */ dur, /** @type {number} */ delay) {
  return `<g class="lv-cloud" style="animation-duration:${dur}s;animation-delay:-${delay}s"><g transform="translate(0 ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="30" ry="8"/><ellipse cx="-14" cy="-5" rx="14" ry="8"/><ellipse cx="10" cy="-7" rx="16" ry="9"/></g></g>`;
}

/** Red paper lantern hanging from (x, y) */
function lantern(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ delay) {
  return `<g class="lv-lantern" style="transform-origin:${x}px ${y}px;animation-delay:-${delay}s">
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 8}" stroke="#2a160d" stroke-width="1"/>
    <ellipse cx="${x}" cy="${y + 20}" rx="13" ry="16" fill="#ff8a3d" opacity="0.25" class="lv-lantern-glow"/>
    <rect x="${x - 5}" y="${y + 7}" width="10" height="3" rx="1" fill="#d9a520"/>
    <ellipse cx="${x}" cy="${y + 19}" rx="9" ry="10" fill="#d62828"/>
    <g stroke="#a3161c" stroke-width="0.8" fill="none"><ellipse cx="${x}" cy="${y + 19}" rx="5" ry="10"/><line x1="${x}" y1="${y + 9}" x2="${x}" y2="${y + 29}"/></g>
    <ellipse cx="${x - 3}" cy="${y + 15}" rx="2.5" ry="4" fill="#ffd166" opacity="0.45"/>
    <rect x="${x - 5}" y="${y + 28}" width="10" height="3" rx="1" fill="#d9a520"/>
    <g stroke="#ffcf3f" stroke-width="0.9"><line x1="${x - 2}" y1="${y + 31}" x2="${x - 2}" y2="${y + 38}"/><line x1="${x}" y1="${y + 31}" x2="${x}" y2="${y + 39}"/><line x1="${x + 2}" y1="${y + 31}" x2="${x + 2}" y2="${y + 38}"/></g>
  </g>`;
}

/** Small wall fan (quạt treo tường), turning its head slowly */
function fan(/** @type {number} */ x, /** @type {number} */ y) {
  return `<g>
    <rect x="${x - 2}" y="${y + 9}" width="4" height="9" fill="#5b6470"/><rect x="${x - 6}" y="${y + 17}" width="12" height="4" rx="1" fill="#3c434c"/>
    <g class="lv-fan-head" style="transform-origin:${x}px ${y + 10}px">
      <g class="lv-fan-blades" style="transform-origin:${x}px ${y}px">
        <ellipse cx="${x}" cy="${y - 5}" rx="3" ry="6" fill="#7cc5ff" opacity="0.85"/><ellipse cx="${x + 4.5}" cy="${y + 2.6}" rx="3" ry="6" transform="rotate(120 ${x + 4.5} ${y + 2.6})" fill="#7cc5ff" opacity="0.85"/><ellipse cx="${x - 4.5}" cy="${y + 2.6}" rx="3" ry="6" transform="rotate(240 ${x - 4.5} ${y + 2.6})" fill="#7cc5ff" opacity="0.85"/>
      </g>
      <circle cx="${x}" cy="${y}" r="10.5" fill="none" stroke="#c9d1db" stroke-width="1.2"/>
      <g stroke="#c9d1db" stroke-width="0.5" opacity="0.8"><line x1="${x - 10}" y1="${y}" x2="${x + 10}" y2="${y}"/><line x1="${x}" y1="${y - 10}" x2="${x}" y2="${y + 10}"/><line x1="${x - 7}" y1="${y - 7}" x2="${x + 7}" y2="${y + 7}"/><line x1="${x - 7}" y1="${y + 7}" x2="${x + 7}" y2="${y - 7}"/></g>
      <circle cx="${x}" cy="${y}" r="2.6" fill="#2b74c9"/>
    </g>
  </g>`;
}

/** Cat silhouette (faces right), legs and tail move while walking */
const CAT = `<g class="lv-cat-body">
  <path class="lv-cat-tail" d="M-11 -6 q-8 -2 -9 -11" stroke="#141018" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="0" cy="-6" rx="11" ry="5" fill="#141018"/>
  <circle cx="11" cy="-10" r="4.6" fill="#141018"/>
  <path d="M8.5 -13.5 l1 -4 l2.4 3 Z M12.5 -13.8 l2 -3.8 l1.4 3.6 Z" fill="#141018"/>
  <circle cx="12.8" cy="-10.4" r="0.8" fill="#ffd166"/>
  <g class="lv-cat-legs" stroke="#141018" stroke-width="2" stroke-linecap="round"><line class="a" x1="-7" y1="-3" x2="-7" y2="1"/><line class="b" x1="-3" y1="-3" x2="-3" y2="1"/><line class="a" x1="5" y1="-3" x2="5" y2="1"/><line class="b" x1="8" y1="-3" x2="8" y2="1"/></g>
</g>`;

/**
 * Build the living layer and start its little events.
 * @param {HTMLElement} layer empty div over the drawn scene
 * @param {SVGSVGElement | null} sceneSvg the drawn scene, for its city windows
 */
export function livingScene(layer, sceneSvg) {
  layer.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="scene-svg" aria-hidden="true">
    <defs>
      <radialGradient id="lvLamp" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="#ffe7a0" stop-opacity="0.32"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></radialGradient>
      <radialGradient id="lvWarm"><stop offset="0" stop-color="#ffb04a" stop-opacity="0.22"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>
    </defs>
    <g class="lv-stars">${stars()}</g>
    <g class="lv-clouds">${cloud(22, 1, 150, 10)}${cloud(38, 0.7, 120, 70)}${cloud(12, 0.55, 180, 120)}</g>
    <!-- warm light breathing inside the shop -->
    <ellipse class="lv-breathe" cx="215" cy="360" rx="230" ry="120" fill="url(#lvWarm)"/>
    <!-- street lamp light cone and moths -->
    <path class="lv-cone" d="M378 172 L340 300 L432 300 L394 172 Z" fill="url(#lvLamp)"/>
    <g class="lv-moths">${[0, 1, 2].map((i) => `<g class="lv-moth" style="transform-origin:386px 176px;animation-delay:-${i * 0.9}s;animation-duration:${2.2 + i * 0.7}s"><circle cx="${394 + i * 3}" cy="${171 - i * 2}" r="0.9" fill="#fff8dc"/></g>`).join('')}</g>
    ${lantern(104, 226, 0)}${lantern(326, 226, 1.7)}
    ${fan(108, 300)}
    <g class="lv-cat" transform="translate(-40 221)">${CAT}</g>
  </svg>`;

  // city windows: a light goes off here, another comes on there
  const wins = sceneSvg ? [...sceneSvg.querySelectorAll('rect[width="4"][height="5"]')] : [];
  setInterval(() => {
    if (!wins.length || document.hidden) return;
    const w = /** @type {SVGRectElement} */ (wins[Math.floor(Math.random() * wins.length)]);
    w.style.transition = 'opacity 0.4s';
    w.style.opacity = w.style.opacity === '0.05' ? '' : '0.05';
  }, 1700);

  // the cat strolls along the balcony now and then, sometimes stops to sit and look at the quán
  const cat = /** @type {SVGGElement} */ (layer.querySelector('.lv-cat'));
  const stroll = () => {
    const rightward = Math.random() < 0.5;
    const from = rightward ? -40 : W + 40;
    const to = rightward ? W + 40 : -40;
    const mid = 120 + Math.random() * 190;
    const flip = rightward ? '' : ' scale(-1 1)';
    const sit = Math.random() < 0.55;
    const walk = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ ms) =>
      cat.animate([{ transform: `translate(${a}px, 221px)${flip}` }, { transform: `translate(${b}px, 221px)${flip}` }], { duration: ms, easing: 'linear', fill: 'forwards' }).finished;
    cat.classList.add('walking');
    (async () => {
      if (sit) {
        await walk(from, mid, Math.abs(mid - from) * 38);
        cat.classList.remove('walking');
        cat.classList.add('sitting');
        await new Promise((ok) => setTimeout(ok, 4000 + Math.random() * 5000));
        cat.classList.remove('sitting');
        cat.classList.add('walking');
        await walk(mid, to, Math.abs(to - mid) * 38);
      } else await walk(from, to, Math.abs(to - from) * 38);
      cat.classList.remove('walking');
    })().catch(() => {});
    setTimeout(stroll, 45_000 + Math.random() * 40_000);
  };
  setTimeout(stroll, 8000);
}
