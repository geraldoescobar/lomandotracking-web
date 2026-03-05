# Lomando - Sistema de Tracking de Entregas

## Descripción del Proyecto

**Lomando** es una aplicación web de seguimiento de entregas diseñada para gestionar pedidos con múltiples destinos. Permite a diferentes roles de usuario (Manager, Driver, Customer) interactuar con pedidos y entregas de manera eficiente.

El proyecto surge como una solución independiente para evitar dependencias con GeneXus GAM, utilizando una base de datos MySQL separada (`lomando_app`).

---

## Características Principales

- **Gestión de Pedidos**: Creación de pedidos con origen y múltiples destinos
- **Escaneo QR**: Seguimiento mediante códigos QR escaneables
- **Flujo de Trabajo de Repartidor**: Asignación de pedidos, actualización de estado por paso
- **Tracking para Cliente**: Los clientes pueden rastrear sus entregas escaneando códigos de paso
- **Interfaz Responsive**: Diseño adaptable para móvil y escritorio
- **Impresión de Hojas de Ruta**: Generación de documentos imprimibles para repartidores

---

## Roles de Usuario

### Manager (Administrador)
- Ve todos los pedidos y destinos
- Puede crear nuevos pedidos
- Puede cambiar el estado de cualquier pedido o paso
- Acceso completo a todas las funcionalidades

### Repartidor (Driver)
- Ve únicamente los pasos asignados a él
- Puede actualizar el estado de sus pasos asignados
- Ve todos los pasos del pedido (para contexto), pero solo actúa en los propios

### Cliente (Customer)
- Puede rastrear entregas escaneando códigos de paso
- Ve solo el estado actual del paso escaneado
- No puede modificar estados

---

## Códigos y Formatos

### Código de Pedido
```
D000000060000
```
- Formato: `D` + 11 dígitos
- Ejemplo: D000000060000, D000000060001

### Código de Paso/Destino
```
D000000060100
D000000060200
D000000060300
```
- Formato: Código de pedido + (número de paso × 100)
- Paso 1: D000000060100
- Paso 2: D000000060200
- Paso 3: D000000060300

---

## Estados de Pedido

| ID | Nombre | Orden Display | Descripción |
|----|--------|---------------|-------------|
| 1 | Pendiente | 1 | Pedido creado, sin asignar |
| 2 | Asignado | 2 | Pedido asignado a un repartidor |
| 3 | En Curso | 3 | Pedido en proceso de entrega |
| 4 | Completado | 4 | Todos los pasos entregados |
| 5 | Cancelado | 6 | Pedido cancelado |

---

## Estados de Paso (Order Step)

| ID | Nombre | Orden Display | Descripción |
|----|--------|---------------|-------------|
| 1 | Pendiente | 1 | Paso sin asignar |
| 2 | Asignado | 2 | Asignado a un repartidor |
| 3 | En Viaje | 3 | Repartidor en camino al destino |
| 5 | Entregado | 4 | Entregado exitosamente |
| 6 | No Entregado | 5 | No se pudo entregar |

---

## Flujo de Trabajo

### Creación de Pedido (Manager)
1. Acceder a "Nuevo Pedido"
2. Ingresar descripción del pedido
3. Seleccionar cliente
4. Agregar destino(s) con:
   - Tipo (origin/destination)
   - Dirección
   - Nombre de contacto
   - Teléfono
   - Notas
   - Cantidad de paquetes

### Proceso de Entrega (Driver)
1. Escanear código QR del pedido o ingresar código manualmente
2. Ver todos los destinos del pedido
3. Para cada paso asignado:
   - Click "Asignarme" (si estado = Pendiente) → cambia a Asignado
   - Click "En Viaje" (si estado = Asignado) → cambia a En Viaje
   - Click "Entregado" (si estado = En Viaje) → requiere nombre y documento del receptor
   - Click "No Entregado" (si estado = En Viaje) → marca como no entregado

### Seguimiento (Customer)
1. Escanear código QR del paso (no del pedido)
2. Ver estado actual del paso
3. Ver información del destino

---

## Stack Tecnológico

- **Frontend**: Next.js 15.1.6, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Base de Datos**: MySQL (MariaDB)
- **Escaneo QR**: html5-qrcode
- **PWA**: next-pwa
- **Autenticación**: Custom (localStorage)

---

## Estructura de Base de Datos

### Tablas Principales

```sql
-- Usuarios (integración con sistema externo)
users
├── id (GUID)
├── username
├── role (manager/driver/customer)
├── email
└── active

-- Repartidores
drivers
├── id (INT, AUTO_INCREMENT)
├── user_id (GUID, FK a users.id)
├── name
├── phone
└── active

-- Clientes
customers
├── id (INT, AUTO_INCREMENT)
├── user_id (GUID, FK a users.id) -- puede ser null
├── name
├── lastname
├── phone
├── email
└── created_at

-- Pedidos
orders
├── id (INT, AUTO_INCREMENT)
├── code (VARCHAR, único)
├── description
├── customer_id (INT, FK a customers.id)
├── status_id (INT)
├── notes
├── type
├── created_at
└── updated_at

-- Pasos del Pedido
order_steps
├── id (INT, AUTO_INCREMENT)
├── order_id (INT, FK a orders.id)
├── step_type (origin/destination)
├── step_order (INT)
├── address
├── contact_name
├── contact_phone
├── notes
├── package_qty (INT)
├── code (VARCHAR, único)
├── status_id (INT)
├── assigned_driver_id (INT, FK a drivers.id)
└── created_at

-- Estados de Pedido
order_statuses
├── id (INT)
├── name (VARCHAR)
├── display_order (INT)
└── active (BOOLEAN)

-- Estados de Paso
order_step_statuses
├── id (INT)
├── name (VARCHAR)
├── display_order (INT)
└── active (BOOLEAN)

-- Historial de Tracking
order_tracking
├── id (INT, AUTO_INCREMENT)
├── order_id (INT, FK a orders.id)
├── step_id (INT, FK a order_steps.id, nullable)
├── from_status_id (INT)
├── to_status_id (INT)
├── observation
├── receiver_name
├── receiver_document
├── user_id (GUID)
└── created_at
```

---

## API Endpoints

### Autenticación
```
POST /api/auth/login
Body: { username, password }
Response: { id, username, role, name }
```

### Pedidos
```
GET    /api/orders
GET    /api/orders/[id]
POST   /api/orders/create
PUT    /api/orders/[id]/status
GET    /api/orders/[id]/tracking
```

### Pasos
```
PUT /api/steps/[id]/status
Body: { statusId, userId, observation, receiverName, receiverDocument }
```

### Escaneo
```
GET /api/scan?code=XXX&role=XXX&userId=XXX
Response: { type: 'order'|'step', order, steps[], driverSteps[], tracking }
```

### Seguimiento Público
```
GET /api/track/[code]
```

### Direcciones
```
GET /api/addresses?customerId=XXX
```

---

## Páginas de la Aplicación

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Dashboard - Lista de pedidos | Manager, Driver |
| `/login` | Login de usuario | Público |
| `/scan` | Escaneo QR y búsqueda | Todos |
| `/track` | Seguimiento público | Público |
| `/orders/new` | Crear nuevo pedido | Manager |
| `/orders/[id]` | Detalle del pedido | Manager, Driver |
| `/customers` | Lista de clientes | Manager |

---

## Instalación y Configuración

### Requisitos
- Node.js 18+
- MySQL/MariaDB
- npm

### Variables de Entorno
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=lomando_app
```

### Comandos
```bash
# Instalación de dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Lint
npm run lint
```

---

## Notas de Desarrollo

### Problemas Conocidos y Soluciones

1. **Error de Turbopack en Next.js 16**: Se downgradeó a Next.js 15.1.6
2. **Códigos de Driver**: El `user_id` del usuario no equivale al `id` de la tabla `drivers`. Los pasos usan `assigned_driver_id` que referencia `drivers.id`
3. **Filtro de Pasos para Repartidor**: El repartidor ve todos los pasos del pedido para contexto, pero solo puede actuar en los pasos donde `assigned_driver_id` coincide con su ID de driver

### Ejemplos de Uso

#### Escanear Pedido
- Código: `D000000060000`
- Muestra: Cabecera del pedido + lista de todos los destinos

#### Escanear Paso (Cliente)
- Código: `D000000060100`
- Muestra: Solo el estado de ese destino específico

#### Actualizar Estado de Paso
- Pendiente (1) → Asignado (2): Repartidor se asigna al paso
- Asignado (2) → En Viaje (3): Repartidor inicia entrega
- En Viaje (3) → Entregado (5): Requiere nombre y documento del receptor
- En Viaje (3) → No Entregado (6): Solo observación

---

## Historial de Versiones

### v1.0.0 (Actual)
- Creación de pedidos con múltiples destinos
- Escaneo QR para pedidos y pasos
- Flujo completo de entrega para repartidores
- Seguimiento público para clientes
- Dashboard con filtros de estado
- Impresión de hojas de ruta

---

*Documentación generada automáticamente del proyecto Lomando*
