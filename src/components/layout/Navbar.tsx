"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Printer,
  LayoutDashboard,
  Server,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  userEmail?: string | null;
}

export function Navbar({ userEmail }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const navLinks = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      href: "/equipos",
      label: "Directorio Equipos",
      icon: Server,
      active: pathname.startsWith("/equipos"),
    },
    {
      href: "/mantenimientos",
      label: "Bitácora Global",
      icon: ClipboardList,
      active: pathname.startsWith("/mantenimientos"),
    },
  ];

  async function handleSignOut() {
    setCerrandoSesion(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090A08]/80 border-b border-[#242821]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Marca / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#B4F000]/15 border border-[#B4F000]/40 flex items-center justify-center text-[#B4F000] group-hover:bg-[#B4F000] group-hover:text-[#090A08] transition-colors">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-[#F4F5F2] text-sm sm:text-base">
                CSJ Multifuncionales
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#B4F000]/15 text-[#B4F000] border border-[#B4F000]/30 font-semibold">
                27-
              </span>
            </div>
            <p className="text-[11px] text-[#94998F] hidden sm:block">
              Control Operativo & Bitácora Técnica (45 días)
            </p>
          </div>
        </Link>

        {/* Navegación Central (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#131512] p-1 rounded-full border border-[#242821]">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  item.active
                    ? "bg-[#B4F000] text-[#090A08] font-semibold shadow-sm"
                    : "text-[#94998F] hover:text-[#F4F5F2] hover:bg-[#1B1E19]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Usuario y Logout (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {userEmail && (
            <span className="text-xs text-[#94998F] font-mono truncate max-w-[180px]">
              {userEmail}
            </span>
          )}
          <button
            onClick={handleSignOut}
            disabled={cerrandoSesion}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#131512] hover:bg-[#1B1E19] text-[#F4F5F2] border border-[#242821] hover:border-[#F87171]/50 hover:text-[#F87171] transition-all cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            {cerrandoSesion ? "Saliendo..." : "Cerrar sesión"}
          </button>
        </div>

        {/* Botón Menú Móvil */}
        <button
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="md:hidden p-2 rounded-lg bg-[#131512] border border-[#242821] text-[#F4F5F2] hover:border-[#B4F000]"
          aria-label="Abrir menú de navegación"
        >
          {menuAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menú Desplegable Móvil */}
      {menuAbierto && (
        <div className="md:hidden border-b border-[#242821] bg-[#131512] px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuAbierto(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-[#B4F000] text-[#090A08] font-semibold"
                    : "text-[#94998F] hover:text-[#F4F5F2] hover:bg-[#1B1E19]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 mt-2 border-t border-[#242821] flex items-center justify-between">
            <span className="text-xs text-[#94998F] font-mono truncate max-w-[200px]">
              {userEmail || "Sesión activa"}
            </span>
            <button
              onClick={handleSignOut}
              disabled={cerrandoSesion}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B1E19] text-[#F87171] border border-[#F87171]/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              {cerrandoSesion ? "Saliendo..." : "Salir"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
