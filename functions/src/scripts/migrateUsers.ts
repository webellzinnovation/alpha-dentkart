import { db, auth, admin } from '../config/firebase';
import fs from 'fs';
import path from 'path';

// Type definition for WordPress User Export
interface WPUser {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    billing: {
        phone: string;
        address_1: string;
        city: string;
        postcode: string;
        country: string;
        state: string;
    };
    shipping: {
        address_1: string;
        city: string;
        postcode: string;
        country: string;
        state: string;
    };
    date_created: string;
}

async function migrateUsers() {
    console.log('🚀 Starting User Migration...');

    const dataPath = path.join(process.cwd(), 'migration', 'wordpress_users.json');

    if (!fs.existsSync(dataPath)) {
        console.error(`❌ Data file not found at: ${dataPath}`);
        console.log('Please export your WordPress users to JSON.');
        process.exit(1);
    }

    const users: WPUser[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`👤 Found ${users.length} users to migrate.`);

    let successCount = 0;
    let errorCount = 0;

    for (const wpUser of users) {
        try {
            if (!wpUser.email) {
                console.warn(`⚠️ Skipping user ${wpUser.username} (No Email)`);
                continue;
            }

            // 1. Create Firebase Auth User
            let uid: string;
            try {
                const userRecord = await auth.getUserByEmail(wpUser.email);
                uid = userRecord.uid;
                console.log(`ℹ️ User ${wpUser.email} already exists (UID: ${uid})`);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    // Create new user
                    const userRecord = await auth.createUser({
                        email: wpUser.email,
                        emailVerified: true, // Assume verified if from legacy system
                        displayName: `${wpUser.first_name} ${wpUser.last_name}`.trim(),
                        phoneNumber: wpUser.billing.phone ? `+91${wpUser.billing.phone.replace(/[^0-9]/g, '').slice(-10)}` : undefined, // formatting for India
                        disabled: false,
                    });
                    uid = userRecord.uid;
                    console.log(`✅ Created Auth User: ${wpUser.email}`);
                } else {
                    throw error;
                }
            }

            // 2. Create Firestore User Document
            const userDoc = {
                uid: uid,
                wpId: wpUser.id,
                email: wpUser.email,
                name: `${wpUser.first_name} ${wpUser.last_name}`.trim(),
                phone: wpUser.billing.phone || null,
                role: 'user',
                addresses: [
                    {
                        type: 'billing',
                        street: wpUser.billing.address_1,
                        city: wpUser.billing.city,
                        state: wpUser.billing.state,
                        zip: wpUser.billing.postcode,
                        country: wpUser.billing.country || 'IN',
                        default: true
                    }
                ],
                createdAt: new Date(wpUser.date_created).toISOString(),
                updatedAt: new Date().toISOString(),
                isVerified: true
            };

            await db.collection('users').doc(uid).set(userDoc, { merge: true });
            process.stdout.write('.');
            successCount++;

        } catch (err) {
            console.error(`\n❌ Failed user ${wpUser.email}:`, err);
            errorCount++;
        }
    }

    console.log(`\n🎉 User Migration Complete! Success: ${successCount}, Errors: ${errorCount}`);
}

migrateUsers().catch(console.error);
