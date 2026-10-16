// Cząsteczki i konfetti na jednym płótnie nad całą grą.
const cv = document.createElement('canvas');
cv.className = 'efekty';
document.body.append(cv);
const g = cv.getContext('2d');
let czastki = [];
let dpr = 1;
function rozmiar() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
}
addEventListener('resize', rozmiar); rozmiar();

let biegnie = false;
function klatka() {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, innerWidth, innerHeight);
  czastki = czastki.filter((c) => c.zycie > 0);
  for (const c of czastki) {
    c.vy += c.grawitacja; c.vx *= c.opor; c.vy *= c.opor;
    c.x += c.vx; c.y += c.vy; c.zycie--; c.obrot += c.vobrot;
    const a = Math.min(1, c.zycie / 25);
    g.globalAlpha = a;
    g.fillStyle = c.kolor;
    if (c.typ === 'konfetti') {
      g.save(); g.translate(c.x, c.y); g.rotate(c.obrot);
      g.scale(1, Math.cos(c.obrot * 1.7));
      g.fillRect(-c.r, -c.r * 0.45, c.r * 2, c.r * 0.9);
      g.restore();
    } else if (c.typ === 'gwiazdka') {
      g.save(); g.translate(c.x, c.y); g.rotate(c.obrot);
      g.beginPath();
      for (let i = 0; i < 8; i++) { const r = i % 2 ? c.r * 0.4 : c.r; const k = (i / 8) * Math.PI * 2; g.lineTo(Math.cos(k) * r, Math.sin(k) * r); }
      g.closePath(); g.fill(); g.restore();
    } else {
      g.beginPath(); g.arc(c.x, c.y, c.r * a, 0, Math.PI * 2); g.fill();
    }
  }
  g.globalAlpha = 1;
  if (czastki.length) requestAnimationFrame(klatka); else { biegnie = false; g.clearRect(0, 0, innerWidth, innerHeight); }
}
function start() { if (!biegnie) { biegnie = true; requestAnimationFrame(klatka); } }

export function wybuch(x, y, { ile = 18, kolory = ['#ffe27a', '#fff', '#ffb347'], sila = 5, typ = 'gwiazdka' } = {}) {
  for (let i = 0; i < ile; i++) {
    const k = Math.random() * Math.PI * 2, v = sila * (0.4 + Math.random());
    czastki.push({ x, y, vx: Math.cos(k) * v, vy: Math.sin(k) * v - 1, r: 3 + Math.random() * 4, kolor: kolory[i % kolory.length],
      zycie: 35 + Math.random() * 25, grawitacja: 0.12, opor: 0.95, obrot: Math.random() * 6, vobrot: (Math.random() - 0.5) * 0.3, typ });
  }
  start();
}

export function konfetti() {
  const kolory = ['#ff5e7e', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#ffffff', '#ff9f1c'];
  for (let i = 0; i < 160; i++) {
    const z = i % 2 ? -1 : 1;
    czastki.push({ x: z > 0 ? -10 : innerWidth + 10, y: innerHeight * (0.45 + Math.random() * 0.3),
      vx: z * (6 + Math.random() * 9), vy: -(9 + Math.random() * 10), r: 4 + Math.random() * 5,
      kolor: kolory[i % kolory.length], zycie: 120 + Math.random() * 80, grawitacja: 0.28, opor: 0.985,
      obrot: Math.random() * 6, vobrot: (Math.random() - 0.5) * 0.4, typ: 'konfetti' });
  }
  start();
}

// Leci element (np. moneta) z punktu A do B po łuku, potem wywołuje gotowe().
export function lot(html, z, doEl, { czas = 700, opoznienie = 0, klasa = 'leci', gotowe } = {}) {
  const el = document.createElement('div');
  el.className = klasa; el.innerHTML = html;
  document.body.append(el);
  const b = doEl.getBoundingClientRect();
  const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
  const t0 = performance.now() + opoznienie;
  el.style.transform = `translate(${z.x}px, ${z.y}px) translate(-50%,-50%) scale(0)`;
  const krok = (t) => {
    const p = Math.max(0, Math.min(1, (t - t0) / czas));
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const x = z.x + (x1 - z.x) * e, y = z.y + (y1 - z.y) * e - Math.sin(p * Math.PI) * 120;
    const s = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) * 0.4;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%) scale(${s})`;
    if (p < 1) requestAnimationFrame(krok); else { el.remove(); gotowe?.(); }
  };
  requestAnimationFrame(krok);
}
