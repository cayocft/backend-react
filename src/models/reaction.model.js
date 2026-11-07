import { Schema, model } from 'mongoose';
import { REACTION_TYPES } from '../validations/reaction.validation.js';

// Modelo de reactions: una reacción a un post.
// user puede ser null → reacción anónima (sin iniciar sesión).
const reactionSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    type: { type: String, enum: REACTION_TYPES, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

reactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Reaction = model('Reaction', reactionSchema);
