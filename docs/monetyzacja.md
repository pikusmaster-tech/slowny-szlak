# Monetyzacja Słownego Szlaku

Stan: 2026-10-17. Decyzje podjęte z Piotrem.

## Co jest w grze

- **Reklamy (AdMob):** pełnoekranowe co 3 poziomy od poziomu 12 i reklamy z nagrodą (dobrowolne, za monety i za podpowiedź).
- **Usuń reklamy:** jednorazowy zakup (produkt `usun_reklamy`). Usuwa reklamy pełnoekranowe. Reklamy z nagrodą zostają dobrowolne.
- **Podpowiedzi:** pierwsze 3 dziennie kosztują monety. Każda kolejna tego samego dnia wymaga obejrzenia reklamy z nagrodą. Po zakupie „Usuń reklamy” podpowiedzi są za darmo i bez limitu.
- **Monety:** zdobywane za poziomy, słoik słów i reklamy. Wydawane na podpowiedzi.

## Czego nie ma (i dlaczego)

- **Energii ani żyć:** w grze nie ma przegranej, więc energia dodałaby karę, której gra nie ma.
- **Przeskakiwania poziomu:** odłożone. Mogłoby osłabić poczucie postępu w szlaku.
- **Kosmetyki (motywy kafelków):** następny krok, za monety. Zaplanowane, jeszcze nie zrobione.

## Techniczne

- Zakupy: wtyczka `@capgo/native-purchases` 8.9.6 (licencja MPL-2.0). Google Play Billing bez zewnętrznej usługi.
- Stan zakupu: `S.bezReklam` w zapisie na urządzeniu. Przy każdym uruchomieniu sprawdzany w Google Play, więc zwrot zdejmuje zakup. Bez sieci zostaje zapis.
- Przycisk „Usuń reklamy” pojawia się w Ustawieniach dopiero wtedy, gdy Google Play podaje cenę produktu. W przeglądarce i przed utworzeniem produktu go nie ma.
- Liczba podpowiedzi za monety: `podpowiedziZaMonetyDziennie` w `www/js/konfiguracja.js`.
- Logika podpowiedzi: `trybPodpowiedzi()` w `www/js/gra.js`.

## Jednorazowe kroki (Piotr, po potwierdzeniu każdego)

1. Play Console → Monetyzacja → Produkty w aplikacji: utworzyć produkt o identyfikatorze `usun_reklamy`, typ **produkt jednorazowy** (nie subskrypcja).
2. Ustawić cenę. Do przetestowania około 3 USD.
3. Aktywować produkt.
4. Dodać konto testera, żeby sprawdzić zakup przed publikacją.

Koszt produktu: 0 zł. Google pobiera prowizję od sprzedaży (dla małych deweloperów 15%).

## Co trzeba sprawdzić przed wydaniem z zakupem

- Czy formularz „Bezpieczeństwo danych” w Play uwzględnia zakupy w aplikacji.
- Czy opis w sklepie wspomina, że gra ma reklamy i opcjonalny zakup.
