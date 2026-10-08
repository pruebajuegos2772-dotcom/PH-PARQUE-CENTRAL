export const dynamic = "force-dynamic";

// Los gastos manuales se eliminaron: ahora todo gasto nace desde
// Operación → Nueva tarea (costo + factura) y se resta solo del fondo.
export async function POST() {
  return Response.json(
    { error: "Los gastos ahora se registran desde Operación → Nueva tarea (costo + factura)." },
    { status: 410 },
  );
}
