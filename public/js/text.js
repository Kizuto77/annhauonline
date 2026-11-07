// @ts-check
// Text helpers shared by the server and the pages (no browser APIs here).

/**
 * Words that must never be shown or spoken on the live (vulgar, sexual, drugs, gambling, violence, scams).
 * Matching uses the accented text, so ordinary words like "lớn", "các", "buổi", "đeo" are not caught.
 * Fixed list: creative spellings (l0n, đ.ị.t) slip through; add them here when one does.
 */
const BANNED_TOKENS = new Set([
  'lồn', 'lìn', 'cặc', 'buồi', 'đéo', 'địt', 'đụ', 'đĩ', 'cứt', 'đm', 'đmm', 'đcm', 'đkm',
  'dm', 'dmm', 'dcm', 'dkm', 'vcl', 'vkl', 'vcc', 'clgt', 'loz', 'dit', 'ditme', 'dume', 'cmm',
  'fuck', 'fck', 'fuk', 'shit', 'bitch', 'dick', 'pussy', 'sex', 'sexy', 'porn', 'nude', 'xxx', 'cave',
  'giết', 'chém', 'casino', 'scam',
]);
const BANNED_PHRASES = [
  'địt mẹ', 'đụ má', 'đù má', 'đéo mẹ', 'con đĩ', 'dit me', 'du ma',
  'ma túy', 'ma tuý', 'thuốc lắc', 'cần sa', 'cá độ', 'lô đề', 'cờ bạc', 'chuyển khoản', 'lừa đảo',
];

/** Lowercase NFC with single spaces */
export const normalize = (/** @type {string} */ text) => (text || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
/** Accented words of a text, lowercase */
export const tokensOf = (/** @type {string} */ text) => normalize(text).split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);

/** @param {string} text */
export function containsBanned(text) {
  if (!text) return false;
  const tokens = tokensOf(text);
  if (tokens.some((t) => BANNED_TOKENS.has(t))) return true;
  const joined = ` ${tokens.join(' ')} `;
  return BANNED_PHRASES.some((p) => joined.includes(` ${p} `));
}

/** Text shown on screen: banned words become *** */
export function maskBanned(/** @type {string} */ text) {
  if (!text || !containsBanned(text)) return text || '';
  let out = text.replace(/[\p{L}\p{M}\p{N}]+/gu, (w) => (BANNED_TOKENS.has(w.normalize('NFC').toLowerCase()) ? '***' : w));
  for (const p of BANNED_PHRASES) out = out.replace(new RegExp(p.replace(/ /g, '\\s+'), 'giu'), '***');
  return out;
}

/** Letters and digits only, no accents: "Dzô Dzô!!" -> "dzodzo" */
export const lettersOnly = (/** @type {string} */ text) =>
  (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Plain text for a setting: no control characters, trimmed to `max` characters */
export const cleanText = (/** @type {unknown} */ text, /** @type {number} */ max) =>
  (typeof text === 'string' ? text : '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, max);
