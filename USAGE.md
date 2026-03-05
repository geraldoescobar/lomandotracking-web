# Guía de Usuario - Lomando

## Introducción

Lomando es un sistema de tracking de entregas que permite gestionar pedidos con múltiples destinos. Cada usuario tiene acceso a funcionalidades específicas según su rol.

---

## Iniciar Sesión

1. Abrir la aplicación
2. Ingresar nombre de usuario y contraseña
3. Seleccionar el rol (si hay múltiples cuentas)

---

## Manager (Administrador)

### Ver Pedidos
1. Desde la página principal, ver la lista de todos los pedidos
2. Usar los filtros para buscar por estado (Pendiente, Asignado, En Curso, Completado, Cancelado)
3. Click en un pedido para ver detalles

### Crear Nuevo Pedido
1. Click en "Nuevo Pedido" en el menú
2. Completar los datos:
   - **Descripción**: Descripción breve del pedido
   - **Cliente**: Seleccionar cliente existente o crear nuevo
   - **Notas**: Observaciones adicionales (opcional)
3. Agregar destinos:
   - **Tipo**: Origin (origen) o Destination (destino)
   - **Dirección**: Dirección completa
   - **Contacto**: Nombre y teléfono
   - **Notas**: Observaciones específicas
   - **Paquetes**: Cantidad
4. Click en "Crear Pedido"

### Gestionar Pedidos
- **Cambiar estado del pedido**: En la página de detalle, usar los botones de cambio de estado
- **Ver historial**: Sección "Historial" muestra todos los cambios
- **Imprimir hoja de ruta**: Click en el ícono de impresora

### Gestionar Repartidores
- Los repartidores se asignan a los pasos directamente
- Ver qué repartidor tiene cada destino en la lista de pasos

---

## Repartidor (Driver)

### Ver Mis Entregas
1. Escanear el código QR del pedido o ingresar el código manualmente
2. En la página de detalle, ver "Mis Destinos" (pasos asignados al repartidor)
3. Ver estado de cada paso (Pendiente, Asignado, En Viaje, Entregado)

### Actualizar Estado de Entrega

**Paso 1: Asignarme**
- Cuando un paso está en estado "Pendiente"
- Click en "Asignarme"
- El paso cambia a "Asignado"

**Paso 2: En Viaje**
- Cuando el paso está "Asignado"
- Click en "En Viaje"
- El repartidor indica que está en camino

**Paso 3: Entregado**
- Cuando el paso está "En Viaje"
- Click en "Entregado"
- Se abre modal para ingresar:
  - Nombre de quien recibe
  - Documento (C.I.)
  - Observación (opcional)
- Click en "Confirmar"

**Paso 4: No Entregado**
- Si no se puede entregar (ausente, dirección incorrecta, etc.)
- Click en "No Entregado"
- El paso se marca con ese estado
- Se puede agregar observación

### Importante
- El repartidor ve TODOS los destinos del pedido (para contexto)
- Solo puede actuar en los destinos que tiene ASIGNADOS
- Los botones de acción solo aparecen en los pasos asignados

---

## Cliente (Customer)

### Rastrear Entrega
1. Escanear el código QR del paso (no del pedido completo)
   - El código del paso tiene formato: `D000000060100`
2. O ingresar el código manualmente en la página de escaneo
3. Ver el estado actual del destino:
   - Pendiente: Aún no se ha entregado
   - Asignado: Un repartidor está asignado
   - En Viaje: El repartidor está en camino
   - Entregado: Ya fue entregado
   - No Entregado: No se pudo entregar

### Información Mostrada
- Código del paso
- Estado actual
- Tipo de destino (origen/destino)
- Dirección
- Contacto
- Notas

---

## Códigos QR

### Dónde encontrar los códigos

**Código de Pedido** (para repartidores)
- Ejemplo: `D000000060000`
- Muestra todos los destinos del pedido

**Código de Paso** (para clientes)
- Ejemplo: `D000000060100`, `D000000060200`
- Cada destino tiene su propio código
- El cliente escanea el código del paso específico que quiere rastrear

### Formato de Códigos
- Pedido 6000 → `D000000060000`
- Paso 1 → `D000000060100`
- Paso 2 → `D000000060200`
- Paso 3 → `D000000060300`

---

## Estados del Pedido

| Estado | Descripción |
|--------|-------------|
| Pendiente | Pedido nuevo, sin asignar |
| Asignado | Asignado a un repartidor |
| En Curso | Entrega en proceso |
| Completado | Todos los destinos entregados |
| Cancelado | Pedido cancelado |

## Estados del Destino

| Estado | Descripción |
|--------|-------------|
| Pendiente | Sin asignar |
| Asignado | Asignado a repartidor |
| En Viaje | Repartidor en camino |
| Entregado | Entregado exitosamente |
| No Entregado | No se pudo entregar |

---

## Solución de Problemas

### No veo los botones de acción
- Verificar que el paso esté asignado al repartidor actual
- Los managers ven todos los botones
- Los repartidores solo ven los botones de sus pasos asignados

### No veo los destinos del pedido
- Verificar que el código escaneado sea del pedido, no del paso
- Código de pedido: `D000000060000`
- Código de paso: `D000000060100`

### Error al actualizar estado
- Verificar conexión a internet
- Verificar que el usuario tenga permisos

---

## Contacto y Soporte

Para asistencia técnica, contactar al administrador del sistema.
