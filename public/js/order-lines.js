// @ts-check
// Câu chủ quán nói khi gọi món, bếp nấu, bưng ra bàn. Giọng bựa nhưng không tục.
import { ban } from './names.js';

/** @template T @param {T[]} l @returns {T} */
const pick = (l) => l[Math.floor(Math.random() * l.length)];
const fill = (/** @type {string} */ s, /** @type {Record<string, string>} */ v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const NUM = ['không', 'một', 'hai', 'ba', 'bốn', 'năm'];

const ORDER = [
  '{ban} gọi {qty} {mon}! Bếp ơi, lên món! Ai đói thì nhìn bàn {ban} mà thèm nha.',
  'Có ngay {qty} {mon} cho {ban}! Bếp đang nổi lửa rồi, chờ xíu nha.',
  '{ban} gọi {mon}, chuẩn dân sành ăn luôn! Bếp ơi, làm lẹ lẹ cho người ta nhậu.',
  'Ghi sổ: {qty} {mon} cho {ban}. Bếp ơi, có khách sộp nè!',
  '{mon} hả {ban}? Món này bếp làm ngon nhất quán, đợi chút là có liền!',
];
const ORDER_VIP = [
  'Khách tặng quà gọi món là được ưu tiên! {qty} {mon} cho {ban}, bếp làm trước liền!',
  '{ban} là khách VIP nè, {mon} lên trước, ai chờ thì ráng chờ nha!',
];
const GIFT_ORDER = [
  'Cảm ơn {ban} tặng quà! Bếp làm ngay {qty} {mon} cho {ban}, chờ xíu là bưng ra tận bàn!',
  'Quà tới rồi! {ban} được {qty} {mon}, chủ quán vô bếp liền đây!',
  '{ban} chịu chơi ghê! {mon} lên lửa liền, nóng hổi ra bàn trong một nốt nhạc!',
];
const GIFT_HOTPOT = [
  'Ôi {ban} tặng quà to, quán lên ngay {qty} {mon}! Nước lẩu đang sôi sùng sục đây!',
  'Có lẩu cho {ban}! {mon}, nồi to nóng hổi, cả bàn ngồi sát vô ăn chung nha!',
];
const PAID_NOTE = [
  '{mon} là món ngon, tặng quà {price} xu là bếp làm liền cho {ban} nha!',
  '{ban} sành ăn ghê, {mon} phải tặng quà {price} xu mới có. Đậu lạc, nem chua thì miễn phí nè!',
];
const PAID_HOTPOT = ['Lẩu thì tặng quà {price} xu là có nồi nóng hổi {ban} ơi, quán chọn ngẫu nhiên vị cho bất ngờ!'];
const ORDER_DONE = [
  '{mon} của {ban} ra lò rồi! Nóng hổi vừa thổi vừa ăn nha!',
  'Ting ting! {mon} cho {ban} tới bàn. Ăn ngon thì thả tim cho bếp nha!',
  '{ban} ơi, {mon} tới rồi nè. Mời {ban} nhâm nhi, à nhớ chia cho bàn bên một miếng.',
  'Món {mon} đã lên bàn {ban}. Bếp hôm nay tay nghề lên level luôn!',
];
// Lặt vặt: đá, khăn lạnh, chén đũa, tăm giấy, chanh ớt, nước mắm — chạy bàn mang ra ngay
const ITEM = [
  'Chạy bàn ơi, {mon} cho {ban}!',
  '{mon} cho {ban} có liền, chạy bàn đang chạy rồi nè!',
  'Nghe rõ, {mon} ra bàn {ban} nha!',
  '{ban} kêu {mon}, quán phục vụ tận bàn liền đây!',
  'Có {mon} cho {ban}, khách gọi là có, khỏi chờ bếp!',
];
const ITEM_DONE = [
  '{mon} tới bàn {ban} rồi nha!',
  'Đây nha {ban}, {mon} để sẵn trên bàn rồi đó.',
  '{mon} cho {ban} đây, thiếu gì cứ gọi tiếp nha!',
];
const NEED_SEAT = [
  '{ban} ơi, chat "nhậu" vào bàn trước đã, ngồi xuống ghế là quán dọn {mon} ra liền!',
  'Chưa có ghế mà gọi {mon} là bếp không biết bưng đi đâu {ban} ơi! Gõ "nhậu" một cái là có chỗ ngay.',
  'Quán chỉ phục vụ khách đang ngồi bàn thôi {ban} nha. Gõ "nhậu" hoặc "bàn 3" vào bàn rồi gọi {mon} lại nhé!',
  '{ban} đứng ngoài đường gọi món là mỏi chân lắm! Chat "nhậu" lấy ghế trước, rồi {mon} có ngay.',
];
const ORDER_BUSY = ['{ban} ơi, món của {ban} đang nấu mà, gọi thêm là bếp xỉu đó!', 'Từ từ {ban}, ăn hết dĩa này đã rồi gọi tiếp nha, bếp có hai tay thôi!'];
const ORDER_FULL = ['Bếp đang cháy đơn rồi cả nhà ơi, đợi xíu rồi gọi tiếp nha!', 'Đơn chất đống luôn, bếp chạy không kịp! Ai tặng quà thì được làm trước nha.'];

export const orderLines = {
  order: (/** @type {string} */ name, /** @type {string} */ dish, /** @type {number} */ qty, /** @type {boolean} */ vip) =>
    fill(pick(vip ? ORDER_VIP : ORDER), { ban: ban(name), mon: dish, qty: `${NUM[qty] ?? qty} phần` }),
  orderDone: (/** @type {string} */ name, /** @type {string} */ dish) => fill(pick(ORDER_DONE), { ban: ban(name), mon: dish }),
  /** Gọi lặt vặt (đá, khăn lạnh, chén đũa…): không qua bếp, chạy bàn mang ra */
  orderItem: (/** @type {string} */ name, /** @type {string} */ thing) => fill(pick(ITEM), { ban: ban(name), mon: thing }),
  itemDone: (/** @type {string} */ name, /** @type {string} */ thing) => fill(pick(ITEM_DONE), { ban: ban(name), mon: thing }),
  orderBusy: (/** @type {string} */ name) => fill(pick(ORDER_BUSY), { ban: ban(name) }),
  orderNeedSeat: (/** @type {string} */ name, /** @type {string} */ dish) => fill(pick(NEED_SEAT), { ban: ban(name), mon: dish }),
  giftOrder: (/** @type {string} */ name, /** @type {string} */ dish, /** @type {number} */ qty, /** @type {boolean} */ hotpot) =>
    fill(pick(hotpot ? GIFT_HOTPOT : GIFT_ORDER), { ban: ban(name), mon: dish, qty: `${NUM[qty] ?? qty} phần` }),
  orderPaid: (/** @type {string} */ name, /** @type {string} */ dish, /** @type {number} */ price, /** @type {boolean} */ hotpot) =>
    fill(pick(hotpot ? PAID_HOTPOT : PAID_NOTE), { ban: ban(name), mon: dish, price: String(price) }),
  orderFull: () => pick(ORDER_FULL),
};
