import { app } from './app.js';
import { config } from './config.js';
import { runMigrations } from './db/index.js';

// Aplica las migraciones pendientes antes de aceptar peticiones
await runMigrations();

app.listen(config.port, () => {
  console.log(`API lista en http://localhost:${config.port}${config.apiPrefix}`);
});
