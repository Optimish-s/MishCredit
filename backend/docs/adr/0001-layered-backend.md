# ADR 0001 - Estructura por capas

## Contexto
Se requiere homologar la arquitectura del backend para alinear dominio, aplicacion, infraestructura y capa web, y habilitar validacion temprana de variables de entorno con mecanismos de seguridad basicos.

## Opciones
1. Mantener el scaffolding por defecto de NestJS con un solo modulo y sin divisiones
2. Crear modulos segun dominio pero sin capa central de configuracion
3. Aplicar estructura en capas con modulo core global y directorios dedicados

## Decision
Escogimos la opcion 3 para habilitar configuracion global, logger compartido, seguridad y convenciones de importacion, manteniendo el codigo listo para extender reglas de dominio.

## Consecuencias
- La inicializacion se centraliza en `CoreModule` y se expone a `WebModule`
- Las futuras funcionalidades deben respetar los directorios establecidos
- Requiere documentar y mantener las rutas alias en `tsconfig.json`
