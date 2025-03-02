"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const application_1 = require("./routes/application");
const user_1 = __importDefault(require("./routes/user"));
const track_1 = require("./routes/track");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
// 创建 Express 应用
const app = (0, express_1.default)();
// 基础中间件
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API 路由
app.use('/api/users', user_1.default);
app.use('/api/app', application_1.applicationRouter);
app.use('/api/track', track_1.trackRouter);
// 启动服务器
const startServer = async () => {
    try {
        await (0, db_1.connectDB)();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing server...');
    try {
        await (0, db_1.closeDB)();
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});
startServer();
