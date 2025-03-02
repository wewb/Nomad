"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const eventSchema = new mongoose_1.default.Schema({
    projectId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true
    },
    data: {
        pageUrl: String,
        pageTitle: String,
        referrer: String,
        events: [{
                type: {
                    type: String,
                    enum: ['view', 'click', 'scroll', 'leave', 'custom', 'visibility', 'error']
                },
                timestamp: Number,
                data: mongoose_1.default.Schema.Types.Mixed
            }]
    },
    userEnvInfo: {
        type: mongoose_1.default.Schema.Types.Mixed,
        required: true,
        uid: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});
exports.Event = mongoose_1.default.model('Event', eventSchema);
