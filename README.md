# Backend CFT — API de ejemplo para clases

[![📖 DOCUMENTACIÓN COMPLETA DE LA API](https://img.shields.io/badge/📖_DOCUMENTACIÓN_COMPLETA_DE_LA_API-documentacion.md-0a7ea4?style=for-the-badge)](documentacion.md)

> 👆 **Toda la referencia de endpoints, ejemplos de uso y errores está en [`documentacion.md`](documentacion.md).**

API REST construida con **Express 5 + Mongoose + MongoDB Atlas + JWT**, pensada para que los estudiantes la consuman desde sus propios frontends.

Incluye:

- Registro e inicio de sesión con **tokens JWT**
- Validación de datos con **Zod**
- CRUD de ejemplo (`posts`, `comments`, `reactions`) con endpoints públicos y protegidos
- Base de datos **MongoDB Atlas** (nube) via Mongoose
- CORS habilitado para cualquier origen

## Requisitos

- Node.js 18 o superior

## Puesta en marcha

```bash
npm install          # instala dependencias
cp .env.example .env # crea tu archivo de entorno y completa MONGODB_URI
npm run db:seed      # carga usuarios y posts de ejemplo
npm run dev          # levanta el servidor con recarga automática
```

La API queda disponible en `https://backend-react-fcsl.onrender.com/api-backend`.

> **Importante:** la app necesita `MONGODB_URI` en `.env` para conectar.
> En Atlas recuerda permitir tu IP en **Network Access** (o `0.0.0.0/0`
> para permitir desde cualquier origen, útil en clases y despliegues como Render).

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
| `npm run db:seed`    | Inserta datos de ejemplo                           |

## Estructura del proyecto

```
src/
├── index.js              # Punto de entrada: conecta a Mongo y levanta el servidor
├── app.js                # Configuración de Express (CORS, JSON, rutas, errores)
├── config.js             # Variables de entorno centralizadas
├── db/
│   ├── index.js          # Conexión a MongoDB (Mongoose)
│   └── seed.js           # Datos de ejemplo
├── models/               # Modelos Mongoose (User, Post, Comment, Reaction)
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

### Comentarios y reacciones

| Método | Ruta             | Auth | Descripción                      |
| ------ | ---------------- | ---- | -------------------------------- |
| GET    | `/api-backend/posts/:postId/comments` | No | Comentarios de un post (con conteo de reacciones) |
| POST   | `/api-backend/posts/:postId/comments` | No | Comentar (anónimo si no va `userId`) |
| DELETE | `/api-backend/comments/:id`           | No | Eliminar comentario (borra sus reacciones) |
| GET    | `/api-backend/posts/:postId/reactions` | No | Reacciones de un post |
| POST   | `/api-backend/posts/:postId/reactions` | No | Reaccionar a un post |
| DELETE | `/api-backend/reactions/:id`           | No | Quitar reacción de post |
| GET    | `/api-backend/comments/:commentId/reactions` | No | Reacciones de un comentario |
| POST   | `/api-backend/comments/:commentId/reactions` | No | Reaccionar a un comentario |
| DELETE | `/api-backend/comment-reactions/:id`         | No | Quitar reacción de comentario |

## Cómo consumir la API desde un frontend

```js
// 1. Login: guardar el token
const res = await fetch('https://backend-react-fcsl.onrender.com/api-backend/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'docente@cft.cl', password: '123456' }),
});
const { token, user } = await res.json();
localStorage.setItem('token', token);

// 2. Usar el token en endpoints protegidos
const posts = await fetch('https://backend-react-fcsl.onrender.com/api-backend/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
  body: JSON.stringify({ title: 'Hola', content: 'Mi primer post' }),
});
```

## Cómo agregar un nuevo recurso (ej: `tasks`)

1. Crea el modelo en `src/models/task.model.js` (schema de Mongoose)
2. Crea `src/validations/task.validation.js` con schemas Zod
3. Crea `src/controllers/task.controller.js` con la lógica
4. Crea `src/routes/task.routes.js` y móntalo en `src/routes/index.js`
5. No hay migraciones: MongoDB crea la colección sola en el primer `insert`

## Notas sobre MongoDB

- Los `id` son **ObjectId** (strings de 24 caracteres hex, ej.
  `507f1f77bcf86cd799439011`), no números. Las respuestas los exponen
  como `id` gracias al `toJSON` de los modelos.
- Las referencias entre documentos usan `ref` + `.populate()`
  (equivalente al JOIN de SQL).
- No existe ON DELETE CASCADE: al borrar un post se eliminan manualmente
  sus comentarios y reacciones (ver `post.controller.js`).

## Notas de seguridad (para discutir en clases)

- El `passwordHash` nunca se devuelve en las respuestas.
- Cambia `JWT_SECRET` en `.env` por un valor largo y aleatorio en producción.
- El login devuelve el mismo mensaje si falla el email o la contraseña.
- Los endpoints protegidos verifican **autenticación** (¿quién eres?) y
  **autorización** (¿eres el dueño del recurso?) por separado.
