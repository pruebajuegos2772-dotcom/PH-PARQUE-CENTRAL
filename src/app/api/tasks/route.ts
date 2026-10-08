import { createMaintenanceTask, ensureDemoData } from "@/lib/ph-data";
import { getSessionFromRequest, parseAmount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  if (session.role !== "administrador") {
    return Response.json({ error: "Solo la administración puede crear tareas de mantenimiento." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!body.title?.trim() || !body.category?.trim() || !body.location?.trim()) {
      return Response.json({ error: "Título, categoría y ubicación son obligatorios." }, { status: 400 });
    }
    const costRaw = body.cost ?? body.estimatedCost ?? body.actualCost ?? 0;
    const cost = typeof costRaw === "number" ? costRaw : parseAmount(costRaw);
    const costValue = Number.isFinite(cost) && cost >= 0 ? Math.round(cost * 100) / 100 : 0;
    const invoiceData = typeof body.invoiceData === "string" && body.invoiceData.startsWith("data:") ? body.invoiceData : undefined;
    const invoiceName = typeof body.invoiceName === "string" ? body.invoiceName.slice(0, 180) : undefined;
    const invoiceMime = typeof body.invoiceMime === "string" ? body.invoiceMime.slice(0, 80) : undefined;
    await ensureDemoData();
    const task = await createMaintenanceTask({
      ...body,
      cost: costValue,
      invoiceData,
      invoiceName,
      invoiceMime,
    });
    return Response.json(task, { status: 201 });
  } catch (error) {
    console.error("Unable to create maintenance task", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No fue posible guardar la tarea." },
      { status: 400 },
    );
  }
}
