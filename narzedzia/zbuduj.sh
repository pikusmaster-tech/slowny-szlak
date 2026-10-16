#!/usr/bin/env bash
# Buduje podpisany pakiet AAB dla Google Play.
# Zmienne: KLUCZ_PLIK, KLUCZ_HASLO (podpis), ADMOB_APP_ID, ADMOB_PELNOEKRANOWA, ADMOB_NAGRODZONA (reklamy).
# Bez zmiennych AdMob aplikacja używa testowych reklam Google.
set -euo pipefail
KORZEN="$(cd "$(dirname "$0")/.." && pwd)"
cd "$KORZEN/aplikacja"

if [[ -n "${ADMOB_PELNOEKRANOWA:-}" && -n "${ADMOB_NAGRODZONA:-}" ]]; then
  node -e '
    const fs = require("fs"); const p = process.argv[1];
    let s = fs.readFileSync(p, "utf8");
    s = s.replace(/testowe: true/, "testowe: false")
         .replace(/pelnoekranowa: .*?,/, `pelnoekranowa: "${process.env.ADMOB_PELNOEKRANOWA}",`)
         .replace(/nagradzana: .*?,/, `nagradzana: "${process.env.ADMOB_NAGRODZONA}",`);
    fs.writeFileSync(p, s);' "$KORZEN/www/js/konfiguracja.js"
  echo "Reklamy: produkcyjne identyfikatory AdMob"
else
  echo "Reklamy: testowe identyfikatory Google"
fi

npm ci --no-audit --no-fund
npx cap sync android
cd android
# Kod wersji rośnie z czasem (minuty od 1.01.2026), więc każde wydanie ma wyższy numer.
export WERSJA_KOD="${WERSJA_KOD:-$(( ( $(date +%s) - 1767225600 ) / 60 ))}"
export WERSJA_NAZWA="${WERSJA_NAZWA:-$(node -p "require('../package.json').version")}"
echo "Wersja $WERSJA_NAZWA ($WERSJA_KOD)"
./gradlew bundleRelease --no-daemon
ls -la app/build/outputs/bundle/release/
