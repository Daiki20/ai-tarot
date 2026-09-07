"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

interface Geo {
  label: string;
  lat: number;
  lon: number;
}

export default function NatalForm({
  defaultName = "",
  next,
}: {
  defaultName?: string;
  next?: string;
}) {
  const router = useRouter();

  const [name, setName] = useState(defaultName);
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [place, setPlace] = useState("");

  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoTried, setGeoTried] = useState(false);
  const geoSeq = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resolvePlace() {
    const q = place.trim();
    if (q.length < 2) {
      setGeo(null);
      setGeoTried(false);
      return;
    }
    const seq = ++geoSeq.current;
    setGeoLoading(true);
    setGeoTried(true);
    try {
      const res = await fetch("/api/natal/geocode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const data = (await res.json().catch(() => null)) as { result?: Geo | null } | null;
      if (seq === geoSeq.current) setGeo(data?.result ?? null);
    } catch {
      if (seq === geoSeq.current) setGeo(null);
    } finally {
      if (seq === geoSeq.current) setGeoLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (name.trim().length < 2) return setError("Укажите имя");
    if (!birthDate) return setError("Укажите дату рождения");
    if (!timeUnknown && !birthTime)
      return setError("Укажите время рождения или отметьте, что оно неизвестно");
    if (place.trim().length < 2) return setError("Укажите город рождения");

    setLoading(true);
    try {
      const res = await fetch("/api/natal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          gender: gender || null,
          birthDate,
          birthTime: timeUnknown ? null : birthTime,
          birthTimeKnown: !timeUnknown,
          birthPlace: place.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Не удалось сохранить карту. Попробуйте ещё раз.");
        setLoading(false);
        return;
      }
      router.push(next ?? "/profile");
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Попробуйте позже.");
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-md border border-[var(--ink-600)] bg-[var(--ink-900)] px-3 py-2.5 text-sm text-[var(--bone)] outline-none focus:border-[var(--gold)]";

  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="eyebrow mb-2">Шаг после регистрации</p>
      <h1 className="font-display text-2xl sm:text-3xl text-[var(--gold-soft)]">
        Ваша натальная карта
      </h1>
      <p className="mt-2 text-sm text-[var(--bone-dim)] leading-relaxed">
        Она рассчитывается один раз и дальше учитывается во всех ваших раскладах —
        AI-таролог читает карты с оглядкой на ваш характер и врождённые сценарии.
        Данные нужны точные: дата даёт знаки, время — асцендент и дома, город —
        координаты и часовой пояс.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="n-name" className="eyebrow block mb-1.5">
            Имя
          </label>
          <input
            id="n-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
            required
          />
        </div>

        <div>
          <label htmlFor="n-gender" className="eyebrow block mb-1.5">
            Пол <span className="text-[var(--muted)] normal-case">— необязательно</span>
          </label>
          <select
            id="n-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={field}
          >
            <option value="">Не указывать</option>
            <option value="female">Женский</option>
            <option value="male">Мужской</option>
            <option value="other">Другое</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="n-date" className="eyebrow block mb-1.5">
              Дата рождения
            </label>
            <input
              id="n-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={field}
              required
            />
          </div>
          <div>
            <label htmlFor="n-time" className="eyebrow block mb-1.5">
              Время рождения
            </label>
            <input
              id="n-time"
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              disabled={timeUnknown}
              className={`${field} disabled:opacity-40`}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--bone-dim)]">
          <input
            type="checkbox"
            checked={timeUnknown}
            onChange={(e) => setTimeUnknown(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          Не знаю точное время рождения
        </label>
        {timeUnknown && (
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Карта построится без асцендента и домов, положение Луны — приблизительное.
            Позже сможете уточнить в профиле.
          </p>
        )}

        <div>
          <label htmlFor="n-place" className="eyebrow block mb-1.5">
            Город рождения
          </label>
          <div className="flex gap-2">
            <input
              id="n-place"
              value={place}
              onChange={(e) => {
                setPlace(e.target.value);
                setGeo(null);
                setGeoTried(false);
              }}
              onBlur={resolvePlace}
              placeholder="Например: Москва, Россия"
              className={field}
              required
            />
            <button
              type="button"
              onClick={resolvePlace}
              className="btn-ghost shrink-0 rounded-md px-3 text-sm"
            >
              Проверить
            </button>
          </div>
          {geoLoading && (
            <p className="mt-1.5 flex items-center gap-2 text-xs text-[var(--muted)]">
              <Spinner size={12} /> ищем город…
            </p>
          )}
          {!geoLoading && geo && (
            <p className="mt-1.5 text-xs text-[var(--gold-soft)]">
              ✓ {geo.label} · {geo.lat.toFixed(3)}, {geo.lon.toFixed(3)}
            </p>
          )}
          {!geoLoading && geoTried && !geo && (
            <p className="mt-1.5 text-xs" style={{ color: "var(--rose)" }}>
              Город не найден — попробуйте добавить страну.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--rose)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-gold inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Spinner size={15} />}
          {loading ? "Строим карту…" : "Построить и сохранить карту"}
        </button>
      </form>
    </div>
  );
}
