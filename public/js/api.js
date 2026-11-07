// @ts-check
/** POST JSON to the local server; always resolves with { success, ... } */
export async function post(/** @type {string} */ url, /** @type {unknown} */ body = {}) {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return await res.json().catch(() => ({ success: res.ok }));
  } catch {
    return { success: false, error: 'Không gọi được server. Cửa sổ đen (BAT-LIVE) còn mở không?' };
  }
}

/**
 * Live events from the server, with a watchdog.
 *
 * Trình duyệt tự nối lại khi đường truyền báo lỗi, nhưng trong TikTok LIVE Studio đường này có lúc "chết lặng":
 * không báo lỗi mà cũng không còn dữ liệu, thế là quán đứng hình, im ru tới hết buổi live. Server gửi nhịp `ping`
 * mỗi 15 giây; quá 50 giây không nghe gì thì tự dựng lại kết nối (server gửi lại `hello` nên trang khớp lại ngay).
 * @param {Record<string, (data: any) => void>} handlers
 * @param {'stage' | 'preview' | 'dash'} role
 */
export function listen(handlers, role = 'dash') {
  /** @type {EventSource | null} */
  let es = null;
  let lastAt = Date.now();
  const alive = () => (lastAt = Date.now());
  const open = () => {
    try {
      es?.close();
    } catch {
      // ignore
    }
    alive();
    es = new EventSource(`/api/events?role=${role}`);
    es.addEventListener('open', alive);
    es.addEventListener('ping', alive);
    for (const [event, fn] of Object.entries(handlers)) {
      es.addEventListener(event, (e) => {
        alive();
        try {
          fn(JSON.parse(/** @type {MessageEvent} */ (e).data));
        } catch (err) {
          console.error(`[${event}]`, err);
        }
      });
    }
  };
  open();
  setInterval(() => {
    if (Date.now() - lastAt < 50_000) return;
    console.warn('[quán] Mất tín hiệu từ server quá lâu, nối lại.');
    open();
  }, 10_000);
  return { close: () => es?.close(), reconnect: open };
}

/** Element helper: el('div', 'a b', { title: 'x' }) */
export function el(/** @type {string} */ tag, cls = '', /** @type {Record<string, string>} */ attrs = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
