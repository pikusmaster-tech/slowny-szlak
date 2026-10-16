// Dostęp do wtyczek Capacitora bez bundlera: capacitor.js wystawia registerPlugin na window.Capacitor.
export const natywna = () => !!window.Capacitor?.isNativePlatform?.();
const wtyczki = {};
export function wtyczka(nazwa) {
  if (!natywna()) return null;
  if (!wtyczki[nazwa]) wtyczki[nazwa] = window.Capacitor.Plugins?.[nazwa] || window.Capacitor.registerPlugin?.(nazwa) || null;
  return wtyczki[nazwa];
}
