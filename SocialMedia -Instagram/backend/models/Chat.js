const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      return !this.image;
    }
  },
  image: {
    type: String
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.timestamp = ret.createdAt;
      delete ret.createdAt;
      delete ret.updatedAt;
      return ret;
    }
  }
});

// Index for efficient querying
chatSchema.index({ sender: 1, recipient: 1 });
chatSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema); 