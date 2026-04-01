"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatSessionController_1 = require("../controllers/chatSessionController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes (for customers on the frontend)
router.post('/', chatSessionController_1.createSession);
router.get('/:id', chatSessionController_1.getSession);
router.post('/:id/messages', chatSessionController_1.addMessage);
// Admin routes (for Admin Dashboard)
router.get('/', auth_1.authenticateToken, auth_1.requireAdmin, chatSessionController_1.getAllSessions);
router.patch('/:id/status', auth_1.authenticateToken, auth_1.requireAdmin, chatSessionController_1.updateSessionStatus);
exports.default = router;
//# sourceMappingURL=chatSessionRoutes.js.map