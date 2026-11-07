// @ts-check
// Giọng đọc cho chủ quán. Bốn nguồn:
//  - edge:   giọng Microsoft (Hoài My, Nam Minh), miễn phí, không cần khóa
//  - google: giọng Google Dịch, miễn phí
//  - fpt:    FPT.AI (Ban Mai, Thu Minh, Mỹ An, Lê Minh...), giọng AI quen thuộc trên TikTok, cần API key (console.fpt.ai)
//  - zalo:   Zalo AI (nữ/nam Bắc, Nam), cần API key (zalo.ai)
// Khóa API chỉ nằm trong settings.json trên máy chủ quán, không bao giờ gửi xuống trang stage hay dashboard.

/** @typedef {{ provider: 'edge'; label: string; gender: 'f' | 'm'; name: string; pitch: string; rate: number } | { provider: 'google'; label: string; gender: 'f' | 'm' } | { provider: 'fpt' | 'zalo'; label: string; gender: 'f' | 'm'; id: string }} Voice */

/** @type {Record<string, Voice>} */
export const VOICES = {
  female_cute: { provider: 'edge', label: 'Hoài My · em gái nhí nhảnh', gender: 'f', name: 'vi-VN-HoaiMyNeural', pitch: '+12%', rate: 6 },
  female: { provider: 'edge', label: 'Hoài My · chị chủ quán vui vẻ', gender: 'f', name: 'vi-VN-HoaiMyNeural', pitch: '+4%', rate: 0 },
  female_soft: { provider: 'edge', label: 'Hoài My · dịu dàng', gender: 'f', name: 'vi-VN-HoaiMyNeural', pitch: '-3%', rate: -7 },
  male: { provider: 'edge', label: 'Nam Minh · anh chủ quán trầm ấm', gender: 'm', name: 'vi-VN-NamMinhNeural', pitch: '-1%', rate: 0 },
  male_hype: { provider: 'edge', label: 'Nam Minh · MC sôi động', gender: 'm', name: 'vi-VN-NamMinhNeural', pitch: '+6%', rate: 9 },
  google: { provider: 'google', label: 'Giọng Google Dịch', gender: 'f' },
  fpt_banmai: { provider: 'fpt', label: 'FPT.AI · Ban Mai (nữ Bắc)', gender: 'f', id: 'banmai' },
  fpt_thuminh: { provider: 'fpt', label: 'FPT.AI · Thu Minh (nữ Bắc)', gender: 'f', id: 'thuminh' },
  fpt_myan: { provider: 'fpt', label: 'FPT.AI · Mỹ An (nữ Trung)', gender: 'f', id: 'myan' },
  fpt_ngoclam: { provider: 'fpt', label: 'FPT.AI · Ngọc Lam (nữ Trung)', gender: 'f', id: 'ngoclam' },
  fpt_lannhi: { provider: 'fpt', label: 'FPT.AI · Lan Nhi (nữ Nam)', gender: 'f', id: 'lannhi' },
  fpt_linhsan: { provider: 'fpt', label: 'FPT.AI · Linh San (nữ Nam)', gender: 'f', id: 'linhsan' },
  fpt_leminh: { provider: 'fpt', label: 'FPT.AI · Lê Minh (nam Bắc)', gender: 'm', id: 'leminh' },
  fpt_giahuy: { provider: 'fpt', label: 'FPT.AI · Gia Huy (nam Trung)', gender: 'm', id: 'giahuy' },
  fpt_minhquang: { provider: 'fpt', label: 'FPT.AI · Minh Quang (nam Nam)', gender: 'm', id: 'minhquang' },
  zalo_2: { provider: 'zalo', label: 'Zalo AI · nữ miền Bắc', gender: 'f', id: '2' },
  zalo_1: { provider: 'zalo', label: 'Zalo AI · nữ miền Nam', gender: 'f', id: '1' },
  zalo_4: { provider: 'zalo', label: 'Zalo AI · nam miền Bắc', gender: 'm', id: '4' },
  zalo_3: { provider: 'zalo', label: 'Zalo AI · nam miền Nam', gender: 'm', id: '3' },
};

const escapeXml = (/** @type {string} */ s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const wait = (/** @type {number} */ ms) => new Promise((ok) => setTimeout(ok, ms));

/** Text as the voice should say it: no emoji or symbols, a breath after "!" and "?" so it sounds less flat */
export const speakable = (/** @type {string} */ t) =>
  t
    .replace(/[\p{Extended_Pictographic}‍️]/gu, '')
    .replace(/\s*[·•|]\s*/g, ', ')
    .replace(/\.{2,}/g, '…')
    .replace(/\s+/g, ' ')
    .trim();

/** fetch with a time limit */
async function fetchT(/** @type {string} */ url, /** @type {RequestInit} */ init = {}, ms = 12_000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } catch (err) {
    const host = new URL(url).hostname;
    throw new Error(ctl.signal.aborted ? `${host} trả lời quá lâu` : `Không gọi được ${host} (máy có mạng không?)`, { cause: err });
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------------------------------------ Microsoft Edge

/** @param {string} text @param {number} rate @param {Extract<Voice, { provider: 'edge' }>} v */
async function edgeOnce(text, rate, v, /** @type {number} */ waitMs) {
  /** @type {any} */
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const tts = new MsEdgeTTS();
  /** @type {NodeJS.Timeout | undefined} */
  let timer;
  try {
    // 48 kHz / 192 kbps: giữ được âm cao, giọng sáng và rõ hơn bản 24 kHz
    await tts.setMetadata(v.name, OUTPUT_FORMAT.AUDIO_48KHZ_192KBITRATE_MONO_MP3 ?? OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(escapeXml(text), { rate: `${Math.round((rate - 1) * 100) + v.rate}%`, pitch: v.pitch, volume: '+6%' });
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

/**
 * At most 2 at a time (more makes the service drop some), tried twice.
 * Hàng chờ có trần: live đông mà mạng chậm thì câu mới bị từ chối ngay để sân khấu bỏ câu đó và đọc tiếp,
 * chứ không dồn thành một đống chờ hàng phút rồi quán im ru.
 */
let edgeBusy = 0;
/** @type {Array<() => void>} */
const edgeWaiting = [];
const EDGE_QUEUE_MAX = 4;
async function edge(/** @type {string} */ text, /** @type {number} */ rate, /** @type {Extract<Voice, { provider: 'edge' }>} */ v) {
  if (edgeWaiting.length >= EDGE_QUEUE_MAX) throw new Error('Giọng Microsoft đang nghẽn, bỏ qua câu này');
  if (edgeBusy >= 2) await new Promise((ok) => edgeWaiting.push(() => ok(undefined)));
  edgeBusy++;
  try {
    let last;
    for (const [i, ms] of [12_000, 8_000].entries()) {
      try {
        return await edgeOnce(text, rate, v, ms);
      } catch (err) {
        last = err;
        console.warn(`Giọng Microsoft lỗi lần ${i + 1}, thử lại:`, err instanceof Error ? err.message : err);
        await wait(400 + i * 800);
      }
    }
    throw last;
  } finally {
    edgeBusy--;
    edgeWaiting.shift()?.();
  }
}

// ------------------------------------------------------------------------------------------------ Google Dịch

/** Google caps each request near 200 chars: split at sentence/comma/space boundaries */
export function splitText(/** @type {string} */ text, max = 190) {
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
async function google(/** @type {string} */ text) {
  const parts = [];
  for (const chunk of splitText(text)) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const res = await fetchT(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://translate.google.com/' } });
    if (!res.ok) throw new Error(`Google TTS lỗi ${res.status}`);
    parts.push(Buffer.from(await res.arrayBuffer()));
  }
  return Buffer.concat(parts);
}

// ------------------------------------------------------------------------------------------------ FPT.AI

/** The file behind an "async" link is ready a moment later: ask again until it is there */
async function pollAudio(/** @type {string} */ url, /** @type {string} */ who, totalMs = 16_000) {
  const until = Date.now() + totalMs;
  let delay = 500;
  while (Date.now() < until) {
    const res = await fetchT(url, {}, 8000).catch(() => null);
    if (res?.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 200) return buf;
    }
    await wait(delay);
    delay = Math.min(1500, delay + 250);
  }
  throw new Error(`${who}: chờ file âm thanh quá lâu`);
}

/** FPT.AI v5: POST the text, get a link to the mp3 a second later. speed -3..3 */
async function fpt(/** @type {string} */ text, /** @type {number} */ rate, /** @type {string} */ voiceId, /** @type {string} */ key) {
  if (!key) throw new Error('Chưa nhập API key FPT.AI trong trang admin');
  const speed = Math.max(-3, Math.min(3, Math.round((rate - 1) * 10)));
  const res = await fetchT('https://api.fpt.ai/hmi/tts/v5', {
    method: 'POST',
    headers: { 'api-key': key, voice: voiceId, speed: String(speed), format: 'mp3', 'Content-Type': 'text/plain; charset=utf-8' },
    body: text.length < 3 ? `${text}...` : text.slice(0, 4900),
  });
  /** @type {any} */
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.async) throw new Error(`FPT.AI: ${data?.message || `lỗi ${res.status}`}`);
  return pollAudio(String(data.async), 'FPT.AI');
}

// ------------------------------------------------------------------------------------------------ Zalo AI

/** Zalo AI: form POST, answers with a link to the mp3. speed 0.8..1.2 */
async function zalo(/** @type {string} */ text, /** @type {number} */ rate, /** @type {string} */ speaker, /** @type {string} */ key) {
  if (!key) throw new Error('Chưa nhập API key Zalo AI trong trang admin');
  const body = new URLSearchParams({ input: text.slice(0, 1900), speaker_id: speaker, speed: String(Math.max(0.8, Math.min(1.2, rate))), encode_type: '1' });
  const res = await fetchT('https://api.zalo.ai/v1/tts/synthesize', { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  /** @type {any} */
  const data = await res.json().catch(() => ({}));
  const url = data?.data?.url;
  if (!res.ok || data?.error_code || !url) throw new Error(`Zalo AI: ${data?.error_message || `lỗi ${res.status}`}`);
  return pollAudio(String(url), 'Zalo AI');
}

// ------------------------------------------------------------------------------------------------ cache + entry

const cache = new Map();
/** @type {Map<string, Promise<Buffer>>} câu đang được tổng hợp: hỏi lại thì chờ chung, không làm hai lần */
const inflight = new Map();
let cacheBytes = 0;
const CACHE_MAX = 60 * 1024 * 1024;
function remember(/** @type {string} */ k, /** @type {Buffer} */ audio) {
  cache.set(k, audio);
  cacheBytes += audio.length;
  while (cacheBytes > CACHE_MAX && cache.size > 1) {
    const [oldKey, old] = cache.entries().next().value;
    cache.delete(oldKey);
    cacheBytes -= old.length;
  }
}

/**
 * The mp3 of `text` in `voiceKey`. Always the chosen voice: on a hiccup the same voice is tried again instead of
 * another one (a line in a different voice sounds like a second person). Still failing: throws, the stage skips it.
 * @param {string} text @param {number} rate @param {string} voiceKey @param {{ fptKey: string; zaloKey: string }} keys
 */
export async function synth(text, rate, voiceKey, keys) {
  const v = VOICES[voiceKey] ?? VOICES.female_cute;
  const clean = speakable(text);
  if (!clean) throw new Error('Không có chữ để đọc');
  const k = `${voiceKey}|${rate}|${clean}`;
  const hit = cache.get(k);
  if (hit) return hit;
  // Sân khấu bỏ cuộc rồi hỏi lại cùng một câu thì dùng chung một lần tổng hợp, không gọi dịch vụ hai lần
  const running = inflight.get(k);
  if (running) return running;
  const job = (async () => {
    /** @type {Buffer} */
    let audio;
    if (v.provider === 'edge') audio = await edge(clean, rate, v);
    else if (v.provider === 'google') audio = await google(clean);
    else if (v.provider === 'fpt') audio = await fpt(clean, rate, v.id, keys.fptKey);
    else audio = await zalo(clean, rate, v.id, keys.zaloKey);
    remember(k, audio);
    return audio;
  })();
  inflight.set(k, job);
  try {
    return await job;
  } finally {
    inflight.delete(k);
  }
}
