// Hiệu ứng đẹp mắt cho sân khấu: pháo hoa, vòng sáng, quà bay, tim bay, bọt bia văng, đom đóm...
// Mọi hàm nhận một khung (box) và tọa độ tính bằng % của khung đó. Chỉ dùng transform/opacity để mượt trên LIVE Studio.

/** Too many live particles slows LIVE Studio down: past this, new ones are skipped */
const MAX_LIVE = 420;
let live = 0;

const make = (/** @type {string} */ cls, /** @type {HTMLElement} */ box, /** @type {number} */ ms) => {
  if (live >= MAX_LIVE) return null;
  const e = document.createElement('span');
  e.className = cls;
  box.appendChild(e);
  live++;
  setTimeout(() => {
    e.remove();
    live--;
  }, ms);
  return e;
};
const rnd = (/** @type {number} */ a, /** @type {number} */ b) => a + Math.random() * (b - a);
const pick = (/** @type {string[]} */ l) => l[Math.floor(Math.random() * l.length)];
const at = (/** @type {HTMLElement} */ e, /** @type {number} */ x, /** @type {number} */ y) => {
  e.style.left = `${x}%`;
  e.style.top = `${y}%`;
};

/** A ring of light that grows and fades (gift landed, someone arrived) */
export function ring(/** @type {HTMLElement} */ box, /** @type {number} */ x, /** @type {number} */ y, color = '#ffd166', size = 46) {
  for (let k = 0; k < 2; k++) {
    const e = make('fx-ring', box, 1100 + k * 200);
    if (!e) return;
    at(e, x, y);
    e.style.setProperty('--c', color);
    e.style.width = e.style.height = `${size}px`;
    e.style.animationDelay = `${k * 0.16}s`;
  }
}

/** Twinkling four-point stars around a point */
export function sparkles(/** @type {HTMLElement} */ box, /** @type {number} */ x, /** @type {number} */ y, n = 6, spread = 22, color = '#fff6c9') {
  for (let i = 0; i < n; i++) {
    const e = make('fx-star', box, 1400);
    if (!e) return;
    at(e, x, y);
    e.style.setProperty('--dx', `${rnd(-spread, spread)}px`);
    e.style.setProperty('--dy', `${rnd(-spread * 1.2, spread * 0.4)}px`);
    e.style.setProperty('--c', color);
    e.style.animationDelay = `${rnd(0, 0.4)}s`;
    e.style.scale = String(rnd(0.6, 1.3));
  }
}

/** Emojis that float up from a point, wobbling, then fade */
export function floatUp(/** @type {HTMLElement} */ box, /** @type {number} */ x, /** @type {number} */ y, /** @type {string[]} */ emojis, size = 13) {
  emojis.slice(0, 4).forEach((em, i) => {
    const e = make('fx-float', box, 2400);
    if (!e) return;
    e.textContent = em;
    at(e, x, y);
    e.style.fontSize = `${size}px`;
    e.style.setProperty('--dx', `${rnd(-14, 14)}px`);
    e.style.setProperty('--h', `${rnd(40, 64)}px`);
    e.style.animationDelay = `${i * 0.22}s`;
  });
}

/** An emoji flies on an arc from one point to another, leaving a trail of sparks; `onLand` when it arrives */
export function flyArc(/** @type {HTMLElement} */ box, /** @type {{ x: number; y: number }} */ from, /** @type {{ x: number; y: number }} */ to, /** @type {string} */ emoji, ms = 950, /** @type {() => void} */ onLand = () => {}) {
  const e = make('fx-fly', box, ms + 100);
  if (!e) return onLand();
  e.textContent = emoji;
  const w = box.clientWidth || 430;
  const h = box.clientHeight || 764;
  const dx = ((to.x - from.x) / 100) * w;
  const dy = ((to.y - from.y) / 100) * h;
  at(e, from.x, from.y);
  const lift = Math.min(-60, dy - 70);
  /** @type {Keyframe[]} */
  const frames = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    // quadratic arc: up first, then down onto the target
    const x = dx * t;
    const y = 2 * (1 - t) * t * lift + t * t * dy;
    frames.push({ transform: `translate(${x}px, ${y}px) rotate(${t * 360}deg) scale(${1.6 - 0.7 * t})` });
  }
  e.animate(frames, { duration: ms, easing: 'cubic-bezier(0.35, 0, 0.6, 1)', fill: 'forwards' });
  // trail
  const steps = 7;
  for (let i = 1; i <= steps; i++) {
    setTimeout(() => {
      const t = i / (steps + 1);
      const px = from.x + (to.x - from.x) * t;
      const py = from.y + ((2 * (1 - t) * t * lift + t * t * dy) / h) * 100;
      sparkles(box, px, py, 1, 6, pick(['#fff6c9', '#ffd166', '#ffb3d1']));
    }, (ms * i) / (steps + 1));
  }
  setTimeout(onLand, ms);
}

/** Fireworks over the sky: a rocket goes up, then bursts into coloured sparks that droop and fade */
export function fireworks(/** @type {HTMLElement} */ box, n = 4, /** @type {[number, number]} */ band = [8, 34]) {
  const palettes = [['#ffd166', '#fff3c4'], ['#ef476f', '#ffb3c6'], ['#06d6a0', '#c8ffef'], ['#4cc9f0', '#d6f6ff'], ['#c77dff', '#f1d9ff'], ['#f78c6b', '#ffe1d6']];
  for (let k = 0; k < n; k++) {
    setTimeout(() => {
      const x = rnd(12, 88);
      const y = rnd(band[0], band[1]);
      const [c1, c2] = palettes[Math.floor(Math.random() * palettes.length)];
      const rocket = make('fx-rocket', box, 700);
      if (rocket) {
        at(rocket, x, y);
        rocket.style.setProperty('--c', c1);
      }
      setTimeout(() => {
        const flashDot = make('fx-boom', box, 700);
        if (flashDot) {
          at(flashDot, x, y);
          flashDot.style.setProperty('--c', c1);
        }
        const count = 22;
        for (let i = 0; i < count; i++) {
          const p = make('fx-spark', box, 1700);
          if (!p) break;
          at(p, x, y);
          const a = (i / count) * Math.PI * 2 + rnd(-0.1, 0.1);
          const d = rnd(42, 66);
          p.style.background = i % 2 ? c1 : c2;
          p.style.boxShadow = `0 0 6px ${c1}`;
          p.animate(
            [
              { transform: 'translate(0, 0) scale(1)', opacity: 1 },
              { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(0.9)`, opacity: 1, offset: 0.45 },
              { transform: `translate(${Math.cos(a) * d * 1.1}px, ${Math.sin(a) * d + 34}px) scale(0.3)`, opacity: 0 },
            ],
            { duration: 1600, easing: 'cubic-bezier(0.1, 0.7, 0.3, 1)', fill: 'forwards' }
          );
        }
      }, 620);
    }, k * rnd(260, 420));
  }
}

/** TikTok-style hearts rising on the right edge when likes come in */
export function hearts(/** @type {HTMLElement} */ box, n = 3) {
  for (let i = 0; i < Math.min(n, 10); i++) {
    setTimeout(() => {
      const e = make('fx-heart', box, 3000);
      if (!e) return;
      e.textContent = pick(['❤️', '💖', '💗', '💕', '🧡', '💛', '🍺']);
      at(e, rnd(84, 93), rnd(88, 94));
      e.style.setProperty('--dx', `${rnd(-30, 10)}px`);
      e.style.setProperty('--w', `${rnd(-10, 10)}px`);
      e.style.fontSize = `${rnd(13, 21)}px`;
    }, i * 140);
  }
}

/** Beer foam that splashes up and falls back with gravity */
export function splash(/** @type {HTMLElement} */ box, /** @type {number} */ x, /** @type {number} */ y, n = 9) {
  for (let i = 0; i < n; i++) {
    const p = make('fx-drop', box, 1000);
    if (!p) return;
    at(p, x, y);
    const vx = rnd(-26, 26);
    const up = rnd(18, 40);
    const s = rnd(0.6, 1.4);
    p.animate(
      [
        { transform: `translate(0, 0) scale(${s})`, opacity: 1 },
        { transform: `translate(${vx * 0.6}px, ${-up}px) scale(${s})`, opacity: 1, offset: 0.45 },
        { transform: `translate(${vx}px, ${up * 0.4}px) scale(${s * 0.5})`, opacity: 0 },
      ],
      { duration: 900, easing: 'ease-out', fill: 'forwards' }
    );
  }
}

/** Big centre reveal for a big gift: turning sun rays, the gift popping out, the giver's name */
export function reveal(/** @type {HTMLElement} */ box, /** @type {string} */ icon, /** @type {string} */ title, /** @type {string} */ sub, tier = 3) {
  box.querySelector('.fx-reveal')?.remove();
  const r = document.createElement('div');
  r.className = `fx-reveal t${tier}`;
  r.innerHTML = '<div class="rays"></div><div class="halo"></div><div class="ico"></div><div class="ttl"><b></b><span></span></div>';
  /** @type {HTMLElement} */ (r.querySelector('.ico')).textContent = icon;
  /** @type {HTMLElement} */ (r.querySelector('.ttl b')).textContent = title;
  /** @type {HTMLElement} */ (r.querySelector('.ttl span')).textContent = sub;
  box.appendChild(r);
  setTimeout(() => r.classList.add('out'), tier >= 4 ? 3600 : 2800);
  setTimeout(() => r.remove(), tier >= 4 ? 4200 : 3400);
  setTimeout(() => sparkles(box, 50, 31, 12, 70), 300);
}

/** Two stage-light beams sweeping the room for a few seconds */
export function beams(/** @type {HTMLElement} */ box, ms = 4000, colors = ['rgba(255, 214, 120, 0.32)', 'rgba(255, 120, 190, 0.26)']) {
  colors.forEach((c, i) => {
    const b = make(`fx-beam ${i ? 'r' : 'l'}`, box, ms);
    if (!b) return;
    b.style.setProperty('--c', c);
    b.style.animationDuration = `${ms}ms`;
  });
}

/** Drifting fireflies / glowing dust, shooting stars in the sky, and sparkles on the neon sign: always on, very light */
export function ambient(/** @type {HTMLElement} */ box, /** @type {HTMLElement} */ neon) {
  for (let i = 0; i < 16; i++) {
    const f = document.createElement('span');
    f.className = 'fx-firefly';
    at(f, rnd(4, 96), rnd(30, 96));
    f.style.setProperty('--dx', `${rnd(-40, 40)}px`);
    f.style.setProperty('--dy', `${rnd(-60, -10)}px`);
    f.style.animationDuration = `${rnd(7, 13)}s, ${rnd(1.6, 3.2)}s`;
    f.style.animationDelay = `${-rnd(0, 12)}s, ${-rnd(0, 3)}s`;
    f.style.scale = String(rnd(0.6, 1.3));
    box.appendChild(f);
  }
  const star = () => {
    const s = make('fx-shoot', box, 1400);
    if (s) at(s, rnd(30, 95), rnd(0.5, 5));
    setTimeout(star, rnd(9000, 20000));
  };
  setTimeout(star, 4000);
  setInterval(() => {
    if (document.hidden) return;
    sparkles(neon, rnd(8, 92), rnd(15, 75), 1, 4, pick(['#ffffff', '#ffd1e6', '#c9fbff']));
  }, 900);
}
