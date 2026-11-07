# Documentación de la API — Backend CFT

Esta es la guía para consumir el backend desde tu frontend.

## Información general

| Dato | Valor |
| --- | --- |
| **URL base** | `https://backend-react-fcsl.onrender.com/api-backend` |
| **Formato** | JSON (`Content-Type: application/json`) |
| **Autenticación** | Token JWT en el header `Authorization: Bearer <token>` |

> Todas las rutas de esta documentación van **después** del prefijo
> `/api-backend`. Por ejemplo, el endpoint `/auth/login` se consume en
> `https://backend-react-fcsl.onrender.com/api-backend/auth/login`.

## Cómo levantar el servidor

```bash
npm install
npm run db:seed   # carga datos de ejemplo (opcional pero recomendado)
npm run dev
```

Cuando está listo verás en consola:

```
API lista en https://backend-react-fcsl.onrender.com/api-backend
```

### Usuarios de prueba

| Email | RUT | Password |
| --- | --- | --- |
| `docente@cft.cl` | `11.111.111-1` | `123456` |
| `estudiante@cft.cl` | `17.370.131-4` | `123456` |

---

## Resumen de endpoints

| Método | Ruta | ¿Token? | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | No | Verificar que el servidor responde |
| POST | `/auth/register` | No | Registrar un usuario nuevo |
| POST | `/auth/login` | No | Iniciar sesión y obtener token |
| GET | `/auth/me` | Sí | Datos del usuario autenticado |
| GET | `/posts` | No | Listar todos los posts |
| GET | `/posts/:id` | No | Obtener un post por ID |
| POST | `/posts` | Sí | Crear un post |
| PUT | `/posts/:id` | Sí | Editar un post (solo el autor) |
| DELETE | `/posts/:id` | Sí | Eliminar un post (solo el autor) |
| GET | `/posts/:postId/reactions` | No | Ver reacciones de un post |
| POST | `/posts/:postId/reactions` | No | Reaccionar a un post |
| DELETE | `/reactions/:id` | No | Quitar una reacción |
| GET | `/posts/:postId/comments` | No | Ver comentarios de un post |
| POST | `/posts/:postId/comments` | No | Comentar un post |
| DELETE | `/comments/:id` | No | Eliminar un comentario |
| GET | `/users` | No | Listar usuarios |
| GET | `/users/:id` | No | Usuario con sus posts |

> **Reacciones y comentarios no piden token** (por ahora). Si quien
> reacciona/comenta inició sesión, tu frontend envía `"userId": <id del usuario>`
> en el body. Si no envías `userId`, el registro queda como **anónimo**.

---

## Autenticación

El backend usa **JWT (JSON Web Token)**. El flujo es:

1. El cliente hace `POST /auth/login` (o `/auth/register`) con email y contraseña.
2. El servidor responde con un `token` y los datos del `user`.
3. El cliente **guarda el token** (por ejemplo en `localStorage`).
4. Para consumir endpoints protegidos, el cliente envía el token en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### POST `/auth/register`

Crea un usuario nuevo y devuelve el token (queda logueado de inmediato).
**No requiere token.**

**Body:**

```json
{
  "name": "Ana",
  "lastName": "Pérez",
  "rut": "20.123.456-5",
  "email": "ana@correo.cl",
  "password": "mipassword123"
}
```

> El `rut` debe ir con puntos y guion: formato `12.345.678-9`.
> Solo se valida el formato, **no** el dígito verificador.

**Respuesta `201 Created`:**

```json
{
  "user": {
    "id": 3,
    "name": "Ana",
    "lastName": "Pérez",
    "rut": "20.123.456-5",
    "email": "ana@correo.cl",
    "createdAt": "2026-10-28T03:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores posibles:**

| Código | Caso | Respuesta |
| --- | --- | --- |
| 400 | Datos inválidos (ver [formato de errores](#formato-de-errores)) | `{"error": "campo: mensaje", "details": [...]}` |
| 409 | El email ya está registrado | `{"error": "El email ya está registrado"}` |
| 409 | El RUT ya está registrado | `{"error": "El RUT ya está registrado"}` |

### POST `/auth/login`

Inicia sesión y devuelve el token. **No requiere token.**

**Body:**

```json
{
  "email": "docente@cft.cl",
  "password": "123456"
}
```

**Respuesta `200 OK`:**

```json
{
  "user": {
    "id": 1,
    "name": "Docente",
    "lastName": "Demo",
    "rut": "11.111.111-1",
    "email": "docente@cft.cl",
    "createdAt": "2026-10-28T03:15:59.615Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores posibles:**

| Código | Caso | Respuesta |
| --- | --- | --- |
| 400 | Body inválido | `{"error": "campo: mensaje", "details": [...]}` |
| 401 | Email o contraseña incorrectos | `{"error": "Credenciales inválidas"}` |

### GET `/auth/me`

Devuelve los datos del usuario dueño del token. **Requiere token.**

**Headers:** `Authorization: Bearer <token>`

**Respuesta `200 OK`:**

```json
{
  "user": {
    "id": 1,
    "name": "Docente",
    "lastName": "Demo",
    "rut": "11.111.111-1",
    "email": "docente@cft.cl",
    "createdAt": "2026-10-28T03:15:59.615Z"
  }
}
```

**Errores posibles:** 401 sin token o token expirado.

---

## Posts

### GET `/posts`

Lista todos los posts con los datos públicos de su autor. **No requiere token.**

**Respuesta `200 OK`:**

```json
{
  "posts": [
    {
      "id": 1,
      "title": "Primer post de Docente",
      "content": "Este es un post de ejemplo creado por el seed.",
      "createdAt": "2026-10-28T03:15:59.622Z",
      "author": { "id": 1, "name": "Docente" },
      "reactions": { "like": 2, "love": 1 },
      "commentsCount": 3
    }
  ]
}
```

> Cada post trae `reactions` (conteo por tipo) y `commentsCount` (total de
> comentarios), así puedes mostrar los contadores sin hacer más peticiones.

### GET `/posts/:id`

Obtiene un post por su ID. **No requiere token.**

Ejemplo: `GET http://localhost:3000/api-backend/posts/1`

**Respuesta `200 OK`:** igual que un elemento del listado, envuelto en `{ "post": {...} }`.

**Errores posibles:** 400 si el ID no es numérico, 404 si no existe.

### POST `/posts`

Crea un post. El autor se toma del token (no se envía en el body). **Requiere token.**

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "title": "Mi primer post",
  "content": "Contenido del post..."
}
```

**Respuesta `201 Created`:**

```json
{
  "post": {
    "id": 5,
    "title": "Mi primer post",
    "content": "Contenido del post...",
    "authorId": 1,
    "createdAt": "2026-10-28T03:40:00.000Z"
  }
}
```

**Errores posibles:** 400 por datos inválidos, 401 sin token.

### PUT `/posts/:id`

Edita un post existente. **Requiere token y solo el autor puede editarlo.**

Se pueden enviar uno o ambos campos (`title`, `content`).

**Body:**

```json
{
  "title": "Título actualizado"
}
```

**Respuesta `200 OK`:** `{ "post": {...} }` con el post actualizado.

**Errores posibles:**

| Código | Caso |
| --- | --- |
| 401 | Sin token |
| 403 | El post pertenece a otro usuario |
| 404 | El post no existe |

### DELETE `/posts/:id`

Elimina un post. **Requiere token y solo el autor puede eliminarlo.**

**Respuesta:** `204 No Content` (sin body).

**Errores posibles:** 401, 403, 404 (igual que PUT).

---

## Reacciones

Los usuarios pueden reaccionar a cualquier post (incluidos los propios).
**No requieren token**: si quien reacciona inició sesión, tu frontend envía
`"userId": <id>` en el body; si no, la reacción queda **anónima**.

### Tipos de reacción disponibles

| `type` | Significado | Emoji sugerido |
| --- | --- | --- |
| `like` | Me gusta | 👍 |
| `love` | Me encanta / me emociona | ❤️ |
| `haha` | Me divierte | 😂 |
| `wow` | Me sorprende | 😮 |
| `sad` | Me entristece | 😢 |
| `angry` | Me enoja | 😡 |

Cualquier otro valor es rechazado con un `400`.

### Reglas

- Un usuario registrado **no puede repetir el mismo tipo** en el mismo post
  (el servidor responde `409`), pero sí puede usar tipos distintos
  (`like` + `sad`, por ejemplo).
- El autor de un post **sí puede** reaccionar a su propia publicación.
- Las reacciones anónimas no tienen límite: sin sesión no hay forma de
  identificar a quien las envía.
- Para "quitar" una reacción guarda el `id` que devuelve el POST y luego
  llama a `DELETE /reactions/:id`.

### GET `/posts/:postId/reactions`

Devuelve el conteo por tipo y el detalle de cada reacción. **No requiere token.**

**Respuesta `200 OK`:**

```json
{
  "counts": { "like": 2, "love": 1, "wow": 1 },
  "reactions": [
    {
      "id": 1,
      "type": "like",
      "createdAt": "2026-11-07T01:03:42.355Z",
      "user": { "id": 1, "name": "Docente" }
    },
    {
      "id": 2,
      "type": "love",
      "createdAt": "2026-11-07T01:03:42.355Z",
      "user": null
    }
  ]
}
```

> `user: null` → reacción **anónima**. En tu interfaz puedes mostrar
> "Anónimo" en ese caso.
>
> Para pintar solo los contadores usa `counts`. El detalle sirve si quieres
> mostrar quién reaccionó.

**Errores posibles:** 400 si el ID no es numérico, 404 si el post no existe.

### POST `/posts/:postId/reactions`

Crea una reacción. **No requiere token.**

**Body:**

```json
{
  "type": "like",
  "userId": 1
}
```

- `type` → obligatorio, uno de la tabla de arriba.
- `userId` → **opcional**. Envíalo solo si el usuario inició sesión.
  Si no va, la reacción es anónima.

**Respuesta `201 Created`:**

```json
{
  "reaction": {
    "id": 8,
    "postId": 1,
    "type": "love",
    "userId": 1,
    "createdAt": "2026-11-07T01:07:08.217Z"
  },
  "counts": { "like": 2, "love": 2, "wow": 1 }
}
```

> La respuesta incluye `counts` ya actualizado, para refrescar los
> contadores sin hacer otra petición. Guarda `reaction.id` por si luego
> quieres quitarla con `DELETE`.

**Errores posibles:**

| Código | Caso | Respuesta |
| --- | --- | --- |
| 400 | `type` inválido | `{"error": "type: El tipo debe ser uno de: like, love, haha, wow, sad, angry", "details": [...]}` |
| 400 | `userId` no existe | `{"error": "El userId no corresponde a un usuario existente"}` |
| 404 | El post no existe | `{"error": "Post no encontrado"}` |
| 409 | Mismo usuario + mismo tipo | `{"error": "Ya reaccionaste a este post con este tipo"}` |

### DELETE `/reactions/:id`

Quita una reacción por su `id`. **No requiere token.**

**Respuesta:** `204 No Content` (sin body).

**Errores posibles:** 400 si el ID no es numérico, 404 si no existe.

> Por ahora cualquiera puede eliminar cualquier reacción. Cuando se agregue
> el uso de token, este endpoint se restringirá al dueño de la reacción.

---

## Comentarios

Respuestas de texto a un post. **Tampoco requieren token**: con `userId`
en el body el comentario muestra su autor; sin `userId` queda **anónimo**.

### GET `/posts/:postId/comments`

Lista los comentarios del post. **No requiere token.**

**Respuesta `200 OK`:**

```json
{
  "comments": [
    {
      "id": 1,
      "content": "¡Buen post!",
      "createdAt": "2026-11-07T01:03:42.361Z",
      "author": { "id": 1, "name": "Docente" }
    },
    {
      "id": 2,
      "content": "Comentario dejado por alguien anónimo.",
      "createdAt": "2026-11-07T01:03:42.361Z",
      "author": null
    }
  ]
}
```

> `author: null` → comentario **anónimo**. En tu interfaz muestra
> "Anónimo" cuando `author` sea `null`.

**Errores posibles:** 400 si el ID no es numérico, 404 si el post no existe.

### POST `/posts/:postId/comments`

Crea un comentario. **No requiere token.**

**Body:**

```json
{
  "content": "Mi comentario",
  "userId": 1
}
```

- `content` → obligatorio, entre 1 y 500 caracteres.
- `userId` → **opcional**. Si no va, el comentario es anónimo.

**Respuesta `201 Created`:**

```json
{
  "comment": {
    "id": 5,
    "content": "Mi comentario",
    "createdAt": "2026-11-07T01:09:59.773Z",
    "author": { "id": 1, "name": "Docente" }
  }
}
```

**Errores posibles:**

| Código | Caso | Respuesta |
| --- | --- | --- |
| 400 | `content` vacío o muy largo | `{"error": "content: ...", "details": [...]}` |
| 400 | `userId` no existe | `{"error": "El userId no corresponde a un usuario existente"}` |
| 404 | El post no existe | `{"error": "Post no encontrado"}` |

### DELETE `/comments/:id`

Elimina un comentario por su `id`. **No requiere token.**

**Respuesta:** `204 No Content` (sin body).

**Errores posibles:** 400 si el ID no es numérico, 404 si no existe.

> Al igual que las reacciones, por ahora cualquiera puede eliminar
> comentarios. Se restringirá al agregar autenticación con token.

---

## Usuarios

### GET `/users`

Lista todos los usuarios. **No requiere token.**

**Respuesta `200 OK`:**

```json
{
  "users": [
    {
      "id": 1,
      "name": "Docente",
      "lastName": "Demo",
      "rut": "11.111.111-1",
      "email": "docente@cft.cl",
      "createdAt": "2026-10-28T03:15:59.615Z"
    }
  ]
}
```

### GET `/users/:id`

Obtiene un usuario con sus posts. **No requiere token.**

**Respuesta `200 OK`:**

```json
{
  "user": {
    "id": 1,
    "name": "Docente",
    "lastName": "Demo",
    "rut": "11.111.111-1",
    "email": "docente@cft.cl",
    "createdAt": "2026-10-28T03:15:59.615Z",
    "posts": [
      { "id": 1, "title": "Primer post...", "content": "...", "createdAt": "..." }
    ]
  }
}
```

---

## Formato de errores

Todos los errores devuelven un JSON con la clave `error`:

```json
{ "error": "Credenciales inválidas" }
```

Cuando el body no pasa la validación, el `error` ya incluye el nombre del
campo y su mensaje, y `details` trae el desglose estructurado por campo:

```json
{
  "error": "email: Debe ser un email válido | password: La contraseña debe tener al menos 6 caracteres",
  "details": [
    { "field": "email", "message": "Debe ser un email válido" },
    { "field": "password", "message": "La contraseña debe tener al menos 6 caracteres" }
  ]
}
```

- `error` → úsalo para `console.log`, alerts o mensajes al usuario.
- `details` → úsalo para marcar inputs específicos en un formulario
  (`details.find(d => d.field === 'email')`).

### Códigos de estado usados por la API

| Código | Significado |
| --- | --- |
| 200 | Todo bien (GET, PUT) |
| 201 | Recurso creado (POST) |
| 204 | Eliminado correctamente, sin contenido (DELETE) |
| 400 | Datos inválidos en la petición |
| 401 | Falta el token, o está vencido/alterado |
| 403 | Tienes token, pero no eres dueño del recurso |
| 404 | La ruta o el recurso no existe |
| 409 | Conflicto: email/RUT ya registrado, o reacción repetida |
| 500 | Error interno del servidor |

---

## Ejemplos completos con `fetch`

### Flujo completo: login → guardar token → crear post

```js
const API = 'https://backend-react-fcsl.onrender.com/api-backend';

// 1. Login
const loginRes = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'docente@cft.cl', password: '123456' }),
});
const { token } = await loginRes.json();
localStorage.setItem('token', token);

// 2. Crear un post (endpoint protegido)
const postRes = await fetch(`${API}/posts`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
  body: JSON.stringify({ title: 'Hola', content: 'Mi primer post' }),
});
const { post } = await postRes.json();
```

### Listar posts (endpoint público)

```js
const res = await fetch(`${API}/posts`);
const { posts } = await res.json();
console.log(posts);
```

### Reaccionar a un post (con y sin sesión)

```js
// Usuario logueado: guarda su id al hacer login (login.user.id)
const userId = JSON.parse(localStorage.getItem('user'))?.id;

const res = await fetch(`${API}/posts/1/reactions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'like', userId }), // userId: undefined → anónimo
});
const { reaction, counts } = await res.json();

// Para quitar la reacción más tarde:
await fetch(`${API}/reactions/${reaction.id}`, { method: 'DELETE' });
```

### Comentar un post

```js
const res = await fetch(`${API}/posts/1/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: 'Mi comentario', userId }),
});
const { comment } = await res.json();

// Mostrar autor o "Anónimo":
console.log(comment.author?.name ?? 'Anónimo');
```

### Ejemplo con `curl`

```bash
# Login
curl -X POST https://backend-react-fcsl.onrender.com/api-backend/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"docente@cft.cl","password":"123456"}'

# Crear post con token
curl -X POST https://backend-react-fcsl.onrender.com/api-backend/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"title":"Hola","content":"Mi primer post"}'
```

> En PowerShell usa comillas simples por fuera y escapa las comillas dobles
> internas con `\`, o guarda el JSON en un archivo y usa `-d '@body.json'`.
