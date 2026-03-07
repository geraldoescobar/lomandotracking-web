# Guia para Desarrolladores - Lomando

## Configuracion del Entorno

### Requisitos
- Node.js 22+ (via nvm)
- MySQL/MariaDB
- npm

### Instalacion
```bash
cd lomandotracking-web
npm install
```

### Variables de Entorno
Crear archivo `.env.local`:
```env
DB_HOST=172.19.160.1       # WSL gateway IP, o localhost si MySQL corre local
DB_USER=root
DB_PASSWORD=password
DB_NAME=lomando_app
JWT_SECRET=tu_secreto_jwt
NEXT_PUBLIC_BASE_URL=https://tudominio.com   # Opcional, para QR codes
```

### Iniciar Desarrollo
```bash
npm run dev
```
Acceder a http://localhost:3000

---

## Estructura del Proyecto

```
src/
├── app/                            # Next.js App Router
│   ├── api/                        # API Routes
│   │   ├── auth/login/             # POST - login con JWT
│   │   ├── orders/                 # GET lista
│   │   ├── orders/create/          # POST crear orden
│   │   ├── orders/[id]/            # GET detalle, PUT editar orden
│   │   ├── orders/[id]/status/     # PUT cambiar estado orden
│   │   ├── orders/[id]/tracking/   # GET historial
│   │   ├── steps/[id]/status/      # PUT cambiar estado paso
│   │   ├── steps/[id]/assign/      # PUT asignar cadete a paso
│   │   ├── drivers/                # GET/POST cadetes
│   │   ├── drivers/[id]/           # GET/PUT/DELETE cadete
│   │   ├── customers/              # GET/POST clientes
│   │   ├── customers/[id]/         # GET/PUT/DELETE cliente
│   │   ├── localities/             # GET/POST localidades
│   │   ├── localities/[id]/        # PUT/DELETE localidad
│   │   ├── scan/                   # GET buscar por codigo (auth)
│   │   ├── track/[code]/           # GET tracking publico (solo steps)
│   │   ├── upload/                 # POST subir foto
│   │   ├── addresses/              # GET/POST direcciones
│   │   ├── addresses/[id]/         # PUT/DELETE direccion
│   │   ├── departments/            # GET departamentos
│   │   ├── profile/                # GET/PUT perfil
│   │   └── status/                 # GET estados
│   ├── login/                      # Login + tracking publico
│   ├── scan/                       # Camara QR → redirect a /seguimiento
│   ├── seguimiento/                # Vista principal de envio por rol
│   ├── orders/                     # Lista de ordenes
│   ├── orders/new/                 # Crear orden
│   ├── orders/[id]/                # Detalle de orden (asignar cadetes)
│   ├── orders/[id]/edit/           # Editar datos de orden (manager)
│   ├── drivers/                    # CRUD cadetes (manager)
│   ├── customers/                  # CRUD clientes (manager)
│   ├── localities/                 # CRUD localidades (manager)
│   ├── addresses/                  # Libro de direcciones (customer)
│   ├── profile/                    # Perfil del usuario
│   └── layout.tsx                  # Layout con AuthProvider + NavBar
├── components/
│   ├── NavBar.tsx                  # Navegacion por rol (top + bottom mobile)
│   └── QRCode.tsx                  # Componente QR con URL completa
├── context/
│   └── AuthContext.tsx             # Auth state, login, logout, authFetch
└── lib/
    ├── db.ts                       # MySQL connection pool
    ├── auth.ts                     # JWT authentication + role authorization
    ├── validation.ts               # Zod 4 schemas
    ├── print.ts                    # Generacion de etiquetas y hojas de ruta
    └── qr-url.ts                   # URL builder + code extractor para QR
```

---

## Comandos

```bash
npm run dev           # Desarrollo
npm run build         # Build produccion
npm start             # Start produccion
npx tsc --noEmit      # Verificar tipos TypeScript
npm run lint          # Lint
```

Si el dev server tiene cache corrupto:
```bash
rm -rf .next && npm run dev
```

---

## Notas Tecnicas Importantes

### IDs y tipos
- `users.id` = CHAR(36) GUID
- `customers.id` = CHAR(36) GUID
- `drivers.id` = INT auto_increment
- `order_steps.assigned_driver_id` referencia `drivers.id`, NO `users.id`

### Zod 4
- Usar `error` en vez de `required_error`
- Acceder a errores con `.issues` no `.errors`

### authFetch
- Auto-agrega `Authorization: Bearer <token>`
- Auto-agrega `Content-Type: application/json` EXCEPTO para FormData
- Detecta `body instanceof FormData` para no interferir con el multipart boundary

### useSearchParams (Next.js 15)
- Requiere Suspense boundary alrededor del componente que lo usa
- Patron: exportar wrapper con Suspense, componente real es interno

### API Track publica
- Solo acepta codigos de step (paquetes individuales)
- Codigos de orden devuelven 404
- El frontend redirige a `/login?redirect=/seguimiento?code=XXX`

### Estado de orden auto-calculado
Al actualizar un step, la orden recalcula su estado segun el estado de todos sus steps de destino (excluye origen).
Asignar un cadete (via `/api/steps/[id]/assign`) tambien transiciona la orden de Pendiente a Asignado.

### QR codes
- Codifican URL completa: `{baseUrl}/seguimiento?code={codigo}`
- `baseUrl` = `NEXT_PUBLIC_BASE_URL` || `window.location.origin`
- El extractor en `/scan` parsea URLs completas y codigos sueltos

### Upload de fotos
- POST `/api/upload` con FormData
- Se guardan en `public/uploads/` con nombre unico
- La URL se guarda en `order_tracking.photo_url`

---

## Git

- Branch principal de desarrollo: `feature/ui-redesign`
- Siempre verificar build antes de commit (`npx tsc --noEmit`)
- Commits descriptivos, preferencia por ingles en mensajes de commit
