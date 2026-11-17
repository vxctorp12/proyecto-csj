import type { SemaforoMtto } from "@/types/database";

export interface InfoSemaforo {
  estado: SemaforoMtto;
  etiqueta: string;
  detalleDias: string;
  diasRestantes: number | null;
  fechaProximoCalculada: string | null;
}

/**
 * Calcula la fecha del próximo mantenimiento sumando 45 días si el equipo está Activo
 */
export function obtenerFechaProximoMtto(
  fechaUltimoMtto: string | null,
  fechaProximoMtto: string | null,
  estadoActual?: string
): string | null {
  if (estadoActual && estadoActual.trim().toLowerCase() === "dado de baja") {
    return null;
  }
  if (fechaProximoMtto) return fechaProximoMtto;
  if (!fechaUltimoMtto) return null;

  const base = new Date(`${fechaUltimoMtto}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + 45);
  return base.toISOString().split("T")[0];
}

/**
 * Evalúa el semáforo de mantenimiento de un equipo (Regla de 45 días):
 * - Si está 'Dado de baja' => 'baja' (No requiere próxima visita)
 * - Sin registro o días < 0 => 'vencido'
 * - 0 <= días <= 7 => 'proximo_vencer'
 * - días > 7 => 'al_dia'
 */
export function calcularSemaforoEquipo(
  fechaUltimoMtto: string | null,
  fechaProximoMtto: string | null,
  estadoActual?: string
): InfoSemaforo {
  if (estadoActual && estadoActual.trim().toLowerCase() === "dado de baja") {
    return {
      estado: "baja",
      etiqueta: "Sin programación",
      detalleDias: "Equipo dado de baja",
      diasRestantes: null,
      fechaProximoCalculada: null,
    };
  }

  const proximoStr = obtenerFechaProximoMtto(
    fechaUltimoMtto,
    fechaProximoMtto,
    estadoActual
  );

  if (!proximoStr) {
    return {
      estado: "vencido",
      etiqueta: "Sin registro",
      detalleDias: "Requiere atención inicial",
      diasRestantes: null,
      fechaProximoCalculada: null,
    };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proximo = new Date(`${proximoStr}T00:00:00`);
  proximo.setHours(0, 0, 0, 0);

  const diffMs = proximo.getTime() - hoy.getTime();
  const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) {
    const vencidoHace = Math.abs(diasRestantes);
    return {
      estado: "vencido",
      etiqueta: "Vencido",
      detalleDias: `Vencido hace ${vencidoHace} ${vencidoHace === 1 ? "día" : "días"}`,
      diasRestantes,
      fechaProximoCalculada: proximoStr,
    };
  }

  if (diasRestantes <= 7) {
    return {
      estado: "proximo_vencer",
      etiqueta: "Próximo a vencer",
      detalleDias:
        diasRestantes === 0
          ? "Vence hoy"
          : `Vence en ${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}`,
      diasRestantes,
      fechaProximoCalculada: proximoStr,
    };
  }

  return {
    estado: "al_dia",
    etiqueta: "Al día",
    detalleDias: `${diasRestantes} días restantes`,
    diasRestantes,
    fechaProximoCalculada: proximoStr,
  };
}

/**
 * Formatea una fecha YYYY-MM-DD a DD/MM/YYYY de forma segura
 */
export function formatearFecha(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "—";
  const limpia = fechaIso.split("T")[0];
  const partes = limpia.split("-");
  if (partes.length !== 3) return fechaIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/**
 * Devuelve las fechas límite YYYY-MM-DD para filtrar en PostgreSQL por semáforo
 */
export function obtenerLimitesFechasSemaforo(): {
  hoyIso: string;
  enSieteDiasIso: string;
} {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const enSiete = new Date(hoy);
  enSiete.setDate(enSiete.getDate() + 7);

  const formatLocalIso = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    hoyIso: formatLocalIso(hoy),
    enSieteDiasIso: formatLocalIso(enSiete),
  };
}
