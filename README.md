# 🍺 Xỉn Bia – Quán nhậu online cho TikTok LIVE

Sân khấu tương tác dọc 9:16 chạy cùng TikTok LIVE Studio. Bối cảnh là một quán nhậu vỉa hè buổi tối: bảng neon, bạt sọc, dây đèn, tủ mát, quầy bia hơi, bàn inox ghế nhựa. Người xem vào live là có nhân vật mang tên TikTok ngồi vào bàn. Gõ `dzo` là nâng ly cụng. Tặng quà thì nhân viên bưng mồi hoặc tháp bia ra bàn người đó, máy quay áp sát vào bàn, và chị (hoặc anh) chủ quán gọi tên cảm ơn.

Đây là **quán ảo để giải trí**: không bán rượu bia, không khuyến khích uống thật. Trên màn hình luôn chạy dòng nhắc: quà tặng chỉ để nhận lời chúc, đã uống rượu bia không lái xe, người dưới 18 tuổi không uống rượu bia. Chủ quán cũng thỉnh thoảng nhắc uống có chừng.

## Tính năng

- **Khách vào ngồi bàn.** Người mới vào live tự đi vào và kéo ghế ngồi. Ai comment hoặc gõ từ khóa mà quán đã đầy thì được ngồi thế chỗ người im lâu nhất.
- **Cụng ly.** Gõ `dzo` (hoặc "Dzô", "zô"...; từ khóa đổi được) là nhân vật nâng ly, cả bàn cụng theo, có tiếng ly chạm. Từ 4 người cùng gõ trong 15 giây thì **cả quán "Một, hai, ba, DZÔ!"**.
- **Tặng quà.**
  - Quà nhỏ: thêm một vòng ly.
  - Từ 10 xu: một đĩa mồi.
  - Từ 99 xu: tháp bia, pháo giấy và chớp vàng.
  - Từ 500 xu: lẩu, tháp bia, và cả quán đứng dậy dzô.

  Nhân viên bưng mâm tận bàn, máy quay áp sát người tặng 6 giây, chủ quán đọc tên cảm ơn kèm một câu chúc. Một combo chỉ cảm ơn một lần.
- **Bàn VIP.** 6 người đứng đầu bảng **TOP CHIẾN HỮU** ngồi bàn VIP trên bục đỏ, có số thứ hạng. Điểm: 1 comment = 1 điểm, 1 xu quà = 10 điểm. Điểm lưu ở server nên tải lại trang không bị mất.
- **Thanh tim.**
  - Đủ 666 tim: **mưa bọt bia** 1 phút.
  - Đủ 99 tim: **vòng quay mồi** quay ra một món nhậu (30 món), món đó được dọn lên các bàn và chủ quán đọc tên món.
- **Chủ quán biết đáp comment:** sinh nhật, buồn hoặc thất tình, mệt, say (khuyên uống nước, đừng lái xe), đòi mồi, chào về. Comment không bao giờ bị đọc nguyên văn, nên không ai bắt được giọng đọc nói bậy.
- **Giọng đọc 2 lựa chọn:** chị chủ quán (Hoài My) hoặc anh chủ quán (Nam Minh). Nhân vật sau quầy đổi theo, và mấp máy miệng khi đang nói.
- **Âm thanh:** nhạc nền chill, tiếng quán ồn ào, tiếng ly chạm, tiếng mở nắp chai, tiếng vòng quay. Toàn bộ hiệu ứng tự tổng hợp nên không cần file âm thanh.
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

Kiểm tra kiểu: `npm run check`.

## Tài nguyên

- `public/assets/audio/chill_relax.mp3`: nhạc nền, lấy từ dự án gốc (tạo bằng mô hình AI ACE-Step). Muốn đổi thì thay file, giữ nguyên tên.
- Mọi hình ảnh (quán, nhân vật, bàn ghế, hiệu ứng) đều vẽ bằng code trong repo này.

## Giấy phép

MIT, xem `LICENSE`.
