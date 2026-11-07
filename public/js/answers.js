// @ts-check
// Trả lời thật cho câu hỏi của người xem: giờ, ngày, quán ở đâu, vào bàn sao, gọi món gì, quà được gì, mình ngồi
// bàn mấy, món của mình đâu, ai top 1, cộng trừ nhân chia... Lấy số liệu thật của quán lúc hỏi (ctx).
// Câu hỏi không có trong đây thì chủ quán đáp kiểu bựa như cũ (lines.js / bua.js).
import { tokensOf } from './text.js';

/**
 * @typedef {{
 *   q: string; kw: string; gender: 'f' | 'm'; now: Date; seated: number; viewers: number; myTable: number;
 *   top: string; cooking: string[]; myDish: string; free: string[]; tiers: { food: number; hotpot: number; smash: number; treat: number };
 * }} AnswerCtx
 */

const fold = (/** @type {string} */ s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
/** @template T @param {T[]} l @returns {T} */
const pick = (l) => l[Math.floor(Math.random() * l.length)];
const DAYS = ['Chủ nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];
const tierText = (/** @type {AnswerCtx} */ c) =>
  [
    c.tiers.food > 0 && `${c.tiers.food} xu là có món ngon`,
    c.tiers.hotpot > 0 && `${c.tiers.hotpot} xu là có nồi lẩu`,
    c.tiers.smash > 0 && `${c.tiers.smash} xu là đập quán`,
    c.tiers.treat > 0 && `${c.tiers.treat} xu là bao cả quán ăn lẩu`,
  ]
    .filter(Boolean)
    .join(', ');

/**
 * [phrases, answer]. A phrase of two words or more also matches without accents ("may gio roi"); a one-word phrase
 * must be typed with its accents, so short words don't catch the wrong thing.
 * @type {Array<[string[], (c: AnswerCtx) => string]>}
 */
const RULES = [
  [
    ['là ai', 'bot à', 'bot hả', 'là bot', 'người thật không', 'người thật hả', 'ai đọc vậy', 'máy đọc', 'giọng ai', 'giọng ai vậy', 'ai nói vậy', 'người hay máy', 'có phải ai', 'là ai vậy'],
    (c) => pick([`Chủ quán ${c.q} là giọng AI đọc đó nha, nhưng chủ live là người thật đang ngồi đọc comment của cả nhà đó!`, 'Giọng chủ quán là giọng AI, còn người đứng sau quán là người thật nha. Comment gì cũng có người đọc hết!']),
  ],
  [
    ['mấy giờ rồi', 'mấy h rồi', 'giờ là mấy giờ', 'bây giờ mấy giờ', 'giờ mấy giờ rồi', 'mấy giờ vậy'],
    (c) => {
      const h = c.now.getHours();
      const m = c.now.getMinutes();
      const tail = h >= 23 || h < 4 ? 'Khuya lắm rồi, ai mai đi làm thì ngủ sớm nha!' : h < 11 ? 'Sáng sớm mà ghé quán nhậu, chăm ghê!' : h < 18 ? 'Còn sớm, ngồi chơi thêm đi!' : 'Đúng giờ vàng của quán nhậu luôn!';
      return `Giờ là ${h} giờ ${m} phút nè. ${tail}`;
    },
  ],
  [
    ['hôm nay thứ mấy', 'nay thứ mấy', 'hôm nay ngày mấy', 'nay ngày mấy', 'hôm nay ngày bao nhiêu', 'ngày bao nhiêu rồi', 'thứ mấy rồi'],
    (c) => `Hôm nay là ${DAYS[c.now.getDay()]}, ngày ${c.now.getDate()} tháng ${c.now.getMonth() + 1} nha. ${c.now.getDay() === 5 || c.now.getDay() === 6 ? 'Cuối tuần rồi, quẩy nhẹ thôi!' : 'Ngày nào ghé quán cũng là ngày đẹp!'}`,
  ],
  [
    ['quán ở đâu', 'địa chỉ quán', 'quán ở chỗ nào', 'địa chỉ ở đâu', 'quán nằm ở đâu', 'xin địa chỉ', 'cho xin địa chỉ'],
    (c) => pick([`${c.q} ở số một trăm ba mươi tư Trần Phú, nhưng mà là trong live thôi nha. Chạy tới đó thiệt là gõ cửa nhà người ta đó!`, 'Quán ở ngay trong điện thoại của bạn nè, số một trăm ba mươi tư Trần Phú phiên bản online. Ngồi đâu cũng tới quán được!']),
  ],
  [
    ['quán thật không', 'có thật không', 'thật hay ảo', 'ảo hay thật', 'quán ảo à', 'quán ảo hả', 'có quán thật', 'ngoài đời có không'],
    (c) => `${c.q} là quán nhậu ảo cho vui thôi nha, không bán rượu bia thật. Món ăn cũng là món ảo, chỉ có tiếng cười là thật!`,
  ],
  [
    ['mấy giờ đóng', 'mở tới mấy giờ', 'mở cửa tới mấy giờ', 'live tới mấy giờ', 'mấy giờ live', 'mấy giờ nghỉ', 'khi nào nghỉ', 'live đến mấy giờ', 'mở cửa mấy giờ'],
    () => pick(['Quán mở tới khi chủ quán gục trên bàn thì thôi! Muốn biết lúc nào quán mở thì bấm follow là có thông báo nha.', 'Chưa đóng đâu, còn khách là còn bán! Follow quán để lần sau mở cửa là biết liền nha.']),
  ],
  [
    ['quán tên gì', 'tên quán là gì', 'tên quán gì', 'quán gì vậy', 'đây là quán gì'],
    (c) => `Quán tên là ${c.q}, quán nhậu vỉa hè online, số một trăm ba mươi tư Trần Phú phiên bản ảo nha!`,
  ],
  [
    ['làm sao vào bàn', 'vào bàn sao', 'vào bàn kiểu gì', 'sao ngồi được', 'làm sao để ngồi', 'sao mình chưa có ghế', 'sao chưa có ghế', 'ngồi kiểu gì', 'sao không có ghế', 'làm sao có ghế', 'sao em chưa được ngồi', 'sao mình không được ngồi'],
    (c) => (c.myTable ? `Bạn đang ngồi bàn số ${c.myTable} rồi đó, nhìn kỹ là thấy tên mình nha!` : 'Dễ lắm, comment chữ nhậu là có ghế liền, hoặc bấm follow quán cũng được. Muốn ngồi bàn nào thì gõ bàn với số, từ bàn một tới bàn tám.'),
  ],
  [
    ['đổi bàn sao', 'chuyển bàn sao', 'đổi bàn kiểu gì', 'chuyển bàn kiểu gì', 'qua bàn khác sao', 'làm sao đổi bàn', 'làm sao chuyển bàn'],
    () => 'Muốn qua bàn nào thì gõ bàn với số đó, ví dụ bàn năm, là chủ quán dắt qua liền. Bàn đầy rồi thì chọn bàn khác nha.',
  ],
  [
    ['ngồi bàn mấy', 'ở bàn mấy', 'ở bàn nào', 'ngồi bàn nào', 'mình ngồi đâu', 'em ngồi đâu', 'tôi ngồi đâu', 'tui ngồi đâu', 'ngồi chỗ nào'],
    (c) => (c.myTable ? `Bạn đang ngồi bàn số ${c.myTable} đó, cái bàn có số ${c.myTable} trên mặt bàn nè!` : 'Bạn chưa có ghế đâu, comment nhậu là quán kéo ghế cho ngồi liền!'),
  ],
  [
    ['có món gì', 'có gì ăn', 'thực đơn', 'menu', 'ăn gì ngon', 'gọi món sao', 'gọi món kiểu gì', 'làm sao gọi món', 'có món nào', 'quán có gì', 'có đồ ăn không', 'món gì ngon'],
    (c) => `Món miễn phí thì cứ comment tên món: ${c.free.slice(0, 6).join(', ')}. Món ngon như mực nướng, ốc hương thì tặng quà ${c.tiers.food || 1} xu, lẩu thì ${c.tiers.hotpot || 5} xu nha!`,
  ],
  [
    ['món của mình đâu', 'món của em đâu', 'món của tôi đâu', 'đồ ăn đâu', 'sao lâu vậy', 'sao chưa có món', 'chưa có món', 'mồi đâu', 'đồ ăn lâu', 'chờ lâu quá', 'nấu lâu'],
    (c) => (c.myDish ? `${c.myDish} của bạn đang trên bếp nè, chủ quán làm xong là bưng ra liền, chờ xíu nha!` : c.cooking.length ? `Bếp đang làm ${c.cooking.slice(0, 3).join(', ')}, từ từ tới lượt nha. Ai tặng quà thì được làm trước đó!` : 'Bếp đang rảnh nè, comment tên món đi là có liền, ví dụ đậu lạc hay nem chua!'),
  ],
  [
    ['đang nấu gì', 'bếp đang làm gì', 'nấu món gì', 'đang làm món gì'],
    (c) => (c.cooking.length ? `Bếp đang làm ${c.cooking.slice(0, 4).join(', ')} nè, thơm lừng cả quán!` : 'Bếp đang nghỉ tay, ai gọi món đi cho bếp có việc làm nào!'),
  ],
  [
    ['tặng gì', 'quà gì', 'tặng quà được gì', 'quà được gì', 'mấy xu', 'tặng bao nhiêu', 'đập quán là sao', 'đập quán là gì', 'bao cả quán là gì', 'bao quán là sao', '1 xu được gì', '5 xu được gì', 'tặng quà để làm gì', 'quà có tác dụng gì'],
    (c) => `Quà tính theo số xu mỗi quà nha: ${tierText(c)}. Quà nào cũng được đọc tên cảm ơn và lên bảng vàng!`,
  ],
  [
    ['thả tim để làm gì', 'thả tim được gì', 'tim để làm gì', 'like để làm gì'],
    () => 'Thả tim là tim bay lên từ các bàn, quán càng nhiều tim càng lên xu hướng, khách vô càng đông. Thả giúp quán nha!',
  ],
  [
    ['dzô là gì', 'cụng ly sao', 'cụng ly kiểu gì', 'làm sao cụng ly', 'nâng ly sao'],
    (c) => `Gõ ${c.kw} là bạn nâng ly cụng với cả bàn. Bốn người cùng gõ ${c.kw} một lúc là cả quán đứng dậy dzô luôn!`,
  ],
  [
    ['bao nhiêu người', 'mấy người xem', 'quán đông không', 'có ai không', 'có ai ở đây không', 'mấy người vậy', 'bao nhiêu khách'],
    (c) => `${c.viewers ? `Đang có ${c.viewers} người xem` : 'Quán đang đông vui'}${c.seated ? `, ${c.seated} khách đang ngồi bàn` : ''}. Comment nhậu là thêm một ghế nữa nha!`,
  ],
  [
    ['ai top 1', 'ai top một', 'ai đứng đầu', 'ai nhất bảng', 'top 1 là ai', 'ai đang top', 'bảng vàng là gì'],
    (c) => (c.top ? `Đứng đầu bảng vàng đang là ${c.top}! Muốn soán ngôi thì comment nhiều với tặng quà nha.` : 'Bảng vàng còn trống chỗ đầu nè, ai comment với tặng quà nhiều nhất là lên top một!'),
  ],
  [
    ['bia gì', 'bia hãng gì', 'bia nào', 'uống bia gì', 'quán bán bia gì'],
    () => 'Quán chỉ có bia hơi ảo, không của hãng nào hết nha. Uống bao nhiêu cũng không say, mà ngoài đời thì uống có chừng thôi!',
  ],
  [
    ['lái xe được không', 'uống xong lái xe', 'say có lái xe', 'uống bia lái xe'],
    () => 'Không nha! Đã uống rượu bia là không lái xe, gọi xe ôm hay taxi về cho an toàn, ở nhà còn có người chờ.',
  ],
  [
    ['dưới 18', 'chưa đủ 18', 'chưa đủ tuổi', 'học sinh uống', 'mấy tuổi được uống'],
    () => 'Dưới mười tám tuổi thì không uống rượu bia nha. Vô quán ngồi chơi, uống trà đá với nước ngọt là được rồi!',
  ],
  [
    ['nhạc gì', 'bài gì', 'tên bài', 'bài nhạc gì', 'nhạc nền gì', 'bài này tên gì'],
    () => 'Nhạc nền là nhạc quán tự làm, đàn tranh với đàn bầu trộn nhịp remix, không có trên mạng đâu nha!',
  ],
  [
    ['chủ quán tên gì', 'chị tên gì', 'anh tên gì', 'chủ quán là ai'],
    (c) => `Chủ quán tên là chủ quán ${c.q} luôn đó! Cứ gọi ${c.gender === 'm' ? 'anh chủ' : 'chị chủ'} là được.`,
  ],
  [
    ['bao nhiêu tuổi', 'mấy tuổi', 'tuổi gì', 'sinh năm bao nhiêu', 'sinh năm mấy'],
    () => pick(['Tuổi của chủ quán là bí mật quốc gia! Chỉ biết là đủ tuổi mở quán và đủ trẻ để thức khuya với cả nhà.', 'Chủ quán mười tám tuổi... cộng thêm vài năm kinh nghiệm rửa ly nữa!']),
  ],
  [
    ['có người yêu chưa', 'có bồ chưa', 'có ny chưa', 'có gấu chưa', 'có chồng chưa', 'có vợ chưa', 'độc thân không', 'yêu ai chưa'],
    () => pick(['Chủ quán đang yêu cái quán này nè, ngày nào cũng ở với nó! Ai muốn ứng tuyển thì tặng quà xếp hàng nha.', 'Chưa có đâu, ai muốn thì nộp hồ sơ ở bảng vàng, top một được ưu tiên phỏng vấn!']),
  ],
  [
    ['quê ở đâu', 'quê đâu', 'người ở đâu', 'chủ quán ở đâu'],
    () => 'Chủ quán quê ở số một trăm ba mươi tư Trần Phú phiên bản online nè. Còn bạn quê ở đâu, comment cho quán biết với!',
  ],
  [
    ['ăn cơm chưa', 'ăn tối chưa', 'ăn gì chưa', 'đói không'],
    () => pick(['Chủ quán đứng bếp cả tối, ăn vụng mỗi món một miếng nên no rồi nè! Còn bạn ăn gì chưa?', 'Ăn rồi, ăn hết dĩa đậu lạc của khách bàn ba luôn, đừng nói ai nha!']),
  ],
  [
    ['khỏe không', 'có khỏe không', 'mệt không', 'có mệt không', 'buồn ngủ chưa'],
    () => pick(['Khỏe re! Có cả nhà ngồi chơi là chủ quán tỉnh như sáo luôn.', 'Hơi mỏi tay vì xào chảo, mà thấy cả nhà comment là hết mệt liền!']),
  ],
  [
    ['pass wifi', 'mật khẩu wifi', 'có wifi không', 'wifi là gì'],
    () => 'Pass wifi là tặng quà một xu, viết liền không dấu! Đùa thôi, quán ảo mà, không có wifi đâu nha.',
  ],
  [
    ['ship không', 'có giao hàng không', 'giao tận nhà', 'mang về được không'],
    () => 'Quán ảo nên chỉ giao tận bàn thôi nha, chủ quán bưng ra tận nơi luôn. Ship về nhà thì chủ quán chạy không nổi!',
  ],
  [
    ['tính tiền', 'bao nhiêu tiền', 'hết bao nhiêu', 'trả tiền sao', 'thanh toán sao'],
    () => 'Quán ảo nên tổng hóa đơn là không đồng! Muốn ủng hộ quán thì follow với thả tim là đủ rồi nha.',
  ],
];

/** "2 + 3", "5 nhân 6", "10 chia 2 bằng mấy" */
function arithmetic(/** @type {string} */ text) {
  const m = text
    .toLowerCase()
    .replace(/,/g, '.')
    .match(/(-?\d+(?:\.\d+)?)\s*(\+|-|x|\*|×|:|\/|÷|cộng|trừ|nhân|chia)\s*(-?\d+(?:\.\d+)?)/u);
  if (!m) return '';
  const a = Number(m[1]);
  const b = Number(m[3]);
  if (Math.abs(a) > 1e6 || Math.abs(b) > 1e6) return 'Số to quá, chủ quán chỉ đếm được tới số ly trên bàn thôi!';
  const op = m[2];
  const word = op === '+' || op === 'cộng' ? 'cộng' : op === '-' || op === 'trừ' ? 'trừ' : op === 'x' || op === '*' || op === '×' || op === 'nhân' ? 'nhân' : 'chia';
  if (word === 'chia' && b === 0) return 'Chia cho không thì chủ quán chịu, máy tính cũng khóc luôn đó!';
  const r = word === 'cộng' ? a + b : word === 'trừ' ? a - b : word === 'nhân' ? a * b : a / b;
  const nice = Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/\.?0+$/, '').replace('.', ' phẩy ');
  return `${m[1]} ${word} ${m[3]} bằng ${nice}. ${pick(['Dễ ợt!', 'Chủ quán học giỏi toán lắm nha!', 'Tính nhẩm còn nhanh hơn máy tính!'])}`;
}

/**
 * A real answer to a viewer's question, or '' when it is not one of the questions the quán knows
 * @param {string} text @param {AnswerCtx} ctx
 */
export function answerFor(text, ctx) {
  const words = tokensOf(text);
  if (!words.length || words.length > 25) return '';
  const t = ` ${words.join(' ')} `;
  const plain = fold(t);
  for (const [phrases, answer] of RULES) {
    for (const p of phrases) {
      const key = ` ${tokensOf(p).join(' ')} `;
      if (t.includes(key) || (key.trim().includes(' ') && plain.includes(fold(key)))) return answer(ctx);
    }
  }
  return arithmetic(text);
}
