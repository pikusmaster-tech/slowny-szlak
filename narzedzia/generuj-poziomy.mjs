// Generator poziomów do gry "Słowne Koło".
// Wejście: słownik SJP do gier (slowa.txt, CC BY 4.0) i lista frekwencyjna
// FrequencyWords pl_50k.txt (CC BY-SA 4.0). Wyjście: www/poziomy.json i www/slownik.json.
// Użycie: node generuj-poziomy.mjs <slowa.txt> <pl_50k.txt> <katalog_www> [liczba_poziomow] [en_50k.txt]
import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';

const [sjpPath, freqPath, outDir, nArg, enPath] = process.argv.slice(2);
const LICZBA = Number(nArg || 2000);
const LITERY = /^[aąbcćdeęfghijklłmnńoóprsśtuwyzźż]+$/;

// Słowa, których nie chcemy w grze (rdzenie wulgaryzmów i obraźliwych słów).
const ZAKAZANE = ['kurw', 'chuj', 'huj', 'pierd', 'jeb', 'pizd', 'cip', 'kutas', 'fiut', 'cwel',
  'ciot', 'pedał', 'pedal', 'dziwk', 'suka', 'suki', 'suko', 'sukin', 'dupa', 'dupy', 'dupę', 'dupie', 'dupek', 'gówn', 'srać', 'sra', 'sraj',
  'szcza', 'ruchać', 'rucha', 'ruchał', 'ruchan', 'cycek', 'cycki', 'kurew', 'zdzir', 'szmat', 'murzyn', 'żyd', 'cygan', 'ciul',
  'debil', 'idiot', 'kretyn', 'nazi', 'hitler', 'gwałc', 'gwałt', 'zabij', 'trup', 'samobój', 'narkot', 'penis', 'pochw', 'seks', 'sex', 'porno', 'orgazm', 'spust'];
const zakazane = (w) => ZAKAZANE.some((z) => w.startsWith(z) || (z.length >= 4 && w.includes(z)));

async function wczytajSjp(p) {
  const set = new Set();
  const rl = readline.createInterface({ input: fs.createReadStream(p, 'utf8'), crlfDelay: Infinity });
  for await (const line of rl) {
    const w = line.trim();
    if (w.length >= 3 && w.length <= 7 && LITERY.test(w)) set.add(w);
  }
  return set;
}

const sjp = await wczytajSjp(sjpPath);
const czeste = []; // [slowo, ranga]
let ranga = 0;
for (const line of fs.readFileSync(freqPath, 'utf8').split('\n')) {
  const w = line.split(' ')[0]?.trim().toLowerCase();
  if (!w) continue;
  ranga++;
  if (w.length < 3 || w.length > 7 || !LITERY.test(w) || !sjp.has(w) || zakazane(w)) continue;
  czeste.push([w, ranga]);
}
const rangaSlowa = new Map(czeste);
console.error(`SJP: ${sjp.size}, częste i poprawne: ${czeste.length}`);

// Prosty deterministyczny generator losowy, żeby wynik dało się odtworzyć.
let ziarno = 20261016;
const los = () => ((ziarno = (ziarno * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const tasuj = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(los() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const licz = (w) => { const m = {}; for (const c of w) m[c] = (m[c] || 0) + 1; return m; };
const miesci = (w, m) => { const n = licz(w); for (const c in n) if ((m[c] || 0) < n[c]) return false; return true; };

// Lista z napisów filmowych zawiera słowa pisane bez polskich znaków ("juz" zamiast "już").
// Jeśli wersja z ogonkami jest wyraźnie częstsza, słowo bez ogonków uznajemy za literówkę.
const bezOgonkow = (w) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
const najczestszaForma = new Map();
for (const [w, r] of czeste) {
  const b = bezOgonkow(w);
  if (b !== w && (!najczestszaForma.has(b) || najczestszaForma.get(b) > r)) najczestszaForma.set(b, r);
}
const literowka = (w, r) => najczestszaForma.has(w) && najczestszaForma.get(w) * 3 < r;
// Słowa poprawne słownikowo, ale zbyt dziwne, żeby trafić do krzyżówki (mogą być bonusem).
const DZIWNE = new Set(['chu', 'prze', 'owa', 'goi', 'rei', 'peri', 'juz', 'mas', 'ową', 'iii', 'aha', 'och', 'ech', 'ach', 'ups', 'hej', 'hmm', 'ehe', 'oho', 'ani', 'abo', 'ale', 'ową', 'eee', 'yyy', 'ich', 'jej', 'ten', 'tej', 'tym', 'tę', 'się', 'cię', 'mnie', 'nią', 'nim', 'niej', 'tobą']);
// Imiona i angielskie wtrącenia z napisów filmowych ("bart", "berta"): słowo częste po angielsku,
// a rzadkie po polsku, nie trafia do krzyżówki.
const angielskie = new Set(enPath ? fs.readFileSync(enPath, 'utf8').split('\n').slice(0, 30000).map((l) => l.split(' ')[0]) : []);
const obce = (w, r) => angielskie.has(w) && r > 3000;
const progRangi = (w) => (w.length === 3 ? 5000 : w.length === 4 ? 12000 : 25000);
const pulaSiatki = czeste.filter(([w, r]) => r <= progRangi(w) && !DZIWNE.has(w) && !literowka(w, r) && !obce(w, r)).map(([w]) => w);
const doBonusu = new Set(czeste.filter(([w, r]) => !literowka(w, r)).map(([w]) => w));
const pulaBonus = czeste.map(([w]) => w).filter((w) => doBonusu.has(w));

// Układanie słów w krzyżówkę: kratki (x,y), kierunek 'p' (poziomo) lub 'd' (w dół).
function uloz(slowa) {
  let najlepszy = null;
  for (let proba = 0; proba < 40; proba++) {
    const kolejnosc = [slowa[0], ...tasuj(slowa.slice(1))];
    const siatka = new Map();
    const k = (x, y) => x + ',' + y;
    const polozone = [];
    const mozna = (w, x, y, d) => {
      const dx = d === 'p' ? 1 : 0, dy = d === 'p' ? 0 : 1;
      if (siatka.has(k(x - dx, y - dy)) || siatka.has(k(x + dx * w.length, y + dy * w.length))) return -1;
      let skrzyz = 0;
      for (let i = 0; i < w.length; i++) {
        const cx = x + dx * i, cy = y + dy * i;
        const c = siatka.get(k(cx, cy));
        if (c !== undefined) {
          if (c !== w[i]) return -1;
          skrzyz++;
        } else if (siatka.has(k(cx + dy, cy + dx)) || siatka.has(k(cx - dy, cy - dx))) return -1;
      }
      if (skrzyz === w.length) return -1;
      return skrzyz;
    };
    const poloz = (w, x, y, d) => {
      for (let i = 0; i < w.length; i++) siatka.set(k(x + (d === 'p' ? i : 0), y + (d === 'p' ? 0 : i)), w[i]);
      polozone.push({ s: w, x, y, d });
    };
    poloz(kolejnosc[0], 0, 0, 'p');
    for (const w of kolejnosc.slice(1)) {
      let best = null;
      for (const [key, c] of siatka) {
        const [gx, gy] = key.split(',').map(Number);
        for (let i = 0; i < w.length; i++) {
          if (w[i] !== c) continue;
          for (const d of ['p', 'd']) {
            const x = d === 'p' ? gx - i : gx, y = d === 'p' ? gy : gy - i;
            const s = mozna(w, x, y, d);
            if (s <= 0) continue;
            const wynik = s * 10 + los();
            if (!best || wynik > best.wynik) best = { x, y, d, wynik };
          }
        }
      }
      if (best) poloz(w, best.x, best.y, best.d);
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const key of siatka.keys()) {
      const [x, y] = key.split(',').map(Number);
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    const W = maxX - minX + 1, H = maxY - minY + 1;
    const ocena = polozone.length * 1000 - Math.max(W, H) * 10 - W * H * 0.1;
    if (!najlepszy || ocena > najlepszy.ocena) {
      najlepszy = { ocena, W, H, w: polozone.map((p) => ({ ...p, x: p.x - minX, y: p.y - minY })) };
    }
  }
  return najlepszy;
}

// Krzywa trudności: [od poziomu, długość koła, min słów, max słów, maks. ranga słowa bazowego]
const KRZYWA = [
  [1, 3, 2, 3, 3000], [6, 4, 3, 4, 6000], [21, 5, 4, 6, 10000], [61, 6, 5, 7, 15000],
  [161, 6, 6, 8, 25000], [301, 7, 6, 9, 25000],
];
const etap = (n) => KRZYWA.filter((e) => n >= e[0]).pop();

const uzyteZestawy = new Set();
const poziomy = [];
const wSiatce = new Set(pulaSiatki);
const bazy = (dl, maxR) => tasuj(czeste.filter(([w, r]) => w.length === dl && r <= maxR && wSiatce.has(w)).map(([w]) => w));
const kolejki = {};
for (let n = 1; poziomy.length < LICZBA; n++) {
  const [, dl, minS, maxS, maxR] = etap(n);
  const klucz = dl + ':' + maxR;
  kolejki[klucz] ||= bazy(dl, maxR);
  let poziom = null;
  while (!poziom && kolejki[klucz].length) {
    const baza = kolejki[klucz].pop();
    const zestaw = [...baza].sort().join('');
    if (uzyteZestawy.has(zestaw)) continue;
    const m = licz(baza);
    const kandydaci = pulaSiatki.filter((w) => w !== baza && miesci(w, m))
      .sort((a, b) => rangaSlowa.get(a) - rangaSlowa.get(b));
    if (kandydaci.length + 1 < minS) continue;
    const slowa = [baza, ...kandydaci.slice(0, maxS + 3)].sort((a, b) => b.length - a.length);
    const u = uloz(slowa);
    let wybrane = u.w;
    if (wybrane.length > maxS) {
      // Zostaw najczęstsze słowa i ułóż jeszcze raz, żeby siatka nie była przeładowana.
      const zostaw = [baza, ...kandydaci.filter((w) => wybrane.some((p) => p.s === w)).slice(0, maxS - 1)];
      const u2 = uloz(zostaw.sort((a, b) => b.length - a.length));
      if (u2.w.length < minS) continue;
      Object.assign(u, u2); wybrane = u2.w;
    }
    if (wybrane.length < minS || u.W > 12 || u.H > 12) continue;
    const bonus = pulaBonus.filter((w) => miesci(w, m) && !wybrane.some((p) => p.s === w));
    uzyteZestawy.add(zestaw);
    poziom = { l: tasuj([...baza]).join(''), W: u.W, H: u.H, w: wybrane, b: bonus };
  }
  if (!poziom) { console.error(`Brak słów bazowych dla etapu ${klucz} przy poziomie ${n}`); break; }
  poziomy.push(poziom);
}

const slownik = [...new Set(poziomy.flatMap((p) => p.b))];
const bonusIdx = new Map(slownik.map((w, i) => [w, i]));
const wynik = poziomy.map((p) => ({ ...p, b: p.b.map((w) => bonusIdx.get(w)) }));
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'poziomy.json'), JSON.stringify({ slownik, poziomy: wynik }));
console.error(`Zapisano ${poziomy.length} poziomów, słów bonusowych: ${slownik.length}`);
