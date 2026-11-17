import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Equipo, FiltrosEquipos } from "@/types/database";
import { formatearFecha, calcularSemaforoEquipo } from "@/lib/utils/semaforo";

interface OpcionesExportacionPdf {
  equipos: Equipo[];
  modo: "filtrados" | "todo";
  filtros?: FiltrosEquipos;
}

export function generarPdfEquipos({
  equipos,
  modo,
  filtros,
}: OpcionesExportacionPdf): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "letter",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const ahora = new Date();
  const fechaHoraStr = ahora.toLocaleString("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // 1. Encabezado Institucional Oscuro (#131512)
  doc.setFillColor(19, 21, 18);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Franja de acento Verde Lima (#84CC16)
  doc.setFillColor(132, 204, 22);
  doc.rect(0, 28, pageWidth, 1.8, "F");

  // Título Principal
  doc.setTextColor(244, 245, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    "SISTEMA DE GESTIÓN DE MULTIFUNCIONALES — CONTRATO 27-",
    14,
    12
  );

  // Subtítulo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(180, 240, 0);
  const subtitulo =
    modo === "todo"
      ? "REPORTE GENERAL DE INVENTARIO COMPLETO (ORDENADO POR ZONA Y CÓDIGO)"
      : "REPORTE TÉCNICO DE EQUIPOS FILTRADOS";
  doc.text(subtitulo, 14, 19);

  // Metadatos a la derecha del encabezado
  doc.setTextColor(244, 245, 242);
  doc.setFontSize(8.5);
  doc.text(`Generado: ${fechaHoraStr}`, pageWidth - 14, 12, {
    align: "right",
  });
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total Equipos en Reporte: ${equipos.length.toLocaleString("es-SV")}`,
    pageWidth - 14,
    19,
    { align: "right" }
  );

  // 2. Resumen de Filtros Aplicados (sobre fondo blanco limpio)
  let startY = 36;
  if (modo === "filtrados" && filtros) {
    const partesFiltro: string[] = [];
    if (filtros.q) partesFiltro.push(`Búsqueda: "${filtros.q}"`);
    if (filtros.zona) partesFiltro.push(`Zona: ${filtros.zona}`);
    if (filtros.modelo) partesFiltro.push(`Modelo: ${filtros.modelo}`);
    if (filtros.estado) partesFiltro.push(`Estado: ${filtros.estado}`);
    if (filtros.semaforo && filtros.semaforo !== "todos") {
      const mapSem: Record<string, string> = {
        al_dia: "Al día (> 7 días)",
        proximo_vencer: "Próximos a vencer (<= 7 días)",
        vencido: "Vencidos / Sin mtto",
      };
      partesFiltro.push(
        `Semáforo Mtto: ${mapSem[filtros.semaforo] ?? filtros.semaforo}`
      );
    }

    const textoFiltros =
      partesFiltro.length > 0
        ? `Filtros aplicados: ${partesFiltro.join("  |  ")}`
        : "Filtros aplicados: Ninguno (Vista general)";

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text(textoFiltros, 14, 35);
    startY = 39;
  }

  // 3. Construcción de filas para autoTable
  const filas = equipos.map((eq) => {
    const sem = calcularSemaforoEquipo(
      eq.fecha_ultimo_mtto,
      eq.fecha_proximo_mtto,
      eq.estado_actual
    );
    const ultimoMttoTexto = eq.fecha_ultimo_mtto
      ? `${formatearFecha(eq.fecha_ultimo_mtto)} (${sem.etiqueta})`
      : "Sin registro";

    return [
      eq.codigo_activo,
      `${eq.marca} ${eq.modelo}`,
      eq.serie || "S/N",
      eq.ubicacion,
      eq.zona,
      eq.estado_actual,
      ultimoMttoTexto,
    ];
  });

  autoTable(doc, {
    startY,
    head: [
      [
        "Código",
        "Marca / Modelo",
        "Serie",
        "Ubicación Asignada",
        "Zona",
        "Estado",
        "Último Mtto (45d)",
      ],
    ],
    body: filas,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [20, 20, 20],
      lineColor: [220, 224, 220],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [19, 21, 18],
      textColor: [180, 240, 0],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 247],
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: "bold" },
      1: { cellWidth: 38 },
      2: { cellWidth: 28 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 26 },
      5: { cellWidth: 26 },
      6: { cellWidth: 34 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Contrato 27- | Periodicidad Preventiva: 45 días — Página ${data.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: "center" }
      );
    },
  });

  const fechaArchivo = ahora.toISOString().split("T")[0];
  const sufijo = modo === "todo" ? "completo" : "filtrado";
  doc.save(`reporte-equipos-27-${sufijo}-${fechaArchivo}.pdf`);
}
