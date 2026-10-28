// Maneja rutas que no existen (se monta al final de app.js)
export function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// Manejador central de errores. Express 5 envía aquí automáticamente
// cualquier error lanzado (o promesa rechazada) en los controladores.
export function errorHandler(err, req, res, _next) {
  console.error(err);

  // Error típico de SQLite al violar una restricción UNIQUE
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint/.test(err.message ?? '')) {
    return res.status(409).json({ error: 'Ya existe un registro con ese dato único' });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}
