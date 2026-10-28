// Middleware genérico de validación con Zod.
// Recibe un schema y valida req.body contra él.
// Si falla, responde 400 indicando QUÉ campo falló y por qué:
//   - "error":   mensaje legible, listo para mostrar en consola/alertas
//   - "details": arreglo estructurado, útil para marcar inputs en el frontend
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return res.status(400).json({
      error: details.map((d) => `${d.field}: ${d.message}`).join(' | '),
      details,
    });
  }

  // Reemplaza el body por los datos ya validados (y saneados)
  req.body = result.data;
  next();
};
