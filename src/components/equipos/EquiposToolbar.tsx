"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  FileDown,
  RotateCcw,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { obtenerLimitesFechasSemaforo } from "@/lib/utils/semaforo";
import { generarPdfEquipos } from "@/components/pdf/exportarEquiposPdf";
import {
  ESTADOS_EQUIPO,
  type Equipo,
  type FiltroSemaforo,
} from "@/types/database";

interface EquiposToolbarProps {
  zonasDisponibles: string[];
  modelosDisponibles: string[];
  totalResultados: number;
}

export function EquiposToolbar({
  zonasDisponibles,
  modelosDisponibles,
  totalResultados,
}: EquiposToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qInicial = searchParams.get("q") ?? "";
  const zonaActual = searchParams.get("zona") ?? "";
  const modeloActual = searchParams.get("modelo") ?? "";
  const estadoActual = searchParams.get("estado") ?? "";
  const semaforoActual =
    (searchParams.get("semaforo") as FiltroSemaforo) ?? "todos";

  // Hook useState + useEffect con debounce de 350ms para buscador omnicanal
  const [busqueda, setBusqueda] = useState(qInicial);
  const [exportandoModo, setExportandoModo] = useState<
    "filtrados" | "todo" | null
  >(null);

  useEffect(() => {
    setBusqueda(qInicial);
  }, [qInicial]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (busqueda.trim() === qInicial.trim()) return;
      const params = new URLSearchParams(searchParams.toString());
      if (busqueda.trim()) {
        params.set("q", busqueda.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    }, 350);

    return () => clearTimeout(timer);
  }, [busqueda, qInicial, pathname, router, searchParams]);

  function actualizarFiltro(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor && valor !== "todos") {
      params.set(clave, valor);
    } else {
      params.delete(clave);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function limpiarFiltros() {
    setBusqueda("");
    router.push(pathname);
  }

  const hayFiltrosActivos = Boolean(
    qInicial ||
      zonaActual ||
      modeloActual ||
      estadoActual ||
      (semaforoActual && semaforoActual !== "todos")
  );

  async function handleExportarPdf(modo: "filtrados" | "todo") {
    try {
      setExportandoModo(modo);
      const supabase = createClient();
      const { hoyIso, enSieteDiasIso } = obtenerLimitesFechasSemaforo();

      let query = supabase.from("equipos").select("*");

      if (modo === "filtrados") {
        if (qInicial.trim()) {
          const term = qInicial.trim();
          query = query.or(
            `codigo_activo.ilike.%${term}%,serie.ilike.%${term}%,ubicacion.ilike.%${term}%`
          );
        }
        if (zonaActual) {
          query = query.eq("zona", zonaActual);
        }
        if (modeloActual) {
          query = query.eq("modelo", modeloActual);
        }
        if (estadoActual) {
          query = query.eq("estado_actual", estadoActual);
        }
        if (semaforoActual === "al_dia") {
          query = query
            .neq("estado_actual", "Dado de baja")
            .gt("fecha_proximo_mtto", enSieteDiasIso);
        } else if (semaforoActual === "proximo_vencer") {
          query = query
            .neq("estado_actual", "Dado de baja")
            .gte("fecha_proximo_mtto", hoyIso)
            .lte("fecha_proximo_mtto", enSieteDiasIso);
        } else if (semaforoActual === "vencido") {
          query = query
            .neq("estado_actual", "Dado de baja")
            .or(`fecha_proximo_mtto.is.null,fecha_proximo_mtto.lt.${hoyIso}`);
        }
      }

      const { data, error } = await query
        .order("zona", { ascending: true })
        .order("codigo_activo", { ascending: true })
        .range(0, 4999);

      if (error) {
        throw error;
      }

      generarPdfEquipos({
        equipos: (data ?? []) as Equipo[],
        modo,
        filtros: {
          q: qInicial,
          zona: zonaActual,
          modelo: modeloActual,
          estado: estadoActual,
          semaforo: semaforoActual,
        },
      });
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      alert("Ocurrió un error al generar el reporte PDF.");
    } finally {
      setExportandoModo(null);
    }
  }

  return (
    <div className="bg-[#131512] border border-[#242821] rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Fila Superior: Buscador Omnicanal + Botones de Exportación PDF */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Input Buscador Omnicanal (UPPERCASE) */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94998F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
            placeholder="BUSCAR POR CÓDIGO (EJ. 27-6427), SERIE (EJ. W2Z7603074) O DEPENDENCIA / UBICACIÓN..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1B1E19] border border-[#242821] text-sm text-[#F4F5F2] uppercase placeholder-[#94998F]/60 focus:outline-none focus:border-[#B4F000] transition-colors"
          />
        </div>

        {/* Botones de Exportación PDF */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleExportarPdf("filtrados")}
            disabled={exportandoModo !== null || totalResultados === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#B4F000] hover:bg-[#A3D900] text-[#090A08] font-semibold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {exportandoModo === "filtrados" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>Exportar Filtrados (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportarPdf("todo")}
            disabled={exportandoModo !== null}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#1B1E19] hover:bg-[#242821] text-[#F4F5F2] border border-[#242821] hover:border-[#B4F000]/50 font-medium text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {exportandoModo === "todo" ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#B4F000]" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-[#B4F000]" />
            )}
            <span>Exportar Todo (PDF)</span>
          </button>
        </div>
      </div>

      {/* Fila Inferior: Filtros Combinados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Filtro Zona */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-[#94998F] mb-1">
            Zona Regional
          </label>
          <select
            value={zonaActual}
            onChange={(e) => actualizarFiltro("zona", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#1B1E19] border border-[#242821] text-xs sm:text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
          >
            <option value="">Todas las zonas</option>
            {zonasDisponibles.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Modelo */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-[#94998F] mb-1">
            Modelo de Equipo
          </label>
          <select
            value={modeloActual}
            onChange={(e) => actualizarFiltro("modelo", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#1B1E19] border border-[#242821] text-xs sm:text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
          >
            <option value="">Todos los modelos</option>
            {modelosDisponibles.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Estado */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-[#94998F] mb-1">
            Estado Operativo
          </label>
          <select
            value={estadoActual}
            onChange={(e) => actualizarFiltro("estado", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#1B1E19] border border-[#242821] text-xs sm:text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_EQUIPO.map((est) => (
              <option key={est} value={est}>
                {est}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Semáforo Mtto (45 días) */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-[#94998F] mb-1">
            Semáforo Preventivo (45d)
          </label>
          <select
            value={semaforoActual}
            onChange={(e) => actualizarFiltro("semaforo", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#1B1E19] border border-[#242821] text-xs sm:text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
          >
            <option value="todos">Todos los equipos</option>
            <option value="al_dia">🟢 Al día (&gt; 7 días)</option>
            <option value="proximo_vencer">🟡 Próximos a vencer (≤ 7 días)</option>
            <option value="vencido">🔴 Vencidos / Sin mtto</option>
          </select>
        </div>
      </div>

      {/* Pie de barra: Conteo de resultados + Limpiar filtros */}
      <div className="pt-2 border-t border-[#242821] flex flex-wrap items-center justify-between gap-2 text-xs text-[#94998F]">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#B4F000]" />
          <span>
            Mostrando{" "}
            <strong className="font-mono text-[#F4F5F2]">
              {totalResultados.toLocaleString("es-SV")}
            </strong>{" "}
            equipos encontrados
          </span>
        </div>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B4F000] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar búsqueda y filtros
          </button>
        )}
      </div>
    </div>
  );
}
