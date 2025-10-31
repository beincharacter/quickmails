import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  body: string;
  variables: string[]; // Extracted variables from placeholders
  datasetId?: mongoose.Types.ObjectId; // Optional: bind template to a dataset
  variableMappings?: Record<string, string>; // Map template variables to dataset field labels
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
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset' },
    variableMappings: { type: Schema.Types.Mixed }, // e.g., { "name": "name", "company": "company" }
  },
  { timestamps: true }
);

TemplateSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);

