// @ts-check
// Đọc to comment của khách và đáp kiểu hài hước, bựa (lầy mà không tục, không chê ngoại hình, không cổ vũ uống thật).
// {ban} = "bạn Lan" (hoặc "bạn" khi vừa đọc tên ở câu trước), {q} = tên quán, {kw} = từ cụng ly, {city} = tỉnh/thành.
import { containsBanned, tokensOf } from './text.js';

/** @type {Record<import('./chat.js').Topic, string[]>} */
export const BUA_REPLIES = {
  birthday: [
    'Sinh nhật mà ngồi quán ảo với chủ quán thì {ban} đúng là người dễ nuôi! Chúc {ban} tuổi mới muốn gì được nấy.',
    'Cả quán đếm một hai ba rồi hú mừng sinh nhật {ban} nha! Chúc {ban} năm nay ít deadline, nhiều ngày nghỉ.',
    'Sinh nhật {ban} hả? Cả quán hát chúc mừng nè, hát dở thì ráng chịu nha. Chúc tuổi mới tiền nhiều như tóc, buồn ít như lông mày!',
    'Thêm một tuổi là thêm một lần bị hỏi chừng nào lấy vợ lấy chồng. Chúc mừng sinh nhật {ban}, dzô!',
    'Chúc mừng sinh nhật {ban}! Quán tặng cái bánh kem ảo, ăn không mập, thổi nến hoài không tắt, quá đã.',
  ],
  drunk: [
    '{ban} khai thiệt đi, hôm nay mấy lon rồi? Khai xong là quán rót cho một ly nước lọc, miễn phí nha.',
    'Say là chuyện nhỏ, say rồi nhắn tin cho người yêu cũ mới là chuyện lớn. Cất điện thoại đi {ban} ơi!',
    '{ban} say rồi hả? Say quán ảo thì được, chứ say thiệt thì nằm im đó, cấm đụng chìa khóa xe nha!',
    'Thôi xong, {ban} bắt đầu thấy hai chủ quán rồi phải không? Uống ly nước lọc rồi gọi xe về, đừng tự lái nha.',
    'Say mà còn gõ chữ được là tửu lượng có nghề đó {ban}. Nhưng ngoài đời thì đủ rồi nha, nước lọc lên!',
  ],
  sad: [
    'Chuyện gì rồi cũng qua {ban} à. Tối nay cứ ngồi đây, mai tính tiếp, quán không đuổi ai bao giờ.',
    '{ban} buồn thì quán để nhạc nhỏ lại, cả nhà ngồi im nghe {ban} kể. Nói ra là nhẹ liền.',
    '{ban} buồn hả? Lại đây chủ quán cho mượn vai, vai ảo thôi nhưng an ủi thiệt nha.',
    'Buồn thì kể quán nghe đi {ban}. Quán không giải quyết được gì đâu, nhưng nghe thì nghe giỏi lắm!',
    'Thương {ban} quá. Buồn chút thôi rồi mai cười lại nha, cả quán ngồi đây với {ban}.',
  ],
  tired: [
    'Mệt thì buông điện thoại xuống một chút, hít một hơi thiệt sâu đi {ban}. Rồi, giờ thấy đỡ chưa?',
    '{ban} làm nhiều rồi, tối nay cho phép mình lười một bữa. Chủ quán ký giấy cho phép luôn.',
    '{ban} mệt hả? Ngồi đây nghỉ đi, ở quán này sếp có gọi thì chủ quán cũng không cho nghe máy đâu.',
    'Làm cả ngày rồi, giờ {ban} được phép nằm dài như con mèo. Quán cho phép đó!',
    'Nghe {ban} than mệt mà chủ quán muốn đấm lưng giùm, mà tay ảo nên đấm hông tới.',
  ],
  hungry: [
    'Đói mà coi live quán nhậu là tự hành hạ mình đó {ban}. Thôi comment tên món, quán làm cho đỡ thèm!',
    '{ban} đói hả? Chat nhậu lấy ghế trước, ngồi xuống rồi gọi món là bếp nổi lửa liền.',
    '{ban} đói hả? Quán ảo nên mồi cũng ảo, ăn hoài không no nhưng cũng không mập, lời quá còn gì!',
    'Muốn có mồi thì cả nhà thả đủ chín mươi chín tim đi, không là {ban} ngồi gặm đũa đó nha!',
    '{ban} đòi mồi hả? Tặng một bông hoa là có dĩa gỏi gà liền, quán làm ăn sòng phẳng lắm.',
  ],
  bye: [
    '{ban} về hả, nhớ đi chậm thôi nha. Quán vẫn mở, khi nào buồn thì ghé lại.',
    'Thôi {ban} về nghỉ cho khỏe. Mai ghé quán kể chuyện hôm nay cho cả nhà nghe nha!',
    '{ban} về hả? Về sớm vậy chắc ở nhà có người quản. Thôi về đi, mai nhớ trốn ra quán tiếp nha!',
    'Tạm biệt {ban}! Đi đường cẩn thận, về nhà nhớ khóa cửa, đừng khóa luôn trái tim nha.',
    '{ban} đi ngủ hả? Ngủ ngon, mơ thấy quán nha. Mơ thấy người khác là quán buồn đó!',
  ],
  thanks: [
    'Dạ không có chi {ban}, quán sống bằng mấy câu dễ thương như vầy nè.',
    '{ban} cảm ơn làm chủ quán nở mũi, mũi nở quá cái nón rớt luôn.',
    'Cảm ơn gì mà cảm ơn, {ban} khách sáo quá. Muốn cảm ơn thì thả tim là được rồi!',
    'Không có chi {ban} ơi, quán phục vụ tận răng, chỉ thiếu mỗi bia thiệt thôi.',
    '{ban} lịch sự quá làm chủ quán ngại. Thôi dzô một cái là huề nha!',
  ],
  hello: [
    'Chào {ban}! Vô ngồi đi, ghế nhựa lùn lùn mà ngồi quên luôn đường về.',
    '{ban} tới là đủ bộ rồi nha! Gõ {kw} chào cả quán một tiếng coi.',
    'Ê {ban}! Vô đây vô đây, chỗ này đang thiếu người góp vui. Gõ {kw} một cái cho quán nghe coi!',
    'Chào {ban}! Vào quán biết chào là lễ phép rồi, cộng mười điểm nhân cách.',
    'Hello {ban}! Quán đang ồn, {ban} vào là ồn gấp đôi, quá hợp luôn.',
    'Ủa {ban} tới rồi hả? Nãy giờ cả quán nhắc {ban} quá trời. Nói xấu thôi, đùa đó!',
  ],
  first: [
    '{ban} tới sớm nhất, được quyền chọn bàn đẹp nhất quán. Gõ bàn mấy là quán xếp liền!',
    'Tem của {ban} rồi! Ai tới sau thì xếp hàng gặm đậu phộng chờ nha.',
    '{ban} giành tem nhanh như người yêu cũ trở mặt vậy đó! Vỗ tay cho {ban} nào.',
    'Tem đã có chủ là {ban}! Ai chậm chân thì ngồi gặm đậu phộng nha.',
  ],
  praise: [
    '{ban} khen làm chủ quán muốn mở thêm chi nhánh, mà quán ảo nên mở cái nữa cũng chẳng tốn gì!',
    'Nghe {ban} khen là quán có động lực mở cửa tới khuya luôn đó.',
    'Khen quán hả {ban}? Khen nữa đi, khen nữa là chủ quán bay lên trần luôn.',
    '{ban} nói quán vui, quán cảm động muốn khóc, nhưng thôi, khóc xong lại phải dọn quán.',
    'Cảm ơn {ban}! Khen bằng lời thì quán nghe rồi, khen bằng tim thì thả ở góc phải nha.',
  ],
  praiseHost: [
    'Thôi {ban} đừng khen nữa, khen nữa chủ quán quên luôn nồi lẩu trên bếp bây giờ!',
    '{ban} khen có duyên ghê. Để quán ghi tên {ban} vô sổ khách ruột nha.',
    '{ban} khen chủ quán hả? Nói thêm đi, chủ quán đang ghi âm lại để mai nghe tiếp.',
    'Ôi {ban} khéo miệng ghê. Chủ quán mắc cỡ đỏ mặt mà không ai thấy, tiếc ghê.',
    'Khen giọng hay hả? {ban} tinh tai quá! Quán tặng {ban} một ly nước ngọt ảo.',
  ],
  love: [
    'Thương quán thì nhớ ghé đều nha {ban}, quán nhớ mặt khách quen giỏi lắm.',
    '{ban} nói thương làm cả quán quay qua nhìn kìa. Thôi dzô một cái cho đỡ ngại!',
    '{ban} thương quán hả? Quán cũng thương {ban}, thương trong sáng thôi nha, cụng ly là đủ rồi.',
    'Thương quán thì ghé hoài nha {ban}, đừng thương rồi bỏ đi như ai kia đó.',
    'Nghe {ban} nói câu này chủ quán muốn khóc. Thôi, dzô một cái cho đỡ xúc động!',
  ],
  laugh: [
    '{ban} cười là quán biết chuyện vừa rồi có duyên. Cả nhà cười theo đi!',
    'Cười nữa đi {ban}, cười ở quán này không mất tiền, mất mỗi chút hơi thôi.',
    '{ban} cười gì mà nghe như cái quạt máy hư vậy? Cười cho cả quán cười theo luôn đi!',
    'Ha ha, {ban} cười hở mười cái răng rồi đó, khép miệng lại kẻo ruồi bay vô!',
    'Cười nhiều trẻ lâu, {ban} cười tiếp đi, mười năm nữa vẫn đẹp như hôm nay.',
  ],
  music: [
    'Nhạc quán mở nhỏ thôi cho cả nhà còn nghe nhau nói chuyện, {ban} thấy ổn không?',
    '{ban} muốn karaoke hả? Quán có mỗi cái micro ảo, hát lên không ai nghe, hát thoải mái!',
    '{ban} muốn chủ quán hát hả? Chủ quán hát là cả quán chạy hết đó, thôi nghe nhạc nền cho an toàn.',
    'Nhạc quán là đàn tranh remix, nghe xong muốn đứng dậy múa luôn đó {ban}.',
    '{ban} xin bài hả? Quán có đúng một bài thôi, mà bài đó hay nên nghe hoài không chán.',
  ],
  seat: [
    'Quán tám bàn, mỗi bàn sáu ghế, bốn mươi tám chỗ lận {ban} ơi. Gõ nhậu là có chỗ liền!',
    '{ban} muốn ngồi gần bếp cho ấm hay ngồi ngoài cho mát? Gõ bàn với số là quán dắt qua.',
    '{ban} muốn ghế hả? Comment nhậu là chủ quán kéo ghế nhựa ra liền, ghế hơi lùn nhưng ngồi êm lắm.',
    'Ghế còn nhiều lắm {ban} ơi, comment nhậu là có chỗ. Muốn ngồi cạnh crush thì gõ bàn với số của crush!',
    'Quán có tám bàn, bàn nào cũng ồn như nhau. {ban} gõ bàn một tới bàn tám mà chọn, chọn sai thì đổi tiếp.',
  ],
  gift: [
    'Quà thì quán mừng, mà không có quà quán vẫn quý {ban} như thường nha.',
    '{ban} đừng lo chuyện quà cáp, ngồi tới cuối live với quán là món quà to nhất rồi.',
    '{ban} hỏi quà hả? Một xu là có mồi ngon, ba mươi xu là đập quán. Chủ quán vừa mong vừa sợ!',
    'Quà là tấm lòng {ban} ơi, không có cũng được. Mà có thì chủ quán đọc tên to như loa phường luôn.',
    '{ban} nhắc tới quà làm chủ quán sáng mắt. Đùa thôi, ngồi chơi vui là quán vui rồi!',
  ],
  like: [
    'Tim của {ban} bay lên đẹp như pháo bông luôn! Cả nhà thả thêm đi!',
    'Thả tim đi cả nhà, {ban} hô rồi đó, ai không thả là quán nhớ mặt nha!',
    'Đúng rồi {ban}, cả nhà thả tim đi! Tim bay đầy quán là chủ quán vui tới sáng.',
    '{ban} hô thả tim hay quá, cho {ban} làm trưởng ban phong trào luôn nha!',
  ],
  follow: [
    '{ban} follow rồi thì lần sau vô quán khỏi xếp hàng, có ghế quen chờ sẵn.',
    'Thêm một chiến hữu nữa! Cảm ơn {ban}, từ nay quán mở cửa là {ban} biết liền.',
    '{ban} follow quán rồi hả? Từ nay là người nhà, vô quán khỏi chào, ra quán khỏi trả tiền, mà quán ảo nên vốn dĩ khỏi trả.',
    'Follow rồi là không được bỏ quán nha {ban}, bỏ là quán buồn, quán buồn là quán kể chuyện cười dở.',
  ],
  share: [
    '{ban} share là quán có thêm bạn mới, mà bạn mới thì quán có thêm chuyện để kể. Lời quá!',
    'Chia sẻ xong nhớ rủ đúng người biết nhậu nha {ban}, rủ sếp vô là quán hết dám nói bậy đó!',
    '{ban} share quán hả? Quá đỉnh! Rủ thêm bạn vô, đông vui chủ quán mới có cớ kể chuyện cười.',
    'Cảm ơn {ban} chia sẻ! Từ giờ phút này {ban} là đại sứ thương hiệu của quán.',
  ],
  money: [
    'Hết tiền thì ngồi quán này là đúng bài {ban} ơi, ở đây hóa đơn luôn luôn không đồng.',
    '{ban} ráng qua tháng này nha. Tiền hết rồi tiền lại về, bạn nhậu mới khó kiếm.',
    '{ban} hết tiền hả? Quán ảo này ngồi miễn phí, nghèo cỡ nào cũng có ghế nha!',
    'Lương về rồi hả {ban}? Lương về thì chào, lương đi không hẹn. Nhớ để dành chút nha!',
    'Ví mỏng như lá lúa thì {ban} cứ ngồi đây, ở quán này chỉ trả bằng tiếng cười thôi.',
  ],
  work: [
    'Công việc để ngoài cửa quán nha {ban}, vô đây chỉ có mồi với chuyện tào lao thôi.',
    '{ban} làm tốt lắm rồi. Giờ ngồi xuống, thở một cái, deadline mai nó vẫn còn đó mà.',
    'Nhắc tới sếp làm cả quán run. {ban} ngồi đây đi, quán này sếp không tìm được đâu.',
    '{ban} mới tan ca hả? Vất vả rồi, giờ là giờ xả hơi, deadline để mai nó tự chạy.',
    'Đi làm cả ngày rồi, {ban} xứng đáng cái ghế đẹp nhất quán. Mà ghế đẹp hết rồi, ngồi tạm ghế nhựa nha.',
  ],
  weekend: [
    'Cuối tuần là của {ban}, ai nhắn công việc thì cứ để mai hẵng trả lời nha!',
    '{ban} nghỉ thì ngủ nướng cho đã, dậy trưa cũng không ai phạt đâu.',
    'Cuối tuần rồi {ban} ơi! Cuối tuần là phải chill, còn thứ hai thì để thứ hai lo.',
    '{ban} được nghỉ hả? Sướng ghê, quán thì cuối tuần còn đông hơn, chủ quán chạy muốn rớt dép.',
  ],
  weather: [
    'Trời vậy làm chủ quán nhớ mấy hôm ngồi vỉa hè nghe mưa rơi trên mái bạt. Chill gì đâu!',
    '{ban} nhớ mặc ấm, mang áo mưa theo nha. Quán lo cho {ban} như lo cho khách ruột vậy đó.',
    'Trời vậy mà {ban} vẫn ghé quán, quán quý {ban} như quý cái áo mưa vậy đó.',
    'Trời mưa hay trời nắng gì thì vô quán cũng mát, vì quán có máy lạnh ảo đó {ban}.',
    'Thời tiết thất thường như người yêu cũ, {ban} giữ sức khỏe nha.',
  ],
  sleepy: [
    '{ban} ngáp một cái là cả quán ngáp theo rồi nè. Thôi ngủ đi, mai còn sức ghé quán.',
    'Buồn ngủ mà ráng thức xem live, {ban} đúng là chiến hữu có tâm. Nhưng ngủ sớm vẫn hơn nha!',
    '{ban} buồn ngủ thì đi ngủ đi, thức khuya là mắt thâm như gấu trúc đó.',
    'Cú đêm hả {ban}? Quán cũng cú đêm nè, nhưng mai ngủ gật ở chỗ làm thì đừng khai là do quán nha.',
  ],
  lovelife: [
    'Ế là còn nguyên bản {ban} ơi, ai mà chưa ai xài thì còn mới. Cả quán ế chung cho vui!',
    '{ban} thả thính ngay trong quán cũng được, ở đây đông người lắm, biết đâu trúng!',
    '{ban} ế hả? Không sao, cả quán ở đây toàn độc thân vui tính. Ai muốn thoát ế thì giơ tay!',
    'Chuyện tình cảm hả {ban}? Chủ quán nói thật, đang ế nên không dám khuyên ai hết.',
    '{ban} có crush hả? Thả thính đi, không dính thì quán an ủi, dính thì quán ăn mừng.',
  ],
  about: [
    'Quán {q} mở trên live thôi {ban}, hết live là quán dọn bàn đi ngủ. Follow để biết hôm nào quán mở nha.',
    '{ban} hỏi quán thật hay ảo hả? Quán ảo, chủ quán là máy đọc, mà cái vui thì thiệt trăm phần trăm.',
    'Quán {q} là quán ảo {ban} ơi, không có bia thiệt, chỉ có chủ quán thiệt nhây và khách thiệt vui.',
    '{ban} hỏi quán ở đâu hả? Ngay trong điện thoại của {ban} đó, mở ra là thấy, khỏi tìm đường.',
    'Quán chỉ mở trên live thôi {ban}. Follow đi để lần sau quán mở cửa là biết liền.',
  ],
  food: [
    '{ban} kể món đó ra làm cả bàn quay qua nuốt nước miếng kìa!',
    'Món đó mà có thiệt ở đây chắc quán cháy hàng {ban} ơi. Thôi gọi tạm mồi miễn phí nha!',
    'Nghe {ban} nói tới món đó mà chủ quán chảy nước miếng ướt cả bàn phím.',
    '{ban} gọi món hay ghê, mà quán ảo nên chỉ có món tưởng tượng. Tưởng tượng mạnh vô cho ngon!',
    'Món đó ngon dữ thần luôn {ban}. Tặng bông hoa là có dĩa mồi ra bàn liền nha.',
  ],
  critic: [
    '{ban} chê thẳng vậy quán thích đó, góp ý tiếp đi rồi chủ quán sửa, sửa được cái nào hay cái đó.',
    'Nhạt hả? Để quán kể chuyện cười cứu vãn. Mà chuyện cười của quán cũng nhạt nốt, thôi {ban} chịu khó!',
    '{ban} chê quán nhạt hả? Để chủ quán bỏ thêm muối. Cả nhà gõ {kw} cho quán mặn mà lên coi!',
    'Chê thì chủ quán nhận, buồn đúng ba giây thôi. Xong rồi, vui lại rồi. {ban} góp ý tiếp đi!',
  ],
  city: [
    '{city} có mặt! {ban} ơi, đặc sản {city} là món gì, kể cả quán nghe thèm chơi coi!',
    'Dân {city} đây rồi! {ban} ở đó giờ này mưa hay nắng, báo cáo cho quán với.',
    'Ê, có {ban} ở {city} nè! {city} ơi, rủ thêm hàng xóm vô quán ngồi chơi coi!',
    '{ban} ở {city} hả? Xa vậy mà vẫn ghé, quán xúc động muốn bao luôn tiền xe, xe ảo thôi nha.',
    'Hello {city}! {ban} giơ tay lên cho cả quán thấy dân {city} chịu chơi cỡ nào!',
  ],
  dao: [
    '{ban} gọi đào mà chưa thấy quà đâu, đào đang đứng sau bếp nhìn ra đó nha!',
    'Đào của quán ngon lắm {ban} ơi, mát lạnh, ngọt lịm. Có quà là ra bàn liền!',
    '{ban} đòi {n} em đào hả? Quán làm ăn sòng phẳng, muốn có đào thì tặng quà đi rồi tính!',
    '{n} em đào hả {ban}? Có liền, có liền! Mà quán không bán chịu, quà tới thì đào mới tới nha.',
    'Trời ơi {ban} chịu chơi ghê, gọi tới {n} em đào. Tặng một món quà là đào ra bàn liền, chủ quán hứa danh dự!',
    '{ban} muốn đào thì phải có lòng nha, quà tới đâu đào tới đó, quán nói rồi đó.',
    'Đào thì quán có cả kho {ban} ơi, xinh lắm, ngọt lắm! Nhưng phải tặng quà mới mở cửa kho nha.',
    'Đào đang ngồi sau bếp chờ {ban} đó. Tặng quà là quán dắt ra liền, {n} em đúng số luôn!',
  ],
  vo: [
    'Vợ gọi hả {ban}? Dạ dạ vâng vâng rồi về liền đi, đừng để ở nhà chờ. Ở nhà có người chờ là có phúc đó!',
    '{ban} bị réo rồi kìa! Quán khuyên thật lòng: về sớm một hôm, mai được đi chơi cả ngày, lời to.',
    'Nghe {ban} nói mà cả bàn im re, ông nào cũng giật mình sờ điện thoại. Sợ vợ là thương vợ mà!',
    '{ban} ơi, chồng gọi thì bắt máy liền nha, đừng để chuông reo lần thứ hai!',
    'Ở nhà có người nhắc mình về là may lắm đó {ban}. Quán tiễn {ban} ra cửa, đi đường cẩn thận nha!',
  ],
  bongda: [
    'Nhắc bóng đá là máu {ban} nhỉ! Cả nhà ai coi trận nào tối nay thì comment, quán hóng ké với.',
    '{ban} bắt đội nào vậy? Quán thì luôn bắt đội nào ghi bàn trước, vậy cho chắc ăn!',
    'Xem bóng mà có dĩa đậu phộng với mấy đứa bạn ồn ào là nhất rồi {ban} ha.',
    '{ban} ơi, hò hét vừa thôi kẻo hàng xóm qua gõ cửa. Mà thôi, hét đi, vui mà!',
    'Đội nhà thua thì buồn ba ngày, thắng thì vui ba tháng. {ban} hôm nay buồn hay vui?',
  ],
  xe: [
    'Kẹt xe hả {ban}? Thôi tấp vô quán ngồi chờ hết kẹt rồi về, quán ảo nên tấp vô khỏi gửi xe.',
    '{ban} nhớ nha, đã uống là không lái. Gọi xe về, mai ra lấy xe cũng được, không ai lấy mất đâu.',
    'Xe hư giữa đường là xui thiệt {ban} ơi. Ngồi đây than với quán cho nhẹ lòng rồi tính tiếp.',
    '{ban} đi đường cẩn thận nha, đội nón bảo hiểm cài quai đàng hoàng, quán còn muốn gặp {ban} dài dài.',
  ],
  question: [
    '{ban} hỏi hay đó, mà chủ quán thì chỉ giỏi rót bia với nói nhảm thôi. Cả nhà ai biết giúp {ban} đi!',
    'Để quán nghĩ đã… nghĩ xong rồi, vẫn không biết. {ban} thông cảm, chủ quán thật thà lắm!',
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
  '{ban} ơi, hôm nay có chuyện gì vui kể quán nghe với, quán hóng chuyện giỏi lắm.',
  'Hỏi nhỏ nha {ban}: mồi nhậu khoái khẩu nhất của {ban} là món gì?',
  '{ban} ơi, lần gần nhất {ban} đi nhậu thiệt là khi nào vậy?',
  'Đố {ban} nè: ngồi nhậu mà hết chuyện nói thì nên làm gì? Quán thì gõ {kw} là xong!',
  '{ban} ơi, nhà có nuôi con chó con mèo nào không? Khoe cho cả quán nghe coi!',
  'Hỏi {ban} câu khó nè: nem chua hay khô mực, chỉ được chọn một thôi!',
  '{ban} ơi, mai có phải dậy sớm không? Không thì ngồi chơi tới khuya với quán nha.',
  'Ê {ban}, bài hát nào nghe là nhớ tới hồi trẻ liền vậy?',
  '{ban} ơi, nếu trúng số thì việc đầu tiên {ban} làm là gì? Khai thiệt nha!',
  '{ban} ơi, ở chỗ {ban} giờ này còn hàng quán nào mở không?',
  'Hỏi {ban} nè: đi nhậu mà gặp sếp ngồi bàn bên thì nên chào hay nên trốn?',
  '{ban} ơi, tối nay ăn cơm nhà hay ăn ngoài? Kể món cho quán thèm ké.',
  'Ê {ban}, kể quán nghe một tật xấu dễ thương của {ban} đi, quán hứa không cười.',
  '{ban} ơi, hồi nhỏ {ban} mơ làm nghề gì? Giờ có làm đúng nghề đó không?',
  '{ban} ơi, cuối tuần này có kèo gì chưa? Chưa thì ghé quán, quán lúc nào cũng mở.',
  'Đố {ban}: một mình đi nhậu có vui không? Quán thấy vui, vì có cả nhà trên live nè!',
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
  'Cả nhà ơi, ai đang ăn gì đó thì khoe đi, quán thèm ké một miếng!',
  'Đố cả quán: ở quán nhậu, ai là người hay giành trả tiền nhất? Comment nghề của người đó coi!',
  'Cả nhà ơi, chọn giùm quán: mai nấu lẩu gà lá é hay lẩu cá kèo? Comment đi, quán làm theo số đông!',
  'Ai hôm nay được khen một câu thì gõ chữ vui đi, quán mừng giùm!',
  'Cả nhà ơi, bài hát nào mà nghe xong là muốn gõ {kw} liền? Comment tên bài coi!',
  'Hỏi cả quán: nhậu xong về nhà ăn thêm gói mì, có ai giống chủ quán không?',
  'Ai từng ngủ gật trên bàn nhậu thì gõ chữ có đi, quán không cười đâu, quán cười sẵn rồi!',
  'Cả nhà ơi, tối nay trời ở chỗ mọi người thế nào? Mưa hay nắng, comment cho quán biết với!',
  'Đố vui: cái gì càng chia càng nhiều? Đáp án là niềm vui đó cả nhà, nên ở lại chia với quán nha!',
  'Ai đang đi làm về mà còn mặc nguyên đồng phục thì gõ chữ mệt, quán gửi một ly trà đá ảo!',
  'Cả nhà ơi, ai biết nấu ăn thì khoe món tủ đi, quán học lỏm vài chiêu!',
  'Hỏi thiệt cả quán: đi nhậu quan trọng mồi ngon hay bạn vui? Comment chọn đi!',
  'Ai mai được nghỉ thì gõ chữ sướng, ai mai đi làm thì gõ chữ cố lên. Quán đếm hai bên coi ai đông!',
  'Cả nhà ơi, kể một câu nói của ba mẹ mà giờ nghĩ lại thấy đúng ghê đi!',
  'Thử thách trí nhớ nè: ai còn nhớ món ăn vặt hồi cấp một của mình thì comment, quán hoài niệm với!',
  'Cả quán ơi, ai chưa có ghế thì gõ nhậu, ai có ghế rồi thì gõ {kw}, quán xem bên nào đông hơn!',
  'Đố cả nhà: quán có tám bàn, mỗi bàn sáu ghế, vậy cả quán bao nhiêu chỗ? Ai trả lời đúng quán phục!',
  'Ai thấy đời dạo này mệt thì gõ một chữ thôi, cả quán ngồi đây với nhau, không ai một mình hết.',
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
  'Ai đang đứng ngoài thì chat chữ nhậu là có ghế liền nha, bàn nào cũng còn chỗ, muốn bàn nào thì gõ bàn mấy!',
  'Quán có đậu lạc, nem chua, trà đá miễn phí nè, comment tên món là chủ quán làm liền!',
  'Ai muốn gọi đào thì comment số em đi, quán ghi sổ hết, tặng quà là đào ra bàn liền!',
];

/** Reply to any other comment: works whatever they wrote */
export const BUA_ACK = [
  'Quán nghe rồi nha {ban}, nghe xong còn gật gù một mình nữa.',
  '{ban} comment phát nào trúng phát đó, đúng là có nghề.',
  'Nói nghe thương ghê. {ban} ở nhà chắc hay được khen lắm ha.',
  'Ui câu này hay, để quán cất vô sổ, mai đem ra xài lại nha {ban}.',
  '{ban} làm chủ quán phải ngồi thẳng lưng lên nghe đó.',
  'Chuẩn luôn! Cả bàn gật đầu rào rào theo {ban} kìa.',
  '{ban} nói câu này xong là bàn bên cạnh im lặng vì nể.',
  'Nghe {ban} nói mà chủ quán quên mất đang nấu gì trên bếp.',
  'Thôi {ban} đừng nói nữa, nói nữa quán phải mời {ban} làm chủ quán mất!',
  '{ban} ơi, câu đó mà in lên áo thì bán chạy phải biết.',
  'Quán đồng ý, cả quán đồng ý, con mèo ngoài cửa cũng đồng ý luôn.',
  'Nghe hợp lý quá, mà quán vẫn muốn cãi một câu cho vui. Thôi không cãi nữa!',
  '{ban} nói nhẹ nhàng mà thấm ghê.',
  'Ờ hén, {ban} nhắc quán mới nhớ! Cảm ơn {ban} nha.',
  'Comment của {ban} vừa lên bảng tin của quán rồi đó, oai chưa!',
  'Trời, {ban} rảnh ghê, mà quán thích mấy người rảnh như vậy lắm!',
  '{ban} đúng kiểu người ngồi chung bàn là vui cả tối.',
  'Để quán suy nghĩ ba giây… rồi, quán đồng ý với {ban}.',
  '{ban} gõ nhanh ghê, chủ quán đọc muốn hụt hơi.',
  'Cả quán quay qua nhìn {ban} với ánh mắt ngưỡng mộ nha.',
  'Câu này đáng được một tiếng {kw} của cả quán!',
  '{ban} nói vậy là quán hết đường chối rồi.',
  'Ghi nhận ý kiến của {ban}. Quán sẽ xem xét, chắc là vậy.',
  'Nghe xong chủ quán muốn mời {ban} ly nước ngọt, mà ảo, nên tưởng tượng giùm nha.',
  '{ban} vui tính quá, ngồi bàn nào bàn đó cười suốt cho coi.',
  'Chuẩn chỉnh luôn! {ban} được quán cộng một điểm chăm phát biểu.',
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
