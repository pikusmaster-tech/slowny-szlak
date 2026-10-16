// Identyfikatory reklam. Do czasu założenia konta AdMob używamy testowych identyfikatorów Google,
// które pokazują reklamy próbne i nic nie zarabiają. Produkcyjne wpisuje automat budujący aplikację.
export const KONFIG = {
  wersja: '0.1.0',
  admob: {
    testowe: true,
    pelnoekranowa: 'ca-app-pub-3940256099942544/1033173712',
    nagradzana: 'ca-app-pub-3940256099942544/5224354917',
  },
  // Pierwsza reklama pełnoekranowa dopiero po tym poziomie, potem co tyle poziomów i nie częściej niż co tyle sekund.
  reklamyOdPoziomu: 12,
  reklamaCoPoziomow: 3,
  reklamaMinOdstep: 150,
  nagrodaZaReklame: 30,
  kosztPodpowiedzi: 40,
  kosztSlowa: 120,
  nagrodaZaPoziom: 6,
  nagrodaZaSloik: 30,
  bonusowDoSloika: 8,
  politykaPrywatnosci: 'https://pikusmaster-tech.github.io/slowny-szlak/prywatnosc.html',
};
