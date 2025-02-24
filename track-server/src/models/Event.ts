import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    index: true
  },
  eventName: {
    type: String,
    required: true,
    index: true
  },
  eventParams: {
    type: mongoose.Schema.Types.Mixed
  },
  commonParams: {
    type: mongoose.Schema.Types.Mixed
  },
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
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

export const Event = mongoose.model('Event', eventSchema); 