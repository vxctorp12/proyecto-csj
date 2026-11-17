# Sistema de Gestión y Bitácora de Mantenimiento de Multifuncionales (Contrato 27-)

Aplicación web construida con **Next.js 16 (App Router)**, **TypeScript estricto**, **Tailwind CSS** y **Supabase (PostgreSQL + Auth)** para gestionar el inventario de +1,000 impresoras multifuncionales del contrato con prefijo `27-`, controlar el semáforo de mantenimiento preventivo cada **45 días**, registrar intervenciones técnicas en campo y exportar reportes en **PDF**.

## Características Principales

- **Autenticación y Seguridad (`/login` + Middleware SSR):** Protección de rutas privadas y API con `@supabase/ssr`.
- **Dashboard Operativo (`/`):** Tarjetas KPI en tiempo real con el total del parque, equipos al día, próximos a vencer ($\le 7$ días), vencidos/sin registro, desglose por estado, distribución por zona geográfica y últimas atenciones.
- **Directorio Paginado (`/equipos`):**
  - Paginación del lado del servidor (25 equipos por página) optimizada para +1,000 registros.
  - Buscador omnicanal con debounce (`useState` + `useEffect` a 350ms) por `codigo_activo`, `serie` o `ubicacion`.
  - Filtros combinados por Zona, Modelo, Estado Operativo y Semáforo Preventivo (45 días).
  - Vista adaptativa: tabla densa en escritorio y tarjetas táctiles en dispositivos móviles.
  - **Exportación a PDF (`jspdf` + `jspdf-autotable`):** Exportación de equipos filtrados o del inventario completo.
- **Ficha Técnica y Registro de Atención (`/equipos/[id]`):**
  - Detalle técnico completo del multifuncional y cálculo automático de `fecha_proximo_mtto = fecha_mantenimiento + 45 días`.
  - Formulario de registro conectado a `POST /api/mantenimientos` con `<select>` del catálogo de técnicos activos (`usuarios`), actualización de ubicación en campo y estado del equipo.
  - Historial cronológico descendente de intervenciones del equipo.
- **Bitácora Global (`/mantenimientos`):** Historial auditable filtrable por técnico, tipo de mantenimiento y rango de fechas.

## Configuración Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
   ```

3. Ejecutar servidor de desarrollo:
   ```bash
   npm run dev
   ```
