import { getCurrentUser } from "@/lib/auth";
import { getBalance } from "@/lib/wallet";
import { reconcilePending } from "@/lib/payments";

export const runtime = "nodejs";

// Сверить висящие платежи пользователя с ЮKassa и зачислить успешные.
// Вызывается клиентом при возврате со страницы оплаты — работает без вебхука.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "auth required" }, { status: 401 });

  const { credited } = await reconcilePending(user.id).catch(() => ({
    credited: 0,
  }));
  const balance = await getBalance(user.id).catch(() => 0);
  return Response.json({ credited, balance });
}
