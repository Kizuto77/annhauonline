# 🍺 Xỉn Bia – Quán nhậu online cho TikTok LIVE

Sân khấu tương tác dọc 9:16 chạy cùng TikTok LIVE Studio. Bối cảnh là một quán nhậu vỉa hè buổi tối: bảng neon, bạt sọc, dây đèn, tủ mát, quầy bia hơi, bàn inox ghế nhựa. Người xem vào live là có nhân vật mang tên TikTok ngồi vào bàn. Gõ `dzo` là nâng ly cụng. Tặng quà thì nhân viên bưng mồi hoặc tháp bia ra bàn người đó, máy quay áp sát vào bàn, và chị (hoặc anh) chủ quán gọi tên cảm ơn.

Đây là **quán ảo để giải trí**: không bán rượu bia, không khuyến khích uống thật. Trên màn hình luôn chạy dòng nhắc: quà tặng chỉ để nhận lời chúc, đã uống rượu bia không lái xe, người dưới 18 tuổi không uống rượu bia. Chủ quán cũng thỉnh thoảng nhắc uống có chừng.

## Tính năng

- **Quán vỉa hè phố cổ ban đêm:** dãy nhà ống có ban công và cửa chớp xanh, cột điện chằng chịt dây, cây sấu, biển hiệu sơn đỏ viền bóng đèn, quán dưới mái bạt cam có bàn thờ ông Địa, vỉa hè lát gạch tàu, xe máy chạy ngang ngoài đường.
- **Bếp ngoài trời, chủ quán nấu và tự bưng món:** bếp than với chảo xào (lửa bùng khi đang nấu), vỉ nướng, nồi nước dùng, thùng đá. Món nấu xong chủ quán đi ra tận bàn đặt món rồi quay về bếp; đông đơn thì phụ quán bưng giúp.
- **8 bàn nhựa đỏ đánh số (BÀN 1–8), 32 ghế.** Vào live chưa có ghế: **follow, chat "nhậu", gọi món hoặc tặng quà** mới được vào bàn. Gõ **"bàn 3"** / "sang bàn 3" để đổi bàn. TikTok không báo ai rời live, nên ai im lặng quá lâu (mặc định 10 phút) sẽ tự đứng dậy về.
- **Gọi món miễn phí bằng comment:** đậu lạc, đậu tẩm hành, dưa chuột, khô cá, nem chua, khoai chiên, ngô chiên, rau muống, trứng lộn, bánh đa, bia hơi, trà đá, nước ngọt, nước lọc. Phiếu order treo dưới mép bạt, có thanh tiến độ.
- **Tặng quà theo số xu (giá mỗi cái):** 1 xu món ngon ngẫu nhiên (gà nướng, mực, ốc, tôm…), 5 xu một nồi lẩu ngẫu nhiên, 30 xu đập quán, 99 xu **bao cả quán** (mỗi bàn một nồi lẩu). Mốc đổi trong admin, bảng gỗ bên trái sân khấu tự ghi theo.
- **Chủ quán đọc to từng comment rồi đáp kiểu bựa** (hoặc kiểu hiền, chọn trong admin). Comment có từ tục, link, số điện thoại, @tag thì bỏ qua; teencode được đọc thành chữ. Khi quán im, chủ quán tự gọi tên người vừa chat để bắt chuyện hoặc hỏi cả quán.
- **Giọng đọc 8 kiểu** (Hoài My, Nam Minh với nhiều cao độ/tốc độ, giọng Google), lỗi mạng thì thử lại cùng giọng chứ không đổi giọng.
- **Hóa đơn ảo:** gõ "tính tiền" ra hóa đơn 0đ (bình luận, cụng ly, món đã ăn, quà, cấp).
- **Gọi đào:** khách đòi "3 em đào" thì tặng quà xong ra… 3 ly trà đào.
- **Khách quen & cấp bậc** (lưu trong `viewers.json` qua nhiều buổi live): 🍺 Khách mới → 🥂 Khách quen → 🍻 Chiến hữu → 😎 Dân chơi → 💰 Đại gia → 👑 Trùm quán → 🐉 Huyền thoại. Huy hiệu cạnh tên, lên cấp có ăn mừng.
- **Sự kiện trong quán** (tự động hoặc bấm trong admin): giờ vàng x2 điểm, mất điện, mưa bão sấm chớp, người bán dạo, bàn bên hát karaoke.
- **Mini game:** oẳn tù tì với chủ quán (gõ kéo/búa/bao), đoán số 1–50, kéo co đội Ốc (gõ 1) với đội Mực (gõ 2).
- **Đập quán:** quà đủ số xu làm cả quán bị đập, chủ quán khóc rồi dọn lại.
- **Quán sống động:** sao, mây, đèn lồng, quạt, mèo đi dạo, khói mồi, khách tự cụng ly, đom đóm, pháo hoa khi có quà lớn.
- **Âm thanh:** nhạc nền quán nhậu Việt tự tổng hợp (`tools/nhac-nhau.py`) hoặc nhạc chill, tiếng quán ồn ào, ly chạm, sấm, chuông kem.
- **Trang điều khiển:**
  - Kết nối TikTok, xem trước sân khấu (không có tiếng).
  - "Đọc ngay", nhắc chia sẻ, bấm "Cả quán dzô".
  - Đổi tên quán, từ khóa, tên bảng, ảnh nền, giọng, tốc độ đọc, nhạc.
  - Nút **thử không cần live** để xem trước mọi hiệu ứng.

## Cần có

- Máy tính có [Node.js](https://nodejs.org) bản LTS (từ 18 trở lên).
- TikTok LIVE Studio, đăng nhập tài khoản sẽ live.
- Internet: giọng đọc, font chữ và tên miền `lvh.me` đều cần mạng.

Không cần card đồ họa mạnh: cảnh quán vẽ bằng SVG/CSS, không dùng 3D.

## Cài và chạy

1. Giải nén thư mục này ra một chỗ cố định.
2. **Windows:** bấm đúp `BAT-LIVE.bat`. Lần đầu nó tự cài 2 thư viện (khoảng 1 phút), sau đó mở trang điều khiển `http://localhost:3000`.
   **Mac/Linux:** mở Terminal trong thư mục, chạy `npm install` rồi `npm start`.
3. Ở trang điều khiển, phần **Tùy chỉnh quán**: đặt tên quán (mặc định "Xỉn Bia"), rồi bấm Lưu.
4. Dùng phần **Thử không cần live** để xem trước và nghe thử giọng.
5. Trong TikTok LIVE Studio, thêm nguồn **Link**:
   - Link: `http://lvh.me:3000/?view=stage`
   - Kích thước: 1080 × 1920
6. Bấm **Xóa bảng TOP** (để xóa điểm của khách giả lúc thử), bắt đầu live, rồi nhập username TikTok và bấm **Kết nối**.

Giữ cửa sổ đen (BAT) mở suốt buổi live; đóng nó là tắt quán.

### Lưu ý khi live

- Chỉ trang `?view=stage` phát tiếng. Trang điều khiển và khung xem trước luôn im lặng. Đừng mở thêm link stage ở trình duyệt khác trong lúc live, nếu không sẽ nghe hai giọng.
- Nếu trang stage hiện nút **"Bấm vào đây để bật tiếng quán"**, nghĩa là trình duyệt đang chặn âm thanh. Hãy bấm nút đó (hoặc nút "Bật tiếng trang stage" trong dashboard). Trong LIVE Studio thường không gặp chuyện này.
- Sửa code xong thì bấm làm mới nguồn Link trong LIVE Studio để nhận bản mới. App không tự tải lại giữa buổi live.
- App chỉ nhận kết nối từ chính máy đang chạy nó, kể cả khi trang web lạ cố gửi lệnh. `lvh.me` là tên miền công khai trỏ về 127.0.0.1; app dùng nó vì LIVE Studio không nhận `localhost`.

## Sửa lỗi thường gặp

- **Không vào được `localhost:3000`:** xem cửa sổ BAT phải có dòng `Xỉn Bia đang chạy`. Nếu cửa sổ báo lỗi cài thư viện, xóa thư mục `node_modules` rồi chạy lại BAT.
- **LIVE Studio không hiện gì với link `lvh.me`:** một số mạng hoặc phần mềm diệt virus chặn tên miền này. Mở Notepad bằng quyền Administrator, mở file `C:\Windows\System32\drivers\etc\hosts`, thêm dòng `127.0.0.1 lvh.me` ở cuối, lưu lại, rồi làm mới nguồn Link.
- **Báo cổng 3000 đang bị dùng:** đóng cửa sổ BAT cũ rồi chạy lại.
- **Không nghe giọng:** kiểm tra mạng, vì giọng đọc lấy từ dịch vụ của Microsoft Edge (lỗi thì tự chuyển sang Google). Câu nào lỗi sẽ được bỏ qua, các câu sau vẫn đọc tiếp.

## Phụ thuộc bên ngoài cần biết

- **Đọc sự kiện TikTok** dùng thư viện không chính thức [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector). TikTok có thể thay đổi làm nó ngừng chạy bất cứ lúc nào.
- **Giọng đọc** dùng `msedge-tts` (giọng `vi-VN-HoaiMyNeural` / `vi-VN-NamMinhNeural`), dự phòng bằng Google Translate. Cả hai đều không phải API chính thức cho mục đích này.
- **Luật của TikTok** về rượu bia, live tự động và kêu gọi tặng quà có thể thay đổi. Người dùng tự chịu trách nhiệm tuân thủ luật của TikTok và pháp luật nơi mình sống. Quán không dùng tên hay logo hãng bia thật nào.

## Cấu trúc code

| File | Làm gì |
|---|---|
| `server.js` | Server Node thuần (không cần Express): phát file, nhận sự kiện TikTok, giữ bảng điểm, thanh tim, cài đặt, đẩy sự kiện qua SSE, giọng đọc `/api/tts` |
| `public/js/stage.js` | Sân khấu: bàn ghế, khách, cụng ly, nhân viên bưng mâm, máy quay, vòng quay, mưa bọt bia |
| `public/js/scene.js` | Cảnh quán vẽ bằng SVG |
| `public/js/people.js` | Nhân vật (khách, nhân viên, chủ quán), bàn, đồ trên bàn |
| `public/js/layout.js` | Vị trí bàn và ghế |
| `public/js/sound.js` | Hàng chờ giọng đọc (có chống kẹt), hiệu ứng âm thanh, tiếng quán, nhạc |
| `public/js/lines.js` | Toàn bộ câu chủ quán nói |
| `public/js/chat.js` | Nhận biết comment nói về chuyện gì |
| `public/js/names.js` | Đọc tên TikTok cho giọng đọc |
| `public/js/dishes.js` | 30 món của vòng quay mồi |
| `public/js/dashboard.js` | Trang điều khiển |
| `club.js` | Server: khách quen & cấp bậc, gọi món & bếp, hóa đơn, sự kiện, mini game |
| `public/js/club-stage.js`, `club-lines.js` | Sân khấu và câu nói cho phần trên |
| `public/js/bua.js` | Đọc comment an toàn, câu đáp bựa, câu bắt chuyện |
| `public/js/effects.js`, `living.js` | Hiệu ứng (quà bay, pháo hoa, tim) và cảnh quán sống động |
| `public/js/levels.js` | Bảng cấp bậc khách quen |
| `public/js/menu.js` | Thực đơn: món miễn phí, món ngon 1 xu, lẩu 5 xu |

Kiểm tra kiểu: `npm run check`.

## Tài nguyên

- `public/assets/audio/quan_nhau.mp3`: nhạc nền quán nhậu (mặc định), tự tổng hợp bằng `tools/nhac-nhau.py` (đàn tranh, đàn bầu, mõ, nhịp remix, không dùng bài hát có sẵn). Chạy lại script để tạo bản khác.
- `public/assets/audio/chill_relax.mp3`: nhạc chill cũ, lấy từ dự án gốc (tạo bằng mô hình AI ACE-Step). Chọn bài trong admin, tab Giọng & Âm thanh.
- Mọi hình ảnh (quán, nhân vật, bàn ghế, hiệu ứng) đều vẽ bằng code trong repo này.

## Giấy phép

MIT, xem `LICENSE`.
