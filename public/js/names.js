// @ts-check
import { containsBanned } from './text.js';

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

/**
 * A TikTok name the voice can read: fancy letters (𝑵𝒈𝒖𝒚𝒆̂̃𝒏) become plain, emoji and symbols are dropped,
 * "TuanAnh99" becomes "Tuan Anh chín chín". Returns '' when there is nothing readable (or a banned word),
 * so callers just say "bạn".
 * Words are never split inside (an earlier version split "Duyên" into "Duy ên").
 */
export function spokenName(/** @type {string} */ name) {
  let clean = (name || '')
    .normalize('NFKC')
    .replace(/[︀-️‍⃣]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}\s._-]/gu, ' ')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
  // Vietnamese voice can't read other scripts (Thai, Chinese...): call them "bạn"
  if (!clean || !/\p{Script=Latin}/u.test(clean) || containsBanned(clean)) return '';
  clean = clean
    .replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{L})(\d)/gu, '$1 $2')
    .replace(/(\d)(\p{L})/gu, '$1 $2')
    .replace(/[._-]+/g, ' ');
  const words = clean
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (/^\d+$/.test(w) ? (w.length > 4 ? w.slice(0, 4) : w).split('').map((d) => DIGITS[Number(d)]).join(' ') : w));
  return words.slice(0, 5).join(' ');
}

/** "bạn Lan", or just "bạn" when the name can't be read */
export const ban = (/** @type {string} */ name) => {
  const n = spokenName(name);
  return n ? `bạn ${n}` : 'bạn';
};

/** "bạn A, bạn B và bạn C" */
export const listNames = (/** @type {string[]} */ names) => {
  const spoken = names.map(ban);
  return spoken.length > 1 ? `${spoken.slice(0, -1).join(', ')} và ${spoken[spoken.length - 1]}` : spoken[0] || 'bạn';
};
