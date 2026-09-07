# Авторизация

> **Это временная реализация.** Задача — рабочий аккаунт + сессия, чтобы привязать
> к нему натальную карту и историю раскладов. Разработчик заменит её целиком
> (OAuth, подтверждение почты, восстановление пароля, 2FA, rate-limit). Швы для
> замены помечены комментарием в `src/lib/auth/index.ts`.

## Как работает регистрация

1. Форма `/register` → `AuthForm` (`src/components/AuthForm.tsx`) →
   `POST /api/auth/register` с `{ email, password }`.
2. Роут (`src/app/api/auth/register/route.ts`):
   - `validateCredentials()` — email по regex, пароль ≥ 8 символов
     (`src/lib/auth/password.ts`);
   - проверка уникальности email в `users`;
   - `hashPassword()` — `bcrypt`, 12 раундов;
   - `INSERT` в `users`;
   - `createSession(userId)`.
3. Ответ `{ ok: true, next: "/onboarding/natal" }`. Клиент делает `router.push(next)`.
4. `/onboarding/natal` — **обязательный шаг**: без заполненной натальной карты
   `/profile`, `/register`, `/login` редиректят обратно на онбординг
   (проверка `getCurrentUserWithNatal()` в каждой из этих страниц).

## Вход

`/login` → `POST /api/auth/login` → `bcrypt.compare` → `createSession` →
`next: "/profile"` (если карта заполнена) или `"/onboarding/natal"`.

## Сессии

`src/lib/auth/index.ts`:
- `createSession(userId)` — генерит токен (`randomBytes(32).toString("base64url")`),
  пишет строку в `sessions` (`id` = токен), ставит куку **`taro_session`**:
  `httpOnly`, `sameSite: "lax"`, `secure` в проде, `path: "/"`, срок 30 дней.
- `getCurrentUser()` — читает куку → `JOIN sessions × users` по токену → проверяет
  `expires_at` → возвращает `User | null`. Ошибку БД глотает и возвращает `null`.
- `getCurrentUserWithNatal()` — то же + подтягивает `natal_charts` (или `null`).
- `destroySession()` — удаляет строку из `sessions` и куку.

Токен хранится в БД **в открытом виде** (не хеш) — приемлемо для временной схемы,
хардненинг (хранить хеш токена) — задача при доработке.

## Что в шапке

`SiteHeader` (серверный) вызывает `getCurrentUser()`:
- гость → ссылки «Войти» (`/login`) и «Регистрация» (`/register`);
- залогинен → ссылка «Профиль».

Выход — кнопка на `/profile` (`LogoutButton`, клиентский) → `POST /api/auth/logout`.

## Гейтинг

- Бесплатные инструменты (карта дня, «Матрица судьбы», справочник карт) — открыты всем.
- Платные расклады работают и для гостя (оплата — мок, см. [STUBS.md](./STUBS.md)),
  но без натального контекста и без сохранения в историю.
- «Аккаунт готов» = есть заполненная `natal_charts`. До этого пользователя держат
  на `/onboarding/natal`.

## Файлы

```
src/lib/auth/index.ts        сессии, getCurrentUser, гейтинг-хелперы
src/lib/auth/password.ts     hashPassword / verifyPassword / validateCredentials
src/app/api/auth/register/route.ts
src/app/api/auth/login/route.ts
src/app/api/auth/logout/route.ts
src/components/AuthForm.tsx   форма входа/регистрации
src/components/LogoutButton.tsx
src/app/register/page.tsx  src/app/login/page.tsx
src/app/onboarding/natal/page.tsx
```
