import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
import logger from '../utils/logger';
import { userUpdateSchema } from '../utils/validation';

// Update User (e.g., role or status)
export async function updateUser(req: Request, res: Response) {
    try {
        const userId = req.params.id as string;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const validatedData = userUpdateSchema.parse(req.body);
        const updates: any = { ...validatedData };

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Avoid updating restricted fields directly (handled by zod strict() and manual check)
        delete updates.password;
        delete updates.email; 

        updates.updatedAt = new Date().toISOString();

        await userRef.update(updates);

        // Fetch updated user
        const updatedDoc = await userRef.get();
        const updatedUser = { id: updatedDoc.id, ...updatedDoc.data() };

        // Exclude sensitive Info
        delete (updatedUser as any).password;

        logger.info('User updated by admin', { userId });

        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input data', details: error.errors });
        }
        logger.error('Error updating user', { error, userId: req.params.id });
        res.status(500).json({ error: 'Failed to update user' });
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

        // In a real application, you'd also want to delete the user from Firebase Auth
        // using firebaseAdmin.auth().deleteUser(userDoc.data().firebaseUid) if mapped.
        // For now, removing the document from Firestore prevents login via email/password check.

        await userRef.delete();

        logger.info('User deleted by admin', { userId });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Error deleting user', { error, userId: req.params.id });
        res.status(500).json({ error: 'Failed to delete user' });
    }
}

// Get all users (admin only)
export async function getAllUsers(req: Request, res: Response) {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const pageToken = req.query.pageToken as string; // index-based cursor
        const search = req.query.search as string;

        let query: FirebaseFirestore.Query = db.collection('users');

        // Fetch all for sorting/filtering (in-memory for now to support cross-field search)
        const snapshot = await query.get();
        const allUsers: any[] = snapshot.docs.map(doc => {
            const data = doc.data();
            const { password, ...userWithoutPassword } = data;
            return {
                id: doc.id,
                ...userWithoutPassword,
                orders: [] // Placeholder for admin dashboard expectation
            };
        });

        // Sort by most recent
        allUsers.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.registrationDate || 0).getTime();
            const dateB = new Date(b.createdAt || b.registrationDate || 0).getTime();
            return dateB - dateA;
        });

        // Apply search filter
        let filteredUsers = allUsers;
        if (search) {
            const s = search.toLowerCase();
            filteredUsers = allUsers.filter(u =>
                (u.name && u.name.toLowerCase().includes(s)) ||
                (u.email && u.email.toLowerCase().includes(s)) ||
                (u.phone && String(u.phone).includes(s))
            );
        }

        const total = filteredUsers.length;
        const startIndex = pageToken ? parseInt(pageToken) : 0;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

        const nextPageToken = (startIndex + limit < total) ? String(startIndex + limit) : null;

        return res.json({ 
            users: paginatedUsers, 
            nextPageToken,
            total: allUsers.length
        });
    } catch (error) {
        logger.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Internal server error while fetching users' });
    }
}
