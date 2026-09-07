import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Конфиг миграций. Схема — единственный источник правды: src/lib/db/schema.ts
//   npm run db:generate  — сгенерировать SQL-миграцию из изменений схемы
//   npm run db:migrate   — применить миграции к базе из DATABASE_URL
//   npm run db:studio    — веб-интерфейс просмотра данных

// drizzle-kit CLI не читает .env.local (в отличие от Next) — подхватываем вручную.
if (!process.env.DATABASE_URL) {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // .env.local нет — используем дефолт ниже
  }
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://taro:taro@localhost:5432/taro",
  },
  verbose: true,
  strict: true,
});
