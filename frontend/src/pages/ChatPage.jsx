import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import { markConversationAsRead } from '../services/chatService'; // Import the new service function

const ChatPage = () => {
  const { conversationId } = useParams(); // Changed to conversationId
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [chatTitle, setChatTitle] = useState('Chat'); // New state for dynamic title

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch messages for the given conversationId
        const messagesRes = await axios.get(
          `${API_BASE_URL}/conversations/${conversationId}/messages`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setMessages(messagesRes.data);

        // Optionally fetch conversation details to get other participant's name for title
        const conversationRes = await axios.get(
          `${API_BASE_URL}/conversations/${conversationId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        const otherParticipant = conversationRes.data.participants.find(p => p._id !== user.id);
        if (otherParticipant) {
          setChatTitle(`Chat with ${otherParticipant.businessName || otherParticipant.name}`);
        }

        // Mark conversation as read after fetching messages
        if (conversationId && user && user.token) {
          await markConversationAsRead(conversationId);
        }

      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load chat. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.token && conversationId) { // Dependency array changed
      fetchMessages();
    } else if (!user || !user.token) {
      setLoading(false);
      setError('Please log in to view this chat.');
    } else if (!conversationId) {
      setLoading(false);
      setError('No conversation selected.');
    }
  }, [user, conversationId, API_BASE_URL]); // Dependency array changed

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    try {
      const messageRes = await axios.post(
        `${API_BASE_URL}/messages`,
        { conversationId, content: newMessage },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setMessages((prevMessages) => [...prevMessages, messageRes.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="ml-2">Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">Error</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{chatTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto border rounded-md p-4 mb-4 flex flex-col space-y-2">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${msg.sender === user.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <p className="font-semibold">{msg.sender === user.id ? 'You' : msg.sender.businessName || msg.sender.name}</p>
                    <p>{msg.content}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit">Send</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPage;
