import { Schema, model } from 'mongoose';

// Modelo de posts: cada post referencia a su autor con un ObjectId.
// "ref: 'User'" permite usar .populate('author') para traer los
// datos del autor en la misma consulta (equivalente a un JOIN).
const postSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

postSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Post = model('Post', postSchema);
