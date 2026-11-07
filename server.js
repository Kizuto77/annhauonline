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

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const SETTINGS_FILE = path.join(ROOT, 'settings.json');
const PORT = Number(process.env.PORT) || 3000;

const LIKES_PER_RAIN = 666; // tim cả phòng cho 60 giây mưa bọt bia
const RAIN_MS = 60_000;
const LIKES_PER_WHEEL = 99; // tim cả phòng cho một lần quay vòng mồi
const POINTS_PER_COIN = 10; // bảng TOP: 1 comment = 1 điểm, 1 xu quà = 10 điểm

// ---------------------------------------------------------------------------------------------------------------
// Settings (settings.json, gitignored). Every page gets them on connect and on every change.
// ---------------------------------------------------------------------------------------------------------------

/** @typedef {typeof DEFAULTS} Settings */
const DEFAULTS = {
  channelName: 'Xỉn Bia', // tên quán: tiêu đề bảng neon và tên giọng đọc xưng
  keyword: 'dzo', // comment có từ này là cụng ly (không phân biệt dấu, hoa thường): "Dzô!", "dzo dzo"
  boardTitle: 'TOP CHIẾN HỮU',
  showBoard: true,
  voice: 'female', // female = vi-VN-HoaiMyNeural, male = vi-VN-NamMinhNeural
  rate: 1.05,
  autoVoice: true, // tắt là giọng đọc im hẳn (trừ "Đọc ngay")
  greet: true, // chào khách mới vào
  chatReply: true, // đáp comment (sinh nhật, buồn, say, đòi mồi, chào về)
  idleTalk: true, // live im lâu thì chủ quán tự nói chuyện + nhắc chia sẻ
  music: true,
  musicVolume: 0.22,
  ambience: true, // tiếng quán ồn ào, ly chạm lách cách
  stories: true, // chủ quán tự kể chuyện, chuyện cười, đố vui, nhắc thả tim / chia sẻ
  storyEvery: 4, // phút giữa hai lần kể
  smashEnabled: true, // quà đặc biệt = đập quán
  smashGifts: 'Galaxy, Lion, Universe', // tên quà (cách nhau dấu phẩy, không phân biệt hoa thường/dấu)
  smashMinCoins: 0, // >0: mọi quà có giá từ số xu này trở lên (mỗi cái) cũng đập quán; 0 = tắt
  giftFoods: 'Rose, Bông hoa = Gỏi gà xé phay\nFinger Heart, Bắn Tim = Nem chua rán\nRosa = Khô mực nướng\nLucky Pig, Chú Heo May Mắn = Chân gà sả tắc\nIce Cream Cone, Kem Ốc Quế = Ốc len xào dừa', // mỗi dòng: tên quà (cách nhau dấu phẩy) = tên món mồi
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
  keyword: (v) => (lettersOnly(cleanText(v, 30)) ? cleanText(v, 30) : undefined),
  boardTitle: (v) => cleanText(v, 24) || undefined,
  showBoard: bool,
  voice: (v) => (v === 'female' || v === 'male' ? v : undefined),
  rate: num(0.7, 1.3),
  autoVoice: bool,
  greet: bool,
  chatReply: bool,
  idleTalk: bool,
  music: bool,
  musicVolume: num(0, 1),
  ambience: bool,
  stories: bool,
  storyEvery: num(1, 30),
  smashEnabled: bool,
  smashGifts: (v) => (typeof v === 'string' ? cleanText(v, 160) : undefined),
  smashMinCoins: num(0, 1_000_000),
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
  if (typeof saved.background === 'string' && /^\/uploads\/background-\d+\.(jpg|png|webp)$/.test(saved.background)) {
    settings.background = saved.background;
  }
} catch {
  // chưa có settings.json: dùng mặc định
}
const saveSettings = () => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
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

const meters = { likes: 0, likeGoal: LIKES_PER_RAIN, wheel: 0, wheelGoal: LIKES_PER_WHEEL, rainUntil: 0 };
const metersPayload = () => ({ ...meters, rainLeft: Math.max(0, meters.rainUntil - Date.now()) });
const sendMeters = throttle(() => broadcast('meters', metersPayload()), 250);

/** @param {number} count */
function addLikes(count) {
  if (!(count > 0)) return;
  const now = Date.now();
  meters.likes += count;
  const rains = Math.floor(meters.likes / LIKES_PER_RAIN);
  meters.likes %= LIKES_PER_RAIN;
  if (rains > 0) {
    // Thêm tim trong lúc đang mưa thì mưa lâu hơn
    meters.rainUntil = Math.max(meters.rainUntil, now) + rains * RAIN_MS;
    broadcast('rain', { left: meters.rainUntil - now, id: uid() });
  }
  meters.wheel += count;
  if (meters.wheel >= LIKES_PER_WHEEL) {
    // Một đợt tim qua mốc nhiều lần vẫn chỉ quay một lần, cho khỏi dồn bảng
    meters.wheel %= LIKES_PER_WHEEL;
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

/** @param {string} text */
function isKeyword(text) {
  const kw = lettersOnly(settings.keyword) || 'dzo';
  if (lettersOnly(text).includes(kw)) return true;
  // "zô", "dô" alone also mean cheers when the keyword is the default
  return kw === 'dzo' && tokensOf(text).some((t) => ['zo', 'zô', 'dô', 'dzô'].includes(t));
}

// Everything below is fed by TikTok and by the dashboard's test buttons (/api/demo) alike

/** @param {User} user @param {string} text */
function onChat(user, text) {
  const clean = cleanText(text, 200);
  if (!clean) return;
  addPoints(user, 1);
  const dzo = isKeyword(clean);
  broadcast('chat', { user: show(user), text: maskBanned(clean), dzo });
  if (dzo) noteDzo(user.id);
}
/** @param {User} user @param {string} giftName @param {number} coinsEach @param {number} count */
function onGift(user, giftName, coinsEach, count) {
  const coins = Math.max(1, Math.round(coinsEach)) * Math.max(1, Math.round(count));
  addPoints(user, coins * POINTS_PER_COIN, coins);
  broadcast('gift', { id: uid(), user: show(user), giftName: cleanText(giftName, 40) || 'Quà', coins, count });
  if (shouldSmash(giftName, coinsEach)) triggerSmash(user);
}

// "Đập quán": quà đặc biệt làm khách đập phá, chủ quán khóc rồi dọn lại. Một đợt kéo dài ~15 giây, quà trong lúc đó bỏ qua.
const SMASH_MS = 15_000;
let smashUntil = 0;
const fold = (/** @type {string} */ s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
/** @param {string} giftName @param {number} coinsEach */
function shouldSmash(giftName, coinsEach) {
  if (!settings.smashEnabled) return false;
  const name = fold(String(giftName));
  const byName = settings.smashGifts.split(',').map(fold).filter(Boolean).includes(name);
  const byCoins = settings.smashMinCoins > 0 && coinsEach >= settings.smashMinCoins;
  return byName || byCoins;
}
/** @param {User} user @returns {boolean} false when a smash is already going on */
function triggerSmash(user) {
  if (Date.now() < smashUntil) return false;
  smashUntil = Date.now() + SMASH_MS;
  broadcast('smash', { id: uid(), user: show(user), ms: SMASH_MS });
  return true;
}
/** @param {User} user */
const onJoin = (user) => broadcast('join', { user: show(user) });
/** @param {User} user */
const onFollow = (user) => broadcast('follow', { user: show(user) });
/** Name as shown: banned words masked; the stage never speaks a masked name */
const show = (/** @type {User} */ u) => ({ id: u.id, name: maskBanned(u.name), avatar: u.avatar });

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
    if (lastTotal === null || total < lastTotal) lastTotal = total - count;
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

const VOICES = {
  female: { name: 'vi-VN-HoaiMyNeural', pitch: '+4%' }, // chị chủ quán, vui vẻ
  male: { name: 'vi-VN-NamMinhNeural', pitch: '-1%' }, // anh chủ quán, trầm ấm
};
const escapeXml = (/** @type {string} */ s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Text as the voice should say it: no emoji or symbols, a breath after "!" and "?" so it sounds less flat */
const speakable = (/** @type {string} */ t) =>
  t
    .replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '')
    .replace(/\s*[·•|]\s*/g, ', ')
    .replace(/\.{2,}/g, '…')
    .replace(/\s+/g, ' ')
    .trim();

/** @param {string} text @param {number} rate @param {'female' | 'male'} voice */
async function edgeTts(text, rate, voice) {
  /** @type {any} */
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const tts = new MsEdgeTTS();
  /** @type {NodeJS.Timeout | undefined} */
  let timer;
  try {
    // 48 kHz / 192 kbps: giữ được âm cao, giọng sáng và rõ hơn bản 24 kHz (tiếng bị "tù")
    await tts.setMetadata(VOICES[voice].name, OUTPUT_FORMAT.AUDIO_48KHZ_192KBITRATE_MONO_MP3 ?? OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(escapeXml(speakable(text)), { rate: `${Math.round((rate - 1) * 100)}%`, pitch: VOICES[voice].pitch, volume: '+6%' });
    /** @type {Buffer[]} */
    const chunks = [];
    const read = (async () => {
      for await (const c of audioStream) chunks.push(/** @type {Buffer} */ (c));
    })();
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Edge TTS quá thời gian')), 15_000);
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
    const row = settings.giftFoods.split('\n').map((r) => r.split('=')[0]?.split(',')[0]?.trim()).filter(Boolean);
    onGift(demoUser(), pick(row.length ? row : ['Rose']), 1, pick([1, 1, 3]));
  } else if (type === 'bigGift') onGift(demoUser(), pick(['Perfume', 'Galaxy', 'Money Gun']), pick([99, 199, 500, 1000]), 1);
  else if (type === 'smash') triggerSmash(demoUser());
  else if (type === 'follow') onFollow(demoUser());
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
  return { settings, status, board: topBoard(), meters: metersPayload(), stages: stagePages() };
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
    if (!CONTROL_ACTIONS.has(action)) return json(res, 400, { success: false, error: 'Lệnh không hợp lệ' });
    const line = typeof text === 'string' ? cleanText(text, 500) : '';
    if (action === 'speak' && !line) return json(res, 400, { success: false, error: 'Chưa nhập nội dung cần đọc' });
    broadcast('control', { action, text: line });
    json(res, 200, { success: true, stages: stagePages() });
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
    const voice = url.searchParams.get('voice') === 'male' ? 'male' : 'female';
    const key = `${voice}|${rate}|${text}`;
    let audio = ttsCache.get(key);
    if (!audio) {
      try {
        audio = await edgeTts(text, rate, voice);
      } catch (err) {
        console.warn('Edge TTS lỗi, chuyển sang Google:', err instanceof Error ? err.message : err);
        audio = await googleTts(text);
      }
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
