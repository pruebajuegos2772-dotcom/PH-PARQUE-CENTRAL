import { ensureDemoData, updateFundBalance } from "@/lib/ph-data";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      return Response.json({ error: "Ingresa un monto válido distinto de cero." }, { status: 400 });
    }
    await ensureDemoData();
    const fund = await updateFundBalance(amount);
    return Response.json(fund);
  } catch (error) {
    console.error("Unable to update fund", error);
    return Response.json({ error: "No fue posible actualizar el fondo." }, { status: 500 });
  }
}
