import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';
import * as schema from './schema.js';

// Asegura que exista la carpeta donde vivirá el archivo .db
const dbPath = config.dbUrl.replace(/^file:/, '');
mkdirSync(dirname(dbPath), { recursive: true });

const client = createClient({ url: config.dbUrl });

// Instancia principal para hacer consultas en los controladores:
//   import { db } from '../db/index.js';
export const db = drizzle(client, { schema });

// Aplica las migraciones pendientes de la carpeta /drizzle.
// Se ejecuta al arrancar el servidor (ver src/index.js).
export async function runMigrations() {
  await migrate(db, { migrationsFolder: './drizzle' });
}
