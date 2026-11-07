// @ts-check
/**
 * Xỉn Bia – quán nhậu online cho TikTok LIVE.
 *
 * Server Node thuần (không cần Express): phát các file trong public/, nhận sự kiện TikTok LIVE, giữ bảng điểm,
 * thanh tim, vòng quay mồi và cài đặt, rồi đẩy mọi thứ tới các trang qua SSE (/api/events). Trang stage
 * (?view=stage, nguồn Link trong TikTok LIVE Studio) là trang duy nhất phát tiếng; dashboard chỉ điều khiển.
 *
 * Chỉ nghe trên 127.0.0.1 và chỉ nhận request có Host là localhost / 127.0.0.1 / lvh.me, nên trang web lạ
 * (kể cả kiểu DNS rebinding) không điều khiển được giọng đọc hay ngắt live.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DISHES } from './public/js/dishes.js';
import { cleanText, lettersOnly, maskBanned, tokensOf } from './public/js/text.js';
import { createClub } from './club.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const SETTINGS_FILE = path.join(ROOT, 'settings.json');
const VIEWERS_FILE = path.join(ROOT, 'viewers.json'); // khách quen: điểm trọn đời, số lần ghé
const PORT = Number(process.env.PORT) || 3000;

const POINTS_PER_COIN = 10; // bảng TOP: 1 comment = 1 điểm, 1 xu quà = 10 điểm

// ---------------------------------------------------------------------------------------------------------------
// Settings (settings.json, gitignored). Every page gets them on connect and on every change.
// ---------------------------------------------------------------------------------------------------------------

/** @typedef {typeof DEFAULTS} Settings */
/**
 * Voices to choose from in the dashboard. Microsoft has two Vietnamese voices (Hoài My, Nam Minh); each comes in a
 * few styles by pitch and speed. "google" is the Google Translate voice.
 * @type {Record<string, { name: string; pitch: string; rate: number }>}
 */
const VOICES = {
  female: { name: 'vi-VN-HoaiMyNeural', pitch: '+4%', rate: 0 }, // chị chủ quán, vui vẻ
  female_cute: { name: 'vi-VN-HoaiMyNeural', pitch: '+12%', rate: 6 }, // em gái nhí nhảnh
  female_soft: { name: 'vi-VN-HoaiMyNeural', pitch: '-3%', rate: -7 }, // cô chủ dịu dàng
  female_news: { name: 'vi-VN-HoaiMyNeural', pitch: '0%', rate: -3 }, // chị phát thanh viên, rõ chữ
  male: { name: 'vi-VN-NamMinhNeural', pitch: '-1%', rate: 0 }, // anh chủ quán, trầm ấm
  male_deep: { name: 'vi-VN-NamMinhNeural', pitch: '-9%', rate: -6 }, // anh trầm, chậm rãi
  male_hype: { name: 'vi-VN-NamMinhNeural', pitch: '+6%', rate: 9 }, // MC sôi động
  google: { name: 'google', pitch: '0%', rate: 0 }, // giọng Google
};

const DEFAULTS = {
  channelName: 'Xỉn Bia', // tên quán: tiêu đề bảng neon và tên giọng đọc xưng
  keyword: 'dzô, dzo, dô, zô, do, zo', // các từ cụng ly, cách nhau dấu phẩy; từ đầu tiên hiện trên bảng hiệu
  boardTitle: 'TOP CHIẾN HỮU',
  showBoard: true,
  voice: 'female_cute', // một trong VOICES bên dưới (Hoài My / Nam Minh với nhiều kiểu, hoặc giọng Google)
  likeGoal: 666, // tim cả phòng cho một trận mưa bọt bia
  rainSeconds: 60, // mưa bọt bia kéo dài bao lâu
  wheelGoal: 99, // tim cả phòng cho một lần quay vòng mồi
  rate: 1.05,
  autoVoice: true, // tắt là giọng đọc im hẳn (trừ "Đọc ngay")
  greet: true, // chào khách mới vào
  chatReply: true,
  readChat: true, // đọc to từng comment (lọc từ tục, link, số điện thoại) rồi đáp
  replyStyle: 'bua', // bua = hài hước lầy lội, hien = lịch sự // đáp comment (sinh nhật, buồn, say, đòi mồi, chào về)
  idleTalk: true, // live im lâu thì chủ quán tự nói chuyện + nhắc chia sẻ
  music: true,
  musicVolume: 0.22,
  musicTrack: 'nhau', // nhau = nhạc quán nhậu (đàn tranh, đàn bầu, mõ, nhịp remix); chill = nhạc chill cũ
  ambience: true, // tiếng quán ồn ào, ly chạm lách cách
  stories: false, // chủ quán tự kể chuyện, chuyện cười, đố vui, nhắc thả tim / chia sẻ
  storyEvery: 4, // phút giữa hai lần kể
  smashEnabled: true, // quà đặc biệt = đập quán
  smashGifts: 'Doughnut, Cheese Donuts, Bubble Tea, Bouquet Flower', // tên quà (cách nhau dấu phẩy, không phân biệt hoa thường/dấu)
  foodMinCoins: 1, // quà từ số xu này (mỗi cái): bếp làm một món ngon ngẫu nhiên; 0 = tắt
  hotpotMinCoins: 5, // quà từ số xu này: một nồi lẩu ngẫu nhiên
  treatMinCoins: 99, // quà từ số xu này: bao cả quán (mỗi bàn một nồi lẩu)
  seatIdleMin: 10, // im lặng bao nhiêu phút thì rời bàn (TikTok không báo ai rời live)
  smashMinCoins: 30, // >0: mọi quà có giá từ số xu này trở lên (mỗi cái) cũng đập quán; 0 = tắt
  giftFoods: 'Rose, Bông hoa = Gỏi gà xé phay\nFinger Heart, Bắn Tim = Nem chua rán\nRosa = Khô mực nướng\nLucky Pig, Chú Heo May Mắn = Chân gà sả tắc\nIce Cream Cone, Kem Ốc Quế = Ốc len xào dừa', // mỗi dòng: tên quà (cách nhau dấu phẩy) = tên món mồi
  orders: true, // khách comment gọi món theo thực đơn, bếp nấu rồi bưng ra; gõ "tính tiền" ra hóa đơn ảo
  levels: true, // cấp bậc khách quen (lưu qua nhiều buổi live)
  autoEvents: true, // sự kiện tự động: giờ vàng, mất điện, mưa bão, người bán dạo, karaoke
  eventEvery: 6, // phút giữa hai sự kiện
  games: true, // mini game
  autoGames: true, // tự mở đoán số / kéo co
  gameEvery: 8, // phút giữa hai trò
  rps: true, // oẳn tù tì với chủ quán (gõ kéo / búa / bao)
  background: '', // ảnh nền tự tải lên; rỗng = cảnh quán vẽ sẵn
};

const bool = (/** @type {unknown} */ v) => (typeof v === 'boolean' ? v : v === '1' || v === 'true' ? true : v === '0' || v === 'false' ? false : undefined);
const num = (/** @type {number} */ min, /** @type {number} */ max) => (/** @type {unknown} */ v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 100) / 100)) : undefined;
};
/** @type {Record<string, (v: unknown) => unknown>} */
const VALIDATE = {
  channelName: (v) => cleanText(v, 40) || undefined,
  keyword: (v) => {
    const list = cleanText(v, 120).split(',').map((k) => k.trim()).filter((k) => lettersOnly(k));
    return list.length ? list.join(', ') : undefined;
  },
  boardTitle: (v) => cleanText(v, 24) || undefined,
  showBoard: bool,
  voice: (v) => (typeof v === 'string' && Object.hasOwn(VOICES, v) ? v : undefined),
  likeGoal: num(10, 1_000_000),
  rainSeconds: num(10, 600),
  wheelGoal: num(10, 1_000_000),
  rate: num(0.7, 1.3),
  autoVoice: bool,
  greet: bool,
  chatReply: bool,
  readChat: bool,
  replyStyle: (v) => (v === 'bua' || v === 'hien' ? v : undefined),
  idleTalk: bool,
  music: bool,
  musicVolume: num(0, 1),
  musicTrack: (v) => (v === 'nhau' || v === 'chill' ? v : undefined),
  ambience: bool,
  stories: bool,
  storyEvery: num(1, 30),
  smashEnabled: bool,
  smashGifts: (v) => (typeof v === 'string' ? cleanText(v, 160) : undefined),
  smashMinCoins: num(0, 1_000_000),
  foodMinCoins: num(0, 1_000_000),
  hotpotMinCoins: num(0, 1_000_000),
  treatMinCoins: num(0, 1_000_000),
  seatIdleMin: num(2, 120),
  orders: bool,
  levels: bool,
  autoEvents: bool,
  eventEvery: num(2, 60),
  games: bool,
  autoGames: bool,
  gameEvery: num(3, 60),
  rps: bool,
  giftFoods: (v) => (typeof v === 'string' ? v.replace(/[\x00-\x09\x0b-\x1f\x7f]/g, '').replace(/\r/g, '').trim().slice(0, 1200) : undefined),
};

/** @type {Settings} */
let settings = { ...DEFAULTS };
try {
  const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  for (const [key, check] of Object.entries(VALIDATE)) {
    const v = check(saved[key]);
    if (v !== undefined) /** @type {any} */ (settings)[key] = v;
  }
  // older versions had a single keyword: move the default one to the full list
  if (settings.keyword === 'dzo') settings.keyword = DEFAULTS.keyword;
  // chủ quán chọn dùng một giọng "Em gái nhí nhảnh": đổi giọng mặc định cũ sang giọng này (một lần)
  if (!saved.voiceSet && settings.voice === 'female') settings.voice = DEFAULTS.voice;
  // chủ quán bỏ kể chuyện để trò chuyện với người chat: tắt kể chuyện một lần (bật lại được trong admin)
  if (!saved.talkMode) settings.stories = false;
  // the old smash setup that nobody changed: move to the new one
  if (settings.smashGifts === 'Galaxy, Lion, Universe' && settings.smashMinCoins === 0) {
    settings.smashGifts = DEFAULTS.smashGifts;
    settings.smashMinCoins = DEFAULTS.smashMinCoins;
  }
  if (typeof saved.background === 'string' && /^\/uploads\/background-\d+\.(jpg|png|webp)$/.test(saved.background)) {
    settings.background = saved.background;
  }
} catch {
  // chưa có settings.json: dùng mặc định
}
const saveSettings = () => {
  try {
    // voiceSet: the voice in this file is the owner's choice, not an old default to move on
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ ...settings, voiceSet: true, talkMode: true }, null, 2));
  } catch (err) {
    console.error('Không lưu được settings.json:', err);
  }
};

// ---------------------------------------------------------------------------------------------------------------
// SSE
// ---------------------------------------------------------------------------------------------------------------

/** @type {Map<http.ServerResponse, string>} page -> role ('stage', 'preview' or 'dash') */
const clients = new Map();
const stagePages = () => [...clients.values()].filter((r) => r === 'stage').length;
/** @param {string} event @param {unknown} data */
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients.keys()) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}
/** Gọi `fn` tối đa một lần mỗi `ms` (lần cuối luôn chạy) */
const throttle = (/** @type {() => void} */ fn, /** @type {number} */ ms) => {
  /** @type {NodeJS.Timeout | null} */
  let timer = null;
  return () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, ms);
  };
};

// ---------------------------------------------------------------------------------------------------------------
// Game state: kept here so the stage, the dashboard and a reloaded page all agree
// ---------------------------------------------------------------------------------------------------------------

/** @typedef {{ id: string; name: string; avatar: string }} User */

const status = { connected: false, connecting: false, username: '', roomId: '', viewers: 0, totalLikes: 0, error: '' };
const sendStatus = () => broadcast('status', status);

/** @type {Map<string, { id: string; name: string; avatar: string; score: number; coins: number }>} */
const board = new Map();
const topBoard = () =>
  [...board.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((e) => ({ ...e, name: maskBanned(e.name) }));
const sendBoard = throttle(() => broadcast('board', topBoard()), 400);
/** @param {User} user @param {number} points @param {number} coins */
function addPoints(user, points, coins = 0) {
  // giờ vàng: điểm x2 (cả bảng TOP lẫn điểm khách quen)
  points *= club.multiplier();
  club.addXp(user, points);
  const e = board.get(user.id) ?? { id: user.id, name: user.name, avatar: '', score: 0, coins: 0 };
  e.name = user.name;
  e.avatar = user.avatar || e.avatar;
  e.score += points;
  e.coins += coins;
  board.set(user.id, e);
  // Big rooms: keep the board from growing forever (only the top ever shows)
  if (board.size > 5000) {
    const keep = [...board.values()].sort((a, b) => b.score - a.score).slice(0, 2000);
    board.clear();
    for (const k of keep) board.set(k.id, k);
  }
  sendBoard();
}

// Goals come from the settings, so a change in the dashboard shows at once
const meters = { likes: 0, wheel: 0, rainUntil: 0, total: 0, rains: 0, wheels: 0 };
/** like counts of the last minute, for "tim/phút" */
/** @type {Array<{ at: number; n: number }>} */
let likeLog = [];
const perMinute = () => {
  const now = Date.now();
  likeLog = likeLog.filter((l) => now - l.at < 60_000);
  return likeLog.reduce((a, l) => a + l.n, 0);
};
const metersPayload = () => ({
  ...meters,
  likeGoal: settings.likeGoal,
  wheelGoal: settings.wheelGoal,
  rainLeft: Math.max(0, meters.rainUntil - Date.now()),
  perMinute: perMinute(),
});
const sendMeters = throttle(() => broadcast('meters', metersPayload()), 250);
/** @type {NodeJS.Timeout | undefined} */
let rainEndTimer;
// "tim/phút" drifts down when likes stop: refresh it now and then while someone is watching
setInterval(() => likeLog.length && sendMeters(), 5000);

/** @param {number} count */
function addLikes(count) {
  if (!(count > 0)) return;
  const now = Date.now();
  meters.total += count;
  likeLog.push({ at: now, n: count });
  meters.likes += count;
  const rains = Math.floor(meters.likes / settings.likeGoal);
  meters.likes %= settings.likeGoal;
  if (rains > 0) {
    // Thêm tim trong lúc đang mưa thì mưa lâu hơn
    meters.rains += rains;
    meters.rainUntil = Math.max(meters.rainUntil, now) + rains * settings.rainSeconds * 1000;
    broadcast('rain', { left: meters.rainUntil - now, id: uid() });
    // tell every page when the rain is over
    clearTimeout(rainEndTimer);
    rainEndTimer = setTimeout(sendMeters, meters.rainUntil - now + 200);
  }
  meters.wheel += count;
  if (meters.wheel >= settings.wheelGoal) {
    // Một đợt tim qua mốc nhiều lần vẫn chỉ quay một lần, cho khỏi dồn bảng
    meters.wheels++;
    meters.wheel %= settings.wheelGoal;
    broadcast('wheel', { id: uid(), index: Math.floor(Math.random() * DISHES.length) });
  }
  sendMeters();
}

const uid = () => crypto.randomBytes(5).toString('hex');

// "Cả quán dzô": khi nhiều người cùng gõ từ khóa trong 15 giây
const WAVE_WINDOW_MS = 15_000;
const WAVE_PEOPLE = 4;
const WAVE_COOLDOWN_MS = 45_000;
/** @type {Array<{ at: number; id: string }>} */
let recentDzo = [];
let lastWaveAt = 0;
function triggerWave() {
  lastWaveAt = Date.now();
  recentDzo = [];
  broadcast('wave', { id: uid() });
}
/** @param {string} userId */
function noteDzo(userId) {
  const now = Date.now();
  recentDzo = recentDzo.filter((d) => now - d.at < WAVE_WINDOW_MS);
  recentDzo.push({ at: now, id: userId });
  const people = new Set(recentDzo.map((d) => d.id)).size;
  if (people >= WAVE_PEOPLE && now - lastWaveAt > WAVE_COOLDOWN_MS) triggerWave();
}

/** "zôôô" -> "zô", "dooo" -> "do": stretched words count too */
const squeeze = (/** @type {string} */ s) => s.normalize('NFC').toLowerCase().replace(/(.)\1+/gu, '$1');
/**
 * Cheers keywords, comma separated. Long ones (3+ letters, like "dzo") match anywhere and ignore accents:
 * "Dzô!!", "dzodzo". Short ones ("dô", "zo") must be a word on their own and keep their accents, so "do"
 * does not catch "đó", "đồ" and the like.
 * @param {string} text
 */
function isKeyword(text) {
  const all = lettersOnly(text);
  const words = tokensOf(text).map(squeeze);
  for (const k of settings.keyword.split(',')) {
    const key = k.trim();
    const plain = lettersOnly(key);
    if (!plain) continue;
    if (plain.length >= 3 ? all.includes(plain) : words.includes(squeeze(key))) return true;
  }
  return false;
}

// Everything below is fed by TikTok and by the dashboard's test buttons (/api/demo) alike

/** @param {User} user @param {string} text */
function onChat(user, text) {
  const clean = cleanText(text, 200);
  if (!clean) return;
  addPoints(user, 1);
  const dzo = isKeyword(clean);
  // gọi món, tính tiền, oẳn tù tì, đoán số / kéo co: the stage shows those its own way instead of a chat reply
  const kind = club.onChat(user, clean, dzo);
  broadcast('chat', { user: show(user), text: maskBanned(clean), dzo, kind });
  if (dzo) noteDzo(user.id);
}
/** @param {User} user @param {string} giftName @param {number} coinsEach @param {number} count */
function onGift(user, giftName, coinsEach, count) {
  const coins = Math.max(1, Math.round(coinsEach)) * Math.max(1, Math.round(count));
  addPoints(user, coins * POINTS_PER_COIN, coins);
  club.onGift(user, coins);
  broadcast('gift', { id: uid(), user: show(user), giftName: cleanText(giftName, 40) || 'Quà', coins, count });
  // theo số xu mỗi cái: bao cả quán > đập quán > lẩu > món ngon
  if (settings.treatMinCoins > 0 && coinsEach >= settings.treatMinCoins) broadcast('treat', { id: uid(), user: show(user) });
  else if (shouldSmash(giftName, coinsEach)) triggerSmash(user);
  else club.giftOrder(user, coinsEach, count);
}

// "Đập quán": quà đặc biệt làm khách đập phá, chủ quán khóc rồi dọn lại. Một đợt kéo dài ~15 giây, quà trong lúc đó bỏ qua.
const SMASH_MS = 15_000;
let smashUntil = 0;
const fold = (/** @type {string} */ s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
/** @param {string} giftName @param {number} coinsEach */
function shouldSmash(giftName, coinsEach) {
  if (!settings.smashEnabled) return false;
  // chỉ theo số xu (mỗi cái), không cần tên quà
  return settings.smashMinCoins > 0 && coinsEach >= settings.smashMinCoins;
}
/** @param {User} user @returns {boolean} false when a smash is already going on */
function triggerSmash(user) {
  if (Date.now() < smashUntil) return false;
  smashUntil = Date.now() + SMASH_MS;
  broadcast('smash', { id: uid(), user: show(user), ms: SMASH_MS });
  return true;
}
/** @param {User} user */
const onJoin = (user) => {
  club.onJoin(user);
  broadcast('join', { user: show(user) });
};
/** @param {User} user */
const onFollow = (user) => {
  club.onFollow(user);
  broadcast('follow', { user: show(user) });
};
/** Name as shown: banned words masked; the stage never speaks a masked name. lv = cấp khách quen, visits = số lần ghé */
const show = (/** @type {User} */ u) => ({ id: u.id, name: maskBanned(u.name), avatar: u.avatar, lv: settings.levels ? club.levelOf(u.id) : 0, visits: club.visitsOf(u.id) });

const club = createClub({
  file: VIEWERS_FILE,
  broadcast,
  uid: () => uid(),
  show,
  givePoints: (u, n) => addPoints(u, n),
  settings: () => settings,
  busy: () => Date.now() < smashUntil,
});

// ---------------------------------------------------------------------------------------------------------------
// TikTok LIVE (tiktok-live-connector 2.x, proto v3: chat text in `content`, avatar in user.avatarThumb.urlList)
// ---------------------------------------------------------------------------------------------------------------

/** @type {any} */
let activeConn = null;

/** @param {any} data @returns {User} */
function userOf(data) {
  const u = data?.user || {};
  const name = cleanText(u.nickname || data?.nickname || u.uniqueId || data?.uniqueId || 'Khách', 60) || 'Khách';
  // The @handle identifies a person; two viewers can share a nickname
  const id = String(u.uniqueId || data?.uniqueId || u.displayId || u.userId || data?.userId || name).toLowerCase();
  const raw = u.avatarThumb?.urlList?.[0] || u.profilePictureUrl || data?.profilePictureUrl || '';
  return { id, name, avatar: /^https:\/\//.test(raw) ? raw : '' };
}

/** @param {string} username */
async function connectTikTok(username) {
  /** @type {any} */
  let lib;
  try {
    lib = await import('tiktok-live-connector');
  } catch {
    throw Object.assign(new Error('Thiếu thư viện tiktok-live-connector. Chạy lại BAT-LIVE.bat để nó cài thư viện.'), { missingLib: true });
  }
  const { TikTokLiveConnection, WebcastEvent, ControlEvent } = lib;

  disconnectTikTok(false);
  Object.assign(status, { connected: false, connecting: true, username, roomId: '', viewers: 0, totalLikes: 0, error: '' });
  sendStatus();

  const conn = new TikTokLiveConnection(username, {
    processInitialData: false, // không phát lại comment/quà cũ lúc mới kết nối
    // The gift-list fetch behind this option needs a paid Euler Stream plan; gift events already carry name and coins
    enableExtendedGiftInfo: false,
  });
  activeConn = conn;
  // Every handler ignores events from a connection that has since been replaced
  const live = () => conn === activeConn;

  conn.on(ControlEvent.CONNECTED, (/** @type {any} */ state) => {
    if (!live()) return;
    Object.assign(status, { connected: true, connecting: false, roomId: String(state?.roomId || ''), error: '' });
    sendStatus();
    console.log(`[TikTok] Đã kết nối @${username}, phòng ${state?.roomId}`);
  });
  conn.on(ControlEvent.DISCONNECTED, () => {
    if (!live()) return;
    Object.assign(status, { connected: false, connecting: false });
    sendStatus();
    console.log(`[TikTok] Mất kết nối @${username}`);
  });
  conn.on(WebcastEvent.STREAM_END, () => {
    if (!live()) return;
    Object.assign(status, { connected: false, connecting: false, error: 'Phiên LIVE trên TikTok đã kết thúc' });
    sendStatus();
  });
  conn.on(ControlEvent.ERROR, (/** @type {unknown} */ err) => {
    if (!live()) return;
    status.error = err instanceof Error ? err.message : String(err);
    sendStatus();
    console.warn(`[TikTok] Lỗi @${username}:`, status.error);
  });

  conn.on(WebcastEvent.CHAT, (/** @type {any} */ data) => {
    if (live()) onChat(userOf(data), data?.content || data?.comment || '');
  });

  // TikTok resends streak gifts with a cumulative repeatCount; only the new units are counted
  /** @type {Map<string, number>} */
  const streaks = new Map();
  conn.on(WebcastEvent.GIFT, (/** @type {any} */ data) => {
    if (!live()) return;
    const user = userOf(data);
    const giftId = data?.giftId || 0;
    const key = `${user.id}_${giftId}`;
    const total = data?.repeatCount || 1;
    const delta = total - (streaks.get(key) || 0);
    const streakable = (data?.gift?.type ?? data?.giftDetails?.giftType ?? data?.giftType) === 1;
    if (streakable && !data?.repeatEnd) streaks.set(key, total);
    else streaks.delete(key);
    if (delta <= 0) return;
    const name = data?.gift?.name || data?.giftDetails?.giftName || data?.giftName || 'Quà';
    const coins = data?.gift?.diamondCount || data?.diamondCount || data?.giftDetails?.diamondCount || 1;
    onGift(user, name, coins, delta);
  });

  conn.on(WebcastEvent.MEMBER, (/** @type {any} */ data) => {
    if (live()) onJoin(userOf(data));
  });
  conn.on(WebcastEvent.FOLLOW, (/** @type {any} */ data) => {
    if (live()) onFollow(userOf(data));
  });
  conn.on(WebcastEvent.ROOM_USER, (/** @type {any} */ data) => {
    if (!live() || typeof data?.viewerCount !== 'number') return;
    status.viewers = data.viewerCount;
    sendStatus();
  });

  // Likes are counted from the room's running total when TikTok sends it (busy rooms drop some like events,
  // but each one carries the total); otherwise from the event's own count. Reset for every connection.
  /** @type {number | null} */
  let lastTotal = null;
  conn.on(WebcastEvent.LIKE, (/** @type {any} */ data) => {
    if (!live()) return;
    const count = Number(data?.likeCount) || 1;
    const total = typeof data?.totalLikeCount === 'number' ? data.totalLikeCount : null;
    if (total === null) return addLikes(count);
    if (lastTotal === null || total < lastTotal) {
      // first news of this live (or the server was restarted mid-live): line the bars up with TikTok's own total
      // instead of starting from 0, without raining for all the hearts that came before
      lastTotal = total;
      meters.likes = total % settings.likeGoal;
      meters.wheel = total % settings.wheelGoal;
      meters.total = Math.max(meters.total, total);
      status.totalLikes = total;
      sendStatus();
      sendMeters();
      return;
    }
    const delta = total - lastTotal;
    lastTotal = total;
    status.totalLikes = total;
    sendStatus();
    addLikes(delta);
  });

  try {
    const state = await conn.connect();
    return String(state?.roomId || '');
  } catch (err) {
    if (live()) {
      Object.assign(status, { connected: false, connecting: false, error: err instanceof Error ? err.message : String(err) });
      sendStatus();
      activeConn = null;
    }
    throw err;
  }
}

function disconnectTikTok(announce = true) {
  const conn = activeConn;
  activeConn = null; // handlers of the old connection stop here, even if its DISCONNECTED arrives late
  if (conn) {
    try {
      conn.disconnect();
    } catch {
      // ignore
    }
  }
  if (announce) {
    Object.assign(status, { connected: false, connecting: false, username: '', roomId: '', viewers: 0, totalLikes: 0, error: '' });
    sendStatus();
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Voice: Microsoft Edge neural voices (msedge-tts), Google Translate as fallback
// ---------------------------------------------------------------------------------------------------------------

const escapeXml = (/** @type {string} */ s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Text as the voice should say it: no emoji or symbols, a breath after "!" and "?" so it sounds less flat */
const speakable = (/** @type {string} */ t) =>
  t
    .replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '')
    .replace(/\s*[·•|]\s*/g, ', ')
    .replace(/\.{2,}/g, '…')
    .replace(/\s+/g, ' ')
    .trim();

/** @param {string} text @param {number} rate @param {string} voice */
async function edgeTts(text, rate, voice, waitMs = 15_000) {
  /** @type {any} */
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const tts = new MsEdgeTTS();
  /** @type {NodeJS.Timeout | undefined} */
  let timer;
  try {
    // 48 kHz / 192 kbps: giữ được âm cao, giọng sáng và rõ hơn bản 24 kHz (tiếng bị "tù")
    await tts.setMetadata(VOICES[voice].name, OUTPUT_FORMAT.AUDIO_48KHZ_192KBITRATE_MONO_MP3 ?? OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(escapeXml(speakable(text)), { rate: `${Math.round((rate - 1) * 100) + VOICES[voice].rate}%`, pitch: VOICES[voice].pitch, volume: '+6%' });
    /** @type {Buffer[]} */
    const chunks = [];
    const read = (async () => {
      for await (const c of audioStream) chunks.push(/** @type {Buffer} */ (c));
    })();
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Edge TTS quá thời gian')), waitMs);
    });
    await Promise.race([read, timeout]);
    if (!chunks.length) throw new Error('Edge TTS không trả âm thanh');
    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timer);
    try {
      tts.close();
    } catch {
      // ignore
    }
  }
}

/** Microsoft voices, at most 2 at a time (more in parallel makes the service drop some), tried up to 3 times */
let edgeBusy = 0;
/** @type {Array<() => void>} */
const edgeWaiting = [];
async function edgeWithRetry(/** @type {string} */ text, /** @type {number} */ rate, /** @type {string} */ voice) {
  if (edgeBusy >= 2) await new Promise((ok) => edgeWaiting.push(() => ok(undefined)));
  edgeBusy++;
  try {
    let last;
    for (const [i, wait] of [15_000, 9_000, 9_000].entries()) {
      try {
        return await edgeTts(text, rate, voice, wait);
      } catch (err) {
        last = err;
        console.warn(`Giọng ${voice} lỗi lần ${i + 1}, thử lại:`, err instanceof Error ? err.message : err);
        await new Promise((ok) => setTimeout(ok, 400 + i * 800));
      }
    }
    throw last;
  } finally {
    edgeBusy--;
    edgeWaiting.shift()?.();
  }
}

/** Google Translate TTS caps each request near 200 chars: split at sentence/comma/space boundaries */
function splitText(/** @type {string} */ text, max = 190) {
  const out = [];
  let rest = text.trim();
  while (rest.length > max) {
    const win = rest.slice(0, max + 1);
    let cut = Math.max(win.lastIndexOf('. '), win.lastIndexOf('! '), win.lastIndexOf('? '));
    if (cut < max / 2) cut = Math.max(win.lastIndexOf(', '), win.lastIndexOf('; '));
    if (cut < max / 2) cut = win.lastIndexOf(' ');
    if (cut <= 0) cut = max - 1;
    out.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) out.push(rest);
  return out;
}
async function googleTts(/** @type {string} */ text) {
  const parts = [];
  for (const chunk of splitText(text)) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://translate.google.com/' } });
    if (!res.ok) throw new Error(`Google TTS lỗi ${res.status}`);
    parts.push(Buffer.from(await res.arrayBuffer()));
  }
  return Buffer.concat(parts);
}

// Repeated lines (greetings, reminders) come from memory; capped by size, oldest out first
const ttsCache = new Map();
let ttsCacheBytes = 0;
const TTS_CACHE_MAX = 60 * 1024 * 1024;
/** @param {string} key @param {Buffer} audio */
function cacheTts(key, audio) {
  ttsCache.set(key, audio);
  ttsCacheBytes += audio.length;
  while (ttsCacheBytes > TTS_CACHE_MAX && ttsCache.size > 1) {
    const [oldKey, old] = ttsCache.entries().next().value;
    ttsCache.delete(oldKey);
    ttsCacheBytes -= old.length;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Test events from the dashboard (try everything without going live)
// ---------------------------------------------------------------------------------------------------------------

const DEMO_NAMES = ['Tuấn Bia Hơi', 'Lan Ốc Len', 'Hùng Xe Ôm', 'Mai Trà Sữa', 'Khánh Đậu Phộng', 'Ngọc 2k', 'Phát Mực Nướng', 'Vy Hạt Dẻ', 'Bảo Lẩu Thái', 'Thảo Nem Chua', 'Duyên Dễ Thương', 'Long Sụn Gà', 'An Vui Vẻ', 'Trâm Khô Gà', 'Quân 9x'];
const DEMO_CHATS = ['Quán vui quá', 'Hôm nay sinh nhật mình nè', 'Buồn quá, mới chia tay', 'Cho xin đĩa mồi đi chủ quán', 'Say rồi, đi ngủ đây', 'Chào cả nhà', 'Mai đi làm sớm rồi', 'Bia ngon ghê', 'Mình từ Hà Nội nè', 'Chủ quán giọng hay quá', 'Haha cười xỉu', 'Cho em ngồi bàn VIP với', 'Thả tim đi cả nhà ơi', 'Quán tên gì vậy ạ?', 'Cuối tuần rồi vui quá', 'Mưa to quá trời', 'Nay lương về rồi nè', 'Em vừa follow nha', 'Cảm ơn chủ quán', 'Tui đang ở Đà Nẵng', 'Ốc len xào ngon quá', 'Yêu quán quá trời'];
const pick = (/** @type {any[]} */ list) => list[Math.floor(Math.random() * list.length)];
const demoUser = () => {
  const name = pick(DEMO_NAMES);
  return { id: `demo-${lettersOnly(name)}`, name, avatar: '' };
};
/** @param {string} type */
function demo(type) {
  if (type === 'join') onJoin(demoUser());
  else if (type === 'chat') onChat(demoUser(), pick(DEMO_CHATS));
  else if (type === 'dzo') onChat(demoUser(), pick(['Dzô!', 'dzo dzo', 'Một hai ba dzô', 'zô 100%']));
  else if (type === 'gift') onGift(demoUser(), pick(['Rose', 'Finger Heart', 'TikTok', 'GG']), 1, 1);
  else if (type === 'giftFood') {
    onGift(demoUser(), pick(['Rose', 'Finger Heart', 'Rosa', 'Ice Cream Cone']), Math.max(1, settings.foodMinCoins), pick([1, 1, 2]));
  } else if (type === 'hotpot') onGift(demoUser(), pick(['Doughnut', 'Bubble Tea', 'Perfume']), Math.max(1, settings.hotpotMinCoins), 1);
  else if (type === 'treat') onGift(demoUser(), pick(['Galaxy', 'Money Gun']), Math.max(1, settings.treatMinCoins), 1);
  else if (type === 'nhau') onChat(demoUser(), pick(['nhậu', 'Nhậu nào', 'cho ngồi với', 'vào bàn']));
  else if (type === 'table') onChat(demoUser(), `bàn ${Math.ceil(Math.random() * 8)}`);
  else if (type === 'free') {
    const u = demoUser();
    onChat(u, 'nhậu');
    setTimeout(() => onChat(u, pick(['đậu lạc', 'cho dĩa nem chua', 'bia', 'trà đá', 'gọi khoai tây chiên', 'lên dưa chuột', 'trứng vịt lộn'])), 1200);
  } else if (type === 'bigGift') onGift(demoUser(), pick(['Perfume', 'Galaxy', 'Money Gun']), pick([99, 199, 500, 1000]), 1);
  else if (type === 'smash') triggerSmash(demoUser());
  else if (type === 'follow') onFollow(demoUser());
  else if (type === 'order') onChat(demoUser(), pick(['Cho 1 dĩa đậu lạc', 'gọi nem chua', 'Lên 2 ly trà đá', 'bia hơi', 'Thêm một dĩa khoai tây chiên', 'gọi mực nướng']));
  else if (type === 'bill') onChat(demoUser(), 'Tính tiền chủ quán ơi');
  else if (type === 'rps') onChat(demoUser(), pick(['kéo', 'búa', 'bao', 'oẳn tù tì ra búa']));
  else if (type === 'play') {
    // a few viewers play whatever game is on
    for (let i = 0; i < 8; i++) setTimeout(() => onChat(demoUser(), String(pick(['1', '2', '1', String(Math.ceil(Math.random() * 50))]))), i * 400);
  }
  else if (type === 'likes99') addLikes(99);
  else if (type === 'likes666') addLikes(666);
  else if (type === 'crowd') {
    // A busy minute: people join, chat and cheer one after another
    for (let i = 0; i < 12; i++) setTimeout(() => onJoin({ id: `demo-crowd-${i}`, name: `${pick(DEMO_NAMES)} ${i + 1}`, avatar: '' }), i * 250);
    for (let i = 0; i < 6; i++) setTimeout(() => onChat({ id: `demo-crowd-${i}`, name: `${pick(DEMO_NAMES)} ${i + 1}`, avatar: '' }, 'Dzô!'), 4000 + i * 400);
  } else return false;
  return true;
}

// ---------------------------------------------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------------------------------------------

const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', 'lvh.me', '[::1]']);
const hostName = (/** @type {string | undefined} */ h) => (h || '').toLowerCase().replace(/:\d+$/, '');
/** Only this computer's own pages may use the server (TikTok LIVE Studio, the dashboard) */
function allowed(/** @type {http.IncomingMessage} */ req) {
  if (!ALLOWED_HOSTS.has(hostName(req.headers.host))) return false;
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return ALLOWED_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/** @type {Record<string, string>} */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const IMAGE_TYPES = /** @type {Record<string, string>} */ ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' });

/** @param {http.ServerResponse} res @param {number} code @param {unknown} body */
function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
/** @param {http.IncomingMessage} req @param {number} limit @returns {Promise<Buffer>} */
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('Dữ liệu quá lớn'), { code: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
/** JSON bodies only: a cross-site HTML form can't send application/json */
async function readJson(/** @type {http.IncomingMessage} */ req) {
  if (!(req.headers['content-type'] || '').startsWith('application/json')) throw Object.assign(new Error('Cần JSON'), { code: 415 });
  const raw = await readBody(req, 64 * 1024);
  try {
    return raw.length ? JSON.parse(raw.toString('utf8')) : {};
  } catch {
    throw Object.assign(new Error('JSON lỗi'), { code: 400 });
  }
}

/** @param {http.ServerResponse} res @param {string} file @param {string} cache */
function sendFile(res, file, cache) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Không tìm thấy');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache });
    fs.createReadStream(file).pipe(res);
  });
}

function snapshot() {
  return { settings, status, board: topBoard(), meters: metersPayload(), stages: stagePages(), club: club.snapshot() };
}

const CONTROL_ACTIONS = new Set(['speak', 'share', 'testGift', 'testGreet', 'testFollow', 'testChat', 'clearHall', 'unlockAudio', 'story']);

/** @type {Record<string, (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<void> | void>} */
const routes = {
  'GET /api/events': (req, res, url) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`retry: 2000\n\nevent: hello\ndata: ${JSON.stringify(snapshot())}\n\n`);
    const role = url.searchParams.get('role');
    clients.set(res, role === 'stage' || role === 'preview' ? role : 'dash');
    if (role === 'stage') broadcast('stages', { n: stagePages() });
    const beat = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(beat);
      }
    }, 20_000);
    req.on('close', () => {
      clearInterval(beat);
      clients.delete(res);
      broadcast('stages', { n: stagePages() });
    });
  },

  'GET /api/state': (_req, res) => json(res, 200, snapshot()),

  'POST /api/settings': async (req, res) => {
    const body = await readJson(req);
    const changed = [];
    for (const [key, value] of Object.entries(body || {})) {
      const check = VALIDATE[key];
      if (!check) continue;
      const v = check(value);
      if (v === undefined) return json(res, 400, { success: false, error: `Giá trị không hợp lệ: ${key}` });
      /** @type {any} */ (settings)[key] = v;
      changed.push(key);
    }
    if (!changed.length) return json(res, 400, { success: false, error: 'Không có gì để lưu' });
    saveSettings();
    broadcast('settings', settings);
    if (changed.some((k) => k === 'likeGoal' || k === 'wheelGoal')) {
      // a lower goal than the hearts already in: keep the bar just under it
      meters.likes = Math.min(meters.likes, settings.likeGoal - 1);
      meters.wheel = Math.min(meters.wheel, settings.wheelGoal - 1);
      sendMeters();
    }
    json(res, 200, { success: true, settings });
  },

  'POST /api/control': async (req, res) => {
    const { action, text } = await readJson(req);
    if (action === 'wave') {
      triggerWave();
      return json(res, 200, { success: true });
    }
    if (action === 'smash') {
      if (!triggerSmash(demoUser())) return json(res, 400, { success: false, error: 'Quán đang bị đập / đang dọn, đợi chút nhé' });
      return json(res, 200, { success: true, stages: stagePages() });
    }
    if (action === 'event' || action === 'game') {
      const why = action === 'event' ? club.startEvent(String(text)) : club.startGame(String(text));
      return json(res, why ? 400 : 200, why ? { success: false, error: why } : { success: true, stages: stagePages() });
    }
    if (!CONTROL_ACTIONS.has(action)) return json(res, 400, { success: false, error: 'Lệnh không hợp lệ' });
    const line = typeof text === 'string' ? cleanText(text, 500) : '';
    if (action === 'speak' && !line) return json(res, 400, { success: false, error: 'Chưa nhập nội dung cần đọc' });
    broadcast('control', { action, text: line });
    json(res, 200, { success: true, stages: stagePages() });
  },

  'GET /api/viewers': (_req, res) => json(res, 200, { list: club.viewersList(60), total: club.count() }),
  'POST /api/viewers/reset': async (req, res) => {
    await readJson(req);
    club.resetViewers();
    json(res, 200, { success: true });
  },

  'POST /api/board/reset': async (req, res) => {
    await readJson(req);
    board.clear();
    broadcast('board', []);
    json(res, 200, { success: true });
  },

  'POST /api/demo': async (req, res) => {
    const { type } = await readJson(req);
    if (!demo(String(type))) return json(res, 400, { success: false, error: 'Loại thử không hợp lệ' });
    json(res, 200, { success: true });
  },

  'POST /api/tiktok/connect': async (req, res) => {
    const { username } = await readJson(req);
    const clean = cleanText(username, 40).replace(/^@/, '').trim();
    if (!/^[\w.]{2,40}$/.test(clean)) return json(res, 400, { success: false, error: 'Username TikTok không hợp lệ' });
    try {
      const roomId = await connectTikTok(clean);
      json(res, 200, { success: true, roomId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/** @type {any} */ (err)?.missingLib) return json(res, 500, { success: false, error: msg });
      json(res, 400, { success: false, error: `Không kết nối được @${clean} (${msg}). Hãy bấm Phát trực tiếp trên TikTok trước rồi kết nối lại.` });
    }
  },

  'POST /api/tiktok/disconnect': async (req, res) => {
    await readJson(req);
    disconnectTikTok();
    json(res, 200, { success: true });
  },

  // Custom background: one JPG, PNG or WebP up to 15 MB in uploads/ (gitignored), replacing the previous one
  'POST /api/background': async (req, res) => {
    const ext = IMAGE_TYPES[(req.headers['content-type'] || '').split(';')[0].trim()];
    if (!ext) return json(res, 400, { success: false, error: 'Chỉ nhận ảnh JPG, PNG hoặc WebP' });
    const data = await readBody(req, 15 * 1024 * 1024);
    if (!data.length) return json(res, 400, { success: false, error: 'Ảnh trống' });
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    removeBackground();
    const file = `background-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, file), data);
    settings.background = `/uploads/${file}`;
    saveSettings();
    broadcast('settings', settings);
    json(res, 200, { success: true, url: settings.background });
  },

  'POST /api/background/reset': async (req, res) => {
    await readJson(req);
    removeBackground();
    settings.background = '';
    saveSettings();
    broadcast('settings', settings);
    json(res, 200, { success: true });
  },

  'GET /api/tts': async (_req, res, url) => {
    const text = cleanText(url.searchParams.get('text'), 600);
    if (!text) return json(res, 400, { error: 'Thiếu nội dung' });
    const rate = num(0.5, 1.5)(url.searchParams.get('rate') ?? 1) ?? 1;
    const asked = url.searchParams.get('voice') || '';
    const voice = Object.hasOwn(VOICES, asked) ? asked : 'female';
    const key = `${voice}|${rate}|${text}`;
    let audio = ttsCache.get(key);
    if (!audio) {
      // Always the voice that was chosen: on a network hiccup try the same voice again instead of switching to
      // another one (a line in a different voice sounds like a second person). Still failing: the stage skips it.
      audio = voice === 'google' ? await googleTts(speakable(text)) : await edgeWithRetry(text, rate, voice);
      cacheTts(key, audio);
    }
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length, 'Cache-Control': 'private, max-age=86400' });
    res.end(audio);
  },
};

function removeBackground() {
  if (!settings.background) return;
  try {
    fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(settings.background)));
  } catch {
    // already gone
  }
}

const server = http.createServer(async (req, res) => {
  if (!allowed(req)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Chỉ mở được từ chính máy này (localhost hoặc lvh.me).');
  }
  const url = new URL(req.url || '/', 'http://localhost');
  const route = routes[`${req.method} ${url.pathname}`];
  try {
    if (route) return await route(req, res, url);
    if (url.pathname.startsWith('/api/')) return json(res, 404, { success: false, error: 'Không có API này' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { success: false, error: 'Không hỗ trợ' });

    if (url.pathname.startsWith('/uploads/')) return sendFile(res, path.join(UPLOAD_DIR, path.basename(url.pathname)), 'no-cache');
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.normalize(path.join(PUBLIC_DIR, rel));
    if (!file.startsWith(PUBLIC_DIR + path.sep)) return json(res, 403, { error: 'Không được' });
    // Code is never cached, so refreshing the Link source in LIVE Studio always picks up a new version
    sendFile(res, file, file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=86400' : 'no-cache');
  } catch (err) {
    const code = /** @type {any} */ (err)?.code;
    if (!res.headersSent) json(res, typeof code === 'number' ? code : 500, { success: false, error: err instanceof Error ? err.message : 'Lỗi server' });
    if (typeof code !== 'number') console.error(err);
  }
});

server.on('error', (/** @type {NodeJS.ErrnoException} */ err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nCổng ${PORT} đang bị chương trình khác dùng (có thể là cửa sổ BAT cũ). Tắt nó rồi chạy lại.\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🍺 Xỉn Bia đang chạy:`);
  console.log(`   Trang điều khiển: http://localhost:${PORT}`);
  console.log(`   Link cho TikTok LIVE Studio: http://lvh.me:${PORT}/?view=stage\n`);
});
