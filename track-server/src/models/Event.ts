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
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  commonParams: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
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
    timestamp: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export const Event = mongoose.model('Event', eventSchema); 