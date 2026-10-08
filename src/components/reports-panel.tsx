"use client";

import { useMemo, useState } from "react";
import { Check, CircleAlert, MessageCircle, Plus, Send, ShieldCheck } from "lucide-react";

export type ReportComment = {
  id: number;
  reportId: number;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
};

export type PanelReport = {
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

type Role = "Administrador" | "Propietario";

export const REPORT_STATUS_OPTIONS = [
  { value: "recibido", label: "Recibido" },
  { value: "visto", label: "Visto" },
  { value: "en_proceso", label: "En proceso" },
  { value: "atendido", label: "Atendido" },
] as const;

export function reportStatusLabel(value: string) {
  const v = value.toLowerCase();
  if (v === "visto") return "Visto";
  if (v === "en_proceso") return "En proceso";
  if (v === "atendido") return "Atendido";
  return "Recibido";
}

function ReportPill({ value }: { value: string }) {
  const v = value.toLowerCase();
  const cls =
    v === "atendido"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : v === "en_proceso"
        ? "bg-sky-50 text-sky-700 ring-sky-100"
        : v === "visto"
          ? "bg-amber-50 text-amber-700 ring-amber-100"
          : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${cls}`}>
      {reportStatusLabel(value)}
    </span>
  );
}

const formatDateTime = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

export function ReportsPanel({
  reports,
  role,
  onAdd,
  onChanged,
  notify,
}: {
  reports: PanelReport[];
  role: Role;
  onAdd: () => void;
  onChanged: () => Promise<void>;
  notify: (msg: string) => void;
}) {
  const isAdmin = role === "Administrador";
  const [filter, setFilter] = useState("Todos");
  const [expanded, setExpanded] = useState<number | null>(reports[0]?.id ?? null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);

  const filters = ["Todos", ...REPORT_STATUS_OPTIONS.map((o) => o.label)];
  const filtered = useMemo(() => {
    if (filter === "Todos") return reports;
    return reports.filter((r) => reportStatusLabel(r.status) === filter);
  }, [reports, filter]);

  const nuevos = reports.filter((r) => r.status === "recibido").length;
  const seguimiento = reports.filter((r) => ["visto", "en_proceso"].includes(r.status)).length;
  const atendidos = reports.filter((r) => r.status === "atendido").length;

  const changeStatus = async (id: number, status: string) => {
    setStatusBusyId(id);
    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "No se pudo actualizar el estado.");
      notify(`Reporte marcado como "${reportStatusLabel(status)}".`);
      await onChanged();
    } catch (e) {
      notify(e instanceof Error ? e.message : "No se pudo actualizar el estado.");
    } finally {
      setStatusBusyId(null);
    }
  };

  const sendComment = async (reportId: number) => {
    const message = (drafts[reportId] ?? "").trim();
    if (message.length < 2) {
      notify("Escribe un comentario antes de publicarlo.");
      return;
    }
    setSendingId(reportId);
    try {
      const res = await fetch("/api/report-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, message }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "No se pudo publicar el comentario.");
      setDrafts((d) => ({ ...d, [reportId]: "" }));
      notify("Avance publicado. Ya es visible para la comunidad.");
      await onChanged();
    } catch (e) {
      notify(e instanceof Error ? e.message : "No se pudo publicar el comentario.");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-5">
      <section className="rounded-[26px] border border-[#e1ebe6] bg-white p-5 shadow-[0_8px_30px_rgba(23,63,53,0.035)] sm:p-6 xl:col-span-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#244940]">Bandeja de incidencias</h2>
            <p className="mt-1 text-sm text-[#7d918b]">
              {isAdmin
                ? "Cambia el estado y publica avances visibles para los propietarios."
                : "Sigue aquí el avance que publica la administración."}
            </p>
          </div>
          <button
            onClick={onAdd}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#d86445] px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-[#c65639]"
          >
            <Plus size={16} /> Reportar
          </button>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${
                filter === f ? "bg-[#204f46] text-white" : "text-[#678079] hover:bg-[#eef4f0]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-3 divide-y divide-[#edf1ee]">
          {filtered.map((report) => {
            const open = expanded === report.id;
            const comments = report.comments ?? [];
            return (
              <article key={report.id} className="py-4 first:pt-2">
                <div className="flex gap-3">
                  <div
                    className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ${
                      report.priority === "alta" ? "bg-[#fff0ec] text-[#d86648]" : "bg-[#edf4f1] text-[#538076]"
                    }`}
                  >
                    <CircleAlert size={19} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-[#2b5048]">{report.title}</p>
                      <ReportPill value={report.status} />
                    </div>
                    <p className="mt-1 text-sm leading-5 text-[#71867f]">{report.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[#84958f]">
                      <span>{report.location}</span>
                      <span>Por {report.reporterName}</span>
                      <span className="text-[#557a70]">{report.category}</span>
                    </div>

                    {isAdmin && (
                      <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-[#f7faf8] p-3 sm:flex-row sm:items-center">
                        <label className="text-xs font-bold text-[#45655e]">
                          Estado del reporte
                          <select
                            value={report.status}
                            disabled={statusBusyId === report.id}
                            onChange={(e) => changeStatus(report.id, e.target.value)}
                            className="ml-2 h-9 rounded-xl border border-[#d9e5df] bg-white px-2.5 text-xs font-bold text-[#2d5149] outline-none focus:border-[#629588] disabled:opacity-60"
                          >
                            {REPORT_STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        {statusBusyId === report.id && (
                          <span className="text-[11px] font-bold text-[#7d928c]">Guardando…</span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => setExpanded(open ? null : report.id)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#42796c] hover:text-[#2b5a4f]"
                    >
                      <MessageCircle size={15} />
                      {open ? "Ocultar seguimiento" : `Ver seguimiento (${comments.length})`}
                    </button>

                    {open && (
                      <div className="mt-3 rounded-2xl border border-[#e6eeea] bg-[#fafcfb] p-3.5">
                        {comments.length === 0 ? (
                          <p className="text-xs leading-5 text-[#8ba09a]">
                            Aún no hay avances publicados.{" "}
                            {isAdmin ? "Publica el primero para que el propietario vea el seguimiento." : "La administración publicará aquí los avances."}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {comments.map((c) => {
                              const admin = c.authorRole === "administrador";
                              return (
                                <div key={c.id} className="flex gap-2.5">
                                  <div
                                    className={`grid size-8 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                                      admin ? "bg-[#204f46] text-white" : "bg-[#e3efe9] text-[#3d6b60]"
                                    }`}
                                  >
                                    {admin ? <ShieldCheck size={15} /> : c.authorName.trim().charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1 rounded-xl bg-white p-3 ring-1 ring-[#e6eeea]">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                      <p className="text-xs font-bold text-[#2b5048]">{c.authorName}</p>
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                          admin ? "bg-[#e8f1ed] text-[#2e6b5d]" : "bg-[#f1f5f3] text-[#6c8580]"
                                        }`}
                                      >
                                        {admin ? "Administración" : "Residente"}
                                      </span>
                                      <span className="text-[10px] text-[#9aa9a4]">{formatDateTime(c.createdAt)}</span>
                                    </div>
                                    <p className="mt-1.5 text-[13px] leading-5 text-[#4c625c]">{c.message}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <input
                            value={drafts[report.id] ?? ""}
                            onChange={(e) => setDrafts((d) => ({ ...d, [report.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void sendComment(report.id);
                              }
                            }}
                            placeholder={isAdmin ? "Publica un avance: qué se revisó, qué sigue…" : "Escribe una pregunta o aporte…"}
                            maxLength={1000}
                            className="h-10 min-w-0 flex-1 rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#2d5149] outline-none placeholder:text-[#a1b0ab] focus:border-[#629588]"
                          />
                          <button
                            disabled={sendingId === report.id}
                            onClick={() => sendComment(report.id)}
                            className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#21564c] text-white transition hover:bg-[#183f38] disabled:opacity-60"
                            title="Publicar comentario"
                          >
                            {sendingId === report.id ? <Check size={17} /> : <Send size={16} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#cad8d2] bg-[#fbfcfa] p-6 text-center">
            <p className="font-bold text-[#254640]">Sin reportes en este estado</p>
            <p className="mt-1 text-sm text-[#71847f]">Cambia el filtro o crea un nuevo reporte.</p>
          </div>
        )}
      </section>

      <aside className="rounded-[26px] bg-[#eff6f2] p-5 sm:p-6 xl:col-span-2">
        <div className="grid size-11 place-items-center rounded-2xl bg-white text-[#4e8577]">
          <ShieldCheck size={22} />
        </div>
        <h3 className="mt-5 text-xl font-bold tracking-[-0.04em] text-[#285047]">Una comunidad que escucha</h3>
        <p className="mt-2 text-sm leading-6 text-[#668078]">
          Los reportes quedan registrados y reciben actualizaciones hasta su resolución.
        </p>
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[25px] font-bold tracking-[-0.04em] text-[#29584e]">{nuevos}</p>
            <p className="text-xs font-bold text-[#79918a]">Nuevos por revisar</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[25px] font-bold tracking-[-0.04em] text-[#29584e]">{seguimiento}</p>
            <p className="text-xs font-bold text-[#79918a]">Vistos o en proceso</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[25px] font-bold tracking-[-0.04em] text-[#29584e]">{atendidos}</p>
            <p className="text-xs font-bold text-[#79918a]">Atendidos</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[25px] font-bold tracking-[-0.04em] text-[#29584e]">24 h</p>
            <p className="text-xs font-bold text-[#79918a]">Tiempo objetivo de respuesta</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
