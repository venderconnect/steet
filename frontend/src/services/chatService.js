import api from './axiosConfig';

export const createOrGetConversation = (supplierId, productId) => {
  return api.post(`/conversations/${supplierId}/${productId}`);
};

export const sendMessage = (conversationId, content) => {
  return api.post('/messages', { conversationId, content });
};

export const getConversations = () => {
  return api.get('/conversations');
};

export const getMessages = (conversationId) => {
  return api.get(`/conversations/${conversationId}/messages`);
};

export const markConversationAsRead = (conversationId) => {
  return api.patch(`/conversations/${conversationId}/read`);
};

export const getUnreadMessageCount = () => {
  return api.get('/conversations/unread-count');
};