// @ts-check
// Câu chủ quán nói cho phần "quán thật": gọi món, hóa đơn, lên cấp, sự kiện, mini game. Giọng bựa nhưng không tục.
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
const ORDER_BUSY = ['{ban} ơi, món của {ban} đang nấu mà, gọi thêm là bếp xỉu đó!', 'Từ từ {ban}, ăn hết dĩa này đã rồi gọi tiếp nha, bếp có hai tay thôi!'];
const ORDER_FULL = ['Bếp đang cháy đơn rồi cả nhà ơi, đợi xíu rồi gọi tiếp nha!', 'Đơn chất đống luôn, bếp chạy không kịp! Ai tặng quà thì được làm trước nha.'];

const BILL = [
  'Hóa đơn của {ban} đây: tổng cộng không đồng! Quán ảo mà, chỉ thu tiếng cười thôi. Muốn bo thì thả tim nha!',
  '{ban} tính tiền hả? Để quán coi… ăn uống đã đời mà tổng là không đồng. Quán làm ăn kiểu này chắc phá sản quá!',
  'Bill của {ban} ra rồi! Không đồng, không xu, chỉ cần để lại một cái follow là quán vui rồi.',
];

const LEVEL_UP = [
  'Chúc mừng {ban} vừa lên cấp {lv}! Cả quán vỗ tay nào!',
  'Ê ê, {ban} lên cấp {lv} rồi kìa! Từ nay vô quán là được chào to hơn nha.',
  '{ban} chính thức thành {lv} của quán! Cả nhà dzô một cái mừng {ban} nào!',
];

const HAPPY = ['Giờ vàng tới rồi cả nhà ơi! Trong ba phút, comment hay tặng quà đều được nhân đôi điểm. Leo bảng TOP lẹ lên!', 'Ting ting, giờ vàng! Ba phút điểm nhân đôi, ai đang ở dưới bảng thì đây là cơ hội lật kèo!'];
const HAPPY_END = ['Hết giờ vàng rồi nha, điểm về bình thường. Ai leo được bảng thì chúc mừng!'];
const BLACKOUT = ['Ủa ủa, ai đá dây điện vậy trời! Cả quán tối thui rồi!', 'Cúp điện rồi cả nhà ơi! Ai có đèn pin bật lên giùm quán với!', 'Ơ, mất điện! Bình tĩnh, đừng ai lợi dụng lúc tối mà gắp mồi bàn bên nha!'];
const BLACKOUT_END = ['Có điện lại rồi! Kiểm tra coi mồi trên bàn còn đủ không nha.', 'Đèn sáng rồi! Ai vừa gắp trộm mồi lúc tối thì tự thú đi.'];
const STORM = ['Mưa to quá cả nhà ơi! Ngồi yên trong quán, ai về bây giờ là ướt như chuột lột đó.', 'Trời đổ mưa rồi, sấm chớp đùng đùng! Thời tiết này ngồi quán là chuẩn bài.'];
const STORM_END = ['Tạnh mưa rồi, mà thôi ngồi thêm xíu nữa, đường còn ướt lắm.'];
const VENDOR = /** @type {Record<string, string[]>} */ ({
  dau: ['Chị bán đậu phộng ghé quán kìa! Đậu phộng rang nóng hổi, nhậu mà thiếu đậu phộng là thiếu linh hồn.'],
  bap: ['Có cô bán bắp nướng đi ngang nè! Bắp nướng mỡ hành thơm lừng, ai thèm thì gõ bắp coi.'],
  kem: ['Kem tinh tinh tới rồi! Ăn kem giữa quán nhậu, nghe hơi sai sai mà vui là được.'],
  keo: ['Chú bán kẹo kéo ghé quán! Kẹo kéo này kéo dài như câu chuyện tình của ai đó.'],
});
const KARAOKE = ['Bàn kia hát karaoke kìa cả nhà! Hát dở mà tự tin ghê, cả quán vỗ tay cổ vũ nào!', 'Có bàn mở karaoke rồi! Giọng ca vàng trong làng phá mic đây chứ đâu.'];

const GUESS_START = ['Trò chơi đoán số bắt đầu! Chủ quán đang nghĩ một số từ một tới năm mươi. Comment số đi, ai đoán trúng được năm mươi điểm!', 'Đoán số nè cả nhà! Một tới năm mươi, gõ một con số thôi, quán sẽ nói lớn hơn hay nhỏ hơn.'];
const GUESS_WIN = ['Trúng rồi! Số {n}, {ban} đoán trúng phóc! Cộng năm mươi điểm, cả quán vỗ tay!', '{ban} thần đồng toán học luôn, số {n} đúng rồi! Năm mươi điểm về tay {ban}!'];
const GUESS_NONE = ['Hết giờ mà không ai trúng! Số bí mật là {n}. Cả nhà đoán dở quá, lần sau cố lên nha!'];
const TUG_START = ['Kéo co bắt đầu! Gõ số một vào đội Ốc, gõ số hai vào đội Mực. Gõ càng nhiều kéo càng mạnh, tặng quà kéo cực mạnh!', 'Kéo co nè cả nhà! Một là đội Ốc, hai là đội Mực. Bốn mươi lăm giây, đội nào thắng cả đội được cộng điểm!'];
const TUG_WIN = ['Đội {team} thắng rồi! Cả đội được cộng mười điểm. Đội kia về tập tạ thêm đi nha!', 'Hết giờ! Đội {team} kéo bay đội kia luôn. Chúc mừng cả đội {team}!'];
const TUG_DRAW = ['Hòa rồi! Hai đội kéo ngang ngửa, sợi dây muốn đứt luôn.'];

const RPS_WIN = ['{ban} ra {you}, chủ quán ra {host}. {ban} thắng rồi, cộng năm điểm!', 'Trời, {ban} ra {you} ăn {host} của chủ quán. Hôm nay chủ quán xui ghê!'];
const RPS_LOSE = ['{ban} ra {you}, chủ quán ra {host}. Chủ quán thắng! Chơi lại không?', 'Ha ha, {host} ăn {you}! {ban} thua rồi, phạt gõ dzô ba lần.'];
const RPS_DRAW = ['Cả hai cùng ra {you}! Hòa rồi, {ban} chơi lại đi.', '{ban} với chủ quán cùng ra {you}, tâm đầu ý hợp ghê!'];

export const clubLines = {
  order: (/** @type {string} */ name, /** @type {string} */ dish, /** @type {number} */ qty, /** @type {boolean} */ vip) =>
    fill(pick(vip ? ORDER_VIP : ORDER), { ban: ban(name), mon: dish, qty: `${NUM[qty] ?? qty} phần` }),
  orderDone: (/** @type {string} */ name, /** @type {string} */ dish) => fill(pick(ORDER_DONE), { ban: ban(name), mon: dish }),
  orderBusy: (/** @type {string} */ name) => fill(pick(ORDER_BUSY), { ban: ban(name) }),
  giftOrder: (/** @type {string} */ name, /** @type {string} */ dish, /** @type {number} */ qty, /** @type {boolean} */ hotpot) =>
    fill(pick(hotpot ? GIFT_HOTPOT : GIFT_ORDER), { ban: ban(name), mon: dish, qty: `${NUM[qty] ?? qty} phần` }),
  orderPaid: (/** @type {string} */ name, /** @type {string} */ dish, /** @type {number} */ price, /** @type {boolean} */ hotpot) =>
    fill(pick(hotpot ? PAID_HOTPOT : PAID_NOTE), { ban: ban(name), mon: dish, price: String(price) }),
  orderFull: () => pick(ORDER_FULL),
  bill: (/** @type {string} */ name) => fill(pick(BILL), { ban: ban(name) }),
  levelUp: (/** @type {string} */ name, /** @type {string} */ level) => fill(pick(LEVEL_UP), { ban: ban(name), lv: level }),
  happy: () => pick(HAPPY),
  happyEnd: () => pick(HAPPY_END),
  blackout: () => pick(BLACKOUT),
  blackoutEnd: () => pick(BLACKOUT_END),
  storm: () => pick(STORM),
  stormEnd: () => pick(STORM_END),
  vendor: (/** @type {string} */ kind) => pick(VENDOR[kind] ?? VENDOR.dau),
  karaoke: () => pick(KARAOKE),
  guessStart: () => pick(GUESS_START),
  guessWin: (/** @type {string} */ name, /** @type {number} */ n) => fill(pick(GUESS_WIN), { ban: ban(name), n: String(n) }),
  guessNone: (/** @type {number} */ n) => fill(pick(GUESS_NONE), { n: String(n) }),
  tugStart: () => pick(TUG_START),
  tugWin: (/** @type {string} */ team) => fill(pick(TUG_WIN), { team }),
  tugDraw: () => pick(TUG_DRAW),
  rps: (/** @type {string} */ name, /** @type {string} */ you, /** @type {string} */ host, /** @type {string} */ result) =>
    fill(pick(result === 'win' ? RPS_WIN : result === 'lose' ? RPS_LOSE : RPS_DRAW), { ban: ban(name), you, host }),
};
