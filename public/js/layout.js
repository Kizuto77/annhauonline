// @ts-check
// Where the tables and stools are, in % of the 9:16 stage (x = center, y = the floor line under the table/stool).
// Farther rows (higher on screen) are drawn smaller. A clear aisle runs down the middle for the waiter.
import { seeded } from './people.js';

/** Perspective scale at floor line y (%): 1 at the front rows */
export const scaleAt = (/** @type {number} */ y) => 0.55 + ((y - 58) / 36) * 0.5;

/** @typedef {{ id: number; x: number; y: number; w: number; s?: number; vip?: boolean }} Table */
/** @typedef {{ id: number; table: number; x: number; y: number; s: number; vip?: boolean; side: 'back' | 'end'; lift: boolean }} Seat */

/** @type {Table[]} */
export const TABLES = [
  { id: 0, x: 46, y: 66.5, w: 40, vip: true }, // bàn VIP: top 6 của bảng, trên bục nên to như hàng trước
  { id: 1, x: 15, y: 71, w: 15 },
  { id: 2, x: 80, y: 74, w: 15 },
  { id: 3, x: 12, y: 81.5, w: 14 },
  { id: 4, x: 37, y: 80.5, w: 14 },
  { id: 5, x: 63, y: 81, w: 14 },
  { id: 6, x: 88, y: 82.5, w: 14 },
  { id: 7, x: 13, y: 92, w: 16 },
  { id: 8, x: 38, y: 91.5, w: 16 },
  { id: 9, x: 63, y: 92.5, w: 16 },
  { id: 10, x: 88, y: 93, w: 16 },
];
for (const t of TABLES) {
  t.s = t.vip ? 0.8 : scaleAt(t.y);
  t.w *= t.s;
}

/** @type {Seat[]} */
export const SEATS = [];
for (const t of TABLES) {
  const s = t.s ?? scaleAt(t.y);
  const backY = t.y - 2.6 * s; // stools behind the table: hidden down to the waist
  const backCount = t.vip ? 4 : 3;
  for (let i = 0; i < backCount; i++) {
    const f = i / (backCount - 1) - 0.5;
    // every other name tag sits a bit higher so neighbours' names don't overlap
    SEATS.push({ id: SEATS.length, table: t.id, x: t.x + f * t.w * 0.72, y: backY, s, vip: t.vip, side: 'back', lift: i % 2 === 1 });
  }
  // one stool at each end of the table, a bit in front of it
  const endY = t.y + 1.2 * s;
  for (const dir of [-1, 1]) SEATS.push({ id: SEATS.length, table: t.id, x: t.x + dir * (t.w / 2 + 2.6 * s), y: endY, s, vip: t.vip, side: 'end', lift: false });
}

export const VIP_SEATS = SEATS.filter((s) => s.vip);
export const HALL_SEATS = SEATS.filter((s) => !s.vip);

// Viewers fill seats in this order: the middle rows first (the front row sits under TikTok's comment list)
const rowRank = (/** @type {Seat} */ s) => (s.y > 70 && s.y < 88 ? 0 : s.y >= 88 ? 1 : 2);
const r = seeded(4242);
const jitter = new Map(HALL_SEATS.map((s) => [s.id, r()]));
export const SEAT_ORDER = [...HALL_SEATS].sort((a, b) => rowRank(a) - rowRank(b) || (jitter.get(a.id) ?? 0) - (jitter.get(b.id) ?? 0)).map((s) => s.id);

// Background customers keep about half the hall busy before anyone joins; viewers replace them
export const NPC_SEATS = new Set(HALL_SEATS.filter(() => r() < 0.5).map((s) => s.id));

/** Width of a seated person, in % of the stage width, from the seat's scale */
export const personWidth = (/** @type {number} */ s) => 6.6 * s;
