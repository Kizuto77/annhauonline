// @ts-check
// Quán phía server: hiểu comment gọi món / xin ngồi / đổi bàn, và giữ hàng chờ của bếp (ai gọi trước làm trước,
// khách tặng quà được ưu tiên). Server giữ bếp để sân khấu, khung xem trước và trang admin luôn khớp nhau.
// Ở đây cũng giữ danh sách ai đang có ghế: món miễn phí chỉ dành cho khách đã vào bàn.
import { FREE, HOTPOT, PAID } from './public/js/menu.js';
import { NPC_DISHES, REGULARS } from './public/js/npc.js';
import { tokensOf } from './public/js/text.js';

/** @typedef {{ id: string; name: string; avatar: string }} User */
/** @typedef {import('./public/js/menu.js').MenuItem} MenuItem */

const fold = (/** @type {string} */ s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const rnd = (/** @type {number} */ a, /** @type {number} */ b) => a + Math.floor(Math.random() * (b - a + 1));
export const TABLE_COUNT = 8;

/** [phrase, item, free], longest first: "đậu tẩm hành" before "đậu" */
const ALIASES = /** @type {Array<[string, MenuItem, boolean]>} */ ([
  ...FREE.flatMap((m) => m.alias.map((a) => /** @type {[string, MenuItem, boolean]} */ ([a, m, true]))),
  ...[...PAID, ...HOTPOT].flatMap((m) => m.alias.map((a) => /** @type {[string, MenuItem, boolean]} */ ([a, m, false]))),
]).sort((a, b) => b[0].length - a[0].length);
const ORDER_VERBS = new Set(['gọi', 'cho', 'lên', 'order', 'thêm', 'làm', 'kêu', 'xin', 'đặt', 'mang', 'bưng', 'dọn', 'muốn', 'ăn', 'uống']);
const PORTIONS = new Set(['dĩa', 'đĩa', 'phần', 'nồi', 'tô', 'chén', 'xiên', 'suất', 'ly', 'cốc', 'chai', 'lon', 'bát', 'két']);
const NUMBER_WORDS = ['một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám'];

/**
 * What a comment orders: a free dish ("đậu lạc", "cho dĩa nem chua"), or a paid one it names ("gọi mực nướng").
 * A short comment that is just the name counts; a longer one needs "gọi / cho / lên…" or "dĩa / ly…".
 * @returns {{ item: MenuItem; free: boolean } | null}
 */
export function orderedItem(/** @type {string} */ text) {
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
    if (k >= 0) return Math.min(5, k + 1);
  }
  return 1;
}

/**
 * "bàn 3", "sang bàn 5", "qua bàn số 2": move to a table (n). "nhậu", "vào bàn", "cho ngồi": sit anywhere (0).
 * @returns {number | null}
 */
export function seatWish(/** @type {string} */ text) {
  const words = tokensOf(text);
  if (words.length > 8) return null;
  const at = words.indexOf('bàn');
  if (at >= 0) {
    const raw = words[at + 1] === 'số' ? words[at + 2] : words[at + 1];
    const n = Number(raw) || NUMBER_WORDS.indexOf(raw ?? '') + 1;
    if (Number.isInteger(n) && n >= 1 && n <= TABLE_COUNT) return n;
  }
  if (words.length <= 4 && (words.includes('nhậu') || (words.includes('vào') && words.includes('bàn')) || (words.includes('cho') && words.includes('ngồi')) || words.includes('ngồi'))) return 0;
  return null;
}

/**
 * @param {{ broadcast: (event: string, data: unknown) => void; uid: () => string; show: (u: User) => Record<string, unknown>; settings: () => any }} o
 */
export function createPub(o) {
  const { broadcast, uid, show } = o;

  /** @typedef {{ id: string; user: Record<string, unknown>; uid: string; item: MenuItem; qty: number; state: 'wait' | 'cook'; start: number; ms: number; vip: boolean; gift: boolean }} Order */
  /** @type {Order[]} */
  let orders = [];
  /** @type {Map<string, number>} */
  const lastOrderAt = new Map();
  /** people who sent a gift during this live: their orders jump the queue */
  const gifters = new Set();
  /**
   * Who has a stool in the quán right now (mirror of the stage: a seat comes from follow / "nhậu" / "bàn N" /
   * a gift, and goes when they have been quiet for `seatIdleMin`). Only someone sitting may order a free dish.
   * @type {Map<string, number>} viewer id -> when they were last active
   */
  const seated = new Map();
  const seatIdleMs = () => Math.max(2, Number(o.settings().seatIdleMin) || 10) * 60_000;
  /** They asked for a seat (or followed, or gave a gift): the stage puts them on a stool */
  function sit(/** @type {string} */ id) {
    seated.set(id, Date.now());
    if (seated.size > 3000) seated.delete(seated.keys().next().value ?? '');
  }
  /** Still at the table? Any comment keeps the seat warm, exactly like on the stage. */
  function sitting(/** @type {string} */ id) {
    const at = seated.get(id);
    if (at === undefined) return false;
    if (Date.now() - at > seatIdleMs()) {
      seated.delete(id);
      return false;
    }
    seated.set(id, Date.now());
    return true;
  }

  const orderList = () =>
    orders.map((x) => ({ id: x.id, user: x.user, item: x.item, qty: x.qty, state: x.state, vip: x.vip, left: x.state === 'cook' ? Math.max(0, x.ms - (Date.now() - x.start)) : x.ms, ms: x.ms }));

  /** Up to 3 dishes on the fire at once */
  function pump() {
    while (orders.filter((x) => x.state === 'cook').length < 3) {
      const next = orders.find((x) => x.state === 'wait');
      if (!next) break;
      next.state = 'cook';
      next.start = Date.now();
      setTimeout(() => {
        orders = orders.filter((x) => x !== next);
        broadcast('orderDone', { order: { id: next.id, user: next.user, item: next.item, qty: next.qty, gift: next.gift }, orders: orderList() });
        pump();
      }, next.ms);
    }
    broadcast('orders', orderList());
  }

  /** Gift orders (good dishes, hotpots) go before the free ones still waiting */
  function enqueue(/** @type {User} */ u, /** @type {MenuItem} */ item, /** @type {number} */ qty, /** @type {boolean} */ gift) {
    const vip = gift || gifters.has(u.id);
    const ms = (item.kind === 'drink' ? rnd(4, 6) : item.kind === 'hotpot' ? rnd(11, 15) : rnd(7, 11)) * 1000;
    /** @type {Order} */
    const order = { id: uid(), user: show(u), uid: u.id, item, qty, state: 'wait', start: 0, ms, vip, gift };
    if (vip) {
      const firstWaiting = orders.findIndex((x) => x.state === 'wait' && !x.vip);
      orders.splice(firstWaiting < 0 ? orders.length : firstWaiting, 0, order);
    } else orders.push(order);
    broadcast('order', { order: { id: order.id, user: order.user, item, qty, vip, gift } });
    pump();
  }

  /** @returns {boolean} true when the comment was about food (handled here) */
  function tryOrder(/** @type {User} */ u, /** @type {string} */ text) {
    const s = o.settings();
    if (!s.orders) return false;
    const found = orderedItem(text);
    if (!found) return false;
    if (!found.free) {
      // "gọi mực nướng": that one comes with a gift
      const price = found.item.kind === 'hotpot' ? s.hotpotMinCoins : s.foodMinCoins;
      broadcast('orderNote', { kind: 'paid', user: show(u), item: found.item, price });
      return true;
    }
    // Luật quán: phải có ghế mới gọi được món miễn phí (chat "nhậu" vào bàn trước)
    if (!sitting(u.id)) {
      broadcast('orderNote', { kind: 'seat', user: show(u), item: found.item });
      return true;
    }
    const now = Date.now();
    const mine = orders.find((x) => x.uid === u.id && !x.gift);
    if (mine) {
      broadcast('orderNote', { kind: 'busy', user: show(u), item: mine.item });
      return true;
    }
    if (now - (lastOrderAt.get(u.id) ?? 0) < 25_000) return true; // just ate: the comment is still about food
    if (orders.filter((x) => !x.gift).length >= 10) {
      broadcast('orderNote', { kind: 'full', user: show(u), item: found.item });
      return true;
    }
    lastOrderAt.set(u.id, now);
    enqueue(u, found.item, portions(text), false);
    return true;
  }

  return {
    /** @returns {string} what the comment was: 'table' (bàn N), 'sit' (nhậu), 'order', or '' */
    onChat(/** @type {User} */ u, /** @type {string} */ text) {
      const seat = seatWish(text);
      if (seat !== null) {
        sit(u.id);
        broadcast('seat', { user: show(u), table: seat });
        // "nhậu" alone is a seat request; "nhậu đậu lạc" is also an order
        if (!orderedItem(text)) return seat ? 'table' : 'sit';
      }
      if (tryOrder(u, text)) return 'order';
      return seat === null ? '' : seat ? 'table' : 'sit';
    },
    /** A gift from foodMinCoins brings a good dish, from hotpotMinCoins a hotpot (picked at random); `count` portions */
    giftOrder(/** @type {User} */ u, /** @type {number} */ coinsEach, /** @type {number} */ count) {
      const s = o.settings();
      gifters.add(u.id);
      sit(u.id);
      const hot = s.hotpotMinCoins > 0 && coinsEach >= s.hotpotMinCoins;
      if (!hot && !(s.foodMinCoins > 0 && coinsEach >= s.foodMinCoins)) return false;
      const list = hot ? HOTPOT : PAID;
      enqueue(u, list[Math.floor(Math.random() * list.length)], Math.min(count, hot ? 3 : 5), true);
      return true;
    },
    noteGifter: (/** @type {User} */ u) => {
      gifters.add(u.id);
      sit(u.id); // quà là có ghế: sân khấu cũng cho họ ngồi
    },
    /** Follow / được sân khấu cho ngồi: giữ chỗ cho họ ở phía server luôn */
    noteSeated: (/** @type {User} */ u) => sit(u.id),
    /** Comment nào cũng làm ghế "còn ấm" (giống lastActive trên sân khấu) */
    touchSeat: (/** @type {User} */ u) => sitting(u.id),
    hasSeat: (/** @type {User} */ u) => sitting(u.id),
    /** Free orders still waiting or cooking (a regular only orders when the kitchen is not swamped) */
    waiting: () => orders.filter((x) => !x.gift).length,
    /** A regular of the quán (k = index in REGULARS) orders a free dish on their own */
    npcOrder(/** @type {number} */ k) {
      const id = NPC_DISHES[Math.floor(Math.random() * NPC_DISHES.length)];
      const item = FREE.find((m) => m.id === id) ?? FREE[0];
      enqueue({ id: `npc-${k}`, name: REGULARS[k] ?? 'khách quen', avatar: '' }, item, 1, false);
    },
    snapshot: () => ({ orders: orderList() }),
  };
}
