import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import FinancialRecord from '../src/models/FinancialRecord.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_dashboard');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await FinancialRecord.deleteMany({});
    console.log('✅ Cleared existing data');

    // Hash passwords
    const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    };

    // Create users
    const [adminPassword, analystPassword, viewerPassword] = await Promise.all([
      hashPassword('admin123'),
      hashPassword('analyst123'),
      hashPassword('viewer123'),
    ]);

    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@finance.com',
        password: adminPassword,
        role: 'admin',
        status: 'active',
      },
      {
        name: 'Analyst User',
        email: 'analyst@finance.com',
        password: analystPassword,
        role: 'analyst',
        status: 'active',
      },
      {
        name: 'Viewer User',
        email: 'viewer@finance.com',
        password: viewerPassword,
        role: 'viewer',
        status: 'active',
      },
    ]);

    console.log('✅ Created users');
    console.log('   - Admin: admin@finance.com / admin123');
    console.log('   - Analyst: analyst@finance.com / analyst123');
    console.log('   - Viewer: viewer@finance.com / viewer123');

    // Create sample financial records
    const adminUser = users[0]._id;
    const analystUser = users[1]._id;

    const records = [];
    const categories = ['Salary', 'Rent', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Insurance'];
    const types = ['income', 'expense'];

    // Generate records for last 12 months
    const now = new Date();
    for (let i = 0; i < 100; i++) {
      const randomDate = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const type = types[Math.floor(Math.random() * types.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const amount = type === 'income'
        ? Math.floor(Math.random() * 5000) + 2000
        : Math.floor(Math.random() * 1000) + 50;

      const user = i % 3 === 0 ? analystUser : adminUser; // Mix of admin and analyst records

      records.push({
        amount,
        type,
        category,
        date: randomDate,
        description: `Sample ${type} record #${i + 1}`,
        createdBy: user,
      });
    }

    await FinancialRecord.create(records);
    console.log('✅ Created 100 sample financial records');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nNext steps:');
    console.log('1. Start backend: npm run dev');
    console.log('2. Start frontend: cd frontend && npm run dev');
    console.log('3. Login at http://localhost:5173 with the credentials above\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
