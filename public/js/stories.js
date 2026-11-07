// @ts-check
// Chuyện chủ quán kể, chuyện cười, đố vui, điều thú vị: giữ khách ở lại, rồi nhắc nhẹ thả tim / chia sẻ / tặng quà.
// {q} = tên quán, {kw} = từ khóa cụng ly. Mỗi phần của chuyện là một câu đọc riêng (đọc nối nhau).

/** @template T @param {T[]} list @returns {T} */
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const fill = (/** @type {string} */ s, /** @type {Record<string, string>} */ v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

/** @type {Array<{ title: string; parts: string[] }>} */
const STORIES = [
  {
    title: 'Con mèo giữ quán',
    parts: [
      'Cả nhà ngồi lại nghe chủ quán kể chuyện nha. Chuyện này tên là Con mèo giữ quán.',
      'Ngày xưa, quán của tôi có một con mèo tam thể tên là Bia Hơi. Nó không bắt chuột, chỉ ngồi trên quầy ngó khách.',
      'Có hôm quán vắng tanh, tôi buồn ngồi than. Bỗng Bia Hơi nhảy xuống, dụi đầu vào chân một ông khách lạ đứng ngoài cửa. Ông ấy bật cười, bước vô ngồi.',
      'Từ hôm đó, hễ quán vắng là Bia Hơi ra cửa ngồi. Lạ lắm, chừng mười phút sau là có khách vô. Mấy anh em bảo con mèo đó là bùa may mắn của quán.',
      'Giờ nó già rồi, ngủ cả ngày. Nhưng cứ tối tối, khách vô là nó hé một mắt ra chào. Quán nào cũng cần một chú mèo như vậy đó cả nhà.',
    ],
  },
  {
    title: 'Hai người bạn gặp lại',
    parts: [
      'Kể cả nhà nghe chuyện hai người bạn gặp lại sau hai mươi năm nha.',
      'Anh Hải và anh Phong học chung từ nhỏ. Ra trường mỗi người một nơi, rồi mất liên lạc luôn. Hai mươi năm sau, tình cờ cả hai cùng ghé một quán nhậu bên đường.',
      'Anh Hải ngồi bàn trong, anh Phong ngồi bàn ngoài. Cả hai đều quay lại nhìn nhau, nhìn hoài mà không dám nhận. Tóc bạc hết rồi, bụng cũng to hơn xưa.',
      'Cuối cùng anh Phong đứng dậy, nói một câu thôi: Ê, cho tao mượn cây bút hồi lớp chín nha. Cả hai cười rũ rượi. Tối đó ngồi tới khuya, kể chuyện đủ thứ.',
      'Cả nhà nhớ nha, bạn cũ ngoài kia cũng đang nhớ mình. Hôm nay nhắn cho một người đi, đừng đợi hai mươi năm.',
    ],
  },
  {
    title: 'Đêm mưa có ông cụ',
    parts: [
      'Chuyện này tên là Đêm mưa có ông cụ. Cả nhà ngồi yên nghe nha.',
      'Có một đêm mưa to, quán vắng hoe, tôi định đóng cửa sớm. Thì có một ông cụ chống gậy bước vào, áo ướt hết, xin một ly trà nóng.',
      'Tôi pha cho ông ly trà, thêm đĩa đậu phộng. Ông ngồi im, nhìn mưa rơi. Một lúc ông nói: hồi xưa tôi cũng có quán ở đầu hẻm này, giờ họ xây nhà cao tầng hết rồi.',
      'Ông kể tới khuya, chuyện quán hồi đó, chuyện khách quen hồi đó. Lúc ra về, ông nói cảm ơn vì cho ông ngồi nhớ lại một thời. Ông không chịu để tôi tính tiền trà.',
      'Từ đó tôi hiểu, quán nhậu không chỉ để uống, mà là nơi người ta được ngồi xuống và có người nghe mình nói.',
    ],
  },
  {
    title: 'Cái ghế nhựa đỏ',
    parts: [
      'Giờ tới chuyện vui nè. Chuyện này tên là Cái ghế nhựa đỏ biết nói.',
      'Quán tôi có một cái ghế nhựa đỏ, ai ngồi vô cũng nghe nó kêu cót két. Tôi đặt tên nó là ông Cót.',
      'Có hôm một anh khách to con ngồi xuống, ông Cót kêu một tiếng dài thiệt dài. Cả quán im phăng phắc, anh khách đỏ mặt. Tôi chạy ra, nói to: ghế nó chào anh đó, nó thích anh lắm!',
      'Cả quán cười muốn rớt ghế. Anh khách cũng cười, rồi kêu thêm mồi cho cả bàn. Từ đó ghế đó thành ghế danh dự, ai ngồi cũng được tặng một tràng vỗ tay.',
      'Cả nhà thấy không, chuyện xấu hổ biết kể ra thì thành chuyện vui. Đừng ngại cười chính mình nha.',
    ],
  },
  {
    title: 'Lần đầu nhậu với sếp',
    parts: [
      'Chuyện này nhiều người sẽ thấy quen. Tên là Lần đầu đi nhậu với sếp.',
      'Anh Nam mới vô làm được ba tháng. Sếp rủ cả phòng đi liên hoan, anh Nam run từ chiều. Anh tập trước ở nhà cách mời sếp, cách cụng ly, cả cách cười cho tự nhiên.',
      'Tới quán, sếp ngồi giữa, anh Nam ngồi sát bên. Anh đứng dậy, cầm ly, định nói một câu thiệt hay. Nhưng run quá, anh nói: chúc sếp sức khỏe, và chúc em cũng sức khỏe luôn.',
      'Cả bàn cười ầm. Sếp vỗ vai, nói: được, chân thành, tôi thích. Từ đó anh Nam hết sợ sếp, còn được giao dự án mới.',
      'Bài học ở đây là gì cả nhà? Thật lòng thì lúc nào cũng thắng. Còn nhớ, đi nhậu với sếp hay với bạn, đã uống thì đừng chạy xe về nha.',
    ],
  },
  {
    title: 'Ly trà đá của cô bé',
    parts: [
      'Một chuyện nhẹ nhàng nè, tên là Ly trà đá của cô bé.',
      'Có một cô bé bán vé số, tối nào cũng đi ngang quán tôi. Cô bé không xin gì, chỉ đứng ngoài cửa nhìn vô nhìn mấy bàn đang ăn.',
      'Một tối trời nóng, tôi bưng ra cho cô bé một ly trà đá thiệt lớn, cho thêm cái bánh. Cô bé cười, nói cảm ơn chú, rồi cẩn thận bẻ đôi cái bánh, gói nửa vào túi.',
      'Tôi hỏi sao không ăn hết? Cô bé nói để dành cho em ở nhà. Tối đó tôi gói thêm một phần đem tặng.',
      'Chuyện nhỏ thôi, nhưng tôi nhớ hoài. Cả nhà ai có dịp thì đừng ngần ngại làm một việc tử tế nhỏ nha, nó lan đi xa lắm.',
    ],
  },
  {
    title: 'Cô gái chạy deadline',
    parts: [
      'Chuyện cho dân văn phòng nè. Tên là Cô gái chạy deadline.',
      'Có cô gái tên Vy, làm thiết kế, tuần nào cũng chạy deadline tới nửa đêm. Một hôm cô xách laptop vô quán, nói chủ quán cho em ngồi góc yên tĩnh nha, em làm bài.',
      'Tôi kê cho cô cái bàn nhỏ sát cửa sổ, đưa ly nước chanh. Cô gõ phím tới quên cả giờ. Khách trong quán biết ý, nói chuyện nhỏ lại, còn có người đi ngang gật đầu chúc cố lên.',
      'Gần một giờ sáng cô xong việc, gập máy lại thở phào. Cả quán vỗ tay chúc mừng. Cô ngạc nhiên, rồi bật cười, nói đây là lần đầu có người vỗ tay vì em nộp bài đúng hạn.',
      'Cả nhà hôm nay ai cũng cố gắng rồi. Nếu chưa ai khen thì quán khen luôn: giỏi lắm, cả nhà tuyệt vời!',
    ],
  },
  {
    title: 'Ông chủ quán đầu tiên',
    parts: [
      'Giờ tôi kể chuyện làm quán nhé. Tên là Cái quán đầu tiên.',
      'Hồi mới mở quán, tôi chỉ có sáu cái bàn, hai cái quạt, và một cái tủ lạnh cũ. Ngày đầu tiên bán được đúng ba bàn khách, trong đó hai bàn là người quen tới ủng hộ.',
      'Tối đó tôi ngồi một mình, nhìn mấy cái ghế trống, tự hỏi có nên đóng cửa không. Rồi có một chị khách quen ghé, nói quán em nấu ngon, chị sẽ rủ cả xóm tới.',
      'Một tuần sau, quán không đủ ghế. Tôi phải mượn ghế nhà hàng xóm. Giờ nhìn lại, tôi cám ơn cái đêm tưởng chừng muốn bỏ cuộc đó.',
      'Nếu cả nhà đang bắt đầu một việc gì mà thấy khó, thì nhớ nha, ngày đầu của quán nào cũng vắng. Đừng bỏ cuộc sớm.',
    ],
  },
  {
    title: 'Anh xe ôm và cô khách say',
    parts: [
      'Chuyện này vui mà cũng có bài học. Tên là Anh xe ôm tốt bụng.',
      'Anh Tư chạy xe ôm trước cửa quán. Một tối có cô khách đi ra, bước hơi loạng choạng, vẫy anh Tư lại. Cô nói: anh chở em về, em hơi say, đừng cho em tự lái.',
      'Anh Tư thấy cô biết lo như vậy thì quý lắm. Anh chạy chậm, cẩn thận, tới nhà còn chờ cô vô cửa rồi mới đi. Cô gửi tiền thêm, anh không lấy, nói em biết tự lo cho mình là anh vui rồi.',
      'Chuyện chỉ có vậy thôi. Nhưng cả nhà thấy không, chọn gọi xe về là một quyết định rất ngầu. Quán ảo thì cứ vui, ngoài đời thì đã uống là không lái.',
    ],
  },
  {
    title: 'Tháp bia biết cười',
    parts: [
      'Một chuyện nhí nhố nè, tên là Tháp bia biết cười.',
      'Quán tôi có cái tháp bia cao tới hai mét. Mỗi lần có khách tặng quà lớn là nó phình ra, sủi bọt, lấp lánh như đang cười.',
      'Có bữa một bé tới chơi cùng ba, bé chỉ vô cái tháp, nói con thấy nó cười với con. Cả quán nhìn theo, rồi ai cũng thấy nó cười thiệt.',
      'Bé còn đòi chào tạm biệt tháp bia trước khi về. Cả quán vẫy tay theo, tháp bia nổi bọt đáp lễ. Chắc là gió thôi, mà cũng chắc là phép màu của quán.',
      'Quán ảo của chúng ta cũng vậy, ai vô cũng thấy vui, vì có cả nhà cùng cười.',
    ],
  },
  {
    title: 'Người khách quen cuối cùng',
    parts: [
      'Chuyện này hơi cảm động, cả nhà nghe nha. Tên là Người khách quen.',
      'Có một anh khách ngày nào cũng tới quán lúc sáu giờ chiều, gọi đúng một món, ngồi đúng một chỗ, đọc báo tới tám giờ thì về. Mười năm trời không đổi.',
      'Một ngày anh không tới. Hai ngày, ba ngày. Cả quán nhắc, không ai biết nhà anh ở đâu. Tuần sau anh quay lại, gầy đi, nói mình mới đi viện.',
      'Cả quán chạy ra hỏi han, đem tới cho anh ly trà nóng. Anh nói: tôi lo nhất là không còn ai nhớ tôi. Tôi nói: anh ơi, cái ghế của anh vẫn để trống mà.',
      'Cả nhà nhớ nha, có người đang nhớ cả nhà đó. Hôm nay nhắn hỏi thăm một người quen cũ đi.',
    ],
  },
];

const FACTS = [
  'Chuyện thú vị cho cả nhà nè. Mật ong gần như không bao giờ hỏng. Người ta từng tìm thấy mật ong trong lăng mộ cổ xưa mấy nghìn năm mà vẫn ăn được.',
  'Biết gì chưa cả nhà, bạch tuộc có tới ba quả tim và máu của nó màu xanh.',
  'Về mặt thực vật học, quả chuối là quả mọng, còn quả dâu tây thì không phải. Nghe vô lý mà là thiệt đó.',
  'Việt Nam là một trong những nước xuất khẩu cà phê nhiều nhất thế giới, nên ly cà phê sáng của mình là niềm tự hào quốc gia luôn.',
  'Ở loài cá ngựa, cá ngựa đực mới là người mang thai và sinh con. Phải nể cá ngựa cha.',
  'Một ngày trên sao Kim dài hơn cả một năm của nó. Nó quay quanh mình chậm hơn là quay quanh mặt trời.',
  'Người ta nói cười nhiều làm mình trẻ ra thiệt đó. Cười làm cơ mặt thư giãn và cơ thể sản sinh chất làm ta thấy vui. Cả nhà cười lên nào, ha ha ha!',
  'Tiếng ồn quán nhậu ồn ào mà lại giúp nhiều người dễ nói chuyện hơn, vì người ta không sợ im lặng. Quán mình cũng vậy, cứ nói thoải mái nha.',
];

const JOKES = [
  'Chuyện cười nè. Con hỏi ba: ba ơi, sao ba cứ bảo uống ít thôi? Ba nói: vì mẹ con nghe thấy. Con hỏi: ủa, mẹ đâu ở đây? Ba nói: đó, con thấy chưa, mẹ con nghe thấy rồi đó.',
  'Anh nọ vô quán gọi món, chủ quán hỏi anh dùng gì? Anh nói gì cũng được, miễn đừng là hóa đơn.',
  'Khách vô quán, nói: cho tôi một ly nước ngọt với một lời khuyên. Chủ quán đưa ly nước và nói: lời khuyên là ly này miễn phí, nhưng cười thì mong anh trả bằng cả nụ cười.',
  'Ông chủ hỏi nhân viên: sao đi làm trễ? Nhân viên nói: tại em mơ thấy mình đang đi làm đúng giờ nên không muốn tỉnh dậy.',
  'Hai con kiến gặp nhau. Một con nói: dạo này đời khó quá. Con kia nói: ừ, đi hoài mà không thấy đường về. Con đầu nói: tại mày đi theo tao đó.',
  'Cô giáo hỏi: ai biết mười trừ năm bằng mấy? Cả lớp im. Cu Tí giơ tay: dạ, bằng năm, nhưng con thích năm ly hơn. Cô giáo bảo: Tí, con ra đứng ngoài. Tí nói dạ, ngoài đó có ly không cô?',
  'Chàng nói với nàng: anh đưa em đi ăn món gì cũng được. Nàng nói: món gì cũng được là món gì? Chàng nói: là món em chọn. Nàng chọn ngay món đắt nhất. Chàng nói: ủa, anh tưởng món gì cũng được là món rẻ.',
  'Có anh bán bia hơi nói với bạn: nghề này vui lắm, ngày nào cũng có người rót tâm sự cho mình nghe. Bạn hỏi: mà có ai trả tiền tâm sự không? Anh nói: không, họ chỉ trả tiền bia thôi.',
];

/** @type {Array<{ q: string; a: string }>} */
const QUIZZES = [
  { q: 'Đố cả nhà nè: cái gì càng lấy đi càng lớn?', a: 'Đáp án là cái hố! Ai đoán đúng thì gõ {kw} cho quán nghe nào.' },
  { q: 'Đố vui nè: tháng nào trong năm có hai mươi tám ngày?', a: 'Đáp án là tháng nào cũng có hai mươi tám ngày, chỉ là có tháng dư thôi! Ai đoán đúng gõ {kw} nha.' },
  { q: 'Đố cả nhà: cái gì của mình mà người khác dùng nhiều hơn mình?', a: 'Đáp án là cái tên của mình, đúng không! Ai đoán đúng gõ {kw} nhé.' },
  { q: 'Đố nè: cái gì có cổ mà không có đầu?', a: 'Đáp án là cái chai, hoặc cái áo! Ai trả lời được gõ {kw} cho quán nghe nha.' },
  { q: 'Đố cả nhà: cái gì luôn luôn tới mà không bao giờ tới nơi?', a: 'Đáp án là ngày mai! Ai đoán đúng gõ {kw} cho quán biết nha.' },
  { q: 'Đố vui: cái gì có bốn chân mà không biết đi?', a: 'Đáp án là cái bàn, hoặc cái ghế! Ai đoán trúng thì gõ {kw} nha.' },
];

// Closing hooks: keep them watching, like, share, gift (gifts only get thanks and a virtual dish)
const CTA = [
  'Nếu thấy chuyện hay thì cả nhà thả tim cho quán nha, đủ tim là có vòng quay mồi đó.',
  'Ai thích nghe tiếp thì ở lại với {q} nha, lát nữa chủ quán kể chuyện khác.',
  'Cả nhà bấm chia sẻ live giùm quán một cái, rủ thêm bạn bè vô nghe chuyện cho đông nha.',
  'Bạn nào muốn ủng hộ quán thì tặng một món quà nhỏ, quán sẽ mang mồi ra bàn bạn và đọc tên cảm ơn nha.',
  'Thấy vui thì bấm follow để lần sau vô quán có ghế quen liền, và để không bỏ lỡ chuyện kế tiếp nha.',
  'Cả nhà comment cho quán biết hôm nay cả nhà thích chuyện nào nhất, chủ quán sẽ kể thêm.',
  'Đừng đi đâu hết nha, lát nữa còn có đố vui, chuyện cười và cả vòng quay mồi nữa đó.',
  'Ai ở lại tới cuối là chiến hữu thiệt sự của quán đó nha. Thả tim ủng hộ chủ quán một cái nào!',
];

let n = 0;
const kinds = /** @type {const} */ (['story', 'joke', 'story', 'fact', 'quiz', 'story', 'joke', 'fact']);
const bag = new Map();
/** Next item of a list without repeating until the list is used up */
function take(/** @type {string} */ name, /** @type {any[]} */ list) {
  let left = bag.get(name);
  if (!left || !left.length) left = [...list].sort(() => Math.random() - 0.5);
  const item = left.pop();
  bag.set(name, left);
  return item;
}

/**
 * What the host says next: { lines: spoken in order, after?: a line said `ms` later (quiz answer) }.
 * Rotates story, joke, story, fact, quiz... and closes most of them with a "like / share / stay / gift" hook.
 * @param {{ q: string; kw: string }} ctx
 * @param {'story' | 'joke' | 'fact' | 'quiz'} [force]
 * @returns {{ kind: string; title?: string; lines: string[]; after?: { ms: number; text: string } }}
 */
export function tellNext(ctx, force) {
  const kind = force || kinds[n++ % kinds.length];
  const v = { q: ctx.q, kw: ctx.kw };
  const cta = fill(pick(CTA), v);
  if (kind === 'story') {
    const s = take('story', STORIES);
    return { kind, title: s.title, lines: [...s.parts.map((p) => fill(p, v)), cta] };
  }
  if (kind === 'joke') return { kind, lines: [fill(take('joke', JOKES), v), 'Ha ha, cả nhà cười chưa? Cười là sống thọ đó nha.', cta] };
  if (kind === 'fact') return { kind, lines: [fill(take('fact', FACTS), v), cta] };
  const qz = take('quiz', QUIZZES);
  return { kind: 'quiz', lines: [fill(qz.q, v), 'Cả nhà nghĩ đi, quán cho mười lăm giây nha. Gõ đáp án vào comment.'], after: { ms: 22_000, text: fill(qz.a, v) } };
}
