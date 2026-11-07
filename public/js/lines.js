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
  'A, {list} đến rồi! Mời ngồi mời ngồi, quán vừa dọn xong, mồi nóng hổi đây.',
  'Có khách quý, {q} xin chào {list}! Ngồi xuống đi, tối nay mình chill cùng nhau nha.',
  'Hello {list}! Vô quán đúng lúc lắm, đang vui nè. Gõ {kw} cho cả quán biết {list} tới nha.',
  '{list} ơi, {q} mừng quá! Ngồi đâu cũng được, miễn là vui. Cho quán xin một câu {kw} nào!',
  'Mới nhắc tới là tới liền, chào {list}! Kéo ghế ngồi gần quầy cho nghe chủ quán nói chuyện nè.',
  'Quán có thêm {list} là thêm vui rồi. Chào mừng nha, ngồi xuống bắt chuyện với cả nhà đi.',
];

// One newcomer on their own
const GREET_ONE = [
  'Chào {ban} mới ghé quán! {q} mở cửa đón {ban} nè, kéo ghế ngồi chơi nha.',
  'Ơ, {ban} vô quán rồi kìa! Ngồi đâu cũng được, cho {q} xin một câu chào nào.',
  'Có khách mới, chào {ban}! Ở {q} ai vô cũng là bạn, ngồi xuống nói chuyện cho vui.',
  '{ban} ơi, {q} chào nha! Gõ {kw} một cái là có ly, có ghế liền.',
  'Mừng {ban} ghé {q}! Tối nay quán có nhạc chill, có mồi ngon, có cả nhà ngồi đợi {ban} nè.',
  'Ui, {ban} tới rồi! Chủ quán chờ nãy giờ đó nha. Ngồi xuống đi, bắt chuyện với mọi người nào.',
  'Xin chào {ban}! Quán nhỏ mà tình cảm lớn, vô ngồi chơi thoải mái nha.',
];

// Greetings that depend on the hour of the day (the viewer's computer clock)
const GREET_TIME = {
  morning: ['Sáng sớm mà {list} đã ghé quán rồi, chăm quá! {q} chào buổi sáng nha.', 'Chào buổi sáng {list}! Sáng nay quán mở cửa sớm, cà phê chưa có nhưng niềm vui thì đầy.'],
  noon: ['Giữa trưa {list} ghé {q} nghỉ chân hả? Ngồi chơi cho đỡ nóng nha.', 'Chào {list}! Trưa nắng vô quán ngồi cho mát, nói chuyện cho vui.'],
  afternoon: ['Chiều rồi {list} ghé quán hả? Tan ca chưa, ngồi nghỉ chân chút nha, {q} chào!', 'Xế chiều rồi, chào {list}! Giờ này quán bắt đầu lên đèn, vô ngồi cho ấm cúng.'],
  evening: ['Tối rồi, đúng giờ vàng của quán nhậu! {q} chào {list}, kéo ghế ngồi nha.', 'Chào {list}! Tối nay trời đẹp, quán đông vui, vô ngồi chơi với cả nhà nè.'],
  night: ['Khuya rồi mà {list} vẫn ghé quán, cú đêm chính hiệu! {q} chào nha, nhớ ngủ sớm đó.', 'Chào {list}, hội cú đêm của {q} đây rồi! Ngồi xuống tám chuyện, nhưng đừng thức quá khuya nha.'],
};

// A second sentence now and then, to give newcomers something to do
const HOOKS = [
  'Gõ {kw} để cụng ly với cả quán nha.',
  'Thả tim cho quán đi, đủ chín mươi chín tim là có vòng quay mồi.',
  'Ai gửi quà là được ra mồi và lên bàn VIP đó nha.',
  'Comment nhiều là lên bảng chiến hữu, top sáu được ngồi bàn VIP luôn.',
  'Nhớ follow quán để lần sau vô là có ghế quen liền.',
  'Nếu thấy vui thì rủ thêm bạn vô ngồi chung cho đông.',
  'Đủ sáu trăm sáu mươi sáu tim là quán mưa bọt bia, cả nhà cố lên.',
  'Nói thật nha, ngồi quán này không cần mang tiền, chỉ cần mang tiếng cười.',
];

// A regular who has been here before
const BACK = [
  'Khách quen {ban} quay lại rồi! Ghế cũ vẫn còn đó, {q} chào mừng về nha.',
  'Ô, {ban} quay lại {q} rồi hả! Nhớ quán dữ ha. Ngồi xuống đi, chủ quán nhớ {ban} lắm.',
  'Chiến hữu cũ {ban} tới kìa! Cả quán chào mừng {ban} trở lại nha.',
  'Quen mặt quá, {ban} đây rồi! Lần nào {ban} vô là quán cũng vui hơn hẳn.',
];

// Someone on the TOP board (rank 1, 2, 3...) walks in
const VIP = [
  'Chú ý chú ý, chiến hữu số {rank} của quán, {ban}, vừa vô! Cả quán đứng dậy chào nha.',
  'Ôi, {ban}, top {rank} của {q}, ghé quán rồi! Bàn VIP luôn chờ {ban} đó.',
  'Nhân vật quan trọng xuất hiện: {ban}, chiến hữu hạng {rank} của quán. Mời {ban} vào bàn.',
];

// A crowd walks in at once
const CROWD = [
  'Trời ơi, hôm nay quán đông quá! Khách vô liên tục luôn. Cả nhà ngồi sát lại cho {q} thêm ghế nha.',
  'Đông vui quá cả nhà ơi! Ai mới vô thì gõ {kw} cho quán biết nha, {q} chào tất cả.',
  'Khách vô như nước luôn, chủ quán chạy không kịp! Chào mừng tất cả mọi người ghé {q} nha.',
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
  'Chúc {ban} hôm nay gặp toàn chuyện vui, về nhà ngủ ngon, mai dậy tươi.',
  'Chúc {ban} yêu đời hơn, ít nghĩ ngợi hơn, và nhiều bạn tốt hơn.',
  'Chúc {ban} mọi dự định trong năm đều thành công, nhất là mấy cái định hoài chưa làm.',
  'Chúc {ban} ví luôn đầy, bụng luôn no, tim luôn vui.',
];

// Gift thanks by size: 1 small, 2 medium (a dish comes out), 3 big (beer tower), 4 very big (the whole quán stands)
const GIFT = {
  1: ['Cảm ơn {ban} đã gửi {gift} nha! Quán mang ra cho bàn {ban} một vòng ly mới.', '{q} cảm ơn {ban} đã gửi {gift}! Dzô một cái mừng {ban} nè.', 'Ôi {ban} gửi {gift} cho quán này! Dễ thương quá, {q} cảm ơn {ban} nhiều nha.'],
  2: ['Ôi, cảm ơn {ban} đã gửi {gift}! Bàn {ban} có đĩa mồi mới rồi đó.', '{q} cảm ơn {ban} đã gửi {gift} nha! Mồi ngon đang ra bàn liền.', 'Quà xịn đây rồi! Cảm ơn {ban} đã gửi {gift}, quán mang mồi ra bàn {ban} liền, đợi xíu nha.'],
  3: ['Trời ơi, {ban} chơi lớn quá, gửi tới {gift}! Tháp bia ra bàn, cả quán nâng ly, một, hai, ba, dzô!', 'Cảm ơn {ban} đã gửi {gift}! Cả {q} cụng ly mừng {ban} nào, một, hai, ba, dzô!', 'Wow, {ban} gửi {gift}! Cả quán đứng hình luôn. Tháp bia ra bàn, một, hai, ba, dzô cho {ban} nào!'],
  4: ['Ôi trời, cả quán ơi, {ban} vừa gửi {gift}! {q} cảm ơn {ban} nhiều lắm. Cả quán đứng dậy, một, hai, ba, dzô!', 'Đại gia của {q} đây rồi! Cảm ơn {ban} đã gửi {gift}. Lẩu với tháp bia ra bàn, cả quán dzô mừng {ban} nào!', 'Báo động đỏ, đại gia xuất hiện! {ban} gửi {gift}, cả {q} đứng dậy cúi chào. Một, hai, ba, dzô!'],
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
  'Ôi {ban} follow quán rồi! {q} cảm ơn nhiều lắm, khách quen là phải có ghế riêng nha.',
  'Cảm ơn {ban} đã bấm theo dõi! Từ nay {q} có thêm một chiến hữu, vui quá đi.',
  '{ban} vừa follow {q}! Cả quán vỗ tay chào mừng thành viên mới của gia đình nè.',
  'Có người theo dõi mới, cảm ơn {ban} nha! Mai {ban} ghé lại là quán nhớ mặt liền.',
];

const SHARE_NAMED = '{q} cảm ơn {list} đã ngồi chơi với quán. Cả nhà thấy vui thì bấm chia sẻ, rủ thêm bạn bè vô ngồi chung cho đông nha!';
const SHARE = [
  'Cả nhà ơi, thấy quán vui thì bấm chia sẻ live rủ bạn bè vô ngồi chung cho đông nha!',
  'Quán càng đông càng vui. Ai rảnh tay bấm chia sẻ giúp {q} một cái nha, cảm ơn cả nhà.',
  'Rủ thêm chiến hữu vô quán đi cả nhà, bấm chia sẻ live là tới liền.',
  'Một cú bấm chia sẻ, một đàn chiến hữu kéo tới. Cả nhà giúp {q} một tay nha!',
  'Cả nhà ơi, rủ bạn rủ bè vô quán đi, ghế còn nhiều lắm. Bấm chia sẻ là xong.',
  'Quán đông thì chủ quán mới có động lực mở cửa hoài. Chia sẻ giúp {q} nha cả nhà.',
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
  'Chuyện vui nè: hai ông bạn nhậu, một ông hỏi ông kia sao uống ít vậy? Ông kia nói tui sợ vợ. Ông này cười, tui sợ vợ hơn nên tui ngồi uống nước ngọt.',
  'Cả nhà biết không, người Việt mình có thói quen nói dzô là cụng ly, nghe vừa vui vừa đoàn kết. Gõ {kw} cho quán xem nào!',
  'Thử thách nhỏ nè: ai gõ {kw} đầu tiên sau câu này là chiến hữu nhanh tay nhất quán!',
  'Ai đang xem live mà chưa nói gì thì gõ một chữ thôi cũng được, quán thích nghe tiếng cả nhà lắm.',
  'Đố cả nhà: món mồi nào ăn hoài không chán? Đáp án là món ai đó mời mình, đúng không?',
  'Nhắc nhẹ: ngồi lâu thì nhớ uống miếng nước, đứng lên đi lại một chút nha cả nhà.',
  'Comment cho quán biết cả nhà đang xem từ tỉnh nào, xem hôm nay quán có khách xa nhất ở đâu.',
  'Đố vui nè: có một cây bia tươi tên gì mà ai cũng thích? Thôi, quán không nói tên đâu, vì quán ảo mà!',
  'Cả nhà ơi, ai thấy quán vui thì thả tim, ai thấy quán chưa vui thì kể chuyện cho chủ quán nghe nha.',
  'Tối nay ai làm xong việc rồi giơ tay, ai còn tăng ca thì gõ một chữ cố lên cho nhau nào.',
  'Nếu quán là một người, chắc là người hay cười nhất xóm. Cảm ơn cả nhà đã làm quán vui hoài.',
  'Mẹo nhỏ: trước khi đi nhậu ăn chút gì lót dạ, và nhớ hẹn người chở về trước nha cả nhà.',
];

/** @type {Record<import('./chat.js').Topic, string[]>} */
const REPLIES = {
  birthday: ['Chúc mừng sinh nhật {ban}! Cả {q} nâng ly mừng tuổi mới, nhiều tiền, ít muộn phiền nha!', 'Ui, sinh nhật {ban} hả? Cả quán dzô một cái mừng {ban}, chúc tuổi mới thật nhiều niềm vui!', 'Sinh nhật {ban} nè! Cả quán hát chúc mừng, chúc {ban} tuổi mới khỏe mạnh, hạnh phúc, tiền vô như lá mùa thu.'],
  drunk: ['{ban} say rồi hả? Uống ly nước lọc, nghỉ xíu nha. Nhớ đừng lái xe, gọi xe về cho an toàn.', 'Say rồi thì {ban} ngồi nghỉ thôi, quán ảo uống bao nhiêu cũng được, ngoài đời thì chừng đó là đủ rồi nha.', 'Nhớ uống nước lọc nha {ban}, nghỉ ngơi cho khỏe. Quán ảo thì vui chơi thoải mái, còn ngoài đời thì ngoan nha.'],
  sad: ['{ban} buồn hả? Ghé quán ngồi chơi đi, có anh em ở đây nghe {ban} tâm sự. Rồi mọi chuyện cũng qua thôi.', 'Thương {ban} nha. Buồn thì cứ nói ra, cả quán ở đây với {ban}. Mai sẽ là một ngày tốt hơn.', '{ban} ơi, ngồi xuống đây với quán nha. Buồn bao nhiêu cũng nói ra, nói xong là nhẹ lòng liền.'],
  tired: ['{ban} vất vả rồi. Ngồi xuống nghỉ chân đi, ở quán không có deadline đâu.', 'Mệt thì nghỉ chút nha {ban}. Làm việc cả ngày rồi, giờ là lúc thả lỏng với cả nhà.', 'Nghe {ban} mệt mà thương. Ngả lưng xíu, nghe nhạc chill với quán, mọi lo toan để mai tính.'],
  hungry: ['{ban} đói rồi hả? Cả nhà thả đủ chín mươi chín tim là vòng quay mồi ra món liền!', 'Mồi tới liền, {ban} chờ xíu nha! Thả tim cho vòng quay mồi chạy nào cả nhà.', 'Đói hả {ban}? Quán đang nấu nè, thả tim cho vòng quay mồi chạy, may mắn thì trúng món ngon liền.'],
  bye: ['{ban} về hả? Về cẩn thận nha, mai ghé {q} tiếp nhé!', 'Tạm biệt {ban}, ngủ ngon nha. Nhớ đường về quán đó!', 'Tạm biệt {ban} nha, về nhà bình an, giấc ngủ ngon. Quán luôn chừa ghế cho {ban}!'],
};

/** @param {{ q: string; kw: string }} ctx */
export const lines = (ctx) => ({
  greet: (/** @type {string[]} */ names) => {
    const v = { q: ctx.q, kw: ctx.kw, list: listNames(names), ban: ban(names[0] || '') };
    const h = new Date().getHours();
    const part = h >= 5 && h < 11 ? 'morning' : h < 14 ? 'noon' : h < 18 ? 'afternoon' : h < 22 ? 'evening' : 'night';
    // single newcomer: personal line; groups: general or time-of-day line (a third of the time)
    const base = names.length === 1 ? pick(GREET_ONE) : Math.random() < 0.35 ? pick(GREET_TIME[part]) : pick(GREET);
    return Math.random() < 0.55 ? [fill(base, v), fill(pick(HOOKS), v)] : fill(base, v);
  },
  greetBack: (/** @type {string} */ name) => fill(pick(BACK), { q: ctx.q, ban: ban(name) }),
  greetVip: (/** @type {string} */ name, /** @type {number} */ rank) => fill(pick(VIP), { q: ctx.q, ban: ban(name), rank: String(rank) }),
  crowd: () => fill(pick(CROWD), { q: ctx.q, kw: ctx.kw }),
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
