// Motywy kafelków liter (krzyżówka i koło). Kolory są w styl.css, w zmiennych --kafel-*.
// Ceny w monetach. Klasyczny jest darmowy i dostępny od początku.
export const MOTYWY = [
  { id: 'klasyczny', nazwa: 'Klasyczny', cena: 0 },
  { id: 'drewno', nazwa: 'Drewno', cena: 300 },
  { id: 'pergamin', nazwa: 'Pergamin', cena: 350 },
  { id: 'szklo', nazwa: 'Szkło', cena: 450 },
  { id: 'pastel', nazwa: 'Pastel', cena: 300 },
];

export const znajdzMotyw = (id) => MOTYWY.find((m) => m.id === id) || MOTYWY[0];
