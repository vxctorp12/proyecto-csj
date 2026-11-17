"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Calendar,
  UserCheck,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  ESTADOS_EQUIPO,
  TIPOS_MANTENIMIENTO,
  type Equipo,
  type EstadoEquipo,
  type Usuario,
} from "@/types/database";
import {
  obtenerFechaProximoMtto,
  formatearFecha,
} from "@/lib/utils/semaforo";

interface RegistroMttoFormProps {
  equipo: Equipo;
  tecnicos: Usuario[];
}

export function RegistroMttoForm({ equipo, tecnicos }: RegistroMttoFormProps) {
  const router = useRouter();

  const hoyLocal = new Date();
  const hoyIso = `${hoyLocal.getFullYear()}-${String(
    hoyLocal.getMonth() + 1
  ).padStart(2, "0")}-${String(hoyLocal.getDate()).padStart(2, "0")}`;

  const [tecnicoId, setTecnicoId] = useState<string>("");
  const [fechaMantenimiento, setFechaMantenimiento] = useState<string>(hoyIso);
  const [estadoResultante, setEstadoResultante] = useState<EstadoEquipo>(
    (ESTADOS_EQUIPO.includes(equipo.estado_actual as EstadoEquipo)
      ? equipo.estado_actual
      : "Activo") as EstadoEquipo
  );
  const [tipoMantenimiento, setTipoMantenimiento] = useState<
    "Preventivo" | "Correctivo"
  >("Preventivo");
  const [ubicacionRegistrada, setUbicacionRegistrada] = useState<string>(
    (equipo.ubicacion || "").toUpperCase()
  );
  const [observaciones, setObservaciones] = useState<string>("");

  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);

  const esDadoDeBaja = estadoResultante === "Dado de baja";

  // Sincronizar si el equipo cambia tras router.refresh()
  useEffect(() => {
    setUbicacionRegistrada((equipo.ubicacion || "").toUpperCase());
    if (ESTADOS_EQUIPO.includes(equipo.estado_actual as EstadoEquipo)) {
      setEstadoResultante(equipo.estado_actual as EstadoEquipo);
    }
  }, [equipo.ubicacion, equipo.estado_actual]);

  const fechaProximoEstimada = esDadoDeBaja
    ? null
    : obtenerFechaProximoMtto(fechaMantenimiento, null, estadoResultante);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setExitoMsg(null);

    if (!tecnicoId) {
      setErrorMsg("Debes seleccionar el técnico que realizó la atención.");
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch("/api/mantenimientos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipo_id: equipo.id,
          tecnico_id: tecnicoId,
          fecha_mantenimiento: fechaMantenimiento,
          tipo_mantenimiento: esDadoDeBaja
            ? "Baja de equipo"
            : tipoMantenimiento,
          estado_resultante: estadoResultante,
          ubicacion_registrada: ubicacionRegistrada.toUpperCase(),
          observaciones: observaciones.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || "No fue posible registrar el mantenimiento.");
        setEnviando(false);
        return;
      }

      setExitoMsg(
        data.mensaje ||
          (esDadoDeBaja
            ? "Equipo registrado como Dado de baja (sin programación de próxima visita)."
            : "Atención técnica guardada y próximo mantenimiento programado (+45 días).")
      );
      setObservaciones("");
      router.refresh();
    } catch {
      setErrorMsg("Error de red al conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="bg-[#131512] border border-[#242821] rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[#242821] pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#B4F000]/15 border border-[#B4F000]/40 flex items-center justify-center text-[#B4F000]">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F4F5F2]">
              Registrar Atención Técnica en Campo
            </h2>
            <p className="text-xs text-[#94998F]">
              Actualiza automáticamente el estado y sincroniza la ficha del equipo.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-[rgba(248,113,113,0.12)] border border-[rgba(248,113,113,0.3)] flex items-start gap-2.5 text-[#F87171] text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {exitoMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-[rgba(180,240,0,0.12)] border border-[rgba(180,240,0,0.3)] flex items-start gap-2.5 text-[#B4F000] text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{exitoMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Técnico Responsable */}
        <div>
          <label
            htmlFor="tecnico_id"
            className="block text-xs font-medium uppercase tracking-wider text-[#94998F] mb-1.5"
          >
            Técnico Responsable <span className="text-[#B4F000]">*</span>
          </label>
          <div className="relative">
            <UserCheck className="w-4 h-4 text-[#94998F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              id="tecnico_id"
              required
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1B1E19] border border-[#242821] text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
            >
              <option value="">Selecciona al técnico de campo...</option>
              {tecnicos.map((tec) => (
                <option key={tec.id} value={tec.id}>
                  {tec.nombre_completo}
                </option>
              ))}
            </select>
          </div>
          {tecnicos.length === 0 && (
            <p className="text-[11px] text-[#FBBF24] mt-1">
              Nota: No se encontraron técnicos activos en la tabla `usuarios`.
            </p>
          )}
        </div>

        {/* Estado Resultante del Equipo (Activo | Dado de baja) */}
        <div>
          <label
            htmlFor="estado_resultante"
            className="block text-xs font-medium uppercase tracking-wider text-[#94998F] mb-1.5"
          >
            Estado del Equipo
          </label>
          <select
            id="estado_resultante"
            value={estadoResultante}
            onChange={(e) =>
              setEstadoResultante(e.target.value as EstadoEquipo)
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1E19] border border-[#242821] text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
          >
            {ESTADOS_EQUIPO.map((est) => (
              <option key={est} value={est}>
                {est}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha de Atención + Tipo de Servicio (solo si está Activo) */}
        <div
          className={`grid grid-cols-1 ${
            esDadoDeBaja ? "" : "sm:grid-cols-2"
          } gap-4`}
        >
          <div>
            <label
              htmlFor="fecha_mantenimiento"
              className="block text-xs font-medium uppercase tracking-wider text-[#94998F] mb-1.5"
            >
              Fecha de Atención <span className="text-[#B4F000]">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#94998F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="fecha_mantenimiento"
                type="date"
                required
                value={fechaMantenimiento}
                onChange={(e) => setFechaMantenimiento(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1B1E19] border border-[#242821] font-mono text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
              />
            </div>
          </div>

          {!esDadoDeBaja && (
            <div>
              <label
                htmlFor="tipo_mantenimiento"
                className="block text-xs font-medium uppercase tracking-wider text-[#94998F] mb-1.5"
              >
                Tipo de Servicio
              </label>
              <select
                id="tipo_mantenimiento"
                value={tipoMantenimiento}
                onChange={(e) =>
                  setTipoMantenimiento(
                    e.target.value as "Preventivo" | "Correctivo"
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1E19] border border-[#242821] text-sm text-[#F4F5F2] focus:outline-none focus:border-[#B4F000]"
              >
                {TIPOS_MANTENIMIENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Ubicación Actual Editable (UPPERCASE) */}
        <div>
          <label
            htmlFor="ubicacion_registrada"
            className="block text-xs font-medium uppercase tracking-wider text-[#94998F] mb-1.5"
          >
            Ubicación / Dependencia Actual (Editable si cambió en campo)
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#94998F] absolute left-3.5 top-3" />
            <input
              id="ubicacion_registrada"
              type="text"
              required
              value={ubicacionRegistrada}
              onChange={(e) =>
                setUbicacionRegistrada(e.target.value.toUpperCase())
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1B1E19] border border-[#242821] text-sm text-[#F4F5F2] uppercase focus:outline-none focus:border-[#B4F000]"
            />
          </div>
        </div>

        {/* Observaciones Técnicas (UPPERCASE) */}
        <div>
          <label
            htmlFor="observaciones"
            className="block text-xs font-medium uppercase tracking-wider text-[#94998F] mb-1.5"
          >
            Observaciones Técnicas / Repuestos / Contadores
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-[#94998F] absolute left-3.5 top-3" />
            <textarea
              id="observaciones"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value.toUpperCase())}
              placeholder="EJ. LIMPIEZA ÓPTICA, AJUSTE DE RODILLOS DE ALIMENTACIÓN, CAMBIO DE UNIDAD DE IMAGEN O TÓNER..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1B1E19] border border-[#242821] text-sm text-[#F4F5F2] uppercase placeholder-[#94998F]/50 focus:outline-none focus:border-[#B4F000]"
            />
          </div>
        </div>

        {/* Resumen cálculo automático +45 días o Baja */}
        <div className="p-3.5 rounded-xl bg-[#1B1E19]/70 border border-[#242821] flex items-center justify-between text-xs">
          <span className="text-[#94998F]">
            Próxima visita programada:
          </span>
          {esDadoDeBaja ? (
            <span className="font-mono font-semibold text-[#F87171]">
              NO APLICA (DADO DE BAJA)
            </span>
          ) : (
            <span className="font-mono font-bold text-[#B4F000]">
              {formatearFecha(fechaProximoEstimada)} (+45 días)
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-[#B4F000] hover:bg-[#A3D900] text-[#090A08] font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {enviando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando en Bitácora...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Guardar Atención y Actualizar Equipo
            </>
          )}
        </button>
      </form>
    </div>
  );
}
