"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const firebase_1 = require("../config/firebase");
const router = (0, express_1.Router)();
// Protect all routes with admin authentication
router.use(auth_1.authenticateToken, auth_1.requireAdmin);
router.get('/all', userController_1.getAllUsers);
router.get('/count', async (req, res) => {
    let totalCount = 0;
    let pageToken;
    try {
        const firstResult = await firebase_1.auth.listUsers(1000);
        totalCount = firstResult.users.length;
        pageToken = firstResult.pageToken;
        while (pageToken) {
            const result = await firebase_1.auth.listUsers(1000, pageToken);
            totalCount += result.users.length;
            pageToken = result.pageToken;
        }
        res.json({ total: totalCount });
    }
    catch (error) {
        console.error('Error counting users:', error);
        res.status(500).json({ error: 'Failed to count users', details: String(error) });
    }
});
router.put('/by-email', userController_1.updateUserByEmail);
router.put('/:id', userController_1.updateUser);
router.delete('/:id', userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map