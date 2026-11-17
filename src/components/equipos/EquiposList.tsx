import React from "react";
import Link from "next/link";
import {
  Wrench,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import type { Equipo } from "@/types/database";
import { EstadoBadge, SemaforoBadge } from "@/components/ui/Badges";
import { formatearFecha } from "@/lib/utils/semaforo";

interface EquiposListProps {
  equipos: Equipo[];
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  searchParamsActuales: Record<string, string | undefined>;
}

export function EquiposList({
  equipos,
  paginaActual,
  totalPaginas,
  totalRegistros,
  searchParamsActuales,
}: EquiposListProps) {
  function crearUrlPagina(nuevaPagina: number): string {
    const params = new URLSearchParams();
    Object.entries(searchParamsActuales).forEach(([k, v]) => {
      if (v && k !== "page") {
        params.set(k, v);
      }
    });
    params.set("page", String(nuevaPagina));
    return `/equipos?${params.toString()}`;
  }

  if (equipos.length === 0) {
    return (
      <div className="bg-[#131512] border border-[#242821] rounded-2xl p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#1B1E19] border border-[#242821] flex items-center justify-center text-[#94998F] mx-auto mb-3">
          <Printer className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#F4F5F2]">
          No se encontraron multifuncionales con esos criterios
        </h3>
        <p className="text-xs sm:text-sm text-[#94998F] mt-1">
          Intenta buscar por otro número de activo (ej. 27-6427), serie o limpia los filtros activos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* VISTA ESCRITORIO: Tabla Densa (md:block) */}
      <div className="hidden md:block bg-[#131512] border border-[#242821] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242821] bg-[#1B1E19]/60 text-[11px] uppercase tracking-wider text-[#94998F]">
                <th className="py-3.5 px-4">Código Activo</th>
                <th className="py-3.5 px-4">Marca / Modelo</th>
                <th className="py-3.5 px-4">Serie</th>
                <th className="py-3.5 px-4">Ubicación / Dependencia</th>
                <th className="py-3.5 px-4">Zona</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Semáforo Mtto (45d)</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242821] text-sm">
              {equipos.map((eq) => (
                <tr
                  key={eq.id}
                  className="hover:bg-[#1B1E19]/70 transition-colors"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Link
                      href={`/equipos/${eq.id}`}
                      className="font-mono font-bold text-[#B4F000] hover:underline"
                    >
                      {eq.codigo_activo}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-[#F4F5F2]">
                      {eq.modelo}
                    </div>
                    <div className="text-xs text-[#94998F]">{eq.marca}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-[#F4F5F2]">
                    {eq.serie || "S/N"}
                  </td>
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <p
                      className="text-xs sm:text-sm text-[#F4F5F2] line-clamp-2"
                      title={eq.ubicacion}
                    >
                      {eq.ubicacion}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#1B1E19] border border-[#242821] text-[#F4F5F2]">
                      {eq.zona}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <EstadoBadge estado={eq.estado_actual} />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <SemaforoBadge
                      fechaUltimoMtto={eq.fecha_ultimo_mtto}
                      fechaProximoMtto={eq.fecha_proximo_mtto}
                    />
                    {eq.fecha_ultimo_mtto && (
                      <span className="block font-mono text-[10px] text-[#94998F] pl-1 mt-0.5">
                        Últ: {formatearFecha(eq.fecha_ultimo_mtto)}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      href={`/equipos/${eq.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#B4F000] hover:bg-[#A3D900] text-[#090A08] font-semibold text-xs transition-all"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Registrar Atención
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VISTA MÓVIL: Tarjetas Táctiles Apiladas (md:hidden) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {equipos.map((eq) => (
          <div
            key={eq.id}
            className="bg-[#131512] border border-[#242821] rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-[#B4F000]">
                    {eq.codigo_activo}
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#1B1E19] border border-[#242821] text-[#94998F]">
                    {eq.zona}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#F4F5F2] mt-0.5">
                  {eq.marca} {eq.modelo}
                </p>
                <p className="font-mono text-xs text-[#94998F]">
                  Serie: {eq.serie || "S/N"}
                </p>
              </div>
              <EstadoBadge estado={eq.estado_actual} />
            </div>

            <div className="flex items-start gap-2 text-xs text-[#F4F5F2] bg-[#1B1E19]/60 p-2.5 rounded-xl border border-[#242821]">
              <MapPin className="w-4 h-4 text-[#B4F000] shrink-0 mt-0.5" />
              <span>{eq.ubicacion}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <SemaforoBadge
                fechaUltimoMtto={eq.fecha_ultimo_mtto}
                fechaProximoMtto={eq.fecha_proximo_mtto}
              />

              <Link
                href={`/equipos/${eq.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#B4F000] active:bg-[#A3D900] text-[#090A08] font-semibold text-xs"
              >
                <Wrench className="w-3.5 h-3.5" />
                Registrar Atención
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de Paginación Server-Side */}
      {totalPaginas > 1 && (
        <div className="bg-[#131512] border border-[#242821] rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[#94998F]">
            Página{" "}
            <strong className="font-mono text-[#F4F5F2]">{paginaActual}</strong>{" "}
            de{" "}
            <strong className="font-mono text-[#F4F5F2]">{totalPaginas}</strong>{" "}
            ({totalRegistros.toLocaleString("es-SV")} equipos)
          </span>

          <div className="flex items-center gap-2">
            {paginaActual > 1 ? (
              <Link
                href={crearUrlPagina(paginaActual - 1)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#1B1E19] hover:bg-[#242821] text-xs font-medium text-[#F4F5F2] border border-[#242821]"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#131512] text-xs font-medium text-[#94998F]/40 border border-[#242821] cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </span>
            )}

            {paginaActual < totalPaginas ? (
              <Link
                href={crearUrlPagina(paginaActual + 1)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#B4F000] hover:bg-[#A3D900] text-xs font-semibold text-[#090A08]"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#131512] text-xs font-medium text-[#94998F]/40 border border-[#242821] cursor-not-allowed">
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
