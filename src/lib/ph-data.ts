import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  expenses,
  maintenanceTasks,
  ownerAccounts,
  phFunds,
  residents,
  reports,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";

const asNumber = (value: string | number | null) => Number(value ?? 0);

// Credenciales iniciales de demostración (cámbialas luego desde la base de datos).
export const DEMO_ADMIN_EMAIL = "andrea.morales@phnexo.pa";
export const DEMO_ADMIN_PASSWORD = "Admin123*";
export const DEMO_OWNER_EMAIL = "carlos.mendoza@email.com";
export const DEMO_OWNER_PASSWORD = "Parque123*";

async function backfillDemoPasswords() {
  const rows = await db.select().from(residents);
  for (const row of rows) {
    if (row.passwordHash) continue;
    const password =
      row.role === "administrador" ? DEMO_ADMIN_PASSWORD : DEMO_OWNER_PASSWORD;
    await db
      .update(residents)
      .set({ passwordHash: hashPassword(password) })
      .where(eq(residents.id, row.id));
  }
}

export async function findResidentByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const rows = await db.select().from(residents).limit(50);
  return rows.find((row) => row.email.trim().toLowerCase() === normalized) ?? null;
}

export async function createResidentWithPassword(input: {
  fullName: string;
  email: string;
  unit: string;
  role?: string;
  phone?: string;
  password: string;
}) {
  const [row] = await db
    .insert(residents)
    .values({
      fullName: input.fullName,
      email: input.email.trim().toLowerCase(),
      unit: input.unit,
      role: input.role === "administrador" ? "administrador" : "propietario",
      phone: input.phone || null,
      accountStatus: "al_dia",
      outstandingBalance: "0",
      passwordHash: hashPassword(input.password),
    })
    .returning();
  return row;
}

export async function ensureFundExists() {
  const [fund] = await db.select().from(phFunds).limit(1);
  if (fund) return fund;
  const [created] = await db
    .insert(phFunds)
    .values({
      name: "Fondo común PH Parque Central",
      currentBalance: "0",
      monthlyFee: "40.80",
      monthlyBudget: "0",
    })
    .returning();
  return created;
}

export async function ensureDemoData() {
  const existing = await db.select({ id: residents.id }).from(residents).limit(1);
  if (existing.length > 0) {
    await backfillDemoPasswords();
    await ensureFundExists();
    return;
  }

  const adminHash = hashPassword(DEMO_ADMIN_PASSWORD);
  const ownerHash = hashPassword(DEMO_OWNER_PASSWORD);

  await db.transaction(async (tx) => {
    const insertedResidents = await tx
      .insert(residents)
      .values([
        { fullName: "Andrea Morales", email: "andrea.morales@phnexo.pa", unit: "Torre A · 3B", role: "administrador", phone: "+507 6000-1212", accountStatus: "al_dia", passwordHash: adminHash },
        { fullName: "Carlos Mendoza", email: "carlos.mendoza@email.com", unit: "Torre A · 2A", role: "propietario", phone: "+507 6501-3480", accountStatus: "pendiente", outstandingBalance: "81.60", passwordHash: ownerHash },
        { fullName: "Elena Ríos", email: "elena.rios@email.com", unit: "Torre B · 6C", role: "propietario", phone: "+507 6623-1109", accountStatus: "al_dia", passwordHash: ownerHash },
        { fullName: "Luis Ortega", email: "luis.ortega@email.com", unit: "Torre B · 1D", role: "propietario", phone: "+507 6912-7341", accountStatus: "vencido", outstandingBalance: "122.40", passwordHash: ownerHash },
        { fullName: "Mariana Chen", email: "mariana.chen@email.com", unit: "Torre C · 4A", role: "propietario", phone: "+507 6482-5302", accountStatus: "pendiente", outstandingBalance: "40.80", passwordHash: ownerHash },
        { fullName: "Daniel Castillo", email: "daniel.castillo@email.com", unit: "Torre C · 7B", role: "propietario", phone: "+507 6204-0945", accountStatus: "al_dia", passwordHash: ownerHash },
      ])
      .returning({ id: residents.id, email: residents.email });

    const byEmail = new Map(insertedResidents.map((resident) => [resident.email, resident.id]));

    await tx.insert(phFunds).values({
      name: "Fondo común PH Parque Central",
      currentBalance: "12840.55",
      monthlyFee: "40.80",
      monthlyBudget: "4896.00",
    });

    await tx.insert(maintenanceTasks).values([
      { title: "Limpieza profunda del lobby", description: "Lavado de pisos y cristales de acceso principal.", category: "Limpieza edificio", location: "Torre A · Lobby", priority: "media", status: "en_progreso", scheduledFor: "2025-02-19", assignedTo: "Brillo Total", estimatedCost: "180.00" },
      { title: "Poda y riego de jardineras", description: "Mantenimiento quincenal de áreas verdes.", category: "Áreas verdes", location: "Plaza central", priority: "baja", status: "programada", scheduledFor: "2025-02-20", assignedTo: "Verde Urbano", estimatedCost: "220.00" },
      { title: "Revisión de luminarias exteriores", description: "Cambio de focos LED con fallas en accesos y estacionamientos.", category: "Iluminación", location: "Estacionamientos", priority: "alta", status: "pendiente", scheduledFor: "2025-02-22", assignedTo: "ElectroPro", estimatedCost: "360.00" },
      { title: "Sellado de filtración", description: "Inspección de fisura reportada en muro lateral.", category: "Reparación estructural", location: "Torre B · Nivel 4", priority: "alta", status: "pendiente", scheduledFor: "2025-02-24", assignedTo: "Obras PH", estimatedCost: "480.00" },
    ]);

    await tx.insert(reports).values([
      { title: "Luminaria apagada", description: "La lámpara del pasillo permanece apagada durante la noche.", category: "Daño", location: "Torre C · Piso 5", priority: "media", status: "en_revision", reporterName: "Mariana Chen" },
      { title: "Ruido fuera de horario", description: "Música a volumen elevado después de las 11:00 p.m.", category: "Convivencia", location: "Torre A · 2A", priority: "baja", status: "recibido", reporterName: "Elena Ríos" },
      { title: "Filtración cerca del ascensor", description: "Se observa humedad en la pared frente al ascensor.", category: "Daño", location: "Torre B · Nivel 4", priority: "alta", status: "asignado", reporterName: "Luis Ortega" },
    ]);

    await tx.insert(expenses).values([
      { category: "Servicios", description: "Factura de agua potable", vendor: "IDAAN", amount: "484.32", expenseDate: "2025-02-03", status: "pagado" },
      { category: "Servicios", description: "Energía de áreas comunes", vendor: "Naturgy", amount: "726.81", expenseDate: "2025-02-05", status: "pagado" },
      { category: "Limpieza", description: "Servicio mensual de limpieza", vendor: "Brillo Total", amount: "610.00", expenseDate: "2025-02-10", status: "pagado" },
      { category: "Áreas verdes", description: "Mantenimiento de jardineras", vendor: "Verde Urbano", amount: "325.00", expenseDate: "2025-02-12", status: "pagado" },
      { category: "Repuestos", description: "Focos LED y materiales", vendor: "Ferretería Central", amount: "186.45", expenseDate: "2025-02-14", status: "pagado" },
    ]);

    await tx.insert(ownerAccounts).values([
      { residentId: byEmail.get("andrea.morales@phnexo.pa")!, period: "Febrero 2025", dueDate: "2025-02-10", dueAmount: "40.80", paidAmount: "40.80", status: "pagado" },
      { residentId: byEmail.get("carlos.mendoza@email.com")!, period: "Febrero 2025", dueDate: "2025-02-10", dueAmount: "40.80", paidAmount: "0", status: "vencido" },
      { residentId: byEmail.get("elena.rios@email.com")!, period: "Febrero 2025", dueDate: "2025-02-10", dueAmount: "40.80", paidAmount: "40.80", status: "pagado" },
      { residentId: byEmail.get("luis.ortega@email.com")!, period: "Febrero 2025", dueDate: "2025-02-10", dueAmount: "40.80", paidAmount: "0", status: "vencido" },
      { residentId: byEmail.get("mariana.chen@email.com")!, period: "Febrero 2025", dueDate: "2025-02-10", dueAmount: "40.80", paidAmount: "0", status: "pendiente" },
      { residentId: byEmail.get("daniel.castillo@email.com")!, period: "Febrero 2025", dueDate: "2025-02-10", dueAmount: "40.80", paidAmount: "40.80", status: "pagado" },
    ]);
  });
}

export async function getDashboardData() {
  await ensureDemoData();

  const [fund, taskRows, reportRows, expenseRows, accountRows, residentRows] = await Promise.all([
    db.select().from(phFunds).limit(1),
    db.select().from(maintenanceTasks).orderBy(desc(maintenanceTasks.createdAt)),
    db.select().from(reports).orderBy(desc(reports.createdAt)),
    db.select().from(expenses).orderBy(desc(expenses.expenseDate)),
    db
      .select({
        id: ownerAccounts.id,
        period: ownerAccounts.period,
        dueDate: ownerAccounts.dueDate,
        dueAmount: ownerAccounts.dueAmount,
        paidAmount: ownerAccounts.paidAmount,
        status: ownerAccounts.status,
        notes: ownerAccounts.notes,
        residentId: residents.id,
        residentName: residents.fullName,
        unit: residents.unit,
        email: residents.email,
        outstandingBalance: residents.outstandingBalance,
      })
      .from(ownerAccounts)
      .innerJoin(residents, eq(ownerAccounts.residentId, residents.id))
      .orderBy(desc(ownerAccounts.createdAt)),
    db.select().from(residents).orderBy(residents.fullName),
  ]);

  const totalExpenses = expenseRows.reduce((total, expense) => total + asNumber(expense.amount), 0);
  const totalBilled = accountRows.reduce((total, account) => total + asNumber(account.dueAmount), 0);
  const totalPaid = accountRows.reduce((total, account) => total + asNumber(account.paidAmount), 0);
  const outstanding = accountRows.reduce(
    (total, account) => total + Math.max(0, asNumber(account.dueAmount) - asNumber(account.paidAmount)),
    0,
  );

  return {
    fund: fund[0]
      ? { ...fund[0], currentBalance: asNumber(fund[0].currentBalance), monthlyFee: asNumber(fund[0].monthlyFee), monthlyBudget: asNumber(fund[0].monthlyBudget) }
      : null,
    tasks: taskRows.map((task) => ({ ...task, estimatedCost: asNumber(task.estimatedCost) })),
    reports: reportRows,
    expenses: expenseRows.map((expense) => ({ ...expense, amount: asNumber(expense.amount) })),
    accounts: accountRows.map((account) => ({
      ...account,
      notes: account.notes ?? null,
      dueAmount: asNumber(account.dueAmount),
      paidAmount: asNumber(account.paidAmount),
      outstandingBalance: asNumber(account.outstandingBalance),
    })),
    residents: residentRows.map((resident) => ({
      id: resident.id,
      fullName: resident.fullName,
      email: resident.email,
      unit: resident.unit,
      role: resident.role,
      phone: resident.phone,
      accountStatus: resident.accountStatus,
      outstandingBalance: asNumber(resident.outstandingBalance),
    })),
    summary: {
      totalExpenses,
      totalBilled,
      totalPaid,
      outstanding,
      activeTasks: taskRows.filter((task) => task.status !== "completada").length,
      openReports: reportRows.filter((report) => !["cerrado", "resuelto"].includes(report.status)).length,
      collectionRate: totalBilled ? Math.round((totalPaid / totalBilled) * 100) : 0,
    },
  };
}

export async function createMaintenanceTask(input: {
  title: string;
  category: string;
  location: string;
  priority?: string;
  description?: string;
  scheduledFor?: string;
}) {
  const [task] = await db
    .insert(maintenanceTasks)
    .values({
      title: input.title,
      category: input.category,
      location: input.location,
      priority: input.priority || "media",
      description: input.description || null,
      scheduledFor: input.scheduledFor || null,
      status: "programada",
    })
    .returning();
  return task;
}

export async function createReport(input: {
  title: string;
  category: string;
  location: string;
  priority?: string;
  description: string;
  reporterName?: string;
}) {
  const [report] = await db
    .insert(reports)
    .values({
      title: input.title,
      category: input.category,
      location: input.location,
      priority: input.priority || "media",
      description: input.description,
      reporterName: input.reporterName || "Propietario",
      status: "recibido",
    })
    .returning();
  return report;
}

export async function createExpense(input: {
  category: string;
  description: string;
  vendor: string;
  amount: number;
  expenseDate?: string;
}) {
  const [expense] = await db
    .insert(expenses)
    .values({
      category: input.category,
      description: input.description,
      vendor: input.vendor,
      amount: String(input.amount),
      expenseDate: input.expenseDate || new Date().toISOString().slice(0, 10),
      status: "pagado",
    })
    .returning();
  return { ...expense, amount: asNumber(expense.amount) };
}

export async function updateFundBalance(amount: number) {
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error("Monto inválido para ajustar el fondo.");
  }
  let [currentFund] = await db.select().from(phFunds).limit(1);
  if (!currentFund) {
    currentFund = await ensureFundExists();
  }
  if (!currentFund) throw new Error("No existe un fondo configurado");
  const nextBalance = Math.round((asNumber(currentFund.currentBalance) + amount) * 100) / 100;
  const [fund] = await db
    .update(phFunds)
    .set({ currentBalance: String(nextBalance), updatedAt: new Date() })
    .where(eq(phFunds.id, currentFund.id))
    .returning();
  return { ...fund, currentBalance: asNumber(fund.currentBalance) };
}

export async function getExpenseCategories() {
  return db
    .select({ category: expenses.category, total: sql<string>`sum(${expenses.amount})` })
    .from(expenses)
    .groupBy(expenses.category);
}

export async function listResidentsForAdmin() {
  const rows = await db.select().from(residents).orderBy(residents.fullName);
  return rows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    unit: row.unit,
    role: row.role,
    phone: row.phone,
    accountStatus: row.accountStatus,
    outstandingBalance: asNumber(row.outstandingBalance),
    createdAt: row.createdAt,
  }));
}

export async function updateResidentByAdmin(
  id: number,
  input: { fullName?: string; unit?: string; phone?: string; role?: string; password?: string },
) {
  const patch: Partial<typeof residents.$inferInsert> = {};
  if (input.fullName?.trim()) patch.fullName = input.fullName.trim();
  if (input.unit?.trim()) patch.unit = input.unit.trim();
  if (typeof input.phone === "string") patch.phone = input.phone.trim() || null;
  if (input.role === "administrador" || input.role === "propietario") patch.role = input.role;
  if (input.password) {
    if (input.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
    patch.passwordHash = hashPassword(input.password);
  }
  if (Object.keys(patch).length === 0) throw new Error("No hay cambios para guardar.");
  const [row] = await db.update(residents).set(patch).where(eq(residents.id, id)).returning();
  if (!row) throw new Error("Usuario no encontrado.");
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    unit: row.unit,
    role: row.role,
  };
}

export async function deleteResidentByAdmin(id: number) {
  const rows = await db.select().from(residents).where(eq(residents.id, id)).limit(1);
  if (!rows[0]) throw new Error("Usuario no encontrado.");
  await db.delete(residents).where(eq(residents.id, id));
  return { ok: true };
}

export const ACCOUNT_STATUSES = ["al_dia", "moroso", "pagado", "pendiente", "vencido"] as const;

export function normalizeAccountStatus(value: unknown): string {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "al_dia" || v === "al dia" || v === "al día" || v === "aldia") return "al_dia";
  if ((ACCOUNT_STATUSES as readonly string[]).includes(v)) return v;
  return "pendiente";
}

function currentPeriodLabel(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

export async function listAccountsWithResidents() {
  const rows = await db
    .select({
      id: ownerAccounts.id,
      period: ownerAccounts.period,
      dueDate: ownerAccounts.dueDate,
      dueAmount: ownerAccounts.dueAmount,
      paidAmount: ownerAccounts.paidAmount,
      status: ownerAccounts.status,
      notes: ownerAccounts.notes,
      residentId: residents.id,
      residentName: residents.fullName,
      unit: residents.unit,
      email: residents.email,
      outstandingBalance: residents.outstandingBalance,
    })
    .from(ownerAccounts)
    .innerJoin(residents, eq(ownerAccounts.residentId, residents.id))
    .orderBy(desc(ownerAccounts.createdAt));
  return rows.map((account) => ({
    ...account,
    notes: account.notes ?? null,
    dueAmount: asNumber(account.dueAmount),
    paidAmount: asNumber(account.paidAmount),
    outstandingBalance: asNumber(account.outstandingBalance),
  }));
}

export async function createAccountEntry(input: {
  residentId: number;
  dueAmount: number;
  paidAmount?: number;
  status?: string;
  notes?: string;
  dueDate?: string;
}) {
  if (!Number.isFinite(input.residentId) || input.residentId <= 0) throw new Error("Propietario inválido.");
  if (!Number.isFinite(input.dueAmount) || input.dueAmount < 0) throw new Error("Cuota inválida.");
  const paid = input.paidAmount ?? 0;
  if (!Number.isFinite(paid) || paid < 0) throw new Error("Monto pagado inválido.");
  const residentRows = await db.select().from(residents).where(eq(residents.id, input.residentId)).limit(1);
  if (!residentRows[0]) throw new Error("Propietario no encontrado.");
  const dueDate = input.dueDate || new Date().toISOString().slice(0, 10);
  const [row] = await db
    .insert(ownerAccounts)
    .values({
      residentId: input.residentId,
      period: currentPeriodLabel(new Date(`${dueDate}T12:00:00`)),
      dueDate,
      dueAmount: String(Math.round(input.dueAmount * 100) / 100),
      paidAmount: String(Math.round(paid * 100) / 100),
      status: normalizeAccountStatus(input.status),
      notes: input.notes?.trim() ? input.notes.trim().slice(0, 500) : null,
    })
    .returning();
  return row;
}

export async function updateAccountEntry(
  id: number,
  input: { dueAmount?: number; paidAmount?: number; status?: string; notes?: string | null; dueDate?: string },
) {
  if (!Number.isFinite(id) || id <= 0) throw new Error("Cuenta inválida.");
  const patch: Partial<typeof ownerAccounts.$inferInsert> = {};
  if (input.dueAmount !== undefined) {
    if (!Number.isFinite(input.dueAmount) || input.dueAmount < 0) throw new Error("Cuota inválida.");
    patch.dueAmount = String(Math.round(input.dueAmount * 100) / 100);
  }
  if (input.paidAmount !== undefined) {
    if (!Number.isFinite(input.paidAmount) || input.paidAmount < 0) throw new Error("Monto pagado inválido.");
    patch.paidAmount = String(Math.round(input.paidAmount * 100) / 100);
  }
  if (input.status !== undefined) patch.status = normalizeAccountStatus(input.status);
  if (input.notes !== undefined) {
    patch.notes = input.notes && String(input.notes).trim() ? String(input.notes).trim().slice(0, 500) : null;
  }
  if (input.dueDate) patch.dueDate = input.dueDate;
  if (Object.keys(patch).length === 0) throw new Error("No hay cambios para guardar.");
  const [row] = await db.update(ownerAccounts).set(patch).where(eq(ownerAccounts.id, id)).returning();
  if (!row) throw new Error("Cuenta no encontrada.");
  return { ...row, dueAmount: asNumber(row.dueAmount), paidAmount: asNumber(row.paidAmount) };
}

export async function deleteAccountEntry(id: number) {
  if (!Number.isFinite(id) || id <= 0) throw new Error("Cuenta inválida.");
  await db.delete(ownerAccounts).where(eq(ownerAccounts.id, id));
  return { ok: true };
}
