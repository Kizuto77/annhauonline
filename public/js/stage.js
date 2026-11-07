// @ts-check
// Sân khấu quán nhậu (trang ?view=stage, nguồn Link trong TikTok LIVE Studio). Mọi sự kiện đến từ server qua SSE;
// trang này chỉ vẽ và nói. Với &preview=1 (khung xem trước trong dashboard) thì im lặng hoàn toàn.
import { listen, el } from './api.js';
import { backSVG, kitchenSVG } from './scene.js';
import { customerSVG, waiterSVG, hostSVG, hostWalkerSVG, dishItem, stoolSVG, tableSVG, giftItem, hash } from './people.js';
import { FREE } from './menu.js';
import { TABLES, SEATS, VIP_SEATS, SEAT_ORDER, NPC_SEATS, personWidth, scaleAt, seatsOfTable } from './layout.js';
import { SoundEngine } from './sound.js';
import { lines } from './lines.js';
import { tellNext } from './stories.js';
import { detectTopic, detectCity, mayAnswer, daoCount } from './chat.js';
import { DISHES } from './dishes.js';
import { readableComment } from './bua.js';
import { tokensOf } from './text.js';
import { livingScene } from './living.js';
import { setupClub } from './club-stage.js';
import { LEVELS } from './levels.js';
import { ambient, beams, fireworks, flyArc, floatUp, hearts, reveal, ring, sparkles, splash } from './effects.js';

const params = new URLSearchParams(location.search);
const PREVIEW = params.get('preview') === '1';

const GREET_EVERY_MS = 6000;
const SHARE_EVERY_MS = 5 * 60 * 1000;
/** The host starts talking after this much silence, and not more often than every TALK_GAP_MS */
const TALK_AFTER_MS = 14 * 1000;
const TALK_GAP_MS = 22 * 1000;
const GIFT_THANKS_GAP_MS = 30 * 1000;
const COMBO_MS = 4500;

/** @typedef {{ id: string; name: string; avatar: string; lv?: number; visits?: number }} User */
/** @typedef {{ seat: number; user?: User; npc: boolean; lastActive: number; dzo: number; el: HTMLElement }} Occupant */

/** @type {any} */
let settings = { channelName: 'Xỉn Bia', keyword: 'dzô', boardTitle: 'TOP CHIẾN HỮU', showBoard: true, voice: 'female_cute', rate: 1.05, autoVoice: true, greet: true, chatReply: true, idleTalk: true, stories: false, storyEvery: 4, music: true, musicVolume: 0.22, ambience: true, foodMinCoins: 1, hotpotMinCoins: 5, smashMinCoins: 30, treatMinCoins: 99, smashEnabled: true, orders: true, seatIdleMin: 10, readChat: true, replyStyle: 'bua', background: '' };
const say = () => lines({ q: settings.channelName, kw: lettersKeyword(), style: settings.replyStyle });
/** The first cheers keyword, the one shown and said */
const firstKeyword = () => String(settings.keyword || 'dzô').split(',')[0].trim() || 'dzô';
const lettersKeyword = () => (firstKeyword() === 'dzo' ? 'dzô' : firstKeyword());

const sound = PREVIEW ? null : new SoundEngine();
/** Lines the host says on her own (greetings, thanks, replies): all muted when "Tự động đọc" is off */
const auto = (/** @type {string | string[]} */ text, first = false) => {
  if (sound && settings.autoVoice) sound.say(text, first);
};

// -------------------------------------------------------------------------------------------- DOM skeleton

const wrap = /** @type {HTMLElement} */ (document.getElementById('app'));
wrap.className = 'stage-page';
const stage = el('div', 'stage');
wrap.appendChild(stage);

const world = el('div', 'world');
const bgLayer = el('div', 'layer');
bgLayer.innerHTML = backSVG();
const customBg = /** @type {HTMLImageElement} */ (el('img', 'layer custom-bg', { alt: '' }));
customBg.hidden = true;
const host = el('div', 'host');
const counter = el('div', 'layer counter kitchen');
counter.innerHTML = kitchenSVG();
const floor = el('div', 'layer floor');
const living = el('div', 'layer living');
// The neon sign hangs on the building, so it moves with the camera
const sign = el('div', 'neon-wrap');
sign.innerHTML = '<div class="neon"></div><div class="neon-sub">QUÁN NHẬU ONLINE</div>';
const wfx = el('div', 'layer wfx'); // effects that live in the room and follow the camera
world.append(bgLayer, living, customBg, sign, host, counter, floor, wfx);
livingScene(living, bgLayer.querySelector('svg'));
stage.appendChild(world);

const fx = el('div', 'layer fx'); // rain, confetti, foam: over the world, under the boards
const ui = el('div', 'layer ui');
stage.append(fx, ui);

ui.innerHTML = `
  <div class="meter meter-rain"><div class="fill"></div><div class="label"></div></div>
  <div class="meter meter-wheel"><div class="fill"></div><div class="label"></div></div>
  <div class="ticker"><div class="ticker-text" id="ticker"></div></div>
  <div class="stats" id="stats"></div>
  <div class="arrive" id="arrive" hidden></div>
  <div class="menu-panel" id="menu-panel"></div>
  <div class="chalkboard" id="board"><div class="chalk-title" id="board-title"></div><ol id="board-list"></ol></div>
  <div class="wheel-box"><div class="wheel-pointer"></div><div class="wheel" id="wheel"></div><div class="wheel-label">VÒNG QUAY MỒI</div></div>
  <div class="gift-banner" id="gift-banner" hidden></div>
  <div class="dish-card" id="dish-card" hidden></div>
  <div class="spot-card" id="spot-card" hidden></div>
  <div class="story-tag" id="story-tag" hidden></div>
  <div class="smash-banner" id="smash-banner" hidden><b>💥 ĐẬP QUÁN! 💥</b><span id="smash-who"></span></div>
  <div class="wave-banner" id="wave-banner" hidden><span>MỘT</span><span>HAI</span><span>BA</span><b>DZÔ!!!</b></div>
  <button class="unlock" id="unlock" hidden>🔊 Bấm vào đây để bật tiếng quán</button>
`;
ambient(fx, sign);
/** Soft bump of the whole room */
const bumpRoom = () => {
  world.classList.remove('bump');
  void world.offsetWidth;
  world.classList.add('bump');
  setTimeout(() => world.classList.remove('bump'), 700);
};
/** Head of a seated person, in room % (for effects) */
const headOf = (/** @type {number} */ seatId) => {
  const st = SEATS[seatId];
  return { x: st.x, y: st.y - personWidth(st.s) * 0.85 };
};
const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (ui.querySelector(`#${id}`));

// Fit the 430 x 764 stage to the window (1080 x 1920 in LIVE Studio)
const fit = () => {
  const z = Math.min(innerWidth / 430, innerHeight / 764);
  stage.style.zoom = String(z);
};
addEventListener('resize', fit);
fit();

// -------------------------------------------------------------------------------------------- tables and seats

/** @type {Map<number, HTMLElement>} */
const tableEls = new Map();
for (const t of TABLES) {
  const e = el('div', `table${t.vip ? ' vip' : ''}`);
  e.style.left = `${t.x}%`;
  e.style.top = `${t.y}%`;
  e.style.width = `${t.w}%`;
  // Height follows the row's depth, not the width, so a long table isn't taller than a short one
  const hPct = 4.22 * (t.s ?? scaleAt(t.y));
  e.style.height = `${hPct}%`;
  e.style.zIndex = String(Math.round(t.y * 10));
  const vbw = Math.round(50 * ((t.w * 4.3) / (hPct * 7.64)));
  e.innerHTML = tableSVG(t.id + 1, Boolean(t.vip), vbw, t.no);
  if (t.vip) e.insertAdjacentHTML('beforeend', '<div class="vip-riser"></div><div class="vip-tag">★ BÀN VIP ★</div>');
  floor.appendChild(e);
  tableEls.set(t.id, e);
}

/** @type {Map<number, Occupant | null>} */
const seats = new Map(SEATS.map((s) => [s.id, null]));
/** @type {Map<string, number>} userId -> seat */
const seatOf = new Map();
/** @type {Map<number, HTMLElement>} */
const stoolEls = new Map();

function placeAt(/** @type {HTMLElement} */ e, /** @type {{ x: number; y: number; s: number }} */ p) {
  e.style.left = `${p.x}%`;
  e.style.top = `${p.y}%`;
  e.style.width = `${personWidth(p.s)}%`;
  e.style.zIndex = String(Math.round(p.y * 10));
}

function showStool(/** @type {number} */ seatId, /** @type {boolean} */ on) {
  let s = stoolEls.get(seatId);
  if (!on) return s?.remove(), stoolEls.delete(seatId);
  if (s) return;
  s = el('div', 'person stool-only');
  s.innerHTML = stoolSVG(seatId);
  placeAt(s, SEATS[seatId]);
  floor.appendChild(s);
  stoolEls.set(seatId, s);
}

/** A person element at a seat; `walk` brings them in from the bottom of the aisle */
function makePerson(/** @type {number} */ seatId, /** @type {User | undefined} */ user, walk = false) {
  const seat = SEATS[seatId];
  const e = el('div', `person${user ? '' : ' npc'}${seat.vip ? ' vip' : ''}${seat.lift ? ' lift' : ''}`);
  e.style.setProperty('--d', `${(-Math.random() * 12).toFixed(2)}s`);
  e.style.setProperty('--sip', `${(8 + Math.random() * 6).toFixed(1)}s`);
  const svg = el('div', 'sprite');
  svg.innerHTML = customerSVG(user ? hash(user.id) : seatId * 977 + 13, { npc: !user });
  if (user) {
    const tag = el('div', 'name-tag');
    if (seat.vip) {
      const rank = el('span', 'rank');
      rank.textContent = String(VIP_SEATS.findIndex((v) => v.id === seatId) + 1);
      tag.appendChild(rank);
    }
    if (user.avatar) {
      const img = /** @type {HTMLImageElement} */ (el('img', '', { alt: '', referrerpolicy: 'no-referrer' }));
      img.src = user.avatar;
      img.onerror = () => img.remove();
      tag.appendChild(img);
    }
    // cấp khách quen: 🥂 khách quen, 🍻 chiến hữu, 😎 dân chơi, 💰 đại gia, 👑 trùm quán, 🐉 huyền thoại
    if ((user.lv ?? 0) >= 2) {
      const lvb = el('span', 'lvb');
      lvb.textContent = LEVELS[Math.min(LEVELS.length, user.lv ?? 1) - 1].icon;
      tag.appendChild(lvb);
    }
    const name = el('span', 'nm');
    name.textContent = user.name;
    tag.appendChild(name);
    e.appendChild(tag);
  }
  e.appendChild(el('div', 'bubble'));
  e.appendChild(svg);
  placeAt(e, seat);
  floor.appendChild(e);
  if (walk) {
    e.classList.add('walking');
    e.style.zIndex = '950';
    const anim = e.animate(
      [
        { left: '50%', top: '108%' },
        { left: '50%', top: `${seat.y + 4}%`, offset: 0.7 },
        { left: `${seat.x}%`, top: `${seat.y}%` },
      ],
      { duration: 2600 + Math.random() * 600, easing: 'ease-in-out' }
    );
    anim.onfinish = () => {
      e.classList.remove('walking');
      e.style.zIndex = String(Math.round(seat.y * 10));
      e.classList.add('arrived');
      setTimeout(() => e.classList.remove('arrived'), 900);
      ring(wfx, seat.x, seat.y - 1, seat.vip ? '#ffd166' : '#8ef0c8', seat.vip ? 52 : 34);
      sparkles(wfx, seat.x, seat.y - personWidth(seat.s) * 0.9, seat.vip ? 8 : 4, 16);
    };
  }
  return e;
}

function leaveSeat(/** @type {number} */ seatId) {
  const occ = seats.get(seatId);
  if (!occ) return;
  if (occ.user) seatOf.delete(occ.user.id);
  occ.el.classList.add('leaving');
  setTimeout(() => occ.el.remove(), 600);
  seats.set(seatId, null);
}

/** @param {number} seatId @param {User | undefined} user */
function occupy(seatId, user, walk = true) {
  leaveSeat(seatId);
  showStool(seatId, false);
  const occ = { seat: seatId, user, npc: !user, lastActive: Date.now(), dzo: 0, el: makePerson(seatId, user, walk && Boolean(user)) };
  seats.set(seatId, occ);
  if (user) seatOf.set(user.id, seatId);
  return occ;
}

// Background customers before anyone joins; free hall seats show an empty stool
for (const s of SEATS) {
  if (s.vip) continue;
  if (NPC_SEATS.has(s.id)) occupy(s.id, undefined, false);
  else showStool(s.id, true);
}
for (const s of VIP_SEATS) showStool(s.id, true);

/**
 * Seat a viewer: their seat if they have one, else a free stool, else a background customer's stool,
 * else (only when `evict`) the seat of whoever has been quiet the longest.
 * @param {User} user
 */
function seatUser(user, evict = false) {
  const have = seatOf.get(user.id);
  if (have !== undefined) {
    const occ = seats.get(have);
    if (occ) {
      occ.lastActive = Date.now();
      if (user.avatar && occ.user && !occ.user.avatar) occ.user.avatar = user.avatar;
      return occ;
    }
  }
  let seatId = SEAT_ORDER.find((id) => !seats.get(id));
  if (seatId === undefined) seatId = SEAT_ORDER.find((id) => seats.get(id)?.npc);
  if (seatId === undefined && evict) {
    let oldest = /** @type {Occupant | null} */ (null);
    for (const id of SEAT_ORDER) {
      const o = seats.get(id);
      if (o && (!oldest || o.lastActive < oldest.lastActive)) oldest = o;
    }
    seatId = oldest?.seat;
  }
  if (seatId === undefined) return null;
  return occupy(seatId, user);
}

/** "🪑 6/32 ghế · 👀 7 đang xem · 🍺 118 ly" under the sign */
let viewersNow = 0;
let cups = 0;
setInterval(() => {
  const seated = everyone().filter((o) => o.user).length;
  $('stats').textContent = `🪑 ${seated}/${SEATS.length} ghế · 👀 ${viewersNow} đang xem · 🍺 ${cups} ly`;
}, 1000);

/** The viewer's occupant if they sit somewhere (and mark them active), else null: does not seat them */
function occOf(/** @type {User} */ user) {
  const at = seatOf.get(user.id);
  const occ = at === undefined ? null : seats.get(at);
  if (occ) occ.lastActive = Date.now();
  return occ ?? null;
}

/**
 * "bàn 3": move to table 3 (or sit there if not seated yet). A free stool first, then a background customer's;
 * a table full of viewers says so.
 */
function moveToTable(/** @type {User} */ user, /** @type {number} */ no) {
  const table = TABLES.find((t) => t.no === no);
  if (!table) return null;
  const here = seatOf.get(user.id);
  if (here !== undefined && SEATS[here].table === table.id) {
    const occ = seats.get(here);
    if (occ) bubble(occ, `Đang ngồi bàn ${no} rồi mà 😆`, 3000);
    return occ ?? null;
  }
  const spots = seatsOfTable(table.id);
  const seat = spots.find((st) => !seats.get(st.id)) ?? spots.find((st) => seats.get(st.id)?.npc);
  if (!seat) {
    const occ = here === undefined ? null : seats.get(here);
    if (occ) bubble(occ, `Bàn ${no} hết chỗ rồi 😅`, 3500);
    auto(say().tableFull(user.name, no));
    return null;
  }
  if (here !== undefined) {
    leaveSeat(here);
    showStool(here, true);
  }
  const occ = occupy(seat.id, user);
  bubble(occ, `🪑 Qua bàn ${no}!`, 3500);
  auto(say().tableMove(user.name, no));
  return occ;
}

/** Nobody tells us who left the live: whoever has been quiet a long time gets up and goes home */
setInterval(() => {
  const limit = (Number(settings.seatIdleMin) || 10) * 60_000;
  const now = Date.now();
  for (const occ of everyone()) {
    if (!occ.user || now - occ.lastActive < limit || smashing) continue;
    bubble(occ, '👋 Về nha cả quán!', 2500);
    const seatId = occ.seat;
    setTimeout(() => {
      if (seats.get(seatId) !== occ) return;
      leaveSeat(seatId);
      showStool(seatId, true);
    }, 2600);
  }
}, 30_000);

/** "Lan vừa tới quán · follow hoặc chat nhậu để vào bàn", one at a time at the top */
/** @type {User[]} */
let arrivals = [];
let arriveBusy = false;
function showArrival(/** @type {User} */ user) {
  if (seatOf.has(user.id) || arrivals.some((a) => a.id === user.id)) return;
  arrivals = [...arrivals, user].slice(-12);
  if (!arriveBusy) nextArrival();
}
function nextArrival() {
  const box = $('arrive');
  const batch = arrivals.splice(0, arrivals.length > 3 ? 3 : 1);
  if (!batch.length) {
    arriveBusy = false;
    box.hidden = true;
    return;
  }
  arriveBusy = true;
  box.innerHTML = '<b></b><span>❤️ follow hoặc chat “nhậu” để vào bàn</span>';
  /** @type {HTMLElement} */ (box.querySelector('b')).textContent = `👋 ${batch.map((u) => u.name).join(', ')} vừa tới quán`;
  box.hidden = false;
  box.classList.remove('in');
  void box.offsetWidth;
  box.classList.add('in');
  setTimeout(nextArrival, 3400);
}

/** VIP table: the top 6 of the board, in rank order (middle of the table first) */
const VIP_ORDER = [VIP_SEATS[1], VIP_SEATS[2], VIP_SEATS[0], VIP_SEATS[3], VIP_SEATS[4], VIP_SEATS[5]].filter(Boolean).map((s) => s.id);
function seatVips(/** @type {Array<{ id: string; name: string; avatar: string }>} */ top) {
  const wanted = top.slice(0, VIP_ORDER.length);
  VIP_ORDER.forEach((seatId, i) => {
    const u = wanted[i];
    const occ = seats.get(seatId);
    if (!u) {
      if (occ) {
        leaveSeat(seatId);
        showStool(seatId, true);
      }
      return;
    }
    if (occ?.user?.id === u.id && occ.user.name === u.name) return;
    // Someone moving up to the VIP table leaves their stool in the hall
    const hall = seatOf.get(u.id);
    if (hall !== undefined && hall !== seatId) {
      leaveSeat(hall);
      showStool(hall, true);
    }
    const former = occ?.user;
    occupy(seatId, { id: u.id, name: u.name, avatar: u.avatar });
    // Whoever lost the VIP seat goes back to the hall if there is room
    if (former && !wanted.some((w) => w.id === former.id)) seatUser(former, false);
  });
}

// -------------------------------------------------------------------------------------------- reactions

function bubble(/** @type {Occupant} */ occ, /** @type {string} */ text, ms = 4500) {
  const b = /** @type {HTMLElement} */ (occ.el.querySelector('.bubble'));
  b.textContent = text;
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
  clearTimeout(/** @type {any} */ (b).__t);
  /** @type {any} */ (b).__t = setTimeout(() => b.classList.remove('show'), ms);
}

function cheer(/** @type {Occupant} */ occ, delay = 0) {
  setTimeout(() => {
    occ.el.classList.remove('cheer');
    void occ.el.offsetWidth;
    occ.el.classList.add('cheer');
    setTimeout(() => occ.el.classList.remove('cheer'), 2600);
  }, delay);
}

const occupantsAt = (/** @type {number} */ tableId) => /** @type {Occupant[]} */ ([...seats.values()].filter((o) => o && SEATS[o.seat].table === tableId));
const everyone = () => /** @type {Occupant[]} */ ([...seats.values()].filter(Boolean));

/** Foam splash or sparkle burst at a point (stage %) */
function burst(/** @type {number} */ x, /** @type {number} */ y, kind = 'foam', n = 14) {
  for (let i = 0; i < n; i++) {
    const p = el('span', `particle ${kind}`);
    const a = Math.random() * Math.PI * 2;
    const d = 20 + Math.random() * 40;
    p.style.left = `${x}%`;
    p.style.top = `${y}%`;
    p.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    p.style.setProperty('--dy', `${Math.sin(a) * d - 25}px`);
    p.style.animationDelay = `${Math.random() * 0.15}s`;
    fx.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}

function confetti(n = 70) {
  const colors = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#f78c6b', '#fff'];
  for (let i = 0; i < n; i++) {
    const c = el('span', 'confetti');
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = `${2.6 + Math.random() * 2.4}s`;
    c.style.animationDelay = `${Math.random() * 1.2}s`;
    c.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    c.style.setProperty('--sx', `${Math.random() * 80 - 40}px`);
    fx.appendChild(c);
    setTimeout(() => c.remove(), 6000);
  }
}

function flash() {
  const f = el('div', 'gold-flash');
  fx.appendChild(f);
  setTimeout(() => f.remove(), 1600);
}

// Items on tables stay a while, then are cleared away
function putOnTable(/** @type {number} */ tableId, /** @type {string} */ svgFragment, ms = 90_000) {
  const svg = tableEls.get(tableId)?.querySelector('.items');
  if (!svg) return;
  const ns = 'http://www.w3.org/2000/svg';
  const w = Number(svg.getAttribute('data-w')) || 100;
  // spread brought items a little so several don't sit on top of each other (the outer group positions,
  // the inner one animates: a CSS animation would override an SVG transform on the same element)
  const n = svg.querySelectorAll('.drop-in').length;
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('transform', `translate(${(w - 100) / 2 + ((n % 3) - 1) * 14} 0)`);
  const inner = document.createElementNS(ns, 'g');
  inner.classList.add('drop-in');
  inner.innerHTML = svgFragment;
  g.appendChild(inner);
  svg.appendChild(g);
  // at most 3 brought items per table
  const brought = svg.querySelectorAll('.drop-in');
  if (brought.length > 3) brought[0].parentElement?.remove();
  setTimeout(() => g.remove(), ms);
}

let waiters = 0;
/** The waiter walks from the counter to a table with `item` on the tray, sets it down and walks back */
/** The host is out on the sidewalk bringing a dish (only one trip at a time: the helpers take the rest) */
let hostOut = false;
const hostKind = () => (String(settings.voice).startsWith('male') ? 'male' : 'female');
/** Kitchen fire up / down, the host stirring the wok */
function setCooking(/** @type {boolean} */ on) {
  counter.classList.toggle('cooking', on);
  host.classList.toggle('cooking', on);
}
function serve(/** @type {number} */ tableId, /** @type {string} */ item, /** @type {() => void} */ onServed) {
  const t = TABLES[tableId];
  // the host brings it herself when she is free, like a real quán; helpers carry the rest
  const byHost = !hostOut && !smashing;
  if (!byHost && waiters >= 3) {
    putOnTable(tableId, item);
    onServed();
    return;
  }
  if (byHost) hostOut = true;
  else waiters++;
  const w = el('div', `waiter walking${byHost ? ' host-walk' : ''}`);
  const load = `<g transform="translate(-24 -13) scale(0.5)">${item}</g>`;
  w.innerHTML = byHost ? hostWalkerSVG(hostKind(), load) : waiterSVG(load);
  if (byHost) host.classList.add('away');
  const sideX = t.x < 50 ? t.x + t.w / 2 + 2 : t.x - t.w / 2 - 2;
  const start = { left: '50%', top: '56%' };
  const path = [start, { left: '50%', top: `${t.y + 1.5}%`, offset: 0.65 }, { left: `${sideX}%`, top: `${t.y + 2}%` }];
  w.style.width = `${7.4 * scaleAt(t.y)}%`;
  w.style.left = start.left;
  w.style.top = start.top;
  w.style.zIndex = '960';
  floor.appendChild(w);
  const dur = 1800 + Math.abs(t.y - 58) * 30;
  w.animate(path, { duration: dur, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {
    w.classList.remove('walking');
    /** @type {HTMLElement} */ (w.querySelector('.tray-load'))?.classList.add('gone');
    putOnTable(tableId, item);
    ring(wfx, t.x, t.y, '#ffd166', 40);
    sparkles(wfx, t.x, t.y - 1.5, 5, 18);
    onServed();
    setTimeout(() => {
      w.classList.add('walking');
      w.animate([...path].reverse(), { duration: dur, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {
        w.remove();
        if (byHost) {
          hostOut = false;
          host.classList.remove('away');
        } else waiters--;
      };
    }, 700);
  };
}

// -------------------------------------------------------------------------------------------- camera close-up

/** @type {Array<{ user: User; seatId: number }>} */
const spotQueue = [];
let spotBusy = false;
function spotlight(/** @type {User} */ user, /** @type {number} */ seatId) {
  if (spotQueue.some((q) => q.user.id === user.id)) return;
  if (spotQueue.length >= 4) return;
  spotQueue.push({ user, seatId });
  runSpotlight();
}
function runSpotlight() {
  if (spotBusy) return;
  const next = spotQueue.shift();
  if (!next) return;
  spotBusy = true;
  const seat = SEATS[seatOf.get(next.user.id) ?? next.seatId];
  const table = TABLES[seat.table];
  const z = 2.1;
  const px = table.x;
  const py = table.y - 4;
  // Keep the zoomed picture covering the whole stage (no empty edges)
  const clamp = (/** @type {number} */ t, /** @type {number} */ p) => Math.min((z - 1) * p, Math.max((1 - z) * (100 - p), t));
  const tx = clamp(50 - px, px);
  const ty = clamp(56 - py, py);
  world.style.transformOrigin = `${px}% ${py}%`;
  world.style.transform = `translate(${tx}%, ${ty}%) scale(${z})`;
  const card = $('spot-card');
  card.replaceChildren();
  if (next.user.avatar) {
    const img = /** @type {HTMLImageElement} */ (el('img', '', { alt: '', referrerpolicy: 'no-referrer' }));
    img.src = next.user.avatar;
    img.onerror = () => img.remove();
    card.appendChild(img);
  }
  const nm = el('span');
  nm.textContent = next.user.name;
  card.append(nm);
  // a big-gift reveal is on screen: show the name card once it has gone
  const showCard = () => (card.hidden = world.style.transform === '');
  if (fx.querySelector('.fx-reveal')) setTimeout(showCard, 3000);
  else card.hidden = false;
  setTimeout(() => {
    world.style.transform = '';
    card.hidden = true;
    setTimeout(() => {
      spotBusy = false;
      runSpotlight();
    }, 2500);
  }, 6000);
}

// -------------------------------------------------------------------------------------------- live events

/** Recent commenters and gift givers, for the share reminder (newest last) */
const recent = new Map();
const noteActive = (/** @type {User} */ u) => {
  recent.delete(u.id);
  recent.set(u.id, { name: u.name, at: Date.now() });
  if (recent.size > 60) recent.delete(recent.keys().next().value);
};

/** Newcomers wait here; every few seconds up to 6 are greeted (3 names per sentence) */
/** @type {User[]} */
let joiners = [];
const greeted = new Set();

/** Viewers this computer has seen before (kept between lives) */
const seenBefore = (() => {
  try {
    return new Set(JSON.parse(localStorage.getItem('xb-seen') || '[]'));
  } catch {
    return new Set();
  }
})();
const rememberViewer = (/** @type {string} */ id) => {
  if (seenBefore.has(id)) return;
  seenBefore.add(id);
  try {
    localStorage.setItem('xb-seen', JSON.stringify([...seenBefore].slice(-1500)));
  } catch {
    // storage blocked: just no "khách quen" lines
  }
};
/** Current TOP board ids, best first */
let topIds = /** @type {string[]} */ ([]);

function onJoin(/** @type {{ user: User }} */ { user }) {
  // coming in is not sitting down: follow or chat "nhậu" for a seat
  showArrival(user);
  if (greeted.has(user.id) || joiners.some((j) => j.id === user.id)) return;
  joiners = [...joiners, user].slice(-30);
}
setInterval(() => {
  if (!sound || !settings.autoVoice || !settings.greet || !joiners.length || sound.waiting() >= 2) return;
  const batch = joiners.splice(0, 6);
  /** @type {User[]} */
  const fresh = [];
  for (const u of batch) {
    greeted.add(u.id);
    if (greeted.size > 5000) greeted.delete(greeted.values().next().value);
    const rank = topIds.indexOf(u.id);
    const back = seenBefore.has(u.id);
    rememberViewer(u.id);
    // someone on the board or a regular gets their own line; the rest are greeted together
    if (rank >= 0 && rank < 6) auto(say().greetVip(u.name, rank + 1));
    else if (back) auto(say().greetBack(u.name));
    else fresh.push(u);
  }
  if (batch.length >= 5 && Math.random() < 0.5) auto(say().crowd());
  for (let i = 0; i < fresh.length; i += 3) auto(say().greet(fresh.slice(i, i + 3).map((u) => u.name)));
}, GREET_EVERY_MS);

function onChat(/** @type {{ user: User; text: string; dzo: boolean; kind?: string }} */ { user, text, dzo, kind }) {
  noteActive(user);
  // "nhậu" anywhere in a comment is asking for a seat; everyone else keeps standing until they do
  const occ = tokensOf(text).includes('nhậu') ? seatUser(user, true) : occOf(user);
  if (occ) {
    // oẳn tù tì, gọi món, tính tiền put up their own bubble (it arrives just before this chat)
    if (!kind || kind === 'game') bubble(occ, dzo && text.length > 30 ? 'Dzô! 🍻' : text);
    const head = headOf(occ.seat);
    const emojis = text.match(/\p{Extended_Pictographic}/gu);
    if (emojis && !dzo) floatUp(wfx, head.x, head.y, [...new Set(emojis)].slice(0, 3), 12);
    if (dzo) {
      cups++;
      cheer(occ);
      setTimeout(() => {
        splash(wfx, head.x + 1.5, head.y + 2, 8);
        floatUp(wfx, head.x, head.y - 1, ['🍻'], 13);
      }, 500);
      occ.dzo++;
      if (occ.dzo >= 3) occ.el.classList.add('tipsy');
      if ([5, 10, 20, 50, 100].includes(occ.dzo) && sound && sound.waiting() < 2) auto(say().dzoMilestone(user.name, occ.dzo));
      sound?.clink(0.45);
      // the table cheers along
      for (const o of occupantsAt(SEATS[occ.seat].table)) if (o !== occ && Math.random() < 0.6) cheer(o, 200 + Math.random() * 500);
    }
  }
  // gọi món, tính tiền, oẳn tù tì, đoán số / kéo co: answered by their own events, not as a chat
  if (kind) return;
  noteChatter(user, dzo);
  const topic = detectTopic(text);
  // "cho thêm 3 em đào": remembered for 15 minutes; their next gift brings 3 glasses of trà đào
  if (topic === 'dao') {
    daoWish.set(user.id, { n: daoCount(text), at: Date.now() });
    if (occ) bubble(occ, `🍑 Gọi ${daoCount(text)} em đào`);
  }
  if (!settings.chatReply) return;
  if (settings.readChat) {
    // "Đọc to comment": every comment is read and answered in turn (a lone "dzô" is cheered, not read)
    if (!(dzo && tokensOf(text).length <= 3)) queueRead(user, text, topic);
    return;
  }
  if (topic) {
    // too many lines waiting already: skip, a late answer is worse than none
    if (sound && sound.waiting() >= 4) return;
    if (mayAnswer(user.id, topic)) {
      chatters.delete(user.id); // answered by name: no need to thank in the group line
      auto(say().reply(topic, user.name, topic === 'city' ? detectCity(text) : '', daoCount(text)));
    }
  } else if (!dzo && sound && sound.waiting() < 2 && Math.random() < 0.25 && mayAck(user.id)) {
    chatters.delete(user.id);
    auto(say().ack(user.name));
  }
}

/** @type {Map<string, { n: number; at: number }>} who asked for "đào", and how many */
const daoWish = new Map();
const DAO_WISH_MS = 15 * 60 * 1000;

/** The host turns to someone: their name tag glows and a soft ring lights up around them */
function spotlightSoft(/** @type {number} */ seatId) {
  const occ = seats.get(seatId);
  if (!occ) return;
  occ.el.classList.add('glow');
  setTimeout(() => occ.el.classList.remove('glow'), 5000);
  const hd = headOf(seatId);
  ring(wfx, hd.x, hd.y + 3, '#8ef0c8', 34);
  floatUp(wfx, hd.x, hd.y, ['💬'], 12);
}

// The room lives on its own: steam from dishes on the tables, neighbours clinking glasses, a laugh here and there
setInterval(() => {
  if (document.hidden) return;
  const withFood = [...tableEls].filter(([, te]) => te.querySelector('.drop-in'));
  if (!withFood.length) return;
  const [id] = withFood[Math.floor(Math.random() * withFood.length)];
  const t = TABLES[id];
  for (let k = 0; k < 2; k++) {
    const e = el('span', 'fx-steam');
    e.style.left = `${t.x + (Math.random() - 0.5) * t.w * 0.6}%`;
    e.style.top = `${t.y - 0.5}%`;
    e.style.setProperty('--dx', `${(Math.random() - 0.5) * 12}px`);
    e.style.animationDelay = `${k * 0.5}s`;
    wfx.appendChild(e);
    setTimeout(() => e.remove(), 3400);
  }
}, 1400);
setInterval(() => {
  if (document.hidden || smashing) return;
  const busy = TABLES.filter((t) => occupantsAt(t.id).length >= 2);
  if (!busy.length) return;
  const t = busy[Math.floor(Math.random() * busy.length)];
  const two = occupantsAt(t.id).sort(() => Math.random() - 0.5).slice(0, 2);
  two.forEach((o, i) => cheer(o, i * 120));
  setTimeout(() => {
    sparkles(wfx, t.x, t.y - 5, 4, 12);
    sound?.clink(0.12);
  }, 700);
  // a background customer says something now and then (never a real viewer: that would put words in their mouth)
  const npc = everyone().filter((o) => o.npc);
  if (npc.length && Math.random() < 0.5) bubble(npc[Math.floor(Math.random() * npc.length)], ['🍻', '😂', 'Dzô!', '🍢', 'Hết mồi rồi!', '🤣', 'Một hai ba dzô!'][Math.floor(Math.random() * 7)], 2600);
}, 6500);

/** Comments waiting to be read aloud: newest kept when the chat runs faster than the voice */
/** @type {Array<{ user: User; text: string; topic: import('./chat.js').Topic | null; at: number }>} */
const toRead = [];
/** @type {Map<string, string>} last comment read per person, so spam ("alo alo alo") is read once */
const lastRead = new Map();
let skipped = 0;
function queueRead(/** @type {User} */ user, /** @type {string} */ raw, /** @type {import('./chat.js').Topic | null} */ topic) {
  const text = readableComment(raw);
  if (!text || lastRead.get(user.id) === text.toLowerCase()) return;
  lastRead.set(user.id, text.toLowerCase());
  if (lastRead.size > 3000) lastRead.delete(lastRead.keys().next().value ?? '');
  chatters.delete(user.id);
  toRead.push({ user, text, topic, at: Date.now() });
  if (toRead.length > 6) {
    toRead.shift();
    skipped++;
  }
}
setInterval(() => {
  if (!sound || !settings.autoVoice || !settings.chatReply || !settings.readChat || smashing) return;
  // greetings and thanks go first; one comment at a time behind them
  if (sound.waiting() >= 1) return;
  const now = Date.now();
  while (toRead.length && now - toRead[0].at > 45_000) {
    toRead.shift();
    skipped++;
  }
  if (skipped >= 8 && now - lastFastNote > 90_000) {
    lastFastNote = now;
    skipped = 0;
    auto(say().fastChat());
    return;
  }
  const next = toRead.shift();
  if (!next) return;
  const city = next.topic === 'city' ? detectCity(next.text) : '';
  auto(say().readComment(next.user.name, next.text, next.topic, city, daoCount(next.text)));
}, 500);

/** People who commented and were not answered by name; thanked together while the chat is busy */
/** @type {Map<string, string>} */
const chatters = new Map();
/** @type {number[]} */
let chatTimes = [];
let lastFastNote = 0;
const noteChatter = (/** @type {User} */ u, /** @type {boolean} */ dzo) => {
  const now = Date.now();
  if (!dzo) chatters.set(u.id, u.name);
  chatTimes = chatTimes.filter((t) => now - t < 20_000);
  chatTimes.push(now);
};
/** Plain acknowledgements: once per person every 6 minutes, once every 15 seconds overall */
/** @type {Map<string, number>} */
const lastAck = new Map();
let lastAckAny = 0;
function mayAck(/** @type {string} */ id) {
  const now = Date.now();
  if (now - lastAckAny < 15_000 || now - (lastAck.get(id) ?? 0) < 6 * 60_000) return false;
  lastAckAny = now;
  lastAck.set(id, now);
  return true;
}
setInterval(() => {
  if (!sound || !settings.autoVoice || !settings.chatReply || smashing || settings.readChat) return;
  const now = Date.now();
  if (chatTimes.length >= 12 && now - lastFastNote > 90_000 && sound.waiting() < 2) {
    lastFastNote = now;
    chatters.clear();
    auto(say().fastChat());
  } else if (chatters.size >= 2 && sound.waiting() < 2) {
    const names = [...chatters.values()].slice(-3);
    chatters.clear();
    auto(say().shoutout(names));
  } else if (chatters.size > 40) chatters.clear();
}, 15_000);

/** @type {Map<string, { at: number; coins: number; count: number; giftName: string; served: number }>} */
const combos = new Map();
/** @type {Map<string, number>} */
const lastThanks = new Map();
const tierOf = (/** @type {number} */ coins) => (coins >= 500 ? 4 : coins >= 99 ? 3 : coins >= 10 ? 2 : 1);
/** @type {ReturnType<typeof setTimeout> | undefined} */
let bannerTimer;


const foldName = (/** @type {string} */ s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
/**
 * What a gift does, by its price (coins each), the same way the server decides:
 * bao cả quán > đập quán > một nồi lẩu > một món ngon > just thanks
 * @returns {'treat' | 'smash' | 'hotpot' | 'food' | ''}
 */
function giftKind(/** @type {number} */ each) {
  if (settings.treatMinCoins > 0 && each >= settings.treatMinCoins) return 'treat';
  if (settings.smashEnabled !== false && settings.smashMinCoins > 0 && each >= settings.smashMinCoins) return 'smash';
  if (settings.orders === false) return '';
  if (settings.hotpotMinCoins > 0 && each >= settings.hotpotMinCoins) return 'hotpot';
  if (settings.foodMinCoins > 0 && each >= settings.foodMinCoins) return 'food';
  return '';
}

/** @type {ReturnType<typeof setTimeout> | undefined} */
let bigWave;

function onGift(/** @type {{ id: string; user: User; giftName: string; coins: number; count: number }} */ g) {
  const { user } = g;
  noteActive(user);
  const now = Date.now();
  const prev = combos.get(user.id);
  const combo = prev && now - prev.at < COMBO_MS && prev.giftName === g.giftName ? prev : { at: now, coins: 0, count: 0, giftName: g.giftName, served: 0 };
  combo.at = now;
  combo.coins += g.coins;
  combo.count += g.count;
  combos.set(user.id, combo);
  const tier = tierOf(combo.coins);

  const occ = seatUser(user, true);
  const kind = giftKind(g.coins / Math.max(1, g.count));
  const icon = { treat: '🎉', smash: '💥', hotpot: '🍲', food: '🍗', '': '🎁' }[kind];
  showBanner(user, g.giftName, combo.count, icon);
  // they asked for "đào" earlier: here they come… as glasses of trà đào
  const wish = daoWish.get(user.id);
  if (wish && now - wish.at < DAO_WISH_MS) {
    daoWish.delete(user.id);
    setTimeout(() => serveDao(user, wish.n), 2600);
  }
  sound?.pop(0.55);
  if (occ) {
    const hd = headOf(occ.seat);
    for (let i = 0; i < Math.min(g.count, 3); i++) {
      setTimeout(() => flyArc(wfx, { x: 50, y: 36 }, hd, icon, 900, () => {
        ring(wfx, hd.x, hd.y + 2, tier >= 3 ? '#ffd166' : '#ff8fc7', 30 + tier * 6);
        sparkles(wfx, hd.x, hd.y, 4 + tier * 2, 16 + tier * 3);
      }), i * 180);
    }
    occ.el.classList.add('glow');
    setTimeout(() => occ.el.classList.remove('glow'), 5000);
    bubble(occ, `🎁 ${g.giftName}${combo.count > 1 ? ` x${combo.count}` : ''}`);
    if (kind === 'food' || kind === 'hotpot') setTimeout(() => spotlight(user, seatOf.get(user.id) ?? occ.seat), 600);
  }
  // A big gift (or a combo adding up to one): gold flash and confetti. "Bao cả quán" and "đập quán" have their own show.
  const before = tierOf(combo.coins - g.coins);
  const grew = tier > before;
  if (tier >= 3 && grew && (kind === 'food' || kind === 'hotpot' || kind === '')) {
    flash();
    confetti(tier >= 4 ? 120 : 60);
    reveal(fx, tier >= 4 ? '💎' : '🍺', user.name, `đã gửi ${g.giftName}${combo.count > 1 ? ` x${combo.count}` : ''}`, tier);
    beams(fx, tier >= 4 ? 5000 : 3500);
    bumpRoom();
    fireworks(fx, tier >= 4 ? 7 : 3);
  }

  // A gift that orders a dish is thanked when the kitchen takes the order; others are thanked here, once per
  // person every 30 s
  if (kind) return;
  const last = lastThanks.get(user.id) ?? 0;
  if (sound && now - last > GIFT_THANKS_GAP_MS && !(tier === 1 && sound.priority.length >= 4)) {
    lastThanks.set(user.id, now);
    setTimeout(() => {
      const c = combos.get(user.id);
      auto(say().gift(user.name, c?.giftName ?? g.giftName, tierOf(c?.coins ?? g.coins)), true);
    }, 1500);
  }
}

/** "Bao cả quán": a big gift, and every busy table gets a hotpot */
function treat(/** @type {User} */ user) {
  if (smashing) return;
  const occ = seatUser(user, true);
  flash();
  confetti(140);
  reveal(fx, '🎉', user.name, 'BAO CẢ QUÁN! Mỗi bàn một nồi lẩu', 4);
  beams(fx, 6000);
  fireworks(fx, 8);
  bumpRoom();
  if (occ) spotlight(user, occ.seat);
  auto(say().treat(user.name), true);
  setCooking(true);
  setTimeout(() => {
    const busy = TABLES.filter((t) => occupantsAt(t.id).length > 0);
    busy.forEach((t, i) =>
      setTimeout(() => {
        serve(t.id, dishItem('hotpot'), () => {
          sound?.clink(0.4);
          for (const o of occupantsAt(t.id)) cheer(o, Math.random() * 300);
        });
        if (i === busy.length - 1) setCooking(false);
      }, i * 450)
    );
    if (!busy.length) setCooking(false);
    setTimeout(() => wave(false), busy.length * 450 + 3500);
  }, 4500);
}

/** n glasses of trà đào to the giver's table, a few waiter trips, and the punchline */
function serveDao(/** @type {User} */ user, /** @type {number} */ n) {
  const at = seatOf.get(user.id);
  if (at === undefined) return;
  const hd = headOf(at);
  floatUp(wfx, hd.x, hd.y, ['🍑', '🍹', '😏'], 13);
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const seat = seatOf.get(user.id);
      if (seat === undefined) return;
      const t = SEATS[seat].table;
      serve(t, giftItem(2, '🍹'), () => {
        sound?.clink(0.35);
        sparkles(wfx, TABLES[t].x, TABLES[t].y - 2, 4, 16, '#ffb3c6');
      });
    }, i * 650);
  }
  const occ = seats.get(at);
  if (occ) bubble(occ, `🍹 ${n} ly trà đào 😂`, 6000);
  auto(say().daoServed(user.name, n), true);
}

function showBanner(/** @type {User} */ user, /** @type {string} */ giftName, /** @type {number} */ count, icon = '') {
  const b = $('gift-banner');
  b.replaceChildren();
  const av = el('div', 'av');
  if (user.avatar) {
    const img = /** @type {HTMLImageElement} */ (el('img', '', { alt: '', referrerpolicy: 'no-referrer' }));
    img.src = user.avatar;
    img.onerror = () => {
      img.remove();
      av.textContent = user.name.slice(0, 1).toUpperCase();
    };
    av.appendChild(img);
  } else av.textContent = user.name.slice(0, 1).toUpperCase();
  const txt = el('div', 'txt');
  const nm = el('b');
  nm.textContent = user.name;
  const gn = el('span');
  gn.textContent = `đã gửi ${giftName}`;
  txt.append(nm, gn);
  const cnt = el('div', 'count');
  cnt.textContent = `x${count}`;
  b.append(av, txt, el('div', 'ico'), cnt);
  if (!b.hidden) {
    cnt.classList.add('bump');
  }
  /** @type {HTMLElement} */ (b.querySelector('.ico')).textContent = icon || '🍺';
  b.hidden = false;
  b.classList.remove('pulse');
  void b.offsetWidth;
  b.classList.add('pulse');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => (b.hidden = true), 4500);
}

const followed = new Set();
function onFollow(/** @type {{ user: User }} */ { user }) {
  const occ = seatUser(user, false);
  if (occ) {
    bubble(occ, '❤️ Đã theo dõi quán');
    const hd = headOf(occ.seat);
    setTimeout(() => {
      floatUp(wfx, hd.x, hd.y, ['❤️', '💖', '💕'], 14);
      ring(wfx, hd.x, hd.y + 2, '#ff4d8d', 36);
      sparkles(wfx, hd.x, hd.y, 6, 18, '#ffb3d1');
      occ.el.classList.add('followed');
      setTimeout(() => occ.el.classList.remove('followed'), 6000);
    }, occ.el.classList.contains('walking') ? 3000 : 400); // just walking in: wait until they sit
  }
  if (followed.has(user.id)) return;
  followed.add(user.id);
  auto(say().follow(user.name));
}

/** "Một, hai, ba, dzô!": the whole quán raises their glasses */
function wave(withVoice = true) {
  if (smashing) return;
  const b = $('wave-banner');
  b.hidden = false;
  b.classList.remove('go');
  void b.offsetWidth;
  b.classList.add('go');
  setTimeout(() => (b.hidden = true), 3600);
  const all = everyone();
  all.forEach((o, i) => cheer(o, 1500 + (i % 12) * 60 + Math.random() * 250));
  setTimeout(() => sound?.cheers(0.7), 1700);
  // at "DZÔ!": foam splashes on every busy table, lights sweep, fireworks
  setTimeout(() => {
    bumpRoom();
    beams(fx, 3600);
    fireworks(fx, 3, [6, 24]);
    for (const t of TABLES) if (occupantsAt(t.id).length) splash(wfx, t.x, t.y - 2, 7);
    sparkles(fx, 50, 37, 10, 90);
  }, 1500);
  if (withVoice) auto(say().wave(), true);
}

/** @type {ReturnType<typeof setTimeout> | undefined} */
let rainTimer;
let rainUntil = 0;
function startRain(/** @type {number} */ leftMs, announce = true) {
  rainUntil = Date.now() + leftMs;
  fx.classList.add('raining');
  if (!fx.querySelector('.bubbles')) {
    const box = el('div', 'bubbles');
    for (let i = 0; i < 46; i++) {
      const b = el('span', 'beer-bubble');
      b.style.left = `${Math.random() * 100}%`;
      const size = 6 + Math.random() * 16;
      b.style.width = b.style.height = `${size}px`;
      b.style.animationDuration = `${5 + Math.random() * 5}s`;
      b.style.animationDelay = `${-Math.random() * 8}s`;
      box.appendChild(b);
    }
    fx.appendChild(box);
  }
  clearTimeout(rainTimer);
  rainTimer = setTimeout(stopRain, leftMs);
  updateMeters();
  if (announce) {
    fireworks(fx, 5);
    beams(fx, 4000, ['rgba(255, 214, 120, 0.34)', 'rgba(255, 236, 170, 0.28)']);
    sound?.ding(0.5);
    auto(say().rain());
  }
}
function stopRain() {
  fx.classList.remove('raining');
  fx.querySelector('.bubbles')?.remove();
  rainUntil = 0;
  updateMeters();
}
// Now and then during the rain somebody cheers
setInterval(() => {
  if (rainUntil < Date.now()) return;
  const all = everyone();
  for (let i = 0; i < 3 && all.length; i++) cheer(all[Math.floor(Math.random() * all.length)]);
}, 2500);

// -------------------------------------------------------------------------------------------- wheel of dishes

const WHEEL_ICONS = ['🦑', '🥜', '🐚', '🍲', '🍢', '🦐', '🍗', '🥭'];
const wheelEl = $('wheel');
wheelEl.innerHTML = WHEEL_ICONS.map((ic, i) => `<span style="--i:${i}">${ic}</span>`).join('');
let wheelTurn = 0;
const seenWheel = new Set();
function spinWheel(/** @type {{ id: string; index: number }} */ w) {
  if (seenWheel.has(w.id)) return;
  seenWheel.add(w.id);
  const dish = DISHES[w.index % DISHES.length];
  wheelTurn += 1440 + Math.floor(Math.random() * 360);
  const box = /** @type {HTMLElement} */ (ui.querySelector('.wheel-box'));
  box.classList.add('spinning');
  setTimeout(() => box.classList.remove('spinning'), 5200);
  wheelEl.style.transform = `rotate(${wheelTurn}deg)`;
  sound?.wheelTicks(3.2);
  setTimeout(() => {
    sound?.ding(0.6);
    const card = $('dish-card');
    card.innerHTML = `<div class="dc-top">🎡 Vòng quay mồi · cho cả quán</div><div class="dc-icon"></div><div class="dc-name"></div><div class="dc-line"></div><div class="dc-foot">Cả phòng thả đủ 99 tim là quay món mới</div>`;
    /** @type {HTMLElement} */ (card.querySelector('.dc-icon')).textContent = dish.icon;
    /** @type {HTMLElement} */ (card.querySelector('.dc-name')).textContent = dish.ten;
    /** @type {HTMLElement} */ (card.querySelector('.dc-line')).textContent = dish.loi;
    card.hidden = false;
    card.classList.remove('pop');
    void card.offsetWidth;
    card.classList.add('pop');
    sparkles(fx, 50, 36, 12, 110);
    confetti(30);
    setTimeout(() => (card.hidden = true), 9000);
    // The dish lands on a few busy tables
    const busy = TABLES.filter((t) => occupantsAt(t.id).length > 0).sort(() => Math.random() - 0.5).slice(0, 4);
    busy.forEach((t, i) =>
      setTimeout(() => {
        putOnTable(t.id, giftItem(2, dish.icon), 60_000);
        burst(t.x, t.y - 3, 'foam', 6);
      }, 400 + i * 350)
    );
    auto(say().wheel(dish));
  }, 3300);
}

// -------------------------------------------------------------------------------------------- boards and meters

/** @type {{ likes: number; likeGoal: number; wheel: number; wheelGoal: number }} */
let meters = { likes: 0, likeGoal: 666, wheel: 0, wheelGoal: 99 };
function updateMeters() {
  const raining = rainUntil > Date.now();
  const rain = /** @type {HTMLElement} */ (ui.querySelector('.meter-rain'));
  /** @type {HTMLElement} */ (rain.querySelector('.fill')).style.width = `${raining ? 100 : Math.min(100, (meters.likes / meters.likeGoal) * 100)}%`;
  /** @type {HTMLElement} */ (rain.querySelector('.label')).textContent = raining ? '🍺 MƯA BỌT BIA – cả quán cụng ly! 🍺' : `❤️ ${meters.likes}/${meters.likeGoal} tim · mưa bọt bia`;
  rain.classList.toggle('on', raining);
  const wheel = /** @type {HTMLElement} */ (ui.querySelector('.meter-wheel'));
  /** @type {HTMLElement} */ (wheel.querySelector('.fill')).style.width = `${Math.min(100, (meters.wheel / meters.wheelGoal) * 100)}%`;
  /** @type {HTMLElement} */ (wheel.querySelector('.label')).textContent = `🎡 ${meters.wheel}/${meters.wheelGoal} tim · quay mồi`;
}

function renderBoard(/** @type {Array<{ id: string; name: string; avatar: string; score: number }>} */ top) {
  topIds = top.map((t) => t.id);
  const list = $('board-list');
  list.replaceChildren();
  if (!top.length) {
    const li = el('li', 'empty');
    li.textContent = 'Comment để lên bảng';
    list.appendChild(li);
  }
  top.slice(0, 10).forEach((e, i) => {
    const li = el('li', i < 3 ? 'top3' : '');
    const n = el('span', 'n');
    n.textContent = String(i + 1);
    const nm = el('span', 'nm');
    nm.textContent = e.name;
    const sc = el('span', 'sc');
    sc.textContent = e.score.toLocaleString('vi-VN');
    li.append(n, nm, sc);
    list.appendChild(li);
  });
  seatVips(top);
}

/** The board on the left: dishes to order by comment, what each gift price brings, how to sit and change table */
let menuKey = '';
function renderGiftMenu() {
  const tiers = /** @type {Array<[number, string, string]>} */ ([
    [settings.orders !== false ? settings.foodMinCoins : 0, 'Món ngon', 'gà nướng, mực, ốc…'],
    [settings.orders !== false ? settings.hotpotMinCoins : 0, 'Lẩu ngẫu nhiên', '🍲 nồi lẩu nóng hổi'],
    [settings.smashEnabled !== false ? settings.smashMinCoins : 0, 'Đập quán', '💥 chủ quán khóc'],
    [settings.treatMinCoins, 'Bao cả quán', '🎉 mỗi bàn một nồi lẩu'],
  ]).filter(([c]) => c > 0);
  const key = JSON.stringify([tiers, settings.orders, lettersKeyword()]);
  if (key === menuKey) return;
  menuKey = key;
  const box = $('menu-panel');
  const free = settings.orders !== false ? FREE : [];
  box.innerHTML = `${free.length ? '<div class="mp-title">🍺 GỌI MÓN · bình luận</div><div class="mp-grid"></div>' : ''}<div class="mp-title gift">🎁 TẶNG QUÀ</div><div class="mp-tiers"></div><div class="mp-foot"><span>❤️ Follow / chat <b>“nhậu”</b> để vào bàn</span><span>🪑 <b>“bàn 3”</b> đổi bàn · <b id="kw"></b> cụng ly</span></div>`;
  const grid = box.querySelector('.mp-grid');
  for (const m of free) {
    const d = el('div', 'mp-item');
    d.textContent = `${m.icon} ${m.short}`;
    grid?.appendChild(d);
  }
  const list = /** @type {HTMLElement} */ (box.querySelector('.mp-tiers'));
  tiers.forEach(([coins, name, note], i) => {
    const r = el('div', `mp-tier t${i}`);
    r.innerHTML = '<b></b><span><i></i><small></small></span>';
    /** @type {HTMLElement} */ (r.querySelector('b')).textContent = `${coins.toLocaleString('vi-VN')} xu`;
    /** @type {HTMLElement} */ (r.querySelector('i')).textContent = name;
    /** @type {HTMLElement} */ (r.querySelector('small')).textContent = note;
    list.appendChild(r);
  });
  $('kw').textContent = `“${lettersKeyword()}”`;
}

function applySettings(/** @type {any} */ s) {
  const voiceChanged = String(s.voice).startsWith('male') !== String(settings.voice).startsWith('male') || !host.innerHTML;
  settings = { ...settings, ...s };
  const neon = /** @type {HTMLElement} */ (sign.querySelector('.neon'));
  neon.textContent = settings.channelName;
  neon.style.fontSize = `${Math.max(26, Math.min(52, 470 / Math.max(6, [...settings.channelName].length)))}px`;
  $('board-title').textContent = settings.boardTitle;
  $('board').hidden = !settings.showBoard;
  renderGiftMenu();
  const custom = Boolean(settings.background);
  customBg.hidden = !custom;
  living.hidden = custom;
  if (custom) customBg.src = settings.background;
  bgLayer.hidden = counter.hidden = host.hidden = custom;
  if (voiceChanged) host.innerHTML = hostSVG(String(settings.voice).startsWith('male') ? 'male' : 'female') + '<div class="host-tag">Chủ quán</div>';
  sound?.apply({ voice: settings.voice, rate: settings.rate, music: settings.music, musicVolume: settings.musicVolume, musicTrack: settings.musicTrack, ambience: settings.ambience });
}

// -------------------------------------------------------------------------------------------- dashboard commands

// -------------------------------------------------------------------------------------------- đập quán

const DEBRIS = ['🍺', '🍗', '🪑', '🍽️', '🥜', '🍾', '🥢', '🧊', '💥', '🥤', '🍢'];
let smashing = false;
/** @type {HTMLElement[]} */
let rubble = [];
const pick = (/** @type {string[]} */ l) => l[Math.floor(Math.random() * l.length)];
const rnd = (/** @type {number} */ a, /** @type {number} */ b) => a + Math.random() * (b - a);

/** Things flying out of the tables, some of which stay on the floor as rubble until swept */
function debris(/** @type {number} */ n, /** @type {number} */ keep) {
  for (let i = 0; i < n; i++) {
    const s = el('span', 'debris');
    s.textContent = DEBRIS[Math.floor(Math.random() * DEBRIS.length)];
    s.style.left = `${rnd(10, 90)}%`;
    s.style.top = `${rnd(52, 82)}%`;
    fx.appendChild(s);
    const dx = rnd(-160, 160);
    const a = s.animate(
      [
        { transform: 'translate(0,0) rotate(0deg) scale(0.6)', opacity: 1 },
        { transform: `translate(${dx * 0.55}px,${-rnd(80, 220)}px) rotate(${rnd(-240, 240)}deg) scale(1.15)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${dx}px,${rnd(20, 90)}px) rotate(${rnd(-540, 540)}deg) scale(1)`, opacity: 1 },
      ],
      { duration: rnd(1100, 1900), easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'forwards', delay: rnd(0, 350) }
    );
    if (i < keep) {
      s.classList.add('rubble');
      rubble.push(s);
      a.onfinish = () => {
        s.style.left = `calc(${s.style.left} + ${dx}px)`;
        s.style.top = `calc(${s.style.top} + ${rnd(20, 90)}px)`;
        a.cancel();
        s.style.transform = `rotate(${rnd(-90, 90)}deg)`;
      };
    } else a.onfinish = () => s.remove();
  }
}

/** The pub is smashed: chaos, the owner cries, then tidies everything back */
function smash(/** @type {{ user: User; ms?: number }} */ { user }) {
  if (smashing) return;
  smashing = true;
  // the smash is the show: drop a big-gift reveal and its wave
  clearTimeout(bigWave);
  fx.querySelector('.fx-reveal')?.remove();
  const total = 14_000;
  const t = (/** @type {number} */ ms, /** @type {() => void} */ fn) => setTimeout(fn, ms);
  const all = everyone();
  const banner = $('smash-banner');
  $('smash-who').textContent = `${user.name} vừa đập quán!`;
  banner.hidden = false;
  banner.classList.remove('go');
  void banner.offsetWidth;
  banner.classList.add('go');
  t(3200, () => (banner.hidden = true));

  // 0 s: BANG
  const f = el('div', 'red-flash');
  fx.appendChild(f);
  t(1500, () => f.remove());
  world.classList.add('quake');
  t(2100, () => world.classList.remove('quake'));
  sound?.crash(0.8);
  debris(46, 16);
  for (const [id, te] of tableEls) {
    te.style.setProperty('--r', `${rnd(-14, 14).toFixed(1)}deg`);
    te.style.setProperty('--tx', `${rnd(-7, 7).toFixed(1)}px`);
    te.style.setProperty('--ty', `${rnd(-3, 5).toFixed(1)}px`);
    t(id * 70, () => te.classList.add('wrecked'));
  }
  all.forEach((o, i) => {
    t(150 + i * 25, () => {
      o.el.classList.add('panic');
      if (i % 3 === 0) bubble(o, pick(['😱', 'Trời ơi!', '🍺💥', 'Chạy đi!', 'Á!']), 3500);
    });
  });
  host.classList.add('crying');
  const tag = host.querySelector('.host-tag');
  if (tag) tag.textContent = 'Chủ quán 😭';
  auto(say().smash(user.name), true);

  // ~9 s: everyone calms down, owner sobs
  t(4500, () => all.forEach((o) => o.el.classList.remove('panic')));

  // ~15 s: tidy up
  t(6500, () => {
    auto(say().smashClean(), true);
    host.classList.remove('crying');
    if (tag) tag.textContent = 'Chủ quán';
    // the broom goes back and forth; rubble disappears where it passes
    const broom = el('span', 'broom');
    broom.textContent = '🧹';
    fx.appendChild(broom);
    const rows = [74, 82, 90, 78];
    const frames = rows.flatMap((top, i) => [
      { left: i % 2 ? '92%' : '4%', top: `${top}%` },
      { left: i % 2 ? '4%' : '92%', top: `${top}%` },
    ]);
    broom.animate(frames.map((fr, i) => ({ ...fr, offset: i / (frames.length - 1) })), { duration: 4000, easing: 'ease-in-out', fill: 'forwards' });
    t(4100, () => broom.remove());
    rubble.forEach((r, i) => t(rnd(300, 3800) + i * 10, () => {
      r.classList.add('gone');
      setTimeout(() => r.remove(), 600);
    }));
    rubble = [];
    // the tables stand up again, one by one
    [...tableEls].forEach(([id, te], i) => t(700 + i * 220, () => {
      te.classList.remove('wrecked');
      const at = TABLES[id];
      burst(at.x, at.y - 4, 'gold', 8);
    }));
  });

  // ~26 s: all done
  t(total - 2500, () => {
    sound?.ding(0.5);
    flash();
    all.forEach((o, i) => cheer(o, i * 40));
    auto(say().smashDone(), true);
  });
  t(total, () => {
    smashing = false;
    for (const te of tableEls.values()) te.classList.remove('wrecked');
    for (const r of rubble) r.remove();
    rubble = [];
  });
}

function onControl(/** @type {{ action: string; text: string }} */ { action, text }) {
  if (action === 'clearHall') {
    for (const [id, occ] of seats) {
      if (occ?.user && !SEATS[id].vip) {
        leaveSeat(id);
        if (NPC_SEATS.has(id)) occupy(id, undefined, false);
        else showStool(id, true);
      }
    }
    return;
  }
  if (!sound) return;
  if (action === 'unlockAudio') sound.unlock();
  if (action === 'speak') sound.say(text, true); // "Đọc ngay" works even with Tự động đọc off
  if (action === 'share') sound.say(say().share(recentNames()), true);
  if (action === 'story') tellStory(true);
  if (action === 'testGift') sound.say(say().gift('Minh An', 'Rose', 1), true);
  if (action === 'testGreet') sound.say(say().greet(['Minh An', 'Thu Hà', 'Quốc Bảo']), true);
  if (action === 'testFollow') sound.say(say().follow('Minh An'), true);
  if (action === 'testChat') sound.say(say().readComment('Minh An', 'hôm nay sinh nhật mình nè mọi người ơi', 'birthday'), true);
}

const recentNames = () =>
  [...recent.values()]
    .filter((r) => Date.now() - r.at < SHARE_EVERY_MS)
    .map((r) => r.name)
    .reverse()
    .slice(0, 3);

/** The host tells a story / joke / fact / riddle, then asks for a like, share, follow or gift */
let lastStoryAt = Date.now();
function tellStory(force = false) {
  if (!sound) return;
  if (!force && (!settings.stories || !settings.autoVoice || smashing || sound.waiting() >= 3)) return;
  lastStoryAt = Date.now();
  const t = tellNext({ q: settings.channelName, kw: lettersKeyword() });
  if (t.title) showStoryTag(t.title);
  sound.say(t.lines, force);
  if (t.after) {
    const text = t.after.text;
    setTimeout(() => {
      if (sound) sound.say(text, true);
    }, t.after.ms);
  }
}
/** Small caption on the stage while a story is told */
function showStoryTag(/** @type {string} */ title) {
  const tag = $('story-tag');
  tag.textContent = `📖 ${title}`;
  tag.hidden = false;
  tag.classList.remove('go');
  void tag.offsetWidth;
  tag.classList.add('go');
  setTimeout(() => (tag.hidden = true), 9000);
}

if (sound) {
  // First story a minute after opening, then every `storyEvery` minutes
  setInterval(() => {
    const every = Math.max(1, settings.storyEvery) * 60_000;
    if (Date.now() - lastStoryAt >= every) tellStory();
  }, 10_000);
  setInterval(() => {
    if (settings.idleTalk) auto(say().share(recentNames()));
  }, SHARE_EVERY_MS);
  // When the quán goes quiet the host starts a conversation: with someone who chatted lately (by name), or the room
  let lastTalkAt = 0;
  /** @type {Map<string, number>} */
  const talkedTo = new Map();
  setInterval(() => {
    const now = Date.now();
    if (!settings.idleTalk || !settings.autoVoice || smashing || sound.waiting() > 0) return;
    if (sound.quietFor() < TALK_AFTER_MS || now - lastTalkAt < TALK_GAP_MS) return;
    lastTalkAt = now;
    const people = [...recent.entries()].filter(([id, r]) => now - r.at < 5 * 60_000 && now - (talkedTo.get(id) ?? 0) > 6 * 60_000);
    if (people.length && Math.random() < 0.7) {
      const [id, r] = people[Math.floor(Math.random() * people.length)];
      talkedTo.set(id, now);
      const at = seatOf.get(id);
      if (at !== undefined) spotlightSoft(at);
      auto(settings.replyStyle === 'hien' ? say().greetBack(r.name) : say().talkTo(r.name));
    } else auto(settings.replyStyle === 'hien' ? say().idle() : say().talkRoom());
  }, 3000);
  sound.onSpeaking = (on) => host.classList.toggle('talking', on);
  sound.onBlocked = (b) => ($('unlock').hidden = !b);
  $('unlock').onclick = () => sound.unlock();
}

// -------------------------------------------------------------------------------------------- the real quán

const club = setupClub({
  stage, world, ui, fx, wfx, floor, sign,
  seatUser, seatOf, seats, SEATS, TABLES, headOf, bubble, cheer, occupantsAt, everyone, serve, occOf, setCooking,
  fxs: { ring, sparkles, floatUp, fireworks, beams, splash, confetti, flash },
  sound,
  say: (text, first = false) => auto(text, first),
  smashing: () => smashing,
});

// -------------------------------------------------------------------------------------------- go

listen({
  status: (st) => {
    viewersNow = Number(st?.viewers) || 0;
  },
  hello: (snap) => {
    viewersNow = Number(snap.status?.viewers) || 0;
    applySettings(snap.settings);
    meters = snap.meters;
    if (snap.meters.rainLeft > 0) startRain(snap.meters.rainLeft, false);
    updateMeters();
    renderBoard(snap.board);
    club.restore(snap.club);
  },
  treat: (e) => treat(e.user),
  seat: (e) => {
    if (e.table) return void moveToTable(e.user, e.table);
    const was = seatOf.has(e.user.id);
    const occ = seatUser(e.user, true);
    if (!occ || was) return;
    bubble(occ, '🍻 Nhậu!', 3000);
    putOnTable(SEATS[occ.seat].table, dishItem('drink'), 90_000);
    cups += 2;
    auto(say().sitDown(e.user.name, TABLES[SEATS[occ.seat].table].no));
  },
  order: (e) => club.order(e),
  orders: (e) => club.orders(e),
  orderDone: (e) => club.orderDone(e),
  orderNote: (e) => club.orderNote(e),
  bill: (e) => club.bill(e),
  levelup: (e) => club.levelup(e),
  event: (e) => club.event(e),
  game: (e) => club.game(e),
  gameEnd: (e) => club.gameEnd(e),
  rps: (e) => club.rps(e),
  settings: applySettings,
  board: renderBoard,
  meters: (m) => {
    const more = Math.max(m.likes - meters.likes, m.wheel - meters.wheel);
    if (more > 0) hearts(fx, Math.ceil(Math.min(more, 30) / 3));
    meters = m;
    updateMeters();
  },
  chat: onChat,
  gift: onGift,
  join: onJoin,
  follow: onFollow,
  wave: () => wave(true),
  smash,
  rain: (r) => startRain(r.left),
  wheel: spinWheel,
  control: onControl,
}, PREVIEW ? 'preview' : 'stage');

// For quick checks in the browser console: window.__xb.wave()
/** @type {any} */ (window).__xb = { wave, smash, spinWheel, startRain, seats, spotlight, onGift, onFollow, onChat, sound };

// Dòng nhắc trách nhiệm: đổi câu theo vòng, mỗi câu vừa khít khung
{
  const MSGS = ['🍻 Quán nhậu ảo cho vui, không bán rượu bia', '🚗 Đã uống rượu bia thì không lái xe', '🔞 Dưới 18 tuổi không uống rượu bia', '🎁 Quà tặng chỉ để nhận lời chúc', '💛 Uống có trách nhiệm nha cả nhà'];
  const tk = document.getElementById('ticker');
  let i = 0;
  const show = () => {
    if (!tk) return;
    tk.classList.add('out');
    setTimeout(() => { tk.textContent = MSGS[i++ % MSGS.length]; tk.classList.remove('out'); }, 500);
  };
  show();
  setInterval(show, 5000);
}
