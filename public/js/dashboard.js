// @ts-check
// Trang admin (http://localhost:3000). Im lặng: mọi tiếng phát trên trang stage trong TikTok LIVE Studio.
import { listen, post } from './api.js';
import { FREE } from './menu.js';

const app = /** @type {HTMLElement} */ (document.getElementById('app'));
app.className = 'dash';
const port = location.port || '3000';
const STAGE_URL = `http://lvh.me:${port}/?view=stage`;

const TABS = [
  ['home', '📊', 'Tổng quan'],
  ['control', '🎛', 'Kết nối & Điều khiển'],
  ['pub', '🍻', 'Quán: bàn, món, quà'],
  ['voice', '🎙', 'Giọng đọc & Âm thanh'],
  ['look', '🏮', 'Tên quán & Ảnh nền'],
  ['lab', '🧪', 'Thử không cần live'],
];

app.innerHTML = `
<aside class="side">
  <div class="brand"><span class="logo">🍻</span><div><h1 id="title">Nhậu Đêm 134</h1><p>Admin quán nhậu online</p></div></div>
  <nav id="nav">${TABS.map(([id, ico, name]) => `<a href="#${id}" data-tab="${id}"><i>${ico}</i><span>${name}</span></a>`).join('')}</nav>
  <div class="side-foot">
    <div class="dot-row"><span class="dot" id="d-stage"></span><span id="t-stage">Stage: chưa mở</span></div>
    <div class="dot-row"><span class="dot" id="d-tt"></span><span id="t-tt">TikTok: chưa kết nối</span></div>
    <small>Phiên này: <b id="uptime">0:00</b></small>
  </div>
</aside>

<div class="body">
<header class="top">
  <div><h2 id="page-title">Tổng quan</h2><p id="page-sub"></p></div>
  <div class="top-actions">
    <div class="pill" id="pill">⚪ Chưa kết nối TikTok</div>
    <button class="btn" data-control="wave" title="Cả quán dzô">🍻 Dzô</button>
  </div>
</header>

<main class="grid">
<section class="tabs">

  <!-- ============================================================ TỔNG QUAN -->
  <div class="tab" data-pane="home">
    <div class="warn" id="warn-stage" hidden>⚠️ Chưa có trang <b>stage</b> nào đang mở, nên quán chưa có tiếng và người xem chưa thấy gì. Thêm nguồn Link trong LIVE Studio (xem tab <a href="#control">Kết nối</a>).</div>
    <div class="kpis">
      <div class="kpi"><small>👁 Người xem</small><b id="k-viewers">0</b><em id="k-viewers-s">chưa kết nối</em></div>
      <div class="kpi"><small>❤️ Tổng tim</small><b id="k-likes">0</b><em>cả buổi live</em></div>
      <div class="kpi"><small>🎁 Quà (xu)</small><b id="k-coins">0</b><em id="k-gifts">0 lượt quà</em></div>
      <div class="kpi"><small>💬 Bình luận</small><b id="k-chats">0</b><em id="k-dzo">0 lượt dzô</em></div>
      <div class="kpi"><small>🍽 Món ra bàn</small><b id="k-dishes">0</b><em id="k-orders">0 đang nấu</em></div>
      <div class="kpi hot"><small>💥 Đập quán</small><b id="k-smash">0</b><em id="k-treat">0 lần bao quán</em></div>
    </div>
    <div class="card feed-card">
      <div class="card-head"><h3>📡 Hoạt động trực tiếp</h3>
        <div class="chips" id="chips"><button class="chip on" data-f="all">Tất cả</button><button class="chip" data-f="gift">🎁 Quà</button><button class="chip" data-f="chat">💬 Chat</button><button class="chip" data-f="join">🪑 Vào bàn</button><button class="chip" data-f="fx">🍽 Bếp</button></div>
      </div>
      <ul class="feed" id="feed"><li class="empty">Chưa có hoạt động. Kết nối TikTok hoặc vào tab Thử không cần live để tạo khách giả.</li></ul>
    </div>
  </div>

  <!-- ============================================================ KẾT NỐI -->
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
    </div>
    <div class="card">
      <h3>🎥 Link cho TikTok LIVE Studio</h3>
      <div class="row"><code id="stage-url"></code><button class="btn" id="copy">Sao chép</button><a class="btn" href="/?view=stage" target="_blank" rel="noreferrer">Mở thử</a></div>
      <p class="note">LIVE Studio → Thêm nguồn → <b>Link</b> → dán link → kích thước <b>1080 × 1920</b>. Chỉ trang này phát tiếng; đừng mở thêm link stage ở trình duyệt khác lúc live kẻo nghe hai giọng.</p>
    </div>
    <div class="card">
      <h3>⚡ Lệnh nhanh</h3>
      <div class="row"><textarea id="speak-text" rows="2" placeholder="Câu muốn chủ quán đọc ngay, ví dụ: Cảm ơn cả nhà đã ghé Nhậu Đêm 134 tối nay nha!"></textarea><button class="btn primary" id="speak">🔊 Đọc ngay</button></div>
      <div class="tiles">
        <button class="tile" data-control="share"><i>📣</i><b>Nhắc chia sẻ</b><small>Chủ quán xin chia sẻ live</small></button>
        <button class="tile" data-control="wave"><i>🍻</i><b>Cả quán dzô</b><small>Một, hai, ba, dzô!</small></button>
        <button class="tile" data-control="hush"><i>🤫</i><b>Im lặng</b><small>Bỏ các câu đang chờ đọc</small></button>
        <button class="tile" data-control="unlockAudio"><i>🔈</i><b>Bật tiếng stage</b><small>Khi trình duyệt chặn âm</small></button>
        <button class="tile" data-control="clearHall"><i>🧹</i><b>Dọn khách</b><small>Mời khách đứng dậy về</small></button>
        <button class="tile" id="reset-board"><i>♻️</i><b>Xóa bảng vàng</b><small>Làm lại điểm từ đầu</small></button>
      </div>
    </div>
  </div>

  <!-- ============================================================ QUÁN -->
  <div class="tab" data-pane="pub" hidden>
    <div class="card">
      <h3>🎁 Quà theo số xu (mỗi quà)</h3>
      <p class="note">Không cần tên quà: quà nào cũng được, tính theo <b>giá mỗi cái</b>, mốc cao nhất thắng. Chủ quán nấu ở bếp rồi tự bưng ra bàn người tặng. Bảng thực đơn trên sân khấu tự ghi theo các mốc này (0 = tắt mốc đó). Quà thấp hơn mọi mốc thì chủ quán đọc tên cảm ơn.</p>
      <div class="grid2">
        <label class="field"><span>🍗 Món ngon ngẫu nhiên (mực nướng, ốc, gà nướng…) từ</span><div class="row"><input id="s-foodMinCoins" type="number" min="0" max="1000000" /><button class="btn" data-save="foodMinCoins">Lưu</button></div></label>
        <label class="field"><span>🍲 Nồi lẩu ngẫu nhiên từ</span><div class="row"><input id="s-hotpotMinCoins" type="number" min="0" max="1000000" /><button class="btn" data-save="hotpotMinCoins">Lưu</button></div></label>
        <label class="field"><span>💥 Đập quán (lật bàn, chủ quán khóc rồi dọn) từ</span><div class="row"><input id="s-smashMinCoins" type="number" min="0" max="1000000" /><button class="btn" data-save="smashMinCoins">Lưu</button></div></label>
        <label class="field"><span>🎉 Bao cả quán (mỗi bàn một nồi lẩu) từ</span><div class="row"><input id="s-treatMinCoins" type="number" min="0" max="1000000" /><button class="btn" data-save="treatMinCoins">Lưu</button></div></label>
      </div>
      <div class="row wrap"><button class="btn" data-demo="food">🍗 Thử quà món ngon</button><button class="btn" data-demo="hotpot">🍲 Thử quà lẩu</button><button class="btn smash" data-demo="smash">💥 Thử đập quán</button><button class="btn" data-demo="treat">🎉 Thử bao cả quán</button></div>
    </div>
    <div class="card">
      <h3>🪑 Vào bàn, đổi bàn, rời bàn</h3>
      <p class="note">Khách vào live chỉ được chào. Muốn có ghế thì <b>follow</b>, chat <b>“nhậu”</b>, gọi món hoặc tặng quà: khách đi bộ từ ngoài đường vào ngồi. Gõ <b>“bàn 3”</b> (hay “sang bàn 3”) để đổi bàn, quán có 8 bàn. TikTok không báo ai rời live, nên ai im lặng quá lâu sẽ tự đứng dậy đi về.</p>
      <label class="field"><span>Im lặng bao nhiêu phút thì rời bàn</span><div class="row"><input id="s-seatIdleMin" type="number" min="2" max="120" /><button class="btn" data-save="seatIdleMin">Lưu</button></div></label>
      <div class="row wrap"><button class="btn" data-demo="nhau">🍻 Thử chat “nhậu”</button><button class="btn" data-demo="table">🪑 Thử “bàn 3”</button><button class="btn" data-demo="follow">❤️ Thử follow</button></div>
    </div>
    <div class="card">
      <h3>🍽 Gọi món miễn phí</h3>
      <p class="note">Khách comment tên món là bếp làm, phiếu order treo dưới mép bạt, xong chủ quán bưng ra bàn: <b>${FREE.map((m) => m.short).join(', ')}</b>. Khách đã tặng quà được làm trước ⭐. Gọi món ngon hay lẩu thì chủ quán nhắc tặng quà.</p>
      <label class="field switch big"><input type="checkbox" id="s-orders" /><span><b>Bật gọi món</b></span></label>
      <div class="row wrap"><button class="btn" data-demo="free">🥜 Thử gọi món</button></div>
    </div>
    <div class="card">
      <h3>🔑 Từ khóa cụng ly</h3>
      <label class="field"><span>Comment có một trong các từ này là khách nâng ly. Cách nhau dấu phẩy. Từ 3 chữ cái trở lên (dzo) không phân biệt dấu; từ ngắn (dô, zo) phải gõ đứng riêng và đúng dấu. 4 người cùng gõ trong 15 giây thì cả quán dzô.</span><div class="row"><input id="s-keyword" maxlength="120" placeholder="dzô, dzo, dô, zô, do, zo" /><button class="btn" data-save="keyword">Lưu</button></div></label>
    </div>
    <div class="card">
      <h3>🏆 Bảng vàng</h3>
      <div class="grid2">
        <label class="field"><span>Tên bảng</span><div class="row"><input id="s-boardTitle" maxlength="24" /><button class="btn" data-save="boardTitle">Lưu</button></div></label>
        <label class="field switch"><input type="checkbox" id="s-showBoard" /><span>Hiện bảng vàng trên sân khấu</span></label>
      </div>
      <ol class="rank" id="rank"><li class="empty">Chưa có ai trên bảng</li></ol>
    </div>
  </div>

  <!-- ============================================================ GIỌNG -->
  <div class="tab" data-pane="voice" hidden>
    <div class="card">
      <h3>🎙 Giọng chủ quán</h3>
      <p class="note">Bấm ▶ để nghe thử ngay tại đây, bấm tên để dùng. Giọng <b>FPT.AI</b> (Ban Mai, Lê Minh…) là giọng AI hay nghe trên TikTok; giọng <b>Zalo AI</b> cũng vậy. Hai loại này cần <b>API key</b> (nhập ở dưới). Chủ quán là nữ hay nam tự đổi theo giọng.</p>
      <div id="voice-groups"></div>
      <label class="field"><span>Tốc độ đọc: <b id="rate-val"></b></span><input type="range" id="s-rate" min="0.7" max="1.3" step="0.05" /></label>
    </div>
    <div class="card">
      <h3>🔐 API key giọng AI</h3>
      <p class="note">Khóa chỉ lưu trong máy này (file settings.json), không hiện lên sân khấu hay gửi đi đâu khác ngoài FPT.AI / Zalo AI.<br/>
      • <b>FPT.AI</b>: đăng ký tại <b>console.fpt.ai</b> → Text to Speech → lấy API key.<br/>
      • <b>Zalo AI</b>: đăng ký tại <b>zalo.ai</b> → Dashboard → lấy API key.</p>
      <div class="grid2">
        <label class="field"><span>FPT.AI API key <em id="fpt-state"></em></span><div class="row"><input id="s-fptKey" type="password" autocomplete="off" placeholder="dán API key FPT.AI" /><button class="btn" data-key="fptKey">Lưu</button></div></label>
        <label class="field"><span>Zalo AI API key <em id="zalo-state"></em></span><div class="row"><input id="s-zaloKey" type="password" autocomplete="off" placeholder="dán API key Zalo AI" /><button class="btn" data-key="zaloKey">Lưu</button></div></label>
      </div>
    </div>
    <div class="card">
      <h3>💬 Chủ quán nói gì</h3>
      <div class="grid2">
        <label class="field switch"><input type="checkbox" id="s-autoVoice" /><span><b>Tự động đọc</b> (tắt là chủ quán im, trừ “Đọc ngay”)</span></label>
        <label class="field switch"><input type="checkbox" id="s-greet" /><span>Chào khách mới vào</span></label>
        <label class="field switch"><input type="checkbox" id="s-readChat" /><span><b>Đọc to từng comment</b> rồi đáp (bỏ từ tục, link, số điện thoại)</span></label>
        <label class="field switch"><input type="checkbox" id="s-idleTalk" /><span>Live im lâu thì tự bắt chuyện, nhắc chia sẻ</span></label>
      </div>
      <div class="row wrap">
        <span class="lbl">Kiểu trả lời comment:</span>
        <button class="btn seg" data-style="bua">😜 Bựa, lầy lội</button>
        <button class="btn seg" data-style="hien">😊 Hiền, lịch sự</button>
        <button class="btn" data-control="testGreet">🔊 Thử câu chào trên stage</button>
      </div>
    </div>
    <div class="card">
      <h3>🎵 Nhạc &amp; không khí</h3>
      <div class="grid2">
        <label class="field switch"><input type="checkbox" id="s-music" /><span>Bật nhạc nền</span></label>
        <label class="field switch"><input type="checkbox" id="s-ambience" /><span>Tiếng quán ồn ào, ly chạm lách cách</span></label>
      </div>
      <div class="voices tracks">
        <div class="voice" data-track="nhau"><button class="pick" data-pick-track="nhau"><i>🍻</i><span><b>Quán nhậu Việt</b><small>Đàn tranh, đàn bầu, mõ, nhịp remix</small></span></button><button class="play" data-play-track="/assets/audio/quan_nhau.mp3" title="Nghe thử">▶</button></div>
        <div class="voice" data-track="chill"><button class="pick" data-pick-track="chill"><i>🌙</i><span><b>Chill nhẹ nhàng</b><small>Nhạc êm, nói chuyện dễ nghe</small></span></button><button class="play" data-play-track="/assets/audio/chill_relax.mp3" title="Nghe thử">▶</button></div>
      </div>
      <label class="field"><span>Âm lượng nhạc nền: <b id="vol-val"></b></span><input type="range" id="s-musicVolume" min="0" max="1" step="0.05" /></label>
    </div>
  </div>

  <!-- ============================================================ GIAO DIỆN -->
  <div class="tab" data-pane="look" hidden>
    <div class="card">
      <h3>🏮 Tên quán</h3>
      <label class="field"><span>Hiện trên biển hiệu (số ở cuối tên hiện trong ô xanh như biển số nhà) và là tên chủ quán xưng khi nói</span><div class="row"><input id="s-channelName" maxlength="40" /><button class="btn" data-save="channelName">Lưu</button></div></label>
    </div>
    <div class="card">
      <h3>🖼 Ảnh nền riêng</h3>
      <p class="note">JPG/PNG/WebP, tối đa 15 MB, ảnh dọc 9:16. Ảnh thay cho mặt tiền vẽ sẵn; bàn ghế, bếp và người vẫn ở trên. Bỏ trống thì dùng cảnh quán vẽ sẵn.</p>
      <div class="row wrap"><input type="file" id="bg-file" accept="image/jpeg,image/png,image/webp" hidden /><button class="btn" id="bg-pick">Chọn ảnh…</button><button class="btn" id="bg-reset">Dùng cảnh vẽ sẵn</button><small id="bg-state"></small></div>
    </div>
  </div>

  <!-- ============================================================ THỬ -->
  <div class="tab" data-pane="lab" hidden>
    <div class="card">
      <h3>🧪 Thử không cần live</h3>
      <p class="note">Tạo khách giả để xem hiệu ứng và nghe giọng. Điểm của khách giả vào bảng vàng như thật; nhớ <b>Xóa bảng vàng</b> trước khi live.</p>
      <div class="tiles">
        <button class="tile" data-demo="join"><i>🚶</i><b>Khách vào</b><small>được chào</small></button>
        <button class="tile" data-demo="nhau"><i>🍻</i><b>Chat “nhậu”</b><small>vào bàn</small></button>
        <button class="tile" data-demo="table"><i>🪑</i><b>“bàn 3”</b><small>đổi bàn</small></button>
        <button class="tile" data-demo="follow"><i>❤️</i><b>Follow</b><small>vào bàn</small></button>
        <button class="tile" data-demo="chat"><i>💬</i><b>Comment</b><small>đọc và đáp</small></button>
        <button class="tile" data-demo="dzo"><i>🥂</i><b>Gõ dzô</b></button>
        <button class="tile" data-demo="free"><i>🥜</i><b>Gọi món</b><small>miễn phí</small></button>
        <button class="tile" data-demo="gift"><i>🌹</i><b>Quà 1 xu</b><small>hoa hồng</small></button>
        <button class="tile" data-demo="food"><i>🍗</i><b>Quà món ngon</b></button>
        <button class="tile" data-demo="hotpot"><i>🍲</i><b>Quà lẩu</b></button>
        <button class="tile red" data-demo="smash"><i>💥</i><b>Đập quán</b></button>
        <button class="tile" data-demo="treat"><i>🎉</i><b>Bao cả quán</b></button>
        <button class="tile" data-demo="likes"><i>💖</i><b>+120 tim</b></button>
        <button class="tile" data-demo="crowd"><i>👥</i><b>Quán đông</b><small>10 người</small></button>
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

function toast(/** @type {string} */ text, ok = true) {
  const t = document.createElement('div');
  t.className = `toast ${ok ? 'ok' : 'bad'}`;
  t.textContent = (ok ? '✓ ' : '⚠ ') + text;
  $('toasts').appendChild(t);
  setTimeout(() => t.classList.add('out'), ok ? 2600 : 6000);
  setTimeout(() => t.remove(), ok ? 3100 : 6500);
}

// ---------------------------------------------------------------- tabs
const TITLES = /** @type {Record<string, string>} */ ({
  home: 'Theo dõi buổi live theo thời gian thực',
  control: 'Kết nối TikTok, link stage và các lệnh nhanh',
  pub: 'Quà theo xu, chỗ ngồi, gọi món, từ khóa và bảng vàng',
  voice: 'Giọng đọc (Microsoft, Google, FPT.AI, Zalo AI), nhạc nền',
  look: 'Tên quán trên biển hiệu và ảnh nền',
  lab: 'Tạo khách giả để thử hiệu ứng',
});
function showTab() {
  const id = TABS.some((t) => t[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'home';
  for (const p of document.querySelectorAll('[data-pane]')) /** @type {HTMLElement} */ (p).hidden = /** @type {HTMLElement} */ (p).dataset.pane !== id;
  for (const a of document.querySelectorAll('#nav a')) a.classList.toggle('on', /** @type {HTMLElement} */ (a).dataset.tab === id);
  $('page-title').textContent = TABS.find((t) => t[0] === id)?.[2] || '';
  $('page-sub').textContent = TITLES[id];
}
addEventListener('hashchange', showTab);
showTab();

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
const saveSetting = async (/** @type {string} */ key, /** @type {unknown} */ value, okText = 'Đã lưu') => {
  const r = await post('/api/settings', { [key]: value });
  if (!r.success) toast(r.error || 'Lưu không được', false);
  else toast(okText);
  return r.success;
};
for (const b of document.querySelectorAll('[data-save]')) {
  const key = /** @type {HTMLElement} */ (b).dataset.save || '';
  const input = $(`s-${key}`);
  const save = () => input.value.trim() !== '' && saveSetting(key, input.value.trim());
  /** @type {HTMLElement} */ (b).onclick = (e) => {
    e.preventDefault();
    save();
  };
  input.onkeydown = (/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && save();
}
// API keys: saved as typed (empty = remove), the box is cleared afterwards
for (const b of document.querySelectorAll('[data-key]')) {
  const key = /** @type {HTMLElement} */ (b).dataset.key || '';
  /** @type {HTMLElement} */ (b).onclick = async (e) => {
    e.preventDefault();
    const input = $(`s-${key}`);
    const ok = await saveSetting(key, input.value.trim(), input.value.trim() ? 'Đã lưu API key' : 'Đã xóa API key');
    if (ok) input.value = '';
  };
}
for (const b of document.querySelectorAll('[data-style]')) /** @type {HTMLElement} */ (b).onclick = () => saveSetting('replyStyle', /** @type {HTMLElement} */ (b).dataset.style);
const SWITCHES = ['orders', 'showBoard', 'autoVoice', 'greet', 'readChat', 'idleTalk', 'music', 'ambience'];
for (const key of SWITCHES) $(`s-${key}`).onchange = (/** @type {Event} */ e) => saveSetting(key, /** @type {HTMLInputElement} */ (e.target).checked);
for (const key of ['rate', 'musicVolume']) {
  const input = $(`s-${key}`);
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let t;
  input.oninput = () => {
    showRanges(Number($('s-rate').value), Number($('s-musicVolume').value));
    clearTimeout(t);
    t = setTimeout(() => saveSetting(key, Number(input.value)), 250);
  };
}
const showRanges = (/** @type {number} */ rate, /** @type {number} */ vol) => {
  $('rate-val').textContent = `${rate.toFixed(2)}x`;
  $('vol-val').textContent = `${Math.round(vol * 100)}%`;
};

// ---------------------------------------------------------------- voices
/** @type {Array<{ id: string; label: string; provider: string; gender: string }>} */
let voices = [];
const GROUPS = /** @type {Record<string, [string, string]>} */ ({
  fpt: ['🤖 FPT.AI', 'cần API key FPT.AI'],
  zalo: ['💙 Zalo AI', 'cần API key Zalo AI'],
  edge: ['🪟 Microsoft', 'miễn phí'],
  google: ['🔤 Google Dịch', 'miễn phí'],
});
function renderVoices() {
  $('voice-groups').innerHTML = Object.entries(GROUPS)
    .map(([prov, [name, note]]) => {
      const list = voices.filter((v) => v.provider === prov);
      if (!list.length) return '';
      return `<span class="lbl">${name} <small>(${note})</small></span><div class="voices">${list
        .map((v) => {
          const [brand, who] = v.label.split(' · ');
          return `<div class="voice" data-v="${v.id}"><button class="pick" data-voice="${v.id}"><i>${v.gender === 'm' ? '👨' : '👩'}</i><span><b>${esc(who || brand)}</b><small>${esc(who ? brand : '')}</small></span></button><button class="play" data-play="${v.id}" title="Nghe thử">▶</button></div>`;
        })
        .join('')}</div>`;
    })
    .join('');
  for (const b of document.querySelectorAll('[data-voice]')) /** @type {HTMLElement} */ (b).onclick = () => pickVoice(/** @type {HTMLElement} */ (b).dataset.voice || '');
  for (const b of document.querySelectorAll('[data-play]')) /** @type {HTMLElement} */ (b).onclick = () => playSample(/** @type {HTMLElement} */ (b).dataset.play || '');
  markVoice();
}
const markVoice = () => {
  for (const b of document.querySelectorAll('.voice[data-v]')) b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.v === settings.voice);
};
const needsKey = (/** @type {string} */ id) => {
  const prov = voices.find((v) => v.id === id)?.provider;
  return prov === 'fpt' ? !settings.fptKeySet : prov === 'zalo' ? !settings.zaloKeySet : false;
};
async function pickVoice(/** @type {string} */ id) {
  if (needsKey(id)) return toast('Giọng này cần API key: nhập ở ô bên dưới rồi chọn lại nha', false);
  // make sure the voice really works before the live switches to it
  toast('Đang thử giọng…');
  const r = await post('/api/tts/test', { voice: id });
  if (!r.success) return toast(`Giọng chưa dùng được: ${r.error}`, false);
  saveSetting('voice', id, 'Đã đổi giọng');
}
let sample = /** @type {HTMLAudioElement | null} */ (null);
async function playSample(/** @type {string} */ voice) {
  sample?.pause();
  if (needsKey(voice)) return toast('Giọng này cần API key: nhập ở ô bên dưới', false);
  const text = `${settings.channelName || 'Nhậu Đêm 134'} chào bạn Minh An mới ghé quán. Kéo ghế ngồi đi, cả quán dzô một cái nào!`;
  const r = await post('/api/tts/test', { voice, text });
  if (!r.success) return toast(`Không nghe được: ${r.error}`, false);
  sample = new Audio(`/api/tts?voice=${voice}&rate=${settings.rate}&text=${encodeURIComponent(text)}`);
  sample.play().catch(() => toast('Không phát được, thử lại sau', false));
}
for (const b of document.querySelectorAll('[data-pick-track]')) /** @type {HTMLElement} */ (b).onclick = () => saveSetting('musicTrack', /** @type {HTMLElement} */ (b).dataset.pickTrack);
for (const b of document.querySelectorAll('[data-play-track]')) {
  /** @type {HTMLElement} */ (b).onclick = () => {
    const src = /** @type {HTMLElement} */ (b).dataset.playTrack || '';
    if (sample && !sample.paused && sample.src.endsWith(src)) return sample.pause();
    sample?.pause();
    sample = new Audio(src);
    sample.volume = 0.6;
    sample.play().catch(() => toast('Không phát được, thử lại sau', false));
  };
}

function applySettings(/** @type {any} */ s) {
  settings = s;
  $('title').textContent = s.channelName;
  document.title = `${s.channelName} · Admin`;
  for (const key of ['channelName', 'keyword', 'boardTitle', 'foodMinCoins', 'hotpotMinCoins', 'smashMinCoins', 'treatMinCoins', 'seatIdleMin']) {
    const input = $(`s-${key}`);
    if (document.activeElement !== input) input.value = s[key];
  }
  for (const key of SWITCHES) $(`s-${key}`).checked = Boolean(s[key]);
  for (const key of ['greet', 'idleTalk', 'readChat']) $(`s-${key}`).closest('label').classList.toggle('dim', !s.autoVoice);
  for (const b of document.querySelectorAll('[data-style]')) b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.style === (s.replyStyle || 'bua'));
  $('s-rate').value = s.rate;
  $('s-musicVolume').value = s.musicVolume;
  showRanges(s.rate, s.musicVolume);
  $('fpt-state').textContent = s.fptKeySet ? '✅ đã lưu' : '(chưa có)';
  $('zalo-state').textContent = s.zaloKeySet ? '✅ đã lưu' : '(chưa có)';
  markVoice();
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
    toast(r.success ? 'Đã đổi ảnh nền' : r.error || 'Không tải được ảnh', r.success);
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
  if (!confirm('Xóa toàn bộ điểm trên bảng vàng?')) return;
  const r = await post('/api/board/reset');
  toast(r.success ? 'Đã xóa bảng vàng' : r.error, r.success);
};

// ---------------------------------------------------------------- TikTok
$('tt-connect').onclick = async () => {
  const username = $('tt-user').value.trim().replace(/^@/, '');
  if (!username) return $('tt-user').focus();
  try {
    localStorage.setItem('nd-user', username);
  } catch {
    // storage blocked
  }
  $('tt-connect').disabled = true;
  $('tt-connect').textContent = 'Đang kết nối…';
  const r = await post('/api/tiktok/connect', { username });
  $('tt-connect').disabled = false;
  $('tt-connect').textContent = 'Kết nối';
  if (!r.success) showError(r.error);
};
$('tt-disconnect').onclick = () => post('/api/tiktok/disconnect');
try {
  $('tt-user').value = localStorage.getItem('nd-user') || localStorage.getItem('xb-user') || '';
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
  $('k-viewers').textContent = fmt(s.viewers);
  $('k-viewers-s').textContent = s.connected ? `phòng @${s.username}` : 'chưa kết nối';
  $('k-likes').textContent = fmt(s.totalLikes);
  showError(s.error);
  if (s.username && document.activeElement !== $('tt-user') && !$('tt-user').value) $('tt-user').value = s.username;
}
function applyStages(/** @type {number} */ n) {
  $('d-stage').className = `dot ${n === 1 ? 'on' : n > 1 ? 'wait' : ''}`;
  $('t-stage').textContent = n === 0 ? 'Stage: chưa mở' : n === 1 ? 'Stage: đang chạy' : `Stage: ${n} trang (dễ trùng tiếng!)`;
  $('warn-stage').hidden = n > 0;
}

// ---------------------------------------------------------------- live feed and session counters
const count = { gifts: 0, coins: 0, chats: 0, dzo: 0, dishes: 0, smash: 0, treat: 0 };
const stamp = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
let filter = 'all';
function feed(/** @type {string} */ k, /** @type {string} */ html) {
  const ul = $('feed');
  ul.querySelector('.empty')?.remove();
  const li = document.createElement('li');
  li.className = `ev ${k}`;
  li.dataset.k = k;
  li.hidden = filter !== 'all' && k !== filter;
  li.innerHTML = `<time>${stamp()}</time><span>${html}</span>`;
  ul.prepend(li);
  while (ul.children.length > 150) ul.lastElementChild?.remove();
}
for (const c of document.querySelectorAll('#chips .chip')) {
  /** @type {HTMLElement} */ (c).onclick = () => {
    filter = /** @type {HTMLElement} */ (c).dataset.f || 'all';
    for (const o of document.querySelectorAll('#chips .chip')) o.classList.toggle('on', o === c);
    for (const li of document.querySelectorAll('#feed .ev')) /** @type {HTMLElement} */ (li).hidden = filter !== 'all' && /** @type {HTMLElement} */ (li).dataset.k !== filter;
  };
}
const refreshCounts = (cooking = -1) => {
  $('k-coins').textContent = fmt(count.coins);
  $('k-gifts').textContent = `${fmt(count.gifts)} lượt quà`;
  $('k-chats').textContent = fmt(count.chats);
  $('k-dzo').textContent = `${fmt(count.dzo)} lượt dzô`;
  $('k-dishes').textContent = fmt(count.dishes);
  if (cooking >= 0) $('k-orders').textContent = `${fmt(cooking)} món đang chờ bếp`;
  $('k-smash').textContent = fmt(count.smash);
  $('k-treat').textContent = `${fmt(count.treat)} lần bao quán`;
};
function renderRank(/** @type {any[]} */ top) {
  $('rank').innerHTML = top.length
    ? top.map((u, i) => `<li><b class="n n${i + 1}">${i + 1}</b><span class="nm">${esc(u.name)}</span><em>${fmt(u.score)} điểm${u.coins ? ` · ${fmt(u.coins)} xu` : ''}</em></li>`).join('')
    : '<li class="empty">Chưa có ai trên bảng</li>';
}

listen({
  hello: (snap) => {
    voices = snap.voices || [];
    applySettings(snap.settings);
    renderVoices();
    applyStatus(snap.status);
    applyStages(snap.stages || 0);
    renderRank(snap.board || []);
    refreshCounts(snap.pub?.orders?.length ?? 0);
  },
  settings: applySettings,
  status: applyStatus,
  stages: (d) => applyStages(d.n),
  board: renderRank,
  chat: (e) => {
    count.chats++;
    if (e.dzo) count.dzo++;
    feed('chat', `<b>${esc(e.user.name)}</b>: ${esc(e.text)}`);
    refreshCounts();
  },
  gift: (e) => {
    count.gifts++;
    count.coins += e.coins;
    const what = { treat: '🎉 bao cả quán', smash: '💥 đập quán', hotpot: '🍲 ra lẩu', food: '🍗 ra món ngon' }[/** @type {'treat'} */ (e.tier)] || 'cảm ơn';
    feed('gift', `🎁 <b>${esc(e.user.name)}</b> tặng <b>${esc(e.giftName)}</b>${e.count > 1 ? ` ×${e.count}` : ''} <em>${fmt(e.each)} xu/quà → ${what}</em>`);
    refreshCounts();
  },
  join: (e) => feed('join', `🚶 <b>${esc(e.user.name)}</b> vào live`),
  follow: (e) => feed('join', `❤️ <b>${esc(e.user.name)}</b> follow, được mời vào bàn`),
  seat: (e) => feed('join', e.table ? `🪑 <b>${esc(e.user.name)}</b> xin qua bàn ${e.table}` : `🍻 <b>${esc(e.user.name)}</b> chat nhậu, vào bàn`),
  order: (e) => feed('fx', `🧾 <b>${esc(e.order.user.name)}</b> gọi ${e.order.qty > 1 ? `${e.order.qty} ` : ''}${esc(e.order.item.ten)}${e.order.gift ? ' (quà)' : ''}`),
  orders: (list) => refreshCounts(list.length),
  orderDone: (e) => {
    count.dishes++;
    feed('fx', `🍽 Bếp xong ${esc(e.order.item.ten)} cho <b>${esc(e.order.user.name)}</b>, chủ quán bưng ra`);
    refreshCounts(e.orders.length);
  },
  smash: (e) => {
    count.smash++;
    feed('gift', `💥 <b>${esc(e.user.name)}</b> đập quán! Chủ quán đang khóc…`);
    refreshCounts();
  },
  treat: (e) => {
    count.treat++;
    feed('gift', `🎉 <b>${esc(e.user.name)}</b> bao cả quán, mỗi bàn một nồi lẩu`);
    refreshCounts();
  },
  wave: () => feed('fx', '🍻 Cả quán cùng dzô!'),
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
