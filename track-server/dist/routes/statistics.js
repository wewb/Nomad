"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statisticsRouter = void 0;
const express_1 = __importDefault(require("express"));
const Event_1 = require("../models/Event");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/dashboard', auth_1.auth, async (req, res) => {
    try {
        const user = req.user;
        const query = {};
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'admin') {
            query.projectId = { $in: (user === null || user === void 0 ? void 0 : user.accessibleProjects) || [] };
        }
        // 使用 query 进行统计查询
        const stats = await Event_1.Event.aggregate([
            { $match: query },
            // ... 其他统计逻辑
        ]);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});
exports.statisticsRouter = router;
