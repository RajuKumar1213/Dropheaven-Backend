// scripts/seedServices.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Service } from '../models/Service.models.js';
import { ServiceCategory } from '../models/ServiceCategory.models.js';

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
});

// Categories and services data
const servicesData = [
  {
    categoryName: 'REGISTRATION SERVICES',
    categoryDescription: 'Services related to various registrations',
    services: [
      {
        name: 'SECTION 8 REGISTRATION',
        description: 'Registration for Section 8 company',
      },
      {
        name: 'SOCIETY REGISTRATION',
        description: 'Registration for society',
      },
      {
        name: 'TRUST REGISTRATION',
        description: 'Registration for trust',
      },
    ],
  },
  {
    categoryName: 'COMPANY REGISTRATION',
    categoryDescription: 'Services related to company registration',
    services: [
      {
        name: 'PRIVATE LIMITED',
        description: 'Registration for private limited company',
      },
      {
        name: 'OPC PVT.LTD',
        description: 'Registration for One Person Company',
      },
      {
        name: 'LLP REGISTRATION',
        description: 'Registration for Limited Liability Partnership',
      },
      {
        name: 'PRODUCER COMPANY REGISTRATION',
        description: 'Registration for Producer Company',
      },
    ],
  },
  {
    categoryName: 'TAX AND COMPLIANCE REGISTRATION',
    categoryDescription: 'Services related to tax and compliance registrations',
    services: [
      {
        name: '12A 80G REGISTRATION',
        description: 'Registration under section 12A and 80G of Income Tax Act',
      },
      {
        name: '12AA REGISTRATION',
        description: 'Registration under section 12AA of Income Tax Act',
      },
      {
        name: '35AC REGISTRATION',
        description: 'Registration under section 35AC of Income Tax Act',
      },
      {
        name: 'CSR REGISTRATION',
        description: 'Registration for Corporate Social Responsibility',
      },
      {
        name: 'ITR COMPUTATION, BALANCE SHEET, AUDIT REPORT',
        description: 'Preparation of ITR, Balance Sheet and Audit Report',
      },
      {
        name: 'GST REGISTRATION',
        description: 'Registration for Goods and Services Tax',
      },
    ],
  },
  {
    categoryName: 'OTHER SERVICES',
    categoryDescription: 'Other registration services',
    services: [
      {
        name: 'NGO DARPAN (NITI AYOG)',
        description: 'Registration on NGO Darpan portal',
      },
      {
        name: 'E-ANUDAN REGISTRATION',
        description: 'Registration for E-Anudan',
      },
      {
        name: 'STARTUP INDIA REGISTRATION',
        description: 'Registration under Startup India scheme',
      },
      {
        name: 'FCRA REGISTRATION',
        description: 'Registration under Foreign Contribution Regulation Act',
      },
      {
        name: 'RNI REGISTRATION',
        description: 'Registration with Registrar of Newspapers for India',
      },
      {
        name: 'POLITICAL PARTY REGISTRATION',
        description: 'Registration of political party with Election Commission',
      },
    ],
  },
  {
    categoryName: 'BUSINESS AND INDUSTRY REGISTRATION',
    categoryDescription: 'Registration services for businesses and industries',
    services: [
      {
        name: 'FOOD/FSSAI REGISTRATION',
        description:
          'Registration with Food Safety and Standards Authority of India',
      },
      {
        name: 'BIS, ISI REGISTRATION',
        description: 'Registration with Bureau of Indian Standards',
      },
      {
        name: 'AGMARK REGISTRATION',
        description: 'Registration for Agmark certification',
      },
      {
        name: 'TRADEMARK REGISTRATION',
        description: 'Registration of trademark',
      },
      {
        name: 'KHANIJ REGISTRATION',
        description: 'Registration for mining operations',
      },
      {
        name: 'TRAVEL AGENCY REGISTRATION',
        description: 'Registration for travel agency',
      },
      {
        name: 'TRADE EXPORT/IMPORT REGISTRATION',
        description: 'Registration for import/export code',
      },
    ],
  },
  {
    categoryName: 'DEVELOPMENT SERVICES',
    categoryDescription:
      'Services related to development and technical solutions',
    services: [
      {
        name: 'PROJECT CREATION',
        description: 'Creation of detailed project reports and proposals',
      },
      {
        name: 'APP DEVELOPMENT',
        description: 'Development of mobile applications',
      },
      {
        name: 'SOFTWARE DEVELOPMENT',
        description: 'Development of custom software solutions',
      },
      {
        name: 'ISO REGISTRATION',
        description: 'Registration for ISO certification',
      },
      {
        name: 'LABOUR ACT REGISTRATION',
        description: 'Registration under various labor laws',
      },
      {
        name: 'TRADE UNION REGISTRATION',
        description: 'Registration of trade union',
      },
      {
        name: 'DGFT REGISTRATION',
        description: 'Registration with Directorate General of Foreign Trade',
      },
      {
        name: 'WEBSITE REGISTRATION',
        description: 'Domain registration and website development',
      },
    ],
  },
];

// Function to seed data
const seedData = async () => {
  try {
    // Clear existing data
    await ServiceCategory.deleteMany();
    await Service.deleteMany();

    console.log('Previous data cleared');

    // Insert each category and its services
    for (const item of servicesData) {
      // Create category
      const category = await ServiceCategory.create({
        name: item.categoryName,
        description: item.categoryDescription,
      });

      console.log(`Created category: ${category.name}`);

      // Create services for this category
      for (const serviceData of item.services) {
        const service = await Service.create({
          ...serviceData,
          category: category._id,
        });

        console.log(`Created service: ${service.name}`);
      }
    }

    console.log('Data seeding completed successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seeder
seedData();
