import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/session";
import HeaderNav from "@/components/layout/HeaderNav";
import InactivityTimer from "@/components/auth/InactivityTimer";
import RegisterServiceWorker from "@/components/pwa/RegisterServiceWorker";
import InstallPrompt from "@/components/pwa/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2D3E24",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Hogar App - Administración del Hogar",
  description: "Gestión de jardín, plantas, finanzas y miembros del hogar",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HogarApp",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
        <RegisterServiceWorker />
        <InactivityTimer isLoggedIn={!!user} timeoutMinutes={15} />
        <HeaderNav user={user} />
        <main className="flex-1">{children}</main>
        <InstallPrompt />
      </body>
    </html>
  );
}

