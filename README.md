# Sistema de Gestión y Bitácora de Mantenimiento de Multifuncionales (Contrato 27-)

Aplicación web full-stack desarrollada con **Next.js 16 (App Router)**, **TypeScript estricto (`strict: true`)**, **Tailwind CSS** y **Supabase (PostgreSQL + Auth)** para digitalizar el control de inventario (+1,000 equipos), el semáforo de mantenimiento preventivo cada **45 días**, el registro de atenciones técnicas en campo y la exportación de reportes en **PDF** de las impresoras multifuncionales del Contrato `27-`.

---

## 🌐 Enlaces del Proyecto y Documentación

- **Repositorio Público en GitHub:** [https://github.com/vxctorp12/proyecto-csj](https://github.com/vxctorp12/proyecto-csj)
- **URL Pública en Producción (Vercel):** *(Se actualizará automáticamente al finalizar el despliegue en Vercel)*
- **Documentación del Proceso con IA (Vibe Coding):** Ver [VIBE_CODING.md](./VIBE_CODING.md)
- **Especificación Técnica y Arquitectura:** Ver [CLAUDE.md](./CLAUDE.md)

---

## ✨ Características Principales

1. **Autenticación Segura (`/login` + Middleware SSR):**
   - Inicio y cierre de sesión mediante **Supabase Auth** (`@supabase/ssr`).
   - Protección automática de todas las rutas privadas (`/`, `/equipos`, `/equipos/[id]`, `/mantenimientos`, `/api/*`).
2. **Dashboard Operativo en Tiempo Real (`/`):**
   - Tarjetas KPI con conteos exactos para +1,000 equipos: Total de Inventario `27-`, Equipos Al Día ($> 7$ días), Próximos a Vencer ($\le 7$ días) y Vencidos / Sin Mtto.
   - Desglose interactivo por Estado Operativo (`Activo` vs `Dado de baja`) y por Zona Geográfica.
   - Tabla con las últimas 8 atenciones técnicas registradas.
3. **Directorio Paginado de Equipos y Reportes PDF (`/equipos`):**
   - Paginación del lado del servidor (25 equipos por página) optimizada para más de 1,000 registros.
   - Buscador omnicanal instantáneo (`useState` + `useEffect` con debounce de 350ms y conversión a `UPPERCASE`) por **código de activo** (`27-6427`), **serie** (`W2Z7603074`) o **dependencia / ubicación**.
   - Filtros combinados por Zona Regional, Modelo, Estado Operativo y Semáforo Preventivo (45 días).
   - Diseño 100% responsive: tabla densa en escritorio (`md:block`) y tarjetas táctiles apiladas en móvil (`md:hidden`).
   - **Exportación a PDF (`jspdf` + `jspdf-autotable`):** Botones para **Exportar Filtrados (PDF)** y **Exportar Todo (PDF)** con encabezado institucional y resumen de filtros.
4. **Ficha Técnica y Registro de Atención en Campo (`/equipos/[id]`):**
   - Visualización detallada del equipo, serie, ubicación y semáforo actual.
   - Formulario conectado a `POST /api/mantenimientos` con `<select>` del catálogo de los 24 técnicos activos (`usuarios`), conversión automática a mayúsculas (`UPPERCASE`) en ubicación y observaciones, y cálculo automático de `fecha_proximo_mtto = fecha_mantenimiento + 45 días`.
   - Lógica inteligente para equipos **`Dado de baja`**: omite automáticamente la selección de Preventivo/Correctivo y desactiva la programación de próxima visita (`fecha_proximo_mtto = null`).
   - Historial cronológico descendente de todos los mantenimientos realizados al equipo.
5. **Bitácora Global de Servicios (`/mantenimientos`):**
   - Historial general filtrable por técnico responsable, tipo de servicio (`Preventivo`, `Correctivo`, `Baja de equipo`) y rango de fechas (`Desde` / `Hasta`).

---

## 🛠️ Requisitos Previos e Instalación Local

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/vxctorp12/proyecto-csj.git
cd proyecto-csj
npm install
```

### 2. Configurar la Base de Datos en Supabase
Ejecuta el script SQL ubicado en [`supabase/schema.sql`](./supabase/schema.sql) dentro del **SQL Editor** de tu proyecto en Supabase. Este script crea:
- Las tablas `usuarios`, `equipos` y `mantenimientos` con sus índices de rendimiento.
- El trigger automático `trg_after_insert_mantenimiento` que sincroniza el equipo y calcula los `+45 días`.
- Las políticas de seguridad **Row Level Security (RLS)** para usuarios autenticados (`authenticated`).

### 3. Configurar las Variables de Entorno
Copia el archivo [`.env.example`](./.env.example) a `.env.local` y coloca las credenciales de tu proyecto de Supabase:
```bash
cp .env.example .env.local
```

Contenido de `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-o-publishable
```

### 4. Ejecutar en Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 5. Compilar para Producción
```bash
npm run build
npm run start
```

---

## 📂 Estructura del Proyecto

```plaintext
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx               # Inicio de sesión con Supabase Auth
│   ├── (dashboard)/
│   │   ├── layout.tsx                   # Navbar fija + layout protegido
│   │   ├── page.tsx                     # Dashboard operativo con KPIs (Server Component)
│   │   ├── loading.tsx                  # Skeleton UI general
│   │   ├── error.tsx                    # Error Boundary interactivo
│   │   ├── equipos/
│   │   │   ├── page.tsx                 # Directorio paginado + filtros + PDF
│   │   │   ├── loading.tsx              # Skeleton UI del directorio
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # Ficha técnica + formulario + historial
│   │   │       └── loading.tsx          # Skeleton UI de ficha
│   │   └── mantenimientos/
│   │       ├── page.tsx                 # Bitácora global filtrable
│   │       └── loading.tsx              # Skeleton UI de bitácora
│   └── api/
│       └── mantenimientos/route.ts      # Route Handler POST (validación y +45 días)
├── components/
│   ├── ui/Badges.tsx                    # Badges píldora para Estado y Semáforo
│   ├── layout/Navbar.tsx                # Barra de navegación responsive + Logout
│   ├── equipos/
│   │   ├── EquiposToolbar.tsx           # Buscador con debounce (350ms), filtros y PDF
│   │   ├── EquiposList.tsx              # Tabla desktop + Tarjetas móvil + Paginación
│   │   └── RegistroMttoForm.tsx         # Formulario de atención técnica en campo
│   └── pdf/exportarEquiposPdf.ts        # Generador de reportes PDF con jsPDF
├── lib/
│   ├── supabase/                        # Clientes SSR (client.ts, server.ts, middleware.ts)
│   └── utils/semaforo.ts                # Lógica de cálculo de 45 días y semáforo
├── types/database.ts                    # Interfaces TypeScript estrictas
└── middleware.ts                        # Protección de rutas y refresco de sesión
```
