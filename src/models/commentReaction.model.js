import { Schema, model } from 'mongoose';
import { REACTION_TYPES } from '../validations/reaction.validation.js';

// Modelo de commentReactions: una reacción a un comentario.
// Espejo de reaction.model.js pero apuntando a Comment.
// user puede ser null → reacción anónima (sin iniciar sesión).
const commentReactionSchema = new Schema(
  {
    comment: { type: Schema.Types.ObjectId, ref: 'Comment', required: true },
    type: { type: String, enum: REACTION_TYPES, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

commentReactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const CommentReaction = model('CommentReaction', commentReactionSchema);
