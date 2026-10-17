// Zakup „usuń reklamy” przez Google Play Billing (wtyczka @capgo/native-purchases).
// Zakup zapisujemy też na urządzeniu, ale przy każdym uruchomieniu pytamy Google Play,
// więc zwrot zakupu zdejmuje go ze stanu. Bez sieci zostaje to, co zapisane.
import { KONFIG } from './konfiguracja.js';
import { S, zapisz } from './stan.js';
import { natywna, wtyczka } from './natywne.js';

const ID = KONFIG.produkty.bezReklam;
const Sklep = () => wtyczka('NativePurchases');

export const zakupyDostepne = () => natywna() && !!Sklep();

function ustaw(kupione) {
  if (S.bezReklam === kupione) return;
  S.bezReklam = kupione;
  zapisz();
}

// Cena z Google Play, np. "12,99 zł". Null, gdy sklep jest niedostępny albo produktu nie ma w Play Console.
export async function cenaBezReklam() {
  if (!zakupyDostepne()) return null;
  try {
    const { products } = await Sklep().getProducts({ productIdentifiers: [ID], productType: 'inapp' });
    return products?.find((p) => p.identifier === ID)?.priceString ?? null;
  } catch {
    return null;
  }
}

// Sprawdza zakupy w Google Play i zapisuje wynik. Przy braku sieci zostaje stan z zapisu.
export async function sprawdzZakupy() {
  if (!zakupyDostepne()) return;
  try {
    const { purchases } = await Sklep().getPurchases({ productType: 'inapp' });
    const zakup = purchases?.find((p) => p.productIdentifier === ID && p.purchaseState === '1');
    if (zakup) {
      // Niepotwierdzony zakup Google zwróci po kilku dniach, więc potwierdzamy go od razu.
      if (zakup.isAcknowledged === false && zakup.purchaseToken) {
        try { await Sklep().acknowledgePurchase({ purchaseToken: zakup.purchaseToken }); } catch { /* ponowimy przy następnym uruchomieniu */ }
      }
    }
    ustaw(!!zakup);
  } catch {
    /* brak sieci: zostaje to, co zapisane */
  }
}

// Zwraca 'ok', 'oczekuje' (płatność jeszcze nie przeszła) albo 'blad'.
export async function kupBezReklam() {
  if (!zakupyDostepne()) return 'blad';
  try {
    const transakcja = await Sklep().purchaseProduct({ productIdentifier: ID, productType: 'inapp', autoAcknowledgePurchases: true });
    if (transakcja?.purchaseState !== '1') return 'oczekuje';
    ustaw(true);
    return 'ok';
  } catch {
    // Zakup mógł przejść mimo błędu (np. zerwane połączenie), więc sprawdzamy w Google Play.
    await sprawdzZakupy();
    return S.bezReklam ? 'ok' : 'blad';
  }
}

// Przywraca zakup na nowym urządzeniu. Zwraca true, gdy zakup jest na koncie.
export async function przywrocZakup() {
  if (!zakupyDostepne()) return false;
  try { await Sklep().restorePurchases(); } catch { /* sprawdzimy poniżej */ }
  await sprawdzZakupy();
  return S.bezReklam;
}
