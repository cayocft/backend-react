import bcrypt from 'bcryptjs';
import { Comment } from '../models/comment.model.js';
import { CommentReaction } from '../models/commentReaction.model.js';
import { Post } from '../models/post.model.js';
import { Reaction } from '../models/reaction.model.js';
import { User } from '../models/user.model.js';
import { connectDB } from './index.js';

// Datos de ejemplo para que los estudiantes tengan contenido
// disponible apenas levanten el proyecto.
// Ejecutar con: npm run db:seed
await connectDB();

const demoUsers = [
  { name: 'Docente', lastName: 'Demo', rut: '11.111.111-1', email: 'docente@cft.cl', password: '123456' },
  { name: 'Estudiante', lastName: 'Demo', rut: '17.370.131-4', email: 'estudiante@cft.cl', password: '123456' },
];

for (const data of demoUsers) {
  if (await User.exists({ email: data.email })) {
    console.log(`Ya existe: ${data.email} (omitido)`);
    continue;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    name: data.name,
    lastName: data.lastName,
    rut: data.rut,
    email: data.email,
    passwordHash,
  });

  const createdPosts = await Post.insertMany([
    { title: `Primer post de ${user.name}`, content: 'Este es un post de ejemplo creado por el seed.', author: user.id },
    { title: 'Aprendiendo APIs REST', content: 'Consumiendo el backend desde mi frontend.', author: user.id },
  ]);

  // Reacciones y comentarios de ejemplo sobre el primer post:
  // algunos con userId (usuario) y otros sin userId (anónimos).
  const firstPost = createdPosts[0];
  await Reaction.insertMany([
    { post: firstPost.id, type: 'like', user: user.id },
    { post: firstPost.id, type: 'love' },
    { post: firstPost.id, type: 'wow' },
  ]);

  const createdComments = await Comment.insertMany([
    { post: firstPost.id, content: '¡Buen post!', author: user.id },
    { post: firstPost.id, content: 'Comentario dejado por alguien anónimo.' },
  ]);

  // Reacciones de ejemplo al primer comentario:
  // una con usuario y otra anónima.
  await CommentReaction.insertMany([
    { comment: createdComments[0].id, type: 'like', user: user.id },
    { comment: createdComments[0].id, type: 'love' },
  ]);

  console.log(`Creado: ${data.email} / password: ${data.password}`);
}

console.log('Seed completado.');
process.exit(0);
