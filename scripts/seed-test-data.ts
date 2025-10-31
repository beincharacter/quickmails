import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Dataset } from '../server/models/Dataset.js';
import { Template } from '../server/models/Template.js';
import { User } from '../server/models/User.js';
import { connectDB } from '../server/config/database.js';

dotenv.config();

async function seedTestData() {
  try {
    console.log('🌱 Starting to seed test data...\n');

    // Connect to database
    await connectDB();

    // Get or create a test user (you'll need to have logged in at least once)
    const testUser = await User.findOne();
    
    if (!testUser) {
      console.error('❌ No user found. Please log in first to create a user.');
      console.log('   The seed script needs an existing user to associate data with.');
      process.exit(1);
    }

    console.log(`✅ Using user: ${testUser.email}\n`);

    // Clear existing test data (optional - comment out if you want to keep existing data)
    await Dataset.deleteMany({ userId: testUser._id, name: { $in: ['Test Prospects', 'Frontend Engineers', 'Sales Leads'] } });
    await Template.deleteMany({ userId: testUser._id, name: { $in: ['Cold Outreach Template', 'Job Application Template', 'Follow-up Template'] } });
    console.log('🧹 Cleared existing test data\n');

    // Create Dataset 1: Test Prospects
    console.log('📋 Creating Dataset: Test Prospects...');
    const dataset1 = await Dataset.create({
      userId: testUser._id,
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
    });
    console.log(`✅ Created dataset: "${dataset1.name}" with ${dataset1.records.length} records\n`);

    // Create Dataset 2: Frontend Engineers
    console.log('📋 Creating Dataset: Frontend Engineers...');
    const dataset2 = await Dataset.create({
      userId: testUser._id,
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
    });
    console.log(`✅ Created dataset: "${dataset2.name}" with ${dataset2.records.length} records\n`);

    // Create Dataset 3: Sales Leads
    console.log('📋 Creating Dataset: Sales Leads...');
    const dataset3 = await Dataset.create({
      userId: testUser._id,
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
    });
    console.log(`✅ Created dataset: "${dataset3.name}" with ${dataset3.records.length} records\n`);

    // Create Template 1: Cold Outreach Template
    console.log('📝 Creating Template: Cold Outreach Template...');
    const template1 = await Template.create({
      userId: testUser._id,
      name: 'Cold Outreach Template',
      subject: 'Quick question about {company}',
      body: `Hi {name},

I noticed you're the {position} at {company}. I'd love to chat about how we might be able to help your team.

Would you be open to a quick 15-minute call this week?

Best regards,
Your Name`,
      variables: ['name', 'company', 'position'],
    });
    console.log(`✅ Created template: "${template1.name}"\n`);

    // Create Template 2: Job Application Template
    console.log('📝 Creating Template: Job Application Template...');
    const template2 = await Template.create({
      userId: testUser._id,
      name: 'Job Application Template',
      subject: 'Application for {position} at {company}',
      body: `Dear {name},

I'm writing to express my interest in the {position} position at {company}. 

Based on your location in {location}, I believe I could be a great fit for your team.

I'd love to discuss how my experience aligns with your needs.

Best regards,
Your Name`,
      variables: ['name', 'company', 'position', 'location'],
    });
    console.log(`✅ Created template: "${template2.name}"\n`);

    // Create Template 3: Follow-up Template
    console.log('📝 Creating Template: Follow-up Template...');
    const template3 = await Template.create({
      userId: testUser._id,
      name: 'Follow-up Template',
      subject: 'Following up on our conversation about {company}',
      body: `Hi {name},

I wanted to follow up on our previous conversation about {company}.

I'm still very interested in learning more about your needs and how we might be able to help.

Would you have some time this week to connect?

Looking forward to hearing from you!

Best,
Your Name`,
      variables: ['name', 'company'],
    });
    console.log(`✅ Created template: "${template3.name}"\n`);

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Test data seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`   • Datasets created: 3`);
    console.log(`   • Templates created: 3`);
    console.log(`   • Total records: ${dataset1.records.length + dataset2.records.length + dataset3.records.length}`);
    console.log('\n💡 You can now:');
    console.log('   1. Go to Datasets page to see your test datasets');
    console.log('   2. Go to Templates page to see your test templates');
    console.log('   3. Create a campaign using these datasets and templates');
    console.log('\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error seeding test data:');
    console.error(error);
    process.exit(1);
  }
}

seedTestData();

