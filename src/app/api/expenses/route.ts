import { createExpense, ensureDemoData } from "@/lib/ph-data";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);
    if (!body.description?.trim() || !body.vendor?.trim() || !body.category?.trim() || !Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Completa los datos y registra un monto válido." }, { status: 400 });
    }
    await ensureDemoData();
    const expense = await createExpense({ ...body, amount });
    return Response.json(expense, { status: 201 });
  } catch (error) {
    console.error("Unable to create expense", error);
    return Response.json({ error: "No fue posible registrar el gasto." }, { status: 500 });
  }
}
