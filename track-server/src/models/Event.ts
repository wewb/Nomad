import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
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
      data: mongoose.Schema.Types.Mixed
    }]
  },
  userEnvInfo: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  commonParams: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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