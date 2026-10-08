import { createReport, ensureDemoData, updateReportStatus } from "@/lib/ph-data";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.title?.trim() || !body.description?.trim() || !body.location?.trim()) {
      return Response.json({ error: "Título, descripción y ubicación son obligatorios." }, { status: 400 });
    }
    await ensureDemoData();
    const report = await createReport({
      ...body,
      reporterName: body.reporterName?.trim() || session.name,
    });
    return Response.json(report, { status: 201 });
  } catch (error) {
    console.error("Unable to create report", error);
    return Response.json({ error: "No fue posible enviar el reporte." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  if (session.role !== "administrador") {
    return Response.json({ error: "Solo la administración puede cambiar el estado del reporte." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const updated = await updateReportStatus(Number(body.id), body.status);
    return Response.json(updated);
  } catch (error) {
    console.error("Unable to update report status", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No fue posible actualizar el estado." },
      { status: 400 },
    );
  }
}
