import { ensureFundExists, updateFundBalance } from "@/lib/ph-data";
import { getSessionFromRequest, parseAmount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  try {
    const fund = await ensureFundExists();
    return Response.json(fund);
  } catch (error) {
    console.error("Unable to load fund", error);
    return Response.json({ error: "No fue posible cargar el fondo." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  if (session.role !== "administrador") {
    return Response.json({ error: "Solo la administración puede ajustar el fondo." }, { status: 403 });
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Envía el monto como número, por ejemplo 5000 o 25.50." }, { status: 400 });
  }
  const amount = parseAmount(body.amount);
  if (!Number.isFinite(amount) || amount === 0) {
    return Response.json(
      { error: `Monto inválido ("${String(body.amount ?? "")}"). Ingresa un valor distinto de cero, por ejemplo 5000 o 25.50.` },
      { status: 400 },
    );
  }
  try {
    await ensureFundExists();
    const fund = await updateFundBalance(Math.round(amount * 100) / 100);
    return Response.json(fund);
  } catch (error) {
    console.error("Unable to update fund", error);
    const detail = error instanceof Error ? error.message : "Error desconocido";
    // Mensaje específico para que el portal muestre la causa real y no un genérico.
    return Response.json({ error: `No fue posible actualizar el fondo: ${detail}` }, { status: 500 });
  }
}
