// @ts-check
// Spots what a comment is about, so the host can answer with a line written for it. Matching uses the
// accented words ("thì" is not "thi", "ôm" is not "ốm"), plus a few no-accent spellings that can't mean anything
// else. With "Đọc to từng comment" on, the comment is also read, after bua.js readableComment() has dropped
// banned words, links and phone numbers.
import { tokensOf } from './text.js';

/** @typedef {'birthday' | 'drunk' | 'sad' | 'hungry' | 'bye' | 'tired' | 'thanks' | 'hello' | 'first' | 'praise' | 'praiseHost' | 'love' | 'laugh' | 'music' | 'seat' | 'gift' | 'like' | 'follow' | 'share' | 'money' | 'work' | 'weekend' | 'weather' | 'sleepy' | 'lovelife' | 'vo' | 'bongda' | 'xe' | 'about' | 'food' | 'critic' | 'city' | 'question' | 'dao'} Topic */

/** @type {Array<[Topic, string[]]>} checked in order, first match wins */
const TOPICS = [
  ['birthday', ['sinh nhật', 'sinh nhat', 'hpbd', 'happy birthday', 'sn vui vẻ', 'tuổi mới', 'thôi nôi']],
  ['drunk', ['say rồi', 'xỉn rồi', 'sỉn rồi', 'say quá', 'xỉn quá', 'say ghê', 'quắc cần câu', 'say xỉn', 'say ròi', 'xỉn ròi', 'xin roi', 'say roi']],
  ['sad', ['buồn quá', 'buồn ghê', 'buồn thiệt', 'đang buồn', 'thất tình', 'that tinh', 'chia tay', 'cô đơn', 'chán đời', 'tâm trạng quá', 'bị bồ đá', 'bị người yêu bỏ']],
  ['tired', ['mệt quá', 'mệt ghê', 'mệt mỏi', 'áp lực quá', 'stress quá', 'tăng ca', 'chạy deadline']],
  ['hungry', ['đói quá', 'đói bụng', 'cho xin mồi', 'xin đĩa mồi', 'xin dĩa mồi', 'mồi đâu', 'gọi món', 'đĩa mồi', 'dĩa mồi', 'có mồi không', 'thêm mồi']],
  ['critic', ['chán quá', 'nhạt quá', 'dở quá', 'nhảm quá', 'xàm quá', 'chán ghê', 'dở ghê']],
  ['thanks', ['cảm ơn', 'cám ơn', 'thank you', 'thanks', 'tks', 'thank', 'camon']],
  ['first', ['comment đầu', 'cmt đầu', 'đầu tiên', 'người đầu tiên', 'tem']],
  ['praiseHost', ['chủ quán xinh', 'chủ quán đẹp', 'chị chủ xinh', 'chị chủ đẹp', 'anh chủ đẹp', 'anh chủ quán đẹp', 'giọng hay', 'giọng đẹp', 'giọng dễ thương', 'chủ quán dễ thương', 'giọng ngọt', 'giọng truyền cảm', 'chủ quán hay']],
  ['love', ['yêu quán', 'yêu chủ quán', 'iu quán', 'thương quán', 'thích quán', 'mê quán', 'nghiện quán', 'yêu cả quán', 'yêu mọi người', 'iu mọi người']],
  ['praise', ['quán vui', 'quán xịn', 'quán đẹp', 'quán hay', 'quán dễ thương', 'quán ngon', 'đỉnh quá', 'hay quá', 'hay ghê', 'tuyệt vời', 'quá đỉnh', 'xịn quá', 'dễ thương quá', 'vui quá', 'vui ghê', 'chill quá', 'đỉnh ghê', 'xịn xò', 'sáng tạo quá', 'ý tưởng hay']],
  ['laugh', ['haha', 'hahaha', 'hihi', 'kkk', 'kkkk', 'ha ha', 'cười xỉu', 'cười ngất', 'cười đau bụng', 'cười lăn', 'buồn cười', 'cười muốn xỉu', 'hề quá', 'lầy quá']],
  ['music', ['hát đi', 'hát bài', 'bài hát', 'cho xin bài', 'mở nhạc', 'nhạc hay', 'nhạc gì', 'nhạc này', 'bật nhạc', 'đổi nhạc', 'nhạc chill']],
  ['seat', ['cho em ngồi', 'cho mình ngồi', 'còn chỗ', 'chỗ ngồi', 'bàn vip', 'ghế đâu', 'ngồi đâu', 'không có ghế', 'hết chỗ', 'cho xin ghế', 'cho tôi ngồi', 'lên bàn vip', 'ngồi bàn vip', 'ngồi vip']],
  ['gift', ['xin quà', 'tặng quà', 'gửi quà', 'thả quà', 'có quà', 'quà gì', 'tặng hoa', 'thả hoa', 'bắn quà', 'tặng gì', 'gửi gì', 'quà nè', 'tặng nè']],
  ['like', ['thả tim', 'tim đi', 'thả tym', 'bấm tim', 'like đi', 'like nè', 'tim nè', 'tim tim', 'đủ tim', 'thả tim đi', 'tim nhiều']],
  ['follow', ['follow', 'theo dõi', 'đã follow', 'em follow', 'mình follow', 'folow', 'follow rồi', 'đã theo dõi']],
  ['share', ['chia sẻ', 'share', 'share rồi', 'đã share', 'rủ bạn', 'rủ bạn bè', 'đã chia sẻ']],
  ['money', ['hết tiền', 'cháy túi', 'nghèo quá', 'hết lương', 'chưa có lương', 'lương về', 'nhận lương', 'ví mỏng', 'mất ví', 'cạn ví', 'có lương rồi', 'lãnh lương', 'lương tháng']],
  ['work', ['đi làm', 'sếp', 'công việc', 'làm việc', 'tan ca', 'tan làm', 'hết giờ làm', 'nghỉ làm', 'đồng nghiệp', 'tăng ca xong', 'làm xong', 'xong việc']],
  ['weekend', ['cuối tuần', 'thứ bảy', 'chủ nhật', 'thứ sáu', 'mai nghỉ', 'nghỉ lễ', 'được nghỉ', 'cuối tuần rồi', 'mai được nghỉ', 'ngày mai nghỉ']],
  ['weather', ['trời mưa', 'mưa quá', 'mưa to', 'nóng quá', 'nóng ghê', 'lạnh quá', 'trời lạnh', 'trời nóng', 'mưa rồi', 'rét quá', 'lạnh ghê', 'đang mưa', 'mưa lớn']],
  ['sleepy', ['buồn ngủ', 'ngủ gật', 'mất ngủ', 'khó ngủ', 'thức khuya', 'cú đêm', 'chưa ngủ', 'thức trắng', 'không ngủ được']],
  // "vợ gọi về" phải đứng trước lovelife, không là dính vào "người yêu"
  ['vo', ['vợ gọi', 'vợ kêu', 'vợ la', 'vợ mắng', 'vợ réo', 'vợ bắt về', 'vợ không cho', 'vợ cấm', 'sợ vợ', 'bà xã', 'bị vợ', 'chồng gọi', 'chồng kêu', 'chồng la', 'chồng không cho', 'ông xã', 'bị chồng', 'vợ đợi', 'vợ chờ', 'sợ chồng']],
  ['bongda', ['bóng đá', 'đá banh', 'đá bóng', 'xem bóng', 'trận đấu', 'đội tuyển', 'ngoại hạng', 'ghi bàn', 'tỉ số', 'tỷ số', 'thẻ đỏ', 'cầu thủ', 'world cup', 'sút phạt', 'hiệp một', 'hiệp hai', 'đội nhà', 'vô địch', 'bắt kèo']],
  ['xe', ['kẹt xe', 'tắc đường', 'đổ xăng', 'hết xăng', 'xe hư', 'thủng săm', 'xe máy', 'chạy xe', 'đi xe ôm', 'gọi xe', 'xe buýt', 'dắt bộ', 'công an giao thông', 'thổi nồng độ cồn', 'nồng độ cồn']],
  ['lovelife', ['người yêu', 'crush', 'có người yêu', 'tìm người yêu', 'ế quá', 'ế rồi', 'độc thân', 'single', 'ế quá trời', 'ế bền vững', 'tìm bồ', 'thả thính']],
  ['about', ['quán tên gì', 'tên quán', 'mở cửa mấy giờ', 'mấy giờ đóng', 'quán ở đâu', 'địa chỉ quán', 'quán thật', 'có thật không', 'quán ảo', 'thật hay ảo', 'live mấy giờ', 'mấy giờ live', 'ai làm quán', 'ai làm ra']],
  ['hello', ['xin chào', 'chào cả nhà', 'chào quán', 'chào chủ quán', 'hello', 'hi cả nhà', 'alo', 'chào mọi người', 'chào mn', 'chào cả quán', 'chào mng', 'hi mọi người', 'hello cả nhà', 'helo', 'hế lô', 'chào nha']],
  ['food', ['ốc', 'lẩu', 'nướng', 'mực', 'nem chua', 'chân gà', 'gỏi', 'khô bò', 'đậu phộng', 'xúc xích', 'bò nướng', 'gà nướng', 'ếch', 'cá nướng', 'tôm nướng']],
  ['bye', ['đi ngủ', 'ngủ đây', 'ngủ thôi', 'về đây', 'về nha', 'về nhé', 'về thôi', 'tạm biệt', 'bye', 'bai bai', 'pp', 'out đây', 'off đây', 'đi về', 'good night', 'g9']],
];

const NUMBER_WORDS = ['một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];
/** "cho thêm 3 em đào", "gọi đào", "kêu hai em": asking for "đào" (the joke ends with glasses of trà đào) */
export function wantsDao(/** @type {string} */ comment) {
  const w = tokensOf(comment);
  const i = w.indexOf('đào');
  if (i < 0 || w[i + 1] === 'tạo') return false; // "đào tạo" is training
  return w.some((x) => ['thêm', 'gọi', 'kêu', 'cho', 'order', 'em', 'ẻm', 'bé', 'đâu', 'xin', 'dắt', 'book', 'mấy', 'có'].includes(x) || /^\d+$/.test(x) || NUMBER_WORDS.includes(x));
}
/** How many "em đào" were asked for: 1 to 10 */
export function daoCount(/** @type {string} */ comment) {
  for (const x of tokensOf(comment)) {
    if (/^\d+$/.test(x)) return Math.max(1, Math.min(10, Number(x)));
    const k = NUMBER_WORDS.indexOf(x);
    if (k >= 0) return k + 1;
  }
  return 1;
}

/** @returns {Topic | null} */
export function detectTopic(/** @type {string} */ comment) {
  const t = ` ${tokensOf(comment).join(' ')} `;
  if (t.length < 3) return null;
  if (wantsDao(comment)) return 'dao';
  if (detectCity(comment)) return 'city';
  for (const [topic, phrases] of TOPICS) {
    if (phrases.some((p) => t.includes(` ${p} `))) return topic;
  }
  // a question nobody has a ready answer for still deserves a friendly word
  if (comment.includes('?') || / (sao|gì|đâu|nào|mấy|bao nhiêu) /u.test(t)) return 'question';
  return null;
}

const PLACES = ['Hà Nội', 'Sài Gòn', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Huế', 'Nha Trang', 'Đà Lạt', 'Vũng Tàu', 'Biên Hòa', 'Bình Dương', 'Quảng Ninh', 'Nghệ An', 'Thanh Hóa', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Lâm Đồng', 'Đắk Lắk', 'Gia Lai', 'Kon Tum', 'Tây Ninh', 'Long An', 'Tiền Giang', 'Bến Tre', 'Vĩnh Long', 'Trà Vinh', 'An Giang', 'Kiên Giang', 'Cà Mau', 'Bạc Liêu', 'Sóc Trăng', 'Hậu Giang', 'Đồng Tháp', 'Đồng Nai', 'Thái Nguyên', 'Bắc Ninh', 'Bắc Giang', 'Hải Dương', 'Nam Định', 'Thái Bình', 'Ninh Bình', 'Hưng Yên', 'Vĩnh Phúc', 'Phú Thọ', 'Lào Cai', 'Sơn La', 'Hòa Bình', 'Hà Giang', 'Cao Bằng', 'Lạng Sơn', 'Tuyên Quang', 'Điện Biên', 'Bình Thuận', 'Ninh Thuận', 'Bình Phước', 'Phan Thiết', 'Hội An', 'Quy Nhơn', 'Buôn Ma Thuột', 'Pleiku', 'Rạch Giá', 'Mỹ Tho'];
/** "từ Hà Nội", "ở Đà Nẵng", "đang ở Cần Thơ": the place when the comment says where the person is */
export function detectCity(/** @type {string} */ comment) {
  const t = ` ${tokensOf(comment).join(' ')} `;
  if (!/ (từ|ở|tại|quê|đến từ|đang ở|người) /u.test(t)) return '';
  for (const p of PLACES) if (t.includes(` ${tokensOf(p).join(' ')} `)) return p === 'Hồ Chí Minh' ? 'Sài Gòn' : p;
  return '';
}

// Lots of chat: answer often but never pile up. One answer per person every 3 minutes; overall at most one every
// 6 seconds (3 for birthdays, goodbyes, hometowns and thanks, which people notice most); gift thanks are separate.
const PER_USER_MS = 3 * 60 * 1000;
const GLOBAL_MS = 6 * 1000;
const GLOBAL_PRIORITY_MS = 3 * 1000;
/** @type {Set<Topic>} */
const PRIORITY = new Set(['dao', 'birthday', 'bye', 'city', 'thanks', 'sad', 'drunk', 'first', 'follow', 'share', 'vo', 'xe']);
/** @type {Map<string, number>} */
const lastByUser = new Map();
let lastAny = 0;
export function mayAnswer(/** @type {string} */ userId, /** @type {Topic | null} */ topic = null, now = Date.now()) {
  if (now - lastAny < (topic && PRIORITY.has(topic) ? GLOBAL_PRIORITY_MS : GLOBAL_MS)) return false;
  if (now - (lastByUser.get(userId) ?? 0) < PER_USER_MS) return false;
  lastAny = now;
  lastByUser.set(userId, now);
  if (lastByUser.size > 3000) lastByUser.delete(lastByUser.keys().next().value ?? '');
  return true;
}
