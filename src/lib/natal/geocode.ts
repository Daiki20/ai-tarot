/**
 * Геокодер города рождения: строка -> координаты (+ человекочитаемое имя).
 *
 * Сейчас — OpenStreetMap Nominatim (бесплатно, без ключа, требует User-Agent).
 * Достаточно для «ввёл город при регистрации один раз». Часовой пояс по координатам
 * дальше определяет сам движок карты (см. compute.ts).
 *
 * Разработчику на замену: сюда легко подставить платный геокодер, свою базу
 * городов (GeoNames) или автодополнение — контракт `geocodeCity` не меняется.
 */
import "server-only";

export interface GeoResult {
  label: string; // "Москва, Россия"
  lat: number;
  lon: number;
}

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const UA = "AI-Tarot/1.0 (natal chart birthplace lookup)";

export async function geocodeCity(query: string): Promise<GeoResult | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  const url = `${ENDPOINT}?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&addressdetails=1&accept-language=ru`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "ru" },
      // город при регистрации не меняется — можно кешировать надолго
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
  } catch (err) {
    console.error("[geocode] request failed:", err);
    return null;
  }
  if (!res.ok) {
    console.error("[geocode] Nominatim status", res.status);
    return null;
  }

  const data = (await res.json().catch(() => null)) as
    | Array<{
        lat: string;
        lon: string;
        display_name: string;
        name?: string;
        address?: Record<string, string>;
      }>
    | null;

  const hit = data?.[0];
  if (!hit) return null;

  const lat = Number(hit.lat);
  const lon = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const a = hit.address ?? {};
  const city = a.city || a.town || a.village || a.municipality || hit.name;
  const country = a.country;
  const label = [city, country].filter(Boolean).join(", ") || hit.display_name;

  return { label, lat, lon };
}
