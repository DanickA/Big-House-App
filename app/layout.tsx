import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/session";
import HeaderNav from "@/components/layout/HeaderNav";
import InactivityTimer from "@/components/auth/InactivityTimer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hogar App - Administración del Hogar",
  description: "Gestión de jardín, plantas, finanzas y miembros del hogar",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F4EFE6] text-[#36332E]">
        <InactivityTimer isLoggedIn={!!user} timeoutMinutes={15} />
        <HeaderNav user={user} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
