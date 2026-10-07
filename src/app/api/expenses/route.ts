import { createExpense, ensureDemoData } from "@/lib/ph-data";
import { getSessionFromRequest, parseAmount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  if (session.role !== "administrador") {
    return Response.json({ error: "Solo la administración puede registrar gastos." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const amount = parseAmount(body.amount);
    if (!body.description?.trim() || !body.vendor?.trim() || !body.category?.trim() || !Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Completa los datos y registra un monto válido, por ejemplo 5.45." }, { status: 400 });
    }
    await ensureDemoData();
    const expense = await createExpense({ ...body, amount: Math.round(amount * 100) / 100 });
    return Response.json(expense, { status: 201 });
  } catch (error) {
    console.error("Unable to create expense", error);
    return Response.json({ error: "No fue posible registrar el gasto." }, { status: 500 });
  }
}
