# Especificaciones Técnicas - Lomando

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │
│  │  Pages  │ │  API    │ │  Auth   │ │   Components    │  │
│  │ .tsx    │ │ Routes  │ │Context  │ │                 │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Backend)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │
│  │ /scan    │ │ /orders  │ │ /steps   │ │ /customers │   │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL Database                             │
│  ┌────────┐ ┌─────────┐ ┌───────────┐ ┌────────────────┐   │
│  │ orders │ │drivers  │ │order_steps│ │order_tracking  │   │
│  └────────┘ └─────────┘ └───────────┘ └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Convenciones de Código

### Códigos de Pedido
- Longitud: 12 caracteres
- Prefijo: `D`
- Formato: `D` + 11 dígitos secuenciales
- Ejemplo: `D000000060000`

### Códigos de Paso
- Longitud: 12 caracteres
- Formación: Código de pedido + (step_order × 100)
- Paso 1: `D000000060100` (pedido 6000 + 1×100 = 100)
- Paso 2: `D000000060200` (pedido 6000 + 2×100 = 200)
- Paso 3: `D000000060300` (pedido 6000 + 3×100 = 300)

### Estados (Display Order)
El `display_order` controla el ordenamiento y los colores en la UI:
- Estados menores = más temprano en el flujo
- Estados mayores = más avanzado en el flujo

## Autenticación

Sistema simple basado en localStorage:
```typescript
interface User {
  id: string;        // GUID
  username: string;
  role: 'manager' | 'driver' | 'customer';
  name?: string;
}
```

## Permisos por Rol

```typescript
// Página de escaneo
const canViewAllSteps = user.role === 'manager';
const canActOnStep = (step) => {
  if (user.role === 'manager') return true;
  if (user.role === 'driver') return isDriverAssigned(step);
  return false;
};
```

## Integración con GeneXus

- Base de datos separada (`lomando_app`) para independencia
- Tabla `users` puede sincronizarse con GAM de GeneXus
- IDs de usuario usan formato GUID compatible con GeneXus

## Configuración de Entorno

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lomando_app

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Dependencias

```json
{
  "next": "15.1.6",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "mysql2": "^3.18.2",
  "html5-qrcode": "^2.3.8",
  "next-pwa": "^5.6.0",
  "tailwindcss": "^4"
}
```

## Build y Deploy

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Verificar tipos
npx tsc --noEmit

# Lint
npm run lint
```
