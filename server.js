// @ts-check
/**
 * Nhậu Đêm 134 – quán nhậu online cho TikTok LIVE.
 *
 * Server Node thuần (không cần Express): phát các file trong public/, nhận sự kiện TikTok LIVE, giữ bảng vàng,
 * bếp và cài đặt, rồi đẩy mọi thứ tới các trang qua SSE (/api/events). Trang stage (?view=stage, nguồn Link
 * trong TikTok LIVE Studio) là trang duy nhất phát tiếng; dashboard chỉ điều khiển.
 *
 * Chỉ nghe trên 127.0.0.1 và chỉ nhận request có Host là localhost / 127.0.0.1 / lvh.me, nên trang web lạ
 * (kể cả kiểu DNS rebinding) không điều khiển được giọng đọc hay ngắt live.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { cleanText, lettersOnly, maskBanned, tokensOf } from './public/js/text.js';
import { createPub } from './pub.js';
import { VOICES, synth } from './tts.js';
import { NPC_TALK, REGULARS } from './public/js/npc.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const SETTINGS_FILE = path.join(ROOT, 'settings.json');
const PORT = Number(process.env.PORT) || 3000;

const POINTS_PER_COIN = 10; // bảng vàng: 1 comment = 1 điểm, 1 xu quà = 10 điểm

// ---------------------------------------------------------------------------------------------------------------
// Settings (settings.json, gitignored). Every page gets them on connect and on every change, without the API keys.
// ---------------------------------------------------------------------------------------------------------------

const DEFAULTS = {
  channelName: 'Nhậu Đêm 134', // tên quán: bảng hiệu neon và tên giọng đọc xưng
  keyword: 'dzô, dzo, dô, zô, do, zo', // các từ cụng ly, cách nhau dấu phẩy; từ đầu tiên hiện trên bảng
  boardTitle: 'BẢNG VÀNG',
  showBoard: true,
  voice: 'female_cute', // một trong VOICES (tts.js): Microsoft, Google, FPT.AI, Zalo AI
  fptKey: '', // API key FPT.AI (console.fpt.ai), chỉ lưu trên máy này
  zaloKey: '', // API key Zalo AI (zalo.ai), chỉ lưu trên máy này
  rate: 1.05,
  autoVoice: true, // tắt là giọng đọc im hẳn (trừ "Đọc ngay")
  greet: true, // chào khách mới vào
  readChat: true, // đọc to từng comment (lọc từ tục, link, số điện thoại) rồi đáp
  replyStyle: 'bua', // bua = hài hước lầy lội, hien = lịch sự
  idleTalk: true, // live im lâu thì chủ quán tự bắt chuyện + nhắc chia sẻ
  music: true,
  musicVolume: 0.22,
  musicTrack: 'nhau',
  ambience: true, // tiếng quán ồn ào, ly chạm lách cách
  orders: true, // khách comment gọi món miễn phí, bếp nấu rồi bưng ra
  foodMinCoins: 1, // quà từ số xu này (mỗi cái): một món ngon ngẫu nhiên; 0 = tắt
  hotpotMinCoins: 5, // quà từ số xu này: một nồi lẩu ngẫu nhiên
  smashMinCoins: 30, // quà từ số xu này: đập quán; 0 = tắt
  treatMinCoins: 99, // quà từ số xu này: bao cả quán (mỗi bàn một nồi lẩu)
  seatIdleMin: 10, // im lặng bao nhiêu phút thì rời bàn (TikTok không báo ai rời live)
  npcLife: true, // khách quen của quán (nhân vật) tự gọi món, nói chuyện, chủ quán đáp lại
  background: '', // ảnh nền tự tải lên; rỗng = cảnh quán vẽ sẵn
};
/** @typedef {typeof DEFAULTS} Settings */
const SECRET = ['fptKey', 'zaloKey'];

const bool = (/** @type {unknown} */ v) => (typeof v === 'boolean' ? v : v === '1' || v === 'true' ? true : v === '0' || v === 'false' ? false : undefined);
const num = (/** @type {number} */ min, /** @type {number} */ max) => (/** @type {unknown} */ v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 100) / 100)) : undefined;
};
const apiKey = (/** @type {unknown} */ v) => (typeof v === 'string' && /^[\w\-.=+/]{0,200}$/.test(v.trim()) ? v.trim() : undefined);
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
  fptKey: apiKey,
  zaloKey: apiKey,
  rate: num(0.7, 1.3),
  autoVoice: bool,
  greet: bool,
  readChat: bool,
  replyStyle: (v) => (v === 'bua' || v === 'hien' ? v : undefined),
  idleTalk: bool,
  music: bool,
  musicVolume: num(0, 1),
  musicTrack: (v) => (v === 'nhau' || v === 'chill' ? v : undefined),
  ambience: bool,
  orders: bool,
  foodMinCoins: num(0, 1_000_000),
  hotpotMinCoins: num(0, 1_000_000),
  smashMinCoins: num(0, 1_000_000),
  treatMinCoins: num(0, 1_000_000),
  seatIdleMin: num(2, 120),
  npcLife: bool,
};

/** @type {Settings} */
let settings = { ...DEFAULTS };
try {
  const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  for (const [key, check] of Object.entries(VALIDATE)) {
    const v = check(saved[key]);
    if (v !== undefined) /** @type {any} */ (settings)[key] = v;
  }
  // bản mới "Nhậu Đêm 134": tên quán và tên bảng cũ đổi sang tên mới (một lần)
  if (!saved.build134) {
    if (settings.channelName === 'Xỉn Bia') settings.channelName = DEFAULTS.channelName;
    if (settings.boardTitle === 'TOP CHIẾN HỮU') settings.boardTitle = DEFAULTS.boardTitle;
  }
  if (typeof saved.background === 'string' && /^\/uploads\/background-\d+\.(jpg|png|webp)$/.test(saved.background)) {
    settings.background = saved.background;
  }
} catch {
  // chưa có settings.json: dùng mặc định
}
const saveSettings = () => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ ...settings, build134: true }, null, 2));
  } catch (err) {
    console.error('Không lưu được settings.json:', err);
  }
};
/** What the pages see: no API keys, only whether one is set */
const publicSettings = () => {
  /** @type {Record<string, unknown>} */
  const out = { ...settings, fptKeySet: Boolean(settings.fptKey), zaloKeySet: Boolean(settings.zaloKey), voiceGender: VOICES[settings.voice]?.gender ?? 'f' };
  for (const k of SECRET) delete out[k];
  return out;
};
const voiceList = () => Object.entries(VOICES).map(([id, v]) => ({ id, label: v.label, provider: v.provider, gender: v.gender }));

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
const uid = () => crypto.randomBytes(5).toString('hex');

// ---------------------------------------------------------------------------------------------------------------
// State kept here so the stage, the dashboard and a reloaded page all agree
// ---------------------------------------------------------------------------------------------------------------

/** @typedef {{ id: string; name: string; avatar: string }} User */

const status = { connected: false, connecting: false, username: '', roomId: '', viewers: 0, totalLikes: 0, error: '' };
const sendStatus = throttle(() => broadcast('status', status), 300);

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

/** Hearts: sent to the stage in small batches, it floats hearts up from the tables */
let pendingLikes = 0;
const sendLikes = throttle(() => {
  broadcast('likes', { n: pendingLikes, total: status.totalLikes });
  pendingLikes = 0;
}, 600);
const addLikes = (/** @type {number} */ n) => {
  if (!(n > 0)) return;
  pendingLikes += n;
  sendLikes();
};

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

/** Name as shown: banned words masked; the stage never speaks a masked name */
const show = (/** @type {User} */ u) => ({ id: u.id, name: maskBanned(u.name), avatar: u.avatar });
const pub = createPub({ broadcast, uid, show, settings: () => settings });

// Everything below is fed by TikTok and by the dashboard's test buttons (/api/demo) alike

/** @param {User} user @param {string} text */
function onChat(user, text) {
  const clean = cleanText(text, 200);
  if (!clean) return;
  realChats.push(Date.now());
  addPoints(user, 1);
  pub.touchSeat(user); // nói chuyện là ghế còn giữ, im lâu thì mất ghế như trên sân khấu
  const dzo = isKeyword(clean);
  // gọi món, xin ngồi, đổi bàn: the stage shows those its own way instead of reading the comment
  const kind = pub.onChat(user, clean);
  broadcast('chat', { user: show(user), text: maskBanned(clean), dzo, kind });
  if (dzo) noteDzo(user.id);
}

// "Đập quán": khách đập phá, chủ quán khóc rồi dọn lại. Một đợt ~15 giây, quà đập trong lúc đó thành quà thường.
const SMASH_MS = 15_000;
let smashUntil = 0;
/** @param {User} user @returns {boolean} false when a smash is already going on */
function triggerSmash(user) {
  if (Date.now() < smashUntil) return false;
  smashUntil = Date.now() + SMASH_MS;
  broadcast('smash', { id: uid(), user: show(user), ms: SMASH_MS });
  return true;
}

/**
 * Gifts go by coins per gift, never by gift name: bao cả quán > đập quán > lẩu > món ngon > (thanks only)
 * @param {User} user @param {string} giftName @param {number} coinsEach @param {number} count
 */
function onGift(user, giftName, coinsEach, count) {
  const each = Math.max(1, Math.round(coinsEach));
  const n = Math.max(1, Math.round(count));
  const coins = each * n;
  addPoints(user, coins * POINTS_PER_COIN, coins);
  pub.noteGifter(user);
  const s = settings;
  /** @type {string} */
  let tier = '';
  if (s.treatMinCoins > 0 && each >= s.treatMinCoins) tier = 'treat';
  else if (s.smashMinCoins > 0 && each >= s.smashMinCoins && Date.now() >= smashUntil) tier = 'smash';
  else if (s.hotpotMinCoins > 0 && each >= s.hotpotMinCoins) tier = 'hotpot';
  else if (s.foodMinCoins > 0 && each >= s.foodMinCoins) tier = 'food';
  broadcast('gift', { id: uid(), user: show(user), giftName: cleanText(giftName, 40) || 'Quà', coins, count: n, each, tier });
  if (tier === 'treat') broadcast('treat', { id: uid(), user: show(user) });
  else if (tier === 'smash') triggerSmash(user);
  else if (tier === 'hotpot' || tier === 'food') pub.giftOrder(user, each, n);
}
// Hết phiên live (tắt live, mất kết nối hẳn, bấm Ngắt kết nối): cả quán đứng dậy khỏi bàn và đi ra đường.
// Kết nối lại thì quán mở cửa, khách quen về chỗ.
let hallClosed = false;
/** @type {NodeJS.Timeout | undefined} */
let closeTimer;
function closeHall(/** @type {string} */ reason) {
  clearTimeout(closeTimer);
  if (hallClosed) return;
  hallClosed = true;
  pub.clearSeats();
  broadcast('closing', { id: uid(), reason });
  console.log(`[Quán] Dọn hàng (${reason}): khách đứng dậy ra về.`);
}
function openHall() {
  clearTimeout(closeTimer);
  if (!hallClosed) return;
  hallClosed = false;
  broadcast('opening', { id: uid() });
}
/** Mất kết nối có thể chỉ là chớp nhoáng: đợi một lúc, vẫn chưa nối lại thì mới dọn quán */
const closeSoon = (/** @type {string} */ reason, ms = 25_000) => {
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => !status.connected && closeHall(reason), ms);
};

/** @param {User} user */
const onJoin = (user) => broadcast('join', { user: show(user) });
/** @param {User} user */
const onFollow = (user) => {
  pub.noteSeated(user); // follow là có ghế (sân khấu cho ngồi), nên gọi món được luôn
  broadcast('follow', { user: show(user) });
};

// The quán's own regulars (characters, never viewers) order and talk now and then, a bit less when the live chat
// is busy, so the room keeps moving between comments. Only while a stage or preview page is open.
/** @type {number[]} */
let realChats = [];
let lastNpcTalk = Date.now();
let lastNpcOrder = Date.now();
let npcTalkGap = 15_000;
let npcOrderGap = 35_000;
const rndMs = (/** @type {number} */ a, /** @type {number} */ b) => Math.round(a + Math.random() * (b - a));
setInterval(() => {
  if (!settings.npcLife || ![...clients.values()].some((r) => r !== 'dash')) return;
  const now = Date.now();
  realChats = realChats.filter((t) => now - t < 15_000);
  const busy = realChats.length >= 4;
  if (now - lastNpcTalk > npcTalkGap * (busy ? 2.5 : 1)) {
    lastNpcTalk = now;
    npcTalkGap = rndMs(16_000, 30_000);
    broadcast('npc', { id: uid(), k: Math.floor(Math.random() * REGULARS.length), talk: Math.floor(Math.random() * NPC_TALK.length) });
  }
  if (settings.orders && now - lastNpcOrder > npcOrderGap && pub.waiting() < 3) {
    lastNpcOrder = now;
    npcOrderGap = rndMs(40_000, 75_000);
    pub.npcOrder(Math.floor(Math.random() * REGULARS.length));
  }
}, 3000);

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
    enableExtendedGiftInfo: false, // gift events already carry name and coins
  });
  activeConn = conn;
  // Every handler ignores events from a connection that has since been replaced
  const live = () => conn === activeConn;

  conn.on(ControlEvent.CONNECTED, (/** @type {any} */ state) => {
    if (!live()) return;
    Object.assign(status, { connected: true, connecting: false, roomId: String(state?.roomId || ''), error: '' });
    sendStatus();
    openHall();
    console.log(`[TikTok] Đã kết nối @${username}, phòng ${state?.roomId}`);
  });
  conn.on(ControlEvent.DISCONNECTED, () => {
    if (!live()) return;
    Object.assign(status, { connected: false, connecting: false });
    sendStatus();
    closeSoon('mất kết nối'); // rớt mạng một chút thì thôi, mất hẳn mới dọn quán
    console.log(`[TikTok] Mất kết nối @${username}`);
  });
  conn.on(WebcastEvent.STREAM_END, () => {
    if (!live()) return;
    Object.assign(status, { connected: false, connecting: false, error: 'Phiên LIVE trên TikTok đã kết thúc' });
    sendStatus();
    closeHall('phiên live kết thúc');
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
  // Likes come with the room's running total when TikTok sends it (busy rooms drop some events)
  /** @type {number | null} */
  let lastTotal = null;
  conn.on(WebcastEvent.LIKE, (/** @type {any} */ data) => {
    if (!live()) return;
    const count = Number(data?.likeCount) || 1;
    const total = typeof data?.totalLikeCount === 'number' ? data.totalLikeCount : null;
    if (total === null) {
      status.totalLikes += count;
      sendStatus();
      return addLikes(count);
    }
    const delta = lastTotal === null || total < lastTotal ? count : total - lastTotal;
    lastTotal = total;
    status.totalLikes = Math.max(status.totalLikes, total);
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
    closeHall('ngắt kết nối'); // chủ quán bấm Ngắt kết nối: khách đứng dậy ra về
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Test events from the dashboard (try everything without going live)
// ---------------------------------------------------------------------------------------------------------------

const DEMO_NAMES = ['Tuấn Bia Hơi', 'Lan Ốc Len', 'Hùng Xe Ôm', 'Mai Trà Sữa', 'Khánh Đậu Phộng', 'Ngọc 2k', 'Phát Mực Nướng', 'Vy Hạt Dẻ', 'Bảo Lẩu Thái', 'Thảo Nem Chua', 'Duyên Dễ Thương', 'Long Sụn Gà', 'An Vui Vẻ', 'Trâm Khô Gà', 'Quân 9x', 'Đức Phố Cổ', 'Hoa Hàng Mã'];
const DEMO_CHATS = ['Quán vui quá', 'Hôm nay sinh nhật mình nè', 'Buồn quá, mới chia tay', 'Say rồi, đi ngủ đây', 'Chào cả nhà', 'Mai đi làm sớm rồi', 'Mình từ Hà Nội nè', 'Chủ quán giọng hay quá', 'Haha cười xỉu', 'Thả tim đi cả nhà ơi', 'Quán ở đâu vậy ạ?', 'Cuối tuần rồi vui quá', 'Mưa to quá trời', 'Nay lương về rồi nè', 'Cảm ơn chủ quán', 'Tui đang ở Đà Nẵng', 'Cho thêm 2 em đào đi chủ quán', 'Yêu quán quá trời'];
const pick = (/** @type {any[]} */ list) => list[Math.floor(Math.random() * list.length)];
const demoUser = () => {
  const name = pick(DEMO_NAMES);
  return { id: `demo-${lettersOnly(name)}`, name, avatar: '' };
};
/** @param {string} type */
function demo(type) {
  const s = settings;
  if (type === 'join') onJoin(demoUser());
  else if (type === 'chat') onChat(demoUser(), pick(DEMO_CHATS));
  else if (type === 'dzo') onChat(demoUser(), pick(['Dzô!', 'dzo dzo', 'Một hai ba dzô', 'zô 100%']));
  else if (type === 'nhau') onChat(demoUser(), pick(['nhậu', 'Nhậu nào', 'cho ngồi với', 'vào bàn']));
  else if (type === 'table') onChat(demoUser(), `bàn ${Math.ceil(Math.random() * 8)}`);
  else if (type === 'follow') onFollow(demoUser());
  else if (type === 'free') {
    const u = demoUser();
    onChat(u, 'nhậu');
    setTimeout(() => onChat(u, pick(['đậu lạc', 'cho dĩa nem chua', 'bia hơi', 'trà đá', 'gọi khoai tây chiên', 'lên dưa chuột', 'đậu tẩm hành', 'cho xin thêm đá', 'cho cái khăn lạnh', 'thêm chén đũa', 'cho xin tăm', 'cho chén nước mắm'])), 1200);
  } else if (type === 'gift') onGift(demoUser(), pick(['Rose', 'TikTok', 'GG']), 1, 1);
  else if (type === 'food') onGift(demoUser(), pick(['Rose', 'Finger Heart', 'Rosa']), Math.max(1, s.foodMinCoins), pick([1, 1, 2]));
  else if (type === 'hotpot') onGift(demoUser(), pick(['Doughnut', 'Bubble Tea', 'Perfume']), Math.max(1, s.hotpotMinCoins), 1);
  else if (type === 'smash') onGift(demoUser(), pick(['Doughnut', 'Bouquet Flower']), Math.max(1, s.smashMinCoins), 1);
  else if (type === 'treat') onGift(demoUser(), pick(['Galaxy', 'Money Gun']), Math.max(1, s.treatMinCoins), 1);
  else if (type === 'likes') {
    status.totalLikes += 120;
    sendStatus();
    addLikes(120);
  } else if (type === 'crowd') {
    // A busy minute: people join, sit, order and cheer one after another
    for (let i = 0; i < 10; i++) {
      const u = { id: `demo-crowd-${i}`, name: `${pick(DEMO_NAMES)} ${i + 1}`, avatar: '' };
      setTimeout(() => onJoin(u), i * 300);
      setTimeout(() => onChat(u, i % 3 ? 'nhậu' : `bàn ${1 + (i % 8)}`), 1500 + i * 500);
      setTimeout(() => onChat(u, i % 2 ? 'Dzô!' : pick(['đậu lạc', 'bia hơi', 'nem chua'])), 8000 + i * 450);
    }
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

const snapshot = () => ({ settings: publicSettings(), voices: voiceList(), status, board: topBoard(), stages: stagePages(), pub: pub.snapshot() });

const CONTROL_ACTIONS = new Set(['speak', 'share', 'testGreet', 'clearHall', 'closeUp', 'unlockAudio', 'hush']);

/** @type {Record<string, (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<void> | void>} */
const routes = {
  'GET /api/events': (req, res, url) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`retry: 2000\n\nevent: hello\ndata: ${JSON.stringify(snapshot())}\n\n`);
    const role = url.searchParams.get('role');
    clients.set(res, role === 'stage' || role === 'preview' ? role : 'dash');
    if (role === 'stage') broadcast('stages', { n: stagePages() });
    // Nhịp tim: trang dùng nó để biết đường truyền còn sống (api.js tự nối lại nếu im quá lâu)
    const beat = setInterval(() => {
      try {
        res.write(`event: ping\ndata: {"t":${Date.now()}}\n\n`);
      } catch {
        clearInterval(beat);
        clients.delete(res);
      }
    }, 15_000);
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
    broadcast('settings', publicSettings());
    json(res, 200, { success: true, settings: publicSettings() });
  },

  'POST /api/control': async (req, res) => {
    const { action, text } = await readJson(req);
    if (action === 'wave') {
      triggerWave();
      return json(res, 200, { success: true });
    }
    if (action === 'closeUp') {
      closeHall('chủ quán bấm dọn quán');
      return json(res, 200, { success: true, stages: stagePages() });
    }
    if (!CONTROL_ACTIONS.has(action)) return json(res, 400, { success: false, error: 'Lệnh không hợp lệ' });
    const line = typeof text === 'string' ? cleanText(text, 500) : '';
    if (action === 'speak' && !line) return json(res, 400, { success: false, error: 'Chưa nhập nội dung cần đọc' });
    broadcast('control', { action, text: line });
    json(res, 200, { success: true, stages: stagePages() });
  },

  // "Nghe thử" in the dashboard: makes the line here and reports the real error (wrong key, no quota...)
  'POST /api/tts/test': async (req, res) => {
    const { voice, text } = await readJson(req);
    const v = typeof voice === 'string' && Object.hasOwn(VOICES, voice) ? voice : settings.voice;
    try {
      const audio = await synth(cleanText(text, 200) || `Chào mừng cả nhà tới ${settings.channelName}!`, settings.rate, v, settings);
      json(res, 200, { success: true, bytes: audio.length });
    } catch (err) {
      json(res, 400, { success: false, error: err instanceof Error ? err.message : String(err) });
    }
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
    broadcast('settings', publicSettings());
    json(res, 200, { success: true, url: settings.background });
  },

  'POST /api/background/reset': async (req, res) => {
    await readJson(req);
    removeBackground();
    settings.background = '';
    saveSettings();
    broadcast('settings', publicSettings());
    json(res, 200, { success: true });
  },

  'GET /api/tts': async (_req, res, url) => {
    const text = cleanText(url.searchParams.get('text'), 600);
    if (!text) return json(res, 400, { error: 'Thiếu nội dung' });
    const rate = num(0.5, 1.5)(url.searchParams.get('rate') ?? 1) ?? 1;
    const asked = url.searchParams.get('voice') || '';
    const voice = Object.hasOwn(VOICES, asked) ? asked : settings.voice;
    try {
      const audio = await synth(text, rate, voice, settings);
      res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length, 'Cache-Control': 'private, max-age=86400' });
      res.end(audio);
    } catch (err) {
      console.warn('Giọng đọc lỗi:', err instanceof Error ? err.message : err);
      json(res, 502, { error: err instanceof Error ? err.message : 'TTS lỗi' });
    }
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
  console.log(`\n🍻 ${settings.channelName} đang chạy:`);
  console.log(`   Trang điều khiển: http://localhost:${PORT}`);
  console.log(`   Link cho TikTok LIVE Studio: http://lvh.me:${PORT}/?view=stage\n`);
});
