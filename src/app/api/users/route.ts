import { db } from "@/db";
import { ownerAccounts } from "@/db/schema";
import { createResidentWithPassword, findResidentByEmail } from "@/lib/ph-data";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  if (session.role !== "administrador") {
    return Response.json({ error: "Solo la administración puede crear accesos." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const unit = String(body.unit ?? "").trim();
    const password = String(body.password ?? "");
    const role = body.role === "administrador" ? "administrador" : "propietario";

    if (!fullName || !email || !unit || password.length < 6) {
      return Response.json(
        { error: "Completa nombre, correo, unidad y una contraseña de al menos 6 caracteres." },
        { status: 400 },
      );
    }

    const exists = await findResidentByEmail(email);
    if (exists) return Response.json({ error: "Ya existe un usuario con ese correo." }, { status: 409 });

    const resident = await createResidentWithPassword({
      fullName,
      email,
      unit,
      role,
      phone: String(body.phone ?? ""),
      password,
    });

    if (role !== "administrador") {
      await db.insert(ownerAccounts).values({
        residentId: resident.id,
        period: "Febrero 2025",
        dueDate: "2025-02-10",
        dueAmount: "40.80",
        paidAmount: "0",
        status: "pendiente",
      });
    }

    return Response.json(
      { id: resident.id, name: resident.fullName, email: resident.email, unit: resident.unit },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unable to create user", error);
    return Response.json({ error: "No fue posible crear el acceso." }, { status: 500 });
  }
}
