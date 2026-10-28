import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, runMigrations } from './index.js';
import { posts, users } from './schema.js';

// Datos de ejemplo para que los estudiantes tengan contenido
// disponible apenas levanten el proyecto.
// Ejecutar con: npm run db:seed
await runMigrations();

const demoUsers = [
  { name: 'Docente', lastName: 'Demo', rut: '11.111.111-1', email: 'docente@cft.cl', password: '123456' },
  { name: 'Estudiante', lastName: 'Demo', rut: '17.370.131-4', email: 'estudiante@cft.cl', password: '123456' },
];

for (const data of demoUsers) {
  const [existing] = await db.select().from(users).where(eq(users.email, data.email));
  if (existing) {
    console.log(`Ya existe: ${data.email} (omitido)`);
    continue;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      lastName: data.lastName,
      rut: data.rut,
      email: data.email,
      passwordHash,
    })
    .returning();

  await db.insert(posts).values([
    { title: `Primer post de ${user.name}`, content: 'Este es un post de ejemplo creado por el seed.', authorId: user.id },
    { title: 'Aprendiendo APIs REST', content: 'Consumiendo el backend desde mi frontend.', authorId: user.id },
  ]);

  console.log(`Creado: ${data.email} / password: ${data.password}`);
}

console.log('Seed completado.');
process.exit(0);
