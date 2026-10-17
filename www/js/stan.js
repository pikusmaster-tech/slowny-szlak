// Zapis postępu gracza w pamięci urządzenia (localStorage działa też w aplikacji na Androida).
const KLUCZ = 'slowny-szlak-v1';

const DOMYSLNY = {
  poziom: 1,
  monety: 120,
  sloik: 0, // słowa bonusowe w słoiku, co 8 nagroda
  postep: null, // { poziom, znalezione: [], odkryte: [], bonusy: [] } dla przerwanego poziomu
  dzwiek: true,
  wibracje: true,
  seria: 0,
  ostatniaDzienna: null,
  dzienna: null, // postęp wyzwania dnia
  bezReklam: false, // zakup „usuń reklamy”; potwierdzany w Google Play przy każdym uruchomieniu
  podpowiedziDzis: null, // { data, ile } podpowiedzi za monety w danym dniu
  odOstatniejReklamy: 0,
  znalezioneBonusy: 0,
  slowWszystkich: 0,
  pierwszeUruchomienie: Date.now(),
};

let stan;
try { stan = { ...DOMYSLNY, ...JSON.parse(localStorage.getItem(KLUCZ) || '{}') }; } catch { stan = { ...DOMYSLNY }; }

export const S = stan;
export function zapisz() {
  try { localStorage.setItem(KLUCZ, JSON.stringify(stan)); } catch { /* tryb prywatny: gramy bez zapisu */ }
}
const format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function dzisiaj() { return format(new Date()); }
// Dzień wcześniej liczony z pól kalendarza, a nie "minus 24 godziny", więc zmiana czasu nie psuje serii.
export function dzienPrzed(data) {
  const [y, m, d] = data.split('-').map(Number);
  return format(new Date(y, m - 1, d - 1));
}
export function wczoraj() { return dzienPrzed(dzisiaj()); }
