// Generuje zrzuty ekranu do Google Play (1080x1920), baner 1024x500 i ikonę 512x512.
// Użycie: node narzedzia/zrzuty-sklep.mjs   (wymaga Playwright z Chromium)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const KORZEN = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TYPY = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const serwer = http.createServer((req, res) => {
  const p = path.join(KORZEN, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(KORZEN) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPY[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const URL0 = `http://localhost:${serwer.address().port}`;
const TMP = fs.mkdtempSync('/tmp/zrzuty-');

const b = await chromium.launch();
const gra = await (await b.newContext({ viewport: { width: 412, height: 732 }, deviceScaleFactor: 2 })).newPage();
await gra.goto(`${URL0}/www/index.html?dev`);
await gra.evaluate(() => localStorage.clear());
await gra.reload();
await gra.waitForTimeout(1500);
await gra.evaluate(() => { window.__gra.S.monety = 345; window.__gra.S.dzwiek = false; });

async function przeciagnij(slowo, pusc = true) {
  const litery = await gra.$$eval('.litera', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent, x: r.left + r.width / 2, y: r.top + r.height / 2 }; }));
  const uzyte = new Set();
  const pkt = [...slowo.toLocaleUpperCase('pl')].map((l) => { const i = litery.findIndex((x, j) => x.t === l && !uzyte.has(j)); uzyte.add(i); return litery[i]; });
  await gra.mouse.move(pkt[0].x, pkt[0].y); await gra.mouse.down();
  for (const q of pkt.slice(1)) await gra.mouse.move(q.x, q.y, { steps: 5 });
  if (pusc) await gra.mouse.up();
}
async function poziom(nr, ileSlow, czekaj = 1400) {
  await gra.evaluate((nr) => { const g = window.__gra; g.S.poziom = nr; g.S.postep = null; g.wczytajPoziom('kampania'); }, nr);
  await gra.waitForTimeout(czekaj);
  const slowa = await gra.evaluate(() => window.__gra.biezacy().slowa.map((s) => s.s));
  for (const s of slowa.slice(0, ileSlow)) { await przeciagnij(s); await gra.waitForTimeout(250); }
  await gra.waitForTimeout(900);
  return slowa;
}
const surowe = [];
async function zrzut(nazwa) { const p = path.join(TMP, nazwa + '.png'); await gra.screenshot({ path: p }); surowe.push(p); return p; }

// 1. Przeciąganie liter
let slowa = await poziom(67, 3);
await przeciagnij(slowa[3], false); await gra.waitForTimeout(200);
const z1 = await zrzut('1'); await gra.mouse.up(); await gra.waitForTimeout(500);
// 2. Prawie rozwiązana krzyżówka z pochwałą
slowa = await poziom(305, 0);
for (const s of slowa.slice(0, -1)) { await przeciagnij(s); await gra.waitForTimeout(120); }
await gra.waitForTimeout(1600);
const z2 = await zrzut('2');
// 3. Nowy szlak
await gra.evaluate(() => { const g = window.__gra; g.S.poziom = 20; g.S.postep = null; g.wczytajPoziom('kampania'); });
await gra.waitForTimeout(1200);
for (const s of await gra.evaluate(() => window.__gra.biezacy().slowa.map((x) => x.s))) { await przeciagnij(s); await gra.waitForTimeout(150); }
await gra.waitForTimeout(3000);
await gra.click('#btn-dalej'); await gra.waitForTimeout(1500);
const z3 = await zrzut('3');
await gra.click('#btn-szlak'); await gra.waitForTimeout(600);
// 4. Wyzwanie dnia
await gra.click('#btn-wstecz'); await gra.waitForTimeout(600);
await gra.click('#btn-dzienna'); await gra.waitForTimeout(1300);
slowa = await gra.evaluate(() => window.__gra.biezacy().slowa.map((x) => x.s));
for (const s of slowa.slice(0, 2)) { await przeciagnij(s); await gra.waitForTimeout(200); }
await gra.waitForTimeout(900);
const z4 = await zrzut('4');
// 5. Nocny krajobraz
await poziom(129, 2);
const z5 = await zrzut('5');
// 6. Ekran startowy
await gra.click('#btn-wstecz');
await gra.evaluate(() => {
  const g = window.__gra; const d = new Date(Date.now() - 864e5);
  g.S.seria = 6; g.S.poziom = 47; g.S.postep = null;
  g.S.ostatniaDzienna = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  localStorage.setItem('slowny-szlak-v1', JSON.stringify(g.S));
});
await gra.goto(`${URL0}/www/index.html?dev`); await gra.waitForTimeout(2000);
const z6 = await zrzut('6');

const SCENY = [
  [z1, 'Łącz litery,<br><em>układaj słowa</em>', '#1d2b64', '#6a3093'],
  [z2, 'Ponad <em>2000</em> polskich krzyżówek', '#0f4c75', '#3282b8'],
  [z3, 'Wędruj przez <em>Tatry, Mazury</em> i Bałtyk', '#2a1a5e', '#b0477a'],
  [z4, 'Nowe <em>wyzwanie</em><br>każdego dnia', '#5f2c82', '#49a09d'],
  [z5, 'Odprężające<br><em>krajobrazy</em>', '#0b1026', '#263a74'],
  [z6, 'Graj <em>offline</em>,<br>bez zakładania konta', '#134e5e', '#2e8b57'],
];
const OUT = path.join(KORZEN, 'sklep');
fs.mkdirSync(path.join(OUT, 'zrzuty'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'grafika'), { recursive: true });
const rama = await (await b.newContext({ viewport: { width: 1080, height: 1920 } })).newPage();
for (let i = 0; i < SCENY.length; i++) {
  const [img, t, a, c] = SCENY[i];
  fs.copyFileSync(img, path.join(KORZEN, 'narzedzia/sklep/_tmp.png'));
  await rama.goto(`${URL0}/narzedzia/sklep/ramka.html?` + new URLSearchParams({ t, a, b: c, i: '_tmp.png?' + i }));
  await rama.waitForTimeout(600);
  await rama.screenshot({ path: path.join(OUT, 'zrzuty', `${i + 1}.png`) });
}
fs.rmSync(path.join(KORZEN, 'narzedzia/sklep/_tmp.png'));
const baner = await (await b.newContext({ viewport: { width: 1024, height: 500 } })).newPage();
await baner.goto(`${URL0}/narzedzia/sklep/baner.html`); await baner.waitForTimeout(1000);
await baner.screenshot({ path: path.join(OUT, 'grafika', 'baner-1024x500.png') });
const ik = await (await b.newContext({ viewport: { width: 512, height: 512 } })).newPage();
await ik.setContent(`<body style="margin:0"><img src="${URL0}/aplikacja/assets/icon-only.png" style="width:512px;height:512px;display:block">`);
await ik.waitForTimeout(500);
await ik.screenshot({ path: path.join(OUT, 'grafika', 'ikona-512.png') });
await b.close();
serwer.close();
console.log('Zapisano zrzuty w', OUT);
