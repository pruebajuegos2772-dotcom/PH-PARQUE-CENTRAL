"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Flower2,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PhLogo } from "@/components/ph-logo";
import { AccountsPanel } from "@/components/accounts-panel";
import { ReportsPanel } from "@/components/reports-panel";

type View = "resumen" | "operacion" | "reportes" | "finanzas" | "cuentas" | "usuarios";
type ModalKind = "task" | "report" | "fund" | "user" | null;

type ManagedUser = {
  id: number;
  fullName: string;
  email: string;
  unit: string;
  role: string;
  phone: string | null;
  accountStatus: string;
  outstandingBalance: number;
  monthlyFee: number;
};
type Role = "Administrador" | "Propietario";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  unit: string;
  role: Role;
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  location: string;
  priority: string;
  status: string;
  scheduledFor: string | null;
  assignedTo: string | null;
  estimatedCost: number;
  actualCost: number;
  invoiceName: string | null;
  invoiceMime: string | null;
  invoiceData: string | null;
};

type ReportComment = {
  id: number;
  reportId: number;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
};

type Report = {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  priority: string;
  status: string;
  reporterName: string;
  createdAt: string;
  updatedAt?: string;
  comments: ReportComment[];
};

type Expense = {
  id: number;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  expenseDate: string;
  status: string;
};

export type Account = {
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

type DashboardData = {
  fund: { currentBalance: number; monthlyFee: number; monthlyBudget: number; updatedAt: string } | null;
  tasks: Task[];
  reports: Report[];
  expenses: Expense[];
  accounts: Account[];
  residents: ManagedUser[];
  summary: {
    totalExpenses: number;
    totalBilled: number;
    totalPaid: number;
    outstanding: number;
    activeTasks: number;
    openReports: number;
    collectionRate: number;
  };
};

const nav: Array<{ id: View; label: string; icon: LucideIcon; adminOnly?: boolean }> = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "operacion", label: "Operación", icon: ClipboardCheck },
  { id: "reportes", label: "Reportes y denuncias", icon: CircleAlert },
  { id: "finanzas", label: "Finanzas", icon: WalletCards },
  { id: "cuentas", label: "Estado de cuenta", icon: ReceiptText },
  { id: "usuarios", label: "Usuarios", icon: UsersRound, adminOnly: true },
];

const taskIcons: Record<string, LucideIcon> = {
  "Limpieza edificio": Sparkles,
  "Áreas verdes": Flower2,
  "Reparación estructural": Building2,
  Iluminación: Lightbulb,
};

const formatMoney = (value: number) =>
  `B/. ${value.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusText = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "PH";

export function accountStatusLabel(value: string) {
  const v = value.toLowerCase();
  if (v === "al_dia") return "Al día";
  if (v === "moroso") return "Moroso";
  if (v === "pagado") return "Pagado";
  if (v === "pendiente") return "Pendiente";
  if (v === "vencido") return "Vencido";
  return statusText(value);
}

function StatusPill({ value, compact = false }: { value: string; compact?: boolean }) {
  const normalized = value.toLowerCase();
  const className = normalized.includes("pagado") || normalized.includes("dia") || normalized.includes("complet") || normalized.includes("resuelt")
    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : normalized.includes("moroso") || normalized.includes("venc") || normalized.includes("alta")
      ? "bg-rose-50 text-rose-700 ring-rose-100"
      : normalized.includes("pend") || normalized.includes("progreso") || normalized.includes("revision") || normalized.includes("asign")
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  const label = value.toLowerCase() === "al_dia" || value.toLowerCase() === "moroso" || ["pagado", "pendiente", "vencido"].includes(value.toLowerCase())
    ? accountStatusLabel(value)
    : statusText(value);
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ring-1 ${compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"} ${className}`}>
      {label}
    </span>
  );
}

function EmptyState({ title, detail, icon: Icon }: { title: string; detail: string; icon: LucideIcon }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-[24px] border border-dashed border-[#cad8d2] bg-[#fbfcfa] px-5 text-center">
      <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-[#eaf2ed] text-[#407064]"><Icon size={21} /></div>
      <p className="font-bold text-[#254640]">{title}</p>
      <p className="mt-1 max-w-xs text-sm leading-6 text-[#71847f]">{detail}</p>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeView, setActiveView] = useState<View>("resumen");
  const [modal, setModal] = useState<ModalKind>(null);
  const [profileMenu, setProfileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const role: Role = user?.role ?? "Propietario";

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setUser(null);
        setData(null);
        setMessage("Tu sesión venció. Inicia sesión nuevamente.");
        return;
      }
      if (!response.ok) throw new Error(result.error || "No se pudo cargar la información");
      setData(result);
    } catch {
      setMessage("No pudimos sincronizar los datos. Intenta actualizar nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async () => {
    setAuthChecking(true);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (response.ok) {
        const result = await response.json();
        if (result.user) {
          setUser(result.user);
          await loadData();
        }
      }
    } catch {
      // Sin sesión: se muestra el login.
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    void checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4600);
    return () => window.clearTimeout(timer);
  }, [message]);

  const today = useMemo(
    () => new Intl.DateTimeFormat("es-PA", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    [],
  );

  const filteredAccounts = useMemo(() => {
    if (!data) return [];
    const lowered = query.toLowerCase().trim();
    if (!lowered) return data.accounts;
    return data.accounts.filter((account) =>
      [account.residentName, account.unit, account.email, account.status].some((item) => item.toLowerCase().includes(lowered)),
    );
  }, [data, query]);

  const openModal = (kind: ModalKind) => {
    setProfileMenu(false);
    setMobileMenu(false);
    setModal(kind);
  };

  const chooseView = (view: View) => {
    setActiveView(view);
    setMobileMenu(false);
    setProfileMenu(false);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No fue posible iniciar sesión.");
      setUser(result.user);
      setLoginPassword("");
      setMessage(`Bienvenido, ${result.user.name.split(" ")[0]}. Sesión iniciada correctamente.`);
      await loadData();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "No fue posible iniciar sesión.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continuar con el cierre local aunque falle la red.
    }
    setUser(null);
    setData(null);
    setProfileMenu(false);
    setMobileMenu(false);
    setActiveView("resumen");
    setMessage("Sesión cerrada correctamente.");
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modal) return;
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const raw = Object.fromEntries(form.entries()) as Record<string, string | File>;
    const paths: Record<Exclude<ModalKind, null>, string> = {
      task: "/api/tasks",
      report: "/api/reports",
      fund: "/api/fund",
      user: "/api/users",
    };
    const toDecimalNumber = (value: string) => Number(value.trim().replace(/\s/g, "").replace(",", "."));
    // Adjunto de factura en tareas: leer el archivo como dataURL (PDF o imagen, máx ~3MB).
    let invoicePayload: { invoiceName?: string; invoiceMime?: string; invoiceData?: string } = {};
    if (modal === "task") {
      const fileInput = formEl.querySelector('input[name="invoiceFile"]') as HTMLInputElement | null;
      const file = fileInput?.files?.[0];
      if (file) {
        if (file.size > 3_200_000) {
          setMessage("La factura es muy pesada (máximo ~3MB). Usa un PDF o foto más liviana.");
          return;
        }
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("No se pudo leer la factura."));
          reader.readAsDataURL(file);
        });
        invoicePayload = { invoiceName: file.name.slice(0, 180), invoiceMime: file.type.slice(0, 80) || "application/octet-stream", invoiceData: dataUrl };
      }
    }
    const stringRaw: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string") stringRaw[k] = v;
    }
    const body =
      modal === "fund"
        ? { ...stringRaw, amount: toDecimalNumber(stringRaw.amount ?? "") }
        : modal === "task"
          ? {
              ...stringRaw,
              cost: stringRaw.cost ? toDecimalNumber(stringRaw.cost) : 0,
              ...invoicePayload,
            }
          : stringRaw;
    setIsSaving(true);
    try {
      const response = await fetch(paths[modal], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setUser(null);
        setData(null);
        throw new Error("Tu sesión venció. Inicia sesión nuevamente.");
      }
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el registro");
      setModal(null);
      setMessage(
        modal === "report"
          ? "Reporte enviado correctamente."
          : modal === "user"
            ? "Acceso creado. Ya puede iniciar sesión con su correo y contraseña."
            : "Registro guardado y sincronizado con el PH.",
      );
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible completar la operación.");
    } finally {
      setIsSaving(false);
    }
  };

  const visibleNav = nav.filter((item) => role === "Administrador" || !item.adminOnly);
  const monthlyFee = data?.fund?.monthlyFee ?? 40.8;
  const pageLabels: Record<View, { eyebrow: string; title: string; detail: string }> = {
    resumen: { eyebrow: "Vista general", title: "Así está tu PH hoy", detail: "Controla la operación, los cobros y el mantenimiento desde un solo lugar." },
    operacion: { eyebrow: "Mantenimiento", title: "Plan de operación", detail: "Consulta las tareas. Solo la administración puede crear nuevas órdenes." },
    reportes: { eyebrow: "Comunidad", title: "Reportes y denuncias", detail: "Crea y da seguimiento a cada incidencia de los residentes." },
    finanzas: { eyebrow: "Administración", title: "Finanzas del PH", detail: "Consulta el fondo común y los gastos. Solo la administración puede registrar movimientos." },
    cuentas: { eyebrow: "Propietarios", title: "Estado de cuenta", detail: "Consulta cuotas, pagos y saldos pendientes de cada unidad." },
    usuarios: { eyebrow: "Administración", title: "Usuarios y accesos", detail: "Crea accesos, edita datos y restablece contraseñas. Solo visible para administradores." },
  };

  if (authChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7f4] px-5">
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-[#e1ebe6] bg-white px-10 py-12 shadow-sm">
          <PhLogo className="h-16" />
          <div className="h-1.5 w-44 overflow-hidden rounded-full bg-[#e5eeea]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#3f7a6c]" />
          </div>
          <p className="text-sm font-semibold text-[#5c7670]">Verificando tu sesión…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        email={loginEmail}
        password={loginPassword}
        error={loginError}
        isLoggingIn={isLoggingIn}
        onEmail={setLoginEmail}
        onPassword={setLoginPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#203f3a]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col bg-[#123c37] px-5 py-6 text-white lg:flex">
        <Brand />
        <div className="mt-9 px-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a6c6bd]">Menú principal</p>
        </div>
        <nav className="mt-3 space-y-1.5">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const selected = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => chooseView(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${selected ? "bg-[#2b625a] text-white shadow-sm" : "text-[#c9ddd7] hover:bg-white/10 hover:text-white"}`}
              >
                <Icon size={19} strokeWidth={selected ? 2.35 : 2} />
                <span>{item.label}</span>
                {item.id === "reportes" && data && data.summary.openReports > 0 && (
                  <span className={`ml-auto grid size-5 place-items-center rounded-full text-[10px] ${selected ? "bg-[#fae9a9] text-[#35534c]" : "bg-[#f4d97e] text-[#305149]"}`}>{data.summary.openReports}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <div className="flex items-center gap-2 text-[#fbdda0]"><Sparkles size={16} /><span className="text-xs font-bold">Consejo de gestión</span></div>
          <p className="mt-2 text-xs leading-5 text-[#c9dbd6]">Publica el reporte mensual antes del día 10 para mantener informada a la comunidad.</p>
          <button onClick={() => chooseView("finanzas")} className="mt-3 text-xs font-bold text-white hover:text-[#fbdda0]">Ver finanzas <ChevronRight className="inline" size={14} /></button>
        </div>
        <button className="mt-5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#b7d0c8] transition hover:bg-white/10 hover:text-white">
          <Settings size={18} /> Configuración
        </button>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[#e4ebe7] bg-[#f8faf8]/95 px-4 backdrop-blur sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMobileMenu(!mobileMenu)} className="grid size-10 place-items-center rounded-xl border border-[#dbe7e1] bg-white text-[#29524a] lg:hidden"><Menu size={19} /></button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold capitalize text-[#274b45]">{today}</p>
              <p className="hidden text-xs text-[#79908a] sm:block">PH Parque Central · Arraiján</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => openModal("report")} className="hidden items-center gap-2 rounded-xl bg-[#d86445] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(216,100,69,0.20)] transition hover:bg-[#c65639] sm:flex"><Plus size={17} /> Nuevo reporte</button>
            <button className="relative grid size-10 place-items-center rounded-xl border border-[#dbe7e1] bg-white text-[#52716a] transition hover:text-[#173d37]"><Bell size={19} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#d86445]" /></button>
            <div className="relative">
              <button onClick={() => setProfileMenu(!profileMenu)} className="flex items-center gap-2 rounded-xl border border-transparent py-1 pl-1 pr-2 transition hover:border-[#dbe7e1] hover:bg-white">
                <div className="grid size-9 place-items-center rounded-xl bg-[#d8ede6] text-sm font-extrabold text-[#236053]">{initialsOf(user.name)}</div>
                <div className="hidden text-left md:block"><p className="text-xs font-bold leading-4 text-[#254c45]">{user.name}</p><p className="text-[11px] text-[#74908a]">{user.role} · {user.unit}</p></div>
                <ChevronDown className="hidden text-[#66817a] md:block" size={15} />
              </button>
              {profileMenu && (
                <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-[#dde8e3] bg-white p-1.5 shadow-[0_18px_45px_rgba(26,64,57,0.16)]">
                  <div className="px-3 py-2.5"><p className="text-xs font-bold text-[#25473f]">{user.name}</p><p className="text-[11px] text-[#81938e]">{user.email}</p></div>
                  {role === "Administrador" && (
                    <>
                      <button onClick={() => { chooseView("usuarios"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#45625b] hover:bg-[#f1f6f3]"><UsersRound size={16} /> Gestionar usuarios</button>
                      <button onClick={() => openModal("user")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#45625b] hover:bg-[#f1f6f3]"><UserRound size={16} /> Crear acceso</button>
                    </>
                  )}
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#45625b] hover:bg-[#f1f6f3]"><Settings size={16} /> Mi perfil</button>
                  <div className="my-1 border-t border-[#edf1ee]" />
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#c95a40] hover:bg-[#fff5f2]"><LogOut size={16} /> Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {mobileMenu && (
          <div className="fixed inset-x-3 top-[82px] z-40 rounded-2xl border border-[#dbe6e1] bg-white p-3 shadow-[0_20px_45px_rgba(24,62,55,0.18)] lg:hidden">
            <div className="mb-2 flex items-center justify-between px-2"><Brand dark /><button onClick={() => setMobileMenu(false)}><X size={18} /></button></div>
            <div className="space-y-1">
              {visibleNav.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => chooseView(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${activeView === item.id ? "bg-[#e8f1ed] text-[#215a4f]" : "text-[#537069]"}`}><Icon size={18} />{item.label}</button>; })}
              <button onClick={() => openModal("report")} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d86445] py-3 text-sm font-bold text-white"><Plus size={17} /> Nuevo reporte</button>
            </div>
          </div>
        )}

        <section className="mx-auto max-w-[1512px] px-4 pb-12 pt-7 sm:px-7 lg:px-10 lg:pt-9">
          <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c8b83]">{pageLabels[activeView].eyebrow}</p>
              <h1 className="mt-1 text-[30px] font-bold tracking-[-0.05em] text-[#163c36] sm:text-[36px]">{pageLabels[activeView].title}</h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[#6f8580]">{pageLabels[activeView].detail}</p>
            </div>
            {activeView === "resumen" && (
              <div className="flex items-center gap-2 rounded-2xl border border-[#dce7e2] bg-white px-3 py-2 shadow-sm">
                <div className="grid size-9 place-items-center rounded-xl bg-[#edf5f0] text-[#397167]"><CalendarDays size={18} /></div>
                <div><p className="text-[11px] font-bold uppercase tracking-wider text-[#82948f]">Período activo</p><p className="text-sm font-bold text-[#31554e]">Febrero 2025</p></div>
                <ChevronDown size={16} className="ml-2 text-[#78918a]" />
              </div>
            )}
          </div>

          {message && <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-[#b8dfcf] bg-[#ecf8f1] px-4 py-3 text-sm font-semibold text-[#276855]"><span className="flex items-center gap-2"><Check size={17} />{message}</span><button onClick={() => setMessage("")}><X size={17} /></button></div>}

          {isLoading && !data ? <DashboardSkeleton /> : (
            <>
              {activeView === "resumen" && data && <SummaryView data={data} role={role} onAdd={(kind) => openModal(kind)} onNavigate={chooseView} />}
              {activeView === "operacion" && data && <OperationView tasks={data.tasks} role={role} onAdd={() => openModal("task")} />}
              {activeView === "reportes" && data && <ReportsPanel reports={data.reports} role={role} onAdd={() => openModal("report")} onChanged={loadData} notify={setMessage} />}
              {activeView === "finanzas" && data && <FinanceView data={data} role={role} onAddTask={() => openModal("task")} onAddFund={() => openModal("fund")} />}
              {activeView === "cuentas" && data && <AccountsPanel accounts={filteredAccounts} allAccounts={data.accounts} residents={data.residents} query={query} onQuery={setQuery} fee={monthlyFee} role={role} currentEmail={user.email} onChanged={loadData} notify={setMessage} />}
              {activeView === "usuarios" && data && role === "Administrador" && (
                <UsersView
                  initialUsers={data.residents}
                  currentEmail={user.email}
                  onAddUser={() => openModal("user")}
                  onChanged={loadData}
                  notify={setMessage}
                />
              )}
            </>
          )}
        </section>
      </div>

      {modal && <Modal kind={modal} onClose={() => setModal(null)} onSubmit={submitForm} isSaving={isSaving} />}
    </main>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-2">
      <PhLogo className="h-11" />
      <div>
        <p className={`text-[15px] font-extrabold leading-5 tracking-[-0.02em] ${dark ? "text-[#19443c]" : "text-white"}`}>PARQUE CENTRAL</p>
        <p className={`text-[9px] font-bold uppercase tracking-[0.24em] ${dark ? "text-[#709087]" : "text-[#a8c8bf]"}`}>PH · Arraiján</p>
      </div>
    </div>
  );
}

function LoginScreen({ email, password, error, isLoggingIn, onEmail, onPassword, onSubmit }: {
  email: string;
  password: string;
  error: string;
  isLoggingIn: boolean;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#123c37] px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[30px] bg-white shadow-2xl md:grid-cols-2">
        <div className="flex flex-col justify-between bg-[#16453e] p-7 text-white sm:p-9">
          <PhLogo className="h-20 self-start" />
          <div className="mt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9fc3b8]">Portal de residentes</p>
            <h1 className="mt-3 text-[30px] font-bold leading-[1.08] tracking-[-0.04em]">Gestión clara para tu PH</h1>
            <p className="mt-3 text-sm leading-6 text-[#c3d9d2]">Mantenimiento, reportes, fondo común y estados de cuenta en un solo lugar.</p>
          </div>
          <div className="mt-8 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-[#cfe0da]">
            <p className="font-bold text-white">Acceso por rol</p>
            <p className="mt-2 leading-5 text-[#c3d9d2]">La administración crea tu correo y contraseña. Los residentes pueden consultar todo el portal y crear reportes de daños.</p>
            <p className="mt-2 leading-5 text-[#c3d9d2]">Si no puedes entrar, contacta a la administración del PH para verificar tu acceso.</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col justify-center p-7 sm:p-9">
          <div className="grid size-11 place-items-center rounded-2xl bg-[#e8f1ed] text-[#3a796b]"><ShieldCheck size={22} /></div>
          <h2 className="mt-4 text-[26px] font-bold tracking-[-0.04em] text-[#21473f]">Iniciar sesión</h2>
          <p className="mt-1.5 text-sm leading-5 text-[#748a83]">Usa el correo y la contraseña asignados por la administración.</p>
          <label className="mt-6 block">
            <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Correo electrónico</span>
            <input value={email} onChange={(event) => onEmail(event.target.value)} required type="email" placeholder="tucorreo@email.com" className="h-11 w-full rounded-xl border border-[#d9e5df] bg-[#fbfcfb] px-3.5 text-sm font-medium text-[#2d5149] outline-none placeholder:text-[#a1b0ab] focus:border-[#629588]" />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-bold text-[#45655e]">Contraseña</span>
            <input value={password} onChange={(event) => onPassword(event.target.value)} required type="password" placeholder="••••••••" className="h-11 w-full rounded-xl border border-[#d9e5df] bg-[#fbfcfb] px-3.5 text-sm font-medium text-[#2d5149] outline-none placeholder:text-[#a1b0ab] focus:border-[#629588]" />
          </label>
          {error && <p className="mt-4 rounded-xl border border-[#f2c9bd] bg-[#fff3ef] px-3.5 py-3 text-xs font-bold leading-5 text-[#b1543a]">{error}</p>}
          <button disabled={isLoggingIn} type="submit" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#21564c] py-3.5 text-sm font-bold text-white transition hover:bg-[#183f38] disabled:cursor-wait disabled:opacity-60">
            {isLoggingIn ? "Verificando…" : <><Check size={17} /> Entrar al portal</>}
          </button>
          <p className="mt-5 text-center text-[11px] leading-5 text-[#94a39f]"><ShieldCheck className="mr-1 inline" size={12} /> Tu sesión queda protegida en este dispositivo por 7 días.</p>
          <p className="mt-2 text-center text-[10px] font-bold tracking-widest text-[#b6c4bf]">PH PARQUE CENTRAL · V2 LOGIN</p>
        </form>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return <div className="animate-pulse space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 rounded-3xl bg-[#e6eeea]" />)}</div><div className="grid gap-5 xl:grid-cols-5"><div className="h-80 rounded-3xl bg-[#e6eeea] xl:col-span-3" /><div className="h-80 rounded-3xl bg-[#e6eeea] xl:col-span-2" /></div></div>;
}

function SummaryView({ data, role, onAdd, onNavigate }: { data: DashboardData; role: Role; onAdd: (kind: ModalKind) => void; onNavigate: (view: View) => void }) {
  const unpaid = data.accounts.filter((account) => account.status !== "pagado").length;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Fondo disponible" value={formatMoney(data.fund?.currentBalance ?? 0)} detail="Actualizado hoy" trend="2.8%" icon={WalletCards} tone="gold" />
        <MetricCard label="Cobranza del mes" value={`${data.summary.collectionRate}%`} detail={`${formatMoney(data.summary.totalPaid)} recaudado`} trend="6.4%" icon={BadgeDollarSign} tone="green" />
        <MetricCard label="Operaciones activas" value={String(data.summary.activeTasks)} detail="Tareas en curso y programadas" icon={Wrench} tone="blue" />
        <MetricCard label="Casos por atender" value={String(data.summary.openReports)} detail={`${unpaid} cuentas con saldo pendiente`} icon={CircleAlert} tone="coral" />
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <section className="rounded-[26px] border border-[#e1ebe6] bg-white p-5 shadow-[0_8px_30px_rgba(23,63,53,0.035)] sm:p-6 xl:col-span-3">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-[#2d514a]">Movimiento del fondo</p><p className="mt-1 text-xs text-[#7d928c]">Ingresos vs. gastos · Últimos 6 meses</p></div><button className="flex items-center gap-1 text-xs font-bold text-[#477b70]">Mensual <ChevronDown size={14} /></button></div>
          <div className="mt-5 flex items-end justify-between gap-2 border-b border-[#edf1ee] pb-2 pt-5 sm:gap-4">
            {[{ m: "Sep", h: 36, e: 18 }, { m: "Oct", h: 48, e: 22 }, { m: "Nov", h: 43, e: 31 }, { m: "Dic", h: 62, e: 38 }, { m: "Ene", h: 58, e: 29 }, { m: "Feb", h: 75, e: 42 }].map((bar) => <div key={bar.m} className="flex flex-1 flex-col items-center gap-2"><div className="flex h-36 items-end gap-1"><div className="w-2.5 rounded-t-md bg-[#4e8e7f] sm:w-4" style={{ height: `${bar.h * 1.55}px` }} /><div className="w-2.5 rounded-t-md bg-[#dfe9e4] sm:w-4" style={{ height: `${bar.e * 1.55}px` }} /></div><span className={`text-[11px] font-bold ${bar.m === "Feb" ? "text-[#316b5e]" : "text-[#84958f]"}`}>{bar.m}</span></div>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#718780]"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#4e8e7f]" />Ingresos</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#dfe9e4]" />Gastos</span><span className="ml-auto text-[#4e8578]">Balance saludable <ArrowUpRight className="inline" size={13} /></span></div>
        </section>
        <section className="rounded-[26px] bg-[#194c43] p-5 text-white shadow-[0_12px_30px_rgba(24,73,65,0.17)] sm:p-6 xl:col-span-2">
          <div className="flex items-center justify-between"><div className="grid size-10 place-items-center rounded-xl bg-white/10 text-[#f6d978]"><WalletCards size={20} /></div><button onClick={() => onNavigate("finanzas")} className="text-xs font-bold text-[#b8d5cd] hover:text-white">Detalle <ChevronRight className="inline" size={14} /></button></div>
          <p className="mt-6 text-sm font-semibold text-[#bed7d0]">Fondo común PH</p>
          <p className="mt-1 text-[32px] font-bold tracking-[-0.05em]">{formatMoney(data.fund?.currentBalance ?? 0)}</p>
          <div className="mt-6 rounded-xl bg-white/[0.09] p-3.5"><div className="flex items-center justify-between text-xs text-[#b9d3cd]"><span>Presupuesto usado</span><span className="font-bold text-white">{Math.min(100, Math.round((data.summary.totalExpenses / (data.fund?.monthlyBudget || 1)) * 100))}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#f5d87a]" style={{ width: `${Math.min(100, Math.round((data.summary.totalExpenses / (data.fund?.monthlyBudget || 1)) * 100))}%` }} /></div><p className="mt-2 text-[11px] text-[#b9d3cd]">{formatMoney(data.summary.totalExpenses)} de {formatMoney(data.fund?.monthlyBudget ?? 0)}</p></div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <section className="rounded-[26px] border border-[#e1ebe6] bg-white p-5 shadow-[0_8px_30px_rgba(23,63,53,0.035)] sm:p-6 xl:col-span-3">
          <div className="flex items-center justify-between"><div><h3 className="text-base font-bold text-[#2b4d46]">Próximas tareas</h3><p className="mt-1 text-xs text-[#81948f]">La operación de los siguientes días</p></div><button onClick={() => onNavigate("operacion")} className="rounded-xl border border-[#dce7e2] px-3 py-2 text-xs font-bold text-[#47766c] transition hover:bg-[#f2f7f4]">Ver agenda</button></div>
          <div className="mt-5 divide-y divide-[#edf1ee]">
            {data.tasks.slice(0, 3).map((task) => { const Icon = taskIcons[task.category] || Wrench; return <div key={task.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eff6f2] text-[#4b8275]"><Icon size={18} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#2a5048]">{task.title}</p><p className="mt-0.5 truncate text-xs text-[#82958f]">{task.location} · {task.scheduledFor || "Por programar"}</p></div><StatusPill value={task.status} compact /></div>; })}
          </div>
        </section>
        <section className="rounded-[26px] border border-[#e1ebe6] bg-white p-5 shadow-[0_8px_30px_rgba(23,63,53,0.035)] sm:p-6 xl:col-span-2">
          <div className="flex items-center justify-between"><div><h3 className="text-base font-bold text-[#2b4d46]">Acciones rápidas</h3><p className="mt-1 text-xs text-[#81948f]">Gestiona tu PH en segundos</p></div><Zap size={19} className="text-[#e5b840]" /></div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <QuickAction label="Reportar daño" icon={CircleAlert} onClick={() => onAdd("report")} coral />
            {role === "Administrador" ? (
              <>
                <QuickAction label="Nueva tarea" icon={Plus} onClick={() => onAdd("task")} />
                <QuickAction label="Usuarios" icon={UsersRound} onClick={() => onNavigate("usuarios")} />
              </>
            ) : (
              <>
                <QuickAction label="Ver cuentas" icon={UsersRound} onClick={() => onNavigate("cuentas")} />
                <QuickAction label="Ver finanzas" icon={WalletCards} onClick={() => onNavigate("finanzas")} />
                <QuickAction label="Ver operación" icon={ClipboardCheck} onClick={() => onNavigate("operacion")} />
              </>
            )}
          </div>
          {role !== "Administrador" && (
            <p className="mt-4 rounded-xl bg-[#f0f6f2] p-3 text-[11px] leading-4 text-[#5e7b73]">
              Como residente puedes consultar todo el portal y crear reportes de daños. La creación de tareas y usuarios es solo para administración.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail, trend, icon: Icon, tone }: { label: string; value: string; detail: string; trend?: string; icon: LucideIcon; tone: "gold" | "green" | "blue" | "coral" }) {
  const palette = { gold: "bg-[#f8efd0] text-[#9b7821]", green: "bg-[#e3f2eb] text-[#327863]", blue: "bg-[#e4eff6] text-[#3c7592]", coral: "bg-[#fbe9e3] text-[#c9674c]" }[tone];
  return <article className="rounded-[23px] border border-[#e1ebe6] bg-white p-4 shadow-[0_8px_30px_rgba(23,63,53,0.035)] sm:p-5"><div className="flex items-start justify-between"><div className={`grid size-10 place-items-center rounded-xl ${palette}`}><Icon size={20} /></div>{trend && <span className="flex items-center gap-0.5 rounded-full bg-[#ecf7f1] px-2 py-1 text-[10px] font-bold text-[#397a64]"><ArrowUpRight size={11} /> {trend}</span>}</div><p className="mt-5 text-[25px] font-bold leading-none tracking-[-0.045em] text-[#1c453d]">{value}</p><p className="mt-2 text-xs font-bold text-[#58726b]">{label}</p><p className="mt-1 text-[11px] text-[#91a19d]">{detail}</p></article>;
}

function QuickAction({ label, icon: Icon, onClick, coral = false }: { label: string; icon: LucideIcon; onClick: () => void; coral?: boolean }) {
  return <button onClick={onClick} className={`flex min-h-20 flex-col items-start justify-between rounded-2xl border p-3.5 text-left transition hover:-translate-y-0.5 ${coral ? "border-[#f2d6ce] bg-[#fff8f5] text-[#bd624a] hover:bg-[#ffefea]" : "border-[#e0eae5] bg-[#f9fbfa] text-[#416d62] hover:bg-[#edf5f1]"}`}><Icon size={18} /><span className="text-xs font-bold leading-4">{label}</span></button>;
}

function OperationView({ tasks, role, onAdd }: { tasks: Task[]; role: Role; onAdd: () => void }) {
  const isAdmin = role === "Administrador";
  const groups = ["Todas", "Limpieza edificio", "Áreas verdes", "Iluminación", "Reparación estructural"];
  const [filter, setFilter] = useState("Todas");
  const list = filter === "Todas" ? tasks : tasks.filter((task) => task.category === filter);
  return <div className="space-y-5"><div className="flex flex-col gap-3 rounded-[22px] border border-[#e0eae5] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">{groups.map((group) => <button key={group} onClick={() => setFilter(group)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${filter === group ? "bg-[#204f46] text-white" : "text-[#678079] hover:bg-[#eef4f0]"}`}>{group}</button>)}</div>{isAdmin ? <button onClick={onAdd} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#204f46] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#163f38]"><Plus size={17} /> Crear tarea</button> : <p className="shrink-0 rounded-xl bg-[#f0f6f2] px-4 py-2.5 text-xs font-bold text-[#5e7b73]">Solo lectura · la creación es de administración</p>}</div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((task) => { const Icon = taskIcons[task.category] || Wrench; return <article key={task.id} className="relative overflow-hidden rounded-[24px] border border-[#e1ebe6] bg-white p-5 shadow-[0_8px_30px_rgba(23,63,53,0.035)]"><div className="absolute right-0 top-0 h-1.5 w-24 bg-[#78a99b]" /><div className="flex items-start justify-between gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-[#edf5f1] text-[#407b6d]"><Icon size={21} /></div><StatusPill value={task.status} compact /></div><p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#78938a]">{task.category}</p><h3 className="mt-1.5 text-base font-bold text-[#244940]">{task.title}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-[#718780]">{task.description || "Tarea de mantenimiento para las áreas comunes."}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded-full bg-[#eef4f1] px-2.5 py-1 text-[#2e6b5d]">Costo: B/. {(Number(task.actualCost ?? task.estimatedCost ?? 0)).toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>{task.invoiceData ? <a href={task.invoiceData} download={task.invoiceName || "factura"} target="_blank" rel="noreferrer" className="rounded-full bg-[#204f46] px-2.5 py-1 text-white">Ver factura</a> : <span className="rounded-full bg-[#f1f5f3] px-2.5 py-1 text-[#8ba09a]">Sin factura</span>}</div><div className="mt-5 flex items-center justify-between border-t border-[#edf1ee] pt-4 text-xs font-semibold text-[#6a817b]"><span className="flex items-center gap-1.5"><CalendarDays size={14} /> {task.scheduledFor || "Por definir"}</span><span>{task.location}</span></div></article>})}</div>{list.length === 0 && <EmptyState title="Sin tareas en esta categoría" detail="Crea una orden para planificar el siguiente mantenimiento." icon={ClipboardCheck} />}</div>;
}

function FinanceView({ data, role, onAddTask, onAddFund }: { data: DashboardData; role: Role; onAddTask: () => void; onAddFund: () => void }) {
  const isAdmin = role === "Administrador";
  const maxExpense = Math.max(...data.expenses.map((expense) => expense.amount), 1);
  const byCategory = data.expenses.reduce<Record<string, number>>((total, expense) => ({ ...total, [expense.category]: (total[expense.category] || 0) + expense.amount }), {});
  return <div className="space-y-5"><section className="overflow-hidden rounded-[28px] bg-[#194c43] text-white shadow-[0_14px_34px_rgba(24,73,65,0.18)]"><div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b8d6ce]">Saldo del fondo común</p><p className="mt-3 text-[38px] font-bold tracking-[-0.055em] sm:text-[46px]">{formatMoney(data.fund?.currentBalance ?? 0)}</p><p className="mt-2 max-w-sm text-sm leading-6 text-[#bdd4ce]">Se actualiza solo: los pagos de cuota lo aumentan y los costos de las tareas lo disminuyen. Usa Ajustar fondo solo para el saldo inicial o correcciones.</p>{isAdmin ? <div className="mt-6 flex flex-wrap gap-3"><button onClick={onAddFund} className="flex items-center gap-2 rounded-xl bg-[#f4dc89] px-4 py-2.5 text-sm font-bold text-[#244a42] transition hover:bg-[#ffe99b]"><Plus size={17} /> Ajustar fondo</button><button onClick={onAddTask} className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"><Plus size={17} /> Nueva tarea con costo</button></div> : <p className="mt-6 rounded-xl bg-white/10 p-3 text-xs leading-5 text-[#cfe0da]">Vista de consulta. Solo la administración puede crear tareas con costo o ajustar el fondo.</p>}</div><div className="grid grid-cols-2 gap-3 self-end"><div className="rounded-2xl bg-white/[0.09] p-4"><ArrowDownRight className="text-[#f0d873]" size={19} /><p className="mt-5 text-xl font-bold">{formatMoney(data.summary.totalPaid)}</p><p className="mt-1 text-xs text-[#bed6cf]">Cobrado este mes</p></div><div className="rounded-2xl bg-white/[0.09] p-4"><ArrowUpRight className="text-[#e9a486]" size={19} /><p className="mt-5 text-xl font-bold">{formatMoney(data.summary.totalExpenses)}</p><p className="mt-1 text-xs text-[#bed6cf]">Gastos registrados</p></div></div></div></section><div className="grid gap-5 xl:grid-cols-5"><section className="rounded-[26px] border border-[#e1ebe6] bg-white p-5 shadow-[0_8px_30px_rgba(23,63,53,0.035)] sm:p-6 xl:col-span-3"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#294e46]">Gastos del mes</h2><p className="mt-1 text-sm text-[#7b9089]">Costos generados desde las tareas de operación. Se restan solos del fondo.</p></div>{isAdmin && <button onClick={onAddTask} className="text-xs font-bold text-[#42796c]">Nueva tarea <Plus className="inline" size={14} /></button>}</div><div className="mt-5 space-y-4">{data.expenses.map((expense) => <div key={expense.id}><div className="mb-1.5 flex items-center justify-between gap-4 text-xs"><span className="font-bold text-[#43665e]">{expense.description}</span><span className="font-bold text-[#264c44]">{formatMoney(expense.amount)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf2ef]"><div className="h-full rounded-full bg-[#7eae9f]" style={{ width: `${(expense.amount / maxExpense) * 100}%` }} /></div><p className="mt-1.5 text-[11px] text-[#8b9b96]">{expense.vendor} · {expense.category}</p></div>)}</div></section><section className="rounded-[26px] border border-[#e1ebe6] bg-white p-5 shadow-[0_8px_30px_rgba(23,63,53,0.035)] sm:p-6 xl:col-span-2"><h2 className="text-lg font-bold text-[#294e46]">Distribución</h2><p className="mt-1 text-sm text-[#7b9089]">Por categoría de gasto</p><div className="mt-6 space-y-4">{Object.entries(byCategory).map(([category, total], index) => { const colors = ["bg-[#4c8d7d]", "bg-[#e2b654]", "bg-[#df7e61]", "bg-[#789bbd]", "bg-[#9d8bb5]"]; return <div key={category} className="flex items-center gap-3"><span className={`size-2.5 rounded-full ${colors[index % colors.length]}`} /><span className="flex-1 text-sm font-semibold text-[#58726b]">{category}</span><span className="text-sm font-bold text-[#2b5048]">{formatMoney(total)}</span></div>; })}</div><div className="mt-6 rounded-2xl bg-[#eff6f2] p-4"><p className="text-xs font-bold text-[#53756d]">Presupuesto mensual</p><div className="mt-2 flex items-end justify-between"><p className="text-xl font-bold tracking-[-0.04em] text-[#245247]">{formatMoney(data.fund?.monthlyBudget ?? 0)}</p><p className="text-xs font-bold text-[#528271]">Disponible {formatMoney(Math.max(0, (data.fund?.monthlyBudget ?? 0) - data.summary.totalExpenses))}</p></div></div></section></div></div>;
}

function UsersView({ initialUsers, currentEmail, onAddUser, onChanged, notify }: { initialUsers: ManagedUser[]; currentEmail: string; onAddUser: () => void; onChanged: () => Promise<void>; notify: (message: string) => void }) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("propietario");
  const [editFee, setEditFee] = useState("40.80");
  const [newPassword, setNewPassword] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudieron cargar los usuarios.");
      setUsers(result.users ?? []);
      await onChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudieron cargar los usuarios.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filtered = users.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return [item.fullName, item.email, item.unit, item.role].some((v) => (v ?? "").toLowerCase().includes(q));
  });

  const admins = users.filter((item) => item.role === "administrador").length;
  const owners = users.length - admins;

  const startEdit = (item: ManagedUser) => {
    setEditingId(item.id);
    setEditName(item.fullName);
    setEditUnit(item.unit);
    setEditPhone(item.phone ?? "");
    setEditRole(item.role === "administrador" ? "administrador" : "propietario");
    setEditFee(String(Number(item.monthlyFee ?? 40.8).toFixed(2)));
    setNewPassword("");
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim() || !editUnit.trim()) {
      notify("Nombre y unidad son obligatorios.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      notify("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    const feeNum = Number(editFee.trim().replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(feeNum) || feeNum < 0) {
      notify("Cuota mensual inválida. Usa un número como 40.80.");
      return;
    }
    setBusyId(id);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          fullName: editName.trim(),
          unit: editUnit.trim(),
          phone: editPhone.trim(),
          role: editRole,
          monthlyFee: Math.round(feeNum * 100) / 100,
          ...(newPassword ? { password: newPassword } : {}),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo actualizar el usuario.");
      setEditingId(null);
      setNewPassword("");
      notify(newPassword ? "Usuario actualizado y contraseña restablecida." : "Usuario actualizado correctamente.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo actualizar el usuario.");
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar el acceso de ${name}? Esta acción no se puede deshacer.`)) return;
    setBusyId(id);
    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo eliminar el usuario.");
      notify("Acceso eliminado correctamente.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo eliminar el usuario.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Usuarios totales" value={String(users.length)} detail={`${admins} admin · ${owners} residentes`} icon={UsersRound} tone="green" />
        <MetricCard label="Administradores" value={String(admins)} detail="Acceso total al portal" icon={ShieldCheck} tone="gold" />
        <MetricCard label="Residentes" value={String(owners)} detail="Consulta + reportes de daños" icon={UserRound} tone="blue" />
      </div>
      <section className="overflow-hidden rounded-[26px] border border-[#e1ebe6] bg-white shadow-[0_8px_30px_rgba(23,63,53,0.035)]">
        <div className="flex flex-col gap-3 border-b border-[#ebf0ed] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-[#284e45]">Gestión de accesos</h2>
            <p className="mt-1 text-sm text-[#7a8e88]">Edita datos, cambia el rol y restablece contraseñas.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex h-10 items-center gap-2 rounded-xl border border-[#dce7e2] px-3 text-[#7c928b]">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuario" className="w-40 bg-transparent text-sm text-[#31544d] outline-none placeholder:text-[#9aaba6]" />
            </label>
            <button onClick={refresh} disabled={isRefreshing} className="rounded-xl border border-[#dce7e2] px-4 py-2.5 text-xs font-bold text-[#47766c] transition hover:bg-[#f2f7f4] disabled:opacity-60">{isRefreshing ? "Actualizando…" : "Actualizar"}</button>
            <button onClick={onAddUser} className="flex items-center justify-center gap-2 rounded-xl bg-[#204f46] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#163f38]"><Plus size={15} /> Crear acceso</button>
          </div>
        </div>
        <div className="divide-y divide-[#edf1ee]">
          {filtered.map((item) => {
            const isSelf = item.email.toLowerCase() === currentEmail.toLowerCase();
            const isEditing = editingId === item.id;
            return (
              <div key={item.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#31544d]">{item.fullName} {isSelf && <span className="ml-2 rounded-full bg-[#e8f1ed] px-2 py-0.5 text-[10px] font-bold text-[#3d7466]">TÚ</span>}</p>
                    <p className="mt-0.5 truncate text-xs text-[#859892]">{item.email} · {item.unit}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill value={item.role === "administrador" ? "administrador" : "propietario"} compact />
                    {isEditing ? (
                      <>
                        <button disabled={busyId === item.id} onClick={() => saveEdit(item.id)} className="rounded-xl bg-[#21564c] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#183f38] disabled:opacity-60">{busyId === item.id ? "Guardando…" : "Guardar"}</button>
                        <button onClick={() => { setEditingId(null); setNewPassword(""); }} className="rounded-xl border border-[#dce7e2] px-3.5 py-2 text-xs font-bold text-[#58736c] hover:bg-[#f6f9f7]">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="rounded-xl border border-[#dce7e2] px-3.5 py-2 text-xs font-bold text-[#47766c] hover:bg-[#f2f7f4]">Editar / contraseña</button>
                        {!isSelf && (
                          <button disabled={busyId === item.id} onClick={() => removeUser(item.id, item.fullName)} className="rounded-xl border border-[#f2c9bd] px-3.5 py-2 text-xs font-bold text-[#b1543a] hover:bg-[#fff3ef] disabled:opacity-60">Eliminar</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-4 grid gap-3 rounded-2xl bg-[#f7faf8] p-4 sm:grid-cols-2">
                    <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">Nombre</span><input value={editName} onChange={(event) => setEditName(event.target.value)} className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">Unidad</span><input value={editUnit} onChange={(event) => setEditUnit(event.target.value)} className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">Teléfono</span><input value={editPhone} onChange={(event) => setEditPhone(event.target.value)} className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">Rol</span><select value={editRole} onChange={(event) => setEditRole(event.target.value)} className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]"><option value="propietario">Propietario · consulta + reportes</option><option value="administrador">Administrador · acceso total</option></select></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">Cuota mensual (B/.)</span><input value={editFee} onChange={(event) => setEditFee(event.target.value)} inputMode="decimal" placeholder="40.80" className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none focus:border-[#629588]" /></label>
                    <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">Nueva contraseña (opcional)</span><input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="text" placeholder="Déjalo vacío para no cambiarla · mínimo 6 caracteres" className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none placeholder:text-[#a1b0ab] focus:border-[#629588]" /></label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && <div className="p-6"><EmptyState title="Sin resultados" detail="Prueba con otro nombre, correo o unidad." icon={Search} /></div>}
      </section>
    </div>
  );
}

function Modal({ kind, onClose, onSubmit, isSaving }: { kind: ModalKind; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; isSaving: boolean }) {
  const content = {
    task: { title: "Nueva tarea", description: "Programa una orden con su costo y factura. El costo se registra como gasto y se resta solo del fondo.", button: "Crear tarea" },
    report: { title: "Nuevo reporte", description: "Describe la situación; la administración recibirá la alerta al instante.", button: "Enviar reporte" },
    fund: { title: "Ajustar fondo", description: "Solo para saldo inicial o correcciones. Los pagos y costos de tareas ya mueven el fondo solos.", button: "Actualizar fondo" },
    user: { title: "Crear acceso", description: "Crea el usuario y contraseña con el que el propietario o administrador entrará al portal.", button: "Crear acceso" },
  }[kind as Exclude<ModalKind, null>];
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b2924]/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"><div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#66877e]">PH Parque Central</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#21473f]">{content.title}</h2><p className="mt-2 text-sm leading-5 text-[#748a83]">{content.description}</p></div><button onClick={onClose} className="grid size-9 place-items-center rounded-xl bg-[#f1f5f2] text-[#5d7770] hover:bg-[#e6eeea]"><X size={18} /></button></div><form onSubmit={onSubmit} className="mt-6 space-y-4">{kind === "task" && <TaskForm />}{kind === "report" && <ReportForm />}{kind === "fund" && <FundForm />}{kind === "user" && <UserForm />}<div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#dce7e2] py-3 text-sm font-bold text-[#58736c] hover:bg-[#f6f9f7]">Cancelar</button><button disabled={isSaving} type="submit" className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-[#21564c] py-3 text-sm font-bold text-white transition hover:bg-[#183f38] disabled:cursor-wait disabled:opacity-60">{isSaving ? "Guardando..." : <><Check size={17} />{content.button}</>}</button></div></form></div></div>;
}

function Field({ label, name, placeholder, required = true, type = "text", defaultValue, step, min, inputMode }: { label: string; name: string; placeholder?: string; required?: boolean; type?: string; defaultValue?: string; step?: string; min?: string; inputMode?: "decimal" | "numeric" | "text" }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">{label}</span><input name={name} required={required} type={type} defaultValue={defaultValue} placeholder={placeholder} step={step} min={min} inputMode={inputMode} lang="es-PA" className="h-11 w-full rounded-xl border border-[#d9e5df] bg-[#fbfcfb] px-3.5 text-sm font-medium text-[#2d5149] outline-none placeholder:text-[#a1b0ab] focus:border-[#629588]" /></label>;
}

function SelectField({ label, name, children, defaultValue }: { label: string; name: string; children: React.ReactNode; defaultValue?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">{label}</span><select name={name} defaultValue={defaultValue} className="h-11 w-full rounded-xl border border-[#d9e5df] bg-[#fbfcfb] px-3.5 text-sm font-medium text-[#2d5149] outline-none focus:border-[#629588]">{children}</select></label>;
}

function TaskForm() { return <><Field label="Nombre de la tarea" name="title" placeholder="Ej. Cambio de luminarias" /><div className="grid grid-cols-2 gap-3"><SelectField label="Categoría" name="category"><option>Limpieza edificio</option><option>Áreas verdes</option><option>Iluminación</option><option>Reparación estructural</option></SelectField><SelectField label="Prioridad" name="priority"><option value="media">Media</option><option value="alta">Alta</option><option value="baja">Baja</option></SelectField></div><Field label="Ubicación" name="location" placeholder="Ej. Torre B · Piso 3" /><div className="grid grid-cols-2 gap-3"><Field label="Costo de la tarea (B/.)" name="cost" type="text" placeholder="Ej. 150.00" inputMode="decimal" required={false} /><Field label="Fecha programada" name="scheduledFor" type="date" required={false} /></div><label className="block"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">Factura del gasto (PDF o foto, máx 3MB)</span><input name="invoiceFile" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="w-full rounded-xl border border-[#d9e5df] bg-[#fbfcfb] p-2.5 text-sm font-medium text-[#2d5149] outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f1ed] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#2e6b5d]" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">Notas (opcional)</span><textarea name="description" rows={3} placeholder="Indica lo que debe realizar el proveedor..." className="w-full resize-none rounded-xl border border-[#d9e5df] bg-[#fbfcfb] p-3.5 text-sm font-medium text-[#2d5149] outline-none placeholder:text-[#a1b0ab] focus:border-[#629588]" /></label></>; }
function ReportForm() { return <><Field label="Título del reporte" name="title" placeholder="Ej. Fuga en pasillo" /><div className="grid grid-cols-2 gap-3"><SelectField label="Tipo" name="category"><option>Daño</option><option>Convivencia</option><option>Seguridad</option><option>Sugerencia</option></SelectField><SelectField label="Prioridad" name="priority"><option value="media">Media</option><option value="alta">Alta</option><option value="baja">Baja</option></SelectField></div><Field label="Ubicación" name="location" placeholder="Ej. Torre C · Nivel 2" /><label className="block"><span className="mb-1.5 block text-xs font-bold text-[#45655e]">¿Qué ocurrió?</span><textarea name="description" required rows={4} placeholder="Describe el problema con el mayor detalle posible..." className="w-full resize-none rounded-xl border border-[#d9e5df] bg-[#fbfcfb] p-3.5 text-sm font-medium text-[#2d5149] outline-none placeholder:text-[#a1b0ab] focus:border-[#629588]" /></label></>; }
function FundForm() { return <><Field label="Monto del movimiento (B/.)" name="amount" type="text" placeholder="Ej. 25.50 o -10.25" inputMode="decimal" /><div className="rounded-xl bg-[#f0f6f2] p-3 text-xs leading-5 text-[#5e7b73]"><strong>Nota:</strong> usa un valor positivo para sumar al fondo y un valor negativo para descontar un ajuste. Acepta decimales con punto o coma, por ejemplo 25.50.</div></>; }
function UserForm() { return <><Field label="Nombre completo" name="fullName" placeholder="Ej. María González" /><div className="grid grid-cols-2 gap-3"><Field label="Unidad" name="unit" placeholder="Ej. Torre A · 5C" /><SelectField label="Rol" name="role"><option value="propietario">Propietario</option><option value="administrador">Administrador</option></SelectField></div><Field label="Correo electrónico" name="email" type="email" placeholder="usuario@email.com" /><div className="grid grid-cols-2 gap-3"><Field label="Cuota mensual (B/.)" name="monthlyFee" type="text" placeholder="40.80" inputMode="decimal" defaultValue="40.80" /><Field label="Teléfono (opcional)" name="phone" required={false} placeholder="+507 6000-0000" /></div><Field label="Contraseña temporal" name="password" type="text" placeholder="Mínimo 6 caracteres" /><div className="rounded-xl bg-[#f0f6f2] p-3 text-xs leading-5 text-[#5e7b73]">La cuota mensual se genera sola cada mes para este propietario. Puedes dejar 40.80 o poner una cuota diferente.</div></>; }
