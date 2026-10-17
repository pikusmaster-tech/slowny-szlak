// Koło liter: przeciąganie palcem po literach składa słowo.
export class Kolo {
  constructor(el, { naLitere, naSlowo, naZmiane }) {
    this.el = el;
    this.cb = { naLitere, naSlowo, naZmiane };
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.classList.add('kolo-linie');
    this.linia = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    this.linia.classList.add('kolo-linia');
    this.svg.append(this.linia);
    this.el.append(this.svg);
    this.litery = [];
    this.przyciski = [];
    this.kolejnosc = [];
    this.wybrane = [];
    this.aktywne = false;
    this.wylaczone = false;
    el.addEventListener('pointerdown', (e) => this.start(e));
    el.addEventListener('pointermove', (e) => this.ruch(e));
    el.addEventListener('pointerup', (e) => this.koniec(e));
    el.addEventListener('pointercancel', (e) => this.koniec(e));
    new ResizeObserver(() => this.uloz()).observe(el);
  }

  ustaw(litery) {
    this.przyciski.forEach((p) => p.remove());
    this.litery = [...litery];
    this.kolejnosc = this.litery.map((_, i) => i);
    this.przyciski = this.litery.map((l, i) => {
      const b = document.createElement('div');
      b.className = 'litera';
      b.textContent = l.toLocaleUpperCase('pl');
      b.style.animationDelay = `${i * 60}ms`;
      this.el.append(b);
      return b;
    });
    this.uloz();
  }

  uloz() {
    // clientWidth ignoruje transformacje (ekran wjeżdża ze skalą 1.03), getBoundingClientRect nie.
    const r = { width: this.el.clientWidth, height: this.el.clientHeight };
    this.rozmiar = r.width;
    const n = this.litery.length;
    const promien = r.width * (n <= 3 ? 0.27 : n <= 5 ? 0.31 : 0.33);
    this.rLitery = r.width * (n <= 4 ? 0.135 : n === 5 ? 0.125 : n === 6 ? 0.115 : 0.105);
    this.pozycje = [];
    this.kolejnosc.forEach((idx, k) => {
      const kat = -Math.PI / 2 + (k / n) * Math.PI * 2;
      const x = r.width / 2 + Math.cos(kat) * promien, y = r.height / 2 + Math.sin(kat) * promien;
      this.pozycje[idx] = [x, y];
      const b = this.przyciski[idx];
      b.style.width = b.style.height = `${this.rLitery * 2}px`;
      b.style.fontSize = `${this.rLitery * 1.15}px`;
      b.style.left = `${x - this.rLitery}px`;
      b.style.top = `${y - this.rLitery}px`;
    });
    this.svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    this.rysuj();
  }

  tasuj() {
    const n = this.kolejnosc.length;
    if (n < 2) return;
    const stara = this.kolejnosc.join();
    do {
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.kolejnosc[i], this.kolejnosc[j]] = [this.kolejnosc[j], this.kolejnosc[i]]; }
    } while (this.kolejnosc.join() === stara);
    this.przyciski.forEach((b) => b.classList.add('tasowanie'));
    this.uloz();
    setTimeout(() => this.przyciski.forEach((b) => b.classList.remove('tasowanie')), 450);
  }

  punkt(e) {
    const r = this.el.getBoundingClientRect();
    const skala = r.width / (this.el.clientWidth || r.width);
    return [(e.clientX - r.left) / skala, (e.clientY - r.top) / skala];
  }

  traf(p, prog) {
    let naj = -1, d = Infinity;
    this.pozycje.forEach(([x, y], i) => {
      const dd = Math.hypot(p[0] - x, p[1] - y);
      if (dd < d) { d = dd; naj = i; }
    });
    return d <= this.rLitery * prog ? naj : -1;
  }

  start(e) {
    // Śledzimy tylko jeden palec: drugi dotyk w trakcie przeciągania jest ignorowany.
    if (this.wylaczone || this.aktywne) return;
    const p = this.punkt(e);
    const i = this.traf(p, 1.15);
    if (i < 0) return;
    e.preventDefault();
    this.el.setPointerCapture?.(e.pointerId);
    this.palec = e.pointerId;
    this.aktywne = true;
    this.wybrane.forEach((j) => this.przyciski[j].classList.remove('wybrana'));
    this.wybrane = [];
    this.dodaj(i);
    this.kursor = p;
    this.rysuj();
  }

  ruch(e) {
    if (!this.aktywne || e.pointerId !== this.palec) return;
    const p = this.punkt(e);
    this.kursor = p;
    const i = this.traf(p, 0.8);
    if (i >= 0) {
      const n = this.wybrane.length;
      if (n >= 2 && this.wybrane[n - 2] === i) this.cofnij();
      else if (!this.wybrane.includes(i)) this.dodaj(i);
    }
    this.rysuj();
  }

  koniec(e) {
    if (!this.aktywne || e.pointerId !== this.palec) return;
    this.aktywne = false;
    const slowo = this.slowo();
    this.wybrane.forEach((i) => this.przyciski[i].classList.remove('wybrana'));
    this.wybrane = [];
    this.kursor = null;
    this.rysuj();
    // Słowo zostaje na podglądzie, żeby gra mogła je pokolorować (dobre, złe, bonus).
    if (slowo.length >= 2) this.cb.naSlowo?.(slowo);
    else this.cb.naZmiane?.('');
  }

  dodaj(i) {
    this.wybrane.push(i);
    this.przyciski[i].classList.add('wybrana');
    this.cb.naLitere?.(this.wybrane.length - 1);
    this.cb.naZmiane?.(this.slowo());
  }

  cofnij() {
    const i = this.wybrane.pop();
    this.przyciski[i].classList.remove('wybrana');
    this.cb.naZmiane?.(this.slowo());
  }

  slowo() { return this.wybrane.map((i) => this.litery[i]).join(''); }

  rysuj() {
    const pkt = this.wybrane.map((i) => this.pozycje[i]);
    if (this.aktywne && this.kursor && pkt.length) pkt.push(this.kursor);
    this.linia.setAttribute('points', pkt.map((p) => p.join(',')).join(' '));
  }
}
