// Proceduralne krajobrazy Polski rysowane w SVG. Nie potrzebują żadnych plików graficznych,
// więc każdy nowy szlak powstaje automatycznie z ziarna losowego.

export const SZLAKI = [
  { id: 'tatry', nazwa: 'Tatry', typ: 'gory' },
  { id: 'mazury', nazwa: 'Mazury', typ: 'jeziora' },
  { id: 'baltyk', nazwa: 'Bałtyk', typ: 'morze' },
  { id: 'bieszczady', nazwa: 'Bieszczady', typ: 'wzgorza' },
  { id: 'bialowieza', nazwa: 'Puszcza Białowieska', typ: 'las' },
  { id: 'bledow', nazwa: 'Pustynia Błędowska', typ: 'wydmy' },
  { id: 'pieniny', nazwa: 'Pieniny', typ: 'przelom' },
  { id: 'karkonosze', nazwa: 'Karkonosze', typ: 'gory' },
  { id: 'roztocze', nazwa: 'Roztocze', typ: 'wzgorza' },
  { id: 'leba', nazwa: 'Wydmy Łebskie', typ: 'wydmy-morze' },
  { id: 'kaszuby', nazwa: 'Kaszuby', typ: 'jeziora' },
  { id: 'beskidy', nazwa: 'Beskid Śląski', typ: 'wzgorza' },
];

export const PORY = [
  { id: 'dzien', nazwa: 'dzień', niebo: ['#3d8fd9', '#7cc0f0', '#d4efff'], slonce: '#fff7d6', mgla: '#cfe8f7', blisko: '#1d4a3a', woda: ['#5fa8dc', '#2c6f9e'], gwiazdy: 0 },
  { id: 'zachod', nazwa: 'zachód słońca', niebo: ['#2a1a5e', '#b0477a', '#ffb27a'], slonce: '#ffd9a0', mgla: '#e58f8f', blisko: '#1c0f2e', woda: ['#e48f8a', '#43275f'], gwiazdy: 20 },
  { id: 'noc', nazwa: 'noc', niebo: ['#050816', '#101b45', '#263a74'], slonce: '#f3f1e2', mgla: '#2c4074', blisko: '#03060f', woda: ['#1b2d5c', '#050a1c'], gwiazdy: 160, ksiezyc: true },
  { id: 'swit', nazwa: 'świt', niebo: ['#26335e', '#7b6aa8', '#f6c1a6'], slonce: '#fff0c9', mgla: '#b8a6d1', blisko: '#1b1d3b', woda: ['#b6a3cf', '#3a3a6b'], gwiazdy: 40 },
];

export function etapDlaPoziomu(n) {
  const nr = Math.floor((n - 1) / 20);
  const szlak = SZLAKI[nr % SZLAKI.length];
  const pora = PORY[(nr + Math.floor(nr / SZLAKI.length)) % PORY.length];
  return { nr, szlak, pora, wEtapie: ((n - 1) % 20) + 1, okrazenie: Math.floor(nr / SZLAKI.length) };
}

function generatorLosowy(ziarno) {
  let s = ziarno >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mieszaj(a, b, t) {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// Szum wartości 1D z kilkoma oktawami: gładki dla wzgórz, "grzbietowy" dla gór.
function szum(los, oktawy) {
  const tabele = Array.from({ length: oktawy }, () => Array.from({ length: 64 }, los));
  return (x, grzbiet) => {
    let suma = 0, amp = 1, norm = 0, f = 1;
    for (let o = 0; o < oktawy; o++) {
      const t = tabele[o];
      const xx = x * f, i = Math.floor(xx), u = xx - i;
      const g = u * u * (3 - 2 * u);
      let v = t[i & 63] * (1 - g) + t[(i + 1) & 63] * g;
      if (grzbiet) v = 1 - Math.abs(v * 2 - 1);
      suma += v * amp; norm += amp; amp *= 0.5; f *= 2.1;
    }
    return suma / norm;
  };
}

const SZER = 1000, WYS = 1800;

function grzbiet(los, { y, amp, gladkosc, typ, oktawy = 5 }) {
  const n = szum(los, oktawy);
  const pkt = [];
  const krok = 8;
  const off = los() * 40;
  for (let x = -20; x <= SZER + 20; x += krok) {
    let v;
    const u = off + x / gladkosc;
    if (typ === 'gory') v = Math.pow(n(u, true), 2.2);
    else if (typ === 'wydmy') { const s = (u * 0.8) % 1; v = 0.55 * n(u, false) + 0.45 * (s < 0.7 ? s / 0.7 : (1 - s) / 0.3); }
    else v = n(u, false);
    pkt.push([x, y - v * amp]);
  }
  return pkt;
}

function sciezka(pkt, dol = WYS) {
  let d = `M${pkt[0][0]},${dol} L${pkt[0][0]},${pkt[0][1].toFixed(1)}`;
  for (let i = 1; i < pkt.length; i++) d += ` L${pkt[i][0]},${pkt[i][1].toFixed(1)}`;
  return d + ` L${pkt[pkt.length - 1][0]},${dol} Z`;
}

function drzewa(los, pkt, gestosc, wys) {
  let d = '';
  for (let i = 0; i < pkt.length; i++) {
    if (los() > gestosc) continue;
    const [x, y] = pkt[i];
    const h = wys * (0.6 + los() * 0.7), w = h * 0.32;
    const xx = x + (los() - 0.5) * 6;
    // Świerk: trzy nakładające się trójkąty.
    for (let k = 0; k < 3; k++) {
      const top = y - h + k * h * 0.22, base = y - h * 0.25 + k * h * 0.25;
      const ww = w * (0.55 + k * 0.28);
      d += `M${(xx - ww).toFixed(1)},${base.toFixed(1)} L${xx.toFixed(1)},${top.toFixed(1)} L${(xx + ww).toFixed(1)},${base.toFixed(1)} Z `;
    }
    d += `M${(xx - 1.5).toFixed(1)},${(y - h * 0.05).toFixed(1)} h3 v${(h * 0.1).toFixed(1)} h-3 Z `;
  }
  return d;
}

export function rysujKrajobraz(etap, ziarno) {
  const { szlak, pora } = etap;
  const los = generatorLosowy(ziarno * 7919 + 17);
  const typ = szlak.typ;
  const id = 'k' + ziarno;
  const warstwy = [];
  const defs = [];

  defs.push(`<linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${pora.niebo[0]}"/><stop offset="0.55" stop-color="${pora.niebo[1]}"/><stop offset="1" stop-color="${pora.niebo[2]}"/></linearGradient>`);
  defs.push(`<radialGradient id="${id}s"><stop offset="0" stop-color="${pora.slonce}" stop-opacity="1"/><stop offset="0.18" stop-color="${pora.slonce}" stop-opacity="0.9"/><stop offset="0.2" stop-color="${pora.slonce}" stop-opacity="0.35"/><stop offset="1" stop-color="${pora.slonce}" stop-opacity="0"/></radialGradient>`);
  warstwy.push(`<rect width="${SZER}" height="${WYS}" fill="url(#${id}n)"/>`);

  // Gwiazdy
  let gw = '';
  for (let i = 0; i < pora.gwiazdy; i++) {
    const x = los() * SZER, y = los() * WYS * 0.55, r = 0.6 + los() * 1.8;
    gw += `<circle class="gw" style="animation-delay:${(los() * 5).toFixed(2)}s;animation-duration:${(2.5 + los() * 4).toFixed(2)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" opacity="${(0.3 + los() * 0.7).toFixed(2)}"/>`;
  }
  warstwy.push(gw);

  // Zorza polarna nad Bałtykiem i Mazurami w nocy, rzadko
  if (pora.id === 'noc' && los() < 0.55) {
    defs.push(`<linearGradient id="${id}z" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cffcb" stop-opacity="0"/><stop offset="0.6" stop-color="#4dffb0" stop-opacity="0.35"/><stop offset="1" stop-color="#7c5cff" stop-opacity="0"/></linearGradient>`);
    let z = '';
    for (let k = 0; k < 3; k++) {
      const y0 = 250 + k * 70 + los() * 60;
      let d = `M-50,${y0}`;
      for (let x = 0; x <= SZER + 100; x += 100) d += ` Q${x - 50},${y0 + (los() - 0.5) * 160} ${x},${y0 + (los() - 0.5) * 80}`;
      z += `<path class="zorza" style="animation-delay:${k * 1.7}s" d="${d} L${SZER + 100},${y0 + 260} L-50,${y0 + 260} Z" fill="url(#${id}z)"/>`;
    }
    warstwy.push(`<g opacity="0.9">${z}</g>`);
  }

  // Słońce lub księżyc
  const sx = 200 + los() * 600;
  const sy = pora.id === 'dzien' ? 220 + los() * 120 : pora.id === 'noc' ? 260 + los() * 150 : 640 + los() * 80;
  const sr = pora.id === 'dzien' ? 420 : 520;
  if (pora.ksiezyc) {
    defs.push(`<radialGradient id="${id}p"><stop offset="0" stop-color="${pora.slonce}" stop-opacity="0.35"/><stop offset="1" stop-color="${pora.slonce}" stop-opacity="0"/></radialGradient>`);
    warstwy.push(`<circle cx="${sx}" cy="${sy}" r="${sr * 0.7}" fill="url(#${id}p)"/>`);
  } else warstwy.push(`<circle cx="${sx}" cy="${sy}" r="${sr}" fill="url(#${id}s)"/>`);
  if (pora.ksiezyc) {
    // Sierp księżyca: jasna tarcza z maską wycinającą drugie koło.
    defs.push(`<mask id="${id}m"><rect width="${SZER}" height="${WYS}" fill="#fff"/><circle cx="${sx + 30}" cy="${sy - 18}" r="74" fill="#000"/></mask>`);
    warstwy.push(`<circle cx="${sx}" cy="${sy}" r="${sr * 0.18}" fill="${pora.slonce}" mask="url(#${id}m)"/>`);
  }

  // Chmury
  let ch = '';
  const ileChmur = pora.id === 'noc' ? 2 : 5;
  for (let i = 0; i < ileChmur; i++) {
    const cx = los() * SZER, cy = 120 + los() * 500, s = 0.6 + los() * 1.2;
    const kolor = pora.id === 'dzien' ? '#ffffff' : mieszaj(pora.niebo[2], '#ffffff', 0.35);
    let kl = '';
    for (let k = 0; k < 6; k++) kl += `<ellipse cx="${(cx + (k - 3) * 38 * s).toFixed(0)}" cy="${(cy - Math.sin(k / 5 * Math.PI) * 26 * s).toFixed(0)}" rx="${(60 * s).toFixed(0)}" ry="${(30 * s).toFixed(0)}"/>`;
    ch += `<g class="chmura" style="animation-duration:${(90 + los() * 120).toFixed(0)}s;animation-delay:-${(los() * 100).toFixed(0)}s" fill="${kolor}" opacity="${(pora.id === 'dzien' ? 0.75 : 0.35).toFixed(2)}">${kl}</g>`;
  }
  warstwy.push(ch);

  // Ptaki za dnia
  if (pora.id === 'dzien' || pora.id === 'swit') {
    let pt = '';
    for (let i = 0; i < 5; i++) {
      const x = sx - 200 + los() * 400, y = sy + 60 + los() * 200, s = 6 + los() * 6;
      pt += `<path d="M${x - s},${y} q${s / 2},-${s / 2} ${s},0 q${s / 2},-${s / 2} ${s},0" stroke="${pora.blisko}" stroke-width="2" fill="none" opacity="0.55"/>`;
    }
    warstwy.push(`<g class="ptaki">${pt}</g>`);
  }

  const ileWarstw = 5;
  const parametry = {
    gory: { start: 900, krok: 150, amp: [520, 420, 300, 220, 160], gl: [260, 220, 190, 160, 130] },
    wzgorza: { start: 1000, krok: 140, amp: [200, 180, 160, 150, 130], gl: [380, 320, 280, 240, 200] },
    las: { start: 1050, krok: 130, amp: [120, 110, 100, 90, 80], gl: [380, 320, 280, 240, 200] },
    wydmy: { start: 1080, krok: 140, amp: [140, 160, 180, 200, 220], gl: [420, 380, 340, 300, 260] },
    jeziora: { start: 960, krok: 150, amp: [160, 140, 90, 120, 110], gl: [360, 300, 260, 240, 200] },
    morze: { start: 1150, krok: 160, amp: [70, 60, 90, 140, 160], gl: [400, 360, 300, 260, 220] },
    'wydmy-morze': { start: 1150, krok: 160, amp: [60, 80, 160, 190, 220], gl: [400, 360, 320, 280, 240] },
    przelom: { start: 900, krok: 160, amp: [420, 380, 340, 220, 160], gl: [230, 200, 170, 150, 130] },
  }[typ];

  const kolorPiasku = pora.id === 'dzien' ? '#e9cf98' : mieszaj('#e9cf98', pora.blisko, 0.55);
  for (let i = 0; i < ileWarstw; i++) {
    const t = i / (ileWarstw - 1);
    let kolor = mieszaj(pora.mgla, pora.blisko, 0.18 + t * 0.82);
    let y = parametry.start + i * parametry.krok;
    let typGrzbietu = typ === 'gory' || typ === 'przelom' ? (i < 3 ? 'gory' : 'wzgorza') : typ.startsWith('wydmy') ? (i >= 2 ? 'wydmy' : 'wzgorza') : 'wzgorza';

    // Woda: jezioro lub morze między warstwami
    if ((typ === 'jeziora' && i === 2) || ((typ === 'morze' || typ === 'wydmy-morze') && i === 1) || (typ === 'przelom' && i === 3)) {
      const wy = y - parametry.amp[i] * 0.35;
      defs.push(`<linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pora.woda[0]}"/><stop offset="1" stop-color="${pora.woda[1]}"/></linearGradient>`);
      warstwy.push(`<rect x="0" y="${wy}" width="${SZER}" height="${WYS - wy}" fill="url(#${id}w)"/>`);
      let fale = '';
      for (let k = 0; k < 26; k++) {
        const fy = wy + 10 + Math.pow(los(), 1.6) * (WYS - wy) * 0.5;
        const fx = los() * SZER, fw = 20 + los() * 90;
        fale += `<rect class="fala" style="animation-delay:${(los() * 4).toFixed(2)}s" x="${fx.toFixed(0)}" y="${fy.toFixed(0)}" width="${fw.toFixed(0)}" height="2" rx="1" fill="${pora.slonce}" opacity="${(0.15 + los() * 0.35).toFixed(2)}"/>`;
      }
      // Odbicie słońca
      if (sy < wy) fale += `<rect class="fala" x="${sx - 40}" y="${wy + 4}" width="80" height="${Math.min(380, WYS - wy)}" fill="${pora.slonce}" opacity="0.12"/>`;
      warstwy.push(fale);
      if (typ === 'morze' || typ === 'wydmy-morze') { y += 120; }
      else continue;
    }

    if ((typ === 'morze' || typ === 'wydmy-morze') && i >= 2) kolor = mieszaj(kolorPiasku, pora.blisko, 0.15 + (i - 2) * 0.32);
    if (typ === 'wydmy' && i >= 1) kolor = mieszaj(kolorPiasku, pora.blisko, 0.05 + (i - 1) * 0.25);

    const pkt = grzbiet(los, { y, amp: parametry.amp[i], gladkosc: parametry.gl[i], typ: typGrzbietu });
    // Śnieg na szczytach dalekich gór w dzień i o świcie
    if (typGrzbietu === 'gory' && i < 2) {
      defs.push(`<linearGradient id="${id}g${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mieszaj(kolor, '#ffffff', pora.id === 'noc' ? 0.12 : 0.55)}"/><stop offset="0.35" stop-color="${kolor}"/><stop offset="1" stop-color="${kolor}"/></linearGradient>`);
      warstwy.push(`<path d="${sciezka(pkt)}" fill="url(#${id}g${i})"/>`);
    } else {
      warstwy.push(`<path d="${sciezka(pkt)}" fill="${kolor}"/>`);
    }
    const lesne = typ === 'las' ? 0.75 : typ === 'jeziora' || typ === 'wzgorza' || typ === 'przelom' ? 0.35 : typ === 'gory' ? (i >= 2 ? 0.3 : 0) : 0;
    if (lesne && i >= 1) warstwy.push(`<path d="${drzewa(los, pkt, lesne, 30 + i * 22)}" fill="${kolor}"/>`);
    // Mgiełka między planami
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SZER} ${WYS}" preserveAspectRatio="xMidYMax slice"><defs>${defs.join('')}</defs>${warstwy.join('')}</svg>`;
}
