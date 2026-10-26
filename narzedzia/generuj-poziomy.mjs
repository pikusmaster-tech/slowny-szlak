// Generator poziomów do gry "Słowny Szlak".
// Wejście: słownik SJP do gier (slowa.txt, CC BY 4.0), lista frekwencyjna FrequencyWords
// pl_50k.txt (CC BY-SA 4.0) i słownik odmian SJP (odm.txt, CC BY 4.0). Wyjście: www/poziomy.json.
// Użycie: node generuj-poziomy.mjs <slowa.txt> <pl_50k.txt> <katalog_www> [liczba_poziomow] [en_50k.txt] [odm.txt]
import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';

const [sjpPath, freqPath, outDir, nArg, enPath, odmPath] = process.argv.slice(2);
const LICZBA = Number(nArg || 2000);
const LITERY = /^[aąbcćdeęfghijklłmnńoóprsśtuwyzźż]+$/;

// Słowa, których nie chcemy w grze (rdzenie wulgaryzmów i obraźliwych słów).
// Rdzeń szukany jest w środku słowa, więc odmiany (zasrany, ćwoku, bękarta) też odpadają.
// Zbyt ostry filtr kosztuje tylko kilka słów, a za luźny kosztuje grę w sklepie.
const ZAKAZANE = ['kurw', 'chuj', 'huj', 'pierd', 'jeb', 'pizd', 'cip', 'kutas', 'kutw', 'fiut', 'cwel',
  'ciot', 'pedał', 'pedal', 'pedz', 'lesb', 'dziwk', 'suki', 'sukin', 'dup', 'gówn', 'sra', 'szcza',
  'ruchać', 'rucha', 'ruchan', 'cycek', 'cycki', 'cyc', 'kurew', 'zdzir', 'szmat', 'szmac', 'murzyn',
  'żyd', 'cygan', 'ciul', 'debil', 'idiot', 'kretyn', 'matoł', 'gnoj', 'gnid', 'łajz', 'ćwok', 'bękart',
  'ścierw', 'spieprz', 'palant', 'spadaj', 'rzyg', 'kurna', 'zdech', 'frajer', 'nazi', 'hitler', 'gwałc',
  'gwałt', 'zabij', 'trup', 'samobój', 'narkot', 'penis', 'pochw', 'seks', 'sex', 'porno', 'orgazm', 'spust'];
// "suka" i jej odmiany: tylko dokładne formy, żeby nie zablokować "sukna" czy "sukienki".
const SUKA = /^suk(a|ą|i|ę|o|om|ami|ach|y)?$/;
const zakazane = (w) => SUKA.test(w) || ZAKAZANE.some((z) => w.includes(z));

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
// Słowa z SJP pogrupowane po zestawie liter. Słowem bonusowym jest każde słowo dopuszczalne
// w grach słownych (jak w Scrabble), które da się ułożyć z liter koła, a nie tylko słowa częste.
const podpisLiter = (w) => [...w].sort().join('');
const poLiterach = new Map();
for (const w of sjp) {
  const p = podpisLiter(w);
  if (!poLiterach.has(p)) poLiterach.set(p, []);
  poLiterach.get(p).push(w);
}
function slowaZKola(litery) {
  const podpisy = new Set();
  for (let maska = 1; maska < 1 << litery.length; maska++) {
    const czesc = litery.filter((_, i) => maska & (1 << i));
    if (czesc.length >= 3) podpisy.add(czesc.sort().join(''));
  }
  return [...podpisy].flatMap((p) => poLiterach.get(p) || []);
}

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
const DZIWNE = new Set(['chu', 'prze', 'owa', 'goi', 'rei', 'peri', 'juz', 'mas', 'ową', 'iii', 'aha', 'och', 'ech', 'ach', 'ups', 'hej', 'hmm', 'ehe', 'oho', 'ani', 'abo', 'ale', 'ową', 'eee', 'yyy', 'okay', 'okej', 'ok', 'ich', 'jej', 'ten', 'tej', 'tym', 'tę', 'się', 'cię', 'mnie', 'nią', 'nim', 'niej', 'tobą']);
// Imiona i angielskie wtrącenia z napisów filmowych ("bart", "berta"): słowo częste po angielsku,
// a rzadkie po polsku, nie trafia do krzyżówki.
const angielskie = new Set(enPath ? fs.readFileSync(enPath, 'utf8').split('\n').slice(0, 30000).map((l) => l.split(' ')[0]) : []);
const obce = (w, r) => angielskie.has(w) && r > 3000;
const progRangi = (w) => (w.length === 3 ? 5000 : w.length === 4 ? 12000 : 25000);
const pulaSiatki = czeste.filter(([w, r]) => r <= progRangi(w) && !DZIWNE.has(w) && !literowka(w, r) && !obce(w, r)).map(([w]) => w);
const wSiatce = new Set(pulaSiatki);

// Słownik odmian SJP: wiersz to lemat i jego formy (kot, kota, koty...). Zapamiętujemy numery
// wierszy tylko dla słów, które mogą trafić do krzyżówki.
const lematy = new Map();
if (odmPath) {
  const rl = readline.createInterface({ input: fs.createReadStream(odmPath, 'utf8'), crlfDelay: Infinity });
  let nr = 0;
  for await (const line of rl) {
    nr++;
    for (const f of line.split(', ')) {
      if (!wSiatce.has(f)) continue;
      if (!lematy.has(f)) lematy.set(f, []);
      if (!lematy.get(f).includes(nr)) lematy.get(f).push(nr);
    }
  }
  console.error(`Odmiany: lematy dla ${lematy.size} słów z puli krzyżówki`);
}

// Słowa z jednego rdzenia wyglądają w krzyżówce jak powtórki (klej, kleje, klei, lej, leje):
// formy tego samego lematu, słowo zawarte w innym albo różnica tylko w końcówce.
const wspolnyPoczatek = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
function pokrewne(a, b) {
  if (a.includes(b) || b.includes(a)) return true;
  if (wspolnyPoczatek(a, b) >= Math.max(3, Math.min(a.length, b.length) - 1)) return true;
  const la = lematy.get(a), lb = lematy.get(b);
  return !!la && !!lb && la.some((n) => lb.includes(n));
}
// Najczęstsze słowa w kolejności, ale każde może mieć najwyżej (limit - 1) pokrewnych wśród już wybranych.
function roznorodne(baza, kandydaci, limit) {
  const wynik = [];
  for (const w of kandydaci) {
    if ([baza, ...wynik].filter((v) => pokrewne(v, w)).length < limit) wynik.push(w);
  }
  return wynik;
}

// Końcowa kontrola poziomu: każdy ciąg co najmniej dwóch liter w siatce (w poziomie i w pionie)
// musi być dokładnie jednym ułożonym słowem, a wszystkie słowa muszą dać się złożyć z koła.
// Dzięki temu żadne słowo nie jest ukryte w innym i nie ma przypadkowych ciągów.
function poprawnyPoziom(wybrane, m) {
  const litery = new Map();
  for (const { s, x, y, d } of wybrane) {
    if (zakazane(s) || !miesci(s, m)) return false;
    for (let i = 0; i < s.length; i++) {
      const klucz = `${x + (d === 'p' ? i : 0)},${y + (d === 'p' ? 0 : i)}`;
      if (litery.has(klucz) && litery.get(klucz) !== s[i]) return false;
      litery.set(klucz, s[i]);
    }
  }
  const ulozone = new Set(wybrane.map(({ s, x, y, d }) => `${d}${x},${y},${s.length}`));
  const ciagi = new Set();
  for (const klucz of litery.keys()) {
    const [x, y] = klucz.split(',').map(Number);
    for (const d of ['p', 'd']) {
      const dx = d === 'p' ? 1 : 0, dy = 1 - dx;
      if (litery.has(`${x - dx},${y - dy}`)) continue; // ciąg zaczyna się wcześniej
      let n = 0;
      while (litery.has(`${x + dx * n},${y + dy * n}`)) n++;
      if (n >= 2) ciagi.add(`${d}${x},${y},${n}`);
    }
  }
  return ciagi.size === ulozone.size && [...ulozone].every((z) => ciagi.has(z));
}

// Układanie słów w krzyżówkę: kratki (x,y), kierunek 'p' (poziomo) lub 'd' (w dół).
function uloz(slowa) {
  let najlepszy = null;
  for (let proba = 0; proba < 40; proba++) {
    const kolejnosc = [slowa[0], ...tasuj(slowa.slice(1))];
    const siatka = new Map();
    const kier = new Map(); // kratka -> kierunki słów, które przez nią przechodzą
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
          // Krzyżować można tylko słowem w innym kierunku. Ten sam kierunek to nakładanie
          // się słów, które chowa jedno w drugim.
          if (c !== w[i] || kier.get(k(cx, cy)).has(d)) return -1;
          skrzyz++;
        } else if (siatka.has(k(cx + dy, cy + dx)) || siatka.has(k(cx - dy, cy - dx))) return -1;
      }
      if (skrzyz === w.length) return -1;
      return skrzyz;
    };
    const poloz = (w, x, y, d) => {
      for (let i = 0; i < w.length; i++) {
        const klucz = k(x + (d === 'p' ? i : 0), y + (d === 'p' ? 0 : i));
        siatka.set(klucz, w[i]);
        if (!kier.has(klucz)) kier.set(klucz, new Set());
        kier.get(klucz).add(d);
      }
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

function zbudujPoziom(baza, kandydaci, m, minS, maxS) {
  if (kandydaci.length + 1 < minS) return null;
  let u = uloz([baza, ...kandydaci.slice(0, maxS + 3)].sort((a, b) => b.length - a.length));
  if (u.w.length > maxS) {
    // Zostaw najczęstsze słowa i ułóż jeszcze raz, żeby siatka nie była przeładowana.
    const zostaw = [baza, ...kandydaci.filter((w) => u.w.some((p) => p.s === w)).slice(0, maxS - 1)];
    u = uloz(zostaw.sort((a, b) => b.length - a.length));
  }
  if (u.w.length < minS || u.W > 12 || u.H > 12) return null;
  return poprawnyPoziom(u.w, m) ? u : null;
}

const uzyteZestawy = new Set();
const poziomy = [];
const statystyka = { bezPokrewnych: 0, zParami: 0 };
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
    const wszystkie = pulaSiatki.filter((w) => w !== baza && miesci(w, m))
      .sort((a, b) => rangaSlowa.get(a) - rangaSlowa.get(b));
    // Najpierw bez słów pokrewnych. Gdy słów jest za mało, każde słowo może mieć jedno pokrewne.
    for (const limit of [1, 2]) {
      const u = zbudujPoziom(baza, roznorodne(baza, wszystkie, limit), m, minS, maxS);
      if (!u) continue;
      const naSiatce = new Set(u.w.map((p) => p.s));
      const bonus = slowaZKola([...baza]).filter((w) => !naSiatce.has(w) && !zakazane(w));
      uzyteZestawy.add(zestaw);
      statystyka[limit === 1 ? 'bezPokrewnych' : 'zParami']++;
      poziom = { l: tasuj([...baza]).join(''), W: u.W, H: u.H, w: u.w, b: bonus };
      break;
    }
  }
  if (!poziom) { console.error(`Brak słów bazowych dla etapu ${klucz} przy poziomie ${n}`); break; }
  poziomy.push(poziom);
}
const sredniaBonusow = poziomy.reduce((s, p) => s + p.b.length, 0) / poziomy.length;
console.error(`Poziomy bez słów pokrewnych: ${statystyka.bezPokrewnych}, z jedną parą na słowo: ${statystyka.zParami}, średnio słów bonusowych: ${sredniaBonusow.toFixed(1)}`);

const slownik = [...new Set(poziomy.flatMap((p) => p.b))];
const bonusIdx = new Map(slownik.map((w, i) => [w, i]));
const wynik = poziomy.map((p) => ({ ...p, b: p.b.map((w) => bonusIdx.get(w)) }));
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'poziomy.json'), JSON.stringify({ slownik, poziomy: wynik }));
console.error(`Zapisano ${poziomy.length} poziomów, słów bonusowych: ${slownik.length}`);
