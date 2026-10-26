# Słowny Szlak

Polska gra słowna na Androida: przeciągasz palcem po literach w kole i układasz krzyżówkę.
Gracz wędruje przez polskie krainy (Tatry, Mazury, Bałtyk…) rysowane proceduralnie w SVG.
Zarabia na reklamach Google AdMob (pełnoekranowe co kilka poziomów i z nagrodą za monety).

## Struktura

- `www/` – cała gra (HTML, CSS, JS bez bundlera) i `poziomy.json`
- `narzedzia/generuj-poziomy.mjs` – generator poziomów ze słownika SJP.PL i listy częstości FrequencyWords
- `narzedzia/zbuduj.sh` – buduje podpisany pakiet AAB
- `narzedzia/publikuj.mjs` – wysyła AAB, opis i zrzuty do Google Play przez API
- `narzedzia/zrzuty-sklep.mjs` – generuje zrzuty ekranu, baner i ikonę do sklepu
- `aplikacja/` – projekt Capacitor 8 (Android, target SDK 36)
- `sklep/` – opis w sklepie, zrzuty, grafiki, „co nowego”
- `strona/` – polityka prywatności (GitHub Pages razem z wersją gry w przeglądarce)

## Wydanie

Pierwszy pakiet nowej aplikacji Google przyjmuje tylko ręcznie: pobierz artefakt `slowny-szlak-aab`
z pierwszego przebiegu akcji i wgraj go w Play Console. Dopóki aplikacja nie jest opublikowana,
API przyjmuje tylko szkice, dlatego akcja domyślnie wysyła wydanie jako szkic
(po tagu: do czasu ustawienia zmiennej repozytorium `PLAY_SZKIC` na `false`).

Akcja „Wydanie na Google Play” (ręcznie lub po tagu `v*`) buduje AAB i wysyła go do wybranej ścieżki.
Sekrety repozytorium: `KLUCZ_BASE64`, `KLUCZ_HASLO`, `PLAY_KONTO`.
Zmienne repozytorium: `ADMOB_APP_ID`, `ADMOB_PELNOEKRANOWA`, `ADMOB_NAGRODZONA` (bez nich gra używa testowych reklam).

## Nowe poziomy

```
node narzedzia/generuj-poziomy.mjs slowa.txt pl_50k.txt www 2500 en_50k.txt odm.txt
```
`slowa.txt` to słownik do gier z https://sjp.pl/sl/growy/ (CC BY 4.0),
`odm.txt` to słownik odmian z https://sjp.pl/sl/odmiany/ (CC BY 4.0), służy do rozpoznawania słów z jednego rdzenia;
`pl_50k.txt` i `en_50k.txt` pochodzą z https://github.com/hermitdave/FrequencyWords (CC BY-SA 4.0).
