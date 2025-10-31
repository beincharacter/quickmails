import { Queue, Worker, Job } from 'bullmq';
import { connectRedis, getRedisClient, checkRedisConnection } from '../utils/redis.js';
import { GmailService } from './gmail.js';
import { EmailLog } from '../models/EmailLog.js';
import { Campaign } from '../models/Campaign.js';
import { Dataset } from '../models/Dataset.js';
import { Template } from '../models/Template.js';

let emailQueue: Queue | null = null;
let emailWorker: Worker | null = null;

// Initialize Redis connection and queues
export async function initializeScheduler(): Promise<void> {
  try {
    const connection = await connectRedis();
    
    // Create queue and worker
    emailQueue = new Queue('email-sending', { connection });
    emailWorker = new Worker<EmailJobData>(
      'email-sending',
      processEmailJob,
      { connection }
    );

    // Handle worker events
    emailWorker.on('completed', (job) => {
      console.log(`✅ Email job ${job.id} completed`);
    });

    emailWorker.on('failed', (job, err) => {
      console.error(`❌ Email job ${job?.id} failed:`, err.message);
    });

    emailWorker.on('error', (error) => {
      console.error('❌ Email worker error:', error);
    });

    console.log('✅ Email scheduler initialized');
  } catch (error: any) {
    console.error('❌ Failed to initialize scheduler:', error.message);
    throw error;
  }
}

// Get email queue (lazy initialization)
export async function getEmailQueue(): Promise<Queue> {
  if (!emailQueue) {
    await initializeScheduler();
  }
  if (!emailQueue) {
    throw new Error('Email queue not initialized. Redis may not be available.');
  }
  return emailQueue;
}

// Get email worker
export function getEmailWorker(): Worker | null {
  return emailWorker;
}

// Process email job
async function processEmailJob(job: Job<EmailJobData>): Promise<{ success: boolean }> {
  const { userId, to, subject, body, campaignId, metadata } = job.data;

  try {
    // Send email via Gmail API
    await GmailService.sendEmail(userId, to, subject, body);

    // Update email log
    const emailLog = await EmailLog.findOne({
      to,
      campaignId,
      status: 'scheduled',
    });

    if (emailLog) {
      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      await emailLog.save();
    }

    // Update campaign stats
    if (campaignId) {
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { sentEmails: 1 },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Email sending failed:', error);

    // Update email log with error
    const emailLog = await EmailLog.findOne({
      to,
      campaignId,
      status: 'scheduled',
    });

    if (emailLog) {
      emailLog.status = 'failed';
      emailLog.error = error.message;
      await emailLog.save();
    }

    // Update campaign stats
    if (campaignId) {
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { failedEmails: 1 },
      });
    }

    throw error;
  }
}

export interface EmailJobData {
  userId: string;
  campaignId?: string;
  to: string;
  subject: string;
  body: string;
  scheduledAt?: Date;
  delay?: number;
  metadata?: {
    recordId?: string;
    datasetId?: string;
    templateId?: string;
  };
}


// Process template with variables
export function processTemplate(
  template: { subject: string; body: string },
  record: Record<string, any>
): { subject: string; body: string } {
  let processedSubject = template.subject;
  let processedBody = template.body;

  // Replace all placeholders {variable} with record values
  Object.keys(record).forEach((key) => {
    const placeholder = new RegExp(`\\{${key}\\}`, 'g');
    const value = record[key]?.toString() || '';
    processedSubject = processedSubject.replace(placeholder, value);
    processedBody = processedBody.replace(placeholder, value);
  });

  return { subject: processedSubject, body: processedBody };
}

// Schedule emails from campaign
export async function scheduleCampaignEmails(campaignId: string): Promise<void> {
  const campaign = await Campaign.findById(campaignId)
    .populate('datasetId')
    .populate('templateId');

  if (!campaign || !campaign.datasetId || !campaign.templateId) {
    throw new Error('Campaign not found or missing dataset/template');
  }

  const dataset = await Dataset.findById(campaign.datasetId);
  const template = await Template.findById(campaign.templateId);

  if (!dataset || !template) {
    throw new Error('Dataset or template not found');
  }

  // Get selected records
  const records = campaign.selectedRecordIds.length > 0
    ? dataset.records.filter((_, index) =>
        campaign.selectedRecordIds.includes(index.toString())
      )
    : dataset.records;

  // Find email field (preferably labeled 'email')
  const emailFieldLabel = dataset.fields.find((f) =>
    f.label.toLowerCase().includes('email')
  )?.label || dataset.fields[0]?.label;

  if (!emailFieldLabel) {
    throw new Error('No email field found in dataset');
  }

  const delayBetweenEmails = campaign.delayBetweenEmails || 0;

  // Schedule each email
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const email = record[emailFieldLabel]?.toString();

    if (!email) {
      continue;
    }

    // Process template with record data
    const { subject, body } = processTemplate(template, record);

    // Create email log
    const emailLog = await EmailLog.create({
      userId: campaign.userId,
      campaignId: campaign._id,
      to: email,
      subject,
      body,
      status: campaign.sendType === 'instant' ? 'scheduled' : 'scheduled',
      scheduledAt: campaign.scheduledAt || new Date(),
      metadata: {
        recordId: i.toString(),
        datasetId: campaign.datasetId,
        templateId: campaign.templateId,
      },
    });

    // Calculate delay
    const delay = delayBetweenEmails * i;

    // Add job to queue
    const jobData: EmailJobData = {
      userId: campaign.userId.toString(),
      campaignId: campaign._id.toString(),
      to: email,
      subject,
      body,
      delay,
      metadata: {
        recordId: i.toString(),
        datasetId: campaign.datasetId.toString(),
        templateId: campaign.templateId.toString(),
      },
    };

    const queue = await getEmailQueue();
    
    if (campaign.sendType === 'scheduled' && campaign.scheduledAt) {
      // Schedule for specific time
      const scheduleDelay = Math.max(0, campaign.scheduledAt.getTime() - Date.now() + delay);
      await queue.add('send-email', jobData, {
        delay: scheduleDelay,
      });
    } else {
      // Send with delay
      await queue.add('send-email', jobData, {
        delay,
      });
    }
  }

  // Update campaign
  campaign.status = campaign.sendType === 'instant' ? 'sending' : 'scheduled';
  campaign.totalEmails = records.length;
  await campaign.save();
}

// Close scheduler gracefully
export async function closeScheduler(): Promise<void> {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
  }
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
  }
}

