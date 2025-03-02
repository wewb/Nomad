"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_1 = __importDefault(require("./routes/user"));
const application_1 = require("./routes/application");
const track_1 = require("./routes/track");
const auth_1 = __importDefault(require("./routes/auth"));
const api_1 = require("./routes/api");
const app = (0, express_1.default)();
dotenv_1.default.config();
// 中间件
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API 路由
app.use('/api/users', user_1.default);
app.use('/api/app', application_1.applicationRouter);
app.use('/api/track', track_1.trackRouter);
app.use('/api/auth', auth_1.default);
app.use('/api-key', api_1.apiRouter);
// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
// 连接数据库
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/track-platform');
        console.log('MongoDB connected');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
connectDB();
exports.default = app;
