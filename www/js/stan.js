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
  bezReklam: false,
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
export function dzisiaj() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function wczoraj() {
  const d = new Date(Date.now() - 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
