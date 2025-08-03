
import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { MessageCircle, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Messages = () => {
  const { user } = useAuth();

  // Données temporaires en attendant l'implémentation complète
  const conversations = [];
  const creators = [];

  const handleOpenConversation = () => {
    toast({
      title: "🚧 Cette fonctionnalité n'est pas encore implémentée",
      description: "Vous pouvez la demander dans votre prochain prompt ! 🚀",
    });
  };

  const getCreatorInfo = (userId) => {
    const creator = creators.find(c => c.user_id === userId);
    return creator || { name: 'Utilisateur inconnu', photourl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}` };
  };

  return (
    <div className="space-y-8 pt-16 md:pt-0">
      <Helmet>
        <title>Messages - BENDZA</title>
        <meta name="description" content="Consultez vos conversations avec les créateurs" />
      </Helmet>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Messages
        </h1>
        <p className="text-lg text-gray-300">
          Communiquez avec vos créateurs préférés
        </p>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bendza-glass rounded-xl p-6"
      >
        <div className="flex items-center space-x-3">
          <Lock className="text-[#FF5A00]" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-white">Messagerie privée</h2>
            <p className="text-gray-400">
              Vous pouvez envoyer des messages aux créateurs auxquels vous êtes abonné ou dont vous avez acheté du contenu
            </p>
          </div>
        </div>
      </motion.div>

      {/* Conversations */}
      {conversations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Aucune conversation</h3>
          <p className="text-gray-400 mb-6">
            Vous n'avez pas encore de conversations avec des créateurs
          </p>
          <p className="text-sm text-gray-500">
            Abonnez-vous à un créateur ou achetez du contenu pour pouvoir lui envoyer des messages
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {conversations.map((conversation, index) => {
            const otherUserId = conversation.sender_id === user?.id ? conversation.receiver_id : conversation.sender_id;
            const creatorInfo = getCreatorInfo(otherUserId);

            return (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <Card className="hover:border-[#FF5A00] transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={creatorInfo.photourl}
                          alt={creatorInfo.name}
                          className="w-12 h-12 rounded-full border-2 border-[#FF5A00]"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {creatorInfo.name}
                          </h3>
                          <p className="text-sm text-gray-400 line-clamp-1">
                            {conversation.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(conversation.sent_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleOpenConversation}
                        className="bendza-button"
                      >
                        Ouvrir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default Messages;
