import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    picture: { type: String },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true, default: '' }, // Allow empty for client-side OAuth
    tokenExpiry: { type: Date, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

