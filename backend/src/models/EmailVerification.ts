import mongoose, { Document, Model } from 'mongoose';

export interface EmailVerificationDocument extends Document {
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  resends: number;
  lastSentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailVerificationSchema = new mongoose.Schema<EmailVerificationDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    attempts: { type: Number, default: 0 },
    resends: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
  }
);

const EmailVerification: Model<EmailVerificationDocument> =
  mongoose.models.EmailVerification || mongoose.model<EmailVerificationDocument>('EmailVerification', EmailVerificationSchema);

export default EmailVerification;
