import { Request, Response } from 'express';
import { db, auth, admin } from '../config/firebase'; // Firestore, Auth, Admin SDK
import logger from '../utils/logger';

// Update User (e.g., role or status)
export async function updateUser(req: Request, res: Response) {
    try {
        const userId = req.params.id as string;
        const updates = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Avoid updating restricted fields directly
        delete updates.password;
        delete updates.email; // changing email might require re-verification

        updates.updatedAt = new Date().toISOString();

        await userRef.update(updates);

        // Fetch updated user
        const updatedDoc = await userRef.get();
        const updatedUser = { id: updatedDoc.id, ...updatedDoc.data() };

        // Exclude sensitive Info
        delete (updatedUser as any).password;

        logger.info('User updated by admin', { userId });

        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        logger.error('Error updating user', { error, userId: req.params.id });
        res.status(500).json({ error: 'Failed to update user' });
    }
}

// Update User by Email (for admin customer management)
export async function updateUserByEmail(req: Request, res: Response) {
    try {
        const { email } = req.body;
        const updates = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const searchEmail = email.toLowerCase().trim();
        console.log('🔍 Searching for user with email:', searchEmail);

        // First try exact match
        let userSnapshot = await db.collection('users')
            .where('email', '==', searchEmail)
            .limit(1)
            .get();

        // If not found, try case-insensitive approach by fetching all and filtering
        if (userSnapshot.empty) {
            console.log('📂 Trying case-insensitive search...');
            const allUsers = await db.collection('users').get();
            
            for (const doc of allUsers.docs) {
                const userEmail = (doc.data().email || '').toLowerCase().trim();
                if (userEmail === searchEmail) {
                    userSnapshot = { docs: [doc], empty: false } as any;
                    break;
                }
            }
        }

        // If still not found, try Firebase Auth lookup
        if (userSnapshot.empty) {
            console.log('🔐 Trying Firebase Auth lookup...');
            try {
                const userRecord = await auth.getUserByEmail(searchEmail);
                console.log('✅ Found in Firebase Auth:', userRecord.uid);
                
                // Try to get Firestore doc by UID
                const userDoc = await db.collection('users').doc(userRecord.uid).get();
                if (userDoc.exists) {
                    userSnapshot = { docs: [userDoc], empty: false } as any;
                } else {
                    // Create Firestore entry from Auth data
                    console.log('📝 Creating Firestore entry from Firebase Auth...');
                    const newUserRef = db.collection('users').doc(userRecord.uid);
                    await newUserRef.set({
                        email: userRecord.email,
                        name: userRecord.displayName || 'User',
                        phone: userRecord.phoneNumber || '',
                        userType: 'regular',
                        verificationStatus: 'pending',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    const newDoc = await newUserRef.get();
                    userSnapshot = { docs: [newDoc], empty: false } as any;
                }
            } catch (authError: any) {
                console.log('❌ Firebase Auth error:', authError.message);
            }
        }

        if (userSnapshot.empty) {
            return res.status(404).json({ error: 'User not found with this email' });
        }

        const userDoc = userSnapshot.docs[0];
        const userId = userDoc.id;
        console.log('✅ Found user:', userId);

        // Avoid updating restricted fields
        delete updates.password;
        delete updates.email;
        delete updates.id;

        updates.updatedAt = new Date().toISOString();

        await userDoc.ref.update(updates);

        // Also update Firebase Auth if disabled status changed
        if (updates.disabled !== undefined) {
            try {
                const userRecord = await auth.getUserByEmail(searchEmail);
                await admin.auth().updateUser(userRecord.uid, { disabled: updates.disabled });
                console.log('✅ Updated Firebase Auth disabled status');
            } catch (authError) {
                console.log('⚠️ Could not update Firebase Auth disabled status:', authError);
            }
        }

        // Fetch updated user
        const updatedDoc = await userDoc.ref.get();
        const updatedUser = { id: updatedDoc.id, ...updatedDoc.data() };

        logger.info('User updated by admin via email', { email: searchEmail, userId });

        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.error('❌ Error updating user:', error);
        logger.error('Error updating user by email', { error });
        res.status(500).json({ error: 'Failed to update user', details: String(error) });
    }
}

// Delete User
export async function deleteUser(req: Request, res: Response) {
    try {
        const userId = req.params.id as string;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        await userRef.delete();

        logger.info('User deleted by admin', { userId });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Error deleting user', { error, userId: req.params.id });
        res.status(500).json({ error: 'Failed to delete user' });
    }
}

// Get All Users (Admin) - with pagination support
export async function getAllUsers(req: Request, res: Response) {
    try {
        console.log('🔍 getAllUsers called');
        const limit = parseInt(req.query.limit as string) || 100;
        const pageToken = req.query.pageToken as string | undefined;
        const getTotal = req.query.getTotal === 'true';
        
        // Fetch from Firebase Auth
        const authUsers: any[] = [];
        let nextPageToken: string | undefined;
        let totalCount = 0;
        
        console.log(`📡 Starting Firebase Auth listUsers... limit=${limit}, pageToken=${pageToken ? 'provided' : 'none'}`);
        
        // If pageToken is provided, use it directly (for specific page)
        if (pageToken) {
            console.log('📡 Using provided pageToken');
            const result = await auth.listUsers(limit, pageToken);
            authUsers.push(...result.users.map(u => ({
                id: u.uid,
                email: u.email || '',
                name: u.displayName || 'Unknown',
                phone: u.phoneNumber || '',
                photoURL: u.photoURL || '',
                disabled: u.disabled,
                createdAt: u.metadata.creationTime,
                emailVerified: u.emailVerified
            })));
            nextPageToken = result.pageToken;
            totalCount = result.users.length;
        } else {
            // Get first batch
            const firstResult = await auth.listUsers(limit);
            authUsers.push(...firstResult.users.map(u => ({
                id: u.uid,
                email: u.email || '',
                name: u.displayName || 'Unknown',
                phone: u.phoneNumber || '',
                photoURL: u.photoURL || '',
                disabled: u.disabled,
                createdAt: u.metadata.creationTime,
                emailVerified: u.emailVerified
            })));
            nextPageToken = firstResult.pageToken;
            totalCount = firstResult.users.length;
            
            // If getTotal is requested, count all users (expensive operation)
            if (getTotal) {
                console.log('📡 Counting all users (getTotal=true)...');
                let countPageToken: string | undefined = firstResult.pageToken;
                let count = firstResult.users.length;
                while (countPageToken) {
                    const countResult = await auth.listUsers(1000, countPageToken);
                    count += countResult.users.length;
                    countPageToken = countResult.pageToken;
                }
                totalCount = count;
                console.log(`📊 Total users counted: ${totalCount}`);
            }
        }
        
        console.log(`📊 Fetched ${authUsers.length} users, nextPageToken: ${nextPageToken ? 'exists' : 'none'}`);
        
        // Get Firestore profiles for additional data
        const firestoreProfiles = new Map();
        if (authUsers.length > 0) {
            const batchSize = 10;
            for (let i = 0; i < authUsers.length; i += batchSize) {
                const batch = authUsers.slice(i, i + batchSize);
                const uids = batch.map(u => u.id);
                try {
                    const snapshots = await db.collection('users')
                        .where(admin.firestore.FieldPath.documentId(), 'in', uids)
                        .get();
                    
                    snapshots.docs.forEach(doc => {
                        firestoreProfiles.set(doc.id, doc.data());
                    });
                } catch (firestoreError) {
                    console.log('⚠️ Firestore batch error (non-fatal):', firestoreError);
                }
            }
        }
        
        // Merge Auth data with Firestore profiles
        const users = authUsers.slice(0, limit).map(authUser => {
            const firestoreData = firestoreProfiles.get(authUser.id) || {};
            return {
                ...authUser,
                ...firestoreData,
                name: firestoreData.name || authUser.name,
                phone: firestoreData.phone || authUser.phone,
                userType: firestoreData.userType || 'regular',
                verificationStatus: firestoreData.verificationStatus || 'pending',
            };
        });

        res.json({ 
            users, 
            total: totalCount, 
            nextPageToken,
            hasMore: !!nextPageToken
        });
    } catch (error) {
        console.error('❌ Error getting all users:', error);
        logger.error('Error getting all users', { error });
        res.status(500).json({ error: 'Failed to get users', details: String(error) });
    }
}
