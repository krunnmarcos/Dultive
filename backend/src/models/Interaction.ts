import mongoose from 'mongoose';

const InteractionSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, required: true, enum: ['pending', 'confirmed', 'completed'], default: 'pending' },
  confirmedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Interaction', InteractionSchema);
