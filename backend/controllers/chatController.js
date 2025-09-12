const { Conversation, Message } = require('../models/model');

exports.createOrGetConversation = async (req, res) => {
  try {
    const { supplierId, productId } = req.params;
    const userId = req.user.id; // Vendor or Supplier ID

    // Determine participant models based on roles
    let participant1Model, participant2Model;
    if (req.user.role === 'vendor') {
      participant1Model = 'VendorUser';
      participant2Model = 'SupplierUser';
    } else if (req.user.role === 'supplier') {
      participant1Model = 'SupplierUser';
      participant2Model = 'VendorUser';
    } else {
      return res.status(400).json({ msg: 'Invalid user role for chat.' });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, supplierId] },
      participantModel: { $all: [participant1Model, participant2Model] }
    });

    if (!conversation) {
      // Create new conversation if not found
      conversation = new Conversation({
        participants: [userId, supplierId],
        participantModel: [participant1Model, participant2Model]
      });
      await conversation.save();
    }

    res.status(200).json({ conversationId: conversation._id });
  } catch (err) {
    console.error('Error in createOrGetConversation:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.role === 'vendor' ? 'VendorUser' : 'SupplierUser';

    if (!conversationId || !content) {
      return res.status(400).json({ msg: 'Conversation ID and message content are required.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found.' });
    }

    // Ensure sender is a participant in the conversation
    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ msg: 'You are not a participant in this conversation.' });
    }

    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      senderModel: senderModel,
      content: content,
    });
    await message.save();

    // Update lastMessage in conversation
    conversation.lastMessage = message._id;

    // Update lastReadMessage for sender and recipient
    if (senderModel === 'VendorUser') {
      conversation.lastReadVendorMessage = message._id;
      conversation.lastReadSupplierMessage = undefined; // Mark as unread for supplier
    } else if (senderModel === 'SupplierUser') {
      conversation.lastReadSupplierMessage = message._id;
      conversation.lastReadVendorMessage = undefined; // Mark as unread for vendor
    }
    await conversation.save();

    res.status(201).json(message);
  } catch (err) {
    console.error('Error in sendMessage:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userModel = userRole === 'vendor' ? 'VendorUser' : 'SupplierUser';

    let conversations = await Conversation.find({
      participants: userId,
    })
    .populate({
      path: 'participants',
      select: 'name businessName email role',
    })
    .populate('lastMessage')
    .populate('lastReadVendorMessage')
    .populate('lastReadSupplierMessage')
    .sort({ updatedAt: -1 });

    // Filter conversations to ensure strict privacy (one vendor, one supplier)
    conversations = conversations.filter(conv => {
      // Ensure exactly two participants
      if (conv.participants.length !== 2) {
        return false;
      }

      const otherParticipant = conv.participants.find(p => p._id.toString() !== userId);

      // Ensure the other participant exists and has the opposite role
      if (!otherParticipant) {
        return false;
      }

      if (userRole === 'vendor' && otherParticipant.role !== 'supplier') {
        return false;
      }
      if (userRole === 'supplier' && otherParticipant.role !== 'vendor') {
        return false;
      }

      return true;
    });

    const conversationsWithUnread = conversations.map(conv => {
      let unreadCount = 0;
      let lastReadMessageId = null;

      if (userRole === 'vendor') {
        lastReadMessageId = conv.lastReadVendorMessage ? conv.lastReadVendorMessage._id.toString() : null;
      } else if (userRole === 'supplier') {
        lastReadMessageId = conv.lastReadSupplierMessage ? conv.lastReadSupplierMessage._id.toString() : null;
      }

      // If there's a last message and it's different from the last read message, it's unread
      if (conv.lastMessage && conv.lastMessage._id.toString() !== lastReadMessageId) {
        unreadCount = 1; // Simple unread count for now (1 if last message is unread, 0 otherwise)
      }

      return { ...conv.toObject(), unreadCount };
    });

    // The previous filter `conv => conv.participants.some(p => p !== null)` is now redundant
    // as the above filter ensures valid participants.
    res.status(200).json(conversationsWithUnread);
  } catch (err) {
    console.error('Error in getConversations:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found.' });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ msg: 'You are not a participant in this conversation.' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name businessName role')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error('Error in getMessages:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found.' });
    }

    // Ensure the user is a participant in the conversation
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ msg: 'You are not a participant in this conversation.' });
    }

    // Find the last message in the conversation
    const lastMessage = await Message.findOne({ conversation: conversationId }).sort({ createdAt: -1 });

    if (lastMessage) {
      if (userRole === 'vendor') {
        conversation.lastReadVendorMessage = lastMessage._id;
      } else if (userRole === 'supplier') {
        conversation.lastReadSupplierMessage = lastMessage._id;
      }
      await conversation.save();
    }

    res.status(200).json({ msg: 'Conversation marked as read.' });
  } catch (err) {
    console.error('Error marking conversation as read:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let unreadCount = 0;

    const conversations = await Conversation.find({
      participants: userId,
    })
    .populate('lastMessage')
    .populate('lastReadVendorMessage')
    .populate('lastReadSupplierMessage');

    conversations.forEach(conv => {
      if (conv.lastMessage) {
        if (userRole === 'vendor') {
          if (!conv.lastReadVendorMessage || conv.lastReadVendorMessage.toString() !== conv.lastMessage._id.toString()) {
            unreadCount++;
          }
        } else if (userRole === 'supplier') {
          if (!conv.lastReadSupplierMessage || conv.lastReadSupplierMessage.toString() !== conv.lastMessage._id.toString()) {
            unreadCount++;
          }
        }
      }
    });

    res.status(200).json({ unreadCount });
  } catch (err) {
    console.error('Error getting unread message count:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getConversationDetails = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId)
      .populate({
        path: 'participants',
        select: 'name businessName email role',
      });

    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found.' });
    }

    // Ensure the user is a participant in the conversation
    if (!conversation.participants.some(p => p._id.toString() === userId)) {
      return res.status(403).json({ msg: 'You are not a participant in this conversation.' });
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error('Error getting conversation details:', err);
    res.status(500).json({ msg: err.message });
  }
};