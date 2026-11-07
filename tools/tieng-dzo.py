"""Tạo tiếng hai cốc bia hơi cụng nhau (public/assets/audio/dzo1..3.mp3).

Tổng hợp theo kiểu "modal": mỗi cốc thủy tinh dày rung ở vài tần số riêng, tắt dần nhanh; lúc chạm có tiếng
"cạch" ngắn (nhiễu dải cao), hai cốc nảy nhẹ lần hai sau vài mili giây, bia sóng sánh (nhiễu dải thấp) và một chút
vang của phòng. Không dùng file ghi âm có sẵn. Chạy: python tools/tieng-dzo.py (cần numpy, scipy, ffmpeg).
"""
import os
import subprocess
import tempfile

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'audio')


def band(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], btype='band')
    return lfilter(b, a, x)


def mug(t, base, rng, amp=1.0):
    """One thick glass mug ringing: inharmonic modes, the high ones die first, a slow beat in each."""
    modes = [(1.0, 1.0, 0.26), (2.32, 0.8, 0.17), (3.71, 0.6, 0.11), (5.12, 0.42, 0.075), (6.9, 0.28, 0.05), (8.8, 0.18, 0.035)]
    y = np.zeros_like(t)
    for ratio, a, decay in modes:
        f = base * ratio * (1 + rng.uniform(-0.015, 0.015))
        beat = 1 + 0.25 * np.sin(2 * np.pi * rng.uniform(2, 7) * t)
        y += a * beat * np.exp(-t / decay) * (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.003 * t + 1.1))
    return amp * y


def hit(n, rng, start, base_a, base_b, amp):
    """Both mugs struck at `start` seconds"""
    out = np.zeros(n)
    i = int(start * SR)
    t = np.arange(n - i) / SR
    out[i:] += mug(t, base_a, rng, amp) + mug(t, base_b, rng, amp * 0.85)
    # the "cạch" of glass on glass: a few ms of bright noise
    click = rng.standard_normal(int(0.006 * SR)) * np.exp(-np.arange(int(0.006 * SR)) / (0.0012 * SR))
    click = band(np.concatenate([click, np.zeros(400)]), 1800, 9000)
    out[i : i + len(click)] += click[: len(out) - i] * 3.2 * amp
    return out


def room(x):
    """A little reverb of a small street-side room (four combs and an all-pass)"""
    y = np.zeros(len(x))
    for d, g in [(0.0297, 0.55), (0.0371, 0.52), (0.0411, 0.5), (0.0437, 0.48)]:
        k = int(d * SR)
        c = np.copy(x)
        for i in range(k, len(c)):
            c[i] += g * c[i - k]
        y += c
    k = int(0.005 * SR)
    a = np.copy(y)
    for i in range(k, len(a)):
        a[i] = -0.6 * y[i] + y[i - k] + 0.6 * a[i - k]
    return a / 4


def make(seed):
    rng = np.random.default_rng(seed)
    n = int(1.1 * SR)
    base = rng.uniform(1050, 1300)
    dry = hit(n, rng, 0.02, base, base * rng.uniform(1.06, 1.12), 1.0)
    # the mugs bounce and touch again, softer
    dry += hit(n, rng, 0.02 + rng.uniform(0.007, 0.012), base * 1.01, base * 1.1, 0.28)
    # beer sloshing in the mugs
    t = np.arange(n) / SR
    slosh = band(rng.standard_normal(n), 250, 1100) * (np.clip((t - 0.03) / 0.03, 0, 1) * np.exp(-np.clip(t - 0.06, 0, None) / 0.22))
    bubbles = np.zeros(n)
    for _ in range(40):
        i = int(rng.uniform(0.05, 0.6) * SR)
        f = rng.uniform(900, 2600)
        L = int(0.012 * SR)
        tt = np.arange(L) / SR
        bubbles[i : i + L] += np.sin(2 * np.pi * f * tt * (1 + 3 * tt)) * np.exp(-tt / 0.003) * rng.uniform(0.02, 0.06)
    dry = dry + 0.35 * slosh + bubbles
    wet = room(dry)
    y = dry + 0.14 * wet
    fade = np.ones(n)
    fade[-int(0.2 * SR) :] = np.linspace(1, 0, int(0.2 * SR))
    y *= fade
    y = y / np.max(np.abs(y)) * 0.89
    return (y * 32767).astype(np.int16)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for k, seed in enumerate([134, 2026, 77], start=1):
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            wavfile.write(f.name, SR, make(seed))
        dst = os.path.join(OUT, f'dzo{k}.mp3')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f.name, '-b:a', '128k', dst], check=True)
        os.unlink(f.name)
        print('ok', dst)
