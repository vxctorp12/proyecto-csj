import React from "react";
import { createClient } from "@/lib/supabase/server";
import { obtenerLimitesFechasSemaforo } from "@/lib/utils/semaforo";
import { EquiposToolbar } from "@/components/equipos/EquiposToolbar";
import { EquiposList } from "@/components/equipos/EquiposList";
import type { Equipo, FiltroSemaforo } from "@/types/database";

export const dynamic = "force-dynamic";

const TAMANO_PAGINA = 25;

interface EquiposPageProps {
  searchParams: Promise<{
    q?: string;
    zona?: string;
    modelo?: string;
    estado?: string;
    semaforo?: string;
    page?: string;
  }>;
}

export default async function EquiposPage({ searchParams }: EquiposPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const zona = (params.zona ?? "").trim();
  const modelo = (params.modelo ?? "").trim();
  const estado = (params.estado ?? "").trim();
  const semaforo = ((params.semaforo ?? "todos") as FiltroSemaforo) || "todos";
  const paginaActual = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const desde = (paginaActual - 1) * TAMANO_PAGINA;
  const hasta = desde + TAMANO_PAGINA - 1;

  const supabase = await createClient();
  const { hoyIso, enSieteDiasIso } = obtenerLimitesFechasSemaforo();

  // Construcción de consulta paginada y filtrada directamente en PostgreSQL
  let query = supabase.from("equipos").select("*", { count: "exact" });

  if (q) {
    query = query.or(
      `codigo_activo.ilike.%${q}%,serie.ilike.%${q}%,ubicacion.ilike.%${q}%`
    );
  }
  if (zona) {
    query = query.eq("zona", zona);
  }
  if (modelo) {
    query = query.eq("modelo", modelo);
  }
  if (estado) {
    query = query.eq("estado_actual", estado);
  }

  if (semaforo === "al_dia") {
    query = query
      .neq("estado_actual", "Dado de baja")
      .gt("fecha_proximo_mtto", enSieteDiasIso);
  } else if (semaforo === "proximo_vencer") {
    query = query
      .neq("estado_actual", "Dado de baja")
      .gte("fecha_proximo_mtto", hoyIso)
      .lte("fecha_proximo_mtto", enSieteDiasIso);
  } else if (semaforo === "vencido") {
    query = query
      .neq("estado_actual", "Dado de baja")
      .or(`fecha_proximo_mtto.is.null,fecha_proximo_mtto.lt.${hoyIso}`);
  }

  const [equiposRes, catalogosRes] = await Promise.all([
    query
      .order("codigo_activo", { ascending: true })
      .range(desde, hasta),
    supabase
      .from("equipos")
      .select("zona, modelo")
      .range(0, 4999),
  ]);

  const equipos = (equiposRes.data ?? []) as Equipo[];
  const totalRegistros = equiposRes.count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / TAMANO_PAGINA));

  // Extraer valores únicos ordenados de Zona y Modelo
  const zonasSet = new Set<string>();
  const modelosSet = new Set<string>();

  (catalogosRes.data ?? []).forEach((row) => {
    if (row.zona) zonasSet.add(row.zona);
    if (row.modelo) modelosSet.add(row.modelo);
  });

  const zonasDisponibles = Array.from(zonasSet).sort();
  const modelosDisponibles = Array.from(modelosSet).sort();

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131512] border border-[#242821] text-xs font-mono text-[#B4F000] mb-2">
          INVENTARIO CONTRATO 27-
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F5F2] tracking-tight">
          Directorio de Equipos Multifuncionales
        </h1>
        <p className="text-sm text-[#94998F] mt-1">
          Búsqueda instantánea por código de activo, serie o ubicación, filtros combinados y exportación a PDF.
        </p>
      </div>

      <EquiposToolbar
        zonasDisponibles={zonasDisponibles}
        modelosDisponibles={modelosDisponibles}
        totalResultados={totalRegistros}
      />

      <EquiposList
        equipos={equipos}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalRegistros={totalRegistros}
        searchParamsActuales={params}
      />
    </div>
  );
}
