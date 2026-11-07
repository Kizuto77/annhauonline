// @ts-check
// Mọi câu chủ quán nói. {q} = tên quán (dashboard "Tên quán"), {ban} = "bạn Lan", {list} = "bạn A, bạn B và bạn C".
// Quán ảo cho vui: không giục ai uống thật, thỉnh thoảng nhắc uống có chừng và không lái xe.
import { ban, listNames } from './names.js';

/** Random line from a list, never the same as last time for that list */
const lastPick = new WeakMap();
/** @template T @param {T[]} list @returns {T} */
function pick(list) {
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastPick.get(list)) i = (i + 1) % list.length;
  lastPick.set(list, i);
  return list[i];
}
const fill = (/** @type {string} */ s, /** @type {Record<string, string>} */ v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

const GREET = [
  '{q} chào {list} mới ghé quán. Kéo ghế ngồi chơi nha!',
  'Ui, {list} tới rồi kìa. {q} chào nha, kiếm chỗ ngồi đi, gõ {kw} là có ly liền.',
  'Chào mừng {list} ghé {q}. Vô đây ngồi cho vui, ở đây ai cũng là chiến hữu hết.',
  '{q} xin chào {list}. Hôm nay quán đông vui lắm, ngồi chơi với cả nhà nha!',
];

const TOASTS = [
  'Chúc {ban} làm ăn phát tài, tiền vô như nước, tiền ra nhỏ giọt.',
  'Chúc {ban} đi đâu cũng gặp bạn hiền, ngồi đâu cũng có mồi ngon.',
  'Chúc {ban} tháng này lương về đúng hẹn, thưởng về bất ngờ.',
  'Chúc {ban} sức khỏe dồi dào, cười nhiều hơn lo.',
  'Chúc {ban} vui vẻ cả tuần, sếp khen, đồng nghiệp thương.',
  'Chúc {ban} gia đình êm ấm, về nhà lúc nào cũng có người chờ cơm.',
  'Chúc {ban} chuyện gì cũng suôn sẻ, muốn gì được nấy.',
  'Chúc {ban} có một tối thật chill, quên hết mệt mỏi ngoài kia.',
  'Chúc {ban} độc thân thì sớm có người thương, có đôi rồi thì càng ngày càng hạnh phúc.',
  'Chúc {ban} buôn may bán đắt, khách vô nườm nượp.',
];

// Gift thanks by size: 1 small, 2 medium (a dish comes out), 3 big (beer tower), 4 very big (the whole quán stands)
const GIFT = {
  1: ['Cảm ơn {ban} đã gửi {gift} nha! Quán mang ra cho bàn {ban} một vòng ly mới.', '{q} cảm ơn {ban} đã gửi {gift}! Dzô một cái mừng {ban} nè.'],
  2: ['Ôi, cảm ơn {ban} đã gửi {gift}! Bàn {ban} có đĩa mồi mới rồi đó.', '{q} cảm ơn {ban} đã gửi {gift} nha! Mồi ngon đang ra bàn liền.'],
  3: ['Trời ơi, {ban} chơi lớn quá, gửi tới {gift}! Tháp bia ra bàn, cả quán nâng ly, một, hai, ba, dzô!', 'Cảm ơn {ban} đã gửi {gift}! Cả {q} cụng ly mừng {ban} nào, một, hai, ba, dzô!'],
  4: ['Ôi trời, cả quán ơi, {ban} vừa gửi {gift}! {q} cảm ơn {ban} nhiều lắm. Cả quán đứng dậy, một, hai, ba, dzô!', 'Đại gia của {q} đây rồi! Cảm ơn {ban} đã gửi {gift}. Lẩu với tháp bia ra bàn, cả quán dzô mừng {ban} nào!'],
};

// Common TikTok gift names, said the Vietnamese way; anything else is "món quà"
/** @type {Record<string, string>} */
const GIFT_NAMES = {
  rose: 'bông hồng', 'finger heart': 'trái tim', 'hand hearts': 'trái tim', 'heart me': 'trái tim', heart: 'trái tim', tiktok: 'quà TikTok', gg: 'quà GG',
  'ice cream cone': 'cây kem', doughnut: 'bánh donut', perfume: 'chai nước hoa', galaxy: 'dải ngân hà', 'money gun': 'súng bắn tiền', lion: 'chú sư tử',
  universe: 'cả vũ trụ', corgi: 'bé corgi', sunglasses: 'cặp kính râm', confetti: 'pháo giấy', 'paper crane': 'hạc giấy', coffee: 'ly cà phê', swan: 'thiên nga',
  'love you': 'lời yêu thương', 'rosa': 'bông hồng', 'cap': 'cái mũ', 'mic': 'cái micro', 'gold mine': 'mỏ vàng', 'hat and mustache': 'mũ với ria mép',
};
const giftWords = (/** @type {string} */ name) => GIFT_NAMES[(name || '').toLowerCase().trim()] || 'món quà';

const FOLLOW = [
  'Cảm ơn {ban} đã theo dõi quán! Từ nay là khách quen rồi, lần sau ghé là có ghế liền nha.',
  '{q} cảm ơn {ban} đã follow nha! Khách quen của quán là có ưu tiên chỗ ngồi đó.',
];

const SHARE_NAMED = '{q} cảm ơn {list} đã ngồi chơi với quán. Cả nhà thấy vui thì bấm chia sẻ, rủ thêm bạn bè vô ngồi chung cho đông nha!';
const SHARE = [
  'Cả nhà ơi, thấy quán vui thì bấm chia sẻ live rủ bạn bè vô ngồi chung cho đông nha!',
  'Quán càng đông càng vui. Ai rảnh tay bấm chia sẻ giúp {q} một cái nha, cảm ơn cả nhà.',
  'Rủ thêm chiến hữu vô quán đi cả nhà, bấm chia sẻ live là tới liền.',
];

// When the live has been quiet for a while
const IDLE = [
  '{q} vẫn mở cửa nè. Ai chưa có ghế thì gõ {kw} là có chỗ ngồi liền nha.',
  'Mẹo nhỏ của quán: cứ một ly bia thì uống thêm một ly nước lọc, mai dậy đỡ mệt hơn nhiều.',
  'Nhắc nhẹ cả nhà: đã uống rượu bia thì không lái xe nha. Gọi xe về cho an toàn, ở nhà còn có người chờ.',
  'Ai đang ngồi một mình thì gõ một câu chào đi, ở {q} không ai là người lạ hết.',
  'Đố vui nè: con gì càng say càng nói nhiều? Con người chứ con gì!',
  'Cả nhà thả tim đi, đủ chín mươi chín tim là quán quay vòng mồi, ra món gì ăn món đó.',
  'Ai biết vì sao bia hơi phải uống trong ngày không? Vì bia hơi không thanh trùng như bia chai, để qua đêm là mất ngon.',
  'Tối nay cả nhà nhậu món gì? Comment cho quán biết với, xem ai có món ngon nhất.',
  'Quán ảo nên uống bao nhiêu cũng không say. Còn ngoài đời thì uống có chừng thôi nha cả nhà.',
  'Đủ sáu trăm sáu mươi sáu tim là quán mưa bọt bia một phút. Cả nhà thả tim đi!',
];

/** @type {Record<import('./chat.js').Topic, string[]>} */
const REPLIES = {
  birthday: ['Chúc mừng sinh nhật {ban}! Cả {q} nâng ly mừng tuổi mới, nhiều tiền, ít muộn phiền nha!', 'Ui, sinh nhật {ban} hả? Cả quán dzô một cái mừng {ban}, chúc tuổi mới thật nhiều niềm vui!'],
  drunk: ['{ban} say rồi hả? Uống ly nước lọc, nghỉ xíu nha. Nhớ đừng lái xe, gọi xe về cho an toàn.', 'Say rồi thì {ban} ngồi nghỉ thôi, quán ảo uống bao nhiêu cũng được, ngoài đời thì chừng đó là đủ rồi nha.'],
  sad: ['{ban} buồn hả? Ghé quán ngồi chơi đi, có anh em ở đây nghe {ban} tâm sự. Rồi mọi chuyện cũng qua thôi.', 'Thương {ban} nha. Buồn thì cứ nói ra, cả quán ở đây với {ban}. Mai sẽ là một ngày tốt hơn.'],
  tired: ['{ban} vất vả rồi. Ngồi xuống nghỉ chân đi, ở quán không có deadline đâu.', 'Mệt thì nghỉ chút nha {ban}. Làm việc cả ngày rồi, giờ là lúc thả lỏng với cả nhà.'],
  hungry: ['{ban} đói rồi hả? Cả nhà thả đủ chín mươi chín tim là vòng quay mồi ra món liền!', 'Mồi tới liền, {ban} chờ xíu nha! Thả tim cho vòng quay mồi chạy nào cả nhà.'],
  bye: ['{ban} về hả? Về cẩn thận nha, mai ghé {q} tiếp nhé!', 'Tạm biệt {ban}, ngủ ngon nha. Nhớ đường về quán đó!'],
};

/** @param {{ q: string; kw: string }} ctx */
export const lines = (ctx) => ({
  greet: (/** @type {string[]} */ names) => fill(pick(GREET), { q: ctx.q, kw: ctx.kw, list: listNames(names) }),
  gift: (/** @type {string} */ name, /** @type {string} */ giftName, /** @type {number} */ tier) => {
    const t = /** @type {1 | 2 | 3 | 4} */ (Math.min(4, Math.max(1, tier)));
    const thanks = fill(pick(GIFT[t]), { q: ctx.q, ban: ban(name), gift: giftWords(giftName) });
    return [thanks, fill(pick(TOASTS), { ban: ban(name) })];
  },
  follow: (/** @type {string} */ name) => fill(pick(FOLLOW), { q: ctx.q, ban: ban(name) }),
  share: (/** @type {string[]} */ names) => (names.length ? fill(SHARE_NAMED, { q: ctx.q, list: listNames(names) }) : fill(pick(SHARE), { q: ctx.q })),
  idle: () => fill(pick(IDLE), { q: ctx.q, kw: ctx.kw }),
  wave: () => pick(['Cả quán đông vui quá! Nào, một, hai, ba, dzô!', 'Cả nhà nâng ly lên nào! Một, hai, ba, dzô!', 'Dzô! Trăm phần trăm cả nhà ơi!']),
  smash: (/** @type {string} */ name) => [
    pick([`Trời ơi! ${ban(name)} đập quán tôi rồi! Bàn ghế bay hết rồi kìa!`, `Á á á! ${ban(name)} ơi, sao lại đập quán tôi vậy trời!`, `Chết rồi! ${ban(name)} đập quán của tôi rồi, mọi người bình tĩnh!`]),
    pick(['Huhu, bàn ghế của tôi, ly chén của tôi... Tiền vốn mua bia của tôi... huhu...', 'Huhu... Mới sắm bàn mới tuần trước thôi mà... Huhu...', 'Huhu... Tôi biết ăn nói sao với ông chủ nhà bây giờ... huhu...']),
  ],
  smashClean: () => pick(['Thôi, lau nước mắt, dọn lại quán thôi. Cả nhà giúp tôi một tay nha, huhu.', 'Hức, thôi không khóc nữa. Để tôi quét dọn lại, mở cửa bán tiếp.']),
  smashDone: () => pick([`Xong rồi! ${ctx.q} sạch bóng như mới. Cả nhà ngồi xuống, nhưng nhớ nhẹ tay giùm tôi nha!`, `Dọn xong rồi, ${ctx.q} mở cửa lại! Lần sau đập nhẹ thôi nha cả nhà, huhu.`]),
  wheel: (/** @type {{ ten: string; loi: string }} */ dish) => [`Cả nhà thả đủ chín mươi chín tim rồi! Vòng quay mồi ra món ${dish.ten}.`, dish.loi],
  rain: () => pick(['Sáu trăm sáu mươi sáu tim! Quán mưa bọt bia một phút, cả nhà cụng ly nào!', 'Đủ tim rồi! Mưa bọt bia khắp quán, cảm ơn cả nhà nha!']),
  reply: (/** @type {import('./chat.js').Topic} */ topic, /** @type {string} */ name) => fill(pick(REPLIES[topic]), { q: ctx.q, ban: ban(name) }),
});
