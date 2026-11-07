// @ts-check
// Âm thanh của trang stage: hàng chờ giọng đọc (TTS từ server), tiếng cụng ly, mở nắp, chuông vòng quay,
// tiếng quán ồn ào và nhạc nền. Chỉ trang ?view=stage tạo SoundEngine; dashboard và bản xem trước im lặng.

/** @typedef {{ voice: string; rate: number; music: boolean; musicVolume: number; musicTrack: string; ambience: boolean }} SoundSettings */

/** Background tracks: the quán nhậu one (made for this pub) and the old chill one */
const TRACKS = /** @type {Record<string, string>} */ ({ nhau: '/assets/audio/quan_nhau.mp3', chill: '/assets/audio/chill_relax.mp3' });

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
    const unlock = () => this.unlock();
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, unlock, { passive: true });
  }

  /** Called on the first click/key (browsers only allow sound after one) and by the dashboard */
  unlock() {
    this.audio();
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
    const text = this.priority.shift() ?? this.queue.shift();
    if (!text) {
      this.speaking = false;
      this.lastSpokeAt = Date.now();
      this.onSpeaking(false);
      this.duck(false);
      return;
    }
    this.speaking = true;
    this.onSpeaking(true);
    this.duck(true);
    const s = this.settings;
    const audio = new Audio(`/api/tts?voice=${s.voice}&rate=${s.rate}&text=${encodeURIComponent(text)}`);
    this.current = audio;
    this.brighten(audio);
    let done = false;
    const finish = (/** @type {number} */ pause) => {
      if (done) return;
      done = true;
      clearTimeout(this.watchdog);
      if (this.current === audio) this.current = null;
      audio.onended = audio.onerror = null;
      setTimeout(() => this.next(), pause);
    };
    audio.onended = () => finish(350);
    audio.onerror = () => finish(800); // TTS failed: skip this line, keep the queue moving
    // Watchdog: a stalled download or a lost "ended" event must never freeze the voice for the rest of the live
    this.watchdog = setTimeout(() => {
      audio.pause();
      finish(200);
    }, 12000 + text.length * 120);
    audio.play().catch((err) => {
      if (err?.name === 'NotAllowedError') {
        // No click yet: keep the line and wait for unlock()
        done = true;
        clearTimeout(this.watchdog);
        this.priority.unshift(text);
        this.speaking = false;
        this.onSpeaking(false);
        this.duck(false);
        this.setBlocked(true);
      } else finish(800);
    });
  }

  /**
   * Voice polish: cut low rumble, lift the "presence" and "air" bands that make speech sound clear instead of muffled,
   * then a gentle compressor so every line has the same loudness. Skipped when the audio context isn't running
   * (a media element routed into a suspended context would be silent).
   */
  brighten(/** @type {HTMLAudioElement} */ audio) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
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
    } catch {
      // already routed or unsupported: the plain audio element still plays
    }
  }

  /** Stop talking now and forget what was waiting */
  hush() {
    this.queue = [];
    this.priority = [];
    this.current?.pause();
    this.next();
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

  /** @private smaller bang after the big one */
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

  /** Clicks slowing down while the wheel spins for `seconds` */
  wheelTicks(seconds = 3.2, volume = 0.3) {
    const ctx = this.audio();
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    let t = 0;
    let gap = 0.05;
    while (t < seconds) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 1800;
      g.gain.setValueAtTime(volume * 0.25, t0 + t);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + 0.02);
      o.connect(g).connect(this.sfxBus);
      o.start(t0 + t);
      o.stop(t0 + t + 0.03);
      t += gap;
      gap *= 1.07;
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
