"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const brandController_1 = require("../controllers/brandController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', brandController_1.getAllBrands);
router.patch('/:id/featured', auth_1.authenticateToken, auth_1.requireAdmin, brandController_1.toggleBrandFeatured);
router.patch('/featured/reorder', auth_1.authenticateToken, auth_1.requireAdmin, brandController_1.reorderFeaturedBrands);
exports.default = router;
//# sourceMappingURL=brands.js.map