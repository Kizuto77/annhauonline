// @ts-check
// Bảng điều khiển admin (http://localhost:3000). Im lặng: mọi tiếng phát trên trang stage trong TikTok LIVE Studio.
import { listen, post } from './api.js';
import { DISHES } from './dishes.js';

const app = /** @type {HTMLElement} */ (document.getElementById('app'));
app.className = 'dash';
const port = location.port || '3000';
const STAGE_URL = `http://lvh.me:${port}/?view=stage`;

const TABS = [
  ['home', '📊', 'Tổng quan'],
  ['control', '🎛', 'Điều khiển'],
  ['gift', '🎁', 'Quà & Đập quán'],
  ['voice', '🎙', 'Giọng & Âm thanh'],
  ['look', '🏮', 'Giao diện quán'],
  ['lab', '🧪', 'Thử nghiệm'],
];

app.innerHTML = `
<aside class="side">
  <div class="brand"><span class="logo">🍺</span><div><h1 id="title">Xỉn Bia</h1><p>Admin quán nhậu online</p></div></div>
  <nav id="nav">${TABS.map(([id, ico, name]) => `<a href="#${id}" data-tab="${id}"><i>${ico}</i><span>${name}</span></a>`).join('')}</nav>
  <div class="side-foot">
    <div class="dot-row"><span class="dot" id="d-stage"></span><span id="t-stage">Stage: chưa mở</span></div>
    <div class="dot-row"><span class="dot" id="d-tt"></span><span id="t-tt">TikTok: chưa kết nối</span></div>
    <small>Phiên này: <b id="uptime">0:00</b></small>
  </div>
</aside>

<div class="body">
<header class="top">
  <div><h2 id="page-title">Tổng quan</h2><p id="page-sub">Theo dõi buổi live theo thời gian thực</p></div>
  <div class="top-actions">
    <div class="pill" id="pill">⚪ Chưa kết nối TikTok</div>
    <button class="btn smash" data-control="smash" title="Đập quán thử">💥 Đập quán</button>
    <button class="btn" data-control="wave" title="Cả quán dzô">🍻 Dzô</button>
  </div>
</header>

<main class="grid">
<section class="tabs">

  <!-- ============================================================ TỔNG QUAN -->
  <div class="tab" data-pane="home">
    <div class="warn" id="warn-stage" hidden>⚠️ Chưa có trang <b>stage</b> nào đang mở, nên quán chưa có tiếng và người xem chưa thấy gì. Thêm nguồn Link trong LIVE Studio (xem tab <a href="#control">Điều khiển</a>).</div>
    <div class="kpis">
      <div class="kpi"><small>👁 Người xem</small><b id="k-viewers">0</b><em id="k-viewers-s">chưa kết nối</em></div>
      <div class="kpi"><small>❤️ Tổng tim</small><b id="k-likes">0</b><em id="k-likes-s">cả buổi live</em></div>
      <div class="kpi"><small>🎁 Quà (xu)</small><b id="k-coins">0</b><em id="k-gifts">0 lượt quà</em></div>
      <div class="kpi"><small>💬 Bình luận</small><b id="k-chats">0</b><em id="k-dzo">0 lượt dzô</em></div>
      <div class="kpi"><small>🚶 Khách vào</small><b id="k-joins">0</b><em id="k-follows">0 follow</em></div>
      <div class="kpi hot"><small>💥 Lần đập quán</small><b id="k-smash">0</b><em id="k-smash-s">chưa lần nào</em></div>
    </div>

    <div class="card goals-card">
      <div class="card-head"><h3>🎯 Mục tiêu tim</h3><span class="live-dot" id="g-live">trực tiếp</span></div>
      <div class="goal" id="g-rain-box"><div class="goal-top"><span>🫧 Mưa bọt bia</span><b id="g-rain-t">0/666</b></div><div class="bar"><i id="g-rain"></i></div><small class="goal-sub" id="g-rain-s">còn 666 tim nữa là mưa</small></div>
      <div class="goal" id="g-wheel-box"><div class="goal-top"><span>🎡 Vòng quay món nhậu</span><b id="g-wheel-t">0/99</b></div><div class="bar teal"><i id="g-wheel"></i></div><small class="goal-sub" id="g-wheel-s">còn 99 tim nữa là quay</small></div>
      <div class="goal-stats">
        <div><b id="g-total">0</b><small>tim phiên này</small></div>
        <div><b id="g-pm">0</b><small>tim / phút</small></div>
        <div><b id="g-rains">0</b><small>lần mưa bia</small></div>
        <div><b id="g-wheels">0</b><small>lần quay mồi</small></div>
      </div>
      <details class="goal-set"><summary>⚙️ Đổi mốc tim</summary>
        <div class="grid3">
          <label class="field"><span>Tim để mưa bọt bia</span><div class="row"><input id="s-likeGoal" type="number" min="10" max="1000000" /><button class="btn" data-save="likeGoal">Lưu</button></div></label>
          <label class="field"><span>Mưa kéo dài (giây)</span><div class="row"><input id="s-rainSeconds" type="number" min="10" max="600" /><button class="btn" data-save="rainSeconds">Lưu</button></div></label>
          <label class="field"><span>Tim để quay mồi</span><div class="row"><input id="s-wheelGoal" type="number" min="10" max="1000000" /><button class="btn" data-save="wheelGoal">Lưu</button></div></label>
        </div>
      </details>
    </div>

    <div class="card feed-card">
      <div class="card-head"><h3>📡 Hoạt động trực tiếp</h3>
        <div class="chips" id="chips"><button class="chip on" data-f="all">Tất cả</button><button class="chip" data-f="gift">🎁 Quà</button><button class="chip" data-f="chat">💬 Chat</button><button class="chip" data-f="join">🚶 Vào/follow</button><button class="chip" data-f="fx">✨ Sự kiện</button></div>
      </div>
      <ul class="feed" id="feed"><li class="empty">Chưa có hoạt động. Kết nối TikTok hoặc vào tab Thử nghiệm để tạo khách giả.</li></ul>
    </div>
  </div>

  <!-- ============================================================ ĐIỀU KHIỂN -->
  <div class="tab" data-pane="control" hidden>
    <div class="card">
      <h3>🔴 Kết nối TikTok LIVE</h3>
      <div class="row">
        <label class="input at"><span>@</span><input id="tt-user" placeholder="username TikTok của bạn" autocomplete="off" /></label>
        <button class="btn primary" id="tt-connect">Kết nối</button>
        <button class="btn danger" id="tt-disconnect" hidden>Ngắt kết nối</button>
      </div>
      <p class="err" id="tt-error" hidden></p>
      <p class="note">Bấm <b>Phát trực tiếp</b> trên TikTok (hoặc LIVE Studio) trước, rồi mới bấm Kết nối.</p>
      <div class="mini-stats" id="stats" hidden>
        <div><small>Người xem</small><b id="st-viewers">0</b></div><div><small>Tổng tim</small><b id="st-likes">0</b></div><div><small>Phòng</small><b id="st-room">–</b></div>
      </div>
    </div>

    <div class="card">
      <h3>🎥 Link cho TikTok LIVE Studio</h3>
      <div class="row"><code id="stage-url"></code><button class="btn" id="copy">Sao chép</button><a class="btn" href="/?view=stage" target="_blank" rel="noreferrer">Mở thử</a></div>
      <p class="note">LIVE Studio → Thêm nguồn → <b>Link</b> → dán link → kích thước <b>1080 × 1920</b>. Chỉ trang này phát tiếng; đừng mở thêm link stage ở trình duyệt khác lúc live kẻo nghe hai giọng.</p>
    </div>

    <div class="card">
      <h3>⚡ Lệnh nhanh</h3>
      <div class="row"><textarea id="speak-text" rows="2" placeholder="Câu muốn chủ quán đọc ngay, ví dụ: Cảm ơn cả nhà đã ghé quán tối nay nha!"></textarea><button class="btn primary" id="speak">🔊 Đọc ngay</button></div>
      <div class="tiles">
        <button class="tile" data-control="share"><i>📣</i><b>Nhắc chia sẻ</b><small>Chủ quán xin chia sẻ live</small></button>
        <button class="tile" data-control="wave"><i>🍻</i><b>Cả quán dzô</b><small>Một, hai, ba, dzô!</small></button>
        <button class="tile red" data-control="smash"><i>💥</i><b>Đập quán</b><small>Phá tan rồi chủ quán dọn</small></button>
        <button class="tile" data-control="unlockAudio"><i>🔈</i><b>Bật tiếng stage</b><small>Khi trình duyệt chặn âm</small></button>
        <button class="tile" data-control="clearHall"><i>🧹</i><b>Dọn khách</b><small>Mời khách khỏi bàn</small></button>
        <button class="tile" id="reset-board"><i>♻️</i><b>Xóa bảng TOP</b><small>Làm lại điểm từ đầu</small></button>
      </div>
    </div>
  </div>

  <!-- ============================================================ QUÀ & ĐẬP QUÁN -->
  <div class="tab" data-pane="gift" hidden>
    <div class="card smash-card">
      <h3>💥 Đập quán</h3>
      <p class="note">Khách tặng quà đặc biệt thì cả quán bị đập, chủ quán khóc rồi dọn lại (~15 giây; quà tới trong lúc đó bỏ qua).</p>
      <label class="field switch big"><input type="checkbox" id="s-smashEnabled" /><span><b>Bật đập quán</b></span></label>
      <label class="field"><span>Tên quà sẽ đập quán (tên tiếng Anh như trên TikTok, cách nhau dấu phẩy)</span><div class="row"><input id="s-smashGifts" maxlength="160" placeholder="Doughnut, Cheese Donuts, Bubble Tea, Bouquet Flower" /><button class="btn" data-save="smashGifts">Lưu</button></div></label>
      <label class="field"><span>Hoặc quà có giá từ bao nhiêu xu trở lên (0 = không dùng cách này)</span><div class="row"><input id="s-smashMinCoins" type="number" min="0" max="1000000" /><button class="btn" data-save="smashMinCoins">Lưu</button></div></label>
      <div class="row wrap"><button class="btn smash" data-control="smash">💥 Thử đập quán ngay</button></div>
    </div>
    <div class="card">
      <h3>🍢 Quà lên mồi</h3>
      <p class="note">Mỗi quà tặng 1 cái là một dĩa mồi ra bàn người tặng (tặng 5 cái thì 5 dĩa, tối đa 8). Mỗi dòng một món: <b>tên quà (cách nhau dấu phẩy) = tên món</b>. Tên món trùng thực đơn thì có hình đẹp, gõ tên khác vẫn được.</p>
      <label class="field"><span>Danh sách quà → mồi</span><textarea id="s-giftFoods" rows="6" maxlength="1200" spellcheck="false"></textarea></label>
      <div class="row wrap"><button class="btn primary" id="save-giftFoods">Lưu</button><button class="btn" data-demo="giftFood">🍢 Thử quà lên mồi</button></div>
      <p class="note" id="menu-names"></p>
    </div>
    <div class="card">
      <h3>🔑 Từ khóa cụng ly</h3>
      <label class="field"><span>Comment có một trong các từ này là khách nâng ly. Cách nhau dấu phẩy, từ đầu tiên hiện trên bảng hiệu. Từ 3 chữ cái trở lên (dzo) không phân biệt dấu; từ ngắn (dô, zo) phải gõ đứng riêng và đúng dấu, để "do" không bắt nhầm "đó", "đồ". 4 người cùng gõ trong 15 giây thì cả quán dzô.</span><div class="row"><input id="s-keyword" maxlength="120" placeholder="dzô, dzo, dô, zô, do, zo" /><button class="btn" data-save="keyword">Lưu</button></div></label>
    </div>
    <div class="card">
      <h3>🏆 Bảng xếp hạng</h3>
      <div class="grid2">
        <label class="field"><span>Tên bảng</span><div class="row"><input id="s-boardTitle" maxlength="24" /><button class="btn" data-save="boardTitle">Lưu</button></div></label>
        <label class="field switch"><input type="checkbox" id="s-showBoard" /><span>Hiện bảng TOP trên sân khấu</span></label>
      </div>
      <ol class="rank" id="rank"><li class="empty">Chưa có ai trên bảng</li></ol>
    </div>
  </div>

  <!-- ============================================================ GIỌNG & ÂM THANH -->
  <div class="tab" data-pane="voice" hidden>
    <div class="card">
      <h3>🎙 Giọng chủ quán</h3>
      <div class="grid2">
        <label class="field switch"><input type="checkbox" id="s-autoVoice" /><span><b>Tự động đọc</b> (tắt là chủ quán im, trừ “Đọc ngay”)</span></label>
        <label class="field switch"><input type="checkbox" id="s-greet" /><span>Chào khách mới vào</span></label>
        <label class="field switch"><input type="checkbox" id="s-chatReply" /><span>Đáp comment (sinh nhật, buồn, say, đòi mồi, chào về)</span></label>
        <label class="field switch"><input type="checkbox" id="s-readChat" /><span><b>Đọc to từng comment</b> rồi đáp (bỏ qua từ tục, link, số điện thoại; chat nhanh quá thì đọc những câu mới nhất)</span></label>
        <label class="field switch"><input type="checkbox" id="s-idleTalk" /><span>Live im lâu thì tự nói chuyện, nhắc chia sẻ</span></label>
        <label class="field switch"><input type="checkbox" id="s-stories" /><span><b>Tự kể chuyện</b> (chuyện quán, chuyện cười, đố vui, nhắc thả tim / chia sẻ / quà)</span></label>
      </div>
      <label class="field"><span>Cứ bao nhiêu phút kể một lần: <b id="story-val"></b></span><input type="range" id="s-storyEvery" min="1" max="15" step="1" /></label>
      <div class="row wrap"><button class="btn primary" data-control="story">📖 Kể chuyện ngay</button></div>
      <div class="row wrap">
        <span class="lbl">Kiểu trả lời comment:</span>
        <button class="btn seg" data-style="bua">😜 Bựa, lầy lội</button>
        <button class="btn seg" data-style="hien">😊 Hiền, lịch sự</button>
      </div>
      <span class="lbl">Chọn giọng (bấm ▶ để nghe thử ở đây, bấm tên để dùng):</span>
      <div class="voices" id="voices"></div>
      <label class="field"><span>Tốc độ đọc: <b id="rate-val"></b></span><input type="range" id="s-rate" min="0.7" max="1.3" step="0.05" /></label>
      <div class="row wrap">
        <span class="lbl">Nghe thử trên stage:</span>
        <button class="btn" data-control="testGift">Cảm ơn quà</button>
        <button class="btn" data-control="testGreet">Chào khách</button>
        <button class="btn" data-control="testFollow">Cảm ơn follow</button>
        <button class="btn" data-control="testChat">Chúc sinh nhật</button>
        <button class="btn" id="listen-here">🎧 Nghe ở máy này</button>
      </div>
    </div>
    <div class="card">
      <h3>🎵 Nhạc &amp; không khí</h3>
      <div class="grid2">
        <label class="field switch"><input type="checkbox" id="s-music" /><span>Bật nhạc nền</span></label>
        <label class="field switch"><input type="checkbox" id="s-ambience" /><span>Tiếng quán ồn ào, ly chạm lách cách</span></label>
      </div>
      <span class="lbl">Bài nhạc (bấm ▶ để nghe thử ở đây):</span>
      <div class="voices tracks">
        <div class="voice" data-track="nhau"><button class="pick" data-pick-track="nhau"><i>🍻</i><span><b>Quán nhậu Việt</b><small>Đàn tranh, đàn bầu, mõ, nhịp remix quán</small></span></button><button class="play" data-play-track="/assets/audio/quan_nhau.mp3" title="Nghe thử">▶</button></div>
        <div class="voice" data-track="chill"><button class="pick" data-pick-track="chill"><i>🌙</i><span><b>Chill nhẹ nhàng</b><small>Nhạc chill êm, nói chuyện dễ nghe</small></span></button><button class="play" data-play-track="/assets/audio/chill_relax.mp3" title="Nghe thử">▶</button></div>
      </div>
      <label class="field"><span>Âm lượng nhạc nền: <b id="vol-val"></b></span><input type="range" id="s-musicVolume" min="0" max="1" step="0.05" /></label>
    </div>
  </div>

  <!-- ============================================================ GIAO DIỆN -->
  <div class="tab" data-pane="look" hidden>
    <div class="card">
      <h3>🏮 Tên quán</h3>
      <label class="field"><span>Hiện trên bảng neon và là tên chủ quán xưng khi nói</span><div class="row"><input id="s-channelName" maxlength="40" /><button class="btn" data-save="channelName">Lưu</button></div></label>
    </div>
    <div class="card">
      <h3>🖼 Ảnh nền riêng</h3>
      <p class="note">JPG/PNG/WebP, tối đa 15 MB, ảnh dọc 9:16. Bỏ trống thì dùng cảnh quán vẽ sẵn.</p>
      <div class="row wrap"><input type="file" id="bg-file" accept="image/jpeg,image/png,image/webp" hidden /><button class="btn" id="bg-pick">Chọn ảnh…</button><button class="btn" id="bg-reset">Dùng cảnh vẽ sẵn</button><small id="bg-state"></small></div>
    </div>
  </div>

  <!-- ============================================================ THỬ NGHIỆM -->
  <div class="tab" data-pane="lab" hidden>
    <div class="card">
      <h3>🧪 Thử không cần live</h3>
      <p class="note">Tạo khách giả để xem hiệu ứng và nghe giọng. Điểm của khách giả vào bảng TOP như thật; nhớ <b>Xóa bảng TOP</b> trước khi live.</p>
      <div class="tiles">
        <button class="tile" data-demo="join"><i>🚶</i><b>Khách vào</b></button>
        <button class="tile" data-demo="chat"><i>💬</i><b>Comment</b></button>
        <button class="tile" data-demo="dzo"><i>🍻</i><b>Gõ dzô</b></button>
        <button class="tile" data-demo="crowd"><i>👥</i><b>Quán đông</b><small>12 người</small></button>
        <button class="tile" data-demo="gift"><i>🌹</i><b>Quà nhỏ</b></button>
        <button class="tile" data-demo="bigGift"><i>💎</i><b>Quà lớn</b></button>
        <button class="tile" data-demo="follow"><i>❤️</i><b>Follow</b></button>
        <button class="tile red" data-demo="smash"><i>💥</i><b>Đập quán</b></button>
        <button class="tile" data-demo="likes99"><i>🎡</i><b>+99 tim</b></button>
        <button class="tile" data-demo="likes666"><i>🫧</i><b>+666 tim</b></button>
      </div>
    </div>
  </div>
</section>

<aside class="preview-col">
  <div class="card preview-card">
    <div class="card-head"><h3>👀 Xem trước sân khấu</h3><small>không tiếng</small></div>
    <div class="preview-frame"><iframe id="preview" src="/?view=stage&preview=1" title="Xem trước sân khấu"></iframe></div>
  </div>
</aside>
</main>
</div>
<div class="toasts" id="toasts"></div>
`;

const $ = (/** @type {string} */ id) => /** @type {any} */ (document.getElementById(id));
const fmt = (/** @type {number} */ n) => Number(n || 0).toLocaleString('vi-VN');
const esc = (/** @type {string} */ s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c);

// ---------------------------------------------------------------- toast
function toast(/** @type {string} */ text, ok = true) {
  const t = document.createElement('div');
  t.className = `toast ${ok ? 'ok' : 'bad'}`;
  t.textContent = (ok ? '✓ ' : '⚠ ') + text;
  $('toasts').appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}
const status = toast;

// ---------------------------------------------------------------- tabs
const TITLES = {
  home: 'Theo dõi buổi live theo thời gian thực',
  control: 'Kết nối TikTok, link stage và các lệnh nhanh',
  gift: 'Quà tặng, đập quán, từ khóa và bảng xếp hạng',
  voice: 'Giọng đọc, nhạc nền và không khí quán',
  look: 'Tên quán và ảnh nền',
  lab: 'Tạo khách giả để thử hiệu ứng',
};
function showTab() {
  const id = TABS.some((t) => t[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'home';
  for (const p of document.querySelectorAll('[data-pane]')) /** @type {HTMLElement} */ (p).hidden = /** @type {HTMLElement} */ (p).dataset.pane !== id;
  for (const a of document.querySelectorAll('#nav a')) a.classList.toggle('on', /** @type {HTMLElement} */ (a).dataset.tab === id);
  $('page-title').textContent = TABS.find((t) => t[0] === id)?.[2] || '';
  $('page-sub').textContent = /** @type {any} */ (TITLES)[id];
}
addEventListener('hashchange', showTab);
showTab();

// ---------------------------------------------------------------- uptime
const t0 = Date.now();
setInterval(() => {
  const s = Math.floor((Date.now() - t0) / 1000);
  $('uptime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}, 1000);

$('stage-url').textContent = STAGE_URL;
$('copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(STAGE_URL);
    toast('Đã chép link stage');
  } catch {
    toast('Chép tay giúp nhé', false);
  }
};

// ---------------------------------------------------------------- settings
/** @type {any} */
let settings = {};
const saveSetting = async (/** @type {string} */ key, /** @type {unknown} */ value) => {
  const r = await post('/api/settings', { [key]: value });
  if (!r.success) toast(r.error || 'Lưu không được', false);
  else toast('Đã lưu');
};
for (const b of document.querySelectorAll('[data-save]')) {
  const key = /** @type {HTMLElement} */ (b).dataset.save || '';
  const input = $(`s-${key}`);
  const save = () => input.value.trim() && saveSetting(key, input.value.trim());
  /** @type {HTMLElement} */ (b).onclick = (e) => {
    e.preventDefault();
    save();
  };
  input.onkeydown = (/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && save();
}
$('menu-names').textContent = `Món có sẵn: ${DISHES.map((d) => d.ten).join(', ')}.`;
$('save-giftFoods').onclick = () => saveSetting('giftFoods', $('s-giftFoods').value);
for (const b of document.querySelectorAll('[data-style]')) /** @type {HTMLElement} */ (b).onclick = () => saveSetting('replyStyle', /** @type {HTMLElement} */ (b).dataset.style);
const SWITCHES = ['showBoard', 'autoVoice', 'greet', 'chatReply', 'readChat', 'idleTalk', 'music', 'ambience', 'smashEnabled', 'stories'];
for (const key of SWITCHES) $(`s-${key}`).onchange = (/** @type {Event} */ e) => saveSetting(key, /** @type {HTMLInputElement} */ (e.target).checked);
for (const key of ['rate', 'musicVolume', 'storyEvery']) {
  const input = $(`s-${key}`);
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let t;
  input.oninput = () => {
    showRanges(Number(key === 'rate' ? input.value : $('s-rate').value), Number(key === 'musicVolume' ? input.value : $('s-musicVolume').value));
    $('story-val').textContent = `${$('s-storyEvery').value} phút`;
    clearTimeout(t);
    t = setTimeout(() => saveSetting(key, Number(input.value)), 250);
  };
}
const VOICE_LIST = [
  ['female', '👩', 'Chị chủ quán', 'Hoài My · vui vẻ, rõ ràng'],
  ['female_cute', '👧', 'Em gái nhí nhảnh', 'Hoài My · cao, nhanh, dễ thương'],
  ['female_soft', '🌸', 'Cô chủ dịu dàng', 'Hoài My · nhẹ, chậm, ấm'],
  ['female_news', '📻', 'Chị phát thanh', 'Hoài My · đều, rõ từng chữ'],
  ['male', '👨', 'Anh chủ quán', 'Nam Minh · trầm ấm'],
  ['male_deep', '🧔', 'Anh trầm chậm', 'Nam Minh · trầm, chậm rãi'],
  ['male_hype', '🎤', 'MC sôi động', 'Nam Minh · cao, nhanh, hào hứng'],
  ['google', '🤖', 'Giọng Google', 'Giọng chị Google quen thuộc'],
];
$('voices').innerHTML = VOICE_LIST.map(([id, ic, name, desc]) => `<div class="voice" data-v="${id}"><button class="pick" data-voice="${id}"><i>${ic}</i><span><b>${name}</b><small>${desc}</small></span></button><button class="play" data-play="${id}" title="Nghe thử">▶</button></div>`).join('');
for (const b of document.querySelectorAll('[data-voice]')) /** @type {HTMLElement} */ (b).onclick = () => saveSetting('voice', /** @type {HTMLElement} */ (b).dataset.voice);
for (const b of document.querySelectorAll('[data-pick-track]')) /** @type {HTMLElement} */ (b).onclick = () => saveSetting('musicTrack', /** @type {HTMLElement} */ (b).dataset.pickTrack);
for (const b of document.querySelectorAll('[data-play-track]')) {
  /** @type {HTMLElement} */ (b).onclick = () => {
    const src = /** @type {HTMLElement} */ (b).dataset.playTrack || '';
    // a second click on the same track stops it
    if (sample && !sample.paused && sample.src.endsWith(src)) return sample.pause();
    sample?.pause();
    sample = new Audio(src);
    sample.volume = 0.6;
    sample.play().catch(() => toast('Không phát được, thử lại sau', false));
  };
}
for (const b of document.querySelectorAll('[data-play]')) /** @type {HTMLElement} */ (b).onclick = () => playSample(/** @type {HTMLElement} */ (b).dataset.play || 'female');

const showRanges = (/** @type {number} */ rate, /** @type {number} */ vol) => {
  $('rate-val').textContent = `${rate.toFixed(2)}x`;
  $('vol-val').textContent = `${Math.round(vol * 100)}%`;
};

function applySettings(/** @type {any} */ s) {
  settings = s;
  $('title').textContent = s.channelName;
  document.title = `${s.channelName} · Admin`;
  const foodBox = $('s-giftFoods');
if (document.activeElement !== foodBox) foodBox.value = s.giftFoods ?? '';
  for (const key of ['channelName', 'keyword', 'boardTitle', 'smashGifts', 'smashMinCoins', 'likeGoal', 'rainSeconds', 'wheelGoal']) {
    const input = $(`s-${key}`);
    if (document.activeElement !== input) input.value = s[key];
  }
  for (const key of SWITCHES) $(`s-${key}`).checked = Boolean(s[key]);
  for (const key of ['greet', 'chatReply', 'idleTalk', 'readChat']) $(`s-${key}`).closest('label').classList.toggle('dim', !s.autoVoice);
  for (const b of document.querySelectorAll('[data-style]')) b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.style === (s.replyStyle || 'bua'));
  $('s-rate').value = s.rate;
  $('s-musicVolume').value = s.musicVolume;
  $('s-storyEvery').value = s.storyEvery;
  $('story-val').textContent = `${s.storyEvery} phút`;
  showRanges(s.rate, s.musicVolume);
  for (const b of document.querySelectorAll('.voice[data-v]')) b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.v === s.voice);
  for (const b of document.querySelectorAll('.voice[data-track]')) b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.track === (s.musicTrack || 'nhau'));
  $('bg-state').textContent = s.background ? 'Đang dùng ảnh của bạn' : 'Đang dùng cảnh quán vẽ sẵn';
  $('bg-reset').disabled = !s.background;
}

// ---------------------------------------------------------------- background image
$('bg-pick').onclick = () => $('bg-file').click();
$('bg-file').onchange = async () => {
  const file = /** @type {File | undefined} */ ($('bg-file').files?.[0]);
  $('bg-file').value = '';
  if (!file) return;
  if (file.size > 15 * 1024 * 1024) return toast('Ảnh quá 15 MB', false);
  toast('Đang tải ảnh…');
  try {
    const res = await fetch('/api/background', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    const r = await res.json();
    if (r.success) toast('Đã đổi ảnh nền');
    else toast(r.error || 'Không tải được ảnh', false);
  } catch {
    toast('Không tải được ảnh', false);
  }
};
$('bg-reset').onclick = async () => {
  const r = await post('/api/background/reset');
  toast(r.success ? 'Đã về cảnh vẽ sẵn' : r.error, r.success);
};

// ---------------------------------------------------------------- controls and tests
$('speak').onclick = async () => {
  const text = $('speak-text').value.trim();
  if (!text) return;
  const r = await post('/api/control', { action: 'speak', text });
  if (r.success) {
    $('speak-text').value = '';
    toast(r.stages ? 'Đã gửi tới trang stage' : 'Đã gửi, nhưng chưa có trang stage nào mở', Boolean(r.stages));
  } else toast(r.error, false);
};
for (const b of document.querySelectorAll('[data-control]')) {
  /** @type {HTMLElement} */ (b).onclick = async () => {
    const action = /** @type {HTMLElement} */ (b).dataset.control;
    const r = await post('/api/control', { action });
    if (!r.success) return toast(r.error || 'Lỗi', false);
    const needsStage = action !== 'wave';
    toast(!needsStage || r.stages ? 'Đã gửi' : 'Đã gửi, nhưng chưa có trang stage nào mở', !needsStage || Boolean(r.stages));
  };
}
for (const b of document.querySelectorAll('[data-demo]')) {
  /** @type {HTMLElement} */ (b).onclick = async () => {
    const r = await post('/api/demo', { type: /** @type {HTMLElement} */ (b).dataset.demo });
    if (!r.success) toast(r.error || 'Lỗi', false);
  };
}
$('reset-board').onclick = async () => {
  if (!confirm('Xóa toàn bộ điểm trên bảng TOP?')) return;
  const r = await post('/api/board/reset');
  toast(r.success ? 'Đã xóa bảng TOP' : r.error, r.success);
};
let sample = /** @type {HTMLAudioElement | null} */ (null);
const playSample = (/** @type {string} */ voice) => {
  sample?.pause();
  const text = `${settings.channelName || 'Xỉn Bia'} chào bạn Minh An mới ghé quán. Kéo ghế ngồi chơi, cả quán dzô một cái nào!`;
  sample = new Audio(`/api/tts?voice=${voice}&rate=${settings.rate}&text=${encodeURIComponent(text)}`);
  sample.play().catch(() => toast('Không phát được, thử lại sau', false));
};
$('listen-here').onclick = () => playSample(settings.voice);

// ---------------------------------------------------------------- TikTok
$('tt-connect').onclick = async () => {
  const username = $('tt-user').value.trim().replace(/^@/, '');
  if (!username) return $('tt-user').focus();
  localStorage.setItem('xb-user', username);
  $('tt-connect').disabled = true;
  $('tt-connect').textContent = 'Đang kết nối…';
  const r = await post('/api/tiktok/connect', { username });
  $('tt-connect').disabled = false;
  $('tt-connect').textContent = 'Kết nối';
  if (!r.success) showError(r.error);
};
$('tt-disconnect').onclick = () => post('/api/tiktok/disconnect');
try {
  $('tt-user').value = localStorage.getItem('xb-user') || '';
} catch {
  // storage blocked: just type it again
}
const showError = (/** @type {string} */ msg) => {
  $('tt-error').textContent = msg || '';
  $('tt-error').hidden = !msg;
};

function applyStatus(/** @type {any} */ s) {
  const pill = $('pill');
  pill.className = `pill ${s.connected ? 'live' : s.connecting ? 'wait' : ''}`;
  pill.textContent = s.connected ? `🟢 Đang nhận LIVE @${s.username}` : s.connecting ? `🟡 Đang kết nối @${s.username}…` : '⚪ Chưa kết nối TikTok';
  $('d-tt').className = `dot ${s.connected ? 'on' : s.connecting ? 'wait' : ''}`;
  $('t-tt').textContent = s.connected ? `TikTok: @${s.username}` : s.connecting ? 'TikTok: đang kết nối…' : 'TikTok: chưa kết nối';
  $('tt-connect').hidden = s.connected;
  $('tt-disconnect').hidden = !s.connected;
  $('stats').hidden = !s.connected;
  $('st-viewers').textContent = fmt(s.viewers);
  $('st-likes').textContent = fmt(s.totalLikes);
  $('st-room').textContent = s.roomId ? `#${String(s.roomId).slice(-6)}` : '–';
  $('k-viewers').textContent = fmt(s.viewers);
  $('k-viewers-s').textContent = s.connected ? `phòng @${s.username}` : 'chưa kết nối';
  tiktokLikes = s.totalLikes || 0;
  showLikes();
  showError(s.error);
  if (s.username && document.activeElement !== $('tt-user') && !$('tt-user').value) $('tt-user').value = s.username;
}

function applyStages(/** @type {number} */ n) {
  $('d-stage').className = `dot ${n === 1 ? 'on' : n > 1 ? 'wait' : ''}`;
  $('t-stage').textContent = n === 0 ? 'Stage: chưa mở' : n === 1 ? 'Stage: đang chạy' : `Stage: ${n} trang (dễ trùng tiếng!)`;
  $('warn-stage').hidden = n > 0;
}

// ---------------------------------------------------------------- live feed and session counters
const count = { gifts: 0, coins: 0, chats: 0, dzo: 0, joins: 0, follows: 0, smash: 0 };
let lastSmash = 0;
const stamp = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
let filter = 'all';
/** @param {string} kind @param {string} html */
function feed(kind, html) {
  const ul = $('feed');
  ul.querySelector('.empty')?.remove();
  const li = document.createElement('li');
  li.className = `ev ${kind}`;
  li.dataset.k = kind === 'chat' || kind === 'dzo' ? 'chat' : kind === 'gift' || kind === 'smash' ? 'gift' : kind === 'join' || kind === 'follow' ? 'join' : 'fx';
  li.hidden = filter !== 'all' && li.dataset.k !== filter;
  li.innerHTML = `<time>${stamp()}</time><span>${html}</span>`;
  ul.prepend(li);
  while (ul.children.length > 120) ul.lastElementChild?.remove();
}
for (const c of document.querySelectorAll('#chips .chip')) {
  /** @type {HTMLElement} */ (c).onclick = () => {
    filter = /** @type {HTMLElement} */ (c).dataset.f || 'all';
    for (const o of document.querySelectorAll('#chips .chip')) o.classList.toggle('on', o === c);
    for (const li of document.querySelectorAll('#feed .ev')) /** @type {HTMLElement} */ (li).hidden = filter !== 'all' && /** @type {HTMLElement} */ (li).dataset.k !== filter;
  };
}
const refreshCounts = () => {
  $('k-coins').textContent = fmt(count.coins);
  $('k-gifts').textContent = `${fmt(count.gifts)} lượt quà`;
  $('k-chats').textContent = fmt(count.chats);
  $('k-dzo').textContent = `${fmt(count.dzo)} lượt dzô`;
  $('k-joins').textContent = fmt(count.joins);
  $('k-follows').textContent = `${fmt(count.follows)} follow`;
  $('k-smash').textContent = fmt(count.smash);
  $('k-smash-s').textContent = lastSmash ? `gần nhất lúc ${new Date(lastSmash).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'chưa lần nào';
};

let tiktokLikes = 0;
/** TikTok's own running total when connected, else the hearts counted since the server started */
const showLikes = () => {
  $('k-likes').textContent = fmt(Math.max(tiktokLikes, lastMeters?.total ?? 0));
  $('k-likes-s').textContent = lastMeters?.perMinute ? `${fmt(lastMeters.perMinute)} tim / phút` : 'cả buổi live';
};
/** @type {any} */
let lastMeters = null;
let rainEndsAt = 0;
const bumpBox = (/** @type {string} */ id) => {
  const b = $(id);
  b.classList.remove('bump');
  void b.offsetWidth;
  b.classList.add('bump');
};
function applyMeters(/** @type {any} */ m) {
  if (lastMeters && (m.likes !== lastMeters.likes || m.rains !== lastMeters.rains)) bumpBox('g-rain-box');
  if (lastMeters && (m.wheel !== lastMeters.wheel || m.wheels !== lastMeters.wheels)) bumpBox('g-wheel-box');
  lastMeters = m;
  rainEndsAt = m.rainLeft > 0 ? Date.now() + m.rainLeft : 0;
  $('g-wheel-t').textContent = `${fmt(m.wheel)}/${fmt(m.wheelGoal)}`;
  $('g-wheel').style.width = `${Math.min(100, (m.wheel / m.wheelGoal) * 100)}%`;
  $('g-wheel-s').textContent = `còn ${fmt(Math.max(0, m.wheelGoal - m.wheel))} tim nữa là quay món mới`;
  $('g-total').textContent = fmt(m.total ?? 0);
  $('g-pm').textContent = fmt(m.perMinute ?? 0);
  $('g-rains').textContent = fmt(m.rains ?? 0);
  $('g-wheels').textContent = fmt(m.wheels ?? 0);
  showLikes();
  showRain();
}
/** The rain part ticks every second on its own, so the countdown runs even when no likes come in */
function showRain() {
  const m = lastMeters;
  if (!m) return;
  const left = Math.max(0, rainEndsAt - Date.now());
  const raining = left > 0;
  $('g-rain-box').classList.toggle('raining', raining);
  $('g-rain-t').textContent = raining ? `🍺 đang mưa · ${Math.ceil(left / 1000)}s` : `${fmt(m.likes)}/${fmt(m.likeGoal)}`;
  $('g-rain').style.width = `${raining ? 100 : Math.min(100, (m.likes / m.likeGoal) * 100)}%`;
  $('g-rain-s').textContent = raining ? `thả thêm tim là mưa lâu hơn (${fmt(m.likes)}/${fmt(m.likeGoal)} cho trận sau)` : `còn ${fmt(Math.max(0, m.likeGoal - m.likes))} tim nữa là mưa bọt bia`;
}
setInterval(showRain, 1000);

function renderRank(/** @type {any[]} */ top) {
  const ol = $('rank');
  ol.innerHTML = top.length
    ? top.map((u, i) => `<li><b class="n n${i + 1}">${i + 1}</b><span class="nm">${esc(u.name)}</span><em>${fmt(u.score)} điểm${u.coins ? ` · ${fmt(u.coins)} xu` : ''}</em></li>`).join('')
    : '<li class="empty">Chưa có ai trên bảng</li>';
}

listen({
  hello: (snap) => {
    applySettings(snap.settings);
    applyStatus(snap.status);
    applyStages(snap.stages || 0);
    applyMeters(snap.meters);
    renderRank(snap.board || []);
  },
  settings: applySettings,
  status: applyStatus,
  stages: (d) => applyStages(d.n),
  meters: applyMeters,
  board: renderRank,
  chat: (e) => {
    count.chats++;
    if (e.dzo) count.dzo++;
    feed(e.dzo ? 'dzo' : 'chat', `<b>${esc(e.user.name)}</b>: ${esc(e.text)}`);
    refreshCounts();
  },
  gift: (e) => {
    count.gifts++;
    count.coins += e.coins;
    feed('gift', `🎁 <b>${esc(e.user.name)}</b> tặng <b>${esc(e.giftName)}</b>${e.count > 1 ? ` ×${e.count}` : ''} <em>+${fmt(e.coins)} xu</em>`);
    refreshCounts();
  },
  join: (e) => {
    count.joins++;
    feed('join', `🚶 <b>${esc(e.user.name)}</b> vào quán`);
    refreshCounts();
  },
  follow: (e) => {
    count.follows++;
    feed('follow', `❤️ <b>${esc(e.user.name)}</b> đã follow`);
    refreshCounts();
  },
  smash: (e) => {
    count.smash++;
    lastSmash = Date.now();
    feed('smash', `💥 <b>${esc(e.user.name)}</b> đập quán! Chủ quán đang khóc…`);
    refreshCounts();
  },
  wave: () => feed('fx', '🍻 Cả quán cùng dzô!'),
  rain: () => feed('fx', '🫧 Mưa bọt bia bắt đầu!'),
  wheel: (e) => feed('fx', `🎡 Vòng quay món nhậu quay (ô ${Number(e.index) + 1})`),
});

// Keep the preview at the stage's 9:16 shape, as large as the column allows
const frame = /** @type {HTMLElement} */ (document.querySelector('.preview-frame'));
const sizePreview = () => {
  const w = Math.min(frame.parentElement?.clientWidth ? frame.parentElement.clientWidth - 36 : 340, 340);
  frame.style.width = `${w}px`;
  frame.style.height = `${(w * 764) / 430}px`;
};
addEventListener('resize', sizePreview);
sizePreview();
