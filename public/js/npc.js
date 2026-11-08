// @ts-check
// Khách quen của quán (nhân vật, không phải người xem): ngồi sẵn ở vài ghế, thỉnh thoảng tự gọi món, nói vài câu,
// và chủ quán đáp lại họ. Dùng chung cho server (chọn lúc nào ai nói gì) và sân khấu (hiện và nói).
// Không bao giờ đặt lời vào miệng người xem thật.

/**
 * Names of the regulars, in the order of NPC_SEATS (layout.js). Three only — chú Tư and anh Hùng share a table,
 * chị Lan sits at hers — so the quán is never empty while 45 stools stay free for real viewers (the owner's rule).
 */
export const REGULARS = ['chú Tư', 'anh Hùng', 'chị Lan'];

/** What a regular says [bubble], and how the host answers ({name} = "chú Tư bàn ba") */
export const NPC_TALK = /** @type {Array<[string, string]>} */ ([
  ['Ê chủ quán, nhạc này nghe được đó', 'Khen nhạc là khen đúng gu chủ quán rồi {name}! Để quán mở tiếp bài này nha.'],
  ['Hôm nay làm mệt quá trời', 'Mệt thì ngồi lâu lâu chút {name}, quán này không đuổi khách bao giờ.'],
  ['Vợ gọi rồi, về đây', 'Dạ dạ, {name} về đi kẻo ở nhà chờ! Mai ghé quán sớm nha.'],
  ['Ai ngồi bàn trống kia không?', 'Còn trống đó {name}! Cả nhà trên live ai chat nhậu là qua ngồi với {name} liền!'],
  ['Cho xin khăn lạnh với', 'Khăn lạnh cho {name} đây, lau mặt cái cho tỉnh rồi nhậu tiếp!'],
  ['Trà đá đâu rồi chủ quán', 'Trà đá tới liền {name}, quán này trà đá uống thả ga không tính tiền nha!'],
  ['Mai chủ nhật rồi, ngồi thêm chút', 'Nghe {name} nói mà quán muốn mở cửa tới sáng luôn!'],
  ['Chủ quán ơi, có đồ chay không?', '{name} hỏi hay đó! Đậu lạc, đậu tẩm hành, dưa chuột, toàn đồ chay mà ngon bá cháy.'],
  ['Lâu quá không gặp mấy ông bạn', 'Rủ bạn vô quán đi {name}, ở đây lúc nào cũng còn ghế.'],
  ['Chủ quán nay nói nhiều ghê', 'Tại khách vui quá nên quán nói hăng {name} ơi, im là quán buồn đó!'],
  ['Đậu phộng này rang khéo đó', 'Cảm ơn {name}, bí quyết là rang lửa nhỏ, đảo đều, vớt ra lúc vừa thơm!'],
  ['Tối nay ai nhậu tới khuya nào?', '{name} rủ kìa! Ai định ngồi tới khuya thì gõ một chữ liều coi nào!'],
  ['Chủ quán ơi, chỗ này hút gió mát ghê', 'Chỗ đó là chỗ VIP của quán đó {name}, ngồi mát mà không tốn thêm đồng nào!'],
  ['Hồi xưa quán có cái bàn gỗ cũ', '{name} nhớ dai ghê! Bàn đó gãy chân rồi, quán thay bàn mới mà khách cũ vẫn vậy.'],
  ['Cho thêm chén nước mắm', 'Nước mắm ớt cho {name} đây, cay vừa phải thôi nha!'],
  ['Ai biết mai mưa không ta?', '{name} lo xa ghê! Mưa thì quán có mái bạt, cứ ngồi đó mà nghe mưa rơi lộp bộp.'],
  ['Ngồi đây nghe chuyện vui ghê', 'Quán vui là nhờ có {name} với cả nhà trên live đó, chứ chủ quán nói một mình buồn chết!'],
  ['Chủ quán ơi, dọn bớt bàn giùm', 'Dạ có liền {name}, để quán dẹp bớt vỏ với dĩa cho rộng bàn nha!'],
  ['Hôm nay lương về rồi nè', 'Mừng cho {name}! Nhưng nhớ để dành chút nha, tháng sau còn dài lắm.'],
  ['Ai thua thì trả tiền nha', 'Khỏi cá {name} ơi, quán này không thu tiền, thua hay thắng gì cũng được ngồi!'],
  ['Chủ quán đóng cửa mấy giờ?', 'Quán mở tới khi nào hết khách {name} à, mà {name} ngồi hoài nên quán chưa đóng ngày nào!'],
  ['Lẩu sôi rồi kìa', 'Sôi rồi thì thả rau vô {name} ơi, chờ thêm chút là ngọt nước lắm!'],
  ['Chủ quán ơi, thêm đá!', 'Có liền {name} ơi, đá lạnh tê tay luôn!'],
  ['Hết bia rồi nè!', '{name} uống nhanh quá, bếp chạy không kịp! Bia hơi ra liền nha.'],
  ['Mồi hôm nay ngon ghê', 'Cảm ơn {name} nha, khen nữa là chủ quán tặng thêm dĩa đậu lạc!'],
  ['Một hai ba dzô!', '{name} hô to quá, cả phố nghe luôn! Cả quán dzô theo {name} nào!'],
  ['Bàn bên kia ồn quá', 'Ồn mới vui {name} ơi, quán nhậu mà im re là quán buồn đó!'],
  ['Mai ai đi làm sớm không?', '{name} hỏi câu đau lòng ghê, ai mai đi làm sớm thì comment một chữ khóc nha!'],
  ['Cho xin dĩa dưa chuột', 'Dưa chuột chấm muối ớt cho {name} có liền, giòn rụm luôn!'],
  ['Ai trả tiền hôm nay?', '{name} ơi quán ảo mà, hóa đơn không đồng, khỏi giành trả nha!'],
  ['Kể chuyện cười đi chủ quán', 'Chuyện cười nè {name}: có ông say về nhà, gõ cửa nói mở cửa cho tôi vô, vợ hỏi anh là ai, ổng nói tui tới đón chồng chị đi nhậu!'],
  ['Trăm phần trăm nha!', '{name} trăm phần trăm thì được, mà nhớ uống thêm ly nước lọc nữa nha!'],
  ['Bóng đá tối nay ai đá vậy?', '{name} mê bóng đá ghê! Cả nhà ai biết tối nay đội nào đá comment cho {name} biết với.'],
  ['Chủ quán hát một bài đi', 'Chủ quán hát là cả quán chạy hết đó {name}, thôi nghe nhạc nền cho an toàn!'],
  ['Lâu lắm mới ra quán', 'Mừng {name} quay lại nha, ghế quen vẫn để dành cho {name} đó!'],
  ['Nem chua này chua quá', 'Nem chua thì phải chua chứ {name}, ngọt là nem ngọt rồi!'],
  ['Hôm nay đông khách ghê', 'Đông thiệt {name} ơi, cả nhà trên live vô ngồi kín bàn luôn. Ai chưa có ghế thì chat nhậu nha!'],
  ['Cho thêm đôi đũa', 'Đũa cho {name} đây, làm rơi đũa là có khách tới đó nha!'],
  ['Tối nay trời mát ghê', 'Trời mát ngồi vỉa hè là nhất rồi {name}, thêm dĩa mồi là chuẩn bài!'],
  ['Ai gõ dzô với tui đi', '{name} rủ kìa cả nhà! Ai gõ dzô cụng ly với {name} nào!'],
  ['Lẩu bàn kia thơm quá', '{name} thèm hả? Ai thương {name} thì tặng quà năm xu là có nồi lẩu cho bàn này luôn!'],
  ['Tính tiền chủ quán ơi', 'Quán ảo không thu tiền {name} ơi, ở lại ngồi chơi thêm đi!'],
]);

/** The host's word when a regular orders, and when it is served ({name}, {mon}) */
export const NPC_ORDER = ['{name} gọi thêm {mon} nè, bếp làm liền!', 'Có ngay {mon} cho {name}, khách quen là phải nhanh!', '{name} lại kêu {mon}, đúng dân sành mồi!', '{name} kêu {mon}, gu này là gu của người sành rồi!', 'Nghe {name} gọi {mon} là quán biết tối nay ngồi lâu đây!'];
export const NPC_SERVED = ['{mon} ra bàn {name} rồi đây, nóng hổi!', 'Mời {name} dùng {mon}, ăn ngon thì khen quán một câu nha!', '{mon} của {name} đây, thiếu gì thì gọi tiếp nha!', 'Của {name} nè, {mon} vừa ra lò luôn!'];

/** Free dishes a regular may order (menu ids) */
export const NPC_DISHES = ['lac', 'dauhanh', 'nem', 'khoai', 'dua', 'bia', 'bia', 'trada', 'ngo', 'khoca', 'banhda', 'da', 'da', 'khanlanh', 'chendua', 'tamgiay', 'chanhot'];
