// Script to create admin user
// Run with: npx tsx scripts/create-admin.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
    const email = process.argv[2] || 'admin@alphadentkart.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin';

    try {
        // Check if admin already exists
        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (existing) {
            // Update to admin role
            const updated = await prisma.user.update({
                where: { email },
                data: { role: 'admin' }
            });
            console.log(`✅ Updated user ${email} to admin role`);
            return;
        }

        // Create new admin user
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'admin',
                phone: '+91 99999 99999',
                isVerified: true
            }
        });

        console.log(`✅ Admin user created: ${email} / ${password}`);
        console.log(`   User ID: ${admin.id}`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
