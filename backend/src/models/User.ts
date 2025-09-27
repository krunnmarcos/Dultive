import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  userType: { type: String, required: true, enum: ['person', 'company'] },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  cpf: { type: String, unique: true, sparse: true },
  cnpj: { type: String, unique: true, sparse: true },
  profileImage: { type: String },
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  points: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
