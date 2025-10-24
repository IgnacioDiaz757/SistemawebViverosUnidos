import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EmpleadosProvider } from "@/context/EmpleadosContext";
import AuthProvider from "@/components/AuthProvider";
import { SupabaseAuthProvider } from "@/context/SupabaseAuthContext";
import Navegacion from "@/components/Navegacion";
import { ServiciosProvider } from "@/context/ServiciosContext";
import LimpiezaInicial from "@/components/LimpiezaInicial";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Gestión de Asociados",
  description: "Sistema para gestionar asociados de la cooperativa, registro, bajas y filtros por contratista",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <SupabaseAuthProvider>
          <AuthProvider>
            <LimpiezaInicial />
            <ServiciosProvider>
              <EmpleadosProvider>
                <Navegacion />
                <main className="max-w-7xl mx-auto py-6 px-4">
                  {children}
                </main>
              </EmpleadosProvider>
            </ServiciosProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
