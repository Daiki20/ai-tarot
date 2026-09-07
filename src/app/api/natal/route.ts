import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { natalCharts, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { geocodeCity } from "@/lib/natal/geocode";
import { computeNatalChart } from "@/lib/natal/compute";
import { dbErrorMessage } from "@/lib/db/errors";

export const runtime = "nodejs";
export const maxDuration = 30;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    name?: unknown;
    gender?: unknown;
    birthDate?: unknown;
    birthTime?: unknown;
    birthTimeKnown?: unknown;
    birthPlace?: unknown;
  } | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const birthDate = typeof body?.birthDate === "string" ? body.birthDate : "";
  const birthTimeKnown = body?.birthTimeKnown !== false;
  const birthTimeRaw =
    typeof body?.birthTime === "string" ? body.birthTime.trim() : "";
  const birthPlace =
    typeof body?.birthPlace === "string" ? body.birthPlace.trim() : "";
  const gender =
    body?.gender === "female" || body?.gender === "male" || body?.gender === "other"
      ? body.gender
      : null;

  if (name.length < 2) {
    return Response.json({ error: "Укажите имя" }, { status: 400 });
  }
  if (!DATE_RE.test(birthDate)) {
    return Response.json({ error: "Укажите дату рождения" }, { status: 400 });
  }
  const year = Number(birthDate.slice(0, 4));
  if (year < 1900 || year > new Date().getFullYear()) {
    return Response.json({ error: "Проверьте дату рождения" }, { status: 400 });
  }
  if (birthTimeKnown && !TIME_RE.test(birthTimeRaw)) {
    return Response.json(
      { error: "Укажите время рождения или отметьте, что оно неизвестно" },
      { status: 400 },
    );
  }
  if (birthPlace.length < 2) {
    return Response.json({ error: "Укажите город рождения" }, { status: 400 });
  }

  const geo = await geocodeCity(birthPlace);
  if (!geo) {
    return Response.json(
      { error: "Не удалось определить город. Попробуйте написать иначе (например, «Москва, Россия»)." },
      { status: 422 },
    );
  }

  let result;
  try {
    result = computeNatalChart({
      name,
      gender,
      birthDate,
      birthTime: birthTimeKnown ? birthTimeRaw : null,
      birthTimeKnown,
      lat: geo.lat,
      lon: geo.lon,
    });
  } catch (err) {
    console.error("[api/natal] compute failed:", err);
    return Response.json({ error: "Не удалось рассчитать карту" }, { status: 500 });
  }

  const values = {
    userId: user.id,
    name,
    gender,
    birthDate,
    birthTime: birthTimeKnown ? birthTimeRaw : null,
    birthTimeKnown,
    birthPlaceQuery: birthPlace,
    birthPlaceLabel: geo.label,
    birthLat: String(geo.lat),
    birthLon: String(geo.lon),
    birthTz: result.timezone,
    chart: result.chart,
    summary: result.summary,
    updatedAt: new Date(),
  };

  try {
    await db
      .insert(natalCharts)
      .values(values)
      .onConflictDoUpdate({ target: natalCharts.userId, set: values });

    await db
      .update(users)
      .set({ natalCompletedAt: new Date() })
      .where(eq(users.id, user.id));
  } catch (e) {
    return Response.json({ error: dbErrorMessage(e) }, { status: 503 });
  }

  return Response.json({ ok: true, chart: result.chart, summary: result.summary });
}
