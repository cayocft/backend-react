// Maneja rutas que no existen (se monta al final de app.js)
export function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// Manejador central de errores. Express 5 envía aquí automáticamente
// cualquier error lanzado (o promesa rechazada) en los controladores.
export function errorHandler(err, req, res, _next) {
  console.error(err);

  // Error de MongoDB/Mongoose al violar un índice único (email, rut)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'dato único';
    return res.status(409).json({ error: `Ya existe un registro con ese ${field}` });
  }

  // Error de Mongoose al castear un ObjectId con formato inválido
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID o formato de dato inválido' });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}
