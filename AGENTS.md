# Guía para Desarrolladores - Lomando

## Configuración del Entorno

### Requisitos
- Node.js 18+ 
- MySQL/MariaDB
- npm

### Instalación
```bash
cd lomandotracking-web
npm install
```

### Variables de Entorno
Crear archivo `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lomando_app
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
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Autenticación
│   │   ├── orders/        # Gestión de pedidos
│   │   ├── scan/          # Escaneo QR
│   │   ├── steps/        # Actualización de pasos
│   │   └── ...
│   ├── (pages)/          # Páginas
│   │   ├── scan/         # Escaneo
│   │   ├── orders/       # Pedidos
│   │   └── ...
│   └── layout.tsx         # Layout principal
├── context/
│   └── AuthContext.tsx    # Autenticación
├── lib/
│   └── db.ts              # Conexión a MySQL
└── types/                 # Tipos TypeScript
```

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Start producción
npm start

# Lint
npm run lint

# Verificar tipos TypeScript
npx tsc --noEmit
```

---

## Base de Datos

### Conectar a MySQL
```bash
mysql -u root -p lomando_app
```

### Tablas Importantes
- `users`: Usuarios del sistema
- `drivers`: Repartidores (relación con users)
- `customers`: Clientes
- `orders`: Pedidos
- `order_steps`: Pasos/destinos del pedido
- `order_tracking`: Historial de cambios

### Notas Técnicas
- `order_steps.assigned_driver_id` referencia `drivers.id`, NO `drivers.user_id`
- El código de paso = código de pedido + (step_order × 100)
- Estados usan `display_order` para determinar flujo

---

## Agregar Nueva Funcionalidad

### 1. Nueva API Route
Crear archivo en `src/app/api/[recurso]/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Lógica...
  return NextResponse.json({ data });
}
```

### 2. Nueva Página
Crear archivo en `src/app/[ruta]/page.tsx`:
```typescript
'use client';
import { useState, useEffect } from 'react';

export default function NuevaPagina() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Fetch data
  }, []);
  
  return (
    <div>
      {/* UI */}
    </div>
  );
}
```

### 3. Nuevo Componente
Crear en `src/components/` y usar en páginas.

---

## Estándares de Código

### TypeScript
- Usar interfaces para tipos de datos
- Evitar `any` cuando sea posible
- Tipar respuestas de API

### React
- Usar functional components con hooks
- 'use client' en componentes que usan useState/useEffect
- Nombrar eventos como `handleXxx`

### Estilos
- Tailwind CSS para estilos
- Usar clases de utilidad
- Mantener consistencia con el tema sky blue

### Git
- Commits descriptivos en español o inglés
- Ramas para features: `feature/nombre`
- Bug fixes: `fix/descripcion`

---

## Testing

### Verificar Build
```bash
npm run build
```

### Verificar Lint
```bash
npm run lint
```

### Probar Manualmente
1. Crear pedido con destinos
2. Escanear como repartidor
3. Actualizar estados
4. Escanear como cliente

---

## Notas Importantes

1. **Next.js 15**: Usar versión 15.1.6 (Next.js 16 tiene issues con Turbopack)

2. **Autenticación**: Simple con localStorage, no es segura para producción

3. **Códigos QR**: 
   - Pedido: `D000000060000`
   - Paso 1: `D000000060100`
   - Paso 2: `D000000060200`

4. **Filtro de Pasos para Driver**: 
   - Ver todos los pasos para contexto
   - Solo actuar en pasos asignados (where assigned_driver_id = driver.id)

5. **IDs de Driver**: 
   - `user.id` = GUID del usuario
   - `driver.id` = ID numérico autoincremental
   - Usar siempre `driver.id` para asignaciones

---

## Problemas Comunes

### Turbopack Error
Si hay errores de Turbopack, verificar:
- Versión de Next.js (usar 15.x)
- No usar `--no-turbopack` (no existe)

### Error de Build
```bash
# Limpiar cache
rm -rf .next
npm run build
```

### Error de Conexión DB
Verificar:
- MySQL corriendo
- Credenciales en .env
- Base de datos `lomando_app` existe
