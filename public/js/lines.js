// @ts-check
// Mọi câu chủ quán nói. {q} = tên quán (dashboard "Tên quán"), {ban} = "bạn Lan", {list} = "bạn A, bạn B và bạn C".
// Quán ảo cho vui: không giục ai uống thật, thỉnh thoảng nhắc uống có chừng và không lái xe.
import { ban, listNames } from './names.js';
import { BUA_ACK, BUA_REPLIES, DAO_SERVED, DAO_SERVED_PLAIN, PLAIN_SAY, READ_ASK, READ_SAY, TALK_NAMED, TALK_ROOM } from './bua.js';

const NUM = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];

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
  'Comment nhậu là có ghế ngồi, gõ tên món là bếp làm liền, miễn phí nha.',
  'Tặng quà một xu là có món ngon, năm xu là có nồi lẩu nóng hổi đó nha.',
  'Comment nhiều là lên bảng vàng của quán, có tên trên bảng là oai lắm.',
  'Nhớ follow quán để lần sau vô là có ghế quen liền.',
  'Nếu thấy vui thì rủ thêm bạn vô ngồi chung cho đông.',
  'Muốn đổi bàn thì gõ bàn với số, ví dụ bàn ba, là quán dắt qua liền.',
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
  'Ôi, {ban}, top {rank} của {q}, ghé quán rồi! Ghế đẹp nhất quán luôn chờ {ban} đó.',
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

// Thanks for a gift that is set to bring a dish
const GIFT_FOOD = [
  'Cảm ơn {ban} tặng {gift}! Quán lên mồi liền, {mon} nóng hổi ra bàn của {ban} đây!',
  '{ban} tặng {gift}, quán đáp lễ ngay một dĩa {mon}! Ăn đi {ban}, dzô nào!',
  'Có {gift} của {ban} là có mồi! {mon} ra bàn, mời {ban} nhâm nhi nha!',
  'Cảm ơn {ban}! Tặng {gift} thì quán lên {mon} cho {ban} liền, nhậu ngon miệng nha!',
];

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
  'Đói thì cứ comment tên món nha, đậu lạc, nem chua, khoai tây chiên, bếp làm miễn phí hết.',
  'Ai biết vì sao bia hơi phải uống trong ngày không? Vì bia hơi không thanh trùng như bia chai, để qua đêm là mất ngon.',
  'Tối nay cả nhà nhậu món gì? Comment cho quán biết với, xem ai có món ngon nhất.',
  'Quán ảo nên uống bao nhiêu cũng không say. Còn ngoài đời thì uống có chừng thôi nha cả nhà.',
  'Nhắc cả nhà: tặng quà ba mươi xu là đập quán, chủ quán khóc thét luôn. Chín mươi chín xu là bao cả quán ăn lẩu!',
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

// A comment the host has no special line for
const ACK = [
  'Cảm ơn {ban} đã lên tiếng nha!',
  '{ban} nói đúng quá!',
  'Hay đó {ban}! Cả quán đang nghe nè.',
  'Ui, {ban} nói chuyện duyên ghê.',
  '{ban} ơi, chủ quán đọc được rồi nha, cảm ơn {ban}!',
  'Có {ban} ngồi chơi là quán vui hẳn lên.',
  '{ban} cứ comment thoải mái, quán thích nghe lắm.',
];

// Chat is busy: thank several people at once
const SHOUT = [
  'Cảm ơn {list} đang trò chuyện sôi nổi! Quán vui hẳn lên.',
  '{list} chat hăng quá, chủ quán đọc không kịp luôn! Cả quán đang nghe nè.',
  'Ở bàn {list} đang nói chuyện rôm rả ghê. Cả nhà cứ tự nhiên nha!',
  'Hoan hô {list}, chat nhiệt tình quá. {q} cảm ơn cả nhà, gõ {kw} cho quán thêm vui nào!',
  'Mấy bạn {list} làm quán ồn ào dễ thương quá, cảm ơn cả nhà nha!',
];

// Comments are flying in too fast to answer them all
const FAST = [
  'Cả nhà comment nhanh quá, chủ quán đọc không kịp! Câu nào quan trọng thì nhắc lại một lần nha.',
  'Chat chạy ào ào luôn, {q} cảm ơn cả nhà nhiệt tình quá! Chủ quán đọc từ từ nha.',
  'Wow, bình luận nhiều dữ vậy! Quán cảm ơn cả nhà, ai có câu hỏi hay thì gõ ngắn gọn cho quán dễ đọc nha.',
];

// A person has cheered with the keyword many times
const DZO_MILESTONE = [
  '{ban} dzô lần thứ {n} rồi! Chiến hữu thứ thiệt của quán luôn.',
  'Hoan hô {ban}, cụng ly tới lần thứ {n}! Cả quán nâng ly mừng {ban} nào.',
  '{ban} dzô hăng quá trời, lần thứ {n} rồi đó. Cả quán vỗ tay!',
];

/** @type {Record<import('./chat.js').Topic, string[]>} */
const REPLIES = {
  birthday: ['Chúc mừng sinh nhật {ban}! Cả {q} nâng ly mừng tuổi mới, nhiều tiền, ít muộn phiền nha!', 'Ui, sinh nhật {ban} hả? Cả quán dzô một cái mừng {ban}, chúc tuổi mới thật nhiều niềm vui!', 'Sinh nhật {ban} nè! Cả quán hát chúc mừng, chúc {ban} tuổi mới khỏe mạnh, hạnh phúc, tiền vô như lá mùa thu.'],
  drunk: ['{ban} say rồi hả? Uống ly nước lọc, nghỉ xíu nha. Nhớ đừng lái xe, gọi xe về cho an toàn.', 'Say rồi thì {ban} ngồi nghỉ thôi, quán ảo uống bao nhiêu cũng được, ngoài đời thì chừng đó là đủ rồi nha.', 'Nhớ uống nước lọc nha {ban}, nghỉ ngơi cho khỏe. Quán ảo thì vui chơi thoải mái, còn ngoài đời thì ngoan nha.'],
  sad: ['{ban} buồn hả? Ghé quán ngồi chơi đi, có anh em ở đây nghe {ban} tâm sự. Rồi mọi chuyện cũng qua thôi.', 'Thương {ban} nha. Buồn thì cứ nói ra, cả quán ở đây với {ban}. Mai sẽ là một ngày tốt hơn.', '{ban} ơi, ngồi xuống đây với quán nha. Buồn bao nhiêu cũng nói ra, nói xong là nhẹ lòng liền.'],
  tired: ['{ban} vất vả rồi. Ngồi xuống nghỉ chân đi, ở quán không có deadline đâu.', 'Mệt thì nghỉ chút nha {ban}. Làm việc cả ngày rồi, giờ là lúc thả lỏng với cả nhà.', 'Nghe {ban} mệt mà thương. Ngả lưng xíu, nghe nhạc chill với quán, mọi lo toan để mai tính.'],
  hungry: ['{ban} đói rồi hả? Comment tên món đi, đậu lạc, đậu tẩm hành, nem chua, bếp làm miễn phí liền!', 'Mồi có liền {ban} ơi! Gõ tên món như khoai tây chiên hay dưa chuột là bếp nổi lửa.', 'Đói hả {ban}? Món bình dân thì comment là có, tặng quà một xu là có món ngon, năm xu là có lẩu.'],
  bye: ['{ban} về hả? Về cẩn thận nha, mai ghé {q} tiếp nhé!', 'Tạm biệt {ban}, ngủ ngon nha. Nhớ đường về quán đó!', 'Tạm biệt {ban} nha, về nhà bình an, giấc ngủ ngon. Quán luôn chừa ghế cho {ban}!'],
  thanks: ['Không có chi {ban} ơi! {q} luôn vui khi có {ban} ghé chơi.', 'Cảm ơn lại {ban} nha, có {ban} quán mới vui đó.', '{ban} khách sáo quá, ngồi chơi cho vui thôi mà. Có {ban} là quán đông vui rồi.'],
  hello: ['Chào {ban}! {q} chào {ban} nha, ngồi chơi cho vui.', 'Hello {ban}! Vô ngồi đi, gõ {kw} cho quán nghe nào.', 'Chào {ban} nha! Quán mình hôm nay vui lắm, {ban} ngồi chơi với cả nhà.', 'Ê, {ban} chào quán nè! Chào {ban}, ngồi xuống bắt chuyện đi.'],
  first: ['Wow, {ban} là người comment sớm nhất luôn! Quán tặng {ban} một tràng vỗ tay.', 'Nhanh tay ghê, {ban} nhanh nhất quán hôm nay! Cả nhà vỗ tay nào.'],
  praise: ['Cảm ơn {ban} nha! Nghe {ban} khen là chủ quán vui cả buổi.', 'Ui, {ban} khen làm quán mắc cỡ luôn. Cảm ơn {ban} nhiều nha!', '{ban} dễ thương quá, quán cảm ơn! Cả nhà thấy vui thì thả tim ủng hộ quán nha.', 'Nghe {ban} khen quán, chủ quán muốn nhảy cẫng lên luôn đó.'],
  praiseHost: ['Ôi {ban} khen chủ quán quá trời! Chủ quán đỏ mặt luôn nè, cảm ơn {ban} nha.', 'Cảm ơn {ban} đã khen! Chủ quán ngại quá, tặng {ban} một ly nước ngọt mừng nha.', '{ban} khéo miệng ghê! Chủ quán cảm ơn, hôm nay vui cả ngày luôn.'],
  love: ['Ôi, {ban} yêu quán hả? Quán cũng thương {ban} lắm luôn! Ghé thường xuyên nha.', 'Nghe {ban} nói vậy chủ quán xúc động ghê. {q} cũng thương {ban} nhiều lắm.', 'Trời ơi dễ thương quá, cả quán thương {ban} nè. Dzô một cái nào!'],
  laugh: ['Ha ha, {ban} cười gì mà vui dữ vậy! Cười cho cả quán nghe với.', '{ban} cười làm cả quán cười theo luôn. Cười nhiều trẻ lâu nha!', 'Ui, {ban} cười tới nghẹn rồi đó. Uống miếng nước đi {ban}.'],
  music: ['{ban} muốn nghe nhạc hả? Quán đang mở nhạc chill đó, nhạc nền êm êm nghe cho thư giãn nha.', 'Nhạc quán là nhạc chill, nghe để thư giãn cho {ban} nè. {ban} thích thể loại nào cứ nói chủ quán nghe.', 'Chủ quán hát dở lắm {ban} ơi, để nhạc chill nghe cho an toàn nha!'],
  seat: ['{ban} muốn có ghế hả? Comment chữ nhậu là quán kéo ghế liền!', '{ban} ơi, ghế còn nhiều lắm, comment nhậu là có chỗ, muốn ngồi bàn nào thì gõ bàn với số nha.', 'Follow quán hoặc comment nhậu là có ghế {ban} ơi. Muốn qua bàn bạn bè thì gõ bàn ba, bàn năm, tùy {ban}!'],
  gift: ['Cảm ơn {ban} có lòng nha! Quà một xu là có món ngon, năm xu có lẩu, ba mươi xu đập quán, chín mươi chín xu bao cả quán.', '{ban} định tặng quà hả? Quán cảm ơn trước nha! Quà nào cũng được đọc tên cảm ơn và lên bảng vàng.', 'Quà là tấm lòng, không bắt buộc đâu {ban}. Nhưng nếu {ban} gửi, chủ quán bưng mồi ra tận bàn luôn!'],
  like: ['{ban} nhắc đúng ý chủ quán! Cả nhà thả tim đi, tim bay đầy quán mới vui.', 'Cảm ơn {ban} nha! Cả nhà theo {ban} thả tim cho quán đi, tim càng nhiều quán càng vui.'],
  follow: ['Cảm ơn {ban} đã follow quán! Từ nay {ban} là khách quen rồi, ghé thường xuyên nha.', 'Ôi, {ban} follow quán rồi hả? Quán cảm ơn nhiều nha, có ghế riêng cho khách quen đó!'],
  share: ['Cảm ơn {ban} đã chia sẻ quán! {ban} tốt bụng quá, cả quán cảm ơn nha.', '{ban} chia sẻ live cho quán hả? Chủ quán cảm ơn {ban} nhiều nha, rủ thêm bạn vô ngồi chung nữa nha.'],
  money: ['Ôi, chuyện tiền bạc ai cũng có lúc. {ban} cứ ngồi chơi ở quán ảo, không tốn đồng nào. Rồi tiền sẽ về thôi nha.', '{ban} có lương rồi hả? Chúc mừng nha! Nhớ chi tiêu cho khôn khéo, giữ lại chút để dành nha.', 'Ví mỏng thì tim vui bù lại nha {ban}. Ở quán này ngồi miễn phí, chỉ cần mang tiếng cười.'],
  work: ['{ban} vất vả rồi, ngồi xuống nghỉ ngơi nha. Công việc để mai tính, giờ là giờ chill.', 'Tan ca rồi hả {ban}? Ghé quán ngồi xả stress với cả nhà đi.', 'Làm việc cả ngày rồi, giờ {ban} xứng đáng được thư giãn. Ngồi xuống nghe nhạc, tám chuyện với quán nha.'],
  weekend: ['Cuối tuần rồi, vui quá! Cả quán nghỉ ngơi xả hơi thôi, {ban} nhỉ.', '{ban} sắp được nghỉ hả? Vậy chúc {ban} nghỉ thiệt vui, ngủ thiệt đã nha!', 'Cuối tuần là phải chill, cả nhà ha! {ban} có dự định gì không, kể quán nghe với.'],
  weather: ['Trời vậy mà {ban} vẫn ghé quán, quý quá! Vô ngồi cho ấm, đừng ra ngoài nha.', '{ban} nhớ giữ gìn sức khỏe nha, thời tiết thất thường lắm. Ngồi quán mình cho an toàn.', 'Mưa gió thế này ngồi quán là nhất rồi {ban} ơi. Nhạc chill, mồi nóng, bạn bè quanh bàn.'],
  sleepy: ['{ban} buồn ngủ thì đi ngủ đi, giữ sức khỏe quan trọng hơn. Quán mai vẫn mở cho {ban} nha.', 'Thức khuya hoài không tốt đâu {ban} ơi, nhưng nếu chưa ngủ được thì ngồi với quán một chút, nghe nhạc nhẹ nha.', 'Cú đêm hả {ban}? Quán cũng là hội cú đêm nè. Nhưng nhớ ngủ đủ giấc nha.'],
  lovelife: ['{ban} chuyện tình cảm hả? Cả quán đang ngồi nghe nè. Duyên tới là tới, đừng vội nha!', 'Độc thân vui tính cũng tốt mà {ban}. Quán đây toàn bạn bè, không lo cô đơn đâu.', 'Ôi chuyện tim gan, cả nhà ơi cho {ban} lời khuyên đi. Còn quán chúc {ban} sớm gặp người thương nha!'],
  about: ['Quán mình tên {q}, là quán nhậu ảo cho vui, mở trong buổi live này nha {ban}. Ai vô cũng được ngồi chơi miễn phí.', '{ban} hỏi hay ghê! {q} là quán ảo, không bán gì thiệt, chỉ có tiếng cười và bạn bè thôi.', 'Quán chỉ có trên live này thôi {ban} ơi. Muốn gặp lại thì bấm follow để biết khi nào quán mở cửa nha.'],
  food: ['Nghe {ban} nói là thèm luôn! Món ngon như mực nướng, ốc hương thì tặng quà một xu là bếp làm liền nha.', '{ban} nói món hay ghê! Quán ảo nên chỉ có mồi ảo, nhưng cứ tưởng tượng thơm phức nha.', 'Món đó nghe ngon ghê {ban} ơi. Cả nhà ơi, ai thích món đó thì gõ {kw} cho quán xem nào!'],
  critic: ['Quán cảm ơn góp ý của {ban}, quán sẽ cố gắng vui hơn nha. {ban} muốn quán làm gì thêm thì nói chủ quán nghe.', 'Ui, {ban} thấy chưa vui hả? Vậy gõ {kw} cho quán nghe, rồi cả nhà cùng cụng ly cho vui lên nào.'],
  city: ['Chào {ban} từ {city}! Xa vậy mà vẫn ghé quán, quý quá. Ngồi chơi với cả nhà nha.', 'Wow, có khách từ {city} nè! Cả quán chào {ban} nha, {city} dạo này thế nào rồi?', '{city} có {ban} ghé quán là quán vinh dự lắm! Cả nhà ai ở {city} giơ tay lên nào.', 'Hello {city}! {ban} ơi, quê mình {city} nhiều bạn không, rủ thêm về quán chơi nha.'],
  dao: ['{ban} muốn {n} phần đào hả? Tặng quà là quán mang ra {n} ly trà đào nha!', 'Đào hả {ban}? Quán có trà đào ngon lắm, tặng quà là có liền nha!'],
  question: ['{ban} hỏi hay ghê! Chủ quán nghe rồi, câu này để cả nhà trả lời giùm nha.', 'Câu hỏi của {ban} hay quá, nhưng quán ảo nên chủ quán chỉ biết một điều: ngồi lại là vui. Cả nhà ai biết thì giúp {ban} nha.', '{ban} hỏi chi vậy? Cả nhà ơi, ai trả lời giùm {ban} nào.'],
};

const TREAT = [
  'Trời ơi {ban} bao cả quán! Bếp ơi, mỗi bàn một nồi lẩu! Cả quán cảm ơn {ban} đi nào!',
  '{ban} chơi lớn quá, bao nguyên quán luôn! Lẩu lên từng bàn, ai cũng có phần, dzô cảm ơn {ban}!',
];
const SIT = [
  'Mời {ban} vào bàn số {no}! Muốn ăn gì cứ comment tên món, đậu lạc, nem chua, bia hơi có liền.',
  '{ban} ngồi bàn số {no} nha! Quán bình dân, gọi món miễn phí, tặng quà là có lẩu.',
  'Có khách! {ban} vào bàn số {no}, kéo ghế nhựa ngồi đi, gõ {kw} cụng ly với cả bàn nào!',
  'Bàn số {no} có thêm {ban} rồi! Ngồi sát vô cho ấm, ai chưa có chỗ thì chat nhậu nha.',
];
const MOVE = ['Mời {ban} qua bàn số {no}! Ngồi chỗ mới nhớ chào hàng xóm nha.', '{ban} chuyển sang bàn số {no} rồi, bàn cũ chắc buồn lắm đó.', 'Ok, {ban} qua bàn số {no}. Đổi bàn đổi vận, nhậu tiếp thôi!'];
const FULL = ['Bàn số {no} hết chỗ rồi {ban} ơi, chọn bàn khác đi!', '{ban} ơi bàn số {no} đông quá, ngồi chen không nổi, thử bàn khác nha.'];

const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Capital letter at the start of every sentence */
const sentences = (/** @type {string} */ s) => cap(s).replace(/([.!?]\s+)(\p{Ll})/gu, (_, p, c) => p + c.toUpperCase());

/** @param {{ q: string; kw: string; style?: string }} ctx style: 'bua' (hài hước, lầy) or 'hien' (lịch sự) */
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
  giftFood: (/** @type {string} */ name, /** @type {string} */ giftName, /** @type {string} */ dish, /** @type {number} */ count) => {
    const more = count > 1 ? ` ${count} phần` : '';
    return [fill(pick(GIFT_FOOD), { ban: ban(name), gift: giftWords(giftName), mon: dish + more }), fill(pick(TOASTS), { ban: ban(name) })];
  },
  follow: (/** @type {string} */ name) => fill(pick(FOLLOW), { q: ctx.q, ban: ban(name) }),
  share: (/** @type {string[]} */ names) => (names.length ? fill(SHARE_NAMED, { q: ctx.q, list: listNames(names) }) : fill(pick(SHARE), { q: ctx.q })),
  idle: () => fill(pick(IDLE), { q: ctx.q, kw: ctx.kw }),
  wave: () => pick(['Cả quán đông vui quá! Nào, một, hai, ba, dzô!', 'Cả nhà nâng ly lên nào! Một, hai, ba, dzô!', 'Dzô! Trăm phần trăm cả nhà ơi!']),
  smash: (/** @type {string} */ name) => [
    pick([`Trời ơi! ${ban(name)} đập quán tôi rồi!`, `Á á á! ${ban(name)} ơi, sao đập quán tôi vậy trời!`, `Chết rồi! ${ban(name)} đập quán tôi rồi!`]),
    pick(['Huhu, bàn ghế của tôi, ly chén của tôi, huhu!', 'Huhu, mới sắm bàn mới tuần trước mà, huhu!', 'Huhu, tôi biết ăn nói sao với chủ nhà bây giờ!']),
  ],
  smashClean: () => pick(['Thôi, lau nước mắt, dọn lại quán nào!', 'Hức, không khóc nữa, để tôi quét dọn!']),
  smashDone: () => pick([`Xong rồi! ${ctx.q} sạch bóng, lần sau đập nhẹ tay nha!`, `Dọn xong, ${ctx.q} mở cửa lại! Nhẹ tay giùm tôi nha!`]),
  reply: (/** @type {import('./chat.js').Topic} */ topic, /** @type {string} */ name, /** @type {string} */ city = '', n = 1) =>
    fill(pick((ctx.style === 'hien' ? REPLIES : BUA_REPLIES)[topic]), { q: ctx.q, kw: ctx.kw, ban: ban(name), city, n: NUM[n] ?? String(n) }),
  /** "nhậu": a seat at a numbered table */
  sitDown: (/** @type {string} */ name, /** @type {number} */ no) =>
    sentences(fill(pick(SIT), { ban: ban(name), no: NUM[no] ?? String(no), kw: ctx.kw })),
  treat: (/** @type {string} */ name) => sentences(fill(pick(TREAT), { ban: ban(name) })),
  tableMove: (/** @type {string} */ name, /** @type {number} */ no) => sentences(fill(pick(MOVE), { ban: ban(name), no: NUM[no] ?? String(no) })),
  tableFull: (/** @type {string} */ name, /** @type {number} */ no) => sentences(fill(pick(FULL), { ban: ban(name), no: NUM[no] ?? String(no) })),
  /** Start a chat with someone who commented a little while ago */
  talkTo: (/** @type {string} */ name) => sentences(fill(pick(TALK_NAMED), { q: ctx.q, kw: ctx.kw, ban: ban(name) })),
  /** Ask the whole room something */
  talkRoom: () => sentences(fill(pick(TALK_ROOM), { q: ctx.q, kw: ctx.kw })),
  /** Someone who asked for "đào" sent a gift: n glasses of trà đào */
  daoServed: (/** @type {string} */ name, /** @type {number} */ n) =>
    sentences(fill(pick(ctx.style === 'hien' ? DAO_SERVED_PLAIN : DAO_SERVED), { ban: ban(name), n: NUM[n] ?? String(n) })),
  /** A comment that matched nothing: a short friendly acknowledgement */
  ack: (/** @type {string} */ name) => fill(pick(ctx.style === 'hien' ? ACK : BUA_ACK), { q: ctx.q, kw: ctx.kw, ban: ban(name) }),
  /**
   * Read a comment aloud, then answer it: "Bạn Lan hỏi: quán ở đâu vậy? Ngay trong điện thoại của bạn đó…".
   * `text` must already be cleaned by readableComment(). The answer says "bạn" since the name was just read.
   */
  readComment: (/** @type {string} */ name, /** @type {string} */ text, /** @type {import('./chat.js').Topic | null} */ topic, /** @type {string} */ city = '', n = 1) => {
    const hien = ctx.style === 'hien';
    const asking = topic === 'question' || text.endsWith('?');
    const intro = cap(fill(pick(hien ? PLAIN_SAY : asking ? READ_ASK : READ_SAY), { name: ban(name), text: asking && !/[?!.…]$/.test(text) ? `${text}?` : text }).replace(/\?\.$/, '?'));
    const list = topic ? (hien ? REPLIES : BUA_REPLIES)[topic] : hien ? ACK : BUA_ACK;
    const answer = fill(pick(list), { q: ctx.q, kw: ctx.kw, ban: 'bạn', city, n: NUM[n] ?? String(n) });
    // "…run. bạn ngồi đây" -> "…run. Bạn ngồi đây"
    return `${intro} ${sentences(answer)}`;
  },
  /** Several people chatting at once: thank them together */
  shoutout: (/** @type {string[]} */ names) => fill(pick(SHOUT), { q: ctx.q, kw: ctx.kw, list: listNames(names) }),
  fastChat: () => fill(pick(FAST), { q: ctx.q, kw: ctx.kw }),
  dzoMilestone: (/** @type {string} */ name, /** @type {number} */ n) => fill(pick(DZO_MILESTONE), { q: ctx.q, ban: ban(name), n: String(n) }),
});
