import { getDashboardData } from "@/lib/ph-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getDashboardData());
  } catch (error) {
    console.error("Unable to load PH dashboard", error);
    return Response.json({ error: "No fue posible cargar el tablero." }, { status: 500 });
  }
}
