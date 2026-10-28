# Backend CFT — API de ejemplo para clases

API REST construida con **Express 5 + Drizzle ORM + SQLite + JWT**, pensada para que los estudiantes la consuman desde sus propios frontends.

Incluye:

- Registro e inicio de sesión con **tokens JWT**
- Validación de datos con **Zod**
- CRUD de ejemplo (`posts`) con endpoints públicos y protegidos
- Base de datos **SQLite** en archivo local (no requiere instalar ningún motor)
- CORS habilitado para cualquier origen

## Requisitos

- Node.js 18 o superior

## Puesta en marcha

```bash
npm install          # instala dependencias
cp .env.example .env # crea tu archivo de entorno (opcional, hay defaults)
npm run db:generate  # genera las migraciones SQL desde el schema (ya incluidas)
npm run db:seed      # carga usuarios y posts de ejemplo
npm run dev          # levanta el servidor con recarga automática
```

La API queda disponible en `http://localhost:3000/api-backend`.

Las migraciones se aplican automáticamente al arrancar el servidor.

### Usuarios de prueba (del seed)

| Email               | RUT            | Password |
| ------------------- | -------------- | -------- |
| `docente@cft.cl`    | `11.111.111-1` | `123456` |
| `estudiante@cft.cl` | `17.370.131-4` | `123456` |

## Scripts

| Comando              | Descripción                                       |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Servidor con recarga automática (`node --watch`)  |
| `npm start`          | Servidor en modo normal                            |
| `npm run db:generate`| Genera migraciones a partir de `src/db/schema.js` |
| `npm run db:seed`    | Inserta datos de ejemplo                           |
| `npm run db:studio`  | Explorador visual de la base de datos (Drizzle)   |

## Estructura del proyecto

```
src/
├── index.js              # Punto de entrada: migra la DB y levanta el servidor
├── app.js                # Configuración de Express (CORS, JSON, rutas, errores)
├── config.js             # Variables de entorno centralizadas
├── db/
│   ├── schema.js         # Definición de tablas y relaciones (Drizzle)
│   ├── index.js          # Conexión a SQLite + migraciones
│   └── seed.js           # Datos de ejemplo
├── routes/               # Define QUÉ endpoints existen
├── controllers/          # Define QUÉ hace cada endpoint
├── middlewares/          # Auth JWT, validación, manejo de errores
└── validations/          # Schemas Zod para validar el body de las peticiones
```

## Endpoints

### Autenticación

| Método | Ruta                  | Auth | Descripción                        |
| ------ | --------------------- | ---- | ---------------------------------- |
| POST   | `/api-backend/auth/register`  | No   | Crear usuario (devuelve token)     |
| POST   | `/api-backend/auth/login`     | No   | Iniciar sesión (devuelve token)    |
| GET    | `/api-backend/auth/me`        | Sí   | Datos del usuario autenticado      |

### Posts

| Método | Ruta             | Auth | Descripción                          |
| ------ | ---------------- | ---- | ------------------------------------ |
| GET    | `/api-backend/posts`     | No   | Listar posts (con datos del autor)   |
| GET    | `/api-backend/posts/:id` | No   | Obtener un post                      |
| POST   | `/api-backend/posts`     | Sí   | Crear post                           |
| PUT    | `/api-backend/posts/:id` | Sí   | Editar post (solo el autor)          |
| DELETE | `/api-backend/posts/:id` | Sí   | Eliminar post (solo el autor)        |

### Usuarios

| Método | Ruta             | Auth | Descripción                      |
| ------ | ---------------- | ---- | -------------------------------- |
| GET    | `/api-backend/users`     | No   | Listar usuarios                  |
| GET    | `/api-backend/users/:id` | No   | Usuario con sus posts            |

## Cómo consumir la API desde un frontend

```js
// 1. Login: guardar el token
const res = await fetch('http://localhost:3000/api-backend/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'docente@cft.cl', password: '123456' }),
});
const { token, user } = await res.json();
localStorage.setItem('token', token);

// 2. Usar el token en endpoints protegidos
const posts = await fetch('http://localhost:3000/api-backend/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
  body: JSON.stringify({ title: 'Hola', content: 'Mi primer post' }),
});
```

## Cómo agregar un nuevo recurso (ej: `comments`)

1. Define la tabla en `src/db/schema.js`
2. Genera la migración: `npm run db:generate`
3. Crea `src/validations/comment.validation.js` con schemas Zod
4. Crea `src/controllers/comment.controller.js` con la lógica
5. Crea `src/routes/comment.routes.js` y móntalo en `src/routes/index.js`
6. Reinicia el servidor (las migraciones se aplican solas)

## Notas de seguridad (para discutir en clases)

- El `passwordHash` nunca se devuelve en las respuestas.
- Cambia `JWT_SECRET` en `.env` por un valor largo y aleatorio en producción.
- El login devuelve el mismo mensaje si falla el email o la contraseña.
- Los endpoints protegidos verifican **autenticación** (¿quién eres?) y
  **autorización** (¿eres el dueño del recurso?) por separado.
