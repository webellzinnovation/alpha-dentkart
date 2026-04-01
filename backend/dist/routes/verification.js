"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verificationController_1 = require("../controllers/verificationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// User routes
router.post('/submit', auth_1.authenticateToken, verificationController_1.uploadVerificationFile, verificationController_1.submitVerification);
router.get('/my-verifications', auth_1.authenticateToken, verificationController_1.getUserVerifications);
router.get('/:id', auth_1.authenticateToken, verificationController_1.getVerificationById);
router.get('/:id/audit-logs', auth_1.authenticateToken, verificationController_1.getVerificationAuditLogs);
router.delete('/:id', auth_1.authenticateToken, verificationController_1.deleteVerification);
// Admin routes
router.get('/', auth_1.authenticateToken, verificationController_1.getAllVerifications);
router.put('/:id/status', auth_1.authenticateToken, verificationController_1.updateVerificationStatus);
router.get('/admin/stats', auth_1.authenticateToken, verificationController_1.getVerificationStats);
router.get('/admin/audit-logs', auth_1.authenticateToken, verificationController_1.getAllVerificationAuditLogs);
exports.default = router;
//# sourceMappingURL=verification.js.map