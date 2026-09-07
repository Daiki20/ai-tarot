/**
 * Хеширование паролей. Вынесено отдельным файлом — это первое, что заменит
 * разработчик при доработке авторизации (argon2, требования к сложности и т.п.).
 */
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Минимальная валидация. Специально простая — правила усилят при доработке. */
export function validateCredentials(email: unknown, password: unknown): string | null {
  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return "Введите корректный email";
  }
  if (typeof password !== "string" || password.length < 8) {
    return "Пароль должен быть не короче 8 символов";
  }
  return null;
}
