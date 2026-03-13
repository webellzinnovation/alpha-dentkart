"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quickReorderController_1 = require("../controllers/quickReorderController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.post('/', auth_1.authenticateToken, quickReorderController_1.createQuickReorder);
router.get('/', auth_1.authenticateToken, quickReorderController_1.getUserReorders);
router.get('/stats', auth_1.authenticateToken, quickReorderController_1.getReorderStats);
router.get('/recommended', auth_1.authenticateToken, quickReorderController_1.getRecommendedReorders);
router.get('/:id', auth_1.authenticateToken, quickReorderController_1.getReorderById);
router.put('/:id/cancel', auth_1.authenticateToken, quickReorderController_1.cancelReorder);
exports.default = router;
//# sourceMappingURL=quickReorder.js.map