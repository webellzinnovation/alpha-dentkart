import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
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
