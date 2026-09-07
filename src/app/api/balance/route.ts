import { getCurrentUser } from "@/lib/auth";
import { getBalance } from "@/lib/wallet";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ balance: 0, authed: false });
  const balance = await getBalance(user.id).catch(() => 0);
  return Response.json({ balance, authed: true });
}
