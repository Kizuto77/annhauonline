# 🍻 Nhậu Đêm 134 – Quán nhậu vỉa hè online cho TikTok LIVE

Một quán nhậu vỉa hè Hà Nội vẽ kiểu tranh chi tiết (đèn vàng, bạt đỏ, ghế nhựa, bếp than) chạy làm nguồn **Link** trong TikTok LIVE Studio. Người xem comment, follow, tặng quà là quán phản ứng ngay; chủ quán đứng bếp, nói bằng giọng AI và tự bưng món ra bàn.

Đây là bản làm lại từ đầu. Bản cũ (kiểu hoạt hình, có vòng quay, mưa bọt bia, mini game…) vẫn còn ở nhánh `ban-cu-hoat-hinh`.

## Quán có gì

- **Ngồi bàn như thật:** follow, chat **“nhậu”** hoặc tặng quà là có ghế: khách đi bộ từ ngoài đường vào, ngồi ghế nhựa quanh **8 bàn, mỗi bàn 6 chỗ (48 ghế)** — hai người ngồi sau bàn, hai người hai đầu bàn, hai người phía trước quay lưng ra ống kính như ảnh quán nhậu thật. Trên đầu mỗi khách hiện **tên và ảnh đại diện TikTok**. Chat **“bàn 3”** để đổi bàn. TikTok không báo ai rời live, nên ai im lặng quá lâu (mặc định 10 phút) tự đứng dậy đi về.
- **Gọi món miễn phí (phải vào bàn đã):** ngồi xuống rồi comment tên món bình dân (đậu lạc, đậu tẩm hành, nem chua, khoai chiên, dưa chuột, trứng lộn, bia hơi, trà đá…). Ai chưa có ghế mà gọi món thì chủ quán nhắc chat “nhậu” vào bàn trước. Phiếu order treo dưới mép bạt, bếp bùng lửa, chủ quán nấu xong tự bưng mâm ra tận bàn. Đông khách thì có chạy bàn phụ.
- **Gọi lặt vặt như quán thật:** comment **đá**, **khăn lạnh**, **chén đũa**, **tăm**, **giấy ăn**, **chanh ớt**, **nước mắm** là chạy bàn mang ra ngay, không phải chờ bếp, gọi song song với món ăn luôn.
- **Hết phiên live là quán dọn hàng:** tắt live (hoặc bấm Ngắt kết nối) thì cả quán đứng dậy khỏi bàn, đi bộ ra đường, bàn được dọn sạch, chủ quán chào tạm biệt. Live lại là khách quen về chỗ.
- **3 khách quen** của quán ngồi sẵn cho đỡ trống: chú Tư với anh Hùng ngồi chung một bàn, chị Lan ngồi bàn riêng. 45 ghế còn lại để dành cho người xem thật; khách quen nhường ghế khi hết chỗ.
- **Quà theo số xu mỗi quà** (không cần tên quà, chỉnh được trong admin):
  - từ **1 xu**: một món ngon ngẫu nhiên (mực nướng, ốc hương, gà nướng…)
  - từ **5 xu**: một nồi lẩu ngẫu nhiên, sôi bốc khói trên bếp ga mini
  - từ **30 xu**: **đập quán** (bàn lật, ly vỡ, chủ quán khóc rồi dọn)
  - từ **99 xu**: **bao cả quán**, mỗi bàn có người một nồi lẩu
- **Chủ quán nói chuyện:** đọc to từng comment rồi đáp kiểu bựa (hoặc hiền), chào khách, cảm ơn follow, quà, tự bắt chuyện khi live im. Gõ **dzô** là cả bàn nâng ly; 4 người cùng dzô trong 15 giây thì cả quán dzô.
- **Bảng vàng** (TOP người comment, tặng quà), **bảng thực đơn** tự ghi các mốc quà, **bảng LED** chạy chữ (luật quán, người mới vào, quà, nhắc uống có trách nhiệm).
- **Giọng đọc:** Microsoft (Hoài My, Nam Minh), Google, **FPT.AI** (Ban Mai, Thu Minh, Mỹ An, Lê Minh, Gia Huy…) và **Zalo AI**. FPT.AI và Zalo AI cần API key nhập trong admin. Chủ quán là chị hay anh tự đổi theo giọng.
- **Không khí:** xe máy chạy ngang có đèn pha, khói bếp, khói lẩu, bóng đèn chập chờn, nhạc nền quán nhậu, tiếng quán ồn ào, ly chạm.

## Cần có

- Máy tính có [Node.js](https://nodejs.org) bản LTS (từ 18 trở lên).
- TikTok LIVE Studio, đăng nhập tài khoản sẽ live.
- Internet: giọng đọc, font chữ và tên miền `lvh.me` đều cần mạng.

## Cài và chạy

1. Giải nén thư mục này ra một chỗ cố định.
2. **Windows:** bấm đúp `BAT-LIVE.bat`. Lần đầu nó tự cài 2 thư viện (khoảng 1 phút), sau đó mở trang admin `http://localhost:3000`.
   **Mac/Linux:** mở Terminal trong thư mục, chạy `npm install` rồi `npm start`.
3. Tab **Giọng đọc**: chọn giọng, bấm ▶ nghe thử. Muốn giọng FPT.AI / Zalo AI thì dán API key vào ô bên dưới rồi chọn giọng.
4. Tab **Thử không cần live** để xem trước mọi thứ.
5. Trong TikTok LIVE Studio, thêm nguồn **Link**: `http://lvh.me:3000/?view=stage`, kích thước 1080 × 1920.
6. Bấm **Xóa bảng vàng** (xóa điểm của khách giả), bắt đầu live, nhập username TikTok và bấm **Kết nối**.

Giữ cửa sổ đen (BAT) mở suốt buổi live; đóng nó là tắt quán.

### Lấy API key giọng AI

- **FPT.AI:** vào console.fpt.ai, đăng ký, mở Text to Speech, chép API key.
- **Zalo AI:** vào zalo.ai, đăng nhập, vào Dashboard, chép API key.

Khóa chỉ lưu trong `settings.json` trên máy bạn (file này không đưa lên GitHub), không gửi xuống trang sân khấu.

### Lưu ý khi live

- Chỉ trang `?view=stage` phát tiếng. Trang admin và khung xem trước luôn im lặng. Đừng mở thêm link stage ở trình duyệt khác trong lúc live, nếu không sẽ nghe hai giọng.
- Nếu trang stage hiện nút **"Bấm vào đây để bật tiếng quán"**, trình duyệt đang chặn âm thanh: bấm nút đó (hoặc "Bật tiếng stage" trong admin).
- Sửa `server.js` thì phải tắt mở lại BAT; sửa giao diện thì chỉ cần làm mới nguồn Link.
- App chỉ nhận kết nối từ chính máy đang chạy nó. `lvh.me` là tên miền công khai trỏ về 127.0.0.1; app dùng nó vì LIVE Studio không nhận `localhost`.
- **Hình lên live bị mờ:** nguồn Link phải đặt đúng **1080 × 1920** và không kéo to/thu nhỏ trong khung hình (kéo nguồn nhỏ cho to ra là mờ). Chọn độ phân giải **1080p** và bitrate cao nhất máy chịu được: cảnh quán tối nhiều đèn, bitrate thấp là nhòe.

## Sửa lỗi thường gặp

- **Không vào được `localhost:3000`:** cửa sổ BAT phải có dòng `Nhậu Đêm 134 đang chạy`. Nếu báo lỗi cài thư viện, xóa thư mục `node_modules` rồi chạy lại BAT.
- **LIVE Studio không hiện gì với link `lvh.me`:** mở Notepad bằng quyền Administrator, mở `C:\Windows\System32\drivers\etc\hosts`, thêm dòng `127.0.0.1 lvh.me`, lưu, rồi làm mới nguồn Link.
- **Báo cổng 3000 đang bị dùng:** đóng cửa sổ BAT cũ rồi chạy lại.
- **Không nghe giọng FPT.AI / Zalo AI:** bấm ▶ trong admin, lỗi thật sẽ hiện ra (sai key, hết lượt miễn phí, mất mạng). Câu nào lỗi sẽ được bỏ qua, quán không đổi sang giọng khác giữa chừng.

## Phụ thuộc bên ngoài cần biết

- **Sự kiện TikTok** dùng thư viện không chính thức [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector); TikTok có thể thay đổi làm nó ngừng chạy.
- **Giọng đọc:** `msedge-tts` và Google Dịch không phải API chính thức cho việc này; FPT.AI và Zalo AI là API chính thức, tính lượt theo tài khoản của bạn.
- **Luật của TikTok** về rượu bia, live tự động và kêu gọi tặng quà có thể thay đổi; người dùng tự chịu trách nhiệm tuân thủ. Quán không dùng tên hay logo hãng bia thật nào, quà chỉ đổi lấy lời cảm ơn và món ảo.

## Cấu trúc code

| File | Làm gì |
|---|---|
| `server.js` | Server Node thuần: phát file, nhận sự kiện TikTok, bảng vàng, cài đặt, SSE `/api/events`, `/api/tts` |
| `pub.js` | Hiểu comment gọi món / “nhậu” / “bàn N”, hàng chờ của bếp |
| `tts.js` | Giọng đọc: Microsoft, Google, FPT.AI, Zalo AI |
| `public/js/stage.js` | Sân khấu: ghế ngồi, khách đi vào/ra, bếp, bưng món, quà, đập quán, bao quán, bảng, LED |
| `public/js/art/scene.js` | Mặt tiền quán, bếp, lớp viền tối và hạt kiểu tranh |
| `public/js/art/people.js` | Người tỉ lệ thật (ngồi, đứng, đi, bưng mâm), bàn ghế nhựa, món ăn |
| `public/js/art/layout.js` | Vị trí 8 bàn, 48 ghế (6 ghế một bàn), độ xa gần |
| `public/js/menu.js` | Thực đơn: món miễn phí, món ngon, lẩu |
| `public/js/lines.js`, `bua.js`, `order-lines.js` | Câu chủ quán nói |
| `public/js/chat.js`, `names.js`, `text.js` | Hiểu comment, đọc tên, lọc chữ |
| `public/js/sound.js`, `effects.js` | Hàng chờ giọng đọc (có chống kẹt), âm thanh, hiệu ứng |
| `public/js/dashboard.js` | Trang admin |

Kiểm tra kiểu: `npm run check`.

## Tài nguyên

- `public/assets/audio/quan_nhau.mp3`: nhạc nền quán nhậu, tự tổng hợp bằng `tools/nhac-nhau.py`.
- `public/assets/audio/chill_relax.mp3`: nhạc chill, lấy từ dự án gốc.
- `public/assets/audio/dzo1..3.mp3`: tiếng hai cốc bia hơi cụng nhau, tự tổng hợp bằng `tools/tieng-dzo.py`.
- Mọi hình ảnh đều vẽ bằng code trong repo này.

## Giấy phép

MIT, xem `LICENSE`.
