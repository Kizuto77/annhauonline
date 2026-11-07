// @ts-check
// Phần "quán thật" trên sân khấu: phiếu order treo trên dây, bếp nấu có thanh tiến độ, phục vụ bưng món, hóa đơn ảo,
// lên cấp khách quen, sự kiện (giờ vàng, mất điện, mưa bão, người bán dạo, karaoke) và mini game (đoán số, kéo co,
// oẳn tù tì). Server quyết định mọi thứ; file này chỉ vẽ và nói.
import { el } from './api.js';
import { DISHES } from './dishes.js';
import { LEVELS } from './levels.js';
import { clubLines as L } from './club-lines.js';
import { customerSVG, giftItem, hash } from './people.js';
import { personWidth, scaleAt } from './layout.js';

/** @typedef {{ id: string; name: string; avatar: string; lv?: number }} User */

/**
 * @param {{
 *   stage: HTMLElement; world: HTMLElement; ui: HTMLElement; fx: HTMLElement; wfx: HTMLElement; floor: HTMLElement; sign: HTMLElement;
 *   seatUser: (u: User, evict?: boolean) => any; seatOf: Map<string, number>; seats: Map<number, any>;
 *   SEATS: Array<{ id: number; x: number; y: number; s: number; table: number }>; TABLES: Array<{ id: number; x: number; y: number; w: number }>;
 *   headOf: (seat: number) => { x: number; y: number };
 *   bubble: (occ: any, text: string, ms?: number) => void; cheer: (occ: any, delay?: number) => void;
 *   occupantsAt: (table: number) => any[]; everyone: () => any[];
 *   serve: (table: number, item: string, done: () => void) => void;
 *   fxs: { ring: Function; sparkles: Function; floatUp: Function; fireworks: Function; beams: Function; splash: Function; confetti: (n?: number) => void; flash: () => void };
 *   sound: any; say: (text: string | string[], first?: boolean) => void; smashing: () => boolean;
 * }} c
 */
export function setupClub(c) {
  const { ui, fx, wfx, world, floor } = c;
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (ui.querySelector(s));
  const quiet = () => !c.sound || c.sound.waiting() < 2;
  const short = (/** @type {string} */ name) => (name.length > 12 ? `${name.slice(0, 11)}…` : name);
  const dishShort = (/** @type {number} */ i) => DISHES[i].ten.split(' ').slice(0, 3).join(' ');

  // ---------------------------------------------------------------------------------------------- order rail
  const rail = el('div', 'order-rail');
  rail.innerHTML = '<div class="rail-wire"></div><div class="rail-tickets"></div><div class="rail-more"></div>';
  rail.hidden = true;
  world.appendChild(rail);
  const tickets = /** @type {HTMLElement} */ (rail.querySelector('.rail-tickets'));
  /** @type {Map<string, HTMLElement>} */
  const ticketEls = new Map();
  /** @param {Array<{ id: string; user: User; dish: number; qty: number; state: string; vip: boolean; left: number; ms: number }>} list */
  function renderOrders(list) {
    const shown = list.slice(0, 3);
    for (const [id, t] of ticketEls) {
      if (!shown.some((o) => o.id === id) && !t.classList.contains('done')) {
        t.remove();
        ticketEls.delete(id);
      }
    }
    for (const o of shown) {
      let t = ticketEls.get(o.id);
      if (!t) {
        t = el('div', `ticket${o.vip ? ' vip' : ''}`);
        t.innerHTML = `<i class="pin"></i><div class="t-ico">${DISHES[o.dish].icon}</div><div class="t-name"></div><div class="t-who"></div><div class="t-bar"><b></b></div><div class="t-state"></div>`;
        /** @type {HTMLElement} */ (t.querySelector('.t-name')).textContent = `${o.qty > 1 ? `${o.qty}× ` : ''}${dishShort(o.dish)}`;
        /** @type {HTMLElement} */ (t.querySelector('.t-who')).textContent = `${o.vip ? '⭐ ' : ''}${short(o.user.name)}`;
        tickets.appendChild(t);
        ticketEls.set(o.id, t);
      }
      const bar = /** @type {HTMLElement} */ (t.querySelector('.t-bar b'));
      const state = /** @type {HTMLElement} */ (t.querySelector('.t-state'));
      if (o.state === 'cook' && !t.classList.contains('cook')) {
        t.classList.add('cook');
        state.textContent = '🔥 đang nấu';
        bar.style.transition = 'none';
        bar.style.width = `${Math.max(0, 100 - (o.left / o.ms) * 100)}%`;
        void bar.offsetWidth;
        bar.style.transition = `width ${o.left}ms linear`;
        bar.style.width = '100%';
      } else if (o.state !== 'cook') state.textContent = '⏳ chờ bếp';
    }
    const more = list.length - shown.length;
    /** @type {HTMLElement} */ (rail.querySelector('.rail-more')).textContent = more > 0 ? `+${more} đơn chờ` : '';
    rail.hidden = !list.length && !tickets.children.length;
  }

  /** The waiter brings `dish` to wherever `user` sits (seating them first if needed) */
  function bringDish(/** @type {User} */ user, /** @type {number} */ dish, /** @type {number} */ qty) {
    const occ = c.seatUser(user, false);
    if (!occ) return;
    for (let i = 0; i < Math.min(qty, 3); i++) {
      setTimeout(() => {
        const at = c.seatOf.get(user.id);
        if (at === undefined) return;
        const t = c.SEATS[at].table;
        c.serve(t, giftItem(2, DISHES[dish].icon), () => {
          c.sound?.clink(0.35);
          c.fxs.ring(wfx, c.TABLES[t].x, c.TABLES[t].y, '#ffd166', 40);
          for (const o of c.occupantsAt(t)) c.cheer(o, Math.random() * 300);
        });
      }, i * 700);
    }
  }

  // ---------------------------------------------------------------------------------------------- bill
  ui.insertAdjacentHTML('beforeend', '<div class="bill-card" id="bill-card" hidden></div><div class="lvup-card" id="lvup-card" hidden></div><div class="happy-pill" id="happy-pill" hidden></div><div class="game-panel" id="game-panel" hidden></div>');
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let billTimer;
  function showBill(/** @type {{ user: User; stats: { comments: number; dzo: number; orders: string[]; coins: number; gifts: number; level: number; xp: number } }} */ b) {
    const card = $('#bill-card');
    const s = b.stats;
    const lv = LEVELS[Math.max(0, (s.level || 1) - 1)];
    const rows = /** @type {Array<[string, string]>} */ ([
      [`💬 Bình luận × ${s.comments}`, '0đ'],
      [`🍻 Cụng ly dzô × ${s.dzo}`, '0đ'],
      [`🍽 Món: ${s.orders.length ? s.orders.slice(-3).join(', ') : 'chưa gọi'}`, '0đ'],
      [`🎁 Quà: ${s.coins} xu`, s.coins ? 'vô giá' : '0đ'],
      [`${lv.icon} Cấp: ${lv.name}`, `${s.xp} điểm`],
    ]);
    card.innerHTML = '<div class="b-head">🧾 HÓA ĐƠN · XỈN BIA</div><div class="b-who"></div><div class="b-rows"></div><div class="b-total"><span>TỔNG CỘNG</span><b>0đ</b></div><div class="b-note">Quán ảo, khỏi trả 😜 · bo bằng tim nha</div><div class="b-stamp">ĐÃ THANH TOÁN<br/>BẰNG NỤ CƯỜI</div>';
    /** @type {HTMLElement} */ (card.querySelector('.b-who')).textContent = `Khách: ${b.user.name}`;
    const box = /** @type {HTMLElement} */ (card.querySelector('.b-rows'));
    for (const [a, v] of rows) {
      const r = el('div', 'b-row');
      const x = el('span');
      x.textContent = a;
      const y = el('b');
      y.textContent = v;
      r.append(x, y);
      box.appendChild(r);
    }
    card.hidden = false;
    card.classList.remove('in');
    void card.offsetWidth;
    card.classList.add('in');
    c.sound?.ding(0.4);
    clearTimeout(billTimer);
    billTimer = setTimeout(() => (card.hidden = true), 8500);
    c.say(L.bill(b.user.name), true);
  }

  // ---------------------------------------------------------------------------------------------- level up
  function levelUp(/** @type {{ user: User; lv: number; name: string; icon: string }} */ e) {
    const occ = c.seatUser(e.user, false);
    if (occ) {
      const badge = occ.el.querySelector('.lvb');
      if (badge) badge.textContent = e.icon;
      else occ.el.querySelector('.name-tag')?.insertAdjacentHTML('afterbegin', `<span class="lvb">${e.icon}</span>`);
      occ.el.classList.add('glow');
      setTimeout(() => occ.el.classList.remove('glow'), 5000);
      const hd = c.headOf(occ.seat);
      c.fxs.ring(wfx, hd.x, hd.y + 2, '#ffd166', 60);
      c.fxs.sparkles(wfx, hd.x, hd.y, 12, 30);
      c.fxs.floatUp(wfx, hd.x, hd.y, [e.icon, '⬆️', '✨'], 15);
      c.cheer(occ);
    }
    const card = $('#lvup-card');
    card.innerHTML = '<span class="ic"></span><span class="tx"><small>LÊN CẤP!</small><b></b></span>';
    /** @type {HTMLElement} */ (card.querySelector('.ic')).textContent = e.icon;
    /** @type {HTMLElement} */ (card.querySelector('.tx b')).textContent = `${short(e.user.name)} → ${e.name}`;
    card.hidden = false;
    card.classList.remove('in');
    void card.offsetWidth;
    card.classList.add('in');
    setTimeout(() => (card.hidden = true), 4500);
    c.sound?.ding(0.45);
    if (e.lv >= 4) c.fxs.fireworks(fx, e.lv >= 6 ? 6 : 3);
    c.say(L.levelUp(e.user.name, e.name), e.lv >= 3);
  }

  // ---------------------------------------------------------------------------------------------- events
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let happyTick;
  function happy(/** @type {number} */ ms, announce = true) {
    const pill = $('#happy-pill');
    const end = Date.now() + ms;
    c.stage.classList.add('happy');
    pill.hidden = false;
    clearInterval(happyTick);
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      pill.textContent = `⏰ GIỜ VÀNG x2 ĐIỂM · ${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`;
      if (left <= 0) {
        clearInterval(happyTick);
        pill.hidden = true;
        c.stage.classList.remove('happy');
        if (announce) c.say(L.happyEnd());
      }
    };
    tick();
    happyTick = setInterval(tick, 1000);
    if (announce) {
      c.fxs.confetti(50);
      c.fxs.beams(fx, 4000, ['rgba(255, 214, 120, 0.4)', 'rgba(255, 236, 170, 0.3)']);
      c.sound?.ding(0.5);
      c.say(L.happy(), true);
    }
  }

  function blackout(/** @type {number} */ ms) {
    const b = el('div', 'blackout');
    b.innerHTML = '<div class="torch"></div>';
    c.stage.appendChild(b);
    c.sound?.powerOff(0.6);
    c.sign.classList.add('off');
    c.say(L.blackout(), true);
    const all = c.everyone();
    all.forEach((o, i) => i % 3 === 0 && setTimeout(() => c.bubble(o, ['😱', 'Ai tắt đèn?', 'Á!', 'Mồi tui đâu?', '🔦'][i % 5], 2500), 300 + i * 80));
    setTimeout(() => {
      b.classList.add('flicker');
      setTimeout(() => {
        b.remove();
        c.sign.classList.remove('off');
        c.say(L.blackoutEnd());
      }, 900);
    }, ms - 900);
  }

  function storm(/** @type {number} */ ms) {
    const s = el('div', 'storm');
    s.innerHTML = '<div class="rain r1"></div><div class="rain r2"></div><div class="bolt"></div>';
    fx.appendChild(s);
    c.say(L.storm(), true);
    const bolt = /** @type {HTMLElement} */ (s.querySelector('.bolt'));
    const strike = () => {
      if (!s.isConnected) return;
      bolt.classList.remove('go');
      void bolt.offsetWidth;
      bolt.classList.add('go');
      setTimeout(() => c.sound?.thunder(0.6), 350);
      setTimeout(strike, 5000 + Math.random() * 6000);
    };
    setTimeout(strike, 1500);
    setTimeout(() => {
      s.classList.add('out');
      setTimeout(() => s.remove(), 1500);
      c.say(L.stormEnd());
    }, ms - 1500);
  }

  const VENDOR = /** @type {Record<string, [string, string]>} */ ({
    dau: ['🥜', 'Đậu phộng rang nóng đây!'],
    bap: ['🌽', 'Bắp nướng mỡ hành đây!'],
    kem: ['🍦', 'Kem đây, kem mát lạnh đây!'],
    keo: ['🍬', 'Kẹo kéo đây, kẹo kéo!'],
  });
  function vendor(/** @type {number} */ ms, /** @type {string} */ kind) {
    const [item, call] = VENDOR[kind] ?? VENDOR.dau;
    const y = 75;
    const w = el('div', 'person npc walking vendor');
    w.style.width = `${personWidth(scaleAt(y))}%`;
    w.style.top = `${y}%`;
    w.style.zIndex = String(y * 10 + 5);
    w.innerHTML = `<div class="vendor-item">${item}</div><div class="bubble"></div><div class="sprite">${customerSVG(hash(kind) + 7, { npc: true })}</div>`;
    floor.appendChild(w);
    const bub = /** @type {HTMLElement} */ (w.querySelector('.bubble'));
    const shout = () => {
      bub.textContent = call;
      bub.classList.remove('show');
      void bub.offsetWidth;
      bub.classList.add('show');
      if (kind === 'kem') c.sound?.bell(0.3);
    };
    shout();
    const again = setInterval(shout, 4500);
    w.animate([{ left: '-8%' }, { left: '108%' }], { duration: ms, easing: 'linear', fill: 'forwards' }).onfinish = () => {
      clearInterval(again);
      w.remove();
    };
    c.say(L.vendor(kind));
  }

  function karaoke(/** @type {number} */ ms) {
    const busy = c.TABLES.filter((t) => c.occupantsAt(t.id).length >= 2);
    const t = busy[Math.floor(Math.random() * busy.length)] ?? c.TABLES[Math.floor(Math.random() * c.TABLES.length)];
    const tag = el('div', 'karaoke-tag');
    tag.textContent = '🎤 KARAOKE';
    tag.style.left = `${t.x}%`;
    tag.style.top = `${t.y - 9}%`;
    wfx.appendChild(tag);
    const singers = c.occupantsAt(t.id);
    for (const o of singers) o.el.classList.add('singing');
    const notes = setInterval(() => c.fxs.floatUp(wfx, t.x + (Math.random() - 0.5) * 6, t.y - 6, [['🎵', '🎶', '🎤', '🎼'][Math.floor(Math.random() * 4)]], 12), 700);
    c.say(L.karaoke());
    setTimeout(() => {
      clearInterval(notes);
      tag.remove();
      for (const o of singers) o.el.classList.remove('singing');
      for (const o of c.everyone()) if (Math.random() < 0.4) c.cheer(o, Math.random() * 600);
    }, ms);
  }

  // ---------------------------------------------------------------------------------------------- games
  const panel = $('#game-panel');
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let gameTick;
  let gameEnd = 0;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let panelHide;
  const clock = () => {
    const left = Math.max(0, gameEnd - Date.now());
    const t = panel.querySelector('.g-time');
    if (t) t.textContent = `${Math.ceil(left / 1000)}s`;
  };
  function renderGame(/** @type {any} */ g) {
    if (!g) {
      panel.hidden = true;
      return;
    }
    clearTimeout(panelHide);
    gameEnd = Date.now() + g.endsIn;
    panel.hidden = false;
    panel.className = `game-panel ${g.kind}`;
    if (g.kind === 'guess') {
      const span = g.max - 1 || 1;
      panel.innerHTML = `<div class="g-head"><b>🔢 ĐOÁN SỐ</b><span class="g-time"></span></div>
        <div class="g-rule">Gõ một số từ <b>${g.lo}</b> đến <b>${g.hi}</b> · trúng được 50 điểm</div>
        <div class="g-range"><i style="left:${((g.lo - 1) / span) * 100}%;right:${100 - ((g.hi - 1) / span) * 100}%"></i></div>
        <div class="g-last"></div>`;
      const last = /** @type {HTMLElement} */ (panel.querySelector('.g-last'));
      for (const x of g.last || []) {
        const chip = el('span', x.hint);
        chip.textContent = `${short(x.name)} ${x.n} ${x.hint === 'up' ? '⬆️' : '⬇️'}`;
        last.appendChild(chip);
      }
    } else {
      const total = g.a + g.b || 1;
      const pos = 50 + ((g.b - g.a) / total) * 40;
      panel.innerHTML = `<div class="g-head"><b>🪢 KÉO CO</b><span class="g-time"></span></div>
        <div class="g-teams"><span class="ta">🐚 Đội Ốc <small>gõ 1</small> <b>${g.a}</b></span><span class="tb"><b>${g.b}</b> <small>gõ 2</small> Đội Mực 🦑</span></div>
        <div class="g-rope"><i class="mid"></i><span class="knot" style="left:${pos}%">🎀</span></div>
        <div class="g-rule">Gõ càng nhiều kéo càng mạnh · tặng quà kéo cực mạnh · đội thắng +10 điểm</div>`;
    }
    clock();
    clearInterval(gameTick);
    gameTick = setInterval(clock, 500);
  }
  function endGame(/** @type {any} */ e) {
    clearInterval(gameTick);
    panel.hidden = false;
    panel.className = 'game-panel done';
    let text = '';
    if (e.kind === 'guess') {
      text = e.winner ? `🎉 ${short(e.winner.name)} đoán trúng số ${e.secret}! +50 điểm` : `⌛ Hết giờ! Số bí mật là ${e.secret}`;
      c.say(e.winner ? L.guessWin(e.winner.name, e.secret) : L.guessNone(e.secret), true);
      if (e.winner) {
        const occ = c.seatUser(e.winner, false);
        if (occ) {
          const hd = c.headOf(occ.seat);
          c.fxs.ring(wfx, hd.x, hd.y, '#ffd166', 60);
          c.fxs.floatUp(wfx, hd.x, hd.y, ['🎉', '🏆'], 15);
          c.cheer(occ);
        }
      }
    } else {
      const name = e.team === 'a' ? 'Ốc 🐚' : e.team === 'b' ? 'Mực 🦑' : '';
      text = name ? `🏆 Đội ${name} thắng! ${e.a} – ${e.b}` : `🤝 Hòa! ${e.a} – ${e.b}`;
      c.say(name ? L.tugWin(e.team === 'a' ? 'Ốc' : 'Mực') : L.tugDraw(), true);
    }
    panel.innerHTML = `<div class="g-result"></div>`;
    /** @type {HTMLElement} */ (panel.querySelector('.g-result')).textContent = text;
    c.fxs.confetti(60);
    c.fxs.fireworks(fx, 3);
    panelHide = setTimeout(() => (panel.hidden = true), 6000);
  }

  const HAND = /** @type {Record<string, string>} */ ({ kéo: '✌️', búa: '✊', bao: '✋' });
  function rps(/** @type {{ user: User; you: string; host: string; result: string }} */ e) {
    const occ = c.seatUser(e.user, false);
    const mark = e.result === 'win' ? '🎉' : e.result === 'lose' ? '😵' : '🤝';
    if (occ) {
      c.bubble(occ, `${HAND[e.you]} vs ${HAND[e.host]} ${mark}`, 4000);
      const hd = c.headOf(occ.seat);
      c.fxs.floatUp(wfx, hd.x, hd.y, [HAND[e.you], mark], 13);
    }
    if (quiet()) c.say(L.rps(e.user.name, e.you, e.host, e.result));
  }

  return {
    order(/** @type {{ order: { user: User; dish: number; qty: number; vip: boolean } }} */ e) {
      const o = e.order;
      const occ = c.seatUser(o.user, false);
      if (occ) c.bubble(occ, `🧾 ${DISHES[o.dish].icon} ${DISHES[o.dish].ten}`, 4000);
      c.sound?.pop(0.35);
      if (quiet() || o.vip) c.say(L.order(o.user.name, DISHES[o.dish].ten, o.qty, o.vip), o.vip);
    },
    orders: renderOrders,
    orderDone(/** @type {{ order: { id: string; user: User; dish: number; qty: number }; orders: any[] }} */ e) {
      const t = ticketEls.get(e.order.id);
      if (t) {
        t.classList.add('done');
        /** @type {HTMLElement} */ (t.querySelector('.t-state')).textContent = '✅ XONG!';
        setTimeout(() => {
          t.remove();
          ticketEls.delete(e.order.id);
          renderOrders(e.orders);
        }, 1400);
      }
      renderOrders(e.orders);
      c.sound?.ding(0.3);
      bringDish(e.order.user, e.order.dish, e.order.qty);
      if (quiet()) c.say(L.orderDone(e.order.user.name, DISHES[e.order.dish].ten));
    },
    orderNote(/** @type {{ kind: string; user: User }} */ e) {
      const occ = c.seatUser(e.user, false);
      if (occ) c.bubble(occ, e.kind === 'busy' ? '⏳ Món đang nấu…' : '🔥 Bếp cháy đơn!', 3000);
      if (quiet()) c.say(e.kind === 'busy' ? L.orderBusy(e.user.name) : L.orderFull());
    },
    bill: showBill,
    levelup: levelUp,
    event(/** @type {{ kind: string; ms: number; extra: string }} */ e) {
      if (c.smashing()) return;
      if (e.kind === 'happy') happy(e.ms);
      else if (e.kind === 'blackout') blackout(e.ms);
      else if (e.kind === 'storm') storm(e.ms);
      else if (e.kind === 'vendor') vendor(e.ms, e.extra);
      else if (e.kind === 'karaoke') karaoke(e.ms);
    },
    game(/** @type {any} */ g) {
      renderGame(g);
      if (g?.start) {
        c.sound?.ding(0.5);
        c.say(g.kind === 'guess' ? L.guessStart() : L.tugStart(), true);
      }
    },
    gameEnd: endGame,
    rps,
    /** A reloaded page catches up with what is going on */
    restore(/** @type {{ happyLeft: number; orders: any[]; game: any } | undefined} */ s) {
      if (!s) return;
      if (s.happyLeft > 0) happy(s.happyLeft, false);
      renderOrders(s.orders || []);
      renderGame(s.game);
    },
  };
}
