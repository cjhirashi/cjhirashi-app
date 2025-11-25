# Monitoring Configuration Guide

**Proyecto**: cjhirashi-app v0.1
**Última actualización**: 2025-11-24

---

## Overview

Esta guía configura **Sentry** para error tracking y monitoring en producción.

**Estado Actual**: ⚠️ OPCIONAL - No implementado por defecto

**Si decides implementar Sentry**, sigue estos pasos:

---

## Paso 1: Crear Cuenta en Sentry

1. Ir a: https://sentry.io/signup/
2. Crear cuenta gratuita
3. Crear nuevo proyecto:
   - Platform: **Next.js**
   - Project name: `cjhirashi-app`
4. Copiar el **DSN** (Data Source Name)

---

## Paso 2: Instalar Sentry SDK

```bash
npm install @sentry/nextjs
```

---

## Paso 3: Inicializar Sentry

Ejecutar el wizard de Sentry:

```bash
npx @sentry/wizard@latest -i nextjs
```

Esto creará automáticamente:
- `sentry.client.config.ts` - Configuración para cliente
- `sentry.server.config.ts` - Configuración para servidor
- `sentry.edge.config.ts` - Configuración para edge runtime
- Actualizará `next.config.ts` para incluir Sentry

---

## Paso 4: Configurar Environment Variables

Agregar a Vercel:

```bash
SENTRY_DSN="https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]"
SENTRY_AUTH_TOKEN="[TOKEN]" # Para source maps (opcional)
```

**Dónde configurar**:
- Vercel: Project Settings > Environment Variables
- Marcar `SENTRY_AUTH_TOKEN` como **Sensitive**

---

## Paso 5: Configuración Mínima

### sentry.client.config.ts
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Percentage of events to send (1.0 = 100%)
  tracesSampleRate: 1.0,

  // Only send errors in production
  environment: process.env.VERCEL_ENV || 'development',

  // Don't send errors in development
  enabled: process.env.NODE_ENV === 'production',
});
```

### sentry.server.config.ts
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: 1.0,

  environment: process.env.VERCEL_ENV || 'development',

  enabled: process.env.NODE_ENV === 'production',
});
```

---

## Paso 6: Usar Sentry en Código

### Capturar Errores Manualmente
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // código que puede fallar
} catch (error) {
  Sentry.captureException(error);
  throw error; // o manejar
}
```

### Agregar Contexto a Errores
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
});

Sentry.setTag('feature', 'admin-panel');
```

### Error Boundary Personalizado
```typescript
'use client'

import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <Error />
      </body>
    </html>
  );
}
```

---

## Paso 7: Configurar Alertas

En Sentry Dashboard:

1. Navegar a: **Alerts > Create Alert**
2. Configurar alertas para:
   - **Error rate spike**: >10 errores en 5 minutos
   - **New error type**: Primera ocurrencia de error nuevo
   - **Performance degradation**: >1s de respuesta promedio
3. Configurar notificaciones:
   - Email
   - Slack (opcional)
   - PagerDuty (opcional)

---

## Paso 8: Verificar Configuración

### Forzar Error de Prueba

Agregar temporalmente en una página:

```typescript
export default function TestPage() {
  return (
    <button onClick={() => {
      throw new Error("Sentry test error");
    }}>
      Throw test error
    </button>
  );
}
```

Deploy y clickear el botón. Verificar que error aparece en Sentry Dashboard.

**⚠️ ELIMINAR DESPUÉS DE VERIFICAR**

---

## Alternativas a Sentry

Si prefieres NO usar Sentry, considera:

### 1. Vercel Analytics (Built-in)
- **Pros**: Integrado, fácil configuración
- **Cons**: Funcionalidades limitadas
- **Setup**: Activar en Vercel Dashboard > Analytics

### 2. LogRocket
- **Pros**: Session replay, más detallado
- **Cons**: Más caro
- **Setup**: Similar a Sentry

### 3. Console Logging + Vercel Logs
- **Pros**: Gratis, simple
- **Cons**: Manual, no alertas
- **Setup**: Ya implementado

---

## Monitoring Sin Herramientas Externas

### Console Logging Estructurado

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.message, stack: error?.stack, ...meta, timestamp: new Date().toISOString() }));
  },
  warn: (message: string, meta?: object) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }));
  },
};
```

**Uso**:
```typescript
import { logger } from '@/lib/logger';

try {
  // código
} catch (error) {
  logger.error('Failed to fetch users', error, { userId: user.id });
  throw error;
}
```

**Ver logs en Vercel**:
- Vercel Dashboard > Project > Logs
- Filtrar por severity

---

## Health Monitoring

### API Health Check (Ya implementado)

```
GET /api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-24T10:00:00.000Z",
  "checks": {
    "database": "connected",
    "server": "running"
  }
}
```

### Monitoreo Externo (Uptime Check)

Usar servicios gratuitos:
- **UptimeRobot**: https://uptimerobot.com
- **Pingdom**: https://www.pingdom.com
- **StatusCake**: https://www.statuscake.com

**Configuración**:
1. Crear cuenta
2. Agregar monitor:
   - URL: `https://your-app.vercel.app/api/health`
   - Interval: 5 minutos
   - Alert: Email si status != 200

---

## Recomendaciones

### Para Proyectos Pequeños (MVP)
- ✅ Usar console.log estructurado + Vercel Logs
- ✅ Configurar UptimeRobot para health check
- ✅ Revisar logs manualmente 1x/semana
- ❌ NO configurar Sentry (overhead innecesario)

### Para Proyectos en Crecimiento
- ✅ Implementar Sentry (plan gratuito: 5K events/mes)
- ✅ Configurar alertas para errores críticos
- ✅ Agregar Vercel Analytics
- ✅ Monitorear logs diariamente

### Para Producción Activa
- ✅ Sentry con plan pago
- ✅ LogRocket para session replay
- ✅ Alertas en Slack
- ✅ On-call rotation

---

## Métricas Clave a Monitorear

1. **Error Rate**: <1% de requests
2. **Response Time**: <500ms promedio
3. **Uptime**: >99.9%
4. **Database Connection Errors**: 0
5. **Failed Authentications**: Detectar ataques

---

## Referencias

- **Sentry NextJS Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Vercel Logs**: https://vercel.com/docs/observability/logging
- **Vercel Analytics**: https://vercel.com/docs/analytics
- **Health Check Pattern**: `app/api/health/route.ts`
