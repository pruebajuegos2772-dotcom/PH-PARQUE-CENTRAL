import { getDashboardData } from "@/lib/ph-data";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "Sesión requerida. Inicia sesión nuevamente." }, { status: 401 });
  }
  try {
    return Response.json(await getDashboardData());
  } catch (error) {
    console.error("Unable to load PH dashboard", error);
    return Response.json({ error: "No fue posible cargar el tablero." }, { status: 500 });
  }
}
