const mongoose = require('mongoose');

const DetoxSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: [1, 'Detox session must be at least 1 minute']
  },
  completed: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  focusNotes: {
    type: String,
    trim: true
  }
});

DetoxSessionSchema.index({ userId: 1, completedAt: 1 });

module.exports = mongoose.model('DetoxSession', DetoxSessionSchema);
