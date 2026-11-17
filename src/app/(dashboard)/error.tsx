"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en ruta del sistema:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#131512] border border-[rgba(248,113,113,0.3)] rounded-2xl p-6 sm:p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(248,113,113,0.12)] border border-[rgba(248,113,113,0.3)] flex items-center justify-center text-[#F87171] mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#F4F5F2]">
          Ocurrió un problema al cargar la información
        </h2>
        <p className="text-xs sm:text-sm text-[#94998F] mt-2 mb-6">
          {error.message ||
            "No fue posible sincronizar los datos con Supabase en este momento."}
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B4F000] hover:bg-[#A3D900] text-[#090A08] font-semibold text-xs sm:text-sm transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reintentar carga
        </button>
      </div>
    </div>
  );
}
