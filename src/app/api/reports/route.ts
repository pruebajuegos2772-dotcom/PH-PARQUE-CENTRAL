import { createReport, ensureDemoData } from "@/lib/ph-data";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title?.trim() || !body.description?.trim() || !body.location?.trim()) {
      return Response.json({ error: "Título, descripción y ubicación son obligatorios." }, { status: 400 });
    }
    await ensureDemoData();
    const report = await createReport(body);
    return Response.json(report, { status: 201 });
  } catch (error) {
    console.error("Unable to create report", error);
    return Response.json({ error: "No fue posible enviar el reporte." }, { status: 500 });
  }
}
