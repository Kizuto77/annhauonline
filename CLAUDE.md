# Xỉn Bia: notes for Claude

A virtual beer pub (quán nhậu) streamed on TikTok through TikTok LIVE Studio (Link source `http://lvh.me:3000/?view=stage`, 1080×1920). Reply in Vietnamese, short.

## Never break the live

- Only `?view=stage` makes sound. Check visuals with the dashboard preview (`?view=stage&preview=1`, silent) or the "Thử không cần live" buttons (`POST /api/demo`).
- Changes to `server.js` need a server restart; ask first if the owner may be live. Page code is never cached: refreshing the Link source picks it up.

## How it works

- `server.js`: plain `node:http`, no framework. Holds settings (`settings.json`), the TOP board, like meters (666 = beer-bubble rain, 99 = dish wheel), the "cả quán dzô" wave (4 people typing the keyword in 15 s). Pushes everything over SSE `/api/events?role=stage|preview|dash`. Host/Origin checks keep other sites out. Viewers are keyed by TikTok `uniqueId`, not nickname.
- `public/js/stage.js`: renders and speaks only; `sound.js` voice queue has a watchdog so a stalled TTS line never freezes it.
- `club.js` (server) + `public/js/club-stage.js`: regulars/levels (`viewers.json`, demo users not saved), orders & kitchen, bill, events (happy hour, blackout, storm, vendor, karaoke), mini games (rps, guess, tug). Chat events carry `kind` when one of these handled the comment, so the stage doesn't also answer it.
- Scene v3 = vỉa hè phố cổ (`scene.js` backSVG + kitchenSVG), 8 numbered tables (`layout.js`). Seats only on follow / chat "nhậu" / order / gift / "bàn N"; idle `seatIdleMin` frees the seat (TikTok sends no leave event). Food goes through the kitchen (club.js orders): free menu by comment, gifts by coins each: food 1, hotpot 5, smash 30, treat 99. The host walks out with the dish herself when free (`serve`).
- Voice lines live in `lines.js`; comment topics in `chat.js` match accented words (no accent stripping: "thì" must not match "thi").

## Owner decisions to keep

- It is a virtual pub for entertainment: no real beer brands, no urging viewers to drink for real, keep the responsibility ticker (no drink-driving, no under-18 drinking) and the occasional reminder lines.
- Gifts only get thanks and a virtual item; never present them as buying something real.
