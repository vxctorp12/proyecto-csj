# Proceso de Desarrollo con IA — Vibe Coding (`VIBE_CODING.md`)

**Proyecto:** Sistema de Gestión y Bitácora de Mantenimiento de Multifuncionales (Contrato 27-)  
**Stack Tecnológico:** Next.js 16 (App Router), TypeScript (`strict: true`), Tailwind CSS 4, Supabase (PostgreSQL + Auth + RLS), jsPDF + autoTable, Lucide React.

---

## 1. Prompts Principales Utilizados

El desarrollo siguió una metodología de **Ingeniería de Contexto (Context-First Vibe Coding)**: antes de generar código, se estructuró un documento maestro de especificación técnica (`CLAUDE.md`) y se iteró mediante prompts conversacionales específicos.

### Prompt 1 — Especificación Maestra e Inicialización (`CLAUDE.md`)
> *"Revisa el archivo de especificación (`CLAUDE.md`), el cual define la arquitectura, reglas de negocio, esquema de base de datos, sistema de diseño UI/UX (Dark Fintech `#090A08` / `#B4F000`) y plan de ejecución iterativa para construir una aplicación web con Next.js 16+ (App Router) y TypeScript, utilizando Supabase como backend serverless y desplegada en Vercel. Comienza a trabajar y hazme las preguntas que necesites."*

### Prompt 2 — Conexión con Supabase y Ejecución por Fases
> *"Revisa nuevamente el archivo de especificación ya completado con las secciones funcionales, estructura de carpetas y plan de ejecución en 6 fases. Configura las credenciales de Supabase (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) y construye los módulos verificando cero errores de TypeScript."*

### Prompt 3 — Diagnóstico de Datos tras Inicio de Sesión (RLS)
> *"Me dejó iniciar sesión con Supabase Auth, pero al parecer en el Directorio de Equipos (`/equipos`) muestra 0 equipos encontrados a pesar de haber cargado el inventario en la base de datos."*

### Prompt 4 — Refinamiento de Reglas de Negocio en Campo y Normalización de Inputs
> *"En estado del equipo solo manejaremos dos estados: `Activo` y `Dado de baja`. En el caso de que se seleccione un equipo como `Dado de baja`, no sería necesario indicar si se trata de un mantenimiento preventivo o correctivo, y tampoco es necesario que se programe una próxima visita. Además, agrega `UPPERCASE` automático en los inputs de texto."*

---

## 2. Iteraciones Realizadas con la IA

El desarrollo se dividió en iteraciones incrementales, cada una respaldada por su respectivo commit atómico en Git:

| Iteración | Fase / Objetivo | Resultado y Archivos Clave | Commit |
| :--- | :--- | :--- | :--- |
| **Iteración 1** | Clarificación de requerimientos y scaffolding | Alineación sobre el estado del proyecto en Supabase, carga previa de los +1,000 equipos del contrato `27-` y los 24 técnicos, e inicialización de Next.js 16 + TypeScript. | `f1f136a` |
| **Iteración 2** | **Fase 1:** Sistema de Diseño y Utilidades | Configuración de fuentes `Plus Jakarta Sans` y `JetBrains Mono`, paleta Dark Fintech en `globals.css`, clientes `@supabase/ssr`, tipos estrictos (`src/types/database.ts`) y lógica del semáforo de 45 días (`src/lib/utils/semaforo.ts`). | `f1f136a` |
| **Iteración 3** | **Fase 2:** Autenticación y Seguridad SSR | Creación de `/login` con Supabase Auth, barra de navegación con cierre de sesión y protección de rutas privadas y API mediante `src/middleware.ts`. | `10caabb` |
| **Iteración 4** | **Fase 3:** Dashboard Operativo (`/`) | Tarjetas KPI en Server Components con conteo exacto del parque total, semáforo de vencimiento (al día, próximos $\le 7$ días, vencidos), distribución por zona geográfica y tabla de última actividad. | `b357e9c` |
| **Iteración 5** | **Fase 4:** Directorio (`/equipos`) y Exportación PDF | Paginación del lado del servidor (25 equipos/página), buscador omnicanal con debounce de 350ms (`useState` + `useEffect`), filtros combinados, diseño adaptativo (tabla desktop / cards móvil) y exportación a PDF filtrada o completa (`jspdf-autotable`). | `cb65e40` |
| **Iteración 6** | **Fase 5:** Ficha Técnica, Atención en Campo y Bitácora | Vista `/equipos/[id]` con historial cronológico, formulario de registro con `<select>` de técnicos activos, Route Handler `POST /api/mantenimientos` y bitácora auditable `/mantenimientos`. | `fd63afc` |
| **Iteración 7** | **Fase 6:** Resiliencia UI y Compilación | Implementación de skeletons (`loading.tsx`) y límites de error (`error.tsx`), validación con `npx tsc --noEmit` y `npm run build`. | `b1d9377` |
| **Iteración 8** | Políticas RLS en PostgreSQL | Diagnóstico de consulta vacía por Row Level Security activo en Supabase y creación de políticas `SELECT` / `ALL` para el rol `authenticated` en `supabase/schema.sql`. | `b4ca161` |
| **Iteración 9** | Regla de Baja de Equipos e Inputs en Mayúsculas | Simplificación de estados a `Activo` y `Dado de baja`, omisión de próxima visita (`fecha_proximo_mtto = null`) y de tipo Preventivo/Correctivo cuando un equipo se da de baja, y conversión automática a `UPPERCASE` en los inputs. | `0343af1` |

---

## 3. Decisiones Técnicas Tomadas

1. **Arquitectura Híbrida (Server Components vs. Client Components):**
   - **Server Components (`page.tsx` en `/`, `/equipos`, `/equipos/[id]`, `/mantenimientos`):** Se eligieron para ejecutar las consultas a Supabase directamente desde el servidor, reduciendo el JavaScript enviado al navegador en teléfonos móviles de los técnicos de campo y protegiendo la lógica de consulta.
   - **Client Components (`"use client"` en `EquiposToolbar.tsx`, `RegistroMttoForm.tsx`, `Navbar.tsx`, `login/page.tsx`):** Reservados exclusivamente para interactividad en el navegador: manejo de estado con `useState`, debounce de búsqueda con `useEffect`, envío de formularios y generación de archivos PDF con `jsPDF`.

2. **Rendimiento y Escalabilidad para +1,000 Equipos en Supabase:**
   - En lugar de descargar los +1,000 registros en el cliente, el directorio `/equipos` utiliza paginación en PostgreSQL mediante `.range(desde, hasta)` de 25 en 25 registros, aplicando `.or()` con `.ilike()` y `.eq()` directamente sobre los índices de la base de datos.
   - En el Dashboard (`/`), los KPIs utilizan `{ count: "exact", head: true }` en consultas paralelas (`Promise.all`) para obtener conteos exactos sin transferir filas innecesarias.

3. **Doble Garantía en la Regla de Negocio de 45 Días:**
   - La regla `fecha_proximo_mtto = fecha_mantenimiento + 45 días` (para equipos activos) y `fecha_proximo_mtto = NULL` (para equipos dados de baja) se implementó tanto en el **Trigger de PostgreSQL** (`fn_sincronizar_equipo_tras_mtto`) como en el **Route Handler** (`POST /api/mantenimientos`), asegurando consistencia total incluso si se insertan datos desde distintas fuentes.

4. **Separación entre Usuarios de Autenticación y Catálogo de Técnicos:**
   - Se vinculó el acceso al sistema mediante `Supabase Auth` (`/login`), mientras que el catálogo de los 24 técnicos operativos reside en la tabla `usuarios`, permitiendo seleccionar rápidamente al técnico responsable en campo mediante un `<select>` ordenado alfabéticamente.

5. **Estética Visual Dark Fintech de Alto Contraste:**
   - Se implementó una paleta oscura (`#090A08` y `#131512`) con acentos en verde lima eléctrico (`#B4F000`) y tipografía monoespaciada `JetBrains Mono` para series, códigos de activo (`27-XXXX`) y fechas, mejorando la legibilidad en campo y evitando errores de lectura de códigos de serie.

---

## 4. Desafíos Encontrados y Cómo Fueron Resueltos con Apoyo de IA

### Desafío 1: Directorio mostraba "0 equipos encontrados" tras iniciar sesión
* **Causa:** Aunque las tablas `equipos`, `usuarios` y `mantenimientos` ya tenían datos cargados en Supabase y las credenciales eran válidas, Supabase tenía habilitado **Row Level Security (RLS)** sin políticas definidas para el rol `authenticated`. Por seguridad, PostgreSQL devolvía `data: []` y `count: 0` con código `200 OK` sin arrojar error.
* **Solución con IA:** La IA ejecutó una prueba de diagnóstico directa contra el endpoint de Supabase, identificó que la respuesta era `200 OK` con arreglo vacío (típico de bloqueo silencioso por RLS) y generó el bloque SQL con las políticas `CREATE POLICY ... TO authenticated USING (true) WITH CHECK (true)` para las tres tablas. Al ejecutarlas en el SQL Editor, los +1,000 equipos aparecieron de inmediato.

### Desafío 2: Límite por defecto de 1,000 registros de PostgREST en exportaciones y métricas
* **Causa:** Supabase limita por defecto las consultas `.select()` a 1,000 filas, lo cual truncaría el reporte PDF de "Exportar Todo" y las estadísticas por zona de un contrato que supera los 1,000 multifuncionales.
* **Solución con IA:** Se utilizaron conteos en cabecera (`{ count: "exact", head: true }`) para los indicadores del Dashboard y rangos explícitos (`.range(0, 4999)`) en las consultas de exportación a PDF y agrupación regional.

### Desafío 3: Cumplimiento de TypeScript Estricto (`strict: true`) con `@supabase/ssr`
* **Causa:** Al ejecutar `npx tsc --noEmit`, el método `setAll(cookiesToSet)` de `@supabase/ssr` en `server.ts` y `middleware.ts` generaba error `TS7006` por tipos `any` implícitos en los parámetros de cookies.
* **Solución con IA:** Se importó el tipo `CookieOptions` desde `@supabase/ssr` y se definió la interfaz explícita `CookieToSet { name: string; value: string; options: CookieOptions }`, logrando compilación limpia con cero errores.

### Desafío 4: Caso especial de negocio para equipos "Dado de baja"
* **Causa:** Inicialmente todos los mantenimientos sumaban 45 días para la próxima visita y exigían elegir entre Preventivo o Correctivo. Sin embargo, en la operación real, cuando un equipo pasa a estado `Dado de baja`, no aplica clasificarlo como preventivo/correctivo ni programar una visita futura ni contarlo como equipo vencido.
* **Solución con IA:** Se refactorizó dinámicamente `RegistroMttoForm.tsx`, el endpoint `/api/mantenimientos` y `semaforo.ts` para que al seleccionar `Dado de baja` se oculte el selector de tipo de servicio, se registre automáticamente como `"Baja de equipo"`, se asigne `fecha_proximo_mtto = null` y se excluya de las alertas de vencimiento en el Dashboard y filtros.
