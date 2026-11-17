import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CSJ — Gestión y Bitácora de Multifuncionales (Contrato 27-)",
  description:
    "Sistema operativo de control de inventario, semáforo preventivo (45 días) y bitácora técnica de multifuncionales del Contrato 27-.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="bg-[#090A08] text-[#F4F5F2] antialiased selection:bg-[#B4F000] selection:text-[#090A08]">
        {children}
      </body>
    </html>
  );
}
