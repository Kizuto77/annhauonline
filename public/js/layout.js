// @ts-check
// Bàn ghế trên vỉa hè, tính bằng % của sân khấu 9:16 (x = giữa, y = mặt đất dưới bàn/ghế).
// 8 bàn nhựa đỏ đánh số BÀN 1..8, xếp 2 dãy; lối giữa để chủ quán bưng món ra. Hàng xa (cao hơn) vẽ nhỏ hơn.
import { seeded } from './people.js';

/** Perspective scale at floor line y (%): 1 at the front rows */
export const scaleAt = (/** @type {number} */ y) => 0.55 + ((y - 58) / 36) * 0.5;

/** @typedef {{ id: number; no: number; x: number; y: number; w: number; s?: number; vip?: boolean }} Table */
/** @typedef {{ id: number; table: number; x: number; y: number; s: number; vip?: boolean; side: 'back' | 'end'; lift: boolean }} Seat */

const ROWS = [62.5, 71, 79.5, 88];
const COLS = [25, 75];
/** @type {Table[]} */
export const TABLES = [];
for (const y of ROWS) for (const x of COLS) TABLES.push({ id: TABLES.length, no: TABLES.length + 1, x, y, w: 25 });
for (const t of TABLES) {
  t.s = scaleAt(t.y);
  t.w *= t.s;
}

/** @type {Seat[]} */
export const SEATS = [];
for (const t of TABLES) {
  const s = t.s ?? scaleAt(t.y);
  const backY = t.y - 2.6 * s; // stools behind the table: hidden down to the waist
  for (let i = 0; i < 2; i++) {
    const f = i === 0 ? -0.24 : 0.24;
    SEATS.push({ id: SEATS.length, table: t.id, x: t.x + f * t.w, y: backY, s, side: 'back', lift: i === 1 });
  }
  // one stool at each end of the table, a bit in front of it
  const endY = t.y + 1.2 * s;
  for (const dir of [-1, 1]) SEATS.push({ id: SEATS.length, table: t.id, x: t.x + dir * (t.w / 2 + 2.6 * s), y: endY, s, side: 'end', lift: false });
}

/** No VIP table any more: everyone picks a numbered table */
export const VIP_SEATS = /** @type {Seat[]} */ ([]);
export const HALL_SEATS = SEATS;

// Viewers fill the tables in order (BÀN 1 first), so people sit together instead of one per table
export const SEAT_ORDER = SEATS.map((s) => s.id);
/** Seats of one table, back seats first */
export const seatsOfTable = (/** @type {number} */ tableId) => SEATS.filter((s) => s.table === tableId);

// A few background customers keep the quán from looking empty before anyone joins; viewers replace them
const r = seeded(4242);
export const NPC_SEATS = new Set(SEATS.filter((s) => s.table >= 2 && r() < 0.4).map((s) => s.id));

/** Width of a seated person, in % of the stage width, from the seat's scale */
export const personWidth = (/** @type {number} */ s) => 6.6 * s;
