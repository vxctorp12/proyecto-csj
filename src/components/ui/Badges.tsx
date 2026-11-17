import React from "react";
import { calcularSemaforoEquipo } from "@/lib/utils/semaforo";

interface EstadoBadgeProps {
  estado: string;
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const normalizado = estado.trim().toLowerCase();

  let classes =
    "bg-[rgba(180,240,0,0.12)] text-[#B4F000] border-[rgba(180,240,0,0.3)]";
  let dotColor = "bg-[#B4F000]";

  if (
    normalizado.includes("reparac") ||
    normalizado.includes("repuesto") ||
    normalizado.includes("pendiente")
  ) {
    classes =
      "bg-[rgba(251,191,36,0.12)] text-[#FBBF24] border-[rgba(251,191,36,0.3)]";
    dotColor = "bg-[#FBBF24]";
  } else if (
    normalizado.includes("baja") ||
    normalizado.includes("no localizado") ||
    normalizado.includes("inactivo")
  ) {
    classes =
      "bg-[rgba(248,113,113,0.12)] text-[#F87171] border-[rgba(248,113,113,0.3)]";
    dotColor = "bg-[#F87171]";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {estado}
    </span>
  );
}

interface SemaforoBadgeProps {
  fechaUltimoMtto: string | null;
  fechaProximoMtto: string | null;
  mostrarDetalle?: boolean;
}

export function SemaforoBadge({
  fechaUltimoMtto,
  fechaProximoMtto,
  mostrarDetalle = true,
}: SemaforoBadgeProps) {
  const info = calcularSemaforoEquipo(fechaUltimoMtto, fechaProximoMtto);

  let classes =
    "bg-[rgba(180,240,0,0.12)] text-[#B4F000] border-[rgba(180,240,0,0.3)]";
  let dotColor = "bg-[#B4F000]";

  if (info.estado === "proximo_vencer") {
    classes =
      "bg-[rgba(251,191,36,0.12)] text-[#FBBF24] border-[rgba(251,191,36,0.3)]";
    dotColor = "bg-[#FBBF24]";
  } else if (info.estado === "vencido") {
    classes =
      "bg-[rgba(248,113,113,0.12)] text-[#F87171] border-[rgba(248,113,113,0.3)]";
    dotColor = "bg-[#F87171]";
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${classes}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {info.etiqueta}
      </span>
      {mostrarDetalle && (
        <span className="text-[11px] text-[#94998F] pl-1">
          {info.detalleDias}
        </span>
      )}
    </div>
  );
}
