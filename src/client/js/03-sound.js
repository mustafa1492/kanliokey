/* titreşim: navigator.vibrate yoksa (iPhone) iOS 18'in anahtar (switch) dokunsal geri bildirimi denenir */
let hapEl = null;
function hapTap() {
  try {
    if (!hapEl) {
      const l = document.createElement('label');
      l.className = 'ios-hap';
      l.setAttribute('aria-hidden', 'true');
      const i = document.createElement('input');
      i.type = 'checkbox';
      i.setAttribute('switch', '');
      i.tabIndex = -1;
      l.appendChild(i);
      document.body.appendChild(l);
      hapEl = l;
    }
    hapEl.click();
  } catch (e) {}
}
function buzz(p) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(p);
      return;
    }
    if (typeof document === 'undefined' || !document.body) return;
    const a = Array.isArray(p) ? p : [p];
    let t = 0;
    for (let k = 0; k < a.length && k < 8; k += 2) {
      setTimeout(hapTap, t);
      t += (a[k] || 0) + (a[k + 1] || 0);
    }
  } catch (e) {}
}
const SFX = (() => {
  let ctx = null,
    out = null,
    sout = null,
    nb = null,
    snd = true,
    vb = true,
    lastTick = 0,
    loading = false,
    VOL = 0.8,
    synthOnly = false,
    amb = null;
  const BUF = {},
    lastPick = {},
    SG = { tick: 1.5, swap: 1, turn: 1.35, penalty: 1.5, win: 1.4, lose: 1.4, deckend: 1.4, drop: 1.15, discard: 1.2 },
    JIT = { pick: 1, drop: 1, draw: 1, discard: 1, place: 1, tick: 1 };
  try {
    snd = localStorage.getItem('ko_snd') !== '0';
    vb = localStorage.getItem('ko_vib') !== '0';
  } catch (e) {}
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  function init() {
    if (!AC) return null;
    if (!ctx) {
      try {
        ctx = new AC();
        out = ctx.createGain();
        out.gain.value = 2.2;
        const cp = ctx.createDynamicsCompressor();
        cp.threshold.value = -14;
        cp.ratio.value = 5;
        out.connect(cp);
        cp.connect(ctx.destination);
        sout = ctx.createGain();
        sout.gain.value = VOL;
        sout.connect(ctx.destination);
        nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = nb.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) {
        ctx = null;
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    loadSamples();
    return ctx;
  }
  /* gömülü kayıtları çöz; çözülemezse sentez sesler devreye girer */
  function loadSamples() {
    if (loading || !ctx || typeof SND_DATA === 'undefined') return;
    loading = true;
    const dec = ab =>
      new Promise((ok, no) => {
        try {
          const p = ctx.decodeAudioData(ab, ok, no);
          if (p && p.catch) p.catch(no);
        } catch (e) {
          no(e);
        }
      });
    for (const n in SND_DATA) {
      BUF[n] = [];
      SND_DATA[n].forEach(b64 => {
        try {
          const bin = atob(b64),
            u = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          dec(u.buffer)
            .then(b => BUF[n].push(b))
            .catch(() => {});
        } catch (e) {}
      });
    }
  }
  function samp(t, n, v) {
    const a = BUF[n];
    if (!a || !a.length) return false;
    let i = Math.floor(Math.random() * a.length);
    if (a.length > 1 && i === lastPick[n]) i = (i + 1) % a.length;
    lastPick[n] = i;
    const s = ctx.createBufferSource();
    s.buffer = a[i];
    if (JIT[n]) s.playbackRate.value = 0.96 + Math.random() * 0.08;
    const g = ctx.createGain();
    g.gain.value = (SG[n] || 1) * (v || 1);
    s.connect(g);
    g.connect(sout);
    s.start(t);
    return true;
  }
  /* gürültü darbesi: filtreli, zarflı */
  function nz(t, dur, o) {
    const s = ctx.createBufferSource();
    s.buffer = nb;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.g, t + (o.a || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(out);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }
  /* ton: yumuşak vuruş ya da çınlama */
  function tone(t, dur, o) {
    const os = ctx.createOscillator(),
      g = ctx.createGain();
    os.type = o.type || 'sine';
    os.frequency.setValueAtTime(o.f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.g, t + (o.a || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = os;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      os.connect(f);
      n = f;
    }
    n.connect(g);
    g.connect(out);
    os.start(t);
    os.stop(t + dur + 0.05);
  }
  /* ahşap/taş "tak": hem gövde hem tık */
  function clack(t, v, pitch) {
    v = v || 1;
    pitch = pitch || 1;
    tone(t, 0.1, { f: 210 * pitch, to: 95 * pitch, g: 0.32 * v, a: 0.002 });
    nz(t, 0.06, { f: 1500 * pitch, q: 0.8, g: 0.34 * v, a: 0.001 });
    nz(t, 0.022, { f: 3400, q: 1.4, g: 0.12 * v, a: 0.001 });
  }
  const P = {
    pick(t) {
      nz(t, 0.035, { f: 2600, q: 1.2, g: 0.3, a: 0.002 });
      tone(t, 0.05, { f: 520, to: 700, g: 0.06 });
    },
    drop(t) {
      clack(t, 0.8, 1.1);
    },
    draw(t) {
      nz(t, 0.13, { f: 700, to: 2600, q: 0.9, g: 0.16, a: 0.02 });
      clack(t + 0.11, 0.3, 1.3);
    },
    discard(t) {
      clack(t, 1, 0.9);
    },
    place(t, n) {
      n = Math.max(1, Math.min(4, n || 1));
      for (let i = 0; i < n; i++) clack(t + i * 0.075, 0.7, 1 + (i % 2) * 0.12);
    },
    open(t) {
      for (let i = 0; i < 3; i++) clack(t + i * 0.07, 0.8, 1 + i * 0.1);
      tone(t + 0.24, 0.5, { f: 392, g: 0.09, type: 'triangle' });
      tone(t + 0.24, 0.5, { f: 587, g: 0.07, type: 'triangle' });
    },
    swap(t) {
      tone(t, 0.3, { f: 784, g: 0.13, type: 'triangle' });
      tone(t + 0.1, 0.4, { f: 1175, g: 0.12, type: 'triangle' });
      nz(t, 0.05, { f: 4200, q: 2, g: 0.05 });
    },
    turn(t) {
      tone(t, 0.3, { f: 659, g: 0.14, type: 'triangle', lp: 2600 });
      tone(t + 0.1, 0.42, { f: 880, g: 0.14, type: 'triangle', lp: 2600 });
    },
    tick(t) {
      tone(t, 0.04, { f: 1300, g: 0.14, a: 0.002 });
    },
    /* kanlı ceza: derin darbe, ıslak sıçrama, gergin ikili */
    penalty(t) {
      tone(t, 0.7, { f: 78, to: 34, g: 0.62, a: 0.004 });
      tone(t, 0.5, { f: 58, to: 38, g: 0.14, type: 'sawtooth', lp: 260 });
      nz(t + 0.02, 0.42, { type: 'lowpass', f: 900, to: 140, q: 0.7, g: 0.3, a: 0.01 });
      nz(t + 0.05, 0.2, { f: 2200, to: 600, q: 1.5, g: 0.07 });
      tone(t + 0.05, 0.55, { f: 220, g: 0.06, type: 'triangle', lp: 900 });
      tone(t + 0.05, 0.55, { f: 233, g: 0.06, type: 'triangle', lp: 900 });
    },
    win(t) {
      [523, 659, 784, 1047].forEach((f, i) => {
        tone(t + i * 0.11, 0.7, { f, g: 0.15, type: 'triangle', lp: 3200 });
        tone(t + i * 0.11, 0.7, { f: f * 2, g: 0.04 });
      });
      tone(t + 0.46, 0.9, { f: 1568, g: 0.05 });
      tone(t + 0.5, 1.1, { f: 523, g: 0.1, type: 'sine' });
      nz(t + 0.44, 0.35, { f: 5000, q: 3, g: 0.04 });
    },
    lose(t) {
      tone(t, 0.5, { f: 392, g: 0.13, type: 'triangle', lp: 1500 });
      tone(t + 0.2, 0.8, { f: 294, g: 0.14, type: 'triangle', lp: 1200 });
      tone(t + 0.2, 0.8, { f: 147, g: 0.12 });
    },
    deckend(t) {
      tone(t, 0.6, { f: 330, g: 0.12, type: 'triangle', lp: 1500 });
      tone(t + 0.25, 0.7, { f: 330, g: 0.1, type: 'triangle', lp: 1500 });
    },
    deal(t) {
      for (let i = 0; i < 14; i++)
        clack(t + i * 0.1 + Math.random() * 0.03, 0.45 + Math.random() * 0.25, 0.9 + Math.random() * 0.4);
    },
    shuffle(t) {
      nz(t, 3.6, { type: 'lowpass', f: 260, q: 0.5, g: 0.2, a: 0.4 });
      for (let i = 0; i < 34; i++) {
        const x = t + Math.random() * 3.4;
        nz(x, 0.05, { f: 900 + Math.random() * 1800, q: 1, g: 0.07 + Math.random() * 0.1, a: 0.001 });
        if (i % 3 === 0) tone(x, 0.07, { f: 150 + Math.random() * 90, to: 90, g: 0.05, a: 0.002 });
      }
    }
  };
  return {
    play(n, a) {
      if (!snd || typeof document === 'undefined' || document.hidden) return;
      const c = init();
      if (!c) return;
      try {
        const t = c.currentTime + 0.01;
        if (!synthOnly && n === 'place' && BUF.place && BUF.place.length) {
          const k = Math.max(1, Math.min(4, a || 1));
          for (let i = 0; i < k; i++) samp(t + i * 0.08, 'place');
          return;
        }
        if (!synthOnly && n === 'shuffle' && BUF.shuffle && BUF.shuffle.length) {
          samp(t, 'shuffle');
          samp(t + 2.1, 'shuffle');
          return;
        }
        if (!synthOnly && samp(t, n)) return;
        if (P[n]) P[n](t, a);
      } catch (e) {}
    },
    later(n, ms, a) {
      setTimeout(() => SFX.play(n, a), ms);
    },
    vib(p) {
      if (!vb) return;
      buzz(p);
    },
    unlock() {
      if (snd) init();
    },
    loaded() {
      return Object.fromEntries(Object.entries(BUF).map(([k, v]) => [k, v.length]));
    },
    tick(sec) {
      if (sec !== lastTick) {
        lastTick = sec;
        SFX.play('tick');
        SFX.vib(30);
      }
    },
    get snd() {
      return snd;
    },
    get vb() {
      return vb;
    },
    setPack(p) {
      synthOnly = p === 'sade';
    },
    /* kahvehane uğultusu: filtreli kahverengi gürültü (uzaktan konuşma) + arada çay kaşığı şıngırtısı */
    ambient(on) {
      if (!on || !snd) {
        if (amb) {
          const a = amb;
          amb = null;
          clearInterval(a.tm);
          try {
            a.g.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
            setTimeout(() => {
              try {
                a.s.stop();
                a.lfo.stop();
              } catch (e) {}
            }, 1600);
          } catch (e) {}
        }
        return;
      }
      if (amb) return;
      const c = init();
      if (!c) return;
      try {
        const len = c.sampleRate * 4,
          buf = c.createBuffer(1, len, c.sampleRate),
          d = buf.getChannelData(0);
        let l = 0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          l = (l + 0.02 * w) / 1.02;
          d[i] = l * 3.5;
        }
        const s = c.createBufferSource();
        s.buffer = buf;
        s.loop = true;
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 430;
        f.Q.value = 0.6;
        const g = c.createGain();
        g.gain.value = 0;
        const lfo = c.createOscillator();
        lfo.frequency.value = 0.21;
        const lg = c.createGain();
        lg.gain.value = 0.02;
        lfo.connect(lg);
        lg.connect(g.gain);
        s.connect(f);
        f.connect(g);
        g.connect(sout);
        s.start();
        lfo.start();
        g.gain.setTargetAtTime(0.055, c.currentTime, 1.2);
        const tm = setInterval(() => {
          try {
            if (!amb || document.hidden || Math.random() < 0.5) return;
            const t = ctx.currentTime + 0.05,
              fr = 2400 + Math.random() * 1500;
            tone(t, 0.35, { f: fr, g: 0.022, a: 0.002 });
            tone(t + 0.07, 0.3, { f: fr * 1.5, g: 0.01, a: 0.002 });
            if (Math.random() < 0.4) tone(t + 0.15 + Math.random() * 0.1, 0.25, { f: fr * 0.97, g: 0.014, a: 0.002 });
          } catch (e) {}
        }, 3200);
        amb = { s, g, lfo, tm };
      } catch (e) {}
    },
    get ambOn() {
      return !!amb;
    },
    setVol(v) {
      VOL = [0.35, 0.55, 0.8, 1.15][v] || 0.8;
      if (sout) sout.gain.value = VOL;
    },
    setSnd(v) {
      snd = v;
      try {
        localStorage.setItem('ko_snd', v ? '1' : '0');
      } catch (e) {}
      if (v) {
        init();
        SFX.play('turn');
      }
    },
    setVib(v) {
      vb = v;
      try {
        localStorage.setItem('ko_vib', v ? '1' : '0');
      } catch (e) {}
      if (v) buzz([40, 40, 40]);
    }
  };
})();
function syncTg() {
  const a = $('#sndT'),
    b = $('#vibT');
  if (a) a.setAttribute('aria-pressed', String(SFX.snd));
  if (b) b.setAttribute('aria-pressed', String(SFX.vb));
  document
    .querySelectorAll('[data-tg]')
    .forEach(x => x.setAttribute('aria-pressed', String(x.dataset.tg === 'snd' ? SFX.snd : SFX.vb)));
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('pointerdown', () => SFX.unlock(), { passive: true });
  document.addEventListener('click', e => {
    const m = e.target.closest && e.target.closest('#menuT,#menuX');
    if (m || (e.target.classList && e.target.classList.contains('xtra'))) {
      const op = m && m.id === 'menuT' && !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', op);
      const mt = $('#menuT');
      if (mt) mt.setAttribute('aria-expanded', String(op));
      return;
    }
    const t = e.target.closest && e.target.closest('#sndT,#vibT,[data-tg]');
    if (!t) return;
    if (t.id === 'sndT' || t.dataset.tg === 'snd') SFX.setSnd(!SFX.snd);
    else SFX.setVib(!SFX.vb);
    syncTg();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
    }
  });
  syncTg();
}
