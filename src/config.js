import 'dotenv/config';

// Centraliza todas las variables de entorno en un solo lugar.
// Así el resto del código no depende de process.env directamente.
export const config = {
  port: Number(process.env.PORT) || 3000,
  apiPrefix: process.env.API_PREFIX || '/api-backend',
  jwtSecret: process.env.JWT_SECRET || 'secreto-inseguro-solo-desarrollo',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backend-cft',
};
