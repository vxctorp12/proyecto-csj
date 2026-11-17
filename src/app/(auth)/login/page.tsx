"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setCargando(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(
          error.message === "Invalid login credentials"
            ? "Credenciales inválidas. Verifica tu correo y contraseña."
            : error.message
        );
        setCargando(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMsg("Error de conexión al intentar iniciar sesión.");
      setCargando(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#090A08] relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(180, 240, 0, 0.10) 0%, rgba(9, 10, 8, 0) 60%)",
      }}
    >
      <div className="w-full max-w-md bg-[#131512] border border-[#242821] rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Cabecera */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#B4F000]/15 border border-[#B4F000]/40 flex items-center justify-center text-[#B4F000] mb-4">
            <Printer className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B1E19] border border-[#242821] text-xs font-mono text-[#B4F000] mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            CONTRATO PREFIJO 27-
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F5F2] tracking-tight">
            Gestión de Multifuncionales
          </h1>
          <p className="text-xs sm:text-sm text-[#94998F] mt-1">
            Inicia sesión para consultar inventario y registrar mantenimientos preventivos/correctivos.
          </p>
        </div>

        {/* Alerta de error */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-[rgba(248,113,113,0.12)] border border-[rgba(248,113,113,0.3)] flex items-start gap-2.5 text-[#F87171] text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-[#94998F] uppercase tracking-wider mb-2"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94998F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tecnico@csj.gob.sv"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1B1E19] border border-[#242821] text-sm text-[#F4F5F2] placeholder-[#94998F]/50 focus:outline-none focus:border-[#B4F000] transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-[#94998F] uppercase tracking-wider mb-2"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94998F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1B1E19] border border-[#242821] text-sm text-[#F4F5F2] placeholder-[#94998F]/50 focus:outline-none focus:border-[#B4F000] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#B4F000] hover:bg-[#A3D900] text-[#090A08] font-semibold text-sm transition-all cursor-pointer disabled:opacity-60"
          >
            <span>{cargando ? "Verificando acceso..." : "Ingresar al Sistema"}</span>
            {!cargando && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#242821] flex items-center justify-between text-[11px] text-[#94998F]">
          <span>Periodicidad: 45 días</span>
          <span className="font-mono">+1,000 Equipos Activos</span>
        </div>
      </div>
    </div>
  );
}
