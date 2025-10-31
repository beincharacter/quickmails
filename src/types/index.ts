export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
}

export interface DatasetField {
  label: string;
  type: 'string' | 'number' | 'email' | 'date';
}

export interface DatasetRecord {
  [key: string]: string | number | Date;
}

export interface Dataset {
  _id: string;
  userId: string;
  name: string;
  fields: DatasetField[];
  records: DatasetRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  _id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  _id: string;
  userId: string;
  name: string;
  datasetId: string | Dataset;
  templateId: string | Template;
  selectedRecordIds: string[];
  sendType: 'instant' | 'scheduled';
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed';
  delayBetweenEmails?: number;
  dailySendLimit?: number;
  totalEmails: number;
  sentEmails: number;
  failedEmails: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  _id: string;
  userId: string;
  campaignId?: string | Campaign;
  to: string;
  subject: string;
  body: string;
  status: 'sent' | 'scheduled' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  emails: {
    total: number;
    sent: number;
    scheduled: number;
    failed: number;
    recent: number;
  };
  campaigns: {
    total: number;
    active: number;
    completed: number;
  };
  datasets: number;
  templates: number;
}

