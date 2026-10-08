import { createReportComment, listReportComments } from "@/lib/ph-data";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  const reportId = Number(new URL(request.url).searchParams.get("reportId"));
  try {
    return Response.json({ comments: await listReportComments(reportId) });
  } catch (error) {
    console.error("Unable to list report comments", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No fue posible cargar los comentarios." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  try {
    const body = await request.json();
    const comment = await createReportComment({
      reportId: Number(body.reportId),
      message: String(body.message ?? ""),
      authorName: session.name,
      authorRole: session.role,
    });
    return Response.json(comment, { status: 201 });
  } catch (error) {
    console.error("Unable to create report comment", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No fue posible publicar el comentario." },
      { status: 400 },
    );
  }
}
