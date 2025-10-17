# UI Foundations - Planificador UCN Optimish

## 1. Wireframes de vistas base

### Login
```
+------------------------------+
|  Logo / titulo               |
|  Subtitulo                   |
|  [ Email input ]             |
|  [ Contrasena input ]        |
|  [ Iniciar sesion ]          |
|  Olvide mi contrasena        |
|  CTA admin secundaria        |
+------------------------------+
```

### Dashboard autenticado
```
+---------+----------------------------------+
| Sidebar | Header (selector de carrera)     |
| Links   +----------------------------------+
| Logout  | Contenido de modulo              |
+---------+----------------------------------+
```

### Contenedor de modulos
- Header de pagina: titulo + descripcion breve + acciones.
- Seccion de resumen con cards de metricas.
- Grid o lista central con cards o tablas.
- Estados empty y loading reutilizables dentro del cuerpo.

## 2. Mapa de navegacion

| Ruta | Descripcion | Estados |
|------|-------------|---------|
| `/` | Login | loading submit / error credenciales |
| `/forgot` | Recuperar acceso | loading submit / success |
| `/admin` | Configurar clave admin | validacion de entrada |
| `/avance` | Avance curricular | loading inicial / error / empty malla |
| `/plan` | Generador de proyecciones | loading API / opciones vacias / success |
| `/proyecciones` | Lista de proyecciones | loading / empty / error |
| `/demanda` | Demanda agregada | loading / empty |
| `/oferta` | Gestion de oferta admin | requiere adminKey / loading / empty |
| `/404` | Pagina no encontrada | enlaces a login o panel |

Transiciones clave:
- Login exitoso -> `/avance`.
- Logout desde sidebar -> `/`.
- Rutas protegidas sin `rut` redirigen a `/`.

## 3. Tokens de espaciado y tipografia

| Token | Valor | Uso |
|-------|-------|-----|
| `space-xs` | `0.5rem` | chips, badges |
| `space-sm` | `0.75rem` | padding de inputs y botones |
| `space-md` | `1rem` | separacion vertical estandar |
| `space-lg` | `1.5rem` | bloques principales |
| `space-xl` | `2rem` | margenes de secciones |

| Token tipografia | Valor | Uso |
|------------------|-------|-----|
| `font-display` | `Inter, system-ui, sans-serif` | encabezados |
| `font-body` | `Inter, system-ui, sans-serif` | texto regular |
| `text-xs` | `0.75rem` | metadatos |
| `text-sm` | `0.875rem` | subtitulos |
| `text-base` | `1rem` | cuerpo principal |
| `text-lg` | `1.125rem` | titulos de widget |
| `text-xl` | `1.25rem` | headers de pagina |

## 4. Tokens iniciales de color (contraste AA)

| Token | Light | Dark | Notas |
|-------|-------|------|-------|
| `brand-primary` | `#0f766e` | `#14b8a6` | Botones principales |
| `brand-accent` | `#f97316` | `#fb923c` | Acciones destacadas |
| `surface-default` | `#ffffff` | `#0f172a` | Cards y fondo base |
| `surface-muted` | `#f8fafc` | `#1e293b` | Fondos secundarios |
| `border-subtle` | `#e2e8f0` | `#334155` | Bordes de cards |
| `text-primary` | `#0f172a` | `#f8fafc` | Texto principal |
| `text-secondary` | `#475569` | `#cbd5f5` | Texto secundario |
| `status-success` | `#047857` | `#34d399` | Mensajes de exito |
| `status-error` | `#b91c1c` | `#f87171` | Mensajes de error |

Estos tokens alimentan la configuracion de Tailwind (`theme.extend`) y deben usarse como referencia para cualquier componente o pagina nueva.

