"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Check,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { PhLogo } from "@/components/ph-logo";

export type PanelAccount = {
  id: number;
  period: string;
  dueDate: string;
  dueAmount: number;
  paidAmount: number;
  status: string;
  notes: string | null;
  residentId: number;
  residentName: string;
  unit: string;
  email: string;
  outstandingBalance: number;
};

type Account = PanelAccount;

function accountStatusLabel(value: string) {
  const v = value.toLowerCase();
  if (v === "al_dia") return "Al día";
  if (v === "moroso") return "Moroso";
  if (v === "pagado") return "Pagado";
  if (v === "pendiente") return "Pendiente";
  if (v === "vencido") return "Vencido";
  return value.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

type ManagedUser = {
  id: number;
  fullName: string;
  email: string;
  unit: string;
  role: string;
  monthlyFee?: number;
};

type Role = "Administrador" | "Propietario";

const formatMoney = (value: number) =>
  `B/. ${value.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toDecimal = (value: string) => Number(value.trim().replace(/\s/g, "").replace(",", "."));

const formatDate = (value: string) => {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("es-PA", { day: "2-digit", month: "short", year: "numeric" }).format(d);
};

function Pill({ value, compact = true }: { value: string; compact?: boolean }) {
  const v = value.toLowerCase();
  const cls =
    v === "al_dia" || v === "pagado"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : v === "moroso" || v === "vencido"
        ? "bg-rose-50 text-rose-700 ring-rose-100"
        : "bg-amber-50 text-amber-700 ring-amber-100";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ${compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"} ${cls}`}
    >
      {accountStatusLabel(value)}
    </span>
  );
}

function Metric({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Check; tone: "gold" | "green" | "coral" }) {
  const palette =
    tone === "gold"
      ? "bg-[#f8efd0] text-[#9b7821]"
      : tone === "green"
        ? "bg-[#e3f2eb] text-[#327863]"
        : "bg-[#fbe9e3] text-[#c9674c]";
  return (
    <article className="rounded-[23px] border border-[#e1ebe6] bg-white p-4 shadow-[0_8px_30px_rgba(23,63,53,0.035)] sm:p-5">
      <div className="flex items-start justify-between">
        <div className={`grid size-10 place-items-center rounded-xl ${palette}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-5 text-[25px] font-bold leading-none tracking-[-0.045em] text-[#1c453d]">{value}</p>
      <p className="mt-2 text-xs font-bold text-[#58726b]">{label}</p>
      <p className="mt-1 text-[11px] text-[#91a19d]">{detail}</p>
    </article>
  );
}

export function AccountsPanel({
  accounts,
  allAccounts,
  residents,
  query,
  onQuery,
  fee,
  role,
  currentEmail,
  onChanged,
  notify,
}: {
  accounts: Account[];
  allAccounts: Account[];
  residents: ManagedUser[];
  query: string;
  onQuery: (v: string) => void;
  fee: number;
  role: Role;
  currentEmail: string;
  onChanged: () => Promise<void>;
  notify: (msg: string) => void;
}) {
  const isAdmin = role === "Administrador";
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDue, setEditDue] = useState("");
  const [editPaid, setEditPaid] = useState("");
  const [editStatus, setEditStatus] = useState("al_dia");
  const [editNotes, setEditNotes] = useState("");
  const [editDate, setEditDate] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<Account | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createResident, setCreateResident] = useState("");
  const [createDue, setCreateDue] = useState(String(fee));
  const [createPaid, setCreatePaid] = useState("0");
  const [createStatus, setCreateStatus] = useState("pendiente");
  const [createDate, setCreateDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [createNotes, setCreateNotes] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (createResident) return;
    const selected = residents.find((r) => String(r.id) === createResident);
    if (selected?.monthlyFee) setCreateDue(String(Number(selected.monthlyFee).toFixed(2)));
    else setCreateDue(String(fee));
  }, [fee, createResident, residents]);

  useEffect(() => {
    if (!residents.length) return;
    if (!createResident) {
      const firstOwner = residents.find((r) => r.role !== "administrador") ?? residents[0];
      if (firstOwner) {
        setCreateResident(String(firstOwner.id));
        if (firstOwner.monthlyFee) setCreateDue(String(Number(firstOwner.monthlyFee).toFixed(2)));
      }
    }
  }, [residents, createResident]);

  const handleSelectResident = (id: string) => {
    setCreateResident(id);
    const selected = residents.find((r) => String(r.id) === id);
    if (selected?.monthlyFee) setCreateDue(String(Number(selected.monthlyFee).toFixed(2)));
  };

  const ownAccounts = useMemo(() => {
    const lowered = currentEmail.toLowerCase();
    return allAccounts.filter((a) => a.email.toLowerCase() === lowered);
  }, [allAccounts, currentEmail]);

  const visibleAccounts = isAdmin ? accounts : ownAccounts;

  const alDia = allAccounts.filter((a) => ["al_dia", "pagado"].includes(a.status)).length;
  const morosos = allAccounts.filter((a) => ["moroso", "vencido"].includes(a.status)).length;
  const saldos = allAccounts.reduce((t, a) => t + Math.max(0, a.dueAmount - a.paidAmount), 0);
  const ownBalance = ownAccounts.reduce((t, a) => t + Math.max(0, a.dueAmount - a.paidAmount), 0);

  const startEdit = (a: Account) => {
    setEditingId(a.id);
    setEditDue(String(a.dueAmount.toFixed(2)));
    setEditPaid(String(a.paidAmount.toFixed(2)));
    setEditStatus(a.status);
    setEditNotes(a.notes ?? "");
    setEditDate(a.dueDate || new Date().toISOString().slice(0, 10));
  };

  const saveEdit = async (id: number) => {
    const due = toDecimal(editDue);
    const paid = toDecimal(editPaid);
    if (!Number.isFinite(due) || due < 0) return notify("Cuota inválida. Usa un número como 40.80.");
    if (!Number.isFinite(paid) || paid < 0) return notify("Monto pagado inválido. Usa un número como 20.00.");
    setBusyId(id);
    try {
      const res = await fetch("/api/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, dueAmount: due, paidAmount: paid, status: editStatus, notes: editNotes, dueDate: editDate || undefined }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "No se pudo actualizar.");
      setEditingId(null);
      notify("Cuenta actualizada correctamente.");
      await onChanged();
    } catch (e) {
      notify(e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      setBusyId(null);
    }
  };

  const removeAccount = async (id: number) => {
    if (!window.confirm("¿Eliminar este movimiento de cuenta?")) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "No se pudo eliminar.");
      notify("Movimiento eliminado.");
      await onChanged();
    } catch (e) {
      notify(e instanceof Error ? e.message : "No se pudo eliminar.");
    } finally {
      setBusyId(null);
    }
  };

  const createMovement = async () => {
    const due = toDecimal(createDue);
    const paid = toDecimal(createPaid || "0");
    if (!createResident) return notify("Selecciona un propietario.");
    if (!Number.isFinite(due) || due < 0) return notify("Cuota inválida. Ejemplo: 40.80.");
    if (!Number.isFinite(paid) || paid < 0) return notify("Monto pagado inválido. Ejemplo: 20.00.");
    setCreating(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: Number(createResident),
          dueAmount: due,
          paidAmount: paid,
          status: createStatus,
          notes: createNotes,
          dueDate: createDate,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "No se pudo crear el movimiento.");
      setShowCreate(false);
      setCreateNotes("");
      setCreatePaid("0");
      notify("Movimiento agregado al estado de cuenta.");
      await onChanged();
    } catch (e) {
      notify(e instanceof Error ? e.message : "No se pudo crear el movimiento.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      {role === "Propietario" && (
        <section className="rounded-[26px] bg-[#edf6f1] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#578074]">
                Mi estado de cuenta · {ownAccounts[0]?.unit ?? "—"}
              </p>
              <p className="mt-2 text-[30px] font-bold tracking-[-0.05em] text-[#214b42]">
                {ownBalance <= 0 ? "¡Estás al día!" : formatMoney(ownBalance)}
              </p>
              <p className="mt-1 text-sm text-[#638078]">Cuota de administración: {formatMoney(fee)} al mes.</p>
            </div>
            {ownAccounts[0] && <Pill value={ownBalance <= 0 ? "al_dia" : ownAccounts[0].status} />}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label={isAdmin ? "Cuentas al día" : "Mis cuentas al día"} value={`${alDia}/${allAccounts.length}`} detail={isAdmin ? "Del total de movimientos" : "De tus movimientos"} icon={Check} tone="green" />
        <Metric label="Saldos por cobrar" value={formatMoney(isAdmin ? saldos : ownBalance)} detail={`${morosos} en mora`} icon={BadgeDollarSign} tone="coral" />
        <Metric label="Cuota mensual" value={formatMoney(fee)} detail="Por apartamento" icon={ReceiptText} tone="gold" />
      </div>

      <section className="overflow-hidden rounded-[26px] border border-[#e1ebe6] bg-white shadow-[0_8px_30px_rgba(23,63,53,0.035)]">
        <div className="flex flex-col gap-3 border-b border-[#ebf0ed] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#284e45]">{isAdmin ? "Cuentas de propietarios" : "Mi estado de cuenta"}</h2>
            <p className="mt-1 text-sm text-[#7a8e88]">
              {isAdmin ? "Cada 1ro se genera la cuota sola (40.80 o la personalizada). La cuota no se toca salvo corrección; lo pagado resta del saldo." : "Consulta tus pagos y descarga tu recibo."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex h-10 items-center gap-2 rounded-xl border border-[#dce7e2] px-3 text-[#7c928b]">
              <Search size={16} />
              <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Buscar propietario" className="w-40 bg-transparent text-sm text-[#31544d] outline-none placeholder:text-[#9aaba6]" />
            </label>
            {isAdmin && (
              <button onClick={() => setShowCreate(!showCreate)} className="flex items-center justify-center gap-2 rounded-xl bg-[#204f46] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#163f38]">
                <Plus size={15} /> {showCreate ? "Cerrar" : "Agregar movimiento"}
              </button>
            )}
          </div>
        </div>

        {isAdmin && showCreate && (
          <div className="grid gap-3 border-b border-[#ebf0ed] bg-[#f7faf8] p-5 sm:p-6 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Propietario</span>
              <select value={createResident} onChange={(e) => handleSelectResident(e.target.value)} className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]">
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>{r.fullName} · {r.unit}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Cuota (B/.)</span>
              <input value={createDue} onChange={(e) => setCreateDue(e.target.value)} inputMode="decimal" placeholder="40.80" className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Pagado (B/.)</span>
              <input value={createPaid} onChange={(e) => setCreatePaid(e.target.value)} inputMode="decimal" placeholder="0.00" className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Estado</span>
              <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value)} className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]">
                <option value="pendiente">Pendiente</option>
                <option value="al_dia">Al día</option>
                <option value="moroso">Moroso</option>
                <option value="pagado">Pagado</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Fecha</span>
              <input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Detalle manual</span>
              <input value={createNotes} onChange={(e) => setCreateNotes(e.target.value)} placeholder="Ej. Abono de febrero, cuota extraordinaria…" className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none placeholder:text-[#a1b0ab] focus:border-[#629588]" />
            </label>
            <div className="md:col-span-3">
              <button disabled={creating} onClick={createMovement} className="flex items-center gap-2 rounded-xl bg-[#21564c] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#183f38] disabled:opacity-60">
                <Check size={15} /> {creating ? "Guardando…" : "Guardar movimiento"}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-[#f8faf8] text-[10px] uppercase tracking-[0.1em] text-[#82958f]">
              <tr>
                <th className="px-6 py-3 font-bold">Propietario / unidad</th>
                <th className="px-4 py-3 font-bold">Cuota</th>
                <th className="px-4 py-3 font-bold">Pagado</th>
                <th className="px-4 py-3 font-bold">Saldo</th>
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 font-bold">Detalle</th>
                <th className="px-6 py-3 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1ee]">
              {visibleAccounts.map((a) => {
                const saldo = Math.max(0, a.dueAmount - a.paidAmount);
                const editing = editingId === a.id;
                return (
                  <>
                    <tr key={a.id} className="text-sm align-top">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#31544d]">{a.residentName}</p>
                        <p className="mt-0.5 text-xs text-[#859892]">{a.unit}</p>
                        <p className="mt-0.5 text-[11px] text-[#9aa9a4]">{formatDate(a.dueDate)}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#46645d]">{formatMoney(a.dueAmount)}</td>
                      <td className="px-4 py-4 font-semibold text-[#46645d]">{formatMoney(a.paidAmount)}</td>
                      <td className="px-4 py-4 font-bold text-[#264c44]">{formatMoney(saldo)}</td>
                      <td className="px-4 py-4"><Pill value={a.status} /></td>
                      <td className="max-w-[220px] px-4 py-4 text-xs leading-5 text-[#70857e]">{a.notes || <span className="text-[#a9b7b2]">—</span>}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button title="Imprimir recibo" onClick={() => setReceipt(a)} className="grid size-8 place-items-center rounded-lg text-[#3d6b60] hover:bg-[#e8f2ed]"><Printer size={17} /></button>
                          {isAdmin && (
                            <>
                              <button title="Editar pago y estado" onClick={() => (editing ? setEditingId(null) : startEdit(a))} className="grid size-8 place-items-center rounded-lg text-[#52716a] hover:bg-[#eff5f1]"><Pencil size={16} /></button>
                              <button title="Eliminar" onClick={() => removeAccount(a.id)} className="grid size-8 place-items-center rounded-lg text-[#c05a40] hover:bg-[#fff0ec]"><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {editing && isAdmin && (
                      <tr key={`${a.id}-edit`} className="bg-[#f7faf8]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid gap-3 md:grid-cols-5">
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Cuota (B/.)</span>
                              <input value={editDue} onChange={(e) => setEditDue(e.target.value)} inputMode="decimal" className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]" />
                            </label>
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Pagado (B/.)</span>
                              <input value={editPaid} onChange={(e) => setEditPaid(e.target.value)} inputMode="decimal" placeholder="Ej. 20.00" className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]" />
                            </label>
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Estado</span>
                              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]">
                                <option value="al_dia">Al día</option>
                                <option value="moroso">Moroso</option>
                                <option value="pagado">Pagado</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="vencido">Vencido</option>
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Fecha</span>
                              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]" />
                            </label>
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Detalle manual</span>
                              <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Ej. Abono parcial…" className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none placeholder:text-[#a1b0ab] focus:border-[#629588]" />
                            </label>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button disabled={busyId === a.id} onClick={() => saveEdit(a.id)} className="flex items-center gap-2 rounded-xl bg-[#21564c] px-4 py-2 text-xs font-bold text-white hover:bg-[#183f38] disabled:opacity-60">
                              <Check size={14} /> {busyId === a.id ? "Guardando…" : "Guardar cambios"}
                            </button>
                            <button onClick={() => setEditingId(null)} className="rounded-xl border border-[#dce7e2] px-4 py-2 text-xs font-bold text-[#58736c] hover:bg-white">Cancelar</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleAccounts.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-bold text-[#254640]">Sin resultados</p>
            <p className="mt-1 text-sm text-[#71847f]">Prueba con otro nombre o unidad, o agrega un movimiento.</p>
          </div>
        )}
      </section>

      {receipt && <ReceiptModal account={receipt} fee={fee} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function ReceiptModal({ account, fee, onClose }: { account: Account; fee: number; onClose: () => void }) {
  const saldo = Math.max(0, account.dueAmount - account.paidAmount);
  const today = new Intl.DateTimeFormat("es-PA", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());
  const receiptNo = `R-${String(account.id).padStart(5, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b2924]/50 p-4 backdrop-blur-[2px]">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] bg-white shadow-2xl">
        <div className="no-print flex items-center justify-between border-b border-[#edf1ee] p-4">
          <p className="text-sm font-bold text-[#284e45]">Vista previa del recibo</p>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-[#204f46] px-4 py-2 text-xs font-bold text-white hover:bg-[#163f38]">
              <Printer size={15} /> Imprimir
            </button>
            <button onClick={onClose} className="grid size-9 place-items-center rounded-xl bg-[#f1f5f2] text-[#5d7770]"><X size={17} /></button>
          </div>
        </div>

        <div className="print-area m-4 rounded-2xl border border-[#dbe7e1] bg-white p-6 text-[#1e3d37] sm:m-5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <PhLogo className="h-14" />
              <div>
                <p className="text-[15px] font-extrabold leading-5">PH PARQUE CENTRAL</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6c8b83]">Arraiján · Administración</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-[#6c8b83]">Recibo</p>
              <p className="text-lg font-extrabold">{receiptNo}</p>
              <p className="mt-1 text-xs text-[#6c8b83]">{today}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#f4f8f6] p-4 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#82958f]">Propietario</p>
              <p className="mt-1 font-bold">{account.residentName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#82958f]">Unidad</p>
              <p className="mt-1 font-bold">{account.unit}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#82958f]">Correo</p>
              <p className="mt-1 text-xs font-semibold">{account.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#82958f]">Fecha del movimiento</p>
              <p className="mt-1 font-bold">{formatDate(account.dueDate)}</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#e4ece8]">
            <div className="grid grid-cols-3 bg-[#f8faf8] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#82958f]">
              <span>Concepto</span><span className="text-right">Cuota</span><span className="text-right">Pagado</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-3 text-sm">
              <span className="font-semibold">Cuota de administración</span>
              <span className="text-right font-bold">{formatMoney(account.dueAmount)}</span>
              <span className="text-right font-bold">{formatMoney(account.paidAmount)}</span>
            </div>
            {account.notes && (
              <div className="border-t border-[#eef2f0] px-4 py-3 text-xs leading-5 text-[#5c7670]">
                <span className="font-bold text-[#3d5a52]">Detalle: </span>{account.notes}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[#e4ece8] bg-[#f4f8f6] px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#5c7670]">Saldo pendiente</span>
              <span className="text-lg font-extrabold">{formatMoney(saldo)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="font-semibold text-[#5c7670]">Estado: <span className="font-bold text-[#21473f]">{accountStatusLabel(account.status)}</span></span>
            <span className="text-xs text-[#82958f]">Cuota mensual: {formatMoney(fee)}</span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 text-center text-xs text-[#5c7670]">
            <div><div className="mx-auto mb-2 h-px w-4/5 bg-[#9db3ac]" /><p className="font-bold">Administración PH</p><p>Firma y sello</p></div>
            <div><div className="mx-auto mb-2 h-px w-4/5 bg-[#9db3ac]" /><p className="font-bold">Propietario</p><p>Recibido conforme</p></div>
          </div>

          <p className="mt-6 text-center text-[10px] leading-4 text-[#93a5a0]">
            Este recibo es un comprobante del movimiento registrado en el portal del PH Parque Central, Arraiján.
          </p>
        </div>
      </div>
    </div>
  );
}

export function UsersCountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4f1] px-2.5 py-1 text-[11px] font-bold text-[#3d6b60]">
      <UsersRound size={13} /> {count}
    </span>
  );
}
