const mongoose = require('mongoose');

const ScreenTimeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['Social', 'Gaming', 'Entertainment', 'Work', 'Other']
  },
  appName: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: [1, 'Duration must be at least 1 minute']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for fast lookups
ScreenTimeSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('ScreenTime', ScreenTimeSchema);
