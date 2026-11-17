export type EstadoEquipo =
  | "Activo"
  | "En reparación"
  | "Pendiente de repuesto"
  | "Dado de baja"
  | "No localizado";

export type TipoMantenimiento = "Preventivo" | "Correctivo";

export type SemaforoMtto = "al_dia" | "proximo_vencer" | "vencido";

export type FiltroSemaforo = "todos" | "al_dia" | "proximo_vencer" | "vencido";

export interface Usuario {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  nombre_completo: string;
  rol: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Equipo {
  id: string;
  codigo_activo: string;
  marca: string;
  modelo: string;
  serie: string | null;
  ubicacion: string;
  zona: string;
  contrato_prefijo: string;
  estado_actual: EstadoEquipo | string;
  observaciones: string | null;
  fecha_ultimo_mtto: string | null;
  fecha_proximo_mtto: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Mantenimiento {
  id: string;
  equipo_id: string;
  tecnico_id: string;
  fecha_mantenimiento: string;
  tipo_mantenimiento: TipoMantenimiento | string;
  estado_resultante: EstadoEquipo | string;
  ubicacion_registrada: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface MantenimientoConDetalles extends Mantenimiento {
  equipos?: Pick<
    Equipo,
    "id" | "codigo_activo" | "marca" | "modelo" | "serie" | "zona" | "ubicacion"
  > | null;
  usuarios?: Pick<Usuario, "id" | "nombre_completo" | "email"> | null;
}

export interface FiltrosEquipos {
  q?: string;
  zona?: string;
  modelo?: string;
  estado?: string;
  semaforo?: FiltroSemaforo;
  page?: number;
}

export interface PayloadNuevoMantenimiento {
  equipo_id: string;
  tecnico_id: string;
  fecha_mantenimiento: string;
  tipo_mantenimiento: TipoMantenimiento;
  estado_resultante: EstadoEquipo;
  ubicacion_registrada: string;
  observaciones: string;
}

export const ESTADOS_EQUIPO: EstadoEquipo[] = [
  "Activo",
  "En reparación",
  "Pendiente de repuesto",
  "Dado de baja",
  "No localizado",
];

export const TIPOS_MANTENIMIENTO: TipoMantenimiento[] = [
  "Preventivo",
  "Correctivo",
];
