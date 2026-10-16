// Słowny Szlak: główna logika gry.
import { S, zapisz, dzisiaj, wczoraj } from './stan.js';
import { Kolo } from './kolo.js';
import { rysujKrajobraz, etapDlaPoziomu, SZLAKI, PORY } from './krajobraz.js';
import { Dzwiek, wibruj } from './dzwiek.js';
import { wybuch, konfetti, lot } from './efekty.js';
import { startReklam, mozePelnoekranowa, nagradzana, ustawieniaPrywatnosci } from './reklamy.js';
import { KONFIG } from './konfiguracja.js';
import { natywna, wtyczka } from './natywne.js';

const $ = (s) => document.querySelector(s);
const DUZE = (s) => s.toLocaleUpperCase('pl');

const OPISY = {
  tatry: 'Granie najwyższych szczytów Polski. Słowa robią się tu coraz dłuższe.',
  mazury: 'Kraina tysiąca jezior. Złap wiatr w żagle i szukaj ukrytych słów.',
  baltyk: 'Szum fal i złoty piasek. Na plaży czeka sporo słów bonusowych.',
  bieszczady: 'Połoniny, cisza i dzikie ścieżki. Idealne miejsce na długie słowa.',
  bialowieza: 'Najstarsza puszcza Europy. Żubry patrzą, jak układasz krzyżówki.',
  bledow: 'Polska Sahara. Piasek, słońce i litery, które łatwo przesypać.',
  pieniny: 'Przełom Dunajca. Spłyń flisacką tratwą przez kolejne poziomy.',
  karkonosze: 'Śnieżka i duch gór. Uważaj, tu słowa lubią się chować.',
  roztocze: 'Szumy na rzece Tanew i łagodne wzgórza. Odpocznij przy słowach.',
  leba: 'Ruchome wydmy nad morzem. Każdy krok odsłania nowe litery.',
  kaszuby: 'Jeziora, lasy i kaszubskie wzory. Przed tobą kolejny szlak.',
  beskidy: 'Zielone grzbiety i schroniska. Ostatni odcinek przed nowym okrążeniem.',
};

let DANE = null; // { slownik, poziomy }
let kolo;
let biezacy = null; // stan aktualnego poziomu
let warstwaTla = 0, tloKlucz = null;

// ---------- Tło ----------
function ustawTlo(etap, ziarno) {
  const klucz = etap.szlak.id + etap.pora.id + ziarno;
  if (klucz === tloKlucz) return;
  tloKlucz = klucz;
  const warstwy = document.querySelectorAll('.warstwa-tla');
  warstwaTla = 1 - warstwaTla;
  warstwy[warstwaTla].innerHTML = rysujKrajobraz(etap, ziarno);
  warstwy[warstwaTla].classList.add('widoczna');
  warstwy[1 - warstwaTla].classList.remove('widoczna');
  document.querySelector('meta[name=theme-color]').content = etap.pora.niebo[0];
}

// ---------- Monety ----------
function odswiezMonety(animuj) {
  document.querySelectorAll('[data-monety]').forEach((el) => {
    el.querySelector('span').textContent = S.monety;
    if (animuj) { el.classList.remove('puls'); void el.offsetWidth; el.classList.add('puls'); }
  });
}
function dodajMonety(ile, z) {
  const cel = document.querySelector('.ekran.aktywny [data-monety]') || document.querySelector('[data-monety]');
  const ileMonet = Math.min(10, Math.max(3, Math.round(ile / 5)));
  const start = z || { x: innerWidth / 2, y: innerHeight / 2 };
  let doliczone = 0;
  for (let i = 0; i < ileMonet; i++) {
    lot('<svg><use href="#i-moneta"/></svg>', { x: start.x + (Math.random() - 0.5) * 60, y: start.y + (Math.random() - 0.5) * 40 }, cel, {
      opoznienie: i * 70, czas: 650,
      gotowe: () => {
        const porcja = i === ileMonet - 1 ? ile - doliczone : Math.floor(ile / ileMonet);
        doliczone += porcja; S.monety += porcja; zapisz(); odswiezMonety(true); Dzwiek.moneta();
      },
    });
  }
}

// ---------- Ekrany ----------
function pokazEkran(id) {
  document.querySelectorAll('.ekran').forEach((e) => e.classList.toggle('aktywny', e.id === id));
}
function otworz(id) { $(id).classList.add('otwarta'); }
function zamknij(id) { $(id).classList.remove('otwarta'); }

function logo() {
  const el = $('#logo-litery');
  el.innerHTML = '';
  [['S', 'Ł', 'O', 'W', 'N', 'Y'], ['S', 'Z', 'L', 'A', 'K']].forEach((w, r) => {
    const wiersz = document.createElement('div');
    wiersz.className = 'logo-wiersz';
    w.forEach((l, i) => {
      const k = document.createElement('div');
      k.className = 'logo-kafel' + (r === 1 ? ' d' : '');
      k.textContent = l;
      k.style.animationDelay = `${(r * 6 + i) * 70}ms`;
      wiersz.append(k);
    });
    el.append(wiersz);
  });
}

function ekranStartowy() {
  const etap = etapDlaPoziomu(S.poziom);
  ustawTlo(etap, etap.nr + 1);
  $('#graj-poziom').textContent = `Poziom ${S.poziom}`;
  $('#karta-szlaku').innerHTML = `<b>${etap.szlak.nazwa}</b>${etap.wEtapie - 1} z 20 poziomów<div class="pasek-postepu"><i style="width:${((etap.wEtapie - 1) / 20) * 100}%"></i></div>`;
  const seria = S.ostatniaDzienna === dzisiaj() || S.ostatniaDzienna === wczoraj() ? S.seria : 0;
  $('#seria b').textContent = seria;
  const zrobione = S.ostatniaDzienna === dzisiaj();
  $('#btn-dzienna').classList.toggle('zrobione', zrobione);
  $('#dzienna-opis').textContent = zrobione ? 'Ukończone! Wróć jutro po nowe' : seria ? `Utrzymaj serię: ${seria} ${seria === 1 ? 'dzień' : 'dni'}` : 'Nowa krzyżówka co rano, +50 monet';
  odswiezMonety();
  pokazEkran('ekran-start');
  logo();
}

// ---------- Poziom ----------
function hashDaty(d) { let h = 2166136261; for (const c of d) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

function wczytajPoziom(tryb) {
  if (!DANE) return;
  document.querySelectorAll('.nakladka.otwarta').forEach((n) => n.classList.remove('otwarta'));
  kolo.wylaczone = false;
  let nr, dane, etap, ziarno, zapis;
  if (tryb === 'dzienna') {
    const d = dzisiaj();
    const pula = DANE.poziomy.length - 400;
    nr = 400 + (hashDaty(d) % pula);
    dane = DANE.poziomy[nr];
    const e = etapDlaPoziomu(1 + (hashDaty(d + 's') % 240));
    etap = { ...e, szlak: SZLAKI[hashDaty(d) % SZLAKI.length], pora: PORY[hashDaty(d + 'p') % PORY.length] };
    ziarno = hashDaty(d) % 100000;
    if (!S.dzienna || S.dzienna.data !== d) S.dzienna = { data: d, znalezione: [], odkryte: [], bonusy: [] };
    zapis = S.dzienna;
  } else {
    nr = S.poziom;
    // Po ostatnim wygenerowanym poziomie gramy dalej w kółko, z innym krajobrazem.
    dane = DANE.poziomy[(nr - 1) % DANE.poziomy.length];
    etap = etapDlaPoziomu(nr);
    ziarno = etap.nr + 1;
    if (!S.postep || S.postep.poziom !== nr) S.postep = { poziom: nr, znalezione: [], odkryte: [], bonusy: [] };
    zapis = S.postep;
  }
  zapisz();
  biezacy = { tryb, nr, dane, etap, zapis, kratki: new Map(), slowa: dane.w, bonusy: new Set(dane.b.map((i) => DANE.slownik[i])), seria: 0, ostatnie: 0, koniec: false };
  ustawTlo(etap, ziarno);
  $('#tytul-szlaku').textContent = tryb === 'dzienna' ? 'Wyzwanie dnia' : etap.szlak.nazwa;
  $('#tytul-nr').textContent = tryb === 'dzienna' ? new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' }) : `Poziom ${nr} · ${etap.wEtapie}/20`;
  pokazEkran('ekran-gra');
  rysujSiatke();
  kolo.ustaw(dane.l);
  odswiezSloik();
  odswiezMonety();
  $('#koszt-podp').textContent = KONFIG.kosztPodpowiedzi;
  $('#film-nagroda').textContent = '+' + KONFIG.nagrodaZaReklame;
  if (tryb !== 'dzienna' && nr === 1 && !zapis.znalezione.length) setTimeout(pokazRaczke, 900);
}

function rysujSiatke() {
  const el = $('#siatka');
  el.innerHTML = '';
  const { dane, zapis } = biezacy;
  biezacy.kratki.clear();
  dane.w.forEach((s, idx) => {
    for (let i = 0; i < s.s.length; i++) {
      const x = s.x + (s.d === 'p' ? i : 0), y = s.y + (s.d === 'p' ? 0 : i);
      const k = x + ',' + y;
      if (!biezacy.kratki.has(k)) biezacy.kratki.set(k, { x, y, litera: s.s[i], slowa: [] });
      biezacy.kratki.get(k).slowa.push(idx);
    }
  });
  let n = 0;
  for (const [k, c] of biezacy.kratki) {
    const d = document.createElement('div');
    d.className = 'kratka';
    d.innerHTML = `<div class="l">${DUZE(c.litera)}</div>`;
    d.style.animationDelay = `${(c.x + c.y) * 35 + n++ * 4}ms`;
    c.el = d;
    if (zapis.odkryte.includes(k)) d.classList.add('odkryta', ...(zapis.podpowiedzi?.includes(k) ? ['podpowiedz'] : []));
    el.append(d);
  }
  dopasujSiatke();
}

function dopasujSiatke() {
  if (!biezacy) return;
  const obszar = $('.obszar-siatki').getBoundingClientRect();
  const { W, H } = biezacy.dane;
  const odstep = 5;
  const rozm = Math.max(18, Math.min(62, Math.floor((obszar.width - odstep * (W - 1)) / W), Math.floor((obszar.height - odstep * (H - 1)) / H)));
  const el = $('#siatka');
  el.style.width = `${W * rozm + (W - 1) * odstep}px`;
  el.style.height = `${H * rozm + (H - 1) * odstep}px`;
  for (const c of biezacy.kratki.values()) {
    Object.assign(c.el.style, { left: `${c.x * (rozm + odstep)}px`, top: `${c.y * (rozm + odstep)}px`, width: `${rozm}px`, height: `${rozm}px`, fontSize: `${rozm * 0.6}px` });
  }
}
addEventListener('resize', dopasujSiatke);

function kratkiSlowa(idx) {
  const s = biezacy.slowa[idx];
  return [...Array(s.s.length)].map((_, i) => biezacy.kratki.get((s.x + (s.d === 'p' ? i : 0)) + ',' + (s.y + (s.d === 'p' ? 0 : i))));
}

function odkryjKratke(c, { opoznienie = 0, podpowiedz = false } = {}) {
  const k = c.x + ',' + c.y;
  const z = biezacy.zapis;
  if (!z.odkryte.includes(k)) z.odkryte.push(k);
  if (podpowiedz) { z.podpowiedzi = z.podpowiedzi || []; z.podpowiedzi.push(k); }
  setTimeout(() => {
    c.el.classList.add('odkryta');
    if (podpowiedz) c.el.classList.add('podpowiedz');
    c.el.classList.remove('blysk'); void c.el.offsetWidth; c.el.classList.add('blysk');
  }, opoznienie);
}

// Słowo uznajemy za znalezione także wtedy, gdy wszystkie jego litery zostały odkryte podpowiedziami.
function sprawdzKompletne() {
  const z = biezacy.zapis;
  biezacy.slowa.forEach((s, idx) => {
    if (!z.znalezione.includes(s.s) && kratkiSlowa(idx).every((c) => z.odkryte.includes(c.x + ',' + c.y))) z.znalezione.push(s.s);
  });
}

function komunikat(tekst) {
  const el = $('#komunikat');
  el.textContent = tekst;
  el.classList.toggle('dlugi', tekst.length > 14);
  el.classList.remove('pokaz'); void el.offsetWidth; el.classList.add('pokaz');
}

function podglad(slowo, klasa) {
  const el = $('#podglad');
  if (!klasa) {
    el.className = 'podglad';
    el.innerHTML = [...slowo].map((l) => `<span class="pl">${DUZE(l)}</span>`).join('');
    return;
  }
  el.className = 'podglad ' + klasa;
  setTimeout(() => { if (el.classList.contains(klasa)) el.classList.add('znika'); }, klasa === 'zle' ? 420 : 250);
  setTimeout(() => { if (el.classList.contains(klasa)) { el.innerHTML = ''; el.className = 'podglad'; } }, 700);
}

const POCHWALY = ['Dobrze!', 'Świetnie!', 'Rewelacja!', 'Mistrzostwo!', 'Niesamowite!', 'Geniusz!'];

function naSlowo(slowo) {
  if (!biezacy || biezacy.koniec) return;
  const z = biezacy.zapis;
  const idx = biezacy.slowa.findIndex((s) => s.s === slowo);
  if (idx >= 0 && !z.znalezione.includes(slowo)) {
    z.znalezione.push(slowo);
    S.slowWszystkich++;
    const kratki = kratkiSlowa(idx);
    kratki.forEach((c, i) => odkryjKratke(c, { opoznienie: i * 70 }));
    sprawdzKompletne();
    zapisz();
    podglad(slowo, 'dobre');
    Dzwiek.slowo(); wibruj(18);
    const ost = kratki[kratki.length - 1].el.getBoundingClientRect();
    setTimeout(() => wybuch(ost.left + ost.width / 2, ost.top + ost.height / 2, { ile: 14 + slowo.length * 3 }), kratki.length * 70);
    const teraz = Date.now();
    biezacy.seria = teraz - biezacy.ostatnie < 6000 ? biezacy.seria + 1 : 0;
    biezacy.ostatnie = teraz;
    if (biezacy.seria >= 1 || slowo.length >= 6) komunikat(POCHWALY[Math.min(biezacy.seria + (slowo.length >= 6 ? 1 : 0), POCHWALY.length - 1)]);
    if (z.znalezione.length >= biezacy.slowa.length) setTimeout(wygrana, kratki.length * 70 + 450);
  } else if (idx >= 0) {
    kratkiSlowa(idx).forEach((c) => { c.el.classList.remove('juz'); void c.el.offsetWidth; c.el.classList.add('juz'); });
    podglad(slowo, 'zle');
    Dzwiek.juzByl();
  } else if (biezacy.bonusy.has(slowo) && !z.bonusy.includes(slowo)) {
    z.bonusy.push(slowo);
    S.sloik++; S.znalezioneBonusy++;
    podglad(slowo, 'bonus');
    Dzwiek.bonus(); wibruj(10);
    const p = $('#podglad').getBoundingClientRect();
    lot(DUZE(slowo), { x: p.left + p.width / 2, y: p.top + p.height / 2 }, $('#btn-sloik'), { klasa: 'leci litera-leci', czas: 600, gotowe: odswiezSloik });
    if (S.sloik >= KONFIG.bonusowDoSloika) {
      S.sloik -= KONFIG.bonusowDoSloika;
      const b = $('#btn-sloik').getBoundingClientRect();
      setTimeout(() => { komunikat('Pełny słoik!'); dodajMonety(KONFIG.nagrodaZaSloik, { x: b.left + b.width / 2, y: b.top }); }, 650);
    }
    zapisz();
  } else if (biezacy.bonusy.has(slowo)) {
    podglad(slowo, 'zle'); Dzwiek.juzByl();
  } else {
    podglad(slowo, 'zle'); Dzwiek.blad(); wibruj(30);
  }
}

function odswiezSloik() {
  $('#sloik-licznik').textContent = S.sloik;
  $('#sloik-wyp').style.height = `${(S.sloik / KONFIG.bonusowDoSloika) * 40}%`;
}

function podpowiedz() {
  if (!biezacy || biezacy.koniec) return;
  if (S.monety < KONFIG.kosztPodpowiedzi) { zaMalo(); return; }
  const z = biezacy.zapis;
  // Odkrywamy pierwszą brakującą literę najkrótszego nieznalezionego słowa.
  const brak = biezacy.slowa.map((s, idx) => ({ s, idx })).filter(({ s }) => !z.znalezione.includes(s.s)).sort((a, b) => a.s.s.length - b.s.s.length);
  for (const { idx } of brak) {
    const c = kratkiSlowa(idx).find((k) => !z.odkryte.includes(k.x + ',' + k.y));
    if (!c) continue;
    S.monety -= KONFIG.kosztPodpowiedzi;
    odswiezMonety(true);
    odkryjKratke(c, { podpowiedz: true });
    Dzwiek.podpowiedz(); wibruj(14);
    const r = c.el.getBoundingClientRect();
    wybuch(r.left + r.width / 2, r.top + r.height / 2, { ile: 12, kolory: ['#b9e3ff', '#fff', '#7cc6ff'] });
    sprawdzKompletne();
    zapisz();
    if (z.znalezione.length >= biezacy.slowa.length) setTimeout(wygrana, 600);
    return;
  }
}

function zaMalo() {
  komunikat('Za mało monet');
  const b = $('#btn-film');
  b.classList.remove('pelny'); void b.offsetWidth; b.classList.add('pelny');
}

async function film() {
  const b = $('#btn-film');
  if (b.classList.contains('wylaczony')) return;
  b.classList.add('wylaczony');
  const ok = await nagradzana();
  b.classList.remove('wylaczony');
  if (ok) { const r = b.getBoundingClientRect(); dodajMonety(KONFIG.nagrodaZaReklame, { x: r.left + r.width / 2, y: r.top }); }
  else komunikat('Reklama niedostępna');
}

// ---------- Wygrana ----------
function wygrana() {
  if (biezacy.koniec) return;
  biezacy.koniec = true;
  kolo.wylaczone = true;
  Dzwiek.wygrana(); wibruj(40);
  konfetti();
  const { tryb, nr, etap } = biezacy;
  let nagroda = KONFIG.nagrodaZaPoziom + Math.floor(biezacy.slowa.length / 2);
  if (tryb === 'dzienna') {
    nagroda = 50;
    S.seria = S.ostatniaDzienna === wczoraj() ? S.seria + 1 : S.ostatniaDzienna === dzisiaj() ? S.seria : 1;
    S.ostatniaDzienna = dzisiaj();
    $('#wygrana-tytul').textContent = 'Wyzwanie ukończone!';
    $('#wygrana-opis').textContent = `Seria: ${S.seria} ${S.seria === 1 ? 'dzień' : 'dni'} z rzędu. Jutro czeka nowa krzyżówka.`;
    $('#wygrana-kropki').innerHTML = '';
  } else {
    S.poziom = nr + 1;
    S.postep = null;
    $('#wygrana-tytul').textContent = ['Brawo!', 'Super!', 'Pięknie!', 'Ekstra!', 'Wspaniale!'][nr % 5];
    $('#wygrana-opis').textContent = etap.wEtapie === 20 ? `Szlak ${etap.szlak.nazwa} ukończony!` : `${etap.szlak.nazwa}: poziom ${etap.wEtapie} z 20`;
    $('#wygrana-kropki').innerHTML = Array.from({ length: 20 }, (_, i) => `<i class="${i < etap.wEtapie - 1 ? 'z' : i === etap.wEtapie - 1 ? 'teraz' : ''}"></i>`).join('');
  }
  zapisz();
  $('#wygrana-nagroda').innerHTML = `<span><svg><use href="#i-moneta"/></svg>+${nagroda}</span>`;
  setTimeout(() => {
    otworz('#wygrana');
    setTimeout(() => {
      const r = $('#wygrana-nagroda').getBoundingClientRect();
      dodajMonety(nagroda, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }, 700);
  }, 900);
}

async function dalej() {
  zamknij('#wygrana');
  const { tryb, nr, etap } = biezacy;
  kolo.wylaczone = false;
  if (tryb === 'dzienna') { biezacy = null; ekranStartowy(); return; }
  await mozePelnoekranowa(nr);
  if (etap.wEtapie === 20) {
    const nowy = etapDlaPoziomu(nr + 1);
    $('#szlak-miniatura').innerHTML = rysujKrajobraz(nowy, nowy.nr + 1).replace('xMidYMax slice', 'xMidYMid slice');
    $('#szlak-nazwa').textContent = nowy.szlak.nazwa;
    $('#szlak-opis').textContent = OPISY[nowy.szlak.id] || '';
    otworz('#nowy-szlak');
    return;
  }
  wczytajPoziom('kampania');
}

// ---------- Samouczek ----------
function pokazRaczke() {
  if (!biezacy || biezacy.nr !== 1 || biezacy.zapis.znalezione.length) return;
  const r = $('#raczka');
  const cel = biezacy.slowa[0].s;
  const uzyte = [];
  const pkt = [...cel].map((l) => {
    const i = kolo.litery.findIndex((x, j) => x === l && !uzyte.includes(j));
    uzyte.push(i);
    const p = kolo.pozycje[i], b = kolo.el.getBoundingClientRect();
    return [b.left + p[0], b.top + p[1]];
  });
  let t0 = null;
  const dl = 900 * pkt.length;
  r.classList.add('pokaz');
  const krok = (t) => {
    if (!biezacy || biezacy.zapis.znalezione.length || kolo.aktywne) { r.classList.remove('pokaz'); if (biezacy && !biezacy.zapis.znalezione.length) setTimeout(pokazRaczke, 4000); return; }
    t0 ??= t;
    const p = ((t - t0) % (dl + 800)) / dl;
    const q = Math.min(p, 1) * (pkt.length - 1);
    const i = Math.min(Math.floor(q), pkt.length - 2), f = q - i;
    const x = pkt[i][0] + (pkt[i + 1][0] - pkt[i][0]) * f, y = pkt[i][1] + (pkt[i + 1][1] - pkt[i][1]) * f;
    r.style.transform = `translate(${x - 14}px, ${y - 6}px)`;
    requestAnimationFrame(krok);
  };
  requestAnimationFrame(krok);
  komunikat('Przeciągnij po literach');
}

// ---------- Start ----------
function podepnij() {
  kolo = new Kolo($('#kolo'), {
    naLitere: (i) => { Dzwiek.litera(i); wibruj(8); },
    naZmiane: (s) => podglad(s),
    naSlowo,
  });
  $('#btn-graj').onclick = () => { Dzwiek.odblokuj(); Dzwiek.klik(); wczytajPoziom('kampania'); };
  $('#btn-dzienna').onclick = () => { Dzwiek.odblokuj(); Dzwiek.klik(); wczytajPoziom('dzienna'); };
  $('#btn-wstecz').onclick = () => { Dzwiek.klik(); biezacy = null; ekranStartowy(); };
  $('#btn-tasuj').onclick = () => { kolo.tasuj(); Dzwiek.tasuj(); wibruj(10); };
  $('#btn-podpowiedz').onclick = podpowiedz;
  $('#btn-film').onclick = film;
  // W przeglądarce nie ma reklam, więc przycisk filmu pokazujemy tylko w aplikacji (albo z ?dev do testów).
  if (!natywna() && !location.search.includes('dev')) $('#btn-film').style.display = 'none';
  $('#btn-dalej').onclick = dalej;
  $('#btn-szlak').onclick = () => { zamknij('#nowy-szlak'); wczytajPoziom('kampania'); };
  $('#btn-sloik').onclick = () => {
    const z = biezacy?.zapis;
    $('#sloik-ile').textContent = KONFIG.bonusowDoSloika;
    $('#lista-bonusow').innerHTML = z?.bonusy.length ? z.bonusy.map((b) => `<span>${DUZE(b)}</span>`).join('') : '<em>Na tym poziomie jeszcze nic.</em>';
    otworz('#okno-sloik');
  };
  $('#sloik-zamknij').onclick = () => zamknij('#okno-sloik');
  $('#btn-ustawienia').onclick = () => {
    $('#u-dzwiek').checked = S.dzwiek; $('#u-wibracje').checked = S.wibracje;
    $('#u-polityka').href = KONFIG.politykaPrywatnosci;
    $('#u-wersja').textContent = 'Wersja ' + KONFIG.wersja + '.';
    $('#u-prywatnosc-reklam').style.display = natywna() ? '' : 'none';
    otworz('#ustawienia');
  };
  $('#u-dzwiek').onchange = (e) => { S.dzwiek = e.target.checked; zapisz(); };
  $('#u-wibracje').onchange = (e) => { S.wibracje = e.target.checked; zapisz(); };
  $('#u-prywatnosc-reklam').onclick = ustawieniaPrywatnosci;
  $('#u-zamknij').onclick = () => zamknij('#ustawienia');
  // Przycisk "wstecz" na Androidzie
  wtyczka('App')?.addListener('backButton', () => {
    const otwarta = document.querySelector('.nakladka.otwarta');
    if (otwarta && otwarta.id !== 'wygrana') otwarta.classList.remove('otwarta');
    else if (biezacy) { biezacy = null; ekranStartowy(); }
    else wtyczka('App').exitApp();
  });
}

async function main() {
  try {
    podepnij();
    ekranStartowy();
    const odp = await fetch('poziomy.json');
    DANE = await odp.json();
    window.__gra = { S, DANE, wczytajPoziom, naSlowo: (s) => naSlowo(s), biezacy: () => biezacy };
  } finally {
    wtyczka('SplashScreen')?.hide();
  }
  startReklam();
}
main();
