
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [creators, setCreators] = useState([]);
  const [content, setContent] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;
    
    loadData();
    setIsInitialized(true);
  }, [isInitialized]);

  const loadData = () => {
    // Load creators
    const savedCreators = localStorage.getItem('bendza_creators');
    if (savedCreators) {
      setCreators(JSON.parse(savedCreators));
    } else {
      // Initialize with sample data
      const sampleCreators = [
        {
          user_id: 'sample1',
          name: 'Marie Dubois',
          bio: 'Créatrice de contenu lifestyle et mode. Partage mes looks du jour et conseils beauté !',
          abonnement_mode: true,
          abonnement_price: 2500,
          photourl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marie',
          followers: 1250,
          content_count: 45
        },
        {
          user_id: 'sample2',
          name: 'Alex Johnson',
          bio: 'Fitness coach et nutritionniste. Transforme ton corps avec mes programmes exclusifs !',
          abonnement_mode: false,
          abonnement_price: 0,
          photourl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
          followers: 890,
          content_count: 32
        }
      ];
      setCreators(sampleCreators);
      localStorage.setItem('bendza_creators', JSON.stringify(sampleCreators));
    }

    // Load content
    const savedContent = localStorage.getItem('bendza_content');
    if (savedContent) {
      setContent(JSON.parse(savedContent));
    }

    // Load transactions
    const savedTransactions = localStorage.getItem('bendza_transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }

    // Load messages
    const savedMessages = localStorage.getItem('bendza_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  const createCreatorProfile = (creatorData) => {
    const newCreator = {
      user_id: user.id,
      ...creatorData,
      created_at: new Date().toISOString(),
      followers: 0,
      content_count: 0
    };

    const updatedCreators = [...creators, newCreator];
    setCreators(updatedCreators);
    localStorage.setItem('bendza_creators', JSON.stringify(updatedCreators));
  };

  const updateCreatorProfile = (updates) => {
    const updatedCreators = creators.map(creator => 
      creator.user_id === user.id ? { ...creator, ...updates } : creator
    );
    setCreators(updatedCreators);
    localStorage.setItem('bendza_creators', JSON.stringify(updatedCreators));
  };

  const addContent = (contentData) => {
    const newContent = {
      id: Date.now().toString(),
      creator_id: user.id,
      ...contentData,
      created_at: new Date().toISOString()
    };

    const updatedContent = [...content, newContent];
    setContent(updatedContent);
    localStorage.setItem('bendza_content', JSON.stringify(updatedContent));

    // Update creator content count
    updateCreatorProfile({ content_count: (getCreatorProfile(user.id)?.content_count || 0) + 1 });
  };

  const addTransaction = (transactionData) => {
    const newTransaction = {
      id: Date.now().toString(),
      user_id: user.id,
      ...transactionData,
      created_at: new Date().toISOString()
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    localStorage.setItem('bendza_transactions', JSON.stringify(updatedTransactions));
  };

  const addMessage = (messageData) => {
    const newMessage = {
      id: Date.now().toString(),
      ...messageData,
      sent_at: new Date().toISOString()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('bendza_messages', JSON.stringify(updatedMessages));
  };

  const getCreatorProfile = (userId) => {
    return creators.find(creator => creator.user_id === userId);
  };

  const getCreatorContent = (creatorId) => {
    return content.filter(item => item.creator_id === creatorId);
  };

  const getUserTransactions = () => {
    return transactions.filter(transaction => transaction.user_id === user?.id);
  };

  const getCreatorTransactions = () => {
    return transactions.filter(transaction => transaction.creator_id === user?.id);
  };

  const getUserMessages = (otherUserId) => {
    if (!user) return [];
    return messages.filter(message => 
      (message.sender_id === user.id && message.receiver_id === otherUserId) ||
      (message.sender_id === otherUserId && message.receiver_id === user.id)
    ).sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
  };

  const getConversations = () => {
    if (!user) return [];
    
    const userMessages = messages.filter(message => 
      message.sender_id === user.id || message.receiver_id === user.id
    );

    const conversationMap = new Map();
    
    userMessages.forEach(message => {
      const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
      
      if (!conversationMap.has(otherUserId) || 
          new Date(message.sent_at) > new Date(conversationMap.get(otherUserId).sent_at)) {
        conversationMap.set(otherUserId, message);
      }
    });

    return Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.sent_at) - new Date(a.sent_at)
    );
  };

  const hasAccessToCreator = (creatorId) => {
    if (!user) return false;
    
    // Check if user has active subscription or has purchased content
    return transactions.some(transaction => 
      transaction.user_id === user.id && 
      transaction.creator_id === creatorId && 
      transaction.status === 'paid'
    );
  };

  const value = {
    creators,
    content,
    transactions,
    messages,
    createCreatorProfile,
    updateCreatorProfile,
    addContent,
    addTransaction,
    addMessage,
    getCreatorProfile,
    getCreatorContent,
    getUserTransactions,
    getCreatorTransactions,
    getUserMessages,
    getConversations,
    hasAccessToCreator
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
