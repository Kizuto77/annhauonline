// @ts-check
// Hiệu ứng "dzô": hai cốc bia hơi (cốc thủy tinh dày, bọt trắng tràn miệng) bay vào cụng nhau, bọt bia văng, lóe
// sáng, rồi cùng nâng lên. Bản to ở giữa màn hình (có tên người dzô), bản nhỏ trên đầu người ngồi bàn.
// `onHit` chạy đúng lúc hai cốc chạm, để phát tiếng cụng ly cho khớp.
import { ring, sparkles, splash } from './effects.js';

let seq = 0;
/** A Hà Nội bia hơi glass, 60 x 80, foam over the rim, bubbles rising in the beer */
export function mugSVG() {
  const id = `m${++seq}`;
  const bubbles = [...Array(9)]
    .map((_, i) => `<circle class="bub" cx="${16 + ((i * 37) % 28)}" cy="${66 - ((i * 23) % 30)}" r="${0.7 + (i % 3) * 0.35}" fill="#fff" opacity="0.7" style="animation-delay:-${(i * 0.37).toFixed(2)}s"/>`)
    .join('');
  return `<svg viewBox="0 0 60 80" class="mug" aria-hidden="true"><defs>
    <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#dfeee6" stop-opacity="0.75"/><stop offset="0.25" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="0.7" stop-color="#bcd6c8" stop-opacity="0.3"/><stop offset="1" stop-color="#7f9e8e" stop-opacity="0.8"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd76a"/><stop offset="0.55" stop-color="#f0a52a"/><stop offset="1" stop-color="#c06d12"/></linearGradient>
    <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0.18"/><stop offset="0.3" stop-color="#fff" stop-opacity="0.25"/><stop offset="0.75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></linearGradient>
    <clipPath id="${id}c"><path d="M12.6 19 L47.4 19 L44.4 70.6 Q30 74.2 15.6 70.6 Z"/></clipPath>
  </defs>
    <ellipse cx="30" cy="77" rx="17" ry="2.6" fill="#000" opacity="0.35"/>
    <path d="M12.6 19 L47.4 19 L44.4 70.6 Q30 74.2 15.6 70.6 Z" fill="url(#${id}b)"/>
    <path d="M12.6 19 L47.4 19 L44.4 70.6 Q30 74.2 15.6 70.6 Z" fill="url(#${id}s)"/>
    <g clip-path="url(#${id}c)">${bubbles}</g>
    <path d="M10 7 L50 7 L46.4 73 Q30 78.4 13.6 73 Z" fill="url(#${id}g)" stroke="#e9f5ee" stroke-opacity="0.65" stroke-width="1.2"/>
    <g stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.6">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${16 + i * 4.6} 58 L${16.4 + i * 4.4} 73"/>`).join('')}</g>
    <path d="M14.6 12 L16.8 66" stroke="#fff" stroke-opacity="0.7" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M19.4 14 L20.4 40" stroke="#fff" stroke-opacity="0.35" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M13.6 73 Q30 78.4 46.4 73 L46 76 Q30 80.6 14 76 Z" fill="#cfe3d8" opacity="0.75"/>
    <path class="foam" d="M9 9 Q8 2.6 14 3.4 Q16 -1 21.6 1.6 Q25.6 -2 30.4 1 Q35 -2.2 39 1.4 Q44.6 -0.6 46.6 3.6 Q52.4 3.4 51 9.4 Q51.4 15 47 16.4 L47.4 21 Q30 23.6 12.6 21 L12.8 16.4 Q8.4 14.6 9 9 Z" fill="#fffaf0"/>
    <path d="M12 9 Q20 6 30 8 Q40 6 48 9" stroke="#efe2c4" stroke-width="1.2" fill="none" opacity="0.8"/>
    <path d="M44 16 Q47 22 45.6 27 Q44.6 29.6 43.6 26" fill="#fffaf0" opacity="0.95"/>
    <ellipse cx="22" cy="5.6" rx="5" ry="1.6" fill="#fff" opacity="0.9"/>
  </svg>`;
}

/**
 * Big cheers in the middle: two glasses fly in, clink, foam flies, both rise. `name` shows under them.
 * @param {HTMLElement} box the fx layer (whole stage) @param {string} name @param {() => void} onHit
 */
export function bigToast(box, name, onHit) {
  box.querySelector('.toast-big')?.remove();
  const w = document.createElement('div');
  w.className = 'toast-big';
  w.innerHTML = `<div class="glow"></div><div class="mug-l">${mugSVG()}</div><div class="mug-r">${mugSVG()}</div><div class="toast-name"><b>DZÔ!</b><span></span></div>`;
  /** @type {HTMLElement} */ (w.querySelector('.toast-name span')).textContent = name;
  box.appendChild(w);
  const L = /** @type {HTMLElement} */ (w.querySelector('.mug-l'));
  const R = /** @type {HTMLElement} */ (w.querySelector('.mug-r'));
  const HIT = 0.27;
  const DUR = 2400;
  const fly = (/** @type {HTMLElement} */ m, /** @type {number} */ s) =>
    m.animate(
      [
        { transform: `translate(${s * 220}px, 80px) rotate(${s * 40}deg) scale(0.55)`, opacity: 0, easing: 'cubic-bezier(0.3, 0.2, 0.8, 0.6)' },
        { transform: `translate(${s * 110}px, 26px) rotate(${s * 18}deg) scale(0.85)`, opacity: 1, offset: 0.15, easing: 'cubic-bezier(0.6, 0, 1, 1)' },
        { transform: `translate(${s * 34}px, 0) rotate(${-s * 14}deg) scale(1)`, opacity: 1, offset: HIT, easing: 'cubic-bezier(0, 0.6, 0.4, 1)' },
        { transform: `translate(${s * 46}px, -5px) rotate(${-s * 6}deg) scale(1)`, opacity: 1, offset: 0.32, easing: 'ease-in-out' },
        { transform: `translate(${s * 38}px, -2px) rotate(${-s * 11}deg) scale(1)`, opacity: 1, offset: 0.38, easing: 'ease-in-out' },
        { transform: `translate(${s * 40}px, -36px) rotate(${-s * 9}deg) scale(1.04)`, opacity: 1, offset: 0.86, easing: 'ease-in' },
        { transform: `translate(${s * 64}px, -80px) rotate(${-s * 3}deg) scale(0.9)`, opacity: 0 },
      ],
      { duration: DUR, fill: 'forwards' },
    );
  fly(L, -1);
  fly(R, 1);
  const hitAt = Math.round(DUR * HIT);
  setTimeout(() => {
    w.classList.add('hit');
    onHit();
    ring(box, 50, 33.5, '#fff3c4', 70);
    sparkles(box, 50, 33, 14, 46, '#fff6c9');
    splash(box, 49, 32.5, 16);
    splash(box, 51, 32.5, 16);
  }, hitAt);
  setTimeout(() => w.classList.add('out'), DUR - 200);
  setTimeout(() => w.remove(), DUR + 300);
}

/**
 * Small cheers over someone's head (x, y in % of the box)
 * @param {HTMLElement} box @param {number} x @param {number} y @param {() => void} onHit
 */
export function miniToast(box, x, y, onHit) {
  const w = document.createElement('div');
  w.className = 'toast-mini';
  w.style.left = `${x}%`;
  w.style.top = `${y}%`;
  w.innerHTML = `<div class="mug-l">${mugSVG()}</div><div class="mug-r">${mugSVG()}</div>`;
  box.appendChild(w);
  const anim = (/** @type {Element | null} */ m, /** @type {number} */ s) =>
    m?.animate(
      [
        { transform: `translate(${s * 22}px, 6px) rotate(${s * 25}deg)`, opacity: 0 },
        { transform: `translate(${s * 7}px, 0) rotate(${-s * 14}deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${s * 10}px, -1px) rotate(${-s * 6}deg)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${s * 9}px, -8px) rotate(${-s * 9}deg)`, opacity: 1, offset: 0.8 },
        { transform: `translate(${s * 12}px, -14px) rotate(${-s * 6}deg)`, opacity: 0 },
      ],
      { duration: 1500, easing: 'cubic-bezier(0.45, 0, 0.35, 1)', fill: 'forwards' },
    );
  anim(w.querySelector('.mug-l'), -1);
  anim(w.querySelector('.mug-r'), 1);
  setTimeout(() => {
    onHit();
    splash(box, x, y - 1.2, 6);
    sparkles(box, x, y - 1.5, 4, 10);
  }, 450);
  setTimeout(() => w.remove(), 1600);
}
