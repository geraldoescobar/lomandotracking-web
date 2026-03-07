# Especificaciones Tecnicas - Lomando

## Arquitectura

```
Frontend (Next.js 15 + React 19 + Tailwind 4)
  ├── Pages (App Router)
  │   ├── /login              Login + tracking publico
  │   ├── /                   Dashboard
  │   ├── /scan               Camara QR → redirect a /seguimiento
  │   ├── /seguimiento        Vista de envio con acciones por rol
  │   ├── /orders             Lista de ordenes
  │   ├── /orders/new         Crear orden
  │   ├── /orders/[id]        Detalle de orden (asignar cadetes)
  │   ├── /orders/[id]/edit   Editar datos de orden (manager)
  │   ├── /drivers            CRUD de cadetes (manager)
  │   ├── /customers          CRUD de clientes (manager)
  │   ├── /localities         CRUD de localidades (manager)
  │   ├── /addresses          Libro de direcciones (customer)
  │   └── /profile            Perfil (customer)
  ├── API Routes
  │   ├── /api/auth/login
  │   ├── /api/orders (GET), /api/orders/create (POST)
  │   ├── /api/orders/[id] (GET, PUT)
  │   ├── /api/orders/[id]/status (PUT), /api/orders/[id]/tracking (GET)
  │   ├── /api/steps/[id]/status (PUT)
  │   ├── /api/steps/[id]/assign (PUT)
  │   ├── /api/drivers (GET, POST), /api/drivers/[id] (GET, PUT, DELETE)
  │   ├── /api/customers (GET, POST), /api/customers/[id] (GET, PUT, DELETE)
  │   ├── /api/localities (GET, POST), /api/localities/[id] (PUT, DELETE)
  │   ├── /api/scan
  │   ├── /api/track/[code]    (publico, solo step codes)
  │   ├── /api/upload
  │   ├── /api/addresses (GET, POST), /api/addresses/[id] (PUT, DELETE)
  │   ├── /api/departments
  │   ├── /api/profile
  │   └── /api/status
  ├── Context
  │   └── AuthContext (JWT token, authFetch, user state)
  ├── Components
  │   ├── NavBar (role-based navigation)
  │   └── QRCode (generates full URL QR codes)
  └── Lib
      ├── db.ts (MySQL pool)
      ├── auth.ts (JWT verify, role authorization)
      ├── validation.ts (Zod schemas)
      ├── print.ts (labels + route sheet generation)
      └── qr-url.ts (URL builder + code extractor)

Database: MySQL (lomando_app)
```

## Autenticacion

- JWT tokens con jsonwebtoken
- Passwords hasheados con bcrypt
- Token enviado en header `Authorization: Bearer <token>`
- authFetch helper en AuthContext: auto-agrega token, detecta FormData para no setear Content-Type

```typescript
interface JWTPayload {
  userId: string;    // GUID
  role: 'manager' | 'driver' | 'customer';
  email: string;
}
```

## Codigos de Pedido y Paso

- Pedido: `D` + 11 digitos (ej: `D000000060000`)
- Paso: codigo de pedido + (step_order x 100) (ej: `D000000060200`)

## QR Codes

Los QR codifican la URL completa de tracking:
```
{NEXT_PUBLIC_BASE_URL}/seguimiento?code={codigo}
```
Si `NEXT_PUBLIC_BASE_URL` no esta definida, usa `window.location.origin`.

El extractor de codigo (`extractCodeFromQR`) parsea:
- URLs con `?code=XXX`
- URLs legacy con `/track/XXX`
- Codigos sueltos

## Permisos por Rol

### Tracking publico (/api/track)
- Solo acepta codigos de step (paquetes individuales)
- Codigos de orden devuelven 404 → frontend redirige a login

### Scan autenticado (/api/scan)
- Manager: ve toda la orden con todos los steps
- Driver: ve la orden pero solo los steps asignados a el (+ origen)
- Customer: ve la orden y sus steps

### Acciones del manager
- CRUD de cadetes, clientes y localidades
- Asignar cadete a destinos de una orden (auto-transiciona orden Pendiente→Asignado)
- Editar datos de orden y pasos (direccion, contacto, telefono, notas, cant. paquetes)
- Imprimir etiquetas y hojas de ruta

### Acciones del driver
- Sobre orden: Confirmar retiro (1→2), Salir a entregar (2→3)
- Sobre step: En camino (1/2→3), Entregar (3→5 con nombre+CI), Reportar problema (3→6 con motivo+foto)

## Tablas de Base de Datos

### users
```sql
id CHAR(36) PK, username, email, password_hash, role ENUM, name, active
```

### drivers
```sql
id INT AUTO_INCREMENT PK, user_id CHAR(36) FK, name, phone, active
```
IMPORTANTE: `assigned_driver_id` en order_steps referencia `drivers.id`, NO `users.id`

### customers
```sql
id CHAR(36) PK, user_id CHAR(36) FK, name, lastname, phone, email
```

### orders
```sql
id INT PK, code VARCHAR UNIQUE, description, customer_id CHAR(36) FK, status_id INT FK, notes, type, created_at, updated_at
```

### order_steps
```sql
id INT PK, order_id INT FK, step_type ENUM('origin','destination'), step_order INT,
address, contact_name, contact_phone, notes, package_qty INT,
code VARCHAR UNIQUE, status_id INT FK, assigned_driver_id INT FK
```

### order_tracking
```sql
id INT PK, order_id INT FK, step_id INT FK NULL, from_status_id INT, to_status_id INT,
observation, receiver_name, receiver_document, photo_url, created_at, created_by CHAR(36)
```

### address_book
```sql
id INT PK, customer_id CHAR(36) FK, name, street, number, apartment, city, notes, latitude, longitude
```

### departments
```sql
id INT PK, name VARCHAR, is_active BOOLEAN
```
Seeded con 19 departamentos de Uruguay.

### localities
```sql
id INT PK, name VARCHAR, department_id INT FK, is_active BOOLEAN
```
Seeded con barrios de Montevideo y localidades de Canelones.

## Validacion (Zod 4)

### createOrderSchema
- customerId: string optional (auto-assign para customer)
- originStep: { address, street, number, apartment, city, contactName, contactPhone, notes, saveAddress, addressName }
- destinationSteps: [{ address, contactName, contactPhone, notes, packageQty }]

### updateStepStatusSchema
- statusId: number (required)
- observation, receiverName, receiverDocument, photoUrl: string optional

## Logica de Estado de Orden

Cuando se actualiza un step, la orden se recalcula automaticamente.
**Solo se consideran los steps de tipo destino** (se excluye el origen):
```
- Todos los dest. entregados (status 5)      → orden Completado (4)
- Todos los dest. finalizados (status >= 5)   → orden Completado parcial (5)
- Algun dest. en viaje (status 3)             → orden En Curso (3)
- Algun dest. asignado+ (status >= 2)         → orden Asignado (2)
- Sino                                        → orden Pendiente (1)
```

Asignar un cadete a un destino (via `/api/steps/[id]/assign`) tambien dispara
la transicion de Pendiente (1) a Asignado (2) si la orden estaba pendiente.

## Dependencias

```json
{
  "next": "15.1.6",
  "react": "19.2.3",
  "mysql2": "^3.18.2",
  "jsonwebtoken": "^9.0.3",
  "bcryptjs": "^3.0.3",
  "zod": "^4.3.6",
  "qrcode": "^1.5.4",
  "html5-qrcode": "^2.3.8",
  "next-pwa": "^5.6.0",
  "uuid": "^11.1.0"
}
```

## Patrones de Desarrollo

### CRUD Pages
Las paginas de gestion (drivers, customers, localities) siguen el mismo patron:
- Lista con busqueda y filtros
- Modal para crear/editar (reutiliza el mismo formulario)
- Confirmacion antes de eliminar
- Soft delete (is_active=0) para entidades con referencias (drivers, localities)
- Hard delete solo cuando no hay dependencias (customers sin ordenes)

### Creacion de usuarios vinculados
Al crear un driver se crea tambien un registro en `users` con:
- `id`: UUID v4
- `role`: 'driver'
- `password_hash`: bcrypt del password ingresado
Al crear un customer se sigue el mismo patron con `role`: 'customer'
