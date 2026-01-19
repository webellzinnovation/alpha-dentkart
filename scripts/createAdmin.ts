// Script to create an admin user in the database
// Run with: npx tsx scripts/createAdmin.ts

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const email = 'admin@alphadentkart.com';
        const password = 'Admin@123'; // Change this to a strong password
        const name = 'Admin User';

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            console.log(`Email: ${email}`);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'admin',
                isVerified: true,
            },
        });

        console.log('\n✅ Admin user created successfully!');
        console.log(`\nLogin Credentials:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`\n⚠️  IMPORTANT: Change the password after first login!\n`);
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
