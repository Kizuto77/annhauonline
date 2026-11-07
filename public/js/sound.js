// @ts-check
// Âm thanh của trang stage: hàng chờ giọng đọc (TTS từ server), tiếng cụng ly, mở nắp, đập quán,
// tiếng quán ồn ào và nhạc nền. Chỉ trang ?view=stage tạo SoundEngine; dashboard và bản xem trước im lặng.

/** @typedef {{ voice: string; rate: number; music: boolean; musicVolume: number; musicTrack: string; ambience: boolean }} SoundSettings */

/** Background tracks: the quán nhậu one (made for this pub) and the old chill one */
const TRACKS = /** @type {Record<string, string>} */ ({ nhau: '/assets/audio/quan_nhau.mp3', chill: '/assets/audio/chill_relax.mp3' });

/** How long one line may take to come back from the server before it is given up on */
const FETCH_MS = 22_000;
/** The voice is stuck if the player has not moved for this long */
const STALL_MS = 4000;

export class SoundEngine {
  /** @type {AudioContext | null} */
  ctx = null;
  /** @type {GainNode | null} */
  sfxBus = null;
  /** @type {string[]} */
  queue = [];
  /** @type {string[]} */
  priority = []; // gift thanks and "Đọc ngay": read right after the line playing now
  speaking = false;
  blocked = false; // the browser refused to play sound until someone clicks the page
  lastSpokeAt = Date.now();
  /** @type {HTMLAudioElement | null} */
  current = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  watchdog;
  /** Lines already made by the server and waiting as an mp3: the next line starts the moment this one ends */
  /** @type {Map<string, { url: string; at: number }>} */
  ready = new Map();
  /** @type {Set<string>} */
  fetching = new Set();
  /** Lines the voice service could not make: tried twice, then dropped so the queue never jams on one line */
  /** @type {Map<string, number>} */
  failed = new Map();
  /** The player that goes through the voice polish, and the plain one for when the audio context is asleep */
  fxAudio = new Audio();
  plainAudio = new Audio();
  fxReady = false;
  /** Everything the watchdog needs to tell "still talking" from "stuck" */
  playedAt = 0;
  playedTime = 0;
  /** @type {number} */
  lineStartedAt = 0;
  /** @type {SoundSettings} */
  settings = { voice: 'female_cute', rate: 1.05, music: true, musicVolume: 0.22, musicTrack: 'nhau', ambience: true };
  music = new Audio(TRACKS.nhau);
  /** @type {{ gain: GainNode; stop: () => void } | null} */
  ambienceNodes = null;
  /** @type {(speaking: boolean) => void} */
  onSpeaking = () => {};
  /** @type {(blocked: boolean) => void} */
  onBlocked = () => {};

  constructor() {
    this.music.loop = true;
    this.music.preload = 'auto';
    for (const a of [this.fxAudio, this.plainAudio]) a.preload = 'auto';
    const unlock = () => this.unlock();
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, unlock, { passive: true });
    // Chốt an toàn cho cả buổi live: không bao giờ để giọng đọc chết hẳn vì một câu bị kẹt
    setInterval(() => this.guard(), 900);
  }

  /**
   * Watchdog của hàng chờ: nếu đang "nói" mà máy phát không nhích thêm giây nào (mạng treo, mất event 'ended',
   * LIVE Studio tạm dừng tab) thì bỏ câu đó và đọc tiếp. Nếu đang rảnh mà vẫn còn câu chờ thì khởi động lại.
   */
  guard() {
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
    const now = Date.now();
    if (this.speaking) {
      const a = this.current;
      if (!a) return void this.skip();
      if (a.currentTime > this.playedTime + 0.05) {
        this.playedTime = a.currentTime;
        this.playedAt = now;
        return;
      }
      if (a.paused && !a.ended && now - this.playedAt > 700) a.play().catch(() => {});
      if (now - this.playedAt > STALL_MS) this.skip();
      return;
    }
    if (!this.blocked && this.waiting() > 0 && now - this.lastSpokeAt > 1500) this.next();
  }

  /** Bỏ câu đang kẹt, đọc câu kế tiếp */
  skip() {
    const a = this.current;
    this.current = null;
    if (a) {
      try {
        a.pause();
        a.removeAttribute('src');
      } catch {
        // ignore
      }
    }
    clearTimeout(this.watchdog);
    this.speaking = false;
    this.onSpeaking(false);
    this.next();
  }

  // ---------------------------------------------------------------- lines made ahead of time

  key(/** @type {string} */ text) {
    const s = this.settings;
    return `${s.voice}|${s.rate}|${text}`;
  }
  url(/** @type {string} */ text) {
    const s = this.settings;
    return `/api/tts?voice=${encodeURIComponent(s.voice)}&rate=${s.rate}&text=${encodeURIComponent(text)}`;
  }
  /**
   * Ask the server for a line now and keep the mp3 in hand. The pub talks a lot, and waiting for the voice
   * service only when the line is needed is what leaves those long silences between comments.
   */
  prefetch(/** @type {string} */ text) {
    const k = this.key(text);
    if (!text || this.ready.has(k) || this.fetching.has(k)) return;
    this.fetching.add(k);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), FETCH_MS);
    fetch(this.url(text), { signal: ctl.signal })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`TTS ${r.status}`))))
      .then((b) => {
        this.ready.set(k, { url: URL.createObjectURL(b), at: Date.now() });
        this.failed.delete(k);
        this.trimReady();
        if (this.speaking || this.blocked) return;
        if (this.waiting() > 0) this.next(); // câu đã sẵn sàng mà đang im: đọc luôn
      })
      .catch(() => {
        this.failed.set(k, (this.failed.get(k) ?? 0) + 1);
        if (this.failed.size > 50) this.failed.delete(this.failed.keys().next().value ?? '');
        if (!this.speaking && !this.blocked && this.waiting() > 0) setTimeout(() => this.next(), 600);
      })
      .finally(() => {
        clearTimeout(timer);
        this.fetching.delete(k);
      });
  }
  /** Keep only a few lines in memory (each one is an object URL that must be given back) */
  trimReady() {
    while (this.ready.size > 8) {
      const [k, v] = /** @type {[string, { url: string; at: number }]} */ (this.ready.entries().next().value);
      this.ready.delete(k);
      URL.revokeObjectURL(v.url);
    }
  }
  take(/** @type {string} */ text) {
    const k = this.key(text);
    const hit = this.ready.get(k);
    if (!hit) return '';
    this.ready.delete(k);
    return hit.url;
  }
  /** Start making the next couple of lines while this one is still being read */
  warmNext() {
    for (const t of [...this.priority, ...this.queue].slice(0, 2)) this.prefetch(t);
  }

  /** Called on the first click/key (browsers only allow sound after one) and by the dashboard */
  unlock() {
    this.audio();
    this.loadDzo();
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
    this.applyMusic();
    this.applyAmbience();
    if (this.blocked) {
      this.setBlocked(false);
      if (!this.speaking) this.next();
    }
  }

  setBlocked(/** @type {boolean} */ b) {
    if (this.blocked === b) return;
    this.blocked = b;
    this.onBlocked(b);
  }

  audio() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.9;
        this.sfxBus.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  /** @param {Partial<SoundSettings>} s */
  apply(s) {
    // đổi giọng hay tốc độ: mp3 đã làm sẵn theo giọng cũ không dùng được nữa
    if ((s.voice && s.voice !== this.settings.voice) || (s.rate && s.rate !== this.settings.rate)) {
      for (const v of this.ready.values()) URL.revokeObjectURL(v.url);
      this.ready.clear();
    }
    const src = TRACKS[s.musicTrack ?? this.settings.musicTrack] ?? TRACKS.nhau;
    if (!this.music.src.endsWith(src)) {
      // new track: start it from the top, the play below picks it up
      this.music.pause();
      this.music.src = src;
    }
    Object.assign(this.settings, s);
    this.applyMusic();
    this.applyAmbience();
  }

  // ------------------------------------------------------------------ voice

  /** Queue a line (or several, read in order). `first` puts them ahead of everything waiting. */
  say(/** @type {string | string[]} */ text, first = false) {
    // every sentence starts with a capital ("bạn Lan tặng…" -> "Bạn Lan tặng…"): the voice reads it as a new sentence
    const items = (Array.isArray(text) ? text : [text])
      .map((t) => t.trim().replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_, p, c) => p + c.toUpperCase()))
      .filter(Boolean);
    if (!items.length) return;
    if (first) this.priority.push(...items);
    else this.queue.push(...items);
    // Never let a flood pile up minutes of talking: oldest normal lines go first
    if (this.queue.length > 12) this.queue.splice(0, this.queue.length - 12);
    this.warmNext();
    if (!this.speaking && !this.blocked) this.next();
  }

  /** Lines waiting (not counting the one playing) */
  waiting() {
    return this.queue.length + this.priority.length;
  }

  /** How long the voice has been quiet (0 while speaking) */
  quietFor() {
    return this.speaking ? 0 : Date.now() - this.lastSpokeAt;
  }

  next() {
    clearTimeout(this.watchdog);
    const text = this.priority[0] ?? this.queue[0];
    if (!text) {
      this.speaking = false;
      this.lastSpokeAt = Date.now();
      this.onSpeaking(false);
      this.duck(false);
      return;
    }
    // Giọng đọc lỗi hai lần (hết lượt API, sai key, mất mạng): bỏ câu đó, quán vẫn nói tiếp những câu sau
    if ((this.failed.get(this.key(text)) ?? 0) >= 2) {
      this.failed.delete(this.key(text));
      if (this.priority[0] === text) this.priority.shift();
      else this.queue.shift();
      return this.next();
    }
    // Câu nào chưa có mp3 thì nhờ server làm rồi chờ: không phát nửa câu, không bỏ câu vì mạng chậm
    const src = this.take(text);
    if (!src) {
      this.prefetch(text);
      this.speaking = false;
      this.onSpeaking(false);
      this.duck(false);
      return;
    }
    if (this.priority[0] === text) this.priority.shift();
    else this.queue.shift();
    this.speaking = true;
    this.onSpeaking(true);
    this.duck(true);
    this.warmNext();

    const audio = this.player();
    this.current = audio;
    this.playedAt = Date.now();
    this.playedTime = 0;
    this.lineStartedAt = Date.now();
    let done = false;
    const finish = (/** @type {number} */ pause) => {
      if (done) return;
      done = true;
      clearTimeout(this.watchdog);
      URL.revokeObjectURL(src);
      if (this.current === audio) this.current = null;
      audio.onended = audio.onerror = null;
      this.lastSpokeAt = Date.now();
      setTimeout(() => this.next(), pause);
    };
    audio.onended = () => finish(320);
    audio.onerror = () => finish(500); // câu lỗi thì bỏ, hàng chờ vẫn chạy
    // Chặn cuối: dài hơn câu nói dài nhất, chỉ để không bao giờ treo vĩnh viễn (guard() lo phần kẹt giữa câu)
    this.watchdog = setTimeout(() => {
      audio.pause();
      finish(200);
    }, 45_000);
    audio.src = src;
    audio.play().catch((err) => {
      if (err?.name === 'NotAllowedError') {
        // Chưa ai bấm vào trang: giữ lại câu, chờ unlock()
        done = true;
        clearTimeout(this.watchdog);
        this.ready.set(this.key(text), { url: src, at: Date.now() });
        this.priority.unshift(text);
        this.current = null;
        this.speaking = false;
        this.onSpeaking(false);
        this.duck(false);
        this.setBlocked(true);
      } else finish(500);
    });
  }

  /**
   * The player for this line: the polished one when the audio context is awake, the plain one otherwise. Both are
   * reused for every line — a new <audio> plus a new filter chain per line piled up hundreds of audio nodes over a
   * long live and that is what made the voice crackle, then stick.
   */
  player() {
    const ctx = this.ctx;
    if (ctx && ctx.state === 'running') {
      if (!this.fxReady) this.fxReady = this.brighten(this.fxAudio);
      if (this.fxReady) {
        try {
          this.plainAudio.pause();
        } catch {
          // ignore
        }
        return this.fxAudio;
      }
    }
    return this.plainAudio;
  }

  /**
   * Voice polish, wired once: cut low rumble, lift the "presence" and "air" bands that make speech sound clear
   * instead of muffled, then a gentle compressor so every line has the same loudness.
   * @returns {boolean} whether the chain is in place
   */
  brighten(/** @type {HTMLAudioElement} */ audio) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return false;
    try {
      const src = ctx.createMediaElementSource(audio);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 90;
      const mud = ctx.createBiquadFilter();
      mud.type = 'peaking';
      mud.frequency.value = 320;
      mud.gain.value = -2.5;
      const presence = ctx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 3200;
      presence.Q.value = 0.9;
      presence.gain.value = 4;
      const air = ctx.createBiquadFilter();
      air.type = 'highshelf';
      air.frequency.value = 7000;
      air.gain.value = 4.5;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 3;
      comp.attack.value = 0.005;
      comp.release.value = 0.18;
      const out = ctx.createGain();
      out.gain.value = 1.25;
      src.connect(hp).connect(mud).connect(presence).connect(air).connect(comp).connect(out).connect(ctx.destination);
      return true;
    } catch {
      // already routed or unsupported: the plain audio element still plays
      return false;
    }
  }

  /** Stop talking now and forget what was waiting */
  hush() {
    this.queue = [];
    this.priority = [];
    clearTimeout(this.watchdog);
    const a = this.current;
    this.current = null;
    if (a) {
      a.onended = a.onerror = null;
      try {
        a.pause();
      } catch {
        // ignore
      }
    }
    this.speaking = false;
    this.lastSpokeAt = Date.now();
    this.onSpeaking(false);
    this.duck(false);
  }

  // ------------------------------------------------------------------ music and the noise of the quán

  duck(/** @type {boolean} */ on) {
    const v = this.settings.musicVolume * (on ? 0.35 : 1);
    this.music.volume = Math.max(0, Math.min(1, v));
    if (this.ambienceNodes && this.ctx) this.ambienceNodes.gain.gain.setTargetAtTime(on ? 0.35 : 1, this.ctx.currentTime, 0.3);
  }

  applyMusic() {
    this.music.volume = Math.max(0, Math.min(1, this.settings.musicVolume * (this.speaking ? 0.35 : 1)));
    if (this.settings.music && this.settings.musicVolume > 0) {
      if (this.music.paused) this.music.play().catch(() => this.setBlocked(true));
    } else this.music.pause();
  }

  applyAmbience() {
    const ctx = this.ctx;
    if (!this.settings.ambience) {
      this.ambienceNodes?.stop();
      this.ambienceNodes = null;
      return;
    }
    if (!ctx || this.ambienceNodes || ctx.state !== 'running') return;
    this.ambienceNodes = crowdMurmur(ctx);
  }

  // ------------------------------------------------------------------ effects (all synthesized, no files)

  /** Two glasses touching: a bright, slightly detuned ring */
  clink(volume = 0.5, delay = 0) {
    const ctx = this.audio();
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    const t0 = ctx.currentTime + delay;
    const out = ctx.createGain();
    out.gain.value = volume;
    out.connect(this.sfxBus);
    for (const [hit, base] of [
      [0, 2400 + Math.random() * 300],
      [0.035, 2900 + Math.random() * 300],
    ]) {
      for (const [mult, amp, decay] of [
        [1, 0.32, 0.55],
        [1.63, 0.18, 0.4],
        [2.71, 0.1, 0.25],
      ]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = base * mult;
        g.gain.setValueAtTime(0, t0 + hit);
        g.gain.linearRampToValueAtTime(amp, t0 + hit + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + hit + decay);
        o.connect(g).connect(out);
        o.start(t0 + hit);
        o.stop(t0 + hit + decay + 0.05);
      }
    }
  }

  /** @type {AudioBuffer[]} the recorded-style clinks of two bia hơi glasses (tools/tieng-dzo.py) */
  dzoBuffers = [];
  dzoLoading = false;
  loadDzo() {
    const ctx = this.ctx;
    if (!ctx || this.dzoLoading || this.dzoBuffers.length) return;
    this.dzoLoading = true;
    Promise.all([1, 2, 3].map((k) => fetch(`/assets/audio/dzo${k}.mp3`).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b))))
      .then((bufs) => (this.dzoBuffers = bufs))
      .catch(() => (this.dzoLoading = false));
  }
  /** Two thick glasses clinking for "dzô" (falls back to the synthesized clink until the files are in) */
  dzo(volume = 0.7, delay = 0) {
    const ctx = this.audio();
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    if (!this.dzoBuffers.length) {
      this.loadDzo();
      return this.clink(volume * 0.8, delay);
    }
    const src = ctx.createBufferSource();
    src.buffer = this.dzoBuffers[Math.floor(Math.random() * this.dzoBuffers.length)];
    src.playbackRate.value = 0.94 + Math.random() * 0.12;
    const g = ctx.createGain();
    g.gain.value = volume;
    src.connect(g).connect(this.sfxBus);
    src.start(ctx.currentTime + delay);
  }

  /** Cả quán bị đập: tiếng rầm, ly chén vỡ loảng xoảng */
  crash(volume = 0.8) {
    const ctx = this.audio();
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = volume;
    out.connect(this.sfxBus);
    // noise burst through a falling low-pass = wood and crockery smashing
    const len = Math.floor(ctx.sampleRate * 1.1);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(5200, t0);
    lp.frequency.exponentialRampToValueAtTime(500, t0 + 1);
    src.connect(lp).connect(out);
    src.start(t0);
    // thud
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, t0);
    o.frequency.exponentialRampToValueAtTime(38, t0 + 0.5);
    g.gain.setValueAtTime(0.9, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    o.connect(g).connect(out);
    o.start(t0);
    o.stop(t0 + 0.65);
    for (let i = 0; i < 7; i++) this.clink(0.35, 0.05 + i * 0.09 + Math.random() * 0.06);
    for (let i = 0; i < 3; i++) setTimeout(() => this.crashHit(0.5), 350 + i * 330);
  }

  /** smaller bang (after the big one, or one table going over) */
  crashHit(volume = 0.5) {
    const ctx = this.audio();
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.25);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700 + Math.random() * 900;
    const g = ctx.createGain();
    g.gain.value = volume;
    src.connect(bp).connect(g).connect(this.sfxBus);
    src.start(t0);
  }

  /** Many glasses at once plus a short crowd "dzô" */
  cheers(volume = 0.6) {
    const ctx = this.audio();
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    for (let i = 0; i < 6; i++) this.clink(volume * (0.4 + Math.random() * 0.4), i * 0.07 + Math.random() * 0.05);
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 1.2);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(volume * 0.5, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.1);
    src.connect(bp).connect(g).connect(this.sfxBus);
    src.start(t0);
  }

  /** Bottle cap pop and fizz (gift arrives) */
  pop(volume = 0.6) {
    const ctx = this.audio();
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(900, t0);
    o.frequency.exponentialRampToValueAtTime(180, t0 + 0.07);
    g.gain.setValueAtTime(volume, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    o.connect(g).connect(this.sfxBus);
    o.start(t0);
    o.stop(t0 + 0.1);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 1.4);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 4500;
    const fg = ctx.createGain();
    fg.gain.setValueAtTime(volume * 0.25, t0 + 0.05);
    fg.gain.exponentialRampToValueAtTime(0.001, t0 + 1.3);
    src.connect(hp).connect(fg).connect(this.sfxBus);
    src.start(t0 + 0.05);
  }

  /** Bright "ting" (wheel result, flower rain) */
  /** Far rumbling thunder: low noise swelling and fading */
  thunder(volume = 0.7) {
    const ctx = this.audio();
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 3.2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t0);
    lp.frequency.exponentialRampToValueAtTime(140, t0 + 2.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(volume, t0 + 0.08);
    g.gain.setValueAtTime(volume * 0.6, t0 + 0.4);
    g.gain.linearRampToValueAtTime(volume * 0.9, t0 + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3);
    src.connect(lp).connect(g).connect(this.sfxBus);
    src.start(t0);
  }
  /** Lights go out: a click and a falling hum */
  powerOff(volume = 0.5) {
    const ctx = this.audio();
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(120, t0);
    o.frequency.exponentialRampToValueAtTime(30, t0 + 0.6);
    g.gain.setValueAtTime(volume * 0.25, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    o.connect(g).connect(this.sfxBus);
    o.start(t0);
    o.stop(t0 + 0.65);
    this.pop(volume);
  }
  /** Vendor's little bell (kem tinh tinh) */
  bell(volume = 0.4) {
    for (let i = 0; i < 3; i++) setTimeout(() => this.ding(volume * (i === 2 ? 0.7 : 1)), i * 260);
  }
  ding(volume = 0.5) {
    const ctx = this.audio();
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    for (const [f, a, d] of [
      [1318.5, 0.35, 1.4],
      [1975.5, 0.2, 1],
      [2637, 0.12, 0.7],
    ]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(a * volume, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g).connect(this.sfxBus);
      o.start(t0);
      o.stop(t0 + d + 0.05);
    }
  }
}

/** @type {WeakMap<AudioContext, Map<number, AudioBuffer>>} */
const noiseCache = new WeakMap();
function noiseBuffer(/** @type {AudioContext} */ ctx, /** @type {number} */ seconds) {
  let m = noiseCache.get(ctx);
  if (!m) noiseCache.set(ctx, (m = new Map()));
  const cached = m.get(seconds);
  if (cached) return cached;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    // brown-ish noise: softer than white, closer to voices in a room
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  m.set(seconds, buf);
  return buf;
}

/**
 * A busy quán in the background: a few bands of noise whose loudness wobbles at talking speed (a murmur of
 * voices), and now and then a far-off glass or laugh-like burst. Very quiet; it ducks under the host's voice.
 */
function crowdMurmur(/** @type {AudioContext} */ ctx) {
  const master = ctx.createGain();
  master.gain.value = 1;
  const level = ctx.createGain();
  level.gain.value = 0.05;
  master.connect(level).connect(ctx.destination);
  /** @type {Array<AudioScheduledSourceNode>} */
  const sources = [];
  for (const [freq, rate, q] of [
    [420, 3.7, 2.5],
    [780, 4.6, 2.8],
    [1250, 5.3, 3.2],
    [600, 2.9, 2],
  ]) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 4);
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const amp = ctx.createGain();
    amp.gain.value = 0.55;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = rate;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.45;
    lfo.connect(lfoDepth).connect(amp.gain);
    src.connect(bp).connect(amp).connect(master);
    src.start(ctx.currentTime + Math.random());
    lfo.start();
    sources.push(src, lfo);
  }
  // Far-off glasses every few seconds
  let stopped = false;
  const far = () => {
    if (stopped) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 2200 + Math.random() * 1400;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.06, t0 + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + 0.4);
    setTimeout(far, 2500 + Math.random() * 6000);
  };
  setTimeout(far, 2000);
  return {
    gain: master,
    stop() {
      stopped = true;
      for (const s of sources) {
        try {
          s.stop();
        } catch {
          // already stopped
        }
      }
      level.disconnect();
    },
  };
}
