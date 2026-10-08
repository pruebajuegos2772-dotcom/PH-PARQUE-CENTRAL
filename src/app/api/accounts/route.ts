import {
  createAccountEntry,
  deleteAccountEntry,
  ensureMonthlyCharges,
  listAccountsWithResidents,
  updateAccountEntry,
} from "@/lib/ph-data";
import { getSessionFromRequest, parseAmount } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requireAdmin(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return { error: Response.json({ error: "Debes iniciar sesión." }, { status: 401 }) };
  if (session.role !== "administrador") {
    return { error: Response.json({ error: "Solo la administración puede gestionar cuentas." }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  try {
    try {
      await ensureMonthlyCharges();
    } catch (error) {
      console.error("Unable to ensure monthly charges", error);
    }
    return Response.json({ accounts: await listAccountsWithResidents() });
  } catch (error) {
    console.error("Unable to list accounts", error);
    return Response.json({ error: "No fue posible cargar las cuentas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const check = requireAdmin(request);
  if (check.error) return check.error;
  try {
    const body = await request.json();
    const account = await createAccountEntry({
      residentId: Number(body.residentId),
      dueAmount: parseAmount(body.dueAmount),
      paidAmount: body.paidAmount === undefined || body.paidAmount === "" ? 0 : parseAmount(body.paidAmount),
      status: body.status,
      notes: body.notes ? String(body.notes) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
    });
    return Response.json(account, { status: 201 });
  } catch (error) {
    console.error("Unable to create account", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No fue posible crear la cuenta." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const check = requireAdmin(request);
  if (check.error) return check.error;
  try {
    const body = await request.json();
    const id = Number(body.id);
    const patch: { dueAmount?: number; paidAmount?: number; status?: string; notes?: string | null; dueDate?: string } = {};
    if (body.dueAmount !== undefined && body.dueAmount !== "") patch.dueAmount = parseAmount(body.dueAmount);
    if (body.paidAmount !== undefined && body.paidAmount !== "") patch.paidAmount = parseAmount(body.paidAmount);
    if (body.status !== undefined) patch.status = String(body.status);
    if (body.notes !== undefined) patch.notes = body.notes === null ? null : String(body.notes);
    if (body.dueDate) patch.dueDate = String(body.dueDate);
    const account = await updateAccountEntry(id, patch);
    return Response.json(account);
  } catch (error) {
    console.error("Unable to update account", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No fue posible actualizar la cuenta." },
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
    await deleteAccountEntry(id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete account", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No fue posible eliminar la cuenta." },
      { status: 400 },
    );
  }
}
