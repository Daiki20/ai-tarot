import { getCurrentUser } from "@/lib/auth";
import { geocodeCity } from "@/lib/natal/geocode";

export const runtime = "nodejs";

// Предпросмотр распознавания города для формы натальной карты.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { q?: unknown } | null;
  const q = typeof body?.q === "string" ? body.q : "";
  if (q.trim().length < 2) {
    return Response.json({ result: null });
  }

  const result = await geocodeCity(q);
  return Response.json({ result });
}
