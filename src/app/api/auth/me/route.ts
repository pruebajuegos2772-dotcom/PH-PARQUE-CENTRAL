import { eq } from "drizzle-orm";
import { db } from "@/db";
import { residents } from "@/db/schema";
import { getSessionFromRequest, normalizeRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ user: null }, { status: 401 });

  try {
    const rows = await db.select().from(residents).where(eq(residents.id, session.id)).limit(1);
    const resident = rows[0];
    if (!resident) return Response.json({ user: null }, { status: 401 });
    const role = normalizeRole(resident.role);
    return Response.json({
      user: {
        id: resident.id,
        name: resident.fullName,
        email: resident.email,
        unit: resident.unit,
        role: role === "administrador" ? "Administrador" : "Propietario",
      },
    });
  } catch {
    return Response.json({
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        unit: session.unit,
        role: session.role === "administrador" ? "Administrador" : "Propietario",
      },
    });
  }
}
