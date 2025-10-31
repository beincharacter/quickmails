import { apiClient } from '../config/api';
import { getAccessToken } from './auth';

export interface TestDataset {
  name: string;
  fields: Array<{ label: string; type: 'string' | 'number' | 'email' | 'date' }>;
  records: Array<Record<string, any>>;
}

export interface TestTemplate {
  name: string;
  subject: string;
  body: string;
}

export const testDatasets: TestDataset[] = [
  {
    name: 'Test Prospects',
    fields: [
      { label: 'name', type: 'string' },
      { label: 'email', type: 'email' },
      { label: 'company', type: 'string' },
      { label: 'position', type: 'string' },
      { label: 'location', type: 'string' },
    ],
    records: [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        company: 'TechCorp',
        position: 'Senior Developer',
        location: 'San Francisco, CA',
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.j@startup.io',
        company: 'StartupIO',
        position: 'Product Manager',
        location: 'New York, NY',
      },
      {
        name: 'Mike Chen',
        email: 'mike.chen@bigtech.com',
        company: 'BigTech Inc',
        position: 'Engineering Manager',
        location: 'Seattle, WA',
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@innovate.com',
        company: 'Innovate Labs',
        position: 'Frontend Lead',
        location: 'Austin, TX',
      },
      {
        name: 'David Wilson',
        email: 'david.w@scalable.dev',
        company: 'ScalableDev',
        position: 'CTO',
        location: 'Boston, MA',
      },
    ],
  },
  {
    name: 'Frontend Engineers',
    fields: [
      { label: 'name', type: 'string' },
      { label: 'email', type: 'email' },
      { label: 'company', type: 'string' },
      { label: 'position', type: 'string' },
      { label: 'years_experience', type: 'number' },
      { label: 'skills', type: 'string' },
    ],
    records: [
      {
        name: 'Alex Thompson',
        email: 'alex.thompson@webdev.com',
        company: 'WebDev Solutions',
        position: 'React Developer',
        years_experience: 5,
        skills: 'React, TypeScript, Next.js',
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa.a@frontend.pro',
        company: 'Frontend Pro',
        position: 'Senior Frontend Engineer',
        years_experience: 7,
        skills: 'Vue.js, JavaScript, CSS',
      },
      {
        name: 'Robert Brown',
        email: 'rob.brown@uiux.dev',
        company: 'UI/UX Dev',
        position: 'Frontend Architect',
        years_experience: 10,
        skills: 'React, Angular, Design Systems',
      },
    ],
  },
  {
    name: 'Sales Leads',
    fields: [
      { label: 'name', type: 'string' },
      { label: 'email', type: 'email' },
      { label: 'company', type: 'string' },
      { label: 'position', type: 'string' },
      { label: 'industry', type: 'string' },
      { label: 'company_size', type: 'string' },
    ],
    records: [
      {
        name: 'Jennifer Martinez',
        email: 'jennifer.m@enterprise.co',
        company: 'Enterprise Co',
        position: 'VP of Sales',
        industry: 'Technology',
        company_size: '500-1000',
      },
      {
        name: 'Michael Taylor',
        email: 'michael.t@salespro.com',
        company: 'SalesPro Inc',
        position: 'Sales Director',
        industry: 'SaaS',
        company_size: '100-500',
      },
    ],
  },
];

export const testTemplates: TestTemplate[] = [
  {
    name: 'Cold Outreach Template',
    subject: 'Quick question about {company}',
    body: `Hi {name},

I noticed you're the {position} at {company}. I'd love to chat about how we might be able to help your team.

Would you be open to a quick 15-minute call this week?

Best regards,
Your Name`,
  },
  {
    name: 'Job Application Template',
    subject: 'Application for {position} at {company}',
    body: `Dear {name},

I'm writing to express my interest in the {position} position at {company}. 

Based on your location in {location}, I believe I could be a great fit for your team.

I'd love to discuss how my experience aligns with your needs.

Best regards,
Your Name`,
  },
  {
    name: 'Follow-up Template',
    subject: 'Following up on our conversation about {company}',
    body: `Hi {name},

I wanted to follow up on our previous conversation about {company}.

I'm still very interested in learning more about your needs and how we might be able to help.

Would you have some time this week to connect?

Looking forward to hearing from you!

Best,
Your Name`,
  },
];

export async function addTestData(): Promise<{ datasets: number; templates: number }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  let datasetsCreated = 0;
  let templatesCreated = 0;

  try {
    // Create datasets
    console.log('📋 Creating test datasets...');
    for (const dataset of testDatasets) {
      try {
        await apiClient.post('/datasets', dataset, token);
        datasetsCreated++;
        console.log(`✅ Created dataset: ${dataset.name}`);
      } catch (error: any) {
        // If dataset already exists, skip it
        if (error.message?.includes('already exists')) {
          console.log(`⏭️  Dataset "${dataset.name}" already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Create templates
    console.log('📝 Creating test templates...');
    for (const template of testTemplates) {
      try {
        await apiClient.post('/templates', template, token);
        templatesCreated++;
        console.log(`✅ Created template: ${template.name}`);
      } catch (error: any) {
        // If template already exists, skip it
        if (error.message?.includes('already exists')) {
          console.log(`⏭️  Template "${template.name}" already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    return { datasets: datasetsCreated, templates: templatesCreated };
  } catch (error: any) {
    console.error('Error adding test data:', error);
    throw error;
  }
}

