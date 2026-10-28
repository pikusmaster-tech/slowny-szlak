// Wysyła pakiet AAB do Google Play i opcjonalnie aktualizuje opis w sklepie.
// Użycie: node publikuj.mjs <plik.aab|-> <ścieżka: internal|alpha|beta|production> [--sklep] [--szkic]
// Zmienna PLAY_KONTO: zawartość pliku JSON konta usługi Google Cloud z dostępem do Play Console.
// Bez bibliotek zewnętrznych: logowanie JWT i REST API Google Play Developer v3.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PAKIET = 'pl.slownyszlak.gra';
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKIET}`;
const UPLOAD = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PAKIET}`;
const KORZEN = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
// Wersje językowe opisu w sklepie: [kod Google Play, plik opisu, katalog zrzutów, plik „co nowego”].
const JEZYKI = [
  ['pl-PL', 'sklep/opis.json', 'sklep/zrzuty', 'sklep/co-nowego.txt'],
  ['en-US', 'sklep/opis-en.json', 'sklep/zrzuty-en', 'sklep/co-nowego-en.txt'],
].filter(([, opis]) => fs.existsSync(path.join(KORZEN, opis)));

const [plikAab, sciezka = 'internal', ...flagi] = process.argv.slice(2);
const zSklepem = flagi.includes('--sklep');
const szkic = flagi.includes('--szkic');

if (!process.env.PLAY_KONTO) {
  console.log('Brak PLAY_KONTO: pomijam wysyłkę do Google Play (pakiet zbudowany).');
  process.exit(0);
}
const konto = JSON.parse(process.env.PLAY_KONTO);

const b64 = (b) => Buffer.from(b).toString('base64url');
async function token() {
  const teraz = Math.floor(Date.now() / 1000);
  const naglowek = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const tresc = b64(JSON.stringify({ iss: konto.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: teraz, exp: teraz + 3600 }));
  const podpis = crypto.createSign('RSA-SHA256').update(`${naglowek}.${tresc}`).sign(konto.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${naglowek}.${tresc}.${podpis}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Logowanie do Google nie powiodło się: ' + JSON.stringify(j));
  return j.access_token;
}

const T = await token();
async function zapytanie(metoda, url, cialo, typ = 'application/json') {
  const r = await fetch(url, {
    method: metoda,
    headers: { authorization: `Bearer ${T}`, ...(cialo ? { 'content-type': typ } : {}) },
    body: cialo && typ === 'application/json' ? JSON.stringify(cialo) : cialo,
  });
  const tekst = await r.text();
  if (!r.ok) throw new Error(`${metoda} ${url} -> ${r.status}: ${tekst}`);
  return tekst ? JSON.parse(tekst) : {};
}

const edycja = await zapytanie('POST', `${API}/edits`, {});
const E = edycja.id;
console.log('Edycja', E);

if (plikAab && plikAab !== '-') {
  const pakiet = await zapytanie('POST', `${UPLOAD}/edits/${E}/bundles?uploadType=media`, fs.readFileSync(plikAab), 'application/octet-stream');
  console.log('Wysłano wersję', pakiet.versionCode);
  const notatki = (plik, domyslne) => (fs.existsSync(path.join(KORZEN, plik)) ? fs.readFileSync(path.join(KORZEN, plik), 'utf8').trim().slice(0, 500) : domyslne);
  const releaseNotes = JEZYKI.map(([jezyk, , , plik]) => ({ language: jezyk, text: notatki(plik, jezyk === 'pl-PL' ? 'Poprawki i nowe poziomy.' : 'Fixes and new levels.') }));
  await zapytanie('PUT', `${API}/edits/${E}/tracks/${sciezka}`, {
    track: sciezka,
    releases: [{ versionCodes: [String(pakiet.versionCode)], status: szkic ? 'draft' : 'completed', releaseNotes }],
  });
  console.log('Ścieżka', sciezka, szkic ? '(szkic)' : '(wydane)');
}

if (zSklepem) {
  for (const [JEZYK, plikOpisu, katalogZrzutow] of JEZYKI) {
    const opis = JSON.parse(fs.readFileSync(path.join(KORZEN, plikOpisu), 'utf8'));
    await zapytanie('PUT', `${API}/edits/${E}/listings/${JEZYK}`, { language: JEZYK, title: opis.tytul, shortDescription: opis.krotki, fullDescription: opis.pelny });
    console.log('Zaktualizowano opis w sklepie', JEZYK);
    const obrazy = [['icon', 'sklep/grafika/ikona-512.png'], ['featureGraphic', 'sklep/grafika/baner-1024x500.png']];
    const zrzuty = fs.readdirSync(path.join(KORZEN, katalogZrzutow)).filter((f) => f.endsWith('.png')).sort();
    await zapytanie('DELETE', `${API}/edits/${E}/listings/${JEZYK}/phoneScreenshots`);
    for (const z of zrzuty) obrazy.push(['phoneScreenshots', `${katalogZrzutow}/${z}`]);
    for (const [typ, plik] of obrazy) {
      await zapytanie('POST', `${UPLOAD}/edits/${E}/listings/${JEZYK}/${typ}?uploadType=media`, fs.readFileSync(path.join(KORZEN, plik)), 'image/png');
      console.log('Obraz', JEZYK, typ, plik);
    }
  }
}

await zapytanie('POST', `${API}/edits/${E}:commit`);
console.log('Gotowe: zmiany zatwierdzone w Google Play.');
