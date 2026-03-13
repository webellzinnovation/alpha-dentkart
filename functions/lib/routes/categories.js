"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', categoryController_1.getAllCategories);
// Admin routes
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, categoryController_1.createCategory);
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, categoryController_1.updateCategory);
router.patch('/:id', auth_1.authenticateToken, auth_1.requireAdmin, categoryController_1.updateCategory);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, categoryController_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=categories.js.map