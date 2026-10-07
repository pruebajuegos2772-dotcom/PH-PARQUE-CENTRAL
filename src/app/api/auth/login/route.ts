import { findResidentByEmail, ensureDemoData } from "@/lib/ph-data";
import {
  buildSessionCookie,
  createSessionToken,
  normalizeRole,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return Response.json({ error: "Ingresa tu correo y contraseña." }, { status: 400 });
    }

    try {
      await ensureDemoData();
    } catch (error) {
      console.error("Unable to seed demo data", error);
    }

    const resident = await findResidentByEmail(email);
    if (!resident || !verifyPassword(password, resident.passwordHash)) {
      return Response.json({ error: "Credenciales incorrectas. Verifica tu correo y contraseña." }, { status: 401 });
    }

    const role = normalizeRole(resident.role);
    const token = createSessionToken({
      id: resident.id,
      email: resident.email,
      role,
      name: resident.fullName,
      unit: resident.unit,
    });

    const user = {
      id: resident.id,
      name: resident.fullName,
      email: resident.email,
      unit: resident.unit,
      role: role === "administrador" ? "Administrador" : "Propietario",
    };

    return Response.json({ user }, { headers: { "Set-Cookie": buildSessionCookie(token) } });
  } catch (error) {
    console.error("Login failed", error);
    return Response.json(
      { error: "No fue posible iniciar sesión. Si actualizaste el código, ejecuta `npx drizzle-kit push` en Neon." },
      { status: 500 },
    );
  }
}
