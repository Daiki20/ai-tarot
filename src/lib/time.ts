// Москва — UTC+3 круглый год (перевода часов нет).
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

/** UTC-момент полуночи (00:00 МСК) текущих московских суток. */
export function mskDayStart(now: Date = new Date()): Date {
  const msk = new Date(now.getTime() + MSK_OFFSET_MS);
  const midnightMsk = Date.UTC(
    msk.getUTCFullYear(),
    msk.getUTCMonth(),
    msk.getUTCDate(),
  );
  return new Date(midnightMsk - MSK_OFFSET_MS);
}

/** UTC-момент следующей полуночи по МСК — когда снова откроется «Карта дня». */
export function nextMskDayStart(now: Date = new Date()): Date {
  return new Date(mskDayStart(now).getTime() + 24 * 60 * 60 * 1000);
}
