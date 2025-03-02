"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const sessionSchema = new mongoose_1.default.Schema({
    sessionId: { type: String, required: true },
    projectId: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number },
    pageUrl: { type: String, required: true },
    pageTitle: { type: String },
    referrer: { type: String },
    metrics: {
        duration: Number,
        scrollDepth: Number,
        visibleSections: mongoose_1.default.Schema.Types.Mixed
    },
    events: [{
            type: String,
            timestamp: Number,
            data: mongoose_1.default.Schema.Types.Mixed
        }],
    userEnvInfo: {
        browserName: String,
        browserVersion: String,
        osName: String,
        osVersion: String,
        deviceType: String,
        screenResolution: String,
        language: String,
        timezone: String,
        uid: String,
        timestamp: Number,
        userAgent: String,
        languageRaw: String,
        ipAddress: String,
        location: {
            country: String,
            region: String,
            city: String
        },
        referrer: String,
        pageTitle: String
    }
}, { timestamps: true });
exports.Session = mongoose_1.default.model('Session', sessionSchema);
