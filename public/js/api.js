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
 * Live events from the server (reconnects by itself)
 * @param {Record<string, (data: any) => void>} handlers
 * @param {'stage' | 'preview' | 'dash'} role
 */
export function listen(handlers, role = 'dash') {
  const es = new EventSource(`/api/events?role=${role}`);
  for (const [event, fn] of Object.entries(handlers)) {
    es.addEventListener(event, (e) => {
      try {
        fn(JSON.parse(/** @type {MessageEvent} */ (e).data));
      } catch (err) {
        console.error(`[${event}]`, err);
      }
    });
  }
  return es;
}

/** Element helper: el('div', 'a b', { title: 'x' }) */
export function el(/** @type {string} */ tag, cls = '', /** @type {Record<string, string>} */ attrs = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
