// Warstwa reklam: AdMob w aplikacji na Androida, symulacja w przeglądarce.
import { KONFIG } from './konfiguracja.js';
import { S, zapisz } from './stan.js';

import { natywna, wtyczka } from './natywne.js';

const AdMob = () => wtyczka('AdMob');

let gotowe = false, ostatnia = 0, mozna = true;

export async function startReklam() {
  if (!natywna() || !AdMob()) return;
  try {
    await AdMob().initialize({ initializeForTesting: KONFIG.admob.testowe });
    // Zgoda RODO (UMP): formularz pokazuje się tylko wtedy, gdy jest wymagany.
    const info = await AdMob().requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob().showConsentForm();
    gotowe = true;
    przygotujPelnoekranowa();
    przygotujNagradzana();
  } catch (e) { console.warn('AdMob', e); }
}

async function przygotujPelnoekranowa() {
  try { await AdMob().prepareInterstitial({ adId: KONFIG.admob.pelnoekranowa, isTesting: KONFIG.admob.testowe }); } catch { /* spróbujemy później */ }
}
async function przygotujNagradzana() {
  try { await AdMob().prepareRewardVideoAd({ adId: KONFIG.admob.nagradzana, isTesting: KONFIG.admob.testowe }); } catch { /* spróbujemy później */ }
}

// Wołane po ukończeniu poziomu. Szanuje gracza: nie na początku i nie za często.
export async function mozePelnoekranowa(nrPoziomu) {
  if (S.bezReklam || nrPoziomu < KONFIG.reklamyOdPoziomu) return;
  S.odOstatniejReklamy++; zapisz();
  if (S.odOstatniejReklamy < KONFIG.reklamaCoPoziomow) return;
  if (Date.now() - ostatnia < KONFIG.reklamaMinOdstep * 1000) return;
  if (!natywna() || !gotowe || !mozna) return;
  try {
    await AdMob().showInterstitial();
    ostatnia = Date.now(); S.odOstatniejReklamy = 0; zapisz();
  } catch { /* brak reklamy, gramy dalej */ }
  przygotujPelnoekranowa();
}

// Reklama z nagrodą: zwraca true, jeśli gracz obejrzał ją do końca.
export async function nagradzana() {
  if (!natywna() || !AdMob()) return symulacja();
  if (!gotowe) return false;
  let nagroda = false;
  const l = await AdMob().addListener('onRewardedVideoAdReward', () => { nagroda = true; });
  try { const r = await AdMob().showRewardVideoAd(); if (r) nagroda = true; } catch { /* reklama niedostępna */ }
  l?.remove?.();
  ostatnia = Date.now();
  przygotujNagradzana();
  return nagroda;
}

export async function ustawieniaPrywatnosci() {
  if (natywna() && AdMob()?.showPrivacyOptionsForm) { try { await AdMob().showPrivacyOptionsForm(); } catch { /* niedostępne */ } }
}

// W przeglądarce pokazujemy planszę zastępczą, żeby dało się przetestować cały przepływ.
function symulacja() {
  return new Promise((ok) => {
    const el = document.createElement('div');
    el.className = 'reklama-sym';
    el.innerHTML = `<div><b>Reklama testowa</b><p>W aplikacji w tym miejscu wyświetli się krótka reklama.</p><span>3</span></div>`;
    document.body.append(el);
    let n = 3;
    const t = setInterval(() => {
      n--; el.querySelector('span').textContent = n;
      if (n <= 0) { clearInterval(t); el.remove(); ok(true); }
    }, 700);
  });
}
