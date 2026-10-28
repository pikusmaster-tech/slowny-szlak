// Zapis postępu gracza w pamięci urządzenia (localStorage działa też w aplikacji na Androida).
import { JEZYK } from './jezyk.js';

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
  motyw: 'klasyczny', // wygląd kafelków liter
  kupioneMotywy: ['klasyczny'],
  odOstatniejReklamy: 0,
  znalezioneBonusy: 0,
  slowWszystkich: 0,
  pierwszeUruchomienie: Date.now(),
};

// Każdy język ma własne poziomy, więc postęp na szlaku i wyzwanie dnia zapisujemy osobno dla języka.
// Monety, motywy, zakup i ustawienia są wspólne.
const WLASNE_JEZYKA = ['poziom', 'postep', 'seria', 'ostatniaDzienna', 'dzienna'];
const wybierz = (o) => Object.fromEntries(WLASNE_JEZYKA.map((k) => [k, o[k] ?? DOMYSLNY[k]]));

let stan;
try {
  const zapisany = JSON.parse(localStorage.getItem(KLUCZ) || '{}');
  // Zapis sprzed wersji językowych ma postęp polski w głównych polach.
  if (!zapisany.jezyki && Object.keys(zapisany).length) zapisany.jezyki = { pl: wybierz(zapisany) };
  stan = { ...DOMYSLNY, ...zapisany, ...wybierz(zapisany.jezyki?.[JEZYK] || {}) };
} catch { stan = { ...DOMYSLNY }; }

export const S = stan;
export function zapisz() {
  stan.jezyki = { ...stan.jezyki, [JEZYK]: wybierz(stan) };
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
