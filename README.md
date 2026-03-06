# Lomando - Sistema de Tracking de Entregas

## Descripcion del Proyecto

**Lomando** es una aplicacion web de seguimiento de entregas diseñada para gestionar pedidos con multiples destinos. Permite a diferentes roles de usuario (Manager, Driver, Customer) interactuar con pedidos y entregas de manera eficiente.

El proyecto utiliza una base de datos MySQL separada (`lomando_app`) y es independiente de cualquier sistema externo.

---

## Caracteristicas Principales

- **Gestion de Pedidos**: Creacion de pedidos con origen y multiples destinos
- **Sistema QR**: Generacion de codigos QR con URL completa para tracking
- **Impresion**: Etiquetas con QR por paquete y hojas de ruta para repartidores
- **Seguimiento publico**: Cualquier persona puede consultar el estado de un paquete con su codigo
- **Flujo de repartidor**: Confirmar retiro, iniciar entrega, entregar con datos del receptor, reportar problemas con foto
- **Direcciones guardadas**: Libro de direcciones por cliente con autocompletado de localidades
- **Interfaz responsive**: Diseño mobile-first con navegacion adaptada por rol
- **PWA**: Instalable como app en dispositivos moviles

---

## Roles de Usuario

### Manager (Administrador)
- Ve todos los pedidos y destinos
- Crea nuevos pedidos seleccionando cliente
- Cambia el estado de cualquier pedido o paso
- Gestiona clientes y sus direcciones
- Imprime etiquetas y hojas de ruta
- Acceso completo a todas las funcionalidades

### Repartidor (Driver)
- Ve solo los pasos que tiene asignados (+ origen para contexto)
- Confirma retiro, inicia entrega
- Entrega con nombre y CI del receptor
- Reporta problemas con motivo y foto
- Puede accionar desde la vista de orden o escaneando el QR de cada paso

### Cliente (Customer)
- Crea sus propias ordenes (se auto-asigna como cliente)
- Consulta estado de sus envios
- Guarda direcciones frecuentes en su libro de direcciones
- Puede rastrear un paquete con su codigo de paso

### Anonimo (sin login)
- Solo puede consultar el estado de un paquete individual (codigo de step)
- Los codigos de orden requieren autenticacion
- Si escanea un QR de orden, se le redirige al login

---

## Codigos y Formatos

### Codigo de Pedido
- Formato: `D` + 11 digitos secuenciales
- Ejemplo: `D000000060000`

### Codigo de Paso/Paquete
- Formato: Codigo de pedido base + (step_order x 100)
- Paso 1: `D000000060100`
- Paso 2: `D000000060200`

### QR Codes
Los codigos QR contienen la URL completa de tracking:
```
https://tudominio.com/seguimiento?code=D000000060200
```
Esto permite que cualquier camara nativa abra directamente la pagina de seguimiento.

---

## Estados de Pedido

| ID | Nombre | Orden | Descripcion |
|----|--------|-------|-------------|
| 1 | Pendiente | 1 | Pedido creado, sin asignar |
| 2 | Asignado | 2 | Retiro confirmado por repartidor |
| 3 | En Curso | 3 | Repartidor salio a entregar |
| 4 | Completado | 4 | Todos los pasos entregados |
| 5 | Completado parcial | 5 | Todos los pasos finalizados pero no todos entregados |

## Estados de Paso

| ID | Nombre | Orden | Descripcion |
|----|--------|-------|-------------|
| 1 | Pendiente | 1 | Sin asignar |
| 2 | Asignado | 2 | Asignado a repartidor |
| 3 | En Viaje | 3 | Repartidor en camino |
| 5 | Entregado | 4 | Entregado con datos del receptor |
| 6 | No Entregado | 5 | No se pudo entregar (con motivo y foto opcional) |

---

## Flujo de Trabajo

### Creacion de Pedido
1. Manager o Customer accede a "Nuevo Envio"
2. Completa datos de origen (calle, numero, depto, localidad con autocompletado)
3. Opcionalmente guarda la direccion en el libro de direcciones
4. Agrega uno o mas destinos con direccion, contacto y cantidad de paquetes
5. Confirma el pedido

### Proceso de Entrega (Driver)
1. Escanea QR del pedido o busca por codigo en `/seguimiento`
2. Confirma retiro (orden pasa a "Asignado")
3. Sale a entregar (orden pasa a "En Curso")
4. Para cada destino puede:
   - Marcar "En camino" (paso a estado 3)
   - "Entregar" → ingresa nombre y CI del receptor (paso a estado 5)
   - "Reportar problema" → selecciona motivo, adjunta foto (paso a estado 6)
5. Acciones disponibles tanto escaneando el QR de cada paso como desde la vista de orden

### Seguimiento Publico
1. Cualquier persona escanea el QR del paquete (codigo de paso)
2. Ve el estado actual del paquete, direccion y datos de contacto
3. Si intenta consultar un codigo de orden, se redirige al login

---

## Paginas de la Aplicacion

| Ruta | Descripcion | Acceso |
|------|-------------|--------|
| `/login` | Login + tracking publico | Publico |
| `/` | Dashboard | Manager, Driver, Customer |
| `/scan` | Camara QR → redirige a `/seguimiento` | Todos (logueado) |
| `/seguimiento` | Detalle de envio/paquete con acciones por rol | Todos |
| `/orders` | Lista de pedidos | Manager, Customer |
| `/orders/new` | Crear nuevo pedido | Manager, Customer |
| `/orders/[id]` | Detalle del pedido con QR e impresion | Manager, Customer |
| `/customers` | Lista de clientes | Manager |
| `/addresses` | Libro de direcciones | Customer |
| `/profile` | Perfil del usuario | Customer |

---

## Stack Tecnologico

- **Frontend**: Next.js 15.1.6, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Base de Datos**: MySQL (mysql2)
- **Autenticacion**: JWT (jsonwebtoken) + bcrypt
- **Validacion**: Zod 4
- **QR Generation**: qrcode (toDataURL)
- **QR Scanning**: html5-qrcode
- **PWA**: next-pwa
- **Upload**: FormData + fs (public/uploads/)

---

## Estructura de Base de Datos

### Tablas Principales

```
users (id GUID, username, email, password_hash, role, name, active)
drivers (id INT, user_id GUID, name, phone, active)
customers (id GUID, user_id GUID, name, lastname, phone, email)
orders (id INT, code VARCHAR, description, customer_id, status_id, notes, type)
order_steps (id INT, order_id, step_type, step_order, address, contact_name, contact_phone, notes, package_qty, code, status_id, assigned_driver_id)
order_statuses (id, name, display_order, active)
order_step_statuses (id, name, display_order, active)
order_tracking (id, order_id, step_id, from_status_id, to_status_id, observation, receiver_name, receiver_document, photo_url, created_at, created_by)
address_book (id, customer_id, name, street, number, apartment, city, notes, latitude, longitude)
departments (id, name, is_active) -- 19 departamentos de Uruguay
localities (id, name, department_id, is_active) -- barrios/localidades
```

---

## API Endpoints

### Autenticacion
```
POST /api/auth/login    { email, password } → { token, user }
```

### Pedidos
```
GET    /api/orders                     Lista de pedidos (filtrado por rol)
GET    /api/orders/[id]                Detalle del pedido
POST   /api/orders/create              Crear pedido
PUT    /api/orders/[id]/status         Cambiar estado del pedido
GET    /api/orders/[id]/tracking       Historial de tracking
```

### Pasos
```
PUT /api/steps/[id]/status    { statusId, observation, receiverName, receiverDocument, photoUrl }
```

### Escaneo (autenticado)
```
GET /api/scan?code=XXX    → { type: 'order'|'step', ... }
```

### Tracking publico (solo step codes)
```
GET /api/track/[code]     → { type: 'step', stepCode, statusName, address, ... }
```

### Upload
```
POST /api/upload    FormData { photo: File } → { url: '/uploads/filename.jpg' }
```

### Localidades
```
GET  /api/localities?search=xxx&departmentId=x
POST /api/localities    { name, departmentId } (solo manager)
```

### Departamentos
```
GET /api/departments
```

### Clientes
```
GET /api/customers
```

### Direcciones
```
GET /api/addresses?customerId=xxx
```

---

## Variables de Entorno (.env.local)

```env
DB_HOST=172.19.160.1          # WSL gateway IP (o localhost si MySQL esta local)
DB_USER=root
DB_PASSWORD=password
DB_NAME=lomando_app
JWT_SECRET=tu_secreto_jwt
NEXT_PUBLIC_BASE_URL=https://tudominio.com   # Opcional, para URLs en QR codes
```

---

## Instalacion

```bash
npm install
npm run dev          # Desarrollo
npm run build        # Build produccion
npm start            # Start produccion
npx tsc --noEmit     # Verificar tipos
```

---

## Notas de Desarrollo

- **Cache del dev server**: despues de cambios en API routes o libs compartidas, a veces hay que hacer `rm -rf .next` y reiniciar
- **IDs de Driver**: `user.id` (GUID) != `driver.id` (INT autoincremental). Los pasos usan `assigned_driver_id` que referencia `drivers.id`
- **Zod 4**: usar `error` en vez de `required_error`, y `issues` en vez de `errors`
- **authFetch**: detecta FormData y no setea Content-Type (para que el browser ponga el boundary correcto)
- **useSearchParams**: requiere Suspense boundary en Next.js 15
