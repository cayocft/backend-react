import { Schema, model } from 'mongoose';

// Modelo de usuarios: el password NUNCA se guarda en texto plano,
// solo el hash generado con bcrypt.
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    rut: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  {
    // Agrega createdAt automáticamente (sin updatedAt: la API no lo expone)
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Cómo se serializa un usuario al responder en JSON:
//   _id (ObjectId) → id (string), sin __v ni passwordHash.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

export const User = model('User', userSchema);
