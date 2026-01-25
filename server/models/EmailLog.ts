import mongoose, { Schema, Document } from 'mongoose';

export type EmailStatus = 'sent' | 'scheduled' | 'failed';

export interface IEmailLog extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  to: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  error?: string;
  metadata?: {
    recordId?: string;
    datasetId?: mongoose.Types.ObjectId;
    templateId?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ['sent', 'scheduled', 'failed'],
      required: true,
      index: true,
    },
    scheduledAt: { type: Date }, // Removed index: true to avoid duplicate
    sentAt: { type: Date },
    error: { type: String },
    metadata: {
      recordId: { type: String },
      datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset' },
      templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    },
  },
  { timestamps: true }
);

EmailLogSchema.index({ userId: 1, status: 1 });
EmailLogSchema.index({ campaignId: 1 });
EmailLogSchema.index({ scheduledAt: 1 }); // Single index definition

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);

