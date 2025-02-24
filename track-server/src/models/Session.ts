import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
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
    visibleSections: mongoose.Schema.Types.Mixed
  },

  events: [{
    type: String,
    timestamp: Number,
    data: mongoose.Schema.Types.Mixed
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

export const Session = mongoose.model('Session', sessionSchema); 