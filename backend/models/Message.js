const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel',
    required: true
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['VendorUser', 'SupplierUser']
  },
  content: {
    type: String,
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
