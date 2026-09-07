// Основатель — всегда админ, даже если в БД что-то сбилось. Остальным админку
// выдаёт он сам через /admin/users (ставит users.role = 'admin').
export const BOOTSTRAP_ADMIN_EMAIL = "andrey.pishev2020@yandex.ru";

export function isAdmin(
  u: { email?: string | null; role?: string | null } | null | undefined,
): boolean {
  if (!u?.email) return false;
  return (
    u.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL || u.role === "admin"
  );
}
