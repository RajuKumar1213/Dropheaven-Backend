// scripts/seedServices.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Service } from '../models/companyServices.models.js';

dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);

const seedServices = async () => {
  try {
    const services = [
      {
        title: 'NGO REGISTRATION',
        category: 'REGISTRATION',
        subItems: ['SECTION 8', 'SOCIETY', 'TRUST'],
      },
      {
        title: 'COMPANY REGISTRATION',
        category: 'COMPANY_REGISTRATION',
        subItems: ['PRIVATE LIMITED', 'OPC PVT.LTD', 'LLP', 'PRODUCER COMPANY'],
      },
      {
        title: 'TAX & COMPLIANCE',
        category: 'TAX_COMPLIANCE',
        subItems: ['12A 80G', '12AA', '35AC', 'CSR REGISTRATION'],
      },
      {
        title: 'OTHER SERVICES',
        category: 'OTHER_SERVICES',
        subItems: ['NGO DARPAN', 'E-ANUDAN', 'STARTUP INDIA', 'FCRA', 'RNI'],
      },
    ];

    await Service.insertMany(services);
    console.log('🔥 Services seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed', err);
    process.exit(1);
  }
};

seedServices();
