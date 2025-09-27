import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postType: { type: String, required: true, enum: ['donation', 'help_request'] },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['alimentos', 'roupas', 'medicamentos', 'brinquedos'] },
  tags: [String],
  images: [String],
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  likesCount: { type: Number, default: 0 }, // Add likesCount
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Post', PostSchema);
