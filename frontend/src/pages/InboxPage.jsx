import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';

const InboxPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/conversations`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setConversations(res.data);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.token) {
      fetchConversations();
    } else if (!user) {
      setLoading(false);
      setError('Please log in to view your inbox.');
    }
  }, [user, API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="ml-2">Loading conversations...</p>
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
          <CardTitle className="text-2xl">Your Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-muted-foreground text-center">No conversations yet.</p>
          ) : (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <Link
                  key={conv._id}
                  to={`/chat/${conv._id}`}
                  className="block p-4 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">
                      {conv.participants.map(p => p.businessName || p.name || p.email).join(', ')}
                    </h3>
                    <div className="flex items-center gap-2">
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                          {conv.unreadCount} New
                        </span>
                      )}
                      {conv.lastMessage && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {conv.lastMessage && (
                    <p className="text-muted-foreground text-sm mt-1 truncate">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InboxPage;
