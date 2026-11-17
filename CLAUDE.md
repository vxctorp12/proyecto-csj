# CLAUDE.md — Sistema de Gestión y Bitácora de Mantenimiento de Multifuncionales (Contrato 27-)

Este documento define la arquitectura, reglas de negocio, esquema de base de datos, sistema de diseño UI/UX y plan de ejecución iterativa para construir una aplicación web funcional con **Next.js 16+ (App Router)** y **TypeScript**, utilizando **Supabase** como backend serverless y desplegada en **Vercel**.

---

## 1. Contexto y Objetivo del Sistema

* **Propósito operativo:** Reemplazar la búsqueda manual en hojas de Excel por una herramienta web rápida y responsive para ubicar impresoras multifuncionales del contrato con prefijo `27-` (+1,000 equipos), consultar su estado, registrar atenciones técnicas en campo y exportar reportes en PDF.
* **Regla de negocio principal (Periodicidad):** Todo equipo del contrato `27-` requiere mantenimiento preventivo cada **45 días (1.5 meses)**. Al registrar una atención técnica, el sistema debe actualizar automáticamente el estado del equipo, su ubicación (si cambió en campo) y calcular `fecha_proximo_mtto = fecha_mantenimiento + 45 días`.
* **Separación de Autenticación vs. Catálogo Operativo:**
  * **Supabase Auth:** Controla el inicio de sesión (`/login`) para los usuarios autorizados a operar la aplicación.
  * **Tabla `usuarios`:** Contiene el catálogo completo de los 24 técnicos de campo para ser seleccionados mediante un `<select>` al momento de registrar un servicio técnico.

---

## 2. Requisitos Obligatorios de la Actividad Académica (Checklist de Cumplimiento)

El código generado DEBE cumplir estrictamente con cada uno de estos puntos:

1. **Framework y Versión:** Next.js 16 o superior utilizando **App Router** (`src/app/...`).
2. **Lenguaje:** **TypeScript** estricto (`strict: true`), sin uso de `any` implícitos.
3. **Estilos y Responsividad:** **Tailwind CSS** con diseño **100% responsive** (adaptado tanto a teléfonos móviles en campo como a pantallas de escritorio).
4. **Rutas Mínimas (5 rutas implementadas):**
   * `/login` — Inicio de sesión con Supabase Auth (pública; redirige a `/` si ya hay sesión).
   * `/` — Dashboard operativo con métricas clave (total de equipos, al día, próximos a vencer, vencidos, por estado y última actividad).
   * `/equipos` — Directorio paginado de +1,000 equipos con buscador instantáneo, filtros combinados y exportación a PDF.
   * `/equipos/[id]` — Ficha técnica del multifuncional, edición rápida de ubicación/estado, formulario de registro de atención técnica e historial cronológico de mantenimientos.
   * `/mantenimientos` — Bitácora global de servicios técnicos realizados, filtrable por técnico y rango de fechas.
5. **Renderizado Híbrido:** Uso combinado y justificado de **Server Components** (carga inicial de métricas, fichas e historial) y **Client Components** (`"use client"` para buscador, filtros, modales, formularios y exportación PDF).
6. **Hooks de React:** Uso explícito y bien estructurado de `useState` y `useEffect` (ej. debounce de búsqueda, sincronización de filtros y estados de formularios).
7. **Consumo de Datos / API:** Conexión con **Supabase** (PostgreSQL + Auth) y **Route Handlers** internos (`src/app/api/.../route.ts`) para operaciones de mutación/validación.
8. **Resiliencia UI:** Implementación explícita de estados de carga (`loading.tsx` con skeletons) y manejo de errores (`error.tsx` y feedback visual en formularios).
9. **Variables de Entorno:** Credenciales gestionadas únicamente mediante `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
10. **Control de Versiones y Despliegue:** Commits atómicos y progresivos en **GitHub** listos para despliegue en **Vercel**.

---

## 3. Sistema de Diseño Visual (Estética Dark Fintech / Cyber-Industrial)

La interfaz debe seguir una estética oscura de alto contraste inspirada en plataformas financieras modernas:

* **Paleta de Colores:**
  * **Fondo principal (`bg-app`):** Negro obsidiana `#090A08` con resplandores radiales sutiles en verde lima (`radial-gradient` con `rgba(180, 240, 0, 0.08)`) en la cabecera del Dashboard y Login.
  * **Superficie de tarjetas / contenedores (`bg-card`):** Gris carbón `#131512` con borde fino `#242821` (`border border-[#242821]`).
  * **Superficie elevada / inputs / hover:** `#1B1E19` con borde activo `#B4F000`.
  * **Acento primario (CTAs, botones principales, badges activos):** Verde lima eléctrico `#B4F000` (hover `#A3D900`) con texto en negro profundo `#090A08` y `font-semibold`.
  * **Tipografía:**
    * Texto principal: `#F4F5F2` (Blanco hueso).
    * Texto secundario / etiquetas: `#94998F` (Gris neutro).
    * **Fuente UI:** `Plus Jakarta Sans` (`next/font/google`).
    * **Fuente Técnica (Monospace):** `JetBrains Mono` obligatoria para `codigo_activo` (`27-6427`), `serie` (`W2Z7603074`) y fechas.
* **Semáforo de Mantenimiento y Estados (Badges tipo píldora `rounded-full`):**
  * **Al día / Activo:** Fondo `rgba(180, 240, 0, 0.12)`, texto `#B4F000`, borde `rgba(180, 240, 0, 0.3)`.
  * **Próximo a vencer (<= 7 días) / En reparación / Pendiente de repuesto:** Fondo `rgba(251, 191, 36, 0.12)`, texto `#FBBF24`, borde `rgba(251, 191, 36, 0.3)`.
  * **Vencido / Sin registro / Dado de baja / No localizado:** Fondo `rgba(248, 113, 113, 0.12)`, texto `#F87171`, borde `rgba(248, 113, 113, 0.3)`.
* **Navegación:** Navbar superior limpia y fija (`backdrop-blur-md bg-[#090A08]/80 border-b border-[#242821]`) con logo a la izquierda, enlaces de navegación al centro y botón de cierre de sesión estilo píldora (`rounded-full`) a la derecha.

---

## 4. Esquema de Base de Datos (PostgreSQL / Supabase)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función genérica de auditoría para updated_at
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. TABLA USUARIOS (Catálogo de técnicos + vínculo opcional con Supabase Auth)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(150) UNIQUE NULL,
    nombre_completo VARCHAR(120) NOT NULL UNIQUE,
    rol VARCHAR(30) NOT NULL DEFAULT 'tecnico',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL,
    updated_by UUID NULL
);

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 2. TABLA EQUIPOS (Inventario precargado Contrato 27-)
CREATE TABLE equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_activo VARCHAR(50) NOT NULL UNIQUE,
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    serie VARCHAR(100) NULL,
    ubicacion TEXT NOT NULL,
    zona VARCHAR(100) NOT NULL,
    contrato_prefijo VARCHAR(10) NOT NULL DEFAULT '27',
    estado_actual VARCHAR(40) NOT NULL DEFAULT 'Activo',
    observaciones TEXT NULL,
    fecha_ultimo_mtto DATE NULL,
    fecha_proximo_mtto DATE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    updated_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_equipos_codigo_activo ON equipos(codigo_activo);
CREATE INDEX idx_equipos_serie ON equipos(serie);
CREATE INDEX idx_equipos_modelo ON equipos(modelo);
CREATE INDEX idx_equipos_zona ON equipos(zona);
CREATE INDEX idx_equipos_estado ON equipos(estado_actual);
CREATE INDEX idx_equipos_proximo_mtto ON equipos(fecha_proximo_mtto);

CREATE TRIGGER trg_equipos_updated_at
BEFORE UPDATE ON equipos
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 3. TABLA MANTENIMIENTOS (Bitácora e historial técnico por equipo)
CREATE TABLE mantenimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    tecnico_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_mantenimiento DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_mantenimiento VARCHAR(30) NOT NULL DEFAULT 'Preventivo',
    estado_resultante VARCHAR(40) NOT NULL,
    ubicacion_registrada TEXT NULL,
    observaciones TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    updated_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_mantenimientos_equipo_id ON mantenimientos(equipo_id);
CREATE INDEX idx_mantenimientos_tecnico_id ON mantenimientos(tecnico_id);
CREATE INDEX idx_mantenimientos_fecha ON mantenimientos(fecha_mantenimiento DESC);

CREATE TRIGGER trg_mantenimientos_updated_at
BEFORE UPDATE ON mantenimientos
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- TRIGGER DE NEGOCIO: Sincroniza equipo y suma 45 días al próximo mtto tras registrar servicio
CREATE OR REPLACE FUNCTION fn_sincronizar_equipo_tras_mtto()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE equipos
    SET 
        estado_actual = NEW.estado_resultante,
        fecha_ultimo_mtto = NEW.fecha_mantenimiento,
        fecha_proximo_mtto = (NEW.fecha_mantenimiento + INTERVAL '45 days')::DATE,
        ubicacion = COALESCE(NULLIF(TRIM(NEW.ubicacion_registrada), ''), ubicacion),
        observaciones = COALESCE(NULLIF(TRIM(NEW.observaciones), ''), observaciones),
        updated_by = NEW.tecnico_id
    WHERE id = NEW.equipo_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_insert_mantenimiento
AFTER INSERT ON mantenimientos
FOR EACH ROW EXECUTE FUNCTION fn_sincronizar_equipo_tras_mtto();
```

---

## 5. Especificación Funcional por Módulo

### A. Autenticación (`/login` y Middleware)
* Utilizar `@supabase/ssr` para manejo seguro de cookies y sesión en Server/Client Components.
* Proteger todas las rutas (`/`, `/equipos`, `/equipos/[id]`, `/mantenimientos`, `/api/*`) redirigiendo a `/login` si no existe una sesión activa en Supabase Auth.

### B. Directorio de Equipos (`/equipos`)
* **Rendimiento para +1,000 filas:** Implementar paginación del lado del servidor/Supabase (25 registros por página) y consultas filtradas directamente en PostgreSQL (`.ilike()`, `.eq()`), evitando descargar toda la tabla de golpe en la navegación normal.
* **Buscador omnicanal (`useState` + `useEffect` con debounce de 350ms):** Busca simultáneamente por `codigo_activo` (ej. `27-6427`), `serie` (ej. `W2Z7603074`) o texto dentro de `ubicacion` (ej. `Cámara Primera`).
* **Filtros combinados:**
  * **Zona** (valores dinámicos distintos desde `equipos`, ej. CENTRAL, OCCIDENTAL, ORIENTAL, etc.).
  * **Modelo** (ej. FS-3640MFP, FS-3140MFP, Taskalfa 6002i).
  * **Estado** (`Activo`, `En reparación`, `Pendiente de repuesto`, `Dado de baja`, `No localizado`).
  * **Semáforo Mtto** (`Todos`, `Al día`, `Próximos a vencer`, `Vencidos / Sin mtto`).
* **Vista Adaptativa (Responsive):** Tabla densa y limpia en escritorio (`md:table`) y tarjetas táctiles apiladas en móvil (`md:hidden`) con botón directo "Registrar Atención" en cada equipo.

### C. Registro de Atención Técnica y Ficha (`/equipos/[id]`)
* Muestra ficha completa del multifuncional (`codigo_activo`, `marca`, `modelo`, `serie`, `ubicacion`, `zona`, `estado_actual`, `fecha_ultimo_mtto`, `fecha_proximo_mtto`).
* **Formulario de Atención Técnica (Client Component + Route Handler `POST /api/mantenimientos`):**
  * **Técnico (`<select>` obligatorio):** Lista ordenada alfabéticamente de `usuarios` donde `activo = true`.
  * **Fecha de atención (`<input type="date">`):** Por defecto la fecha actual (`YYYY-MM-DD`).
  * **Tipo de servicio:** `Preventivo` o `Correctivo`.
  * **Estado del equipo (`<select>`):** Precargado con el `estado_actual` del equipo para permitir mantenerlo o cambiarlo (`Activo`, `En reparación`, `Pendiente de repuesto`, `Dado de baja`, `No localizado`).
  * **Ubicación actual (`<input>` editable):** Precargada con la ubicación actual para corregirla en campo si el equipo fue reubicado.
  * **Observaciones (`<textarea>`):** Detalles del mantenimiento, insumos cambiados o fallas encontradas.
* **Historial del Equipo:** Lista cronológica descendente con todas las atenciones registradas para ese equipo (fecha, técnico, tipo, estado resultante y observaciones).

### D. Exportación a PDF (`jspdf` + `jspdf-autotable`)
* En `/equipos`, incluir un menú o dos botones claros:
  * **"Exportar Filtrados (PDF)":** Consulta todos los registros que coinciden con los filtros y búsqueda activos (sin límite de paginación) y genera un PDF tabular.
  * **"Exportar Todo (PDF)":** Descarga el inventario completo ordenado por zona y código de activo.
* **Formato del PDF:** Fondo blanco limpio (optimizado para impresión), encabezado institucional oscuro (`#131512`) con acento verde lima (`#84CC16`), título del reporte, fecha/hora de generación, filtros aplicados, total de equipos y columnas: Código, Marca / Modelo, Serie, Ubicación, Zona, Estado y Último Mtto.

---

## 6. Estructura de Carpetas Recomendada

```plaintext
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Navbar responsive + contenedor principal
│   │   ├── page.tsx                # Dashboard operativo (Server Component)
│   │   ├── loading.tsx             # Skeleton UI
│   │   ├── error.tsx               # Error Boundary UI
│   │   ├── equipos/
│   │   │   ├── page.tsx            # Listado + Buscador + Filtros + Export PDF
│   │   │   ├── loading.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Ficha + Form Atención Técnica + Historial
│   │   └── mantenimientos/
│   │       └── page.tsx            # Bitácora global de servicios
│   └── api/
│       └── mantenimientos/
│           └── route.ts            # POST creación de atención + validación
├── components/
│   ├── ui/                         # Badges, Skeletons, Botones píldora, Cards
│   ├── layout/
│   │   └── Navbar.tsx
│   ├── equipos/
│   │   ├── EquiposToolbar.tsx      # Buscador, filtros y botones PDF
│   │   ├── EquiposList.tsx         # Tabla desktop + Cards móvil
│   │   └── RegistroMttoForm.tsx    # Formulario atención técnica
│   └── pdf/
│       └── exportarEquiposPdf.ts   # Lógica jsPDF + autoTable
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client (@supabase/ssr)
│   │   ├── server.ts               # Server client (@supabase/ssr)
│   │   └── middleware.ts           # Refresco y protección de sesión
│   └── utils/
│       └── semaforo.ts             # Cálculo de días restantes (+45d) y estados
├── types/
│   └── database.ts                 # Interfaces TypeScript (Equipo, Usuario, Mantenimiento)
└── middleware.ts                   # Protección de rutas
```

---

## 7. Plan de Ejecución Iterativa (Para GitHub & Vibe Coding)

Ejecutar y confirmar cada fase antes de pasar a la siguiente, realizando un `git commit` descriptivo al finalizar cada bloque:

* **Fase 1 — Configuración Base y Sistema de Diseño:** Instalar `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `jspdf`, `jspdf-autotable`. Configurar tipografías (`Plus Jakarta Sans` y `JetBrains Mono`), variables de color en `globals.css` y clientes de Supabase.
* **Fase 2 — Autenticación (`/login` y Middleware):** Implementar inicio de sesión con correo/contraseña de Supabase Auth, cierre de sesión y protección de rutas privadas.
* **Fase 3 — Dashboard Operativo (`/`):** Construir tarjetas KPI en Server Components con conteos reales de equipos por estado, semáforo de vencimiento (45 días) y últimos mantenimientos registrados.
* **Fase 4 — Directorio de Equipos (`/equipos`) y Exportación PDF:** Construir buscador con `useState`/`useEffect`, filtros por zona/modelo/estado/semáforo, paginación, vista responsive tabla/tarjetas y exportación a PDF (filtrada y completa).
* **Fase 5 — Ficha de Equipo y Atención Técnica (`/equipos/[id]` + `/mantenimientos`):** Implementar formulario de registro con `<select>` de técnicos, actualización de estado/ubicación vía Route Handler (`POST /api/mantenimientos`), historial cronológico y bitácora global.
* **Fase 6 — Resiliencia UI y Despliegue:** Verificar `loading.tsx` y `error.tsx` en todas las rutas, comprobar cero errores de TypeScript (`npm run build`) y desplegar en Vercel con las variables de entorno configuradas.
