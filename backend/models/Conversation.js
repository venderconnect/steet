const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'participantModel',
    required: true
  }],
  participantModel: [{
    type: String,
    required: true,
    enum: ['VendorUser', 'SupplierUser']
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastReadVendorMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastReadSupplierMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
