export const YM_ID = 112378603;

// Отправить достижение цели в Яндекс.Метрику. Безопасно, если счётчик ещё не
// загрузился или отключён (dev). Идентификаторы целей задаются в кабинете Метрики.
export function reachGoal(goal: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const ym = (window as unknown as { ym?: (...args: unknown[]) => void }).ym;
  if (typeof ym === "function") ym(YM_ID, "reachGoal", goal, params);
}
