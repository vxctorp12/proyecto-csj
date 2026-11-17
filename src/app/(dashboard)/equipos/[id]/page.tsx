import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  MapPin,
  Calendar,
  History,
  Hash,
  Layers,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EstadoBadge, SemaforoBadge } from "@/components/ui/Badges";
import { RegistroMttoForm } from "@/components/equipos/RegistroMttoForm";
import {
  formatearFecha,
  obtenerFechaProximoMtto,
} from "@/lib/utils/semaforo";
import type {
  Equipo,
  Usuario,
  MantenimientoConDetalles,
} from "@/types/database";

export const dynamic = "force-dynamic";

interface EquipoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EquipoDetailPage({
  params,
}: EquipoDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [equipoRes, tecnicosRes, historialRes] = await Promise.all([
    supabase.from("equipos").select("*").eq("id", id).single(),
    supabase
      .from("usuarios")
      .select("*")
      .eq("activo", true)
      .order("nombre_completo", { ascending: true }),
    supabase
      .from("mantenimientos")
      .select("*, usuarios(id, nombre_completo, email)")
      .eq("equipo_id", id)
      .order("fecha_mantenimiento", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (equipoRes.error || !equipoRes.data) {
    notFound();
  }

  const equipo = equipoRes.data as Equipo;
  const tecnicos = (tecnicosRes.data ?? []) as Usuario[];
  const historial = (historialRes.data ?? []) as MantenimientoConDetalles[];
  const proximoCalculado = obtenerFechaProximoMtto(
    equipo.fecha_ultimo_mtto,
    equipo.fecha_proximo_mtto,
    equipo.estado_actual
  );

  return (
    <div className="space-y-6">
      {/* Navegación de regreso */}
      <div>
        <Link
          href="/equipos"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#94998F] hover:text-[#B4F000] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Directorio de Equipos
        </Link>
      </div>

      {/* Tarjeta Principal de Ficha Técnica */}
      <div className="bg-[#131512] border border-[#242821] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#242821]">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#B4F000]/15 border border-[#B4F000]/40 flex items-center justify-center text-[#B4F000] shrink-0">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#B4F000]">
                  {equipo.codigo_activo}
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#1B1E19] border border-[#242821] text-[#F4F5F2]">
                  ZONA {equipo.zona}
                </span>
                <EstadoBadge estado={equipo.estado_actual} />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[#F4F5F2] mt-1">
                {equipo.marca} {equipo.modelo}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SemaforoBadge
              fechaUltimoMtto={equipo.fecha_ultimo_mtto}
              fechaProximoMtto={equipo.fecha_proximo_mtto}
              estadoActual={equipo.estado_actual}
            />
          </div>
        </div>

        {/* Metadatos Técnicos en Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="p-3.5 rounded-xl bg-[#1B1E19]/60 border border-[#242821]">
            <div className="flex items-center gap-1.5 text-xs text-[#94998F] mb-1">
              <Hash className="w-3.5 h-3.5 text-[#B4F000]" />
              <span>Número de Serie</span>
            </div>
            <p className="font-mono text-sm font-semibold text-[#F4F5F2]">
              {equipo.serie || "S/N"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1B1E19]/60 border border-[#242821]">
            <div className="flex items-center gap-1.5 text-xs text-[#94998F] mb-1">
              <Layers className="w-3.5 h-3.5 text-[#B4F000]" />
              <span>Marca / Modelo</span>
            </div>
            <p className="text-sm font-semibold text-[#F4F5F2]">
              {equipo.marca} — {equipo.modelo}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1B1E19]/60 border border-[#242821]">
            <div className="flex items-center gap-1.5 text-xs text-[#94998F] mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#B4F000]" />
              <span>Último Mantenimiento</span>
            </div>
            <p className="font-mono text-sm font-semibold text-[#F4F5F2]">
              {formatearFecha(equipo.fecha_ultimo_mtto)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1B1E19]/60 border border-[#242821]">
            <div className="flex items-center gap-1.5 text-xs text-[#94998F] mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#B4F000]" />
              <span>Próximo Mtto (+45 días)</span>
            </div>
            <p className="font-mono text-sm font-bold text-[#B4F000]">
              {formatearFecha(proximoCalculado)}
            </p>
          </div>
        </div>

        {/* Ubicación Actual Completa */}
        <div className="mt-4 p-4 rounded-xl bg-[#1B1E19]/80 border border-[#242821] flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#B4F000] shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-[#94998F]">
              Ubicación / Dependencia Asignada
            </span>
            <p className="text-sm sm:text-base font-medium text-[#F4F5F2] mt-0.5">
              {equipo.ubicacion}
            </p>
            {equipo.observaciones && (
              <p className="text-xs text-[#94998F] mt-1">
                Última nota: {equipo.observaciones}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Layout 2 Columnas: Formulario de Atención + Historial Cronológico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Formulario de Registro */}
        <div className="lg:col-span-5">
          <RegistroMttoForm equipo={equipo} tecnicos={tecnicos} />
        </div>

        {/* Columna Derecha: Historial Cronológico del Equipo */}
        <div className="lg:col-span-7">
          <div className="bg-[#131512] border border-[#242821] rounded-2xl p-5 sm:p-6 h-full">
            <div className="flex items-center justify-between border-b border-[#242821] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B1E19] border border-[#242821] flex items-center justify-center text-[#B4F000]">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#F4F5F2]">
                    Historial de Mantenimientos del Equipo
                  </h2>
                  <p className="text-xs text-[#94998F]">
                    Bitácora cronológica descendente de intervenciones realizadas
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs px-3 py-1 rounded-full bg-[#1B1E19] border border-[#242821] text-[#B4F000]">
                {historial.length} {historial.length === 1 ? "registro" : "registros"}
              </span>
            </div>

            {historial.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl bg-[#1B1E19]/40 border border-dashed border-[#242821]">
                <p className="text-sm font-medium text-[#F4F5F2]">
                  Este multifuncional aún no registra atenciones técnicas
                </p>
                <p className="text-xs text-[#94998F] mt-1">
                  Completa el formulario adjunto para registrar su primer servicio preventivo o correctivo.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historial.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#1B1E19]/60 border border-[#242821] space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[#B4F000]">
                          {formatearFecha(item.fecha_mantenimiento)}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#131512] border border-[#242821] text-[#F4F5F2]">
                          {item.tipo_mantenimiento}
                        </span>
                      </div>
                      <EstadoBadge estado={item.estado_resultante} />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#F4F5F2]">
                      <User className="w-3.5 h-3.5 text-[#B4F000]" />
                      <span className="text-[#94998F]">Técnico:</span>
                      <span className="font-semibold">
                        {item.usuarios?.nombre_completo ?? "Técnico registrado"}
                      </span>
                    </div>

                    {item.ubicacion_registrada && (
                      <div className="flex items-start gap-2 text-xs text-[#94998F]">
                        <MapPin className="w-3.5 h-3.5 text-[#94998F] shrink-0 mt-0.5" />
                        <span>Ubicación: {item.ubicacion_registrada}</span>
                      </div>
                    )}

                    {item.observaciones && (
                      <div className="p-3 rounded-lg bg-[#131512] border border-[#242821] text-xs text-[#F4F5F2]">
                        {item.observaciones}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
