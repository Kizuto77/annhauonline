// @ts-check
// Sân khấu "Nhậu Đêm 134" (trang ?view=stage, nguồn Link trong TikTok LIVE Studio). Mọi sự kiện đến từ server
// qua SSE; trang này chỉ vẽ và nói. Với &preview=1 (khung xem trước trong admin) thì im lặng hoàn toàn.
//
// Luật quán: follow / chat "nhậu" / gọi món / tặng quà là có ghế; "bàn N" đổi bàn; im lâu thì rời bàn.
// Món bình dân comment là có (miễn phí). Quà theo số xu mỗi quà: món ngon, lẩu, đập quán, bao cả quán.
// Chủ quán đứng bếp, nấu xong tự bưng ra tận bàn.
import { listen, el } from './api.js';
import { backSVG, kitchenSVG, finishSVG } from './art/scene.js';
import { peopleDefs, lookOf, seatedSVG, standingSVG, tableSVG, tableBaseSVG, dishSVG, hash } from './art/people.js';
import { TABLES, SEATS, NPC_SEATS, KITCHEN, scaleAt, seatedSize, tableSize } from './art/layout.js';
import { FREE } from './menu.js';
import { SoundEngine } from './sound.js';
import { lines } from './lines.js';
import { orderLines } from './order-lines.js';
import { detectTopic, detectCity, daoCount } from './chat.js';
import { readableComment } from './bua.js';
import { tokensOf } from './text.js';
import { beams, fireworks, flyArc, floatUp, reveal, ring, sparkles, splash } from './effects.js';
import { answerFor } from './answers.js';
import { bigToast, miniToast } from './cheers.js';
import { REGULARS, NPC_TALK, NPC_ORDER, NPC_SERVED } from './npc.js';

const params = new URLSearchParams(location.search);
const PREVIEW = params.get('preview') === '1';

const GREET_EVERY_MS = 6000;
const SHARE_EVERY_MS = 5 * 60 * 1000;
const TALK_AFTER_MS = 8 * 1000;
const TALK_GAP_MS = 14 * 1000;
const DAO_WISH_MS = 15 * 60 * 1000;

/** @typedef {{ id: string; name: string; avatar: string }} User */
/** @typedef {{ seat: number; user?: User; npc: boolean; npcIndex: number; look: import('./art/people.js').Look; lastActive: number; dzo: number; el: HTMLElement; leaving?: boolean }} Occupant */
/** @typedef {{ id: string; ten: string; short: string; icon: string; kind: string }} Item */

/** @type {any} */
let settings = { channelName: 'Nhậu Đêm 134', keyword: 'dzô', boardTitle: 'BẢNG VÀNG', showBoard: true, voice: 'female_cute', voiceGender: 'f', rate: 1.05, autoVoice: true, greet: true, readChat: true, replyStyle: 'bua', idleTalk: true, music: true, musicVolume: 0.22, musicTrack: 'nhau', ambience: true, orders: true, foodMinCoins: 1, hotpotMinCoins: 5, smashMinCoins: 30, treatMinCoins: 99, seatIdleMin: 10, background: '' };
const firstKeyword = () => String(settings.keyword || 'dzô').split(',')[0].trim() || 'dzô';
const kwSaid = () => (firstKeyword() === 'dzo' ? 'dzô' : firstKeyword());
const say = () => lines({ q: settings.channelName, kw: kwSaid(), style: settings.replyStyle });

const sound = PREVIEW ? null : new SoundEngine();
/** Lines the host says on her own: all muted when "Tự động đọc" is off */
const auto = (/** @type {string | string[]} */ text, first = false) => {
  if (sound && settings.autoVoice) sound.say(text, first);
};
const rnd = (/** @type {number} */ a, /** @type {number} */ b) => a + Math.random() * (b - a);
/** @template T @param {T[]} l @returns {T} */
const pick = (l) => l[Math.floor(Math.random() * l.length)];

// -------------------------------------------------------------------------------------------- DOM skeleton

const wrap = /** @type {HTMLElement} */ (document.getElementById('app'));
wrap.className = 'stage-page';
wrap.insertAdjacentHTML('beforeend', peopleDefs());
const stage = el('div', 'stage');
wrap.appendChild(stage);

const world = el('div', 'world');
const bg = el('div', 'layer bg');
bg.innerHTML = backSVG();
const customBg = /** @type {HTMLImageElement} */ (el('img', 'layer custom-bg', { alt: '' }));
customBg.hidden = true;
const wall = el('div', 'layer wall');
const chefHome = el('div', 'chef-home');
const kitchen = el('div', 'layer kitchen');
kitchen.innerHTML = kitchenSVG();
const floor = el('div', 'layer floor');
const street = el('div', 'layer street');
const wfx = el('div', 'layer wfx');
const finish = el('div', 'layer finish');
finish.innerHTML = finishSVG();
world.append(bg, customBg, street, wall, chefHome, kitchen, floor, wfx, finish);
stage.appendChild(world);
const fx = el('div', 'layer fx');
const ui = el('div', 'layer ui');
stage.append(fx, ui);

/** Dây bóng đèn chạy quanh bảng hiệu: bốn dải chấm sáng, chạy vòng như bảng hiệu quán ngoài đường */
const bulbStrips = () => ['t', 'b', 'l', 'r'].map((s) => `<i class="sb-bulb ${s}"></i>`).join('');
wall.innerHTML = `
  <div class="signboard" id="signboard"><div class="sb-glow"></div><div class="sb-main"><span class="sb-name" id="sb-name"></span><span class="sb-num" id="sb-num"></span></div><div class="sb-sub">BIA HƠI · LẨU · NƯỚNG · ĐỒ NHẬU</div>${bulbStrips()}</div>
  <div class="led"><div class="led-track"><span id="led-text"></span></div></div>
  <div class="board menu-board" id="menu-board"></div>
  <div class="board gold-board" id="gold-board"><div class="bd-title" id="board-title">BẢNG VÀNG</div><ol id="board-list"></ol><div class="bd-foot" id="stats"></div></div>
  <div class="tickets" id="tickets"></div>
`;
ui.innerHTML = `
  <div class="wave-banner" id="wave-banner" hidden><span>MỘT</span><span>HAI</span><span>BA</span><b>DZÔ!!!</b></div>
  <div class="smash-banner" id="smash-banner" hidden><b>💥 ĐẬP QUÁN! 💥</b><span id="smash-who"></span></div>
  <div class="treat-banner" id="treat-banner" hidden><b>🍲 BAO CẢ QUÁN! 🍲</b><span id="treat-who"></span></div>
  <button class="unlock" id="unlock" hidden>🔊 Bấm vào đây để bật tiếng quán</button>
`;
const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (stage.querySelector(`#${id}`));

// Fit the 430 x 764 stage to the window (1080 x 1920 in LIVE Studio). A transform scale (not CSS zoom) keeps the
// whole scene on the GPU: zoom re-does layout for every moving thing and makes LIVE Studio stutter.
const fit = () => {
  stage.style.transform = `scale(${Math.min(innerWidth / 430, innerHeight / 764)})`;
};
addEventListener('resize', fit);
fit();

/** Place an element by its bottom-centre point (px in the 430 x 764 stage) */
function place(/** @type {HTMLElement} */ e, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ h, /** @type {number} */ z) {
  e.style.left = `${x - w / 2}px`;
  e.style.top = `${y - h}px`;
  e.style.width = `${w}px`;
  e.style.height = `${h}px`;
  e.style.zIndex = String(z);
}

// -------------------------------------------------------------------------------------------- the cook

/** Cook look follows the voice: a woman for a female voice, a man for a male one */
const chefLook = () => ({ ...lookOf(settings.voiceGender === 'm' ? 'chef-anh' : 'chef-chi', settings.voiceGender === 'm' ? 'm' : 'f'), hairStyle: settings.voiceGender === 'm' ? 'short' : 'bun', cap: '', glasses: false, mouth: 0 });
let chefKey = '';
function drawChef() {
  const key = settings.voiceGender;
  if (key === chefKey) return;
  chefKey = key;
  chefHome.innerHTML = standingSVG(chefLook(), { role: 'chef' });
}
place(chefHome, KITCHEN.x - 6, KITCHEN.y, 41.6, 104, 1);

// -------------------------------------------------------------------------------------------- tables

/** @type {Map<number, { el: HTMLElement; top: HTMLElement }>} */
const tableEls = new Map();
for (const t of TABLES) {
  const { w, h } = tableSize(t.s);
  const e = el('div', 'table');
  place(e, t.x, t.y, w, h, Math.round(t.y * 10));
  e.innerHTML = tableSVG(t.no);
  floor.appendChild(e);
  // things on the table: the jug and napkins, then dishes as they come
  const base = el('div', 'table-base-wrap');
  place(base, t.x, t.y - h * 0.7, w * 0.86, 15 * t.s, Math.round(t.y * 10) + 1);
  base.innerHTML = tableBaseSVG(t.id);
  floor.appendChild(base);
  const top = el('div', 'tabletop');
  place(top, t.x, t.y - h * 0.62, w * 0.96, 28 * t.s, Math.round(t.y * 10) + 2);
  floor.appendChild(top);
  tableEls.set(t.id, { el: e, top });
}

/** Put a dish on a table (4 things at most; the oldest goes). Lặt vặt (đá, khăn lạnh…) take less room. */
function addDish(/** @type {number} */ tableId, /** @type {Item} */ item, ms = 240_000) {
  const t = TABLES[tableId];
  const box = tableEls.get(tableId)?.top;
  if (!box) return;
  const small = item.kind === 'item';
  const d = el('div', `dish-wrap ${item.kind}`);
  d.style.width = `${(small ? 24 : 34) * t.s}px`;
  d.style.height = `${(small ? 20 : 27) * t.s}px`;
  d.style.marginLeft = d.style.marginRight = `${-3 * t.s}px`;
  d.innerHTML = dishSVG(item);
  box.appendChild(d);
  while (box.children.length > 4) box.firstElementChild?.remove();
  setTimeout(() => {
    d.classList.add('gone');
    setTimeout(() => d.remove(), 600);
  }, ms);
}

// -------------------------------------------------------------------------------------------- seats and people

/** @type {Map<number, Occupant | null>} */
const seats = new Map(SEATS.map((s) => [s.id, null]));
/** @type {Map<string, number>} viewer id -> seat */
const seatOf = new Map();
const occupantsAt = (/** @type {number} */ tableId) => /** @type {Occupant[]} */ (TABLES[tableId].seats.map((id) => seats.get(id)).filter((o) => o && !o.leaving));
const everyone = () => /** @type {Occupant[]} */ ([...seats.values()].filter((o) => o && !o.leaving));
const occOf = (/** @type {User} */ u) => {
  const id = seatOf.get(u.id);
  return id === undefined ? null : seats.get(id) ?? null;
};
/** Head of someone sitting, in stage px */
const headOf = (/** @type {number} */ seatId) => {
  const s = SEATS[seatId];
  return { x: s.x + (s.pose === 'side' ? (s.flip ? -1 : 1) * 2 * s.s : 0), y: s.y - 86 * s.s };
};
const pct = (/** @type {{ x: number; y: number }} */ p) => ({ x: (p.x / 430) * 100, y: (p.y / 764) * 100 });

/**
 * The name card over someone's head: their TikTok avatar and name. A viewer's card stays on all the time (the
 * owner wants to see who is at which table); a regular of the quán only gets one while they talk.
 * @param {User | undefined} user @param {string} npcLabel
 */
function tagHTML(user, npcLabel = '') {
  if (!user) return npcLabel ? `<div class="name-tag npc"><span></span></div>` : '';
  return `<div class="name-tag on${user.avatar ? '' : ' noav'}"><i${user.avatar ? '' : ' class="letter"'}></i><span></span></div>`;
}
/** Fill in the card made by tagHTML (text through the DOM, never through innerHTML) */
function fillTag(/** @type {HTMLElement} */ box, /** @type {User | undefined} */ user, /** @type {string} */ npcLabel = '') {
  const tag = /** @type {HTMLElement | null} */ (box.querySelector('.name-tag'));
  if (!tag) return;
  const label = user ? user.name : npcLabel;
  /** @type {HTMLElement} */ (tag.querySelector('span')).textContent = label;
  const slot = /** @type {HTMLElement | null} */ (tag.querySelector('i'));
  if (!slot) return;
  if (user?.avatar) {
    const img = /** @type {HTMLImageElement} */ (el('img', '', { alt: '', referrerpolicy: 'no-referrer', decoding: 'async' }));
    // a broken avatar (link expired, no internet) falls back to the first letter
    img.onerror = () => {
      tag.classList.add('noav');
      slot.classList.add('letter');
      slot.textContent = label.slice(0, 1).toUpperCase();
      img.remove();
    };
    img.src = user.avatar;
    slot.appendChild(img);
  } else slot.textContent = label.slice(0, 1).toUpperCase();
}

function seatedEl(/** @type {number} */ seatId, /** @type {import('./art/people.js').Look} */ look, /** @type {User | undefined} */ user, /** @type {string} */ npcLabel = '') {
  const s = SEATS[seatId];
  const { w, h } = seatedSize(s.s);
  const e = el('div', `sitter${s.flip ? ' flip' : ''}`);
  place(e, s.x, s.y, w, h, s.z);
  e.innerHTML = `<div class="pbody">${seatedSVG(look, s.pose)}</div>${tagHTML(user, npcLabel)}`;
  // two people side by side at the same table: one card a notch higher so the names never sit on top of each other
  if (TABLES[s.table].seats.indexOf(seatId) % 2 === 0) e.style.setProperty('--tagy', '-9px');
  fillTag(e, user, npcLabel);
  e.style.setProperty('--sway', `${rnd(3.4, 5.6).toFixed(2)}s`);
  e.style.setProperty('--delay', `${-rnd(0, 5).toFixed(2)}s`);
  return e;
}

/**
 * Put a walking person at (x, y) = the ground under their feet, scaled by depth. Only `transform` changes, so a
 * step costs the browser nothing but a repaint — moving left/top/width/height every frame is what made walking,
 * serving and the whole scene feel jerky.
 */
function placeWalker(/** @type {HTMLElement} */ e, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) {
  e.style.transform = `translate3d(${(x - 26.8 * s).toFixed(2)}px, ${(y - 134 * s).toFixed(2)}px, 0) scale(${s.toFixed(3)})`;
  const z = String(Math.round(y * 10) + 5);
  if (e.style.zIndex !== z) e.style.zIndex = z;
}

/** Walk a standing person along points; their size and depth follow y. Resolves on arrival. */
function walk(/** @type {HTMLElement} */ e, /** @type {Array<{ x: number; y: number }>} */ pts, speed = 110) {
  return new Promise((done) => {
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      segs.push({ a: pts[i - 1], b: pts[i], len });
      total += len;
    }
    const start = performance.now();
    const ms = (total / speed) * 1000;
    e.classList.add('walking');
    placeWalker(e, pts[0].x, pts[0].y, scaleAt(pts[0].y)); // đứng đúng chỗ ngay, không nhảy một khung hình
    const frame = (/** @type {number} */ now) => {
      let d = Math.min(1, (now - start) / Math.max(1, ms)) * total;
      let p = pts[pts.length - 1];
      for (const sg of segs) {
        if (d <= sg.len) {
          const k = sg.len ? d / sg.len : 1;
          p = { x: sg.a.x + (sg.b.x - sg.a.x) * k, y: sg.a.y + (sg.b.y - sg.a.y) * k };
          break;
        }
        d -= sg.len;
      }
      placeWalker(e, p.x, p.y, scaleAt(p.y));
      if (now - start < ms && e.isConnected) requestAnimationFrame(frame);
      else {
        e.classList.remove('walking');
        done(undefined);
      }
    };
    requestAnimationFrame(frame);
  });
}
const sideOf = (/** @type {number} */ x) => (x < 215 ? -40 : 470);

/** Someone takes a seat. walkIn: they walk in from the street first (a real viewer); NPCs just appear. */
function occupy(/** @type {number} */ seatId, /** @type {User | undefined} */ user, walkIn = true) {
  const s = SEATS[seatId];
  const look = lookOf(user ? user.id : `npc-${seatId}`);
  const npcIndex = user ? -1 : NPC_SEATS.indexOf(seatId);
  const e = seatedEl(seatId, look, user, user ? '' : `${regularName(npcIndex)} · khách quen`);
  /** @type {Occupant} */
  const occ = { seat: seatId, user, npc: !user, npcIndex, look, lastActive: Date.now(), dzo: 0, el: e };
  seats.set(seatId, occ);
  if (user) seatOf.set(user.id, seatId);
  if (!walkIn) {
    floor.appendChild(e);
    return occ;
  }
  const walker = el('div', 'walker');
  walker.innerHTML = `${standingSVG(look)}${tagHTML(user)}`;
  fillTag(walker, user);
  floor.appendChild(walker);
  const from = sideOf(s.x);
  walk(walker, [{ x: from, y: s.y + 10 }, { x: s.x + (from < 0 ? -14 : 14), y: s.y + 8 }, { x: s.x, y: s.y + 2 }]).then(() => {
    walker.remove();
    if (seats.get(seatId) !== occ) return; // moved on meanwhile
    floor.appendChild(e);
    e.classList.add('sit-down', 'named');
    setTimeout(() => e.classList.remove('named'), 6000);
    ring(wfx, pct(headOf(seatId)).x, pct(headOf(seatId)).y + 3, '#ffd166', 30);
  });
  return occ;
}

/** Someone gets up; a viewer walks out to the street, an NPC just fades */
function leaveSeat(/** @type {number} */ seatId, walkOut = true) {
  const occ = seats.get(seatId);
  if (!occ) return;
  seats.set(seatId, null);
  if (occ.user && seatOf.get(occ.user.id) === seatId) seatOf.delete(occ.user.id);
  occ.leaving = true;
  occ.el.remove();
  if (!walkOut) return;
  const s = SEATS[seatId];
  const walker = el('div', 'walker');
  walker.innerHTML = standingSVG(occ.look);
  floor.appendChild(walker);
  walk(walker, [{ x: s.x, y: s.y + 2 }, { x: s.x, y: s.y + 10 }, { x: sideOf(s.x), y: s.y + 12 }]).then(() => walker.remove());
}

/** A free seat: an empty one first (at a table with people, it's livelier), else one an NPC gives up */
function freeSeat(/** @type {number | null} */ tableId = null) {
  const list = tableId === null ? SEATS : TABLES[tableId].seats.map((i) => SEATS[i]);
  const empty = list.filter((s) => !seats.get(s.id));
  if (empty.length) {
    const lively = empty.filter((s) => occupantsAt(s.table).length > 0);
    return pick(lively.length && Math.random() < 0.7 ? lively : empty).id;
  }
  const npc = list.filter((s) => seats.get(s.id)?.npc);
  if (npc.length) return pick(npc).id;
  return null;
}

/** Seat a viewer if they are not seated yet. Full house: the one quiet the longest gives up their seat. */
function seatUser(/** @type {User} */ user, /** @type {number | null} */ tableId = null) {
  if (closedUp) openUp(); // có khách mới là quán mở cửa lại
  const have = occOf(user);
  if (have) {
    have.lastActive = Date.now();
    return { occ: have, fresh: false };
  }
  let seat = freeSeat(tableId);
  if (seat === null && tableId === null) {
    const quiet = everyone().filter((o) => o.user).sort((a, b) => a.lastActive - b.lastActive)[0];
    if (quiet) {
      seat = quiet.seat;
      leaveSeat(seat);
    }
  }
  if (seat === null) return { occ: null, fresh: false };
  if (seats.get(seat)) leaveSeat(seat, false); // an NPC makes room
  return { occ: occupy(seat, user), fresh: true };
}

/** "bàn N": move (or sit) at table N */
function moveToTable(/** @type {User} */ user, /** @type {number} */ no) {
  const t = TABLES.find((x) => x.no === no);
  if (!t) return;
  const cur = occOf(user);
  if (cur && SEATS[cur.seat].table === t.id) return void bubble(cur, `Đang ngồi bàn ${no} rồi!`, 2600);
  const seat = freeSeat(t.id);
  if (seat === null) {
    if (cur) bubble(cur, `Bàn ${no} hết chỗ 😅`, 2600);
    auto(say().tableFull(user.name, no));
    return;
  }
  if (cur) leaveSeat(cur.seat, false);
  if (seats.get(seat)) leaveSeat(seat, false);
  const occ = occupy(seat, user, true);
  occ.lastActive = Date.now();
  auto(cur ? say().tableMove(user.name, no) : say().sitDown(user.name, no));
}

// NPC regulars, so the quán is never empty
for (const id of NPC_SEATS) occupy(id, undefined, false);

// ---------------------------------------------------------------------- hết phiên live: cả quán đứng dậy đi về

/** true từ lúc quán dọn hàng tới lúc có người mới vào bàn (hoặc live bật lại) */
let closedUp = false;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let reopenTimer;
/**
 * Phiên live kết thúc (chủ quán tắt live, mất kết nối hẳn, hay bấm "Dọn quán"): khách đứng dậy khỏi bàn và
 * đi bộ ra đường từng người một, bàn được dọn sạch, khách quen về sau cùng.
 */
function closeUp() {
  if (closedUp) return;
  closedUp = true;
  clearTimeout(reopenTimer);
  sound?.hush();
  auto(say().closeUp(), true);
  led('🧹 QUÁN DỌN HÀNG · CẢM ƠN CẢ NHÀ, HẸN BUỔI LIVE SAU', true);
  const people = everyone();
  people
    .filter((o) => o.user)
    .concat(people.filter((o) => !o.user))
    .forEach((o, i) =>
      setTimeout(() => {
        if (seats.get(o.seat) === o) leaveSeat(o.seat, true);
      }, 500 + i * 220),
    );
  setTimeout(() => {
    for (const t of TABLES) tableEls.get(t.id)?.top.replaceChildren();
  }, 1600 + people.length * 220);
  setTimeout(() => auto(say().closeDone()), 9000);
  // sân khấu để mở suốt đêm: một lúc sau khách quen quay lại cho quán đỡ trống
  reopenTimer = setTimeout(() => openUp(), 120_000);
}
/** Quán mở lại: khách quen về chỗ của họ */
function openUp() {
  clearTimeout(reopenTimer);
  if (!closedUp) return;
  closedUp = false;
  NPC_SEATS.forEach((id, i) => setTimeout(() => !seats.get(id) && occupy(id, undefined, false), i * 400));
}

// Idle viewers leave after seatIdleMin (TikTok never says when someone leaves the live)
setInterval(() => {
  const limit = Math.max(2, Number(settings.seatIdleMin) || 10) * 60_000;
  const now = Date.now();
  for (const o of everyone()) {
    if (o.user && now - o.lastActive > limit) {
      const seat = o.seat;
      leaveSeat(seat);
      // a neighbourhood regular takes the empty stool a bit later, if it is one of theirs
      if (NPC_SEATS.includes(seat)) setTimeout(() => !seats.get(seat) && occupy(seat, undefined, false), 20_000);
    }
  }
}, 15_000);

// -------------------------------------------------------------------------------------------- bubbles, cheers

function bubble(/** @type {Occupant} */ occ, /** @type {string} */ text, ms = 4500) {
  occ.el.querySelector('.bubble')?.remove();
  const b = el('div', 'bubble');
  const name = occ.user ? occ.user.name : npcName(occ);
  b.innerHTML = `${name ? '<b></b>' : ''}<span></span>`;
  if (!occ.user) b.classList.add('npc');
  if (name) /** @type {HTMLElement} */ (b.querySelector('b')).textContent = occ.user ? name : `${name} · khách quen`;
  /** @type {HTMLElement} */ (b.querySelector('span')).textContent = text;
  // bubbles live outside the person (so they are not mirrored and sit above everything)
  const h = headOf(occ.seat);
  b.style.left = `${h.x}px`;
  b.style.top = `${h.y - 4}px`;
  wfx.appendChild(b);
  // while the bubble is up it takes the place of the name card over the head
  occ.el.classList.add('named', 'talking');
  setTimeout(() => {
    b.classList.add('out');
    setTimeout(() => b.remove(), 400);
    occ.el.classList.remove('named', 'talking');
  }, ms);
}
/** A regular's name, capitalised for display ("Chú Tư"); used while seating them, so it must be a hoisted function */
function regularName(/** @type {number} */ k) {
  const n = REGULARS[k] ?? '';
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : '';
}
const npcName = (/** @type {Occupant} */ o) => regularName(o.npcIndex);
/** The regular with this index, if they are sitting in their seat right now */
const npcOcc = (/** @type {number} */ k) => everyone().find((o) => o.npc && o.npcIndex === k) ?? null;
/** "chú Tư bàn 3" for the host's lines */
const npcCall = (/** @type {Occupant} */ o) => `${REGULARS[o.npcIndex]} bàn ${TABLES[SEATS[o.seat].table].no}`;
const npcFill = (/** @type {string} */ line, /** @type {Record<string, string>} */ v) => line.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
/** Is the host free to chat with a regular? Real viewers always come first. */
const hostFree = () => !sound || (sound.waiting() === 0 && toRead.length === 0 && !smashing);

function cheer(/** @type {Occupant} */ occ, delay = 0) {
  setTimeout(() => {
    occ.el.classList.remove('cheer');
    void occ.el.offsetWidth;
    occ.el.classList.add('cheer');
    setTimeout(() => occ.el.classList.remove('cheer'), 2300);
  }, delay);
}

// -------------------------------------------------------------------------------------------- kitchen and serving

let cooking = 0;
function setCooking(/** @type {number} */ n) {
  cooking = n;
  kitchen.classList.toggle('cooking', n > 0);
  chefHome.classList.toggle('cooking', n > 0 && !chefOut);
}
let chefOut = false;
let helpers = 0;
/** @type {Array<{ tableId: number; item: Item; done: () => void }>} */
const serveQueue = [];

/** Where a server stands to put a dish on a table: at its front corner, toward the kitchen */
const servePoint = (/** @type {number} */ tableId) => {
  const t = TABLES[tableId];
  return { x: t.x + (t.x < 215 ? 1 : -1) * 30 * t.s, y: t.y + 9 };
};
async function deliver(/** @type {'chef' | 'waiter'} */ who, /** @type {number} */ tableId, /** @type {Item} */ item, /** @type {() => void} */ done) {
  const look = who === 'chef' ? chefLook() : lookOf(`waiter-${helpers}-${Date.now() % 3}`, 'm');
  const walker = el('div', `walker server ${who}`);
  walker.innerHTML = standingSVG(look, { role: who, carry: dishSVG(item) });
  floor.appendChild(walker);
  const sp = servePoint(tableId);
  const start = who === 'chef' ? { x: KITCHEN.exitX, y: KITCHEN.exitY } : { x: 470, y: 440 };
  await walk(walker, [start, { x: sp.x, y: Math.min(sp.y, 455) }, sp], 125);
  // put it down
  walker.classList.add('put');
  await new Promise((ok) => setTimeout(ok, 380));
  addDish(tableId, item);
  const t = TABLES[tableId];
  sparkles(wfx, pct(t).x, pct({ x: t.x, y: t.y - 30 * t.s }).y, 5, 14);
  sound?.pop(0.3);
  done();
  walker.innerHTML = standingSVG(look, { role: who });
  await new Promise((ok) => setTimeout(ok, 420));
  await walk(walker, [sp, { x: sp.x, y: Math.min(sp.y, 455) }, start], 140);
  walker.remove();
}
function pumpServe() {
  while (serveQueue.length) {
    if (!chefOut) {
      const job = /** @type {(typeof serveQueue)[number]} */ (serveQueue.shift());
      chefOut = true;
      chefHome.classList.add('away');
      chefHome.classList.remove('cooking');
      deliver('chef', job.tableId, job.item, job.done).then(() => {
        chefOut = false;
        chefHome.classList.remove('away');
        setCooking(cooking);
        pumpServe();
      });
    } else if (helpers < 2 && serveQueue.length >= 2) {
      // busy night: the chạy bàn boys help
      const job = /** @type {(typeof serveQueue)[number]} */ (serveQueue.shift());
      helpers++;
      deliver('waiter', job.tableId, job.item, job.done).then(() => {
        helpers--;
        pumpServe();
      });
    } else break;
  }
}
/** Bring a dish to a table; `done` runs when it is on the table */
function serve(/** @type {number} */ tableId, /** @type {Item} */ item, done = () => {}) {
  serveQueue.push({ tableId, item, done });
  pumpServe();
}

/** Order tickets clipped on the wire under the awning */
function renderTickets(/** @type {Array<{ id: string; user: User; item: Item; qty: number; state: string; left: number; ms: number; vip: boolean }>} */ list) {
  const box = $('tickets');
  const show = list.slice(0, 4);
  const keep = new Set(show.map((o) => o.id));
  for (const t of [...box.children]) if (!keep.has(/** @type {HTMLElement} */ (t).dataset.id ?? '')) t.remove();
  for (const o of show) {
    let t = /** @type {HTMLElement | null} */ (box.querySelector(`[data-id="${o.id}"]`));
    if (!t) {
      t = el('div', `ticket${o.vip ? ' vip' : ''}`);
      t.dataset.id = o.id;
      t.innerHTML = '<i></i><b></b><span></span><em><u></u></em>';
      /** @type {HTMLElement} */ (t.querySelector('i')).textContent = o.item.kind === 'hotpot' ? '🔥' : o.vip ? '★' : '•';
      /** @type {HTMLElement} */ (t.querySelector('b')).textContent = `${o.qty > 1 ? `${o.qty} ` : ''}${o.item.short}`;
      /** @type {HTMLElement} */ (t.querySelector('span')).textContent = o.user.name;
      box.appendChild(t);
    }
    const bar = /** @type {HTMLElement} */ (t.querySelector('u'));
    t.classList.toggle('cook', o.state === 'cook');
    if (o.state === 'cook') {
      const done = 1 - o.left / o.ms;
      bar.style.transition = 'none';
      bar.style.width = `${Math.round(done * 100)}%`;
      void bar.offsetWidth;
      bar.style.transition = `width ${o.left}ms linear`;
      bar.style.width = '100%';
    } else bar.style.width = '0%';
  }
  // đá hay khăn lạnh không phải nổi lửa: bếp chỉ bùng khi có món thật đang nấu
  setCooking(list.filter((o) => o.state === 'cook' && o.item.kind !== 'item').length);
}

// -------------------------------------------------------------------------------------------- chat, greetings, reading

/** People who said something lately (for "trò chuyện" and the share reminder) */
/** @type {Map<string, { name: string; at: number }>} */
const recent = new Map();
const noteActive = (/** @type {User} */ u) => {
  recent.delete(u.id);
  recent.set(u.id, { name: u.name, at: Date.now() });
  if (recent.size > 60) recent.delete(recent.keys().next().value ?? '');
  const o = occOf(u);
  if (o) o.lastActive = Date.now();
};
const recentNames = () =>
  [...recent.values()]
    .filter((r) => Date.now() - r.at < SHARE_EVERY_MS)
    .map((r) => r.name)
    .reverse()
    .slice(0, 3);

/** @type {User[]} */
let joiners = [];
const greeted = new Set();
function onJoin(/** @type {{ user: User }} */ { user }) {
  led(`👋 ${user.name} vừa ghé quán`, true);
  if (greeted.has(user.id) || joiners.some((j) => j.id === user.id)) return;
  joiners = [...joiners, user].slice(-30);
}
setInterval(() => {
  if (!sound || !settings.autoVoice || !settings.greet || !joiners.length || sound.waiting() >= 2 || smashing) return;
  const batch = joiners.splice(0, 6);
  for (const u of batch) {
    greeted.add(u.id);
    if (greeted.size > 5000) greeted.delete(greeted.values().next().value);
  }
  if (batch.length >= 5 && Math.random() < 0.5) auto(say().crowd());
  for (let i = 0; i < batch.length; i += 3) auto(say().greet(batch.slice(i, i + 3).map((u) => u.name)));
}, GREET_EVERY_MS);

/** @type {Map<string, { n: number; at: number }>} who asked for "đào", and how many */
const daoWish = new Map();
let cups = 0;

function onChat(/** @type {{ user: User; text: string; dzo: boolean; kind?: string }} */ { user, text, dzo, kind }) {
  noteActive(user);
  const occ = occOf(user);
  if (occ) {
    if (!kind || kind === 'order') bubble(occ, dzo && text.length > 30 ? 'Dzô! 🍻' : text);
    const emojis = text.match(/\p{Extended_Pictographic}/gu);
    const h = pct(headOf(occ.seat));
    if (emojis && !dzo) floatUp(wfx, h.x, h.y, [...new Set(emojis)].slice(0, 3), 12);
    if (dzo) {
      cups++;
      cheer(occ);
      toast(user.name, h);
      occ.dzo++;
      if ([5, 10, 20, 50].includes(occ.dzo) && sound && sound.waiting() < 2) auto(say().dzoMilestone(user.name, occ.dzo));
      for (const o of occupantsAt(SEATS[occ.seat].table)) if (o !== occ && Math.random() < 0.7) cheer(o, 200 + Math.random() * 500);
    }
  }
  // xin ngồi, đổi bàn, gọi món: answered by their own events
  // a viewer without a seat cheering still gets the two glasses in the middle
  if (dzo && !occ) toast(user.name, null);
  if (kind) return;
  const topic = detectTopic(text);
  if (topic === 'dao') {
    daoWish.set(user.id, { n: daoCount(text), at: Date.now() });
    if (occ) setTimeout(() => bubble(occ, `🍑 Gọi ${daoCount(text)} em đào`), 1500);
  }
  const ans = answerFor(text, answerCtx(user));
  if (settings.readChat && !(dzo && tokensOf(text).length <= 3)) queueRead(user, text, topic, ans);
  else if (ans) auto(say().answer(user.name, ans));
}

/** What the quán knows right now, for real answers to questions (answers.js) */
function answerCtx(/** @type {User} */ user) {
  const occ = occOf(user);
  const mine = currentOrders.find((o) => o.user.id === user.id);
  return {
    q: settings.channelName,
    kw: kwSaid(),
    gender: /** @type {'m' | 'f'} */ (settings.voiceGender === 'm' ? 'm' : 'f'),
    now: new Date(),
    seated: everyone().filter((o) => o.user).length,
    viewers: viewersNow,
    myTable: occ ? TABLES[SEATS[occ.seat].table].no : 0,
    top: topName,
    cooking: currentOrders.map((o) => o.item.short),
    myDish: mine ? mine.item.short : '',
    free: FREE.map((m) => m.short),
    tiers: { food: Number(settings.foodMinCoins) || 0, hotpot: Number(settings.hotpotMinCoins) || 0, smash: Number(settings.smashMinCoins) || 0, treat: Number(settings.treatMinCoins) || 0 },
  };
}
/** @type {any[]} orders on the kitchen list (server's orderList) */
let currentOrders = [];
let topName = '';

/** Comments waiting to be read aloud: newest kept when the chat runs faster than the voice */
/** @type {Array<{ user: User; text: string; topic: import('./chat.js').Topic | null; ans: string; at: number }>} */
const toRead = [];
/** @type {Map<string, string>} */
const lastRead = new Map();
let skipped = 0;
let lastFastNote = 0;
function queueRead(/** @type {User} */ user, /** @type {string} */ raw, /** @type {import('./chat.js').Topic | null} */ topic, ans = '') {
  const text = readableComment(raw);
  if (!text || lastRead.get(user.id) === text.toLowerCase()) return;
  lastRead.set(user.id, text.toLowerCase());
  if (lastRead.size > 3000) lastRead.delete(lastRead.keys().next().value ?? '');
  toRead.push({ user, text, topic, ans, at: Date.now() });
  if (toRead.length > 6) {
    toRead.shift();
    skipped++;
  }
}
setInterval(() => {
  if (!sound || !settings.autoVoice || !settings.readChat || smashing) return;
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
  const occ = occOf(next.user);
  if (occ) {
    occ.el.classList.add('glow');
    setTimeout(() => occ.el.classList.remove('glow'), 5000);
  }
  if (next.ans) return auto(say().readAnswer(next.user.name, next.text, next.ans));
  const city = next.topic === 'city' ? detectCity(next.text) : '';
  auto(say().readComment(next.user.name, next.text, next.topic, city, daoCount(next.text)));
}, 500);

// -------------------------------------------------------------------------------------------- seat requests, follow

function onSeat(/** @type {{ user: User; table: number }} */ e) {
  noteActive(e.user);
  if (e.table) return moveToTable(e.user, e.table);
  const { occ, fresh } = seatUser(e.user);
  if (!occ || !fresh) return;
  setTimeout(() => bubble(occ, '🍻 Nhậu thôi!', 3000), 2600);
  auto(say().sitDown(e.user.name, TABLES[SEATS[occ.seat].table].no));
}
const followed = new Set();
function onFollow(/** @type {{ user: User }} */ { user }) {
  noteActive(user);
  if (followed.has(user.id)) return;
  followed.add(user.id);
  const { occ, fresh } = seatUser(user);
  led(`❤️ Cảm ơn ${user.name} đã follow quán!`, true);
  auto(say().follow(user.name));
  if (occ && fresh) auto(say().sitDown(user.name, TABLES[SEATS[occ.seat].table].no));
  if (occ) setTimeout(() => {
    const h = pct(headOf(occ.seat));
    floatUp(wfx, h.x, h.y, ['❤️'], 14);
  }, 2600);
}

// -------------------------------------------------------------------------------------------- orders

/** @param {{ order: { id: string; user: User; item: Item; qty: number; vip: boolean; gift: boolean } }} e */
function onOrder({ order }) {
  if (order.user.id.startsWith('npc-')) {
    const o = npcOcc(Number(order.user.id.slice(4)));
    if (!o) return;
    setTimeout(() => bubble(o, `${order.item.icon} Cho ${order.item.short}!`, 3500), 300);
    if (hostFree() && Math.random() < 0.6) auto(npcFill(pick(NPC_ORDER), { name: npcCall(o), mon: order.item.ten }));
    return;
  }
  noteActive(order.user);
  const { occ } = seatUser(order.user);
  if (occ) setTimeout(() => bubble(occ, `${order.item.icon} ${order.qty > 1 ? `${order.qty} ` : ''}${order.item.short}`, 3500), 400);
  if (order.gift) auto(orderLines.giftOrder(order.user.name, order.item.ten, order.qty, order.item.kind === 'hotpot'), true);
  else if (!sound || sound.waiting() < 3) auto(order.item.kind === 'item' ? orderLines.orderItem(order.user.name, order.item.ten) : orderLines.order(order.user.name, order.item.ten, order.qty, order.vip));
}
/** @param {{ order: { id: string; user: User; item: Item; qty: number; gift: boolean } }} e */
function onOrderDone({ order }) {
  if (order.user.id.startsWith('npc-')) {
    const o = npcOcc(Number(order.user.id.slice(4)));
    if (!o) return;
    serve(SEATS[o.seat].table, order.item, () => {
      cheer(o, 100);
      if (hostFree() && Math.random() < 0.5) auto(npcFill(pick(NPC_SERVED), { name: npcCall(o), mon: order.item.ten }));
    });
    return;
  }
  let occ = occOf(order.user);
  if (!occ) occ = seatUser(order.user).occ;
  if (!occ) return;
  const tableId = SEATS[occ.seat].table;
  const name = order.user.name;
  serve(tableId, order.item, () => {
    const o = occOf(order.user);
    if (o) cheer(o, 100);
    if (sound && sound.waiting() >= 3 && !order.gift) return;
    auto(order.item.kind === 'item' ? orderLines.itemDone(name, order.item.ten) : orderLines.orderDone(name, order.item.ten));
  });
}
function onOrderNote(/** @type {{ kind: string; user: User; item: Item; price?: number }} */ e) {
  // "phải vào bàn mới gọi được món": nhắc riêng, kèm bóng chữ nếu họ đang đứng đâu đó trong quán
  if (e.kind === 'seat') {
    led(`🪑 ${e.user.name} ơi, chat "nhậu" để vào bàn rồi gọi món nha`, true);
    if (sound && sound.waiting() < 3) auto(orderLines.orderNeedSeat(e.user.name, e.item.ten));
    return;
  }
  if (!sound || sound.waiting() >= 3) return;
  if (e.kind === 'paid') auto(orderLines.orderPaid(e.user.name, e.item.ten, e.price ?? 1, e.item.kind === 'hotpot'));
  else if (e.kind === 'busy') auto(orderLines.orderBusy(e.user.name));
  else if (e.kind === 'full') auto(orderLines.orderFull());
}

// -------------------------------------------------------------------------------------------- gifts

/** @type {Map<string, number>} */
const lastThanks = new Map();
/** @param {{ id: string; user: User; giftName: string; coins: number; count: number; each: number; tier: string }} g */
function onGift(g) {
  noteActive(g.user);
  const { occ } = seatUser(g.user);
  const h = occ ? pct(headOf(occ.seat)) : { x: 50, y: 60 };
  const icon = g.tier === 'treat' ? '🍲' : g.tier === 'smash' ? '💥' : g.tier === 'hotpot' ? '🍲' : g.tier === 'food' ? '🍢' : '🎁';
  flyArc(fx, { x: 50, y: 4 }, h, icon, 900, () => {
    ring(fx, h.x, h.y + 3, '#ffd166', 40);
    sparkles(fx, h.x, h.y, 8, 22);
  });
  sound?.ding(0.35);
  led(`🎁 ${g.user.name} tặng ${g.count > 1 ? `${g.count} ` : ''}${g.giftName}`, true);
  if (g.tier === 'hotpot' || g.coins >= 50) {
    reveal(fx, icon, g.user.name, `tặng ${g.count > 1 ? `${g.count} × ` : ''}${g.giftName}`, g.coins >= 99 ? 4 : 3);
    fireworks(fx, g.coins >= 99 ? 6 : 3);
  }
  // "cho thêm 3 em đào" earlier: the gift brings that many glasses of trà đào
  const wish = daoWish.get(g.user.id);
  if (wish && Date.now() - wish.at < DAO_WISH_MS && occ) {
    daoWish.delete(g.user.id);
    serve(SEATS[occ.seat].table, { id: 'trada', ten: 'Trà đào', short: 'Trà đào', icon: '🍑', kind: 'drink' }, () => {
      const o = occOf(g.user);
      if (o) bubble(o, `🍑 ${wish.n} ly trà đào tới rồi!`, 3500);
    });
    auto(say().daoServed(g.user.name, wish.n), true);
  }
  // food, hotpot, smash and treat speak through their own events; a small gift gets thanks (once per 30 s each)
  if (g.tier) return;
  const now = Date.now();
  if (now - (lastThanks.get(g.user.id) ?? 0) < 30_000) return;
  lastThanks.set(g.user.id, now);
  auto(say().gift(g.user.name, g.giftName, 1), true);
  if (occ) cheer(occ, 300);
}

/** 99 xu: a hotpot for every table that has people, the cook and the chạy bàn boys running */
function treat(/** @type {{ user: User }} */ { user }) {
  seatUser(user);
  const b = $('treat-banner');
  /** @type {HTMLElement} */ ($('treat-who')).textContent = `${user.name} bao cả quán`;
  b.hidden = false;
  b.classList.remove('go');
  void b.offsetWidth;
  b.classList.add('go');
  setTimeout(() => (b.hidden = true), 5200);
  beams(fx, 5000);
  fireworks(fx, 8);
  auto(say().treat(user.name), true);
  const busy = TABLES.filter((t) => occupantsAt(t.id).length > 0);
  busy.forEach((t, i) => {
    setTimeout(() => serve(t.id, hotpotAt(i), () => occupantsAt(t.id).forEach((o, k) => cheer(o, k * 120))), 1500 + i * 300);
  });
  setTimeout(() => wave(false), 4000);
}
const HOTPOTS = ['Lẩu thái hải sản', 'Lẩu riêu cua bắp bò', 'Lẩu gà lá é', 'Lẩu bò nhúng giấm', 'Lẩu nấm', 'Lẩu cá kèo lá giang'];
const hotpotAt = (/** @type {number} */ i) => ({ id: `lau${i % 6}`, ten: HOTPOTS[i % 6], short: HOTPOTS[i % 6], icon: '🍲', kind: 'hotpot' });

// -------------------------------------------------------------------------------------------- dzô: two glasses clinking

/** The big clink in the middle at most every 5 s (busy chat: the rest get the small one over their heads) */
let lastBigToast = 0;
function toast(/** @type {string} */ name, /** @type {{ x: number; y: number } | null} */ head) {
  const now = Date.now();
  if (now - lastBigToast > 5000 && !smashing) {
    lastBigToast = now;
    bigToast(fx, name, () => sound?.dzo(0.8));
    if (head) setTimeout(() => miniToast(wfx, head.x, head.y - 1, () => {}), 300);
    return;
  }
  if (head) miniToast(wfx, head.x, head.y - 1, () => sound?.dzo(0.4));
}

// -------------------------------------------------------------------------------------------- dzô wave

let lastWaveAt = 0;
function wave(withVoice = true) {
  if (Date.now() - lastWaveAt < 4000) return;
  lastWaveAt = Date.now();
  const b = $('wave-banner');
  b.hidden = false;
  b.classList.remove('go');
  void b.offsetWidth;
  b.classList.add('go');
  setTimeout(() => (b.hidden = true), 3600);
  if (withVoice) auto(say().wave(), true);
  // the two big glasses meet right on "DZÔ!!!"
  lastBigToast = Date.now();
  setTimeout(() => bigToast(fx, 'Cả quán', () => sound?.dzo(0.9)), 1400 - 650);
  setTimeout(() => {
    everyone().forEach((o) => cheer(o, Math.random() * 400));
    for (let i = 0; i < 4; i++) sound?.dzo(0.25, 0.15 + i * 0.13);
    sound?.cheers(0.5);
    for (const t of TABLES) if (occupantsAt(t.id).length) sparkles(wfx, pct(t).x, pct({ x: t.x, y: t.y - 60 * t.s }).y, 4, 16);
  }, 1400);
}

// -------------------------------------------------------------------------------------------- đập quán

let smashing = false;
function smash(/** @type {{ user: User; ms?: number }} */ { user }) {
  if (smashing) return;
  smashing = true;
  const ms = 15_000;
  seatUser(user);
  sound?.hush();
  auto(say().smash(user.name), true);
  /** @type {HTMLElement} */ ($('smash-who')).textContent = `${user.name} đập quán!`;
  const b = $('smash-banner');
  b.hidden = false;
  b.classList.remove('go');
  void b.offsetWidth;
  b.classList.add('go');
  stage.classList.add('smashing');
  sound?.crash(0.8);
  // tables tip over one after another, glasses and plates fly
  const order = [...TABLES].sort(() => Math.random() - 0.5);
  order.forEach((t, i) =>
    setTimeout(() => {
      const te = tableEls.get(t.id);
      if (!te) return;
      te.el.classList.add('tipped');
      te.el.style.setProperty('--tip', `${pick([-1, 1]) * rnd(14, 26)}deg`);
      te.top.classList.add('tipped');
      for (const o of occupantsAt(t.id)) o.el.classList.add('panic');
      shards(t);
      sound?.crashHit(0.5);
    }, 300 + i * 420),
  );
  chefHome.classList.add('cry');
  setTimeout(() => auto(say().smashClean(), true), 8500);
  // clean up: tables back on their feet, dishes swept away
  setTimeout(() => {
    for (const t of TABLES) {
      const te = tableEls.get(t.id);
      if (!te) continue;
      te.el.classList.remove('tipped');
      te.top.classList.remove('tipped');
      te.top.innerHTML = '';
    }
    for (const o of everyone()) o.el.classList.remove('panic');
    fx.querySelectorAll('.shard').forEach((s) => s.classList.add('gone'));
  }, ms - 3500);
  setTimeout(() => {
    fx.querySelectorAll('.shard').forEach((s) => s.remove());
    stage.classList.remove('smashing');
    chefHome.classList.remove('cry');
    b.hidden = true;
    smashing = false;
    auto(say().smashDone());
  }, ms);
}
/** Bits of a broken table flying out: glass shards, plates, chopsticks, a stool */
function shards(/** @type {(typeof TABLES)[number]} */ t) {
  const kinds = ['glass', 'glass', 'plate', 'chop', 'chop', 'beer', 'stool'];
  for (let i = 0; i < 9; i++) {
    const k = pick(kinds);
    const s = el('span', `shard ${k}`);
    const p = pct({ x: t.x, y: t.y - 30 * t.s });
    s.style.left = `${p.x}%`;
    s.style.top = `${p.y}%`;
    s.style.setProperty('--dx', `${rnd(-70, 70)}px`);
    s.style.setProperty('--dy', `${rnd(-90, -30)}px`);
    s.style.setProperty('--fall', `${rnd(20, 60)}px`);
    s.style.setProperty('--rot', `${rnd(-540, 540)}deg`);
    s.style.animationDelay = `${rnd(0, 0.15)}s`;
    fx.appendChild(s);
  }
}

// -------------------------------------------------------------------------------------------- boards, LED

function renderBoard(/** @type {Array<{ id: string; name: string; score: number; coins: number }>} */ top) {
  topName = top[0]?.name ?? '';
  const list = $('board-list');
  list.innerHTML = '';
  const rows = top.slice(0, 5);
  if (!rows.length) {
    const li = el('li', 'empty');
    li.textContent = 'Comment, tặng quà để lên bảng!';
    list.appendChild(li);
  }
  rows.forEach((e, i) => {
    const li = el('li', `r${i + 1}`);
    li.innerHTML = '<i></i><span></span><b></b>';
    /** @type {HTMLElement} */ (li.querySelector('i')).textContent = ['🥇', '🥈', '🥉', '4', '5'][i];
    /** @type {HTMLElement} */ (li.querySelector('span')).textContent = e.name;
    /** @type {HTMLElement} */ (li.querySelector('b')).textContent = e.score >= 1000 ? `${(e.score / 1000).toFixed(1)}k` : String(e.score);
    list.appendChild(li);
  });
}
let viewersNow = 0;
let likesTotal = 0;
const fmt = (/** @type {number} */ n) => (n >= 10_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
setInterval(() => {
  const seated = everyone().filter((o) => o.user).length;
  $('stats').innerHTML = `<span>🪑 ${seated} khách</span><span>❤️ ${fmt(likesTotal)}</span>${viewersNow ? `<span>👀 ${fmt(viewersNow)}</span>` : ''}`;
}, 1000);

function renderMenu() {
  const s = settings;
  const free = ['lac', 'dauhanh', 'nem', 'khoai', 'dua', 'trung', 'bia'].map((id) => FREE.find((m) => m.id === id)?.short).filter(Boolean);
  const small = FREE.filter((m) => m.kind === 'item').map((m) => m.short);
  const tiers = [
    [s.foodMinCoins, 'Món ngon'],
    [s.hotpotMinCoins, 'Nồi lẩu'],
    [s.smashMinCoins, 'Đập quán'],
    [s.treatMinCoins, 'Bao cả quán'],
  ].filter(([c]) => Number(c) > 0);
  $('menu-board').innerHTML = `
    <div class="bd-title">THỰC ĐƠN</div>
    <div class="mb-body">
      <div class="mb-block">
        <div class="mb-sec">MIỄN PHÍ <em>· gõ tên món</em></div>
        <p class="mb-free">${free.join(' · ')}</p>
      </div>
      <div class="mb-block">
        <div class="mb-sec small">GỌI THÊM <em>· có ngay</em></div>
        <p class="mb-free small">${small.join(' · ')}</p>
      </div>
      <div class="mb-block">
        <div class="mb-sec gift">TẶNG QUÀ <em>· xu mỗi quà</em></div>
        <ul class="mb-gift">${tiers.map(([c, t]) => `<li><b>${c} xu</b><span>${t}</span></li>`).join('')}</ul>
      </div>
    </div>
    <div class="mb-foot">Chat <b>nhậu</b> vào bàn<br/>Chat <b>bàn 1–8</b> đổi bàn</div>`;
}

/** The red LED board over the door: rules and reminders scroll by; news (someone came, a gift) jumps the line */
const LED_BASE = [
  () => `CHÀO MỪNG ĐẾN VỚI ${String(settings.channelName).toUpperCase()}`,
  () => 'CHAT "NHẬU" ĐỂ VÀO BÀN · "BÀN 3" ĐỂ ĐỔI BÀN',
  () => 'GÕ TÊN MÓN LÀ CÓ: ĐẬU LẠC, NEM CHUA, KHOAI CHIÊN… MIỄN PHÍ',
  () => `GÕ "${firstKeyword().toUpperCase()}" ĐỂ CỤNG LY CẢ QUÁN`,
  () => 'QUÁN NHẬU ẢO CHO VUI · KHÔNG BÁN RƯỢU BIA THẬT',
  () => 'ĐÃ UỐNG RƯỢU BIA THÌ KHÔNG LÁI XE',
  () => 'DƯỚI 18 TUỔI KHÔNG UỐNG RƯỢU BIA',
  () => 'QUÀ TẶNG CHỈ ĐỂ NHẬN LỜI CẢM ƠN VÀ MÓN ẢO',
];
/** @type {string[]} */
const ledNews = [];
let ledI = 0;
function led(/** @type {string} */ text, news = false) {
  if (news) {
    ledNews.push(text);
    if (ledNews.length > 4) ledNews.shift();
  }
}
function ledNext() {
  const t = $('led-text');
  const text = ledNews.shift() ?? LED_BASE[ledI++ % LED_BASE.length]();
  t.textContent = text;
  const track = /** @type {HTMLElement} */ (t.parentElement);
  const width = t.offsetWidth;
  track.getAnimations().forEach((a) => a.cancel());
  // short lines stand still in the middle of the board; long ones scroll through
  const box = /** @type {HTMLElement} */ (track.parentElement).clientWidth;
  if (width <= box - 8) {
    const x = `translateX(${Math.round((box - width) / 2)}px)`;
    track.animate([{ transform: x, opacity: 0 }, { transform: x, opacity: 1, offset: 0.06 }, { transform: x, opacity: 1, offset: 0.94 }, { transform: x, opacity: 0 }], { duration: 4200 }).finished.then(ledNext, () => {});
    return;
  }
  const ms = Math.max(4500, (width + box) * 22);
  track.animate([{ transform: `translateX(${box}px)` }, { transform: `translateX(${-width}px)` }], { duration: ms, easing: 'linear' }).finished.then(ledNext, () => {});
}

function applySettings(/** @type {any} */ s) {
  settings = { ...settings, ...s };
  const name = String(settings.channelName || 'Nhậu Đêm 134');
  const m = name.match(/^(.*?)\s*(\d+)$/);
  $('sb-name').textContent = (m ? m[1] : name).toUpperCase();
  $('sb-num').textContent = m ? m[2] : '';
  $('sb-num').hidden = !m;
  $('board-title').textContent = settings.boardTitle;
  $('gold-board').hidden = !settings.showBoard;
  customBg.hidden = !settings.background;
  if (settings.background) customBg.src = settings.background;
  bg.hidden = Boolean(settings.background);
  renderMenu();
  drawChef();
  sound?.apply(settings);
}

// -------------------------------------------------------------------------------------------- the street and the quán live on their own

/** A motorbike passes on the street now and then, headlight first */
function motorbike() {
  const ltr = Math.random() < 0.5;
  const b = el('div', `moto${ltr ? '' : ' rtl'}`);
  const col = pick(['#b71c1c', '#1d1d1f', '#e9e4d8', '#1f4fa3', '#6d6d72']);
  const shirt = pick(['#22304f', '#7b2430', '#d8cfc0', '#2f6b5a', '#1e1f24']);
  b.innerHTML = `<svg viewBox="0 0 80 50" aria-hidden="true"><defs><linearGradient id="hl${ltr ? 1 : 0}" x1="0" x2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity="0.85"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient></defs>
    <path d="M66 30 L120 18 L120 44 Z" fill="url(#hl${ltr ? 1 : 0})" opacity="0.7"/>
    <circle cx="16" cy="40" r="8" fill="#151515"/><circle cx="16" cy="40" r="3.4" fill="#777"/><circle cx="60" cy="40" r="8" fill="#151515"/><circle cx="60" cy="40" r="3.4" fill="#777"/>
    <path d="M12 34 Q20 24 40 26 L54 26 Q62 26 64 34 L58 36 L22 36 Z" fill="${col}"/><path d="M54 26 L60 14 L64 14" stroke="#222" stroke-width="2.4" fill="none"/><circle cx="65" cy="22" r="2.6" fill="#fff9d8"/><rect x="8" y="30" width="5" height="3" fill="#ff3b30"/>
    <path d="M30 26 Q28 12 36 6 L44 8 Q48 16 46 26 Z" fill="${shirt}"/><circle cx="40" cy="3" r="4.6" fill="${pick(['#c62828', '#f2f2f2', '#1d1d1f', '#2e7d32'])}"/><path d="M44 12 L56 16" stroke="${shirt}" stroke-width="3.4" stroke-linecap="round"/><path d="M36 24 L42 34 L40 40" stroke="#2b2b30" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`;
  street.appendChild(b);
  const y = rnd(706, 736);
  const sc = 0.95 + (y - 706) / 100;
  b.style.top = `${y - 50 * sc}px`;
  b.style.width = `${80 * sc}px`;
  b.style.height = `${50 * sc}px`;
  // transform, not left: a bike crossing on `left` re-lays out the street every frame
  b.style.left = '0px';
  const from = ltr ? -120 : 470;
  const to = ltr ? 470 : -120;
  b.animate([{ transform: `translate3d(${from}px, 0, 0)` }, { transform: `translate3d(${to}px, 0, 0)` }], { duration: rnd(3200, 5200), easing: 'linear' }).finished.then(() => b.remove());
  if (!document.hidden) setTimeout(() => sound?.ctx && Math.random() < 0.3 && sound.pop(0.05), 400);
}
setInterval(() => !document.hidden && Math.random() < 0.55 && motorbike(), 7000);

// Steam off the hotpots and hot plates, neighbours clinking glasses, a word from an NPC now and then
setInterval(() => {
  if (document.hidden || smashing) return;
  const withFood = TABLES.filter((t) => tableEls.get(t.id)?.top.children.length);
  for (const t of withFood.slice(0, 4)) {
    const e = el('span', 'fx-steam');
    e.style.left = `${pct(t).x + rnd(-5, 5)}%`;
    e.style.top = `${pct({ x: 0, y: t.y - 30 * t.s }).y}%`;
    e.style.setProperty('--dx', `${rnd(-6, 6)}px`);
    wfx.appendChild(e);
    setTimeout(() => e.remove(), 3000);
  }
}, 1600);
setInterval(() => {
  if (document.hidden || smashing) return;
  const busy = TABLES.filter((t) => occupantsAt(t.id).length >= 2);
  if (!busy.length) return;
  const t = pick(busy);
  occupantsAt(t.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
    .forEach((o, i) => cheer(o, i * 140));
  setTimeout(() => sound?.clink(0.12), 800);
  const npc = everyone().filter((o) => o.npc);
  if (npc.length && Math.random() < 0.2) bubble(pick(npc), pick(['Dzô!', 'Một hai ba dzô!', 'Hết bia rồi!', 'Trăm phần trăm!', 'Mồi ngon ghê', 'Haha', 'Ngồi thêm tí!']), 2600);
}, 6500);

/** A regular says something; the host answers when no viewer is waiting for her */
function onNpc(/** @type {{ k: number; talk: number }} */ e) {
  const o = npcOcc(e.k) ?? null;
  const pair = NPC_TALK[e.talk];
  if (!o || !pair || smashing) return;
  bubble(o, pair[0], 4200);
  if (/dzô/i.test(pair[0])) {
    cheer(o);
    occupantsAt(SEATS[o.seat].table).forEach((x, i) => x !== o && cheer(x, 300 + i * 150));
    const h = pct(headOf(o.seat));
    miniToast(wfx, h.x, h.y - 1, () => sound?.dzo(0.35));
  }
  if (hostFree()) {
    setTimeout(() => {
      if (!hostFree()) return;
      auto(npcFill(pair[1], { name: npcCall(o) }));
      o.el.classList.add('glow');
      setTimeout(() => o.el.classList.remove('glow'), 4000);
    }, 1200);
  }
}

// Hearts from the live float up from the tables
function onLikes(/** @type {{ n: number; total: number }} */ e) {
  likesTotal = Math.max(likesTotal, Number(e.total) || 0);
  const n = Math.min(6, Math.ceil(e.n / 15));
  const people = everyone();
  for (let i = 0; i < n; i++) {
    const o = people.length ? pick(people) : null;
    const h = o ? pct(headOf(o.seat)) : { x: rnd(20, 80), y: 70 };
    setTimeout(() => floatUp(wfx, h.x + rnd(-2, 2), h.y, [pick(['❤️', '💖', '💗', '🧡'])], rnd(10, 15)), i * 160);
  }
}

// -------------------------------------------------------------------------------------------- dashboard controls, idle talk

function onControl(/** @type {{ action: string; text: string }} */ { action, text }) {
  if (action === 'clearHall') {
    for (const o of everyone()) if (o.user) leaveSeat(o.seat);
    setTimeout(() => NPC_SEATS.forEach((id) => !seats.get(id) && occupy(id, undefined, false)), 2500);
    return;
  }
  if (action === 'closeUp') return closeUp();
  if (!sound) return;
  if (action === 'unlockAudio') sound.unlock();
  if (action === 'hush') sound.hush();
  if (action === 'speak') sound.say(text, true); // "Đọc ngay" works even with Tự động đọc off
  if (action === 'share') sound.say(say().share(recentNames()), true);
  if (action === 'testGreet') sound.say(say().greet(['Minh An', 'Thu Hà', 'Quốc Bảo']), true);
}

if (sound) {
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
      const [id, r] = pick(people);
      talkedTo.set(id, now);
      const at = seatOf.get(id);
      const o = at === undefined ? null : seats.get(at);
      if (o) {
        o.el.classList.add('glow');
        setTimeout(() => o.el.classList.remove('glow'), 5000);
      }
      auto(settings.replyStyle === 'hien' ? say().greetBack(r.name) : say().talkTo(r.name));
    } else auto(Math.random() < 0.4 ? say().idle() : settings.replyStyle === 'hien' ? say().idle() : say().talkRoom());
  }, 3000);
  sound.onSpeaking = (on) => chefHome.classList.toggle('talking', on);
  sound.onBlocked = (b) => ($('unlock').hidden = !b);
  $('unlock').onclick = () => sound.unlock();
}

// -------------------------------------------------------------------------------------------- go

listen(
  {
    hello: (snap) => {
      viewersNow = Number(snap.status?.viewers) || 0;
      likesTotal = Number(snap.status?.totalLikes) || 0;
      applySettings(snap.settings);
      renderBoard(snap.board);
      currentOrders = snap.pub?.orders ?? [];
      renderTickets(currentOrders);
    },
    status: (st) => {
      viewersNow = Number(st?.viewers) || 0;
      likesTotal = Math.max(likesTotal, Number(st?.totalLikes) || 0);
    },
    settings: applySettings,
    board: renderBoard,
    chat: onChat,
    join: onJoin,
    follow: onFollow,
    seat: onSeat,
    gift: onGift,
    treat,
    smash,
    wave: () => wave(true),
    order: onOrder,
    orders: (list) => {
      currentOrders = list;
      renderTickets(list);
    },
    npc: onNpc,
    closing: () => closeUp(), // phiên live kết thúc: cả quán đứng dậy đi về
    opening: () => openUp(),
    orderDone: (e) => {
      currentOrders = e.orders;
      renderTickets(e.orders);
      onOrderDone(e);
    },
    orderNote: onOrderNote,
    likes: onLikes,
    control: onControl,
  },
  PREVIEW ? 'preview' : 'stage',
);
// measure LED text only once the web font is in, so short lines sit exactly in the middle
document.fonts.ready.then(ledNext, ledNext);

// For quick checks in the browser console: window.__nd.wave()
/** @type {any} */ (window).__nd = { wave, smash, treat, seats, onGift, onFollow, onChat, onSeat, serve, addDish, sound, motorbike, hash };
