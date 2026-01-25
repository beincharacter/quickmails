import mongoose, { Schema, Document } from 'mongoose';

export interface IDatasetField {
  label: string;
  type: 'string' | 'number' | 'email' | 'date';
}

export interface IDatasetRecord {
  [key: string]: string | number | Date;
}

export interface IDataset extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  fields: IDatasetField[];
  records: IDatasetRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const FieldSchema = new Schema<IDatasetField>({
  label: { type: String, required: true },
  type: { type: String, enum: ['string', 'number', 'email', 'date'], default: 'string' },
});

const DatasetSchema = new Schema<IDataset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    fields: [FieldSchema],
    records: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

DatasetSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Dataset = mongoose.model<IDataset>('Dataset', DatasetSchema);

