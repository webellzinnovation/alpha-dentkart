"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes (optional auth for personalization)
router.get('/', auth_1.optionalAuth, productController_1.getAllProducts);
router.get('/:id', auth_1.optionalAuth, productController_1.getProductById);
exports.default = router;
//# sourceMappingURL=products.js.map