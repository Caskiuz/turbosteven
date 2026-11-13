import type { Metadata, Viewport } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

const display = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700", "800", "900"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "TURBO STEVEN AUDIO — Sistema de Comandas de Fabricación",
  description:
    "Gestión de comandas de fabricación en la nube para parlantes picó personalizados y mini turbos: numeración automática, fotos de referencia, estados en tiempo real, roles, historial, comandas en PDF y asistente IA.",
  icons: { icon: "/brand/icon-192.png", apple: "/brand/icon-192.png" },
  openGraph: {
    title: "TURBO STEVEN AUDIO — Sistema de Comandas",
    description:
      "Comandas de fabricación en la nube: numeración automática, fotos, estados en tiempo real, roles, PDF y asistente IA.",
    images: ["/brand/flyer-mini-turbo.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0614",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
