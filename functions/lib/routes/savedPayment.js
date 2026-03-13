"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const savedPaymentController_1 = require("../controllers/savedPaymentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.post('/', auth_1.authenticateToken, savedPaymentController_1.savePaymentMethod);
router.get('/', auth_1.authenticateToken, savedPaymentController_1.getUserPaymentMethods);
router.get('/stats', auth_1.authenticateToken, savedPaymentController_1.getPaymentMethodStats);
router.get('/default', auth_1.authenticateToken, savedPaymentController_1.getDefaultPaymentMethod);
router.get('/:id', auth_1.authenticateToken, savedPaymentController_1.getPaymentMethodById);
router.put('/:id', auth_1.authenticateToken, savedPaymentController_1.updatePaymentMethod);
router.delete('/:id', auth_1.authenticateToken, savedPaymentController_1.deletePaymentMethod);
router.put('/:id/default', auth_1.authenticateToken, savedPaymentController_1.setDefaultPaymentMethod);
// Gateway-specific routes
router.get('/gateway/:gateway', auth_1.authenticateToken, savedPaymentController_1.getPaymentMethodsByGateway);
// Validation route
router.post('/validate', auth_1.authenticateToken, savedPaymentController_1.validatePaymentToken);
exports.default = router;
//# sourceMappingURL=savedPayment.js.map