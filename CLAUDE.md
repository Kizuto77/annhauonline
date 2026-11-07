# Nhậu Đêm 134: notes for Claude

A virtual sidewalk beer pub (quán nhậu vỉa hè) streamed on TikTok through TikTok LIVE Studio (Link source `http://lvh.me:3000/?view=stage`, 1080×1920). Reply in Vietnamese, short. The old cartoon version lives on branch `ban-cu-hoat-hinh`.

## Never break the live

- Only `?view=stage` makes sound. Check visuals with the dashboard preview (`?view=stage&preview=1`, silent) or the "Thử không cần live" buttons (`POST /api/demo`).
- Changes to `server.js`, `pub.js` or `tts.js` need a server restart; ask first if the owner may be live. Page code is never cached: refreshing the Link source picks it up.
- `index.html` loads only `stage.css` for the stage and only `dashboard.css` for the admin: their class names (`.side`, `.body`…) clash.

## How it works

- `server.js`: plain `node:http`. Settings (`settings.json`, includes the FPT.AI / Zalo AI keys; `publicSettings()` strips them before anything goes to a page), the gold board, the "cả quán dzô" wave (4 people typing the keyword in 15 s), gifts by coins each (treat > smash > hotpot > food; thresholds in settings). SSE `/api/events?role=stage|preview|dash`. Host/Origin checks keep other sites out. Viewers are keyed by TikTok `uniqueId`.
- `pub.js`: comment parsing (`seatWish`: "nhậu" → table 0, "bàn N" → N; `orderedItem` from `menu.js` aliases) and the kitchen queue (gift orders first, 3 on the fire). Chat events carry `kind` ('sit', 'table', 'order') so the stage doesn't read those aloud.
- `tts.js`: voices by id (`VOICES`): edge (msedge-tts), google, fpt (FPT.AI v5, async link polled), zalo. Always the chosen voice, never a fallback to another; a failing line is skipped. `POST /api/tts/test` reports the real error to the admin.
- Stage (`public/js/stage.js`): renders and speaks only; `sound.js` voice queue has a watchdog. Art in `public/js/art/` (painted-style SVG, realistic proportions, no chibi). Positions are px in the 430×764 stage; `layout.js` has 8 tables in 3 rows (3+3+2), 4 seats each (2 behind facing out, 2 at the ends turned in), depth scale `scaleAt(y)`. Walkers (guests, cook, chạy bàn) move with rAF along points, size and z follow y.
- Seats only on follow / chat "nhậu" / order / gift / "bàn N"; idle `seatIdleMin` frees the seat (TikTok sends no leave event). NPC regulars fill some seats and give them up to viewers. The cook leaves the stove to serve each finished dish (`serve`), up to 2 waiters help when the queue grows.
- Voice lines: `lines.js`, `bua.js`, `order-lines.js`; comment topics in `chat.js` match accented words (no accent stripping: "thì" must not match "thi").

## Owner decisions to keep

- It is a virtual pub for entertainment: no real beer brands, no urging viewers to drink for real, keep the LED reminders (no drink-driving, no under-18 drinking) and the occasional reminder lines.
- Gifts only get thanks and a virtual item; never present them as buying something real.
- Look: realistic painted scene, not cartoon. Name "Nhậu Đêm 134" (number shown like a blue house plate).
