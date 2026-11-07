import { app } from './app.js';
import { config } from './config.js';
import { connectDB } from './db/index.js';

// Conecta a MongoDB antes de aceptar peticiones
try {
  await connectDB();
} catch (err) {
  console.error(`No se pudo conectar a MongoDB: ${err.message}`);
  console.error('Revisa MONGODB_URI en .env: usuario, contraseña (URL-encoded)');
  console.error('y que tu IP esté permitida en Atlas → Network Access.');
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`API lista en http://localhost:${config.port}${config.apiPrefix}`);
});
