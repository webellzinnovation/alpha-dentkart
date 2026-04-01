"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const router = (0, express_1.Router)();
router.get('/', categoryController_1.getAllCategories);
exports.default = router;
//# sourceMappingURL=categories.js.map