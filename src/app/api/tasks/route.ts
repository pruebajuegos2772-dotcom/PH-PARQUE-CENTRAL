import { createMaintenanceTask, ensureDemoData } from "@/lib/ph-data";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.title?.trim() || !body.category?.trim() || !body.location?.trim()) {
      return Response.json({ error: "Título, categoría y ubicación son obligatorios." }, { status: 400 });
    }
    await ensureDemoData();
    const task = await createMaintenanceTask(body);
    return Response.json(task, { status: 201 });
  } catch (error) {
    console.error("Unable to create maintenance task", error);
    return Response.json({ error: "No fue posible guardar la tarea." }, { status: 500 });
  }
}
