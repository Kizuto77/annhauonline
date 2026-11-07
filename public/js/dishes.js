// @ts-check
// Vòng quay mồi: cứ đủ 99 tim của cả phòng là quay ra một món cho cả quán. Đọc bởi server (chọn món) và trang
// stage (vẽ + giọng đọc), nên file này không được dùng API của trình duyệt.

/** @typedef {{ ten: string; icon: string; loi: string }} Dish */

/** @type {Dish[]} */
export const DISHES = [
  { ten: 'Ốc len xào dừa', icon: '🐚', loi: 'Món này mút chùn chụt, cả quán im re luôn.' },
  { ten: 'Khô mực nướng', icon: '🦑', loi: 'Xé nhỏ chấm tương ớt, nhai hoài không chán.' },
  { ten: 'Đậu phộng rang', icon: '🥜', loi: 'Món quốc dân, rẻ mà ngon, bàn nào cũng phải có.' },
  { ten: 'Gỏi gà xé phay', icon: '🥗', loi: 'Chua chua cay cay, ăn vô là tỉnh cả người.' },
  { ten: 'Lẩu thái hải sản', icon: '🍲', loi: 'Nồi lẩu bốc khói, ngồi tới khuya vẫn chưa muốn về.' },
  { ten: 'Nem chua rán', icon: '🍢', loi: 'Giòn rụm bên ngoài, chấm tương ớt là hết sảy.' },
  { ten: 'Chân gà sả tắc', icon: '🍗', loi: 'Giòn sần sật, chua cay vừa miệng.' },
  { ten: 'Lòng nướng', icon: '🔥', loi: 'Thơm lừng cả góc phố, ai đi ngang cũng ngoái lại.' },
  { ten: 'Cánh gà chiên nước mắm', icon: '🍗', loi: 'Mặn mặn ngọt ngọt, ăn xong mút tay luôn.' },
  { ten: 'Bò lá lốt', icon: '🌿', loi: 'Cuốn bánh tráng chấm mắm nêm, chuẩn bài.' },
  { ten: 'Mực một nắng', icon: '🦑', loi: 'Nướng than hồng, chấm muối ớt xanh là đỉnh.' },
  { ten: 'Ếch chiên bơ', icon: '🐸', loi: 'Thịt mềm thơm bơ, gọi một đĩa là không đủ.' },
  { ten: 'Sụn gà rang muối', icon: '🧂', loi: 'Nhai rộp rộp, nói chuyện không dứt.' },
  { ten: 'Khoai tây chiên', icon: '🍟', loi: 'Món cho mấy bạn không ăn cay, ai cũng ăn được.' },
  { ten: 'Đậu hũ chiên giòn', icon: '🧈', loi: 'Chấm mắm tôm, ăn một miếng là nhớ cả tuần.' },
  { ten: 'Bắp xào bơ', icon: '🌽', loi: 'Ngọt thơm, vừa nhâm nhi vừa tám chuyện.' },
  { ten: 'Nghêu hấp sả', icon: '🦪', loi: 'Nước nghêu ngọt lịm, húp một muỗng là ấm bụng.' },
  { ten: 'Hàu nướng mỡ hành', icon: '🦪', loi: 'Béo ngậy, thơm mỡ hành, bàn bên cạnh nhìn qua thèm.' },
  { ten: 'Tôm nướng muối ớt', icon: '🦐', loi: 'Đỏ au, cay xé, bóc vỏ mỏi tay mà vẫn vui.' },
  { ten: 'Cá khô nướng', icon: '🐟', loi: 'Món của mấy ông chú, càng nhai càng thấy ngọt.' },
  { ten: 'Xoài lắc', icon: '🥭', loi: 'Chua chua giải ngấy, chị em trong quán mê lắm.' },
  { ten: 'Lạp xưởng nướng đá', icon: '🌭', loi: 'Xèo xèo trên hòn đá nóng, nghe thôi đã thấy thèm.' },
  { ten: 'Gà nướng muối ớt', icon: '🍗', loi: 'Da giòn thịt mềm, xé bằng tay mới đúng điệu.' },
  { ten: 'Lẩu cá kèo', icon: '🍲', loi: 'Lá giang chua chua, cả nhà ngồi quây quần.' },
  { ten: 'Sò điệp nướng', icon: '🐚', loi: 'Mỡ hành đậu phộng phủ lên, nhìn thôi đã đã.' },
  { ten: 'Bò tái chanh', icon: '🥩', loi: 'Thịt bò mềm thấm chanh, rắc thêm mè rang.' },
  { ten: 'Dồi sụn nướng', icon: '🌭', loi: 'Món ruột của dân nhậu Hà Nội, giòn sần sật.' },
  { ten: 'Ba chỉ nướng', icon: '🥓', loi: 'Cháy cạnh thơm lừng, cuốn rau sống là ngon.' },
  { ten: 'Mề gà nướng', icon: '🍢', loi: 'Dai dai giòn giòn, chấm muối tiêu chanh.' },
  { ten: 'Trái cây dĩa', icon: '🍉', loi: 'Dưa hấu mát lạnh, ăn cho thơm miệng trước khi về.' },
];
