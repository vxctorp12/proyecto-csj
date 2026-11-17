import React from "react";
import Link from "next/link";
import {
  ClipboardList,
  Calendar,
  UserCheck,
  Filter,
  RotateCcw,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EstadoBadge } from "@/components/ui/Badges";
import { formatearFecha } from "@/lib/utils/semaforo";
import type { MantenimientoConDetalles, Usuario } from "@/types/database";

export const dynamic = "force-dynamic";

interface MantenimientosPageProps {
  searchParams: Promise<{
    tecnico?: string;
    tipo?: string;
    desde?: string;
    hasta?: string;
  }>;
}

export default async function MantenimientosPage({
  searchParams,
}: MantenimientosPageProps) {
  const params = await searchParams;
  const tecnicoFiltro = (params.tecnico ?? "").trim();
  const tipoFiltro = (params.tipo ?? "").trim();
  const fechaDesde = (params.desde ?? "").trim();
  const fechaHasta = (params.hasta ?? "").trim();

  const supabase = await createClient();

  let query = supabase
    .from("mantenimientos")
    .select(
      "*, equipos(id, codigo_activo, marca, modelo, serie, zona, ubicacion), usuarios(id, nombre_completo, email)",
      { count: "exact" }
    );

  if (tecnicoFiltro) {
    query = query.eq("tecnico_id", tecnicoFiltro);
  }
  if (tipoFiltro) {
    query = query.eq("tipo_mantenimiento", tipoFiltro);
  }
  if (fechaDesde) {
    query = query.gte("fecha_mantenimiento", fechaDesde);
  }
  if (fechaHasta) {
    query = query.lte("fecha_mantenimiento", fechaHasta);
  }

  const [mttosRes, tecnicosRes] = await Promise.all([
    query
      .order("fecha_mantenimiento", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("usuarios")
      .select("*")
      .eq("activo", true)
      .order("nombre_completo", { ascending: true }),
  ]);

  const mantenimientos = (mttosRes.data ?? []) as MantenimientoConDetalles[];
  const totalEncontrados = mttosRes.count ?? 0;
  const tecnicos = (tecnicosRes.data ?? []) as Usuario[];

  const hayFiltros = Boolean(
    tecnicoFiltro || tipoFiltro || fechaDesde || fechaHasta
  );

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131512] border border-[#242821] text-xs font-mono text-[#B4F000] mb-2">
            BITÁCORA TÉCNICA GLOBAL
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F5F2] tracking-tight">
            Historial Global de Mantenimientos
          </h1>
          <p className="text-sm text-[#94998F] mt-1">
            Consulta y audita las atenciones preventivas y correctivas por técnico y rango de fechas.
          </p>
        </div>

        <Link
          href="/equipos"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#B4F000] hover:bg-[#A3D900] text-[#090A08] font-semibold text-xs sm:text-sm transition-all self-start sm:self-auto"
        >
          Seleccionar Equipo para Nuevo Mtto
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Barra de Filtros Server-Side (GET Form) */}
      <form
        method="GET"
        action="/mantenimientos"
        className="bg-[#131512] border border-[#242821] rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Técnico */}
          <div>
            <label
              htmlFor="tecnico"
              className="block text-[11px] font-medium uppercase tracking-wider text-[#94998F] mb-1"
            >
              Técnico de Campo
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-[#94998F] absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                id="tecnico"
                name="tecnico"
                defaultValue={tecnicoFiltro}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1B1E19] border border-[#242821] text-xs sm:text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
              >
                <option value="">Todos los técnicos</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo de servicio */}
          <div>
            <label
              htmlFor="tipo"
              className="block text-[11px] font-medium uppercase tracking-wider text-[#94998F] mb-1"
            >
              Tipo de Mantenimiento
            </label>
            <select
              id="tipo"
              name="tipo"
              defaultValue={tipoFiltro}
              className="w-full px-3 py-2 rounded-xl bg-[#1B1E19] border border-[#242821] text-xs sm:text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
            >
              <option value="">Todos los tipos</option>
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Baja de equipo">Baja de equipo</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label
              htmlFor="desde"
              className="block text-[11px] font-medium uppercase tracking-wider text-[#94998F] mb-1"
            >
              Fecha Desde
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#94998F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="desde"
                name="desde"
                type="date"
                defaultValue={fechaDesde}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1B1E19] border border-[#242821] font-mono text-xs sm:text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
              />
            </div>
          </div>

          {/* Fecha Hasta */}
          <div>
            <label
              htmlFor="hasta"
              className="block text-[11px] font-medium uppercase tracking-wider text-[#94998F] mb-1"
            >
              Fecha Hasta
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#94998F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="hasta"
                name="hasta"
                type="date"
                defaultValue={fechaHasta}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1B1E19] border border-[#242821] font-mono text-xs sm:text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#242821] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#94998F]">
            <Filter className="w-3.5 h-3.5 text-[#B4F000]" />
            <span>
              Total registros encontrados:{" "}
              <strong className="font-mono text-[#F4F5F2]">
                {totalEncontrados.toLocaleString("es-SV")}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {hayFiltros && (
              <Link
                href="/mantenimientos"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#94998F] hover:text-[#F4F5F2] bg-[#1B1E19] border border-[#242821]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar
              </Link>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#B4F000] hover:bg-[#A3D900] text-[#090A08] font-semibold text-xs cursor-pointer transition-all"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </form>

      {/* Listado de Bitácora */}
      {mantenimientos.length === 0 ? (
        <div className="bg-[#131512] border border-[#242821] rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1B1E19] border border-[#242821] flex items-center justify-center text-[#94998F] mx-auto mb-3">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#F4F5F2]">
            No se encontraron servicios técnicos registrados
          </h3>
          <p className="text-xs sm:text-sm text-[#94998F] mt-1">
            Prueba ajustando los filtros de búsqueda o registra una nueva atención desde la ficha de un equipo.
          </p>
        </div>
      ) : (
        <div className="bg-[#131512] border border-[#242821] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#242821] bg-[#1B1E19]/60 text-[11px] uppercase tracking-wider text-[#94998F]">
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Código Activo</th>
                  <th className="py-3.5 px-4">Equipo / Serie</th>
                  <th className="py-3.5 px-4">Técnico Responsable</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Estado Resultante</th>
                  <th className="py-3.5 px-4">Ubicación / Observaciones</th>
                  <th className="py-3.5 px-4 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242821] text-xs sm:text-sm">
                {mantenimientos.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-[#1B1E19]/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap text-[#F4F5F2]">
                      {formatearFecha(m.fecha_mantenimiento)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/equipos/${m.equipo_id}`}
                        className="font-mono font-bold text-[#B4F000] hover:underline"
                      >
                        {m.equipos?.codigo_activo ?? "—"}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[#F4F5F2]">
                        {m.equipos?.marca} {m.equipos?.modelo}
                      </div>
                      <div className="font-mono text-xs text-[#94998F]">
                        {m.equipos?.serie || "S/N"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#F4F5F2] font-medium">
                      {m.usuarios?.nombre_completo ?? "Técnico CSJ"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1B1E19] border border-[#242821] text-[#F4F5F2]">
                        {m.tipo_mantenimiento}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <EstadoBadge estado={m.estado_resultante} />
                    </td>
                    <td className="py-3.5 px-4 max-w-[300px]">
                      <div className="text-xs text-[#F4F5F2] truncate">
                        {m.ubicacion_registrada || m.equipos?.ubicacion}
                      </div>
                      {m.observaciones && (
                        <div className="text-xs text-[#94998F] line-clamp-2 mt-0.5">
                          {m.observaciones}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/equipos/${m.equipo_id}`}
                        className="text-xs font-semibold text-[#B4F000] hover:underline"
                      >
                        Ver equipo →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
