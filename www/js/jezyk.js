// Język gry: polski na urządzeniach z językiem polskim, na pozostałych angielski.
// Gracz może go zmienić w ustawieniach; każdy język ma własne poziomy i własny postęp.
const KLUCZ = 'slowny-szlak-jezyk';

let wybrany = null;
try { wybrany = localStorage.getItem(KLUCZ); } catch { /* tryb prywatny */ }
const systemowy = (navigator.language || 'pl').toLowerCase().startsWith('pl') ? 'pl' : 'en';
export const JEZYK = wybrany === 'pl' || wybrany === 'en' ? wybrany : systemowy;
export const EN = JEZYK === 'en';

export function zmienJezyk(j) {
  try { localStorage.setItem(KLUCZ, j); } catch { /* tryb prywatny: zmiana tylko do restartu */ }
  location.reload();
}

const dni = (n) => (n === 1 ? 'dzień' : 'dni');
const days = (n) => (n === 1 ? 'day' : 'days');

const TEKSTY = {
  pl: {
    logo: [['S', 'Ł', 'O', 'W', 'N', 'Y'], ['S', 'Z', 'L', 'A', 'K']],
    literyPodgladu: ['S', 'Ł', 'O'],
    plikPoziomow: 'poziomy.json',
    data: 'pl-PL',
    poziom: (n) => `Poziom ${n}`,
    zPoziomow: (n) => `${n} z 20 poziomów`,
    dziennaZrobiona: 'Ukończone! Wróć jutro po nowe',
    dziennaSeria: (n) => `Utrzymaj serię: ${n} ${dni(n)}`,
    dziennaNowa: 'Nowa krzyżówka co rano, +50 monet',
    wyzwanieDnia: 'Wyzwanie dnia',
    poziomWEtapie: (n, e) => `Poziom ${n} · ${e}/20`,
    wrocJutro: 'Wróć jutro po nowe!',
    pochwaly: ['Dobrze!', 'Świetnie!', 'Rewelacja!', 'Mistrzostwo!', 'Niesamowite!', 'Geniusz!'],
    pelnySloik: 'Pełny słoik!',
    podpowiedz: 'Podpowiedź',
    podpowiedzReklama: 'Podpowiedź za reklamę',
    reklamaNiedostepna: 'Reklama niedostępna',
    zaMaloMonet: 'Za mało monet',
    wyzwanieUkonczone: 'Wyzwanie ukończone!',
    seriaOpis: (n) => `Seria: ${n} ${dni(n)} z rzędu. Jutro czeka nowa krzyżówka.`,
    brawa: ['Brawo!', 'Super!', 'Pięknie!', 'Ekstra!', 'Wspaniale!'],
    szlakUkonczony: (s) => `Szlak ${s} ukończony!`,
    szlakPoziom: (s, e) => `${s}: poziom ${e} z 20`,
    przeciagnij: 'Przeciągnij po literach',
    wUzyciu: 'W użyciu',
    wybierz: 'Wybierz',
    monet: (n) => `${n} monet`,
    motywZaDrogi: (m, c) => `Za mało monet. ${m} kosztuje ${c}.`,
    pustySloik: 'Na tym poziomie jeszcze nic.',
    wersja: (w) => `Wersja ${w}.`,
    reklamyUsuniete: 'Reklamy są usunięte. Dziękujemy!',
    usunReklamyCena: (c) => `Usuń reklamy · ${c}`,
    zakupOk: 'Dziękujemy! Reklamy usunięte, a podpowiedzi są bez limitu.',
    zakupOczekuje: 'Zakup czeka na potwierdzenie w Google Play.',
    zakupBlad: 'Zakup nie został dokończony. Spróbuj ponownie.',
    zakupPrzywrocony: 'Zakup przywrócony. Reklamy są usunięte.',
    zakupBrak: 'Nie znaleziono zakupu na tym koncie Google.',
    jezykPrzycisk: 'Play in English',
    reklamaTestowa: '<b>Reklama testowa</b><p>W aplikacji w tym miejscu wyświetli się krótka reklama.</p>',
  },
  en: {
    logo: [['W', 'O', 'R', 'D'], ['T', 'R', 'A', 'I', 'L']],
    literyPodgladu: ['W', 'O', 'R'],
    plikPoziomow: 'poziomy-en.json',
    data: 'en-GB',
    poziom: (n) => `Level ${n}`,
    zPoziomow: (n) => `${n} of 20 levels`,
    dziennaZrobiona: 'Done! Come back tomorrow',
    dziennaSeria: (n) => `Keep your streak: ${n} ${days(n)}`,
    dziennaNowa: 'A new crossword every morning, +50 coins',
    wyzwanieDnia: 'Daily challenge',
    poziomWEtapie: (n, e) => `Level ${n} · ${e}/20`,
    wrocJutro: 'Come back tomorrow!',
    pochwaly: ['Good!', 'Great!', 'Excellent!', 'Brilliant!', 'Amazing!', 'Genius!'],
    pelnySloik: 'Jar is full!',
    podpowiedz: 'Hint',
    podpowiedzReklama: 'Hint for an ad',
    reklamaNiedostepna: 'No ad available',
    zaMaloMonet: 'Not enough coins',
    wyzwanieUkonczone: 'Challenge complete!',
    seriaOpis: (n) => `Streak: ${n} ${days(n)} in a row. A new crossword awaits tomorrow.`,
    brawa: ['Well done!', 'Super!', 'Lovely!', 'Great!', 'Wonderful!'],
    szlakUkonczony: (s) => `${s} trail complete!`,
    szlakPoziom: (s, e) => `${s}: level ${e} of 20`,
    przeciagnij: 'Swipe across the letters',
    wUzyciu: 'In use',
    wybierz: 'Select',
    monet: (n) => `${n} coins`,
    motywZaDrogi: (m, c) => `Not enough coins. ${m} costs ${c}.`,
    pustySloik: 'Nothing on this level yet.',
    wersja: (w) => `Version ${w}.`,
    reklamyUsuniete: 'Ads are removed. Thank you!',
    usunReklamyCena: (c) => `Remove ads · ${c}`,
    zakupOk: 'Thank you! Ads are removed and hints are unlimited.',
    zakupOczekuje: 'The purchase is waiting for confirmation in Google Play.',
    zakupBlad: 'The purchase was not completed. Please try again.',
    zakupPrzywrocony: 'Purchase restored. Ads are removed.',
    zakupBrak: 'No purchase found on this Google account.',
    jezykPrzycisk: 'Graj po polsku',
    reklamaTestowa: '<b>Test ad</b><p>In the app, a short ad will appear here.</p>',
    // Polskie krainy zostają polskie, z angielskim opisem: to wyróżnia grę wśród angielskich krzyżówek.
    szlaki: {
      tatry: 'Tatra Mountains', mazury: 'Masurian Lakes', baltyk: 'Baltic Coast', bieszczady: 'Bieszczady',
      bialowieza: 'Białowieża Forest', bledow: 'Błędów Desert', pieniny: 'Pieniny', karkonosze: 'Karkonosze',
      roztocze: 'Roztocze', leba: 'Łeba Dunes', kaszuby: 'Kashubia', beskidy: 'Silesian Beskids',
    },
    opisy: {
      tatry: 'The highest peaks in Poland. Words get longer up here.',
      mazury: 'The land of a thousand lakes. Catch the wind and look for hidden words.',
      baltyk: 'Rolling waves and golden sand. Plenty of bonus words wait on the beach.',
      bieszczady: 'Mountain meadows, silence and wild paths. Perfect for long words.',
      bialowieza: 'The oldest forest in Europe. Bison watch you solve crosswords.',
      bledow: 'The Polish Sahara. Sand, sun and letters that shift easily.',
      pieniny: 'The Dunajec gorge. Raft through the next levels.',
      karkonosze: 'Śnieżka peak and the spirit of the mountains. Words like to hide here.',
      roztocze: 'Little waterfalls on the Tanew river and gentle hills. Relax with words.',
      leba: 'Moving dunes by the sea. Every step reveals new letters.',
      kaszuby: 'Lakes, forests and Kashubian patterns. Another trail lies ahead.',
      beskidy: 'Green ridges and mountain huts. The last stretch before a new lap.',
    },
    motywy: { klasyczny: 'Classic', drewno: 'Wood', pergamin: 'Parchment', szklo: 'Glass', pastel: 'Pastel' },
    // Teksty w index.html (atrybut data-t). Polska wersja jest wpisana w HTML.
    strona: {
      opisStrony: 'Word Trail: a relaxing word game. Connect letters, fill the crossword and travel across Poland.',
      ustawienia: 'Settings',
      podLogo: 'letter crosswords · a journey across Poland',
      graj: 'Play',
      wyzwanieDnia: 'Daily challenge',
      nowaCoRano: 'A new crossword every morning',
      wroc: 'Back',
      sloikBonusow: 'Bonus word jar',
      wymieszaj: 'Shuffle letters',
      filmZaMonety: 'Watch an ad for coins',
      podpowiedz: 'Hint',
      brawo: 'Well done!',
      dalej: 'Next',
      nowySzlak: 'New trail unlocked',
      ruszamy: "Let's go!",
      dzwieki: 'Sounds',
      wibracje: 'Vibration',
      usunReklamy: 'Remove ads',
      przywroc: 'Restore purchase',
      wygladLiter: 'Letter style',
      prywatnoscReklam: 'Ad privacy settings',
      polityka: 'Privacy policy',
      gotowe: 'Done',
      sloikSlow: 'Word jar',
      wracam: 'Back to the game',
    },
    stronaHtml: {
      zrodla: 'Words: ENABLE word list (public domain) and FrequencyWords (CC BY-SA 4.0). Nunito font (SIL OFL). <span id="u-wersja"></span>',
      sloikOpis: 'Find words that are not in the crossword. Every <b id="sloik-ile">8</b> earns you coins.',
    },
  },
};

export function t(klucz, ...arg) {
  const v = TEKSTY[JEZYK][klucz] ?? TEKSTY.pl[klucz];
  return typeof v === 'function' ? v(...arg) : v;
}

export const nazwaSzlaku = (szlak) => (EN && TEKSTY.en.szlaki[szlak.id]) || szlak.nazwa;
export const nazwaMotywu = (m) => (EN && TEKSTY.en.motywy[m.id]) || m.nazwa;
export const opisSzlaku = (id) => (EN ? TEKSTY.en.opisy[id] : null);

// Polskie teksty są wpisane w index.html, więc tłumaczymy stronę tylko w wersji angielskiej.
export function przetlumaczStrone() {
  document.documentElement.lang = JEZYK;
  if (!EN) return;
  const { strona, stronaHtml } = TEKSTY.en;
  document.title = 'Word Trail';
  document.querySelector('meta[name=description]').content = strona.opisStrony;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = strona[el.dataset.t]; });
  document.querySelectorAll('[data-t-aria]').forEach((el) => el.setAttribute('aria-label', strona[el.dataset.tAria]));
  document.querySelectorAll('[data-t-html]').forEach((el) => { el.innerHTML = stronaHtml[el.dataset.tHtml]; });
}
