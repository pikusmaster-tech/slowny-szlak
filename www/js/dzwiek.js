// Dźwięki syntezowane na żywo (Web Audio), bez plików audio.
import { S } from './stan.js';
import { wtyczka } from './natywne.js';

let ctx = null, master = null;
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    // Lekki pogłos z linii opóźniającej, żeby dźwięki brzmiały miękko.
    const delay = ctx.createDelay(); delay.delayTime.value = 0.13;
    const fb = ctx.createGain(); fb.gain.value = 0.22;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    master.connect(ctx.destination);
    master.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Skala pentatoniczna: każda kolejna litera brzmi wyżej i zawsze ładnie.
const SKALA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0];

function ton(freq, { kiedy = 0, dl = 0.45, gl = 0.35, typ = 'sine', glis = 0 } = {}) {
  const a = audio(); if (!a || !S.dzwiek) return;
  const t = a.currentTime + kiedy;
  const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain();
  o.type = typ; o.frequency.setValueAtTime(freq, t);
  o2.type = 'sine'; o2.frequency.setValueAtTime(freq * 2.01, t);
  if (glis) { o.frequency.exponentialRampToValueAtTime(freq * glis, t + dl); o2.frequency.exponentialRampToValueAtTime(freq * 2 * glis, t + dl); }
  const g2 = a.createGain(); g2.gain.value = 0.18;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gl, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dl);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
  o.start(t); o2.start(t); o.stop(t + dl + 0.05); o2.stop(t + dl + 0.05);
}

export const Dzwiek = {
  odblokuj() { audio(); },
  litera(i) { ton(SKALA[Math.min(i, SKALA.length - 1)], { dl: 0.32, gl: 0.22, typ: 'triangle' }); },
  slowo() { [0, 2, 4, 7].forEach((n, k) => ton(SKALA[n], { kiedy: k * 0.07, dl: 0.6, gl: 0.22, typ: 'triangle' })); },
  bonus() { [7, 8, 9].forEach((n, k) => ton(SKALA[n], { kiedy: k * 0.06, dl: 0.4, gl: 0.16 })); },
  blad() { ton(220, { dl: 0.28, gl: 0.25, typ: 'sine', glis: 0.6 }); },
  juzByl() { ton(392, { dl: 0.18, gl: 0.18 }); ton(392, { kiedy: 0.12, dl: 0.18, gl: 0.14 }); },
  moneta() { ton(1975.5, { dl: 0.12, gl: 0.12, typ: 'square' }); ton(2637, { kiedy: 0.07, dl: 0.35, gl: 0.12, typ: 'square' }); },
  podpowiedz() { ton(880, { dl: 0.5, gl: 0.18, glis: 1.5 }); },
  tasuj() { [4, 2, 5, 3].forEach((n, k) => ton(SKALA[n], { kiedy: k * 0.04, dl: 0.15, gl: 0.12 })); },
  wygrana() {
    [0, 2, 4, 5, 7, 9].forEach((n, k) => ton(SKALA[n], { kiedy: k * 0.09, dl: 0.9, gl: 0.2, typ: 'triangle' }));
    [261.63, 329.63, 392.0].forEach((f) => ton(f, { kiedy: 0.55, dl: 1.6, gl: 0.12 }));
  },
  klik() { ton(1200, { dl: 0.06, gl: 0.08 }); },
};

export function wibruj(ms = 12) {
  if (!S.wibracje) return;
  try {
    const H = wtyczka('Haptics');
    if (H) H.impact({ style: ms > 20 ? 'MEDIUM' : 'LIGHT' });
    else navigator.vibrate?.(ms);
  } catch { /* brak wibracji na tym urządzeniu */ }
}
