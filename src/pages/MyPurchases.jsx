import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { 
  ShoppingBag, 
  Eye, 
  Calendar,
  User,
  Play,
  Image,
  FileText,
  Video,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import CustomImagePlayer from '../components/CustomImagePlayer';

function MyPurchases() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          amount_paid,
          purchased_at,
          content:content_id (
            id,
            title,
            description,
            type,
            price,
            url,
            thumbnail_url,
            creator_id,
            created_at,
            users:creator_id (
              id,
              name,
              photourl
            )
          )
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPurchases(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger vos achats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewContent = (purchase) => {
    setSelectedPurchase(purchase);
    setShowContentModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-green-500" />;
      case 'text':
        return <FileText className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mes Achats - Bendza</title>
        <meta name="description" content="Consultez vos achats de contenu sur Bendza" />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 mt-16 md:mt-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Mes Achats</h1>
              <p className="text-gray-400 text-sm sm:text-base">Consultez vos achats de contenu</p>
            </div>
            <div className="text-xs sm:text-sm text-gray-400">
              {purchases.length} achat{purchases.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Liste des achats */}
          {purchases.length === 0 ? (
            <div className="bg-gray-900/50 rounded-xl p-8 text-center border border-gray-700">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-lg mb-2">Aucun achat effectué</p>
              <p className="text-gray-500 text-sm">Vos achats de contenu apparaîtront ici</p>
              <Button
                onClick={() => navigate('/')}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Découvrir du contenu
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {purchases.map((purchase, index) => (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200"
                >
                  {/* Header de la carte */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getContentIcon(purchase.content?.type)}
                      <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-2">
                          {purchase.content?.title || 'Contenu supprimé'}
                        </h3>
                        <p className="text-gray-400 text-xs">
                          par {purchase.content?.users?.name || 'Créateur inconnu'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-500 font-bold text-sm sm:text-base">
                        {formatPrice(purchase.amount_paid)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {formatDate(purchase.purchased_at)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {purchase.content?.description && (
                    <p className="text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2">
                      {purchase.content.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Acheté</span>
                    </div>
                    
                    {purchase.content && (
                      <Button
                        onClick={() => handleViewContent(purchase)}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de visualisation du contenu */}
        {showContentModal && selectedPurchase && selectedPurchase.content && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header du modal */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                  <h2 className="text-white font-bold text-lg">
                    {selectedPurchase.content.title}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    par {selectedPurchase.content.users?.name}
                  </p>
                </div>
                <Button
                  onClick={() => setShowContentModal(false)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Fermer
                </Button>
              </div>

              {/* Contenu du modal */}
              <div className="p-4">
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-4">
                  {selectedPurchase.content.type === 'video' ? (
                    <CustomVideoPlayer
                      src={selectedPurchase.content.url}
                      poster={selectedPurchase.content.thumbnail_url}
                      isPurchased={true}
                      contentId={selectedPurchase.content.id}
                      creatorId={selectedPurchase.content.creator_id}
                      className="w-full h-full"
                    />
                  ) : selectedPurchase.content.type === 'image' ? (
                    <CustomImagePlayer
                      src={selectedPurchase.content.url}
                      alt={selectedPurchase.content.title}
                      isPurchased={true}
                      contentId={selectedPurchase.content.id}
                      creatorId={selectedPurchase.content.creator_id}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-8">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-white text-xl font-bold mb-2">
                          {selectedPurchase.content.title}
                        </h3>
                        <p className="text-gray-400">
                          {selectedPurchase.content.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informations de l'achat */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Détails de l'achat</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Montant payé</p>
                      <p className="text-white font-semibold">
                        {formatPrice(selectedPurchase.amount_paid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Date d'achat</p>
                      <p className="text-white">
                        {formatDate(selectedPurchase.purchased_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}

export default MyPurchases;
