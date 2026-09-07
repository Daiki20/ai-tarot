// Понятное сообщение вместо «что-то пошло не так», когда база не поднята/не мигрирована.
// Drizzle оборачивает ошибку pg, поэтому код ищем и в самой ошибке, и в .cause,
// и в AggregateError.errors (pg пробует несколько адресов — ::1 и 127.0.0.1).
function collectCodes(e: unknown, acc: string[] = [], depth = 0): string[] {
  if (!e || depth > 5) return acc;
  const err = e as {
    code?: string;
    cause?: unknown;
    errors?: unknown[];
    message?: string;
  };
  if (typeof err.code === "string") acc.push(err.code);
  if (Array.isArray(err.errors)) {
    for (const sub of err.errors) collectCodes(sub, acc, depth + 1);
  }
  if (err.cause) collectCodes(err.cause, acc, depth + 1);
  return acc;
}

export function dbErrorMessage(e: unknown): string {
  const codes = new Set(collectCodes(e));
  const msg = String((e as { message?: string })?.message ?? "");

  if (
    codes.has("ECONNREFUSED") ||
    codes.has("ENOTFOUND") ||
    codes.has("ETIMEDOUT") ||
    /ECONNREFUSED|ENOTFOUND/.test(msg)
  ) {
    return "База данных недоступна. Запустите Postgres: `docker compose up -d`, затем `npm run db:migrate` (см. DATABASE.md).";
  }
  if (codes.has("42P01") || /relation .* does not exist/.test(msg)) {
    return "Таблицы не созданы. Выполните `npm run db:migrate`.";
  }
  if (codes.has("28P01") || codes.has("3D000")) {
    return "Неверные доступы к базе. Проверьте DATABASE_URL в .env.local.";
  }
  console.error("[db] error:", e);
  return "Ошибка базы данных. Проверьте подключение (см. DATABASE.md).";
}
