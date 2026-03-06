# Especificaciones Tecnicas - Lomando

## Arquitectura

```
Frontend (Next.js 15 + React 19 + Tailwind 4)
  ├── Pages (App Router)
  │   ├── /login          Login + tracking publico
  │   ├── /               Dashboard
  │   ├── /scan           Camara QR → redirect a /seguimiento
  │   ├── /seguimiento    Vista de envio con acciones por rol
  │   ├── /orders         CRUD de ordenes
  │   ├── /customers      Gestion de clientes
  │   ├── /addresses      Libro de direcciones (customer)
  │   └── /profile        Perfil (customer)
  ├── API Routes
  │   ├── /api/auth/login
  │   ├── /api/orders, /api/orders/[id], /api/orders/create
  │   ├── /api/steps/[id]/status
  │   ├── /api/scan
  │   ├── /api/track/[code]    (publico, solo step codes)
  │   ├── /api/upload
  │   ├── /api/customers
  │   ├── /api/addresses
  │   ├── /api/localities
  │   └── /api/departments
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

Cuando se actualiza un step, la orden se recalcula automaticamente:
```
- Todos los steps entregados (status 5) → orden Completado (4)
- Todos los steps finalizados (status >= 5) → orden Completado parcial (5)
- Algun step en viaje (status 3) → orden En Curso (3)
- Algun step asignado+ (status >= 2) → orden Asignado (2)
- Sino → orden Pendiente (1)
```

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
  "next-pwa": "^5.6.0"
}
```
