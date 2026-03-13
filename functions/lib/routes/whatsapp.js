"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const whatsappController_1 = require("../controllers/whatsappController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All WhatsApp routes require authentication
router.use(auth_1.authenticateToken);
// Send order status via WhatsApp (Admin only)
router.post('/order-status', auth_1.requireAdmin, whatsappController_1.sendOrderStatusWhatsApp);
// Send custom WhatsApp message (Admin only)
router.post('/send', auth_1.requireAdmin, whatsappController_1.sendCustomWhatsApp);
// Send payment reminder via WhatsApp (Admin only)
router.post('/payment-reminder', auth_1.requireAdmin, whatsappController_1.sendPaymentReminderWhatsApp);
exports.default = router;
//# sourceMappingURL=whatsapp.js.map