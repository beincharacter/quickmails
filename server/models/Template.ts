import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  body: string;
  variables: string[]; // Extracted variables from placeholders
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    variables: [{ type: String }],
  },
  { timestamps: true }
);

TemplateSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);

