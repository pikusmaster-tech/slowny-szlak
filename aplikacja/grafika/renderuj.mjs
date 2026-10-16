import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.resolve(process.argv[2]);
const b = await chromium.launch();
for (const [tryb, plik, w] of [['tlo', 'icon-background.png', 1024], ['przod', 'icon-foreground.png', 1024], ['calosc', 'icon-only.png', 1024], ['splash', 'splash.png', 2732], ['splash', 'splash-dark.png', 2732]]) {
  const p = await b.newPage({ viewport: { width: w, height: w } });
  await p.goto('file://' + dir + '/grafika/ikona.html#' + tryb);
  await p.waitForTimeout(500);
  await p.screenshot({ path: dir + '/assets/' + plik, omitBackground: tryb === 'przod' });
  await p.close();
}
await b.close();
