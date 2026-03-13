"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const firebase_1 = require("../config/firebase"); // Firestore
const logger_1 = __importDefault(require("../utils/logger"));
// Update User (e.g., role or status)
async function updateUser(req, res) {
    try {
        const userId = req.params.id;
        const updates = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const userRef = firebase_1.db.collection('users').doc(userId);
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
        delete updatedUser.password;
        logger_1.default.info('User updated by admin', { userId });
        res.json({ message: 'User updated successfully', user: updatedUser });
    }
    catch (error) {
        logger_1.default.error('Error updating user', { error, userId: req.params.id });
        res.status(500).json({ error: 'Failed to update user' });
    }
}
// Delete User
async function deleteUser(req, res) {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const userRef = firebase_1.db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        // In a real application, you'd also want to delete the user from Firebase Auth
        // using firebaseAdmin.auth().deleteUser(userDoc.data().firebaseUid) if mapped.
        // For now, removing the document from Firestore prevents login via email/password check.
        await userRef.delete();
        logger_1.default.info('User deleted by admin', { userId });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        logger_1.default.error('Error deleting user', { error, userId: req.params.id });
        res.status(500).json({ error: 'Failed to delete user' });
    }
}
//# sourceMappingURL=userController.js.map