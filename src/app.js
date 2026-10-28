import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { router } from './routes/index.js';

export const app = express();

// CORS abierto: permite que los frontends de los estudiantes
// (corriendo en otros puertos/orígenes) consuman la API.
app.use(cors());
app.use(express.json());

// Endpoint de salud para comprobar que el servidor está arriba
app.get(`${config.apiPrefix}/health`, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(config.apiPrefix, router);

// Estos dos middlewares van SIEMPRE al final
app.use(notFound);
app.use(errorHandler);
