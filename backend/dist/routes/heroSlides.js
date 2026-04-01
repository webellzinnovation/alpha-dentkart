"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const heroSlideController_1 = require("../controllers/heroSlideController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', heroSlideController_1.getAllHeroSlides);
// Admin routes
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, heroSlideController_1.createHeroSlide);
router.patch('/:id', auth_1.authenticateToken, auth_1.requireAdmin, heroSlideController_1.updateHeroSlide);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, heroSlideController_1.deleteHeroSlide);
router.patch('/reorder/batch', auth_1.authenticateToken, auth_1.requireAdmin, heroSlideController_1.reorderHeroSlides);
exports.default = router;
//# sourceMappingURL=heroSlides.js.map