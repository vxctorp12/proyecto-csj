import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ESTADOS_EQUIPO,
  TIPOS_MANTENIMIENTO,
  type PayloadNuevoMantenimiento,
} from "@/types/database";
import { obtenerFechaProximoMtto } from "@/lib/utils/semaforo";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado. Inicia sesión para registrar mantenimientos." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Partial<PayloadNuevoMantenimiento>;

    const equipo_id = body.equipo_id?.trim();
    const tecnico_id = body.tecnico_id?.trim();
    const fecha_mantenimiento = body.fecha_mantenimiento?.trim();
    const tipo_mantenimiento = body.tipo_mantenimiento;
    const estado_resultante = body.estado_resultante;
    const ubicacion_registrada = body.ubicacion_registrada?.trim() ?? "";
    const observaciones = body.observaciones?.trim() ?? "";

    if (!equipo_id || !tecnico_id || !fecha_mantenimiento) {
      return NextResponse.json(
        {
          error:
            "Los campos equipo, técnico responsable y fecha de atención son obligatorios.",
        },
        { status: 400 }
      );
    }

    if (
      !tipo_mantenimiento ||
      !TIPOS_MANTENIMIENTO.includes(tipo_mantenimiento)
    ) {
      return NextResponse.json(
        { error: "Tipo de mantenimiento inválido (Preventivo o Correctivo)." },
        { status: 400 }
      );
    }

    if (!estado_resultante || !ESTADOS_EQUIPO.includes(estado_resultante)) {
      return NextResponse.json(
        { error: "El estado resultante seleccionado no es válido." },
        { status: 400 }
      );
    }

    // 1. Insertar registro en la bitácora mantenimientos
    const { data: nuevoMtto, error: insertError } = await supabase
      .from("mantenimientos")
      .insert({
        equipo_id,
        tecnico_id,
        fecha_mantenimiento,
        tipo_mantenimiento,
        estado_resultante,
        ubicacion_registrada: ubicacion_registrada || null,
        observaciones: observaciones || null,
        created_by: tecnico_id,
        updated_by: tecnico_id,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: `Error al guardar en bitácora: ${insertError.message}`,
        },
        { status: 500 }
      );
    }

    // 2. Respaldo de sincronización del equipo (+45 días) en caso de que el trigger SQL no esté activo
    const fechaProximo = obtenerFechaProximoMtto(fecha_mantenimiento, null);
    const updateData: Record<string, string | null> = {
      estado_actual: estado_resultante,
      fecha_ultimo_mtto: fecha_mantenimiento,
      fecha_proximo_mtto: fechaProximo,
      updated_by: tecnico_id,
    };

    if (ubicacion_registrada) {
      updateData.ubicacion = ubicacion_registrada;
    }
    if (observaciones) {
      updateData.observaciones = observaciones;
    }

    await supabase.from("equipos").update(updateData).eq("id", equipo_id);

    return NextResponse.json(
      {
        mensaje:
          "Atención técnica registrada correctamente. Próximo mantenimiento programado a +45 días.",
        mantenimiento: nuevoMtto,
        fecha_proximo_mtto: fechaProximo,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error inesperado en POST /api/mantenimientos:", err);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la solicitud." },
      { status: 500 }
    );
  }
}
