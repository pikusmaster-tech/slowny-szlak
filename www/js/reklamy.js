// Warstwa reklam: AdMob w aplikacji na Androida, symulacja w przeglądarce.
import { t } from './jezyk.js';
import { KONFIG } from './konfiguracja.js';
import { S, zapisz } from './stan.js';
import { natywna, wtyczka } from './natywne.js';

const AdMob = () => wtyczka('AdMob');

let gotowe = false, startuje = null, ostatnia = 0;

// Start jest powtarzalny: bez sieci przy uruchomieniu (zgoda RODO jej wymaga) spróbujemy ponownie później.
export function startReklam() {
  if (!natywna() || !AdMob() || gotowe) return Promise.resolve();
  startuje ??= (async () => {
    try {
      await AdMob().initialize({ initializeForTesting: KONFIG.admob.testowe });
      // Zgoda RODO (UMP): formularz pokazuje się tylko wtedy, gdy jest wymagany.
      const info = await AdMob().requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob().showConsentForm();
      gotowe = true;
      przygotujPelnoekranowa();
      przygotujNagradzana();
    } catch (e) { console.warn('AdMob', e); }
  })().finally(() => { startuje = null; });
  return startuje;
}

if (natywna()) {
  addEventListener('online', () => startReklam());
  wtyczka('App')?.addListener('resume', () => startReklam());
}

async function przygotujPelnoekranowa() {
  try { await AdMob().prepareInterstitial({ adId: KONFIG.admob.pelnoekranowa, isTesting: KONFIG.admob.testowe }); } catch { /* spróbujemy przy następnej okazji */ }
}
async function przygotujNagradzana() {
  try { await AdMob().prepareRewardVideoAd({ adId: KONFIG.admob.nagradzana, isTesting: KONFIG.admob.testowe }); } catch { /* spróbujemy przy następnej okazji */ }
}

// Czeka na pierwsze z podanych zdarzeń wtyczki (albo na limit czasu) i sprząta nasłuchy.
async function czekajNa(zdarzenia, limitMs) {
  const uchwyty = [];
  let koniec;
  const obietnica = new Promise((ok) => { koniec = ok; });
  for (const z of zdarzenia) uchwyty.push(await AdMob().addListener(z, () => koniec(z)));
  const t = setTimeout(() => koniec('limit'), limitMs);
  return {
    obietnica,
    zakoncz: koniec,
    sprzataj: () => { clearTimeout(t); uchwyty.forEach((u) => u?.remove?.()); },
  };
}

// Wołane po ukończeniu poziomu. Szanuje gracza: nie na początku i nie za często.
export async function mozePelnoekranowa(nrPoziomu) {
  if (S.bezReklam || nrPoziomu < KONFIG.reklamyOdPoziomu) return;
  S.odOstatniejReklamy++; zapisz();
  if (S.odOstatniejReklamy < KONFIG.reklamaCoPoziomow) return;
  if (Date.now() - ostatnia < KONFIG.reklamaMinOdstep * 1000) return;
  if (!natywna() || !AdMob()) return;
  if (!gotowe) { startReklam(); return; }
  // Następną reklamę ładujemy dopiero po zamknięciu bieżącej: wtyczka usuwa przy zamknięciu
  // reklamę zapisaną pod tym samym identyfikatorem, więc wcześniejsze ładowanie by przepadło.
  const czekanie = await czekajNa(['interstitialAdDismissed', 'interstitialAdFailedToShow'], 10 * 60 * 1000);
  try {
    await AdMob().showInterstitial();
    ostatnia = Date.now(); S.odOstatniejReklamy = 0; zapisz();
  } catch { czekanie.zakoncz('brak'); }
  czekanie.obietnica.then(() => { czekanie.sprzataj(); przygotujPelnoekranowa(); });
}

// Reklama z nagrodą: zwraca true, jeśli gracz obejrzał ją do końca.
// Wtyczka nie kończy showRewardVideoAd, gdy reklama zostanie zamknięta bez nagrody,
// dlatego czekamy na zdarzenie zamknięcia albo błędu, a nie na samą obietnicę.
export async function nagradzana() {
  if (!natywna() || !AdMob()) return symulacja();
  if (!gotowe) await startReklam();
  if (!gotowe) return false;
  let nagroda = false;
  const czekanie = await czekajNa(['onRewardedVideoAdDismissed', 'onRewardedVideoAdFailedToShow'], 5 * 60 * 1000);
  const uchwytNagrody = await AdMob().addListener('onRewardedVideoAdReward', () => { nagroda = true; });
  AdMob().showRewardVideoAd().then((r) => { if (r) nagroda = true; }).catch(() => czekanie.zakoncz('brak'));
  const wynik = await czekanie.obietnica;
  czekanie.sprzataj();
  uchwytNagrody?.remove?.();
  if (wynik !== 'brak') ostatnia = Date.now();
  przygotujNagradzana();
  return nagroda;
}

export async function ustawieniaPrywatnosci() {
  if (natywna() && AdMob()) { try { await AdMob().showPrivacyOptionsForm(); } catch { /* niedostępne */ } }
}

// W przeglądarce pokazujemy planszę zastępczą, żeby dało się przetestować cały przepływ.
function symulacja() {
  return new Promise((ok) => {
    const el = document.createElement('div');
    el.className = 'reklama-sym';
    el.innerHTML = `<div>${t('reklamaTestowa')}<span>3</span></div>`;
    document.body.append(el);
    let n = 3;
    const t = setInterval(() => {
      n--; el.querySelector('span').textContent = n;
      if (n <= 0) { clearInterval(t); el.remove(); ok(true); }
    }, 700);
  });
}
