import React from "react";
import Link from "next/link";
import {
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Wrench,
  MapPin,
  Activity,
  PlusCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  obtenerLimitesFechasSemaforo,
  formatearFecha,
} from "@/lib/utils/semaforo";
import { EstadoBadge } from "@/components/ui/Badges";
import type { MantenimientoConDetalles } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { hoyIso, enSieteDiasIso } = obtenerLimitesFechasSemaforo();

  // Consultas paralelas de conteo exacto (soporta +1,000 equipos sin truncamiento)
  const [
    totalRes,
    alDiaRes,
    proximosRes,
    vencidosRes,
    equiposMetaRes,
    ultimosMttosRes,
  ] = await Promise.all([
    supabase
      .from("equipos")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("equipos")
      .select("*", { count: "exact", head: true })
      .gt("fecha_proximo_mtto", enSieteDiasIso),
    supabase
      .from("equipos")
      .select("*", { count: "exact", head: true })
      .gte("fecha_proximo_mtto", hoyIso)
      .lte("fecha_proximo_mtto", enSieteDiasIso),
    supabase
      .from("equipos")
      .select("*", { count: "exact", head: true })
      .or(`fecha_proximo_mtto.is.null,fecha_proximo_mtto.lt.${hoyIso}`),
    supabase
      .from("equipos")
      .select("estado_actual, zona")
      .range(0, 4999),
    supabase
      .from("mantenimientos")
      .select(
        "*, equipos(id, codigo_activo, marca, modelo, serie, zona, ubicacion), usuarios(id, nombre_completo)"
      )
      .order("fecha_mantenimiento", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalEquipos = totalRes.count ?? 0;
  const equiposAlDia = alDiaRes.count ?? 0;
  const equiposProximos = proximosRes.count ?? 0;
  const equiposVencidos = vencidosRes.count ?? 0;

  // Agrupación por estado_actual y por zona
  const conteoPorEstado: Record<string, number> = {};
  const conteoPorZona: Record<string, number> = {};

  (equiposMetaRes.data ?? []).forEach((item) => {
    const est = item.estado_actual || "Activo";
    const zn = item.zona || "SIN ZONA";
    conteoPorEstado[est] = (conteoPorEstado[est] ?? 0) + 1;
    conteoPorZona[zn] = (conteoPorZona[zn] ?? 0) + 1;
  });

  const ultimosMantenimientos = (ultimosMttosRes.data ??
    []) as MantenimientoConDetalles[];

  const porcentajeCobertura =
    totalEquipos > 0
      ? Math.round(((equiposAlDia + equiposProximos) / totalEquipos) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Encabezado Operativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131512] border border-[#242821] text-xs font-mono text-[#B4F000] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#B4F000] animate-pulse" />
            PANEL OPERATIVO EN TIEMPO REAL
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F5F2] tracking-tight">
            Dashboard de Mantenimiento (Contrato 27-)
          </h1>
          <p className="text-sm text-[#94998F] mt-1">
            Control de periodicidad preventiva cada 45 días y estado operativo del parque de multifuncionales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/equipos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#B4F000] hover:bg-[#A3D900] text-[#090A08] font-semibold text-xs sm:text-sm transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Buscar Equipo / Registrar Mtto
          </Link>
          <Link
            href="/mantenimientos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#131512] hover:bg-[#1B1E19] text-[#F4F5F2] border border-[#242821] text-xs sm:text-sm font-medium transition-all"
          >
            Ver Bitácora Global
            <ArrowUpRight className="w-4 h-4 text-[#94998F]" />
          </Link>
        </div>
      </div>

      {/* Tarjetas KPI Principales (Semáforo 45 días) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equipos */}
        <Link
          href="/equipos"
          className="group bg-[#131512] border border-[#242821] hover:border-[#B4F000]/60 rounded-2xl p-5 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-[#94998F]">
              Total Inventario 27-
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#1B1E19] border border-[#242821] flex items-center justify-center text-[#F4F5F2] group-hover:border-[#B4F000] group-hover:text-[#B4F000] transition-colors">
              <Printer className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-[#F4F5F2]">
            {totalEquipos.toLocaleString("es-SV")}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[#94998F]">
            <span>Cobertura vigente: {porcentajeCobertura}%</span>
            <span className="text-[#B4F000] group-hover:underline">
              Ver todos →
            </span>
          </div>
        </Link>

        {/* Al Día */}
        <Link
          href="/equipos?semaforo=al_dia"
          className="group bg-[#131512] border border-[#242821] hover:border-[#B4F000]/60 rounded-2xl p-5 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-[#94998F]">
              Mtto. Al Día (&gt; 7 días)
            </span>
            <div className="w-9 h-9 rounded-xl bg-[rgba(180,240,0,0.12)] border border-[rgba(180,240,0,0.3)] flex items-center justify-center text-[#B4F000]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-[#B4F000]">
            {equiposAlDia.toLocaleString("es-SV")}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[#94998F]">
            <span>Dentro del ciclo de 45 días</span>
            <span className="text-[#B4F000] group-hover:underline">
              Filtrar →
            </span>
          </div>
        </Link>

        {/* Próximos a Vencer */}
        <Link
          href="/equipos?semaforo=proximo_vencer"
          className="group bg-[#131512] border border-[#242821] hover:border-[#FBBF24]/60 rounded-2xl p-5 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-[#94998F]">
              Próximos a Vencer (≤ 7d)
            </span>
            <div className="w-9 h-9 rounded-xl bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.3)] flex items-center justify-center text-[#FBBF24]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-[#FBBF24]">
            {equiposProximos.toLocaleString("es-SV")}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[#94998F]">
            <span>Programar visita preventiva</span>
            <span className="text-[#FBBF24] group-hover:underline">
              Filtrar →
            </span>
          </div>
        </Link>

        {/* Vencidos / Sin Registro */}
        <Link
          href="/equipos?semaforo=vencido"
          className="group bg-[#131512] border border-[#242821] hover:border-[#F87171]/60 rounded-2xl p-5 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-[#94998F]">
              Vencidos / Sin Mtto.
            </span>
            <div className="w-9 h-9 rounded-xl bg-[rgba(248,113,113,0.12)] border border-[rgba(248,113,113,0.3)] flex items-center justify-center text-[#F87171]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-[#F87171]">
            {equiposVencidos.toLocaleString("es-SV")}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[#94998F]">
            <span>Atención prioritaria requerida</span>
            <span className="text-[#F87171] group-hover:underline">
              Atender →
            </span>
          </div>
        </Link>
      </div>

      {/* Segunda fila: Estado Operativo + Distribución por Zona */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desglose por Estado Operativo */}
        <div className="bg-[#131512] border border-[#242821] rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#B4F000]" />
              <h2 className="text-base font-semibold text-[#F4F5F2]">
                Equipos por Estado
              </h2>
            </div>
            <span className="text-xs font-mono text-[#94998F]">
              Operatividad
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(conteoPorEstado)
              .sort((a, b) => b[1] - a[1])
              .map(([estado, cantidad]) => {
                const pct =
                  totalEquipos > 0
                    ? Math.round((cantidad / totalEquipos) * 100)
                    : 0;
                return (
                  <Link
                    key={estado}
                    href={`/equipos?estado=${encodeURIComponent(estado)}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1B1E19]/60 hover:bg-[#1B1E19] border border-[#242821] hover:border-[#B4F000]/40 transition-all"
                  >
                    <EstadoBadge estado={estado} />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#94998F] font-mono">
                        {pct}%
                      </span>
                      <span className="font-mono text-sm font-bold text-[#F4F5F2]">
                        {cantidad.toLocaleString("es-SV")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            {Object.keys(conteoPorEstado).length === 0 && (
              <p className="text-xs text-[#94998F] py-4 text-center">
                No hay equipos registrados aún.
              </p>
            )}
          </div>
        </div>

        {/* Distribución Regional por Zona */}
        <div className="bg-[#131512] border border-[#242821] rounded-2xl p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#B4F000]" />
              <h2 className="text-base font-semibold text-[#F4F5F2]">
                Distribución por Zona Geográfica
              </h2>
            </div>
            <span className="text-xs font-mono text-[#94998F]">
              {Object.keys(conteoPorZona).length} zonas activas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(conteoPorZona)
              .sort((a, b) => b[1] - a[1])
              .map(([zona, cantidad]) => {
                const pct =
                  totalEquipos > 0
                    ? Math.round((cantidad / totalEquipos) * 100)
                    : 0;
                return (
                  <Link
                    key={zona}
                    href={`/equipos?zona=${encodeURIComponent(zona)}`}
                    className="p-3.5 rounded-xl bg-[#1B1E19]/60 hover:bg-[#1B1E19] border border-[#242821] hover:border-[#B4F000]/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-semibold text-[#F4F5F2] truncate">
                        {zona}
                      </span>
                      <span className="font-mono text-sm font-bold text-[#B4F000]">
                        {cantidad.toLocaleString("es-SV")}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#090A08] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B4F000] rounded-full"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] text-[#94998F]">
                      <span>Contrato 27-</span>
                      <span className="font-mono">{pct}% del parque</span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>

      {/* Última Actividad Técnica Registrada */}
      <div className="bg-[#131512] border border-[#242821] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#B4F000]" />
            <h2 className="text-base sm:text-lg font-semibold text-[#F4F5F2]">
              Últimas Atenciones Técnicas Registradas
            </h2>
          </div>
          <Link
            href="/mantenimientos"
            className="text-xs font-semibold text-[#B4F000] hover:underline inline-flex items-center gap-1"
          >
            Ver historial completo
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {ultimosMantenimientos.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl bg-[#1B1E19]/40 border border-dashed border-[#242821]">
            <p className="text-sm text-[#F4F5F2] font-medium">
              Aún no se han registrado mantenimientos en la bitácora
            </p>
            <p className="text-xs text-[#94998F] mt-1 mb-4">
              Selecciona cualquier multifuncional del directorio para registrar su primera atención técnica y activar su semáforo de 45 días.
            </p>
            <Link
              href="/equipos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B4F000] text-[#090A08] font-semibold text-xs"
            >
              Ir al Directorio de Equipos
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#242821] text-[11px] uppercase tracking-wider text-[#94998F]">
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Activo</th>
                  <th className="py-3 px-3">Equipo / Ubicación</th>
                  <th className="py-3 px-3">Técnico</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Estado Resultante</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242821] text-xs sm:text-sm">
                {ultimosMantenimientos.map((mtto) => (
                  <tr
                    key={mtto.id}
                    className="hover:bg-[#1B1E19]/60 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono text-xs text-[#F4F5F2] whitespace-nowrap">
                      {formatearFecha(mtto.fecha_mantenimiento)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono font-semibold text-[#B4F000]">
                        {mtto.equipos?.codigo_activo ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#F4F5F2]">
                        {mtto.equipos?.marca} {mtto.equipos?.modelo}
                      </div>
                      <div className="text-xs text-[#94998F] truncate max-w-[260px]">
                        {mtto.ubicacion_registrada || mtto.equipos?.ubicacion}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#F4F5F2]">
                      {mtto.usuarios?.nombre_completo ?? "Técnico CSJ"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1B1E19] border border-[#242821] text-[#F4F5F2]">
                        {mtto.tipo_mantenimiento}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <EstadoBadge estado={mtto.estado_resultante} />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {mtto.equipo_id && (
                        <Link
                          href={`/equipos/${mtto.equipo_id}`}
                          className="text-xs font-semibold text-[#B4F000] hover:underline"
                        >
                          Ver ficha →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
