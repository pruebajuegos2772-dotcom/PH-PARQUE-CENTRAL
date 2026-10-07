import { ensureDemoData, updateFundBalance } from "@/lib/ph-data";
import { getSessionFromRequest, parseAmount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  if (session.role !== "administrador") {
    return Response.json({ error: "Solo la administración puede ajustar el fondo." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const amount = parseAmount(body.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      return Response.json({ error: "Ingresa un monto válido distinto de cero, por ejemplo 25.50 o -10.25." }, { status: 400 });
    }
    await ensureDemoData();
    const fund = await updateFundBalance(Math.round(amount * 100) / 100);
    return Response.json(fund);
  } catch (error) {
    console.error("Unable to update fund", error);
    return Response.json({ error: "No fue posible actualizar el fondo." }, { status: 500 });
  }
}
