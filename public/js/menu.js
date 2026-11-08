// @ts-check
// Thực đơn quán vỉa hè. Món bình dân: khách comment tên món là bếp làm (miễn phí). Món ngon: quà từ 1 xu.
// Lẩu: quà từ 5 xu, bếp chọn ngẫu nhiên một nồi. Dùng chung cho server (nhận order) và sân khấu (bảng, món lên bàn).

/** @typedef {{ id: string; ten: string; short: string; icon: string; kind: 'plate' | 'hotpot' | 'drink' | 'item'; alias: string[] }} MenuItem */

/** @type {MenuItem[]} gọi bằng comment, miễn phí */
export const FREE = [
  { id: 'lac', ten: 'Đậu lạc rang', short: 'Đậu lạc', icon: '🥜', kind: 'plate', alias: ['đậu lạc', 'lạc rang', 'lạc', 'đậu phộng', 'đậu phộng rang'] },
  { id: 'dauhanh', ten: 'Đậu tẩm hành', short: 'Đậu tẩm hành', icon: '🧈', kind: 'plate', alias: ['đậu tẩm hành', 'đậu hũ', 'đậu phụ', 'đậu rán', 'đậu chiên', 'đậu hũ chiên'] },
  { id: 'dua', ten: 'Dưa chuột chấm muối', short: 'Dưa chuột', icon: '🥒', kind: 'plate', alias: ['dưa chuột', 'dưa leo'] },
  { id: 'khoca', ten: 'Khô cá chỉ vàng', short: 'Khô cá', icon: '🐟', kind: 'plate', alias: ['khô cá', 'cá khô', 'khô cá chỉ vàng'] },
  { id: 'nem', ten: 'Nem chua', short: 'Nem chua', icon: '🍢', kind: 'plate', alias: ['nem chua', 'nem'] },
  { id: 'khoai', ten: 'Khoai tây chiên', short: 'Khoai chiên', icon: '🍟', kind: 'plate', alias: ['khoai tây chiên', 'khoai tây', 'khoai chiên', 'khoai'] },
  { id: 'ngo', ten: 'Ngô chiên bơ', short: 'Ngô chiên', icon: '🌽', kind: 'plate', alias: ['ngô chiên', 'bắp chiên', 'ngô', 'bắp'] },
  { id: 'rau', ten: 'Rau muống xào tỏi', short: 'Rau muống', icon: '🥬', kind: 'plate', alias: ['rau muống', 'rau muống xào', 'rau'] },
  { id: 'trung', ten: 'Trứng vịt lộn', short: 'Trứng lộn', icon: '🥚', kind: 'plate', alias: ['trứng vịt lộn', 'hột vịt lộn', 'trứng lộn', 'hột vịt'] },
  { id: 'banhda', ten: 'Bánh đa nướng', short: 'Bánh đa', icon: '🍘', kind: 'plate', alias: ['bánh đa', 'bánh tráng nướng', 'bánh tráng'] },
  { id: 'bia', ten: 'Bia hơi', short: 'Bia hơi', icon: '🍺', kind: 'drink', alias: ['bia hơi', 'bia', 'bia hoi'] },
  { id: 'trada', ten: 'Trà đá', short: 'Trà đá', icon: '🧊', kind: 'drink', alias: ['trà đá', 'tra da', 'trà'] },
  { id: 'nuocngot', ten: 'Nước ngọt', short: 'Nước ngọt', icon: '🥤', kind: 'drink', alias: ['nước ngọt', 'nước có ga'] },
  { id: 'nuocloc', ten: 'Nước lọc', short: 'Nước lọc', icon: '💧', kind: 'drink', alias: ['nước lọc', 'nước suối', 'nước'] },
  // Lặt vặt như quán ngoài đời: gọi là chạy bàn mang ra ngay, không phải chờ bếp
  { id: 'da', ten: 'Xô đá', short: 'Đá', icon: '🧊', kind: 'item', alias: ['xô đá', 'thêm đá', 'xin đá', 'cho đá', 'ly đá', 'đá lạnh', 'bịch đá', 'đá viên', 'đá'] },
  { id: 'khanlanh', ten: 'Khăn lạnh', short: 'Khăn lạnh', icon: '💧', kind: 'item', alias: ['khăn lạnh', 'khăn ướt', 'khăn giấy ướt', 'khăn'] },
  { id: 'chendua', ten: 'Chén đũa', short: 'Chén đũa', icon: '🥢', kind: 'item', alias: ['chén đũa', 'bát đũa', 'đôi đũa', 'thêm chén', 'thêm bát', 'thêm ly', 'thêm cốc', 'cái chén', 'đũa', 'chén', 'bát'] },
  { id: 'tamgiay', ten: 'Tăm và giấy ăn', short: 'Tăm, giấy', icon: '🧻', kind: 'item', alias: ['tăm và giấy', 'giấy ăn', 'khăn giấy', 'hộp tăm', 'giấy lau', 'tờ giấy', 'tăm', 'giấy'] },
  { id: 'chanhot', ten: 'Muối tiêu chanh ớt', short: 'Chanh ớt', icon: '🌶️', kind: 'item', alias: ['muối tiêu chanh', 'muối tiêu', 'muối ớt', 'chanh ớt', 'tương ớt', 'quả chanh', 'trái chanh', 'chanh', 'ớt'] },
  { id: 'mam', ten: 'Chén nước mắm', short: 'Nước mắm', icon: '🥣', kind: 'item', alias: ['chén nước mắm', 'nước mắm', 'nước chấm', 'mắm tôm', 'mắm'] },
];

/** @type {MenuItem[]} quà từ 1 xu: bếp chọn ngẫu nhiên một món ngon */
export const PAID = [
  { id: 'ganuong', ten: 'Gà nướng muối ớt', short: 'Gà nướng', icon: '🍗', kind: 'plate', alias: ['gà nướng'] },
  { id: 'mucnuong', ten: 'Mực nướng sa tế', short: 'Mực nướng', icon: '🦑', kind: 'plate', alias: ['mực nướng', 'mực'] },
  { id: 'ochuong', ten: 'Ốc hương xào bơ tỏi', short: 'Ốc hương', icon: '🐚', kind: 'plate', alias: ['ốc hương', 'ốc'] },
  { id: 'ngheu', ten: 'Nghêu hấp sả', short: 'Nghêu hấp', icon: '🦪', kind: 'plate', alias: ['nghêu', 'ngao'] },
  { id: 'bolalot', ten: 'Bò lá lốt', short: 'Bò lá lốt', icon: '🥩', kind: 'plate', alias: ['bò lá lốt', 'bò'] },
  { id: 'sunga', ten: 'Sụn gà rang muối', short: 'Sụn gà', icon: '🍗', kind: 'plate', alias: ['sụn gà'] },
  { id: 'tomnuong', ten: 'Tôm nướng muối ớt', short: 'Tôm nướng', icon: '🦐', kind: 'plate', alias: ['tôm nướng', 'tôm'] },
  { id: 'ech', ten: 'Ếch chiên bơ', short: 'Ếch chiên', icon: '🐸', kind: 'plate', alias: ['ếch chiên', 'ếch'] },
  { id: 'changa', ten: 'Chân gà nướng', short: 'Chân gà', icon: '🍗', kind: 'plate', alias: ['chân gà'] },
  { id: 'caloc', ten: 'Cá lóc nướng trui', short: 'Cá nướng', icon: '🐟', kind: 'plate', alias: ['cá lóc', 'cá nướng'] },
  { id: 'hau', ten: 'Hàu nướng mỡ hành', short: 'Hàu nướng', icon: '🦪', kind: 'plate', alias: ['hàu nướng', 'hàu'] },
  { id: 'long', ten: 'Lòng nướng', short: 'Lòng nướng', icon: '🌭', kind: 'plate', alias: ['lòng nướng', 'lòng'] },
];

/** @type {MenuItem[]} quà từ 5 xu: một nồi lẩu ngẫu nhiên */
export const HOTPOT = [
  'Lẩu thái hải sản', 'Lẩu cá kèo lá giang', 'Lẩu riêu cua bắp bò', 'Lẩu gà lá é', 'Lẩu bò nhúng giấm',
  'Lẩu mắm miền Tây', 'Lẩu dê', 'Lẩu ếch măng cay', 'Lẩu cá đuối chua cay', 'Lẩu nấm',
].map((ten, i) => ({ id: `lau${i}`, ten, short: ten.replace('Lẩu ', 'Lẩu '), icon: '🍲', kind: /** @type {const} */ ('hotpot'), alias: [ten.toLowerCase()] }));

/** Every item by id, for the stage to draw what the server sends */
export const MENU = Object.fromEntries([...FREE, ...PAID, ...HOTPOT].map((m) => [m.id, m]));
