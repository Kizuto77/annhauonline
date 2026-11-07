// @ts-check
// Cấp bậc khách quen: điểm trọn đời (lưu qua nhiều buổi live) quyết định cấp. Dùng chung cho server và sân khấu.

/** @typedef {{ lv: number; name: string; icon: string; xp: number }} Level */

/** @type {Level[]} */
export const LEVELS = [
  { lv: 1, name: 'Khách mới', icon: '🍺', xp: 0 },
  { lv: 2, name: 'Khách quen', icon: '🥂', xp: 50 },
  { lv: 3, name: 'Chiến hữu', icon: '🍻', xp: 200 },
  { lv: 4, name: 'Dân chơi', icon: '😎', xp: 600 },
  { lv: 5, name: 'Đại gia', icon: '💰', xp: 2000 },
  { lv: 6, name: 'Trùm quán', icon: '👑', xp: 6000 },
  { lv: 7, name: 'Huyền thoại', icon: '🐉', xp: 20000 },
];

/** Level for an amount of lifetime points */
export function levelFor(/** @type {number} */ xp) {
  let at = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xp) at = l;
  return at;
}
