# MishCredit - Planificador UCN

## Tecnologias

- Backend: NestJS (TypeScript) + Mongoose + Axios + Swagger opcional + Helmet + rate limit
- Frontend: React + Vite + Tailwind CSS
- Base de datos: MongoDB 7
- Integraciones: APIs UCN (login, malla, avance) con stubs y respaldos CSV/JSON

## Arquitectura

- `backend/`: servicio HTTP REST en NestJS
- `frontend/`: SPA en React servida por Nginx en produccion (imagen Docker)
- `docker-compose.yml`: orquesta MongoDB, backend y frontend en una sola red

## Puesta en marcha con Docker (recomendado)

1. Copia `backend/.env.example` a `backend/.env` y ajusta al menos:
   - `MONGO_URI=mongodb://mongo:27017/planificador`
   - `USE_STUBS=true` si quieres probar sin conectarte a UCN
2. Copia `frontend/.env.example` a `frontend/.env` y ajusta:
   - `VITE_API_BASE=http://localhost:3000/api`
3. Desde la raiz del repo ejecuta:
   - `docker compose up --build`
4. Accede a:
   - Frontend: `http://localhost:8080`
   - Backend: `http://localhost:3000`
   - Swagger (si `SWAGGER_ENABLED=true` en backend): `http://localhost:3000/api/docs`

## Desarrollo local sin Docker

### Backend

```bash
cd backend
cp .env.example .env   # ajusta valores
npm install
npm run start:dev
```

El backend se levanta en `http://localhost:3000`.

### Frontend

```bash
cd frontend
cp .env.example .env   # ajusta VITE_API_BASE
npm install
npm run dev
```

El frontend se levanta en `http://localhost:5173`.

## Funcionalidades principales

### Login y seleccion de carrera

- Pantalla de login UCN por rut y correo de prueba
- Carga las carreras y catalogos asociados al estudiante
- Guarda la seleccion actual en un store global para reusar en todas las paginas

### Plan de proyeccion (`/plan`)

- Permite definir:
  - Tope de creditos totales
  - Rango de creditos por ramo
  - Flags de "maximizar creditos" y "priorizar reprobados"
  - Lista de ramos prioritarios seleccionados desde la malla
- Genera una seleccion principal respetando prerrequisitos
- Permite generar variantes adicionales a partir de una seleccion ya calculada
- Cada variante se puede guardar como proyeccion normal o favorita
- Maneja stubs locales si el backend no responde (modo demo)

### Mis proyecciones (`/proyecciones`)

- Lista todas las proyecciones guardadas para el rut actual
- Filtro por carrera y catalogo sincronizado con la seleccion del header
- Muestra por cada proyeccion:
  - Total de creditos
  - Numero de ramos
  - Numero de ramos reprobados incluidos
  - Rango y promedio de niveles
- Permite:
  - Editar nombre
  - Marcar o cambiar favorita
  - Eliminar una sola proyeccion
  - Eliminar todas las proyecciones visibles (segun filtro) con confirmacion y opcion de conservar la favorita

### Demanda agregada (`/demanda`)

- Consulta demanda agregada a partir de las proyecciones existentes
- Filtros:
  - Modo favoritas o total
  - Agrupar por codigo de curso o por NRC
  - Filtro opcional de carrera (`codCarrera`), manteniendo el comportamiento global si no se especifica
- Muestra:
  - Top de claves con mayor demanda en forma de grafico de barras
  - Tabla con inscritos por curso o NRC
- Mensajes claros cuando no hay registros para la combinacion de filtros actual

### Admin y oferta

- Ruta `/admin` para ingresar la cabecera `X-ADMIN-KEY` que se usa contra el backend
- Ruta `/oferta` para cargar CSV de oferta academica y consultarla
- Estos endpoints se protegen con `ADMIN_API_KEY` en backend

## Credenciales de prueba

- Estudiante 1: rut `333333333`, email `juan@example.com`, password `1234` (ICCI 201610)
- Estudiante 2: rut `222222222`, email `maria@example.com`, password `abcd` (ITI 202410)
- Estudiante 3: rut `111111111`, email `ximena@example.com`, password `qwerty` (ICCI 201610)

## Endpoints utiles

- Health: `GET /api/health`
- Auth demo: `POST /api/auth/login`, `POST /api/auth/forgot`
- UCN proxy:
  - `GET /api/ucn/malla/:codCarrera/:catalogo`
  - `GET /api/ucn/avance?rut=&codCarrera=`
- Proyecciones:
  - `POST /api/proyecciones/generar`
  - `POST /api/proyecciones/generar-opciones`
  - `POST /api/proyecciones/guardar-directo`
  - `PATCH /api/proyecciones/favorita/:id`
  - `PATCH /api/proyecciones/:id/nombre`
  - `DELETE /api/proyecciones/:id`
  - `GET /api/proyecciones/mias`
  - `GET /api/proyecciones/demanda/agregada`
- Admin:
  - Carga de oferta y respaldos UCN (requiere `X-ADMIN-KEY` y `ADMIN_API_KEY`)

## Problemas comunes

- Si la integracion con UCN no esta disponible:
  - En `backend/.env` usar `USE_STUBS=true`
- Si hay problemas con datos antiguos:
  - Detener contenedores: `docker compose down`
  - Volver a levantar: `docker compose up --build`
- Para correr tests de backend:

```bash
cd backend
npm install
npm test
```

