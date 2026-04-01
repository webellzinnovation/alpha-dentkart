"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promotionalTileController_1 = require("../controllers/promotionalTileController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', promotionalTileController_1.getAllPromotionalTiles);
// Admin routes
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, promotionalTileController_1.createPromotionalTile);
router.patch('/:id', auth_1.authenticateToken, auth_1.requireAdmin, promotionalTileController_1.updatePromotionalTile);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, promotionalTileController_1.deletePromotionalTile);
router.patch('/reorder/batch', auth_1.authenticateToken, auth_1.requireAdmin, promotionalTileController_1.reorderPromotionalTiles);
exports.default = router;
//# sourceMappingURL=promotionalTiles.js.map