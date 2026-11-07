// @ts-check
// Phần "quán nhậu thật" phía server: khách quen & cấp bậc (lưu qua nhiều buổi live), gọi món & bếp, hóa đơn ảo,
// sự kiện trong quán (giờ vàng, mất điện, mưa bão, người bán dạo, karaoke) và mini game (oẳn tù tì, đoán số, kéo co).
// Server giữ trạng thái để sân khấu, khung xem trước và trang admin luôn khớp nhau.
import fs from 'node:fs';
import { FREE, HOTPOT, PAID } from './public/js/menu.js';
import { tokensOf } from './public/js/text.js';
import { levelFor } from './public/js/levels.js';

/** @typedef {{ id: string; name: string; avatar: string }} User */
/** @typedef {{ name: string; xp: number; visits: number; first: number; last: number; comments: number; coins: number; gifts: number }} Profile */

const fold = (/** @type {string} */ s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const rnd = (/** @type {number} */ a, /** @type {number} */ b) => a + Math.floor(Math.random() * (b - a + 1));

// ------------------------------------------------------------------------------------------------ menu matching
/** @typedef {import('./public/js/menu.js').MenuItem} MenuItem */
/** [phrase, item, free], longest first: "đậu tẩm hành" before "đậu" */
const ALIASES = /** @type {Array<[string, MenuItem, boolean]>} */ ([
  ...FREE.flatMap((m) => m.alias.map((a) => /** @type {[string, MenuItem, boolean]} */ ([a, m, true]))),
  ...[...PAID, ...HOTPOT].flatMap((m) => m.alias.map((a) => /** @type {[string, MenuItem, boolean]} */ ([a, m, false]))),
]).sort((a, b) => b[0].length - a[0].length);
const ORDER_VERBS = new Set(['gọi', 'cho', 'lên', 'order', 'thêm', 'làm', 'kêu', 'xin', 'đặt', 'mang', 'bưng', 'dọn', 'muốn', 'ăn', 'uống', 'nhậu']);
const PORTIONS = new Set(['dĩa', 'đĩa', 'phần', 'nồi', 'tô', 'chén', 'xiên', 'suất', 'ly', 'cốc', 'chai', 'lon', 'cốc', 'bát']);
const NUMBER_WORDS = ['một', 'hai', 'ba', 'bốn', 'năm'];

/**
 * What a comment orders: a free dish ("đậu lạc", "cho dĩa nem chua"), or a paid one it names ("gọi mực nướng").
 * A short comment that is just the name counts; a longer one needs "gọi / cho / lên…" or "dĩa / ly…".
 * @returns {{ item: MenuItem; free: boolean } | null}
 */
function orderedItem(/** @type {string} */ text) {
  const words = tokensOf(text);
  if (!words.length || words.length > 14) return null;
  const asked = words.some((w) => ORDER_VERBS.has(w) || PORTIONS.has(w));
  if (!asked && words.length > 4) return null;
  const joined = ` ${words.join(' ')} `;
  const plain = fold(joined);
  for (const [phrase, item, free] of ALIASES) {
    const multi = phrase.includes(' ');
    // one-word names ("bia", "lạc", "ốc") only with an order word or alone, to leave ordinary chat alone
    if (!multi && !asked && words.length > 2) continue;
    if (joined.includes(` ${phrase} `) || (multi && plain.includes(` ${fold(phrase)} `))) return { item, free };
  }
  return null;
}
/** "2 dĩa", "hai phần": 1 to 5 */
function portions(/** @type {string} */ text) {
  for (const w of tokensOf(text)) {
    if (/^\d$/.test(w)) return Math.max(1, Math.min(5, Number(w)));
    const k = NUMBER_WORDS.indexOf(w);
    if (k >= 0) return k + 1;
  }
  return 1;
}
const wantsBill = (/** @type {string} */ text) => {
  const t = ` ${tokensOf(text).join(' ')} `;
  return [' tính tiền ', ' bill ', ' thanh toán ', ' hóa đơn ', ' hoá đơn ', ' trả tiền ', ' check bill ', ' tinh tien '].some((p) => t.includes(p));
};

// ------------------------------------------------------------------------------------------------ oẳn tù tì
const RPS = /** @type {const} */ (['kéo', 'búa', 'bao']);
/** @returns {'kéo' | 'búa' | 'bao' | null} */
function rpsChoice(/** @type {string} */ text) {
  const words = tokensOf(text);
  const game = words.some((w) => ['oẳn', 'tù', 'tì', 'oan'].includes(w));
  if (!game && words.length > 2) return null;
  if (words.length > 6) return null;
  const found = new Set();
  words.forEach((w, i) => {
    if (w === 'kéo' || w === 'keo') found.add('kéo');
    if (w === 'búa' || w === 'bua') found.add('búa');
    if ((w === 'bao' || w === 'lá') && !['nhiêu', 'giờ', 'lâu', 'nhiu'].includes(words[i + 1] ?? '')) found.add('bao');
  });
  if (/✌/.test(text)) found.add('kéo');
  if (/✊|👊/.test(text)) found.add('búa');
  if (/✋|🖐/.test(text)) found.add('bao');
  return found.size === 1 ? /** @type {any} */ ([...found][0]) : null;
}
const beats = (/** @type {string} */ a, /** @type {string} */ b) => (a === 'kéo' && b === 'bao') || (a === 'búa' && b === 'kéo') || (a === 'bao' && b === 'búa');

/**
 * @param {{
 *   file: string;
 *   broadcast: (event: string, data: unknown) => void;
 *   uid: () => string;
 *   show: (u: User) => Record<string, unknown>;
 *   givePoints: (u: User, points: number) => void;
 *   settings: () => any;
 *   busy: () => boolean;
 * }} o
 */
export function createClub(o) {
  const { broadcast, uid, show } = o;

  // ---------------------------------------------------------------------------------------------- regulars
  /** @type {Map<string, Profile>} */
  const viewers = new Map();
  try {
    const saved = JSON.parse(fs.readFileSync(o.file, 'utf8'));
    for (const [id, p] of Object.entries(saved || {})) if (p && typeof p.xp === 'number') viewers.set(id, /** @type {Profile} */ (p));
  } catch {
    // first run: nobody yet
  }
  let dirty = false;
  setInterval(() => {
    if (!dirty) return;
    dirty = false;
    // khách giả từ nút thử nghiệm không được lưu lại
    const keep = [...viewers.entries()].filter(([id]) => !id.startsWith('demo-')).sort((a, b) => b[1].xp - a[1].xp).slice(0, 20000);
    fs.writeFile(o.file, JSON.stringify(Object.fromEntries(keep)), (err) => err && console.error('Không lưu được viewers.json:', err.message));
  }, 5000);

  /** Hearts, comments and gifts of this live, for the bill */
  /** @type {Map<string, { comments: number; dzo: number; orders: string[]; coins: number; gifts: number }>} */
  const session = new Map();
  const stats = (/** @type {string} */ id) => {
    let s = session.get(id);
    if (!s) session.set(id, (s = { comments: 0, dzo: 0, orders: [], coins: 0, gifts: 0 }));
    return s;
  };
  const seenThisRun = new Set();
  const followedThisRun = new Set();
  /** people who sent a gift during this live: their orders jump the queue */
  const gifters = new Set();

  const profile = (/** @type {User} */ u) => {
    let p = viewers.get(u.id);
    const now = Date.now();
    if (!p) viewers.set(u.id, (p = { name: u.name, xp: 0, visits: 0, first: now, last: now, comments: 0, coins: 0, gifts: 0 }));
    p.name = u.name;
    p.last = now;
    dirty = true;
    return p;
  };
  /** Lifetime points; a new level is celebrated on stage */
  function addXp(/** @type {User} */ u, /** @type {number} */ n) {
    if (!(n > 0)) return;
    const p = profile(u);
    const before = levelFor(p.xp);
    p.xp += n;
    const after = levelFor(p.xp);
    if (after.lv > before.lv && o.settings().levels) broadcast('levelup', { id: uid(), user: show(u), lv: after.lv, name: after.name, icon: after.icon });
  }
  const levelOf = (/** @type {string} */ id) => levelFor(viewers.get(id)?.xp ?? 0).lv;
  const visitsOf = (/** @type {string} */ id) => viewers.get(id)?.visits ?? 0;

  // ---------------------------------------------------------------------------------------------- kitchen
  /** @typedef {{ id: string; user: Record<string, unknown>; uid: string; item: MenuItem; qty: number; state: 'wait' | 'cook'; start: number; ms: number; vip: boolean; gift: boolean }} Order */
  /** @type {Order[]} */
  let orders = [];
  /** @type {Map<string, number>} */
  const lastOrderAt = new Map();
  const orderList = () =>
    orders.map((x) => ({ id: x.id, user: x.user, item: x.item, qty: x.qty, state: x.state, vip: x.vip, left: x.state === 'cook' ? Math.max(0, x.ms - (Date.now() - x.start)) : x.ms, ms: x.ms }));
  function pump() {
    while (orders.filter((x) => x.state === 'cook').length < 3) {
      const next = orders.find((x) => x.state === 'wait');
      if (!next) break;
      next.state = 'cook';
      next.start = Date.now();
      setTimeout(() => {
        orders = orders.filter((x) => x !== next);
        stats(next.uid).orders.push(next.item.short);
        broadcast('orderDone', { order: { id: next.id, user: next.user, item: next.item, qty: next.qty }, orders: orderList() });
        pump();
      }, next.ms);
    }
    broadcast('orders', orderList());
  }
  /** Put an order in the queue: gift orders (paid dishes, hotpots) go before the free ones still waiting */
  function enqueue(/** @type {User} */ u, /** @type {MenuItem} */ item, /** @type {number} */ qty, /** @type {boolean} */ gift) {
    const vip = gift || gifters.has(u.id);
    const ms = (item.kind === 'drink' ? rnd(4, 6) : item.kind === 'hotpot' ? rnd(12, 16) : rnd(8, 12)) * 1000;
    /** @type {Order} */
    const order = { id: uid(), user: show(u), uid: u.id, item, qty, state: 'wait', start: 0, ms, vip, gift };
    if (vip) {
      const firstWaiting = orders.findIndex((x) => x.state === 'wait' && !x.vip);
      orders.splice(firstWaiting < 0 ? orders.length : firstWaiting, 0, order);
    } else orders.push(order);
    broadcast('order', { order: { id: order.id, user: order.user, item, qty, vip, gift } });
    pump();
  }
  function tryOrder(/** @type {User} */ u, /** @type {string} */ text) {
    if (!o.settings().orders) return false;
    const found = orderedItem(text);
    if (!found) return false;
    const s = o.settings();
    if (!found.free) {
      // "gọi mực nướng": that one comes with a gift
      const price = found.item.kind === 'hotpot' ? s.hotpotMinCoins : s.foodMinCoins;
      broadcast('orderNote', { kind: 'paid', user: show(u), item: found.item, price });
      return true;
    }
    const now = Date.now();
    const mine = orders.find((x) => x.uid === u.id && !x.gift);
    if (mine) {
      broadcast('orderNote', { kind: 'busy', user: show(u), item: mine.item });
      return true;
    }
    if (now - (lastOrderAt.get(u.id) ?? 0) < 30_000) return true; // just ate: the comment is still about food
    if (orders.filter((x) => !x.gift).length >= 10) {
      broadcast('orderNote', { kind: 'full', user: show(u), item: found.item });
      return true;
    }
    lastOrderAt.set(u.id, now);
    enqueue(u, found.item, portions(text), false);
    return true;
  }
  /** A gift worth "foodMinCoins" brings a good dish, "hotpotMinCoins" a hotpot (picked at random); `count` portions */
  function giftOrder(/** @type {User} */ u, /** @type {number} */ coinsEach, /** @type {number} */ count) {
    const s = o.settings();
    if (!s.orders) return false;
    const hot = s.hotpotMinCoins > 0 && coinsEach >= s.hotpotMinCoins;
    if (!hot && !(s.foodMinCoins > 0 && coinsEach >= s.foodMinCoins)) return false;
    const list = hot ? HOTPOT : PAID;
    enqueue(u, list[Math.floor(Math.random() * list.length)], Math.min(count, hot ? 3 : 5), true);
    return true;
  }
  /** "bàn 3", "sang bàn 5", "qua bàn số 2": move to a table. "nhậu", "vào bàn", "cho ngồi": sit down */
  function trySeat(/** @type {User} */ u, /** @type {string} */ text) {
    const words = tokensOf(text);
    if (words.length > 8) return '';
    const at = words.indexOf('bàn');
    if (at >= 0) {
      const n = Number(words[at + 1] === 'số' ? words[at + 2] : words[at + 1]);
      if (Number.isInteger(n) && n >= 1 && n <= 8) {
        broadcast('seat', { user: show(u), table: n });
        return 'table';
      }
    }
    if (words.length <= 4 && (words.includes('nhậu') || (words.includes('vào') && words.includes('bàn')) || (words.includes('cho') && words.includes('ngồi')))) {
      broadcast('seat', { user: show(u), table: 0 });
      return 'sit';
    }
    return '';
  }
  /** @type {Map<string, number>} */
  const lastBill = new Map();
  function tryBill(/** @type {User} */ u, /** @type {string} */ text) {
    if (!o.settings().orders || !wantsBill(text)) return false;
    const now = Date.now();
    if (now - (lastBill.get(u.id) ?? 0) < 90_000) return true;
    lastBill.set(u.id, now);
    const s = stats(u.id);
    broadcast('bill', { id: uid(), user: show(u), stats: { ...s, orders: s.orders.slice(-8), level: levelOf(u.id), xp: viewers.get(u.id)?.xp ?? 0 } });
    return true;
  }

  // ---------------------------------------------------------------------------------------------- events
  const EVENT_MS = /** @type {Record<string, number>} */ ({ happy: 180_000, blackout: 12_000, storm: 45_000, vendor: 15_000, karaoke: 16_000 });
  const VENDORS = ['dau', 'bap', 'kem', 'keo'];
  let happyUntil = 0;
  let eventUntil = 0;
  let lastEventAt = Date.now();
  let lastHappyAt = 0;
  const multiplier = () => (Date.now() < happyUntil ? 2 : 1);
  /** @returns {string} '' when started, else why not */
  function startEvent(/** @type {string} */ kind) {
    if (!Object.hasOwn(EVENT_MS, kind)) return 'Sự kiện không có';
    if (o.busy()) return 'Quán đang bị đập, đợi dọn xong nha';
    const now = Date.now();
    if (kind === 'happy') {
      if (now < happyUntil) return 'Đang giờ vàng rồi';
      happyUntil = now + EVENT_MS.happy;
      lastHappyAt = now;
    } else {
      if (now < eventUntil) return 'Đang có sự kiện khác, đợi chút nha';
      eventUntil = now + EVENT_MS[kind];
    }
    lastEventAt = now;
    broadcast('event', { id: uid(), kind, ms: EVENT_MS[kind], extra: kind === 'vendor' ? VENDORS[Math.floor(Math.random() * VENDORS.length)] : '' });
    return '';
  }
  setInterval(() => {
    const s = o.settings();
    const now = Date.now();
    if (!s.autoEvents || now - lastEventAt < s.eventEvery * 60_000) return;
    const kinds = ['blackout', 'storm', 'vendor', 'vendor', 'karaoke', 'karaoke'];
    if (now - lastHappyAt > 20 * 60_000) kinds.push('happy', 'happy');
    startEvent(kinds[Math.floor(Math.random() * kinds.length)]);
  }, 15_000);

  // ---------------------------------------------------------------------------------------------- games
  /** @type {null | { kind: 'guess'; secret: number; lo: number; hi: number; max: number; endsAt: number; last: Array<{ name: string; n: number; hint: string }> } | { kind: 'tug'; a: number; b: number; endsAt: number; teamA: Map<string, User>; teamB: Map<string, User> }} */
  let game = null;
  /** @type {NodeJS.Timeout | undefined} */
  let gameTimer;
  let lastGameAt = Date.now();
  let lastKind = 'tug';
  const gameState = () => {
    if (!game) return null;
    const endsIn = Math.max(0, game.endsAt - Date.now());
    return game.kind === 'guess'
      ? { kind: 'guess', lo: game.lo, hi: game.hi, max: game.max, endsIn, last: game.last }
      : { kind: 'tug', a: game.a, b: game.b, endsIn, na: game.teamA.size, nb: game.teamB.size };
  };
  let gameSendTimer = /** @type {NodeJS.Timeout | null} */ (null);
  const sendGame = () => {
    if (gameSendTimer) return;
    gameSendTimer = setTimeout(() => {
      gameSendTimer = null;
      broadcast('game', gameState());
    }, 300);
  };
  function endGame(/** @type {User | null} */ winner = null) {
    if (!game) return;
    clearTimeout(gameTimer);
    const g = game;
    game = null;
    lastGameAt = Date.now();
    if (g.kind === 'guess') {
      if (winner) o.givePoints(winner, 50);
      broadcast('gameEnd', { kind: 'guess', secret: g.secret, winner: winner ? show(winner) : null });
    } else {
      const team = g.a === g.b ? '' : g.a > g.b ? 'a' : 'b';
      const members = team === 'a' ? [...g.teamA.values()] : team === 'b' ? [...g.teamB.values()] : [];
      for (const m of members) o.givePoints(m, 10);
      broadcast('gameEnd', { kind: 'tug', team, a: g.a, b: g.b, names: members.slice(0, 5).map((m) => show(m).name) });
    }
  }
  /** @returns {string} '' when started */
  function startGame(/** @type {string} */ kind) {
    if (kind === 'stop') {
      if (!game) return 'Không có trò nào đang chơi';
      endGame(null);
      return '';
    }
    if (game) return 'Đang có trò chơi rồi';
    if (o.busy()) return 'Quán đang bị đập, đợi dọn xong nha';
    if (kind === 'guess') {
      const max = 50;
      game = { kind: 'guess', secret: rnd(1, max), lo: 1, hi: max, max, endsAt: Date.now() + 90_000, last: [] };
      gameTimer = setTimeout(() => endGame(null), 90_000);
    } else if (kind === 'tug') {
      game = { kind: 'tug', a: 0, b: 0, endsAt: Date.now() + 45_000, teamA: new Map(), teamB: new Map() };
      gameTimer = setTimeout(() => endGame(null), 45_000);
    } else return 'Trò chơi không có';
    lastKind = kind;
    broadcast('game', { ...gameState(), start: true });
    return '';
  }
  setInterval(() => {
    const s = o.settings();
    if (!s.games || !s.autoGames || game || Date.now() - lastGameAt < s.gameEvery * 60_000) return;
    startGame(lastKind === 'tug' ? 'guess' : 'tug');
  }, 15_000);

  /** @type {Map<string, number>} */
  const lastRps = new Map();
  function tryRps(/** @type {User} */ u, /** @type {string} */ text) {
    if (!o.settings().games || !o.settings().rps) return false;
    const you = rpsChoice(text);
    if (!you) return false;
    const now = Date.now();
    if (now - (lastRps.get(u.id) ?? 0) < 25_000) return true;
    lastRps.set(u.id, now);
    const host = RPS[Math.floor(Math.random() * 3)];
    const result = you === host ? 'draw' : beats(you, host) ? 'win' : 'lose';
    if (result === 'win') o.givePoints(u, 5);
    broadcast('rps', { id: uid(), user: show(u), you, host, result });
    return true;
  }
  function tryGame(/** @type {User} */ u, /** @type {string} */ text) {
    if (!game) return false;
    const words = tokensOf(text);
    if (game.kind === 'guess') {
      const nums = words.filter((w) => /^\d{1,3}$/.test(w));
      if (nums.length !== 1 || words.length > 4) return false;
      const n = Number(nums[0]);
      if (n < game.lo || n > game.hi) return true;
      if (n === game.secret) {
        endGame(u);
        return true;
      }
      if (n < game.secret) game.lo = n + 1;
      else game.hi = n - 1;
      game.last.unshift({ name: String(show(u).name), n, hint: n < game.secret ? 'up' : 'down' });
      game.last = game.last.slice(0, 4);
      sendGame();
      return true;
    }
    // kéo co: "1" pulls for team A, "2" for team B (one team per person)
    const pick = words.length <= 3 && words.includes('1') && !words.includes('2') ? 'a' : words.length <= 3 && words.includes('2') && !words.includes('1') ? 'b' : '';
    if (!pick) return false;
    const team = game.teamA.has(u.id) ? 'a' : game.teamB.has(u.id) ? 'b' : pick;
    (team === 'a' ? game.teamA : game.teamB).set(u.id, u);
    if (team === 'a') game.a++;
    else game.b++;
    sendGame();
    return true;
  }

  return {
    addXp,
    levelOf,
    visitsOf,
    multiplier,
    startEvent,
    startGame,
    /** A viewer came in: a visit is counted once per run of the server */
    onJoin(/** @type {User} */ u) {
      if (seenThisRun.has(u.id)) return;
      seenThisRun.add(u.id);
      profile(u).visits++;
      addXp(u, 5);
    },
    onFollow(/** @type {User} */ u) {
      if (followedThisRun.has(u.id)) return;
      followedThisRun.add(u.id);
      addXp(u, 20);
    },
    /** @returns {string} what the comment was ('order', 'bill', 'rps', 'game') or '' for an ordinary comment */
    onChat(/** @type {User} */ u, /** @type {string} */ text, /** @type {boolean} */ dzo) {
      const s = stats(u.id);
      s.comments++;
      if (dzo) s.dzo++;
      profile(u).comments++;
      if (tryGame(u, text)) return 'game';
      const seat = trySeat(u, text);
      if (seat) return seat;
      if (tryRps(u, text)) return 'rps';
      if (tryBill(u, text)) return 'bill';
      if (tryOrder(u, text)) return 'order';
      return '';
    },
    giftOrder,
    onGift(/** @type {User} */ u, /** @type {number} */ coins) {
      gifters.add(u.id);
      const s = stats(u.id);
      s.coins += coins;
      s.gifts++;
      const p = profile(u);
      p.coins += coins;
      p.gifts++;
      // a gift during tug of war pulls hard for the giver's team
      if (game?.kind === 'tug' && (game.teamA.has(u.id) || game.teamB.has(u.id))) {
        if (game.teamA.has(u.id)) game.a += coins * 5;
        else game.b += coins * 5;
        sendGame();
      }
    },
    snapshot: () => ({ happyLeft: Math.max(0, happyUntil - Date.now()), orders: orderList(), game: gameState() }),
    viewersList: (/** @type {number} */ n = 50) =>
      [...viewers.entries()]
        .sort((a, b) => b[1].xp - a[1].xp)
        .slice(0, n)
        .map(([id, p]) => ({ id, name: p.name, xp: p.xp, visits: p.visits, last: p.last, coins: p.coins, comments: p.comments, lv: levelFor(p.xp).lv })),
    resetViewers() {
      viewers.clear();
      dirty = true;
    },
    count: () => viewers.size,
  };
}
