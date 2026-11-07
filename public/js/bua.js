// @ts-check
// Đọc to comment của khách và đáp kiểu hài hước, bựa (lầy mà không tục, không chê ngoại hình, không cổ vũ uống thật).
// {ban} = "bạn Lan" (hoặc "bạn" khi vừa đọc tên ở câu trước), {q} = tên quán, {kw} = từ cụng ly, {city} = tỉnh/thành.
import { containsBanned, tokensOf } from './text.js';

/** @type {Record<import('./chat.js').Topic, string[]>} */
export const BUA_REPLIES = {
  birthday: [
    'Sinh nhật {ban} hả? Cả quán hát chúc mừng nè, hát dở thì ráng chịu nha. Chúc tuổi mới tiền nhiều như tóc, buồn ít như lông mày!',
    'Thêm một tuổi là thêm một lần bị hỏi chừng nào lấy vợ lấy chồng. Chúc mừng sinh nhật {ban}, dzô!',
    'Chúc mừng sinh nhật {ban}! Quán tặng cái bánh kem ảo, ăn không mập, thổi nến hoài không tắt, quá đã.',
  ],
  drunk: [
    '{ban} say rồi hả? Say quán ảo thì được, chứ say thiệt thì nằm im đó, cấm đụng chìa khóa xe nha!',
    'Thôi xong, {ban} bắt đầu thấy hai chủ quán rồi phải không? Uống ly nước lọc rồi gọi xe về, đừng tự lái nha.',
    'Say mà còn gõ chữ được là tửu lượng có nghề đó {ban}. Nhưng ngoài đời thì đủ rồi nha, nước lọc lên!',
  ],
  sad: [
    '{ban} buồn hả? Lại đây chủ quán cho mượn vai, vai ảo thôi nhưng an ủi thiệt nha.',
    'Buồn thì kể quán nghe đi {ban}. Quán không giải quyết được gì đâu, nhưng nghe thì nghe giỏi lắm!',
    'Thương {ban} quá. Buồn chút thôi rồi mai cười lại nha, cả quán ngồi đây với {ban}.',
  ],
  tired: [
    '{ban} mệt hả? Ngồi đây nghỉ đi, ở quán này sếp có gọi thì chủ quán cũng không cho nghe máy đâu.',
    'Làm cả ngày rồi, giờ {ban} được phép nằm dài như con mèo. Quán cho phép đó!',
    'Nghe {ban} than mệt mà chủ quán muốn đấm lưng giùm, mà tay ảo nên đấm hông tới.',
  ],
  hungry: [
    '{ban} đói hả? Quán ảo nên mồi cũng ảo, ăn hoài không no nhưng cũng không mập, lời quá còn gì!',
    'Muốn có mồi thì cả nhà thả đủ chín mươi chín tim đi, không là {ban} ngồi gặm đũa đó nha!',
    '{ban} đòi mồi hả? Tặng một bông hoa là có dĩa gỏi gà liền, quán làm ăn sòng phẳng lắm.',
  ],
  bye: [
    '{ban} về hả? Về sớm vậy chắc ở nhà có người quản. Thôi về đi, mai nhớ trốn ra quán tiếp nha!',
    'Tạm biệt {ban}! Đi đường cẩn thận, về nhà nhớ khóa cửa, đừng khóa luôn trái tim nha.',
    '{ban} đi ngủ hả? Ngủ ngon, mơ thấy quán nha. Mơ thấy người khác là quán buồn đó!',
  ],
  thanks: [
    'Cảm ơn gì mà cảm ơn, {ban} khách sáo quá. Muốn cảm ơn thì thả tim là được rồi!',
    'Không có chi {ban} ơi, quán phục vụ tận răng, chỉ thiếu mỗi bia thiệt thôi.',
    '{ban} lịch sự quá làm chủ quán ngại. Thôi dzô một cái là huề nha!',
  ],
  hello: [
    'Ê {ban}! Vô đây vô đây, chỗ này đang thiếu người góp vui. Gõ {kw} một cái cho quán nghe coi!',
    'Chào {ban}! Vào quán biết chào là lễ phép rồi, cộng mười điểm nhân cách.',
    'Hello {ban}! Quán đang ồn, {ban} vào là ồn gấp đôi, quá hợp luôn.',
    'Ủa {ban} tới rồi hả? Nãy giờ cả quán nhắc {ban} quá trời. Nói xấu thôi, đùa đó!',
  ],
  first: [
    '{ban} giành tem nhanh như người yêu cũ trở mặt vậy đó! Vỗ tay cho {ban} nào.',
    'Tem đã có chủ là {ban}! Ai chậm chân thì ngồi gặm đậu phộng nha.',
  ],
  praise: [
    'Khen quán hả {ban}? Khen nữa đi, khen nữa là chủ quán bay lên trần luôn.',
    '{ban} nói quán vui, quán cảm động muốn khóc, nhưng thôi, khóc xong lại phải dọn quán.',
    'Cảm ơn {ban}! Khen bằng lời thì quán nghe rồi, khen bằng tim thì thả ở góc phải nha.',
  ],
  praiseHost: [
    '{ban} khen chủ quán hả? Nói thêm đi, chủ quán đang ghi âm lại để mai nghe tiếp.',
    'Ôi {ban} khéo miệng ghê. Chủ quán mắc cỡ đỏ mặt mà không ai thấy, tiếc ghê.',
    'Khen giọng hay hả? {ban} tinh tai quá! Quán tặng {ban} một ly nước ngọt ảo.',
  ],
  love: [
    '{ban} thương quán hả? Quán cũng thương {ban}, thương trong sáng thôi nha, cụng ly là đủ rồi.',
    'Thương quán thì ghé hoài nha {ban}, đừng thương rồi bỏ đi như ai kia đó.',
    'Nghe {ban} nói câu này chủ quán muốn khóc. Thôi, dzô một cái cho đỡ xúc động!',
  ],
  laugh: [
    '{ban} cười gì mà nghe như cái quạt máy hư vậy? Cười cho cả quán cười theo luôn đi!',
    'Ha ha, {ban} cười hở mười cái răng rồi đó, khép miệng lại kẻo ruồi bay vô!',
    'Cười nhiều trẻ lâu, {ban} cười tiếp đi, mười năm nữa vẫn đẹp như hôm nay.',
  ],
  music: [
    '{ban} muốn chủ quán hát hả? Chủ quán hát là cả quán chạy hết đó, thôi nghe nhạc nền cho an toàn.',
    'Nhạc quán là đàn tranh remix, nghe xong muốn đứng dậy múa luôn đó {ban}.',
    '{ban} xin bài hả? Quán có đúng một bài thôi, mà bài đó hay nên nghe hoài không chán.',
  ],
  seat: [
    '{ban} muốn ghế hả? Gõ {kw} là có ghế liền, còn bàn VIP thì phải chịu chơi nha, quán nói thiệt.',
    'Ghế còn nhiều lắm {ban} ơi, chỉ có bàn VIP là phải xếp hàng. Comment nhiều lên là được lên!',
    'Bàn VIP sáu ghế, toàn đại gia ngồi. {ban} ráng cày điểm lên ngồi chung cho oai.',
  ],
  gift: [
    '{ban} hỏi quà hả? Tặng bông hoa thì lên mồi, tặng donut thì đập quán. Chủ quán vừa mong vừa sợ!',
    'Quà là tấm lòng {ban} ơi, không có cũng được. Mà có thì chủ quán đọc tên to như loa phường luôn.',
    '{ban} nhắc tới quà làm chủ quán sáng mắt. Đùa thôi, ngồi chơi vui là quán vui rồi!',
  ],
  like: [
    'Đúng rồi {ban}, cả nhà thả tim đi! Đủ tim là mưa bọt bia, ướt hết cả quán luôn.',
    '{ban} hô thả tim hay quá, cho {ban} làm trưởng ban phong trào luôn nha!',
  ],
  follow: [
    '{ban} follow quán rồi hả? Từ nay là người nhà, vô quán khỏi chào, ra quán khỏi trả tiền, mà quán ảo nên vốn dĩ khỏi trả.',
    'Follow rồi là không được bỏ quán nha {ban}, bỏ là quán buồn, quán buồn là quán kể chuyện cười dở.',
  ],
  share: [
    '{ban} share quán hả? Quá đỉnh! Rủ thêm bạn vô, đông vui chủ quán mới có cớ kể chuyện cười.',
    'Cảm ơn {ban} chia sẻ! Từ giờ phút này {ban} là đại sứ thương hiệu của quán.',
  ],
  money: [
    '{ban} hết tiền hả? Quán ảo này ngồi miễn phí, nghèo cỡ nào cũng có ghế nha!',
    'Lương về rồi hả {ban}? Lương về thì chào, lương đi không hẹn. Nhớ để dành chút nha!',
    'Ví mỏng như lá lúa thì {ban} cứ ngồi đây, ở quán này chỉ trả bằng tiếng cười thôi.',
  ],
  work: [
    'Nhắc tới sếp làm cả quán run. {ban} ngồi đây đi, quán này sếp không tìm được đâu.',
    '{ban} mới tan ca hả? Vất vả rồi, giờ là giờ xả hơi, deadline để mai nó tự chạy.',
    'Đi làm cả ngày rồi, {ban} xứng đáng cái ghế đẹp nhất quán. Mà ghế đẹp hết rồi, ngồi tạm ghế nhựa nha.',
  ],
  weekend: [
    'Cuối tuần rồi {ban} ơi! Cuối tuần là phải chill, còn thứ hai thì để thứ hai lo.',
    '{ban} được nghỉ hả? Sướng ghê, quán thì cuối tuần còn đông hơn, chủ quán chạy muốn rớt dép.',
  ],
  weather: [
    'Trời vậy mà {ban} vẫn ghé quán, quán quý {ban} như quý cái áo mưa vậy đó.',
    'Trời mưa hay trời nắng gì thì vô quán cũng mát, vì quán có máy lạnh ảo đó {ban}.',
    'Thời tiết thất thường như người yêu cũ, {ban} giữ sức khỏe nha.',
  ],
  sleepy: [
    '{ban} buồn ngủ thì đi ngủ đi, thức khuya là mắt thâm như gấu trúc đó.',
    'Cú đêm hả {ban}? Quán cũng cú đêm nè, nhưng mai ngủ gật ở chỗ làm thì đừng khai là do quán nha.',
  ],
  lovelife: [
    '{ban} ế hả? Không sao, cả quán ở đây toàn độc thân vui tính. Ai muốn thoát ế thì giơ tay!',
    'Chuyện tình cảm hả {ban}? Chủ quán nói thật, đang ế nên không dám khuyên ai hết.',
    '{ban} có crush hả? Thả thính đi, không dính thì quán an ủi, dính thì quán ăn mừng.',
  ],
  about: [
    'Quán {q} là quán ảo {ban} ơi, không có bia thiệt, chỉ có chủ quán thiệt nhây và khách thiệt vui.',
    '{ban} hỏi quán ở đâu hả? Ngay trong điện thoại của {ban} đó, mở ra là thấy, khỏi tìm đường.',
    'Quán chỉ mở trên live thôi {ban}. Follow đi để lần sau quán mở cửa là biết liền.',
  ],
  food: [
    'Nghe {ban} nói tới món đó mà chủ quán chảy nước miếng ướt cả bàn phím.',
    '{ban} gọi món hay ghê, mà quán ảo nên chỉ có món tưởng tượng. Tưởng tượng mạnh vô cho ngon!',
    'Món đó ngon dữ thần luôn {ban}. Tặng bông hoa là có dĩa mồi ra bàn liền nha.',
  ],
  critic: [
    '{ban} chê quán nhạt hả? Để chủ quán bỏ thêm muối. Cả nhà gõ {kw} cho quán mặn mà lên coi!',
    'Chê thì chủ quán nhận, buồn đúng ba giây thôi. Xong rồi, vui lại rồi. {ban} góp ý tiếp đi!',
  ],
  city: [
    'Ê, có {ban} ở {city} nè! {city} ơi, rủ thêm hàng xóm vô quán ngồi chơi coi!',
    '{ban} ở {city} hả? Xa vậy mà vẫn ghé, quán xúc động muốn bao luôn tiền xe, xe ảo thôi nha.',
    'Hello {city}! {ban} giơ tay lên cho cả quán thấy dân {city} chịu chơi cỡ nào!',
  ],
  dao: [
    '{ban} đòi {n} em đào hả? Quán làm ăn sòng phẳng, muốn có đào thì tặng quà đi rồi tính!',
    '{n} em đào hả {ban}? Có liền, có liền! Mà quán không bán chịu, quà tới thì đào mới tới nha.',
    'Trời ơi {ban} chịu chơi ghê, gọi tới {n} em đào. Tặng một món quà là đào ra bàn liền, chủ quán hứa danh dự!',
    '{ban} muốn đào thì phải có lòng nha, quà tới đâu đào tới đó, quán nói rồi đó.',
    'Đào thì quán có cả kho {ban} ơi, xinh lắm, ngọt lắm! Nhưng phải tặng quà mới mở cửa kho nha.',
    'Đào đang ngồi sau bếp chờ {ban} đó. Tặng quà là quán dắt ra liền, {n} em đúng số luôn!',
  ],
  question: [
    '{ban} hỏi câu khó quá, chủ quán học hết lớp mười hai mà cũng chịu. Cả nhà trả lời giùm đi!',
    'Câu này hay tới mức chủ quán phải suy nghĩ… xong rồi, không biết. Ai biết giúp {ban} với!',
    '{ban} hỏi vậy làm chủ quán đứng hình mất năm giây. Cả nhà cứu chủ quán với!',
  ],
};

/** The gift came: the "đào" turn out to be glasses of trà đào */
export const DAO_SERVED = [
  'Quà tới rồi, {n} em đào ra bàn {ban} đây! Ủa sao mặt ngơ vậy? Thì {n} ly trà đào nè, đào xịn nằm trong ly luôn!',
  'Chủ quán giữ lời nha {ban}! {n} em đào mát lạnh, ngọt hơn người yêu cũ, tên là trà đào. Uống đi cho tỉnh!',
  'Đào tới rồi {ban} ơi! {n} ly trà đào xinh xắn, có cả miếng đào bên trong. Ai nghĩ bậy là tự phạt một ly nước lọc nha!',
  'Quán nói là làm! {n} em đào đã lên bàn {ban}, em nào cũng có ống hút đàng hoàng. Trà đào đó, hi hi.',
];
export const DAO_SERVED_PLAIN = ['Cảm ơn {ban}! {n} ly trà đào ra bàn rồi nè, mát lạnh luôn.'];

/** The host starts a conversation with someone who chatted recently */
export const TALK_NAMED = [
  '{ban} ơi, nãy giờ nói chuyện vui ghê. Hỏi thiệt nè, tối nay ăn gì chưa?',
  '{ban} ơi, đang xem live ở đâu đó? Trên giường hay trên sofa? Khai thật đi!',
  'Ê {ban}, kể quán nghe chuyện vui nhất hôm nay đi, không vui thì kể chuyện xui cũng được.',
  '{ban} ơi, được chọn một món mồi ăn suốt đời thì {ban} chọn món gì?',
  '{ban} thấy chủ quán hôm nay có gì khác không? Nói đẹp hơn là được cộng điểm đó.',
  '{ban} ơi, ngồi lâu rồi, đứng dậy vươn vai cái đi. Xong gõ {kw} báo cáo quán nha!',
  'Hỏi {ban} nè: đi nhậu thì {ban} là người say trước, hay người dìu người say về?',
  '{ban} ơi, quê ở đâu vậy? Comment cho cả quán biết, xem tối nay có đồng hương không.',
  '{ban} ơi, chấm điểm quán đi, thang điểm mười. Dưới chín là chủ quán khóc đó nha.',
  '{ban} nói nhỏ quán nghe: mai đi làm hay được nghỉ? Được nghỉ là quán ganh tị đó.',
  'Ủa {ban} đâu rồi, nãy chat sôi nổi lắm mà giờ im re. Bị ai bắt đi rửa chén hả?',
  '{ban} ơi, nhậu ảo vậy đủ chưa, hay muốn quán bưng thêm dĩa mồi ảo nữa?',
  'Câu hỏi triết lý cho {ban} nè: ăn ốc thì nên mút hay nên khều? Trả lời đi!',
  '{ban} ơi, giới thiệu bản thân đi, tên dễ thương vậy chắc người cũng dễ thương.',
  '{ban} ơi, nói thiệt đi, xem quán có vui không? Vui thì thả tim, không vui thì… cũng thả tim cho quán vui.',
  'Ê {ban}, đố {ban} đoán chủ quán năm nay bao nhiêu tuổi? Đoán trẻ là được khen một câu.',
  '{ban} ơi, hôm nay đi làm có bị sếp la không? Kể quán nghe, quán la sếp giùm.',
  '{ban} ơi, tửu lượng thiệt ngoài đời được mấy lon? Khai gian là quán biết đó nha.',
];
/** The host asks the whole room something, to get the chat going */
export const TALK_ROOM = [
  'Cả quán ơi, ai ăn tối rồi thì comment món gì cho quán thèm chơi!',
  'Hỏi cả nhà nè: ốc len xào dừa với khô mực nướng, chọn một thôi, chọn gì?',
  'Ai đang nằm trên giường xem live thì gõ chữ giường. Quán đếm thử coi bao nhiêu người lười.',
  'Cả nhà ơi, ai ở xa quán nhất? Comment tỉnh của mình coi ai thắng!',
  'Quán hơi im rồi nha, cả nhà nói gì đi, chủ quán nói một mình nãy giờ ngại quá.',
  'Đố vui nè: con gì càng to càng nhỏ? Comment đáp án đi!',
  'Ai độc thân thì gõ chữ ế. Xem tối nay quán có bao nhiêu hội viên!',
  'Cả nhà hay nhậu với ai nhất: bạn thân, đồng nghiệp hay ông hàng xóm? Comment coi!',
  'Thử thách nè: ai gõ {kw} nhanh nhất trong năm giây tới là chiến hữu số một!',
  'Hỏi thiệt cả nhà: đi nhậu về mà ở nhà còn có người thức chờ thì nên làm gì? Comment cứu quán với!',
  'Ai đang làm ca đêm mà lén xem live thì gõ chữ ca đêm, quán giữ bí mật cho.',
  'Cả nhà ơi, chấm điểm giọng chủ quán đi, thang mười. Chấm thấp là quán hát cho nghe đó.',
  'Ai mai phải dậy sớm mà giờ còn ngồi đây thì gõ chữ liều. Quán đếm coi!',
  'Kể nhanh một chuyện xui nhất tuần này đi cả nhà, kể xong là hết xui, quán bảo đảm!',
  'Cả nhà đi nhậu thích quán vỉa hè hay nhà hàng máy lạnh? Comment đi!',
  'Ai muốn gọi đào thì comment số em đi, quán ghi sổ hết, tặng quà là đào ra bàn liền!',
];

/** Reply to any other comment: works whatever they wrote */
export const BUA_ACK = [
  'Câu này phải đóng khung treo giữa quán.',
  'Nghe xong chủ quán đứng hình ba giây.',
  'Nói hay vậy mà chưa thả tim thì phí quá {ban} ơi.',
  'Chuẩn không cần chỉnh luôn {ban}.',
  'Ủa, {ban} nói thiệt hay đùa vậy? Thôi kệ, dzô cái đã!',
  'Quán ghi nhận ý kiến của {ban}, để mai họp rồi… quên luôn.',
  '{ban} nói chuyện duyên quá, chắc ở nhà được cưng lắm.',
  'Câu này mà đăng lên mạng chắc nổi luôn đó {ban}.',
  'Nghe {ban} nói mà chủ quán gật gù như con lật đật.',
  'Quán nghe rõ, nghe kỹ, nghe luôn cả phần {ban} chưa nói.',
  '{ban} nói vậy cả bàn bên cạnh cũng quay qua nhìn đó.',
  'Hay! Hay quá! Mà khoan, {ban} vừa nói gì ta? Đùa đó, nghe rồi!',
  'Chủ quán đồng ý hai tay hai chân luôn.',
  '{ban} nói đúng tới mức quán không cãi được.',
  'Cả quán vỗ tay cho {ban} nào, bốp bốp bốp!',
  'Nói câu nào ra câu đó, chắc {ban} học khóa ăn nói rồi.',
  'Ghi điểm! {ban} được cộng mười điểm duyên dáng.',
  '{ban} mà làm MC chắc chủ quán thất nghiệp quá.',
  'Comment này chấm mười điểm, trừ một điểm vì chưa gõ {kw}.',
  'Nghe xong chủ quán phải uống miếng nước lấy bình tĩnh.',
  'Ủa ai cho {ban} dễ thương vậy? Báo cáo chủ quán ngay!',
  'Quán nghe rồi nha, lần sau {ban} nói to hơn chút cho bàn cuối nghe với.',
  'Nói vậy là quán phải tăng lương cho {ban} rồi, mà quán chưa trả lương ai bao giờ.',
  'Chuẩn bài! Cả nhà ai đồng ý với {ban} thì gõ {kw}!',
  'Câu này nghe xong muốn đứng dậy vỗ tay mà chân ảo, đứng không được.',
  '{ban} nói nghe lọt tai ghê, như nhạc đàn tranh vậy đó.',
  'Thôi rồi, {ban} nói trúng tim đen chủ quán rồi.',
  'Ơ hay, {ban} lầy quá, mà quán thích người lầy!',
];

/** How a comment is introduced before it is read */
export const READ_SAY = ['{name} nói: {text}.', '{name} phán: {text}.', '{name} gửi lời: {text}.', '{name} bảo: {text}.', 'Bên này {name} hô: {text}.'];
export const READ_ASK = ['{name} hỏi: {text}', '{name} thắc mắc: {text}', 'Câu hỏi từ {name}: {text}'];
/** Plain style, when the owner turns "bựa" off */
export const PLAIN_SAY = ['{name} nói: {text}.', '{name} viết: {text}.'];

// Chat shorthand the voice can't read, said as words
const TEENCODE = /** @type {Record<string, string>} */ ({
  k: 'không', ko: 'không', kh: 'không', hok: 'không', hong: 'không', khum: 'không', kg: 'không', dc: 'được', đc: 'được', dk: 'được', mn: 'mọi người',
  mng: 'mọi người', j: 'gì', vs: 'với', ng: 'người', bn: 'bao nhiêu', ae: 'anh em', cx: 'cũng', r: 'rồi', trc: 'trước', vl: 'quá', qa: 'quá',
  wa: 'quá', iu: 'yêu', hk: 'không', ns: 'nói', nt: 'nhắn tin', ib: 'nhắn riêng', sn: 'sinh nhật', hpbd: 'chúc mừng sinh nhật', tks: 'cảm ơn',
  thks: 'cảm ơn', ok: 'ô kê', oke: 'ô kê', okela: 'ô kê la', bt: 'biết', bik: 'biết', bít: 'biết', nma: 'nhưng mà', ntn: 'như thế nào', đt: 'điện thoại', bh: 'bây giờ',
  bjo: 'bây giờ', h: 'giờ', e: 'em', a: 'anh', c: 'chị', b: 'bạn', m: 'mày', t: 'tao', ny: 'người yêu', nyc: 'người yêu cũ', cmt: 'bình luận', live: 'lai',
  dzô: 'dô', dzo: 'dô', zô: 'dô', zo: 'dô',
});

/**
 * A comment as the voice may read it, or '' to skip it: no banned words, links, phone numbers or mentions;
 * stretched letters cut down ("đẹppppp" -> "đẹp"), chat shorthand spelled out, at most ~90 characters.
 */
export function readableComment(/** @type {string} */ text) {
  let t = (text || '').normalize('NFC').trim();
  if (!t || containsBanned(t)) return '';
  if (/(https?:|www\.|\.com|\.vn|\.net|\.xyz|t\.me|zalo|telegram)/i.test(t)) return '';
  if (/\d[\d .-]{6,}\d/.test(t) || /@\w/.test(t)) return '';
  // laughs: "kkkk", "hahaha", "hihi", "=))" become "ha ha"
  t = t.replace(/(^|[^\p{L}\p{N}])(k{2,}|(?:ha|he|hi|hj|kha|há|hí){2,}h?|[=:;]+[)D]+)(?![\p{L}\p{N}])/giu, '$1 ha ha ');
  t = t
    .replace(/[\p{Extended_Pictographic}‍️]/gu, ' ')
    .replace(/([^\d])\1{2,}/gu, '$1$1')
    .replace(/(\p{L})\1+(?=\s|$|[.,!?])/gu, '$1')
    .replace(/[“”"<>[\]{}|\\^~`*_#=+]/g, ' ');
  // whole words only: "5k" stays "5k", "k" on its own is "không"
  t = t.replace(/(?<![\p{L}\p{M}\p{N}])[\p{L}\p{M}]+(?![\p{L}\p{M}\p{N}])/gu, (w) => TEENCODE[w.toLowerCase()] ?? w);
  t = t.replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
  if (tokensOf(t).length === 0) return '';
  if (t.length > 90) t = `${t.slice(0, 90).replace(/\s+\S*$/, '')}…`;
  return t.replace(/[.!…]+$/, '');
}
