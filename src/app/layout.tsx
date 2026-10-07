import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PH Parque Central Arraiján | Gestión residencial",
  description: "Portal de operación, finanzas y comunidad del PH Parque Central, Arraiján.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
