"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protect all routes with admin authentication
router.use(auth_1.authenticateToken, auth_1.requireAdmin);
router.put('/:id', userController_1.updateUser);
router.delete('/:id', userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map