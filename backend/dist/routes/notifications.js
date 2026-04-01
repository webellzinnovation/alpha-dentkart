"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationsController_1 = require("../controllers/notificationsController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All notification routes are admin-only
router.use(auth_1.authenticateToken, auth_1.requireAdmin);
// Send custom email
router.post('/send', notificationsController_1.sendCustomNotification);
// Send tracking notification email
router.post('/tracking', notificationsController_1.sendTrackingNotification);
// Send order status notification email
router.post('/order-status', notificationsController_1.sendOrderStatusNotification);
exports.default = router;
//# sourceMappingURL=notifications.js.map