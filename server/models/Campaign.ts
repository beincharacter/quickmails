import mongoose, { Schema, Document } from 'mongoose';

export type SendType = 'instant' | 'scheduled';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed';

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  datasetId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  selectedRecordIds: string[]; // IDs of selected records from dataset
  sendType: SendType;
  scheduledAt?: Date;
  status: CampaignStatus;
  delayBetweenEmails?: number; // milliseconds
  dailySendLimit?: number;
  totalEmails: number;
  sentEmails: number;
  failedEmails: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    selectedRecordIds: [{ type: String }],
    sendType: { type: String, enum: ['instant', 'scheduled'], required: true },
    scheduledAt: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'completed', 'paused', 'failed'],
      default: 'draft',
    },
    delayBetweenEmails: { type: Number }, // milliseconds
    dailySendLimit: { type: Number },
    totalEmails: { type: Number, default: 0 },
    sentEmails: { type: Number, default: 0 },
    failedEmails: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CampaignSchema.index({ userId: 1, status: 1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);

