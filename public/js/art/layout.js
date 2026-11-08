// @ts-check
// Chỗ ngồi của quán, tính bằng px trong khung 430 x 764. Ba hàng bàn trên vỉa hè (3 + 3 + 2 = 8 bàn), hàng
// càng gần càng to. Mỗi bàn 6 ghế: 2 ghế sau bàn (quay mặt ra), 2 ghế hai đầu bàn (ngồi nghiêng vào bàn),
// 2 ghế phía trước bàn (quay lưng ra ống kính, như ảnh quán nhậu thật).

export const W = 430;
export const H = 764;
/** Kitchen floor (behind the counter) and where the cook comes out to serve */
export const KITCHEN = { x: 215, y: 425, exitX: 352, exitY: 434 };

/** Depth scale: things lower on the screen are closer, so bigger */
export const scaleAt = (/** @type {number} */ y) => 0.78 + ((y - 488) * 0.3) / 172;

/** Size of a seated person (60 x 92 box), a standing one (60 x 150) and a table (100 x 44) at scale s */
export const seatedSize = (/** @type {number} */ s) => ({ w: 60 * s, h: 92 * s });
export const standingSize = (/** @type {number} */ s) => ({ w: 53.6 * s, h: 134 * s });
export const tableSize = (/** @type {number} */ s) => ({ w: 90 * s, h: 39.6 * s });

/** @typedef {'front' | 'side' | 'back'} SeatPose */
/** @typedef {{ id: number; no: number; x: number; y: number; s: number; seats: number[] }} Table */
/** @typedef {{ id: number; table: number; x: number; y: number; s: number; pose: SeatPose; flip: boolean; z: number }} Seat */

const ROWS = [
  { y: 488, xs: [80, 215, 350] },
  { y: 572, xs: [72, 215, 358] },
  { y: 660, xs: [112, 318] },
];

/** @type {Table[]} */
export const TABLES = [];
/** @type {Seat[]} */
export const SEATS = [];
for (const row of ROWS) {
  for (const x of row.xs) {
    const s = scaleAt(row.y);
    const id = TABLES.length;
    /** @type {Table} */
    const t = { id, no: id + 1, x, y: row.y, s, seats: [] };
    const z = Math.round(row.y * 10);
    const add = (/** @type {number} */ sx, /** @type {number} */ sy, /** @type {SeatPose} */ pose, /** @type {boolean} */ flip, /** @type {number} */ sz) => {
      // each seat has its own depth scale, so the two in front really are the closest people at the table
      const seat = { id: SEATS.length, table: id, x: sx, y: sy, s: scaleAt(sy), pose, flip, z: sz };
      SEATS.push(seat);
      t.seats.push(seat.id);
    };
    add(x - 20 * s, row.y - 8 * s, 'front', false, z - 6);
    add(x + 20 * s, row.y - 8 * s, 'front', false, z - 6);
    add(x - 54 * s, row.y, 'side', false, z + 3);
    add(x + 54 * s, row.y, 'side', true, z + 3);
    // in front of the table, backs to the camera: they never hide the table number in the middle
    add(x - 33 * s, row.y + 29 * s, 'back', false, z + 14);
    add(x + 33 * s, row.y + 29 * s, 'back', true, z + 14);
    TABLES.push(t);
  }
}

/**
 * Seats that start with a regular from the neighbourhood (NPC), so the quán is never empty. Three of them only:
 * two sitting together at the ends of table 2 (seats 8 and 9, facing each other across the table) and one on his
 * own at table 7 (seat 38). The other 45 stools stay for real viewers — the owner's rule.
 */
export const NPC_SEATS = [8, 9, 38].filter((i) => i < SEATS.length);
