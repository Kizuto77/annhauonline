// @ts-check
// Khách quen của quán (nhân vật, không phải người xem): ngồi sẵn ở vài ghế, thỉnh thoảng tự gọi món, nói vài câu,
// và chủ quán đáp lại họ. Dùng chung cho server (chọn lúc nào ai nói gì) và sân khấu (hiện và nói).
// Không bao giờ đặt lời vào miệng người xem thật.

/** Names of the regulars, in the order of NPC_SEATS (layout.js) */
export const REGULARS = ['chú Tư', 'anh Hùng', 'chị Lan', 'anh Tuấn', 'cô Ba', 'anh Khoa', 'chị Mai', 'bác Bảy', 'anh Long', 'em Vy', 'anh Phát'];

/** What a regular says [bubble], and how the host answers ({name} = "chú Tư bàn ba") */
export const NPC_TALK = /** @type {Array<[string, string]>} */ ([
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
export const NPC_ORDER = ['{name} gọi thêm {mon} nè, bếp làm liền!', 'Có ngay {mon} cho {name}, khách quen là phải nhanh!', '{name} lại kêu {mon}, đúng dân sành mồi!'];
export const NPC_SERVED = ['{mon} ra bàn {name} rồi đây, nóng hổi!', 'Mời {name} dùng {mon}, ăn ngon thì khen quán một câu nha!'];

/** Free dishes a regular may order (menu ids) */
export const NPC_DISHES = ['lac', 'dauhanh', 'nem', 'khoai', 'dua', 'bia', 'bia', 'trada', 'ngo', 'khoca', 'banhda'];
