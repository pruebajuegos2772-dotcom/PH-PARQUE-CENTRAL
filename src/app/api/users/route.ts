import { db } from "@/db";
import { ownerAccounts } from "@/db/schema";
import {
  createResidentWithPassword,
  deleteResidentByAdmin,
  findResidentByEmail,
  listResidentsForAdmin,
  updateResidentByAdmin,
} from "@/lib/ph-data";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requireAdmin(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return { error: Response.json({ error: "Debes iniciar sesión." }, { status: 401 }) };
  if (session.role !== "administrador") {
    return { error: Response.json({ error: "Solo la administración puede gestionar usuarios." }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request: Request) {
  const check = requireAdmin(request);
  if (check.error) return check.error;
  try {
    return Response.json({ users: await listResidentsForAdmin() });
  } catch (error) {
    console.error("Unable to list users", error);
    return Response.json({ error: "No fue posible cargar los usuarios." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const check = requireAdmin(request);
  if (check.error) return check.error;

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

export async function PATCH(request: Request) {
  const check = requireAdmin(request);
  if (check.error) return check.error;
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) {
      return Response.json({ error: "Usuario inválido." }, { status: 400 });
    }
    const updated = await updateResidentByAdmin(id, {
      fullName: body.fullName,
      unit: body.unit,
      phone: body.phone,
      role: body.role,
      password: body.password ? String(body.password) : undefined,
    });
    return Response.json(updated);
  } catch (error) {
    console.error("Unable to update user", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No fue posible actualizar el usuario." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const check = requireAdmin(request);
  if (check.error) return check.error;
  try {
    const body = await request.json().catch(() => ({}));
    const id = Number(body.id ?? new URL(request.url).searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return Response.json({ error: "Usuario inválido." }, { status: 400 });
    }
    if (check.session && id === check.session.id) {
      return Response.json({ error: "No puedes eliminar tu propio acceso de administrador." }, { status: 400 });
    }
    await deleteResidentByAdmin(id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete user", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No fue posible eliminar el usuario." },
      { status: 400 },
    );
  }
}
