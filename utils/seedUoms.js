require('dotenv').config();
const mongoose = require('mongoose');
const Uom = require('../models/Uom');
const User = require('../models/User');
const connectDB = require('../config/db');

const defaultUoms = [
  { name: 'NA', description: 'Not Applicable' },
  { name: 'Ton', description: 'Unit of weight measurement' },
  { name: 'Area', description: 'Surface area measurement' },
  { name: 'Task', description: 'Task-based unit' },
  { name: 'BOG Tons', description: 'Blasted Ore Grade in Tons' },
  { name: 'BFP', description: 'Blast Face Preparation' },
];

const seedUoms = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if UOMs already exist
    const existingUoms = await Uom.countDocuments();
    if (existingUoms > 0) {
      console.log('UOMs already exist. Skipping seed...');
      process.exit(0);
    }

    // Find an admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Create default UOMs
    const uomsToCreate = defaultUoms.map(uom => ({
      ...uom,
      createdBy: adminUser._id
    }));

    await Uom.insertMany(uomsToCreate);
    
    console.log('✅ Default UOMs seeded successfully!');
    console.log(`Created ${defaultUoms.length} UOMs`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding UOMs:', error);
    process.exit(1);
  }
};

seedUoms();
