"""Tạo nhạc nền "quán nhậu" cho Xỉn Bia: đàn tranh, đàn bầu, mõ, nhịp remix quán, ngũ cung.

Toàn bộ do máy tổng hợp (không dùng bài hát hay mẫu âm thanh có sẵn), lặp liền mạch.
Chạy:  python tools/nhac-nhau.py   ->  public/assets/audio/quan_nhau.mp3   (cần numpy, scipy, ffmpeg)
"""
import os
import subprocess
import tempfile
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
BPM = 122
STEP = 60 / BPM / 4  # một nốt móc kép
BAR = 16
rng = np.random.default_rng(7)

# Bố cục: dạo đầu, điệp khúc đàn tranh, đoạn đàn bầu, nghỉ (mõ), lặp lại
SECTIONS = [('intro', 4), ('A', 8), ('B', 8), ('brk', 4), ('A', 8), ('B2', 8)]
TOTAL_BARS = sum(n for _, n in SECTIONS)
N = int(TOTAL_BARS * BAR * STEP * SR)
L = np.zeros(N)
R = np.zeros(N)
WET_L = np.zeros(N)  # gửi sang vang
WET_R = np.zeros(N)

CHORDS = {
    'A': ['Am', 'F', 'C', 'G'] * 2,
    'B': ['F', 'G', 'Em', 'Am', 'F', 'G', 'Am', 'Am'],
    'intro': ['Am', 'F', 'C', 'G'],
    'brk': ['Am', 'Am', 'F', 'G'],
}
CHORDS['B2'] = CHORDS['B']
TONES = {'Am': [57, 60, 64], 'F': [53, 57, 60], 'C': [48, 52, 55], 'G': [55, 59, 62], 'Em': [52, 55, 59]}
ROOT = {'Am': 45, 'F': 41, 'C': 48, 'G': 43, 'Em': 40}
PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81]  # La thứ ngũ cung: La Đô Rê Mi Sol


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def put(sig, start_s, pan=0.0, gain=1.0, wet=0.0):
    """Mix a mono signal in at `start_s` seconds (wraps round the end so the loop is seamless)."""
    i = int(start_s * SR)
    idx = (np.arange(len(sig)) + i) % N
    lg = gain * np.cos((pan + 1) * np.pi / 4) * 1.41
    rg = gain * np.sin((pan + 1) * np.pi / 4) * 1.41
    np.add.at(L, idx, sig * lg)
    np.add.at(R, idx, sig * rg)
    if wet:
        np.add.at(WET_L, idx, sig * lg * wet)
        np.add.at(WET_R, idx, sig * rg * wet)


def bend_curve(n, dur, orn):
    """Semitone offset over time for the ornaments: slide up into the note, vibrato (rung), bend up (luyến)"""
    t = np.arange(n) / SR
    c = np.zeros(n)
    if 'slide' in orn:
        c += np.where(t < 0.09, -2 * (1 - t / 0.09) ** 2, 0)
    if 'vib' in orn:
        depth = np.clip((t - 0.16) / 0.25, 0, 1) * 0.32
        c += depth * np.sin(2 * np.pi * 5.6 * t)
    if 'luyen' in orn:
        s = dur * 0.55
        c += np.clip((t - s) / 0.12, 0, 1) * 2 - np.clip((t - s - 0.2) / 0.12, 0, 1) * 2
    return c


def tranh(midi, dur, orn=''):
    """Đàn tranh: a bright plucked string, upper partials die first, pitch can bend"""
    ring = max(dur, 0.25) + 1.1
    n = int(ring * SR)
    t = np.arange(n) / SR
    f = hz(midi) * 2 ** (bend_curve(n, dur, orn) / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    out = np.zeros(n)
    for k in range(1, 9):
        inh = k * (1 + 0.0005 * k * k)
        out += (1 / k ** 1.05) * np.exp(-t * (2.2 + k * 1.7)) * np.sin(ph * inh + k)
    pluck = rng.standard_normal(n) * np.exp(-t * 250) * 0.25
    out = (out + pluck) * np.minimum(1, t / 0.003)
    return out * 0.32


def bau(midi, dur, prev=None):
    """Đàn bầu: one smooth string tone that glides from the previous note and sings with a deepening vibrato"""
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    semis = np.full(n, float(midi))
    if prev is not None:
        g = np.clip(t / 0.11, 0, 1)
        semis = prev + (midi - prev) * (1 - (1 - g) ** 2)
    vib = np.clip((t - 0.2) / 0.4, 0, 1) * 0.38 * np.sin(2 * np.pi * 5.2 * t)
    f = hz(semis + vib)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.22 * np.sin(2 * ph + 0.3) + 0.07 * np.sin(3 * ph) + 0.03 * np.sin(5 * ph)
    env = np.minimum(1, t / 0.05) * np.exp(-t * 0.35) * np.clip((dur + 0.25 - t) / 0.25, 0, 1)
    return tone * env * 0.26


def bass(midi, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * hz(midi) * t
    tone = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    return tone * np.minimum(1, t / 0.004) * np.exp(-t * 6) * 0.5


def kick():
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    f = 48 + 110 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = rng.standard_normal(n) * np.exp(-t * 400) * 0.15
    return (body + click) * 0.85


def noise_hit(dur, lo, hi, decay):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sos = butter(2, [lo, hi], btype='band', fs=SR, output='sos')
    return sosfilt(sos, rng.standard_normal(n)) * np.exp(-t * decay)


def clap():
    c = np.zeros(int(0.3 * SR))
    for k, d in enumerate([0, 0.011, 0.022]):
        h = noise_hit(0.26 - d, 900, 3200, 18 if k == 2 else 60)
        c[int(d * SR):int(d * SR) + len(h)] += h
    return c * 0.55


def hat(open_=False):
    return noise_hit(0.18 if open_ else 0.05, 6000, 15000, 22 if open_ else 90) * (0.28 if open_ else 0.16)


def mo(pitch=1.0):
    """Mõ gỗ: short hollow knock"""
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 830 * pitch * t) + 0.5 * np.sin(2 * np.pi * 1390 * pitch * t)
    return s * np.exp(-t * 55) * 0.42


def pad(chord, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for m in TONES[chord]:
        for det in (-0.07, 0.07):
            ph = 2 * np.pi * hz(m + 12 + det) * t
            out += np.sin(ph) + 0.25 * np.sin(2 * ph)
    env = np.minimum(1, t / 0.35) * np.clip((dur - t) / 0.3, 0, 1)
    return out * env * 0.035


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    chunk = 2048
    for i in range(0, n, chunk):
        lo = 300 + 6000 * (i / n) ** 2
        sos = butter(2, [lo, lo * 2.2], btype='band', fs=SR, output='sos')
        out[i:i + chunk] = sosfilt(sos, rng.standard_normal(min(chunk, n - i)))
    return out * (t / dur) ** 2 * 0.25


# ------------------------------------------------------------------------------------------- melodies
# (bước bắt đầu, nốt, số bước, luyến láy) — bước = nốt móc kép, 16 bước một ô nhịp
MEL_A = [
    (0, 76, 3, 'slide'), (3, 74, 1, ''), (4, 72, 2, ''), (6, 69, 2, ''), (8, 72, 4, 'vib'), (12, 74, 2, ''), (14, 76, 2, ''),
    (16, 74, 3, ''), (19, 72, 1, ''), (20, 69, 4, 'vib'), (24, 67, 2, ''), (26, 69, 2, ''), (28, 72, 4, 'luyen'),
    (32, 76, 2, ''), (34, 79, 2, 'slide'), (36, 76, 2, ''), (38, 74, 2, ''), (40, 72, 4, 'vib'), (44, 74, 2, ''), (46, 72, 2, ''),
    (48, 74, 6, 'slide vib'), (56, 67, 2, ''), (58, 69, 2, ''), (60, 72, 2, ''), (62, 74, 2, ''),
    (64, 76, 3, 'slide'), (67, 79, 1, ''), (68, 76, 2, ''), (70, 74, 2, ''), (72, 72, 4, 'luyen'), (76, 69, 4, ''),
    (80, 72, 2, ''), (82, 74, 2, ''), (84, 72, 2, ''), (86, 69, 2, ''), (88, 67, 4, 'vib'), (92, 69, 4, ''),
    (96, 72, 2, ''), (98, 74, 2, ''), (100, 76, 4, 'vib'), (104, 79, 2, ''), (106, 76, 2, ''), (108, 74, 4, 'luyen'),
    (112, 74, 2, ''), (114, 72, 2, ''), (116, 69, 10, 'slide vib'),
]
MEL_B = [
    (0, 69, 6), (6, 72, 2), (8, 74, 8),
    (16, 76, 4), (20, 74, 4), (24, 72, 8),
    (32, 67, 4), (36, 69, 4), (40, 72, 8),
    (48, 69, 16),
    (64, 72, 6), (70, 74, 2), (72, 76, 8),
    (80, 79, 4), (84, 76, 4), (88, 74, 8),
    (96, 76, 4), (100, 74, 4), (104, 72, 4), (108, 74, 4),
    (112, 69, 16),
]
MEL_B2 = [(s, m + (12 if i in (8, 9, 10) else 0), d) for i, (s, m, d) in enumerate(MEL_B)]  # lần hai lên cao hơn


def drums(bar_t, full=True, mo_on=False, last=False):
    for b in range(4):
        put(kick(), bar_t + b * 4 * STEP, 0, 0.9)
    put(clap(), bar_t + 4 * STEP, 0.05, 0.8, 0.25)
    put(clap(), bar_t + 12 * STEP, 0.05, 0.8, 0.25)
    for s in range(16):
        if s % 4 == 2:
            put(hat(True), bar_t + s * STEP, 0.35, 1)
        elif full and s % 2 == 1:
            put(hat(), bar_t + s * STEP + 0.006, 0.35, 0.9)
    if mo_on:
        for s, p in [(0, 1), (3, 1), (6, 1.18), (10, 1), (12, 1.18)]:
            put(mo(p), bar_t + s * STEP, -0.45, 0.7, 0.2)
    if last:
        for s in (13, 14, 15):
            put(clap(), bar_t + s * STEP, 0, 0.6, 0.3)


def bassline(bar_t, chord, busy=True):
    r = ROOT[chord]
    steps = [(2, r), (6, r), (10, r), (14, r)] if not busy else [(0, r), (2, r + 12), (6, r), (8, r + 7), (10, r + 12), (14, r)]
    for s, m in steps:
        put(bass(m, STEP * 1.8), bar_t + s * STEP, 0, 0.75)


def arpeggio(bar_t, chord, gain=0.35, roll=False):
    tones = sorted({p for p in PENTA if any((p - c) % 12 == 0 for c in TONES[chord])})[:5]
    pattern = [0, 2, 1, 3, 2, 4, 3, 1] * 2
    for s in range(16):
        if roll or s % 2 == 0:
            m = tones[pattern[s] % len(tones)]
            put(tranh(m, STEP * 2), bar_t + s * STEP, -0.4, gain, 0.35)


def gliss(at_t, up=True):
    """Đàn tranh vuốt dây: a quick run over the five notes"""
    notes = PENTA if up else PENTA[::-1]
    for i, m in enumerate(notes):
        put(tranh(m, 0.15), at_t + i * 0.035, -0.3 + i * 0.05, 0.42, 0.45)


bar = 0
for name, nbars in SECTIONS:
    t0 = bar * BAR * STEP
    chords = CHORDS[name]
    for i in range(nbars):
        bt = t0 + i * BAR * STEP
        ch = chords[i % len(chords)]
        if name == 'intro':
            if i == 0:
                gliss(bt)
            arpeggio(bt, ch, 0.45)
            put(pad(ch, BAR * STEP), bt, 0, 1, 0.5)
            if i >= 2:
                for b in range(4):
                    put(kick(), bt + b * 4 * STEP, 0, 0.45)
            if i == 3:
                put(riser(BAR * STEP), bt, 0, 1)
        elif name in ('A',):
            drums(bt, full=True, last=(i == nbars - 1))
            bassline(bt, ch)
            put(pad(ch, BAR * STEP), bt, 0, 1, 0.5)
            if i % 2 == 1:
                put(mo(), bt + 15 * STEP, -0.45, 0.6, 0.2)
        elif name in ('B', 'B2'):
            drums(bt, full=name == 'B2', mo_on=True)
            bassline(bt, ch, busy=name == 'B2')
            put(pad(ch, BAR * STEP), bt, 0, 1.2, 0.5)
            arpeggio(bt, ch, 0.22)
        elif name == 'brk':
            for s, p in [(0, 1), (2, 1.18), (3, 1), (6, 1.18), (8, 1), (10, 1), (11, 1.18), (14, 1)]:
                put(mo(p), bt + s * STEP, -0.45, 0.85, 0.25)
            arpeggio(bt, ch, 0.4, roll=i >= 2)
            put(pad(ch, BAR * STEP), bt, 0, 1.3, 0.5)
            if i == 3:
                put(riser(BAR * STEP), bt, 0, 1.2)
                gliss(bt + 12 * STEP, up=True)
    # melodies
    if name == 'A':
        for s, m, d, o in MEL_A:
            put(tranh(m, d * STEP, o), t0 + s * STEP, -0.15, 0.95, 0.3)
            put(tranh(m - 12, d * STEP, o), t0 + s * STEP, -0.15, 0.25, 0.3)  # doubled an octave down: fuller
    elif name in ('B', 'B2'):
        mel = MEL_B if name == 'B' else MEL_B2
        prev = None
        for s, m, d in mel:
            put(bau(m, d * STEP, prev), t0 + s * STEP, 0.2, 1.0, 0.4)
            prev = m
        if name == 'B2':
            gliss(t0 + (8 * BAR - 4) * STEP, up=False)
    bar += nbars

# ------------------------------------------------------------------------------------------- mix
def reverb_ir(seconds=1.7):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * 3.6)
    sos = butter(1, 5500, btype='low', fs=SR, output='sos')
    return sosfilt(sos, ir) * 0.05


def wrap_conv(x, ir):
    y = fftconvolve(x, ir)
    out = y[:N].copy()
    tail = y[N:]
    out[: len(tail)] += tail  # the tail goes round to the start: seamless loop
    return out


L += wrap_conv(WET_L, reverb_ir())
R += wrap_conv(WET_R, reverb_ir())
# a little warmth: cut the mud, soften the top
for ch in (L, R):
    ch[:] = sosfilt(butter(2, 35, btype='high', fs=SR, output='sos'), ch)
mix = np.stack([L, R])
mix = np.tanh(mix * 1.6 / np.max(np.abs(mix))) / np.tanh(1.6)
mix *= 0.89

tmp = os.path.join(tempfile.gettempdir(), 'quan_nhau.wav')
with wave.open(tmp, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype('<i2').tobytes())
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'audio', 'quan_nhau.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', 'loudnorm=I=-19:TP=-1.5:LRA=7', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '192k', out], check=True)
print('Đã tạo', os.path.normpath(out), f'({TOTAL_BARS * BAR * STEP:.0f} giây)')
