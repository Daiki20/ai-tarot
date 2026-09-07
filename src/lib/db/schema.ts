/**
 * Схема базы данных (Drizzle ORM). Единственный источник правды.
 * Меняешь тут -> `npm run db:generate` -> `npm run db:migrate`.
 *
 * Модель данных сейчас минимальна и рассчитана на передачу разработчику:
 *   users        — аккаунт (email + пароль). Регистрация «лёгкая», её будут переделывать.
 *   sessions     — серверные сессии по httpOnly-куке (см. src/lib/auth).
 *   natal_charts — натальная карта пользователя 1:1. Обязательна после регистрации.
 *   readings     — история раскладов, каждый привязан к натальной карте пользователя.
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  date,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // 'user' | 'admin'. Админ не тратит aura и видит /admin. См. src/lib/admin.ts
  role: text("role").notNull().default("user"),
  // Проставляется, когда пользователь заполнил натальную карту. null = онбординг не завершён.
  natalCompletedAt: timestamp("natal_completed_at", { withTimezone: true }),
  // Баланс в валюте aura (1 aura = 1 ₽). Меняется только через wallet.ts
  // (списание за расклад, пополнение по вебхуку ЮKassa) — всегда вместе с записью в transactions.
  auraBalance: integer("aura_balance").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Счётчик посещений по дням (МСК). Пишется маячком с любой страницы, раз в сессию.
export const dailyVisits = pgTable("daily_visits", {
  day: date("day").primaryKey(), // YYYY-MM-DD по Москве
  count: integer("count").notNull().default(0),
});

// Леджер движения aura. Баланс users.auraBalance = сумма amount по всем строкам пользователя.
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // + пополнение, − списание
    kind: text("kind").notNull(), // 'spend' | 'topup' | 'bonus' | 'refund'
    ref: text("ref"), // за что: 'reading:celtic', 'chat-addon', 'matrix-full', 'day-deep', 'yookassa:<id>'
    balanceAfter: integer("balance_after").notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("transactions_user_id_idx").on(t.userId)],
);

// Пополнения через ЮKassa. Одна строка на попытку оплаты; статус обновляется вебхуком.
export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(), // id платежа в ЮKassa
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    aura: integer("aura").notNull(), // сколько aura начислить при успехе
    amountRub: numeric("amount_rub", { precision: 12, scale: 2 }).notNull(),
    status: text("status").notNull().default("pending"), // 'pending' | 'succeeded' | 'canceled'
    creditedAt: timestamp("credited_at", { withTimezone: true }), // когда aura зачислены (защита от повторного вебхука)
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("payments_user_id_idx").on(t.userId)],
);

export const sessions = pgTable(
  "sessions",
  {
    // id = сам токен сессии (случайный), лежит в куке taro_session.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const natalCharts = pgTable("natal_charts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  // --- что ввёл пользователь ---
  name: text("name").notNull(),
  gender: text("gender"), // 'female' | 'male' | 'other' | null — опционально
  birthDate: date("birth_date").notNull(), // YYYY-MM-DD
  birthTime: text("birth_time"), // 'HH:MM' по местному времени рождения; null если неизвестно
  birthTimeKnown: boolean("birth_time_known").notNull().default(true),
  birthPlaceQuery: text("birth_place_query").notNull(), // как ввёл пользователь
  birthPlaceLabel: text("birth_place_label").notNull(), // как распознал геокодер
  birthLat: numeric("birth_lat", { precision: 9, scale: 6 }).notNull(),
  birthLon: numeric("birth_lon", { precision: 9, scale: 6 }).notNull(),
  birthTz: text("birth_tz").notNull(), // IANA, напр. 'Europe/Moscow'

  // --- что посчитали ---
  // Полная карта: планеты (знак/градус/дом/ретроградность), Asc/MC, дома,
  // мажорные аспекты, баланс стихий и крестов. Структура — см. src/lib/natal/compute.ts
  chart: jsonb("chart").notNull(),
  // Плотная текстовая выжимка карты — её подмешиваем в промпты AI-таролога.
  summary: text("summary").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const readings = pgTable(
  "readings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    natalChartId: uuid("natal_chart_id").references(() => natalCharts.id, {
      onDelete: "set null",
    }),

    kind: text("kind").notNull(), // 'spread' | 'matrix' | 'day'
    spreadId: text("spread_id"), // id движка расклада, если kind='spread'
    readingKey: text("reading_key"), // id продукта-витрины (readings.ts), если открыт по ссылке
    question: text("question"),
    cardCount: integer("card_count"),

    cards: jsonb("cards"), // [{cardId, reversed}]
    result: jsonb("result"), // ReadingResult / разбор матрицы / разбор дня

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("readings_user_id_idx").on(t.userId)],
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type NatalChart = typeof natalCharts.$inferSelect;
export type Reading = typeof readings.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type DailyVisit = typeof dailyVisits.$inferSelect;
