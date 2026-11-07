import mongoose from 'mongoose';
import { config } from '../config.js';

// Abre la conexión a MongoDB Atlas. Se ejecuta una sola vez
// al arrancar el servidor (ver src/index.js); después todos
// los modelos Mongoose comparten esta misma conexión.
export async function connectDB() {
  await mongoose.connect(config.mongoUri);
  console.log(`MongoDB conectado: ${mongoose.connection.name}`);
}
