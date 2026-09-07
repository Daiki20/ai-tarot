function pluralForm(n: number, [one, few, many]: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
  return many;
}

export function cardsWordNominative(n: number): string {
  return pluralForm(n, ["карта", "карты", "карт"]);
}

export function cardsWordAccusative(n: number): string {
  return pluralForm(n, ["карту", "карты", "карт"]);
}
