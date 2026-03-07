# Lomando - Sistema de Tracking de Entregas

Aplicacion web de seguimiento de entregas con multiples destinos, roles de usuario y codigos QR.

## Stack

Next.js 15 · React 19 · Tailwind 4 · MySQL · JWT · Zod 4

## Inicio rapido

```bash
npm install
cp .env.local.example .env.local   # configurar DB y JWT
npm run dev                         # http://localhost:3000
```

## Estructura del proyecto

```
lomandotracking-web/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API Routes (ver detalle abajo)
│   │   ├── login/               # Login + tracking publico
│   │   ├── scan/                # Camara QR
│   │   ├── seguimiento/         # Vista de envio con acciones por rol
│   │   ├── orders/              # Lista, detalle, crear, editar ordenes
│   │   ├── drivers/             # Gestion de cadetes (manager)
│   │   ├── customers/           # Gestion de clientes (manager)
│   │   ├── localities/          # Gestion de localidades (manager)
│   │   ├── addresses/           # Libro de direcciones (customer)
│   │   ├── profile/             # Perfil (customer)
│   │   ├── layout.tsx           # Layout global + AuthProvider + NavBar
│   │   └── globals.css          # Estilos globales
│   ├── components/              # Componentes reutilizables
│   │   ├── NavBar.tsx           # Navegacion responsive por rol
│   │   └── QRCode.tsx           # Generador de QR con URL completa
│   ├── context/
│   │   └── AuthContext.tsx      # Estado de auth, login/logout, authFetch
│   └── lib/                     # Utilidades compartidas
│       ├── db.ts                # Pool de conexion MySQL
│       ├── auth.ts              # Verificacion JWT + autorizacion por rol
│       ├── validation.ts        # Schemas Zod 4
│       ├── print.ts             # Generacion de etiquetas y hojas de ruta
│       └── qr-url.ts            # Builder de URLs para QR
├── tests/
│   └── e2e/                     # Tests Playwright (flujo completo de entrega)
├── public/                      # Assets estaticos + uploads de fotos
├── docs/                        # Documentacion
│   ├── SPEC.md                  # Especificaciones tecnicas y base de datos
│   ├── AGENTS.md                # Guia para desarrolladores
│   └── USAGE.md                 # Guia de usuario
└── archivos de config           # next.config.ts, tsconfig.json, etc.
```

## API Routes

| Ruta | Metodos | Descripcion |
|------|---------|-------------|
| `/api/auth/login` | POST | Login, devuelve JWT |
| `/api/orders` | GET | Lista de ordenes (filtrada por rol) |
| `/api/orders/create` | POST | Crear orden con origen y destinos |
| `/api/orders/[id]` | GET, PUT | Detalle y edicion de orden |
| `/api/orders/[id]/status` | PUT | Cambiar estado de orden |
| `/api/orders/[id]/tracking` | GET | Historial de tracking |
| `/api/steps/[id]/status` | PUT | Cambiar estado de paso |
| `/api/steps/[id]/assign` | PUT | Asignar cadete a paso |
| `/api/drivers` | GET, POST | Listar y crear cadetes |
| `/api/drivers/[id]` | GET, PUT, DELETE | Detalle, editar, eliminar cadete |
| `/api/customers` | GET, POST | Listar y crear clientes |
| `/api/customers/[id]` | GET, PUT, DELETE | Detalle, editar, eliminar cliente |
| `/api/localities` | GET, POST | Listar y crear localidades |
| `/api/localities/[id]` | PUT, DELETE | Editar y desactivar localidad |
| `/api/addresses` | GET, POST | Direcciones del cliente |
| `/api/addresses/[id]` | PUT, DELETE | Editar y eliminar direccion |
| `/api/departments` | GET | Lista de departamentos |
| `/api/scan` | GET | Buscar por codigo (autenticado) |
| `/api/track/[code]` | GET | Tracking publico (solo codigos de paso) |
| `/api/upload` | POST | Subir foto (FormData) |
| `/api/profile` | GET, PUT | Perfil del usuario |
| `/api/status` | GET | Estados disponibles |

## Roles

| Rol | Acceso |
|-----|--------|
| **Manager** | Todo: ordenes, cadetes, clientes, localidades, asignacion, edicion |
| **Driver** | Dashboard, escanear QR, acciones de entrega sobre pasos asignados |
| **Customer** | Crear ordenes, ver sus envios, libro de direcciones, perfil |
| **Anonimo** | Solo tracking publico de paquetes individuales (codigo de paso) |

## Comandos

```bash
npm run dev            # Desarrollo
npm run build          # Build produccion
npx tsc --noEmit       # Verificar tipos
npm run lint           # Lint
rm -rf .next           # Limpiar cache (si hay problemas con hot reload)
```

## Documentacion

- **[docs/SPEC.md](docs/SPEC.md)** — Especificaciones tecnicas, esquema de BD, logica de estados
- **[docs/AGENTS.md](docs/AGENTS.md)** — Guia para desarrolladores, estructura detallada, notas tecnicas
- **[docs/USAGE.md](docs/USAGE.md)** — Guia de usuario por rol
