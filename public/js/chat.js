// @ts-check
// Spots what a comment is about, so the host can answer with a line written for it. Matching uses the
// accented words ("thì" is not "thi", "ôm" is not "ốm"), plus a few no-accent spellings that can't mean anything
// else. The comment itself is never read aloud, so nobody can make the voice say what they typed.
import { tokensOf } from './text.js';

/** @typedef {'birthday' | 'drunk' | 'sad' | 'hungry' | 'bye' | 'tired'} Topic */

/** @type {Array<[Topic, string[]]>} checked in order, first match wins */
const TOPICS = [
  ['birthday', ['sinh nhật', 'sinh nhat', 'hpbd', 'happy birthday', 'sn vui vẻ', 'tuổi mới', 'thôi nôi']],
  ['drunk', ['say rồi', 'xỉn rồi', 'sỉn rồi', 'say quá', 'xỉn quá', 'say ghê', 'quắc cần câu', 'say xỉn', 'say ròi', 'xỉn ròi', 'xin roi', 'say roi']],
  ['sad', ['buồn quá', 'buồn ghê', 'buồn thiệt', 'đang buồn', 'thất tình', 'that tinh', 'chia tay', 'cô đơn', 'chán đời', 'tâm trạng quá', 'bị bồ đá', 'bị người yêu bỏ']],
  ['tired', ['mệt quá', 'mệt ghê', 'mệt mỏi', 'áp lực quá', 'stress quá', 'tăng ca', 'chạy deadline']],
  ['hungry', ['đói quá', 'đói bụng', 'cho xin mồi', 'xin đĩa mồi', 'xin dĩa mồi', 'mồi đâu', 'gọi món', 'đĩa mồi', 'dĩa mồi', 'có mồi không', 'thêm mồi']],
  ['bye', ['đi ngủ', 'ngủ đây', 'ngủ thôi', 'về đây', 'về nha', 'về nhé', 'về thôi', 'tạm biệt', 'bye', 'bai bai', 'pp', 'out đây', 'off đây', 'đi về', 'good night', 'g9']],
];

/** @returns {Topic | null} */
export function detectTopic(/** @type {string} */ comment) {
  const t = ` ${tokensOf(comment).join(' ')} `;
  if (t.length < 3) return null;
  for (const [topic, phrases] of TOPICS) {
    if (phrases.some((p) => t.includes(` ${p} `))) return topic;
  }
  return null;
}

// One answer per person every 10 minutes, at most one every 20 seconds overall
const PER_USER_MS = 10 * 60 * 1000;
const GLOBAL_MS = 20 * 1000;
/** @type {Map<string, number>} */
const lastByUser = new Map();
let lastAny = 0;
export function mayAnswer(/** @type {string} */ userId, now = Date.now()) {
  if (now - lastAny < GLOBAL_MS) return false;
  if (now - (lastByUser.get(userId) ?? 0) < PER_USER_MS) return false;
  lastAny = now;
  lastByUser.set(userId, now);
  if (lastByUser.size > 3000) lastByUser.delete(lastByUser.keys().next().value ?? '');
  return true;
}
