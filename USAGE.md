# Guia de Usuario - Lomando

## Iniciar Sesion

1. Ir a la pagina principal (se muestra `/login`)
2. En el panel derecho, ingresar email y contrasena
3. Click en "Ingresar"

Si tenes un codigo de paquete, podes consultar su estado desde el panel izquierdo sin necesidad de loguearte.

---

## Manager (Administrador)

### Dashboard
- Ve todos los pedidos con filtros por estado
- Click en un pedido para ver detalle completo

### Crear Pedido
1. Menu → "Nuevo Envio"
2. Completar datos de origen:
   - Calle, numero, departamento
   - Localidad (autocompletado al tipear)
   - Contacto y telefono
   - Opcionalmente guardar direccion para uso futuro
3. Agregar destinos:
   - Direccion, contacto, telefono, notas
   - Cantidad de paquetes por destino
4. Click "Confirmar Pedido"

### Detalle del Pedido
- Ver QR de la orden y de cada paso
- Imprimir etiquetas (una por paquete, con QR)
- Imprimir hoja de ruta (con todos los destinos, QR y espacios para firma)

### Gestionar Clientes
- Menu → "Clientes"
- Ver lista de clientes existentes

---

## Repartidor (Driver)

### Escanear QR
1. Menu → "Escanear"
2. Apuntar la camara al QR del pedido o paquete
3. Se abre automaticamente la pagina de seguimiento con las acciones disponibles

### Vista de Orden (al escanear QR de pedido)
1. Ver datos del pedido: codigo, cliente, telefono
2. Ver direccion de retiro
3. **Acciones sobre la orden:**
   - "Confirmar retiro" (si estado = Pendiente)
   - "Salir a entregar" (si estado = Asignado)
4. **Acciones sobre cada destino** (sin necesidad de escanear cada QR):
   - "En camino" → indica que va hacia ese destino
   - "Entregar" → abre formulario para nombre y CI del receptor
   - "Problema" → seleccionar motivo y adjuntar foto del domicilio

### Vista de Paso (al escanear QR de paquete)
- Ver datos del destino: direccion, contacto, notas, cantidad de paquetes
- Mismas acciones: En camino, Entregar, Reportar problema

### Entrega
1. Click en "Entregar"
2. Ingresar nombre de quien recibe
3. Ingresar cedula (CI)
4. Click "Confirmar"

### Reportar Problema
1. Click en "Problema"
2. Seleccionar motivo:
   - No se encontro al destinatario
   - Direccion incorrecta
   - Destinatario rechazo el paquete
   - Zona inaccesible
   - Otro
3. Opcionalmente tomar foto del domicilio
4. Click "Enviar reporte"

---

## Cliente (Customer)

### Crear Pedido
1. Menu → "Nuevo Envio"
2. Se asigna automaticamente como cliente de la orden
3. Completar origen y destinos
4. Puede guardar direcciones en su libro de direcciones

### Mis Envios
- Menu → "Mis Envios"
- Ver lista de sus pedidos con estado actual

### Mis Domicilios
- Menu → "Mis Domicilios"
- Administrar direcciones guardadas para reutilizar al crear pedidos

### Rastrear Paquete
- Desde la pagina de login (sin loguearse) o desde `/seguimiento`
- Ingresar el codigo del paquete (ej: D000000060200)
- Ver estado actual, direccion y datos de contacto

---

## Seguimiento Publico (sin login)

Cualquier persona puede consultar el estado de un paquete:

1. Escanear el QR del paquete con la camara del telefono → se abre la pagina de seguimiento
2. O ir a la pagina de login e ingresar el codigo manualmente

**Solo se pueden consultar codigos de paquete (paso), no de orden.**
Si se intenta consultar un codigo de orden, se redirige al login.

---

## Codigos QR

### Donde estan los QR
- En el detalle del pedido (boton "Ver QR")
- En las etiquetas impresas (uno por paquete)
- En la hoja de ruta

### Que contienen
URL completa de tracking, por ejemplo:
```
https://tudominio.com/seguimiento?code=D000000060200
```

### Como escanear
- Desde la app: Menu → "Escanear" → apuntar camara
- Con camara nativa del telefono: escanear y se abre el navegador directo al seguimiento

---

## Solucion de Problemas

### No veo botones de accion (Driver)
- Solo aparecen en los pasos que tenes asignados
- Verifica que el paso este en el estado correcto para la accion

### No puedo consultar un codigo
- Codigos de orden requieren login
- Codigos de paquete funcionan sin login

### La camara no funciona
- Verificar permisos de camara en el navegador
- Usar HTTPS (la camara no funciona en HTTP excepto localhost)
