import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { 
    CheckCircle, 
    XCircle, 
    Eye, 
    Clock, 
    User, 
    Calendar,
    Image,
    Video,
    FileText,
    AlertTriangle
} from 'lucide-react';

function ModerationPanel() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [pendingContent, setPendingContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContent, setSelectedContent] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Vérifier si l'utilisateur est admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            toast({
                title: "Accès refusé",
                description: "Vous n'avez pas les permissions nécessaires",
                variant: "destructive"
            });
        }
    }, [user, toast]);

    // Charger le contenu en attente
    const loadPendingContent = async () => {
        try {
            const { data, error } = await supabase
                .from('content')
                .select(`
                    *,
                    users:creator_id (
                        id,
                        name,
                        email,
                        photourl
                    )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingContent(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement du contenu en attente:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger le contenu en attente",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            loadPendingContent();
        }
    }, [user]);

    // Approuver un contenu
    const approveContent = async (contentId) => {
        try {
            const { data, error } = await supabase.rpc('approve_content', {
                p_content_id: contentId,
                p_admin_id: user.id
            });

            if (error) {
                console.error('Erreur RPC:', error);
                throw error;
            }

            // Vérifier la réponse de la fonction RPC
            if (data && !data.success) {
                throw new Error(data.error || 'Erreur lors de l\'approbation');
            }

            toast({
                title: "Contenu approuvé",
                description: "Le contenu a été approuvé et est maintenant visible",
            });

            // Recharger la liste
            loadPendingContent();
        } catch (error) {
            console.error('Erreur lors de l\'approbation:', error);
            toast({
                title: "Erreur",
                description: error.message || "Impossible d'approuver le contenu",
                variant: "destructive"
            });
        }
    };

    // Rejeter un contenu
    const rejectContent = async (contentId) => {
        if (!rejectionReason.trim()) {
            toast({
                title: "Raison requise",
                description: "Veuillez indiquer une raison pour le rejet",
                variant: "destructive"
            });
            return;
        }

        try {
            // Utiliser la fonction RPC pour rejeter le contenu
            const { data, error } = await supabase.rpc('reject_content', {
                p_content_id: contentId,
                p_admin_id: user.id,
                p_reason: rejectionReason
            });

            if (error) {
                console.error('Erreur RPC:', error);
                throw error;
            }

            // Vérifier la réponse de la fonction RPC
            if (data && !data.success) {
                throw new Error(data.error || 'Erreur lors du rejet');
            }

            // Créer une notification pour le créateur
            const contentItem = pendingContent.find(c => c.id === contentId);
            if (contentItem) {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: contentItem.creator_id,
                        type: 'error', // Utiliser un type existant
                        title: 'Contenu rejeté',
                        message: `Votre contenu "${contentItem.title || 'Sans titre'}" a été rejeté. Raison: ${rejectionReason}`,
                        action_url: null
                    });
            }

            toast({
                title: "Contenu supprimé",
                description: "Le contenu a été rejeté et supprimé de la plateforme. Le créateur a été notifié.",
            });

            // Recharger la liste
            loadPendingContent();
            setSelectedContent(null);
            setRejectionReason('');
        } catch (error) {
            console.error('Erreur lors du rejet:', error);
            toast({
                title: "Erreur",
                description: "Impossible de rejeter le contenu",
                variant: "destructive"
            });
        }
    };

    const getContentIcon = (type) => {
        switch (type) {
            case 'image':
                return <Image className="w-5 h-5" />;
            case 'video':
                return <Video className="w-5 h-5" />;
            case 'text':
                return <FileText className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Accès refusé</h1>
                    <p className="text-gray-400">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-white text-xl">Chargement du panneau de modération...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Helmet>
                <title>Panneau de Modération - BENDZA</title>
                <meta name="description" content="Panneau de modération pour les administrateurs BENDZA" />
            </Helmet>

            <div className="max-w-6xl mx-auto px-4 py-4 md:py-8 mt-12 md:mt-0">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Panneau de Modération</h1>
                    <p className="text-gray-400 text-sm md:text-base">
                        {pendingContent.length} contenu(s) en attente de modération
                    </p>
                </div>

                {/* Liste du contenu en attente */}
                {pendingContent.length > 0 ? (
                    <div className="space-y-4">
                        {pendingContent.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden"
                            >
                                {/* Header du contenu */}
                                <div className="p-3 md:p-4 border-b border-gray-800/50">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                                        <div className="flex items-center space-x-2 md:space-x-3">
                                            {getContentIcon(item.type)}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-semibold text-sm md:text-base truncate">{item.title || 'Sans titre'}</h3>
                                                <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-4 text-xs md:text-sm text-gray-400">
                                                    <div className="flex items-center space-x-1">
                                                        <User className="w-3 h-3 md:w-4 md:h-4" />
                                                        <span>@{item.users?.name || 'Utilisateur'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                                        <span>{formatDate(item.created_at)}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                                        <span>En attente</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-orange-500 font-semibold text-sm md:text-base">
                                            {item.price > 0 ? `${item.price} FCFA` : 'Gratuit'}
                                        </div>
                                    </div>
                                </div>

                                {/* Aperçu du contenu */}
                                <div className="p-3 md:p-4">
                                    {item.description && (
                                        <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">{item.description}</p>
                                    )}
                                    
                                    {/* Aperçu du média */}
                                    <div className="mb-3 md:mb-4">
                                        {/* Debug logs */}
                                        {console.log('ModerationPanel: Media debug:', {
                                            id: item.id,
                                            type: item.type,
                                            url: item.url,
                                            title: item.title,
                                            url_length: item.url?.length || 0
                                        })}
                                        
                                        {item.type === 'image' && (
                                            <img 
                                                src={item.url} 
                                                alt={item.title}
                                                className="w-full max-w-sm md:max-w-xs max-h-32 md:max-h-48 object-cover rounded-lg"
                                            />
                                        )}
                                        {item.type === 'video' && (
                                            <div className="relative">
                                                {item.url ? (
                                                    <video 
                                                        src={item.url}
                                                        poster={item.url}
                                                        controls
                                                        preload="metadata"
                                                        className="w-full max-w-sm md:max-w-xs max-h-32 md:max-h-48 rounded-lg bg-black"
                                                        onLoadStart={() => console.log('Video load started:', item.url)}
                                                        onLoadedData={() => console.log('Video data loaded:', item.url)}
                                                        onError={(e) => {
                                                            console.error('❌ Video load error:', {
                                                                url: item.url,
                                                                error: e.target.error,
                                                                networkState: e.target.networkState,
                                                                readyState: e.target.readyState
                                                            });
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling.style.display = 'flex';
                                                        }}
                                                    >
                                                        <source src={item.url} type="video/mp4" />
                                                        Votre navigateur ne supporte pas la lecture de vidéos.
                                                    </video>
                                                ) : null}
                                                
                                                <div 
                                                    className="w-full max-w-sm md:max-w-xs max-h-32 md:max-h-48 rounded-lg bg-gray-800 flex items-center justify-center"
                                                    style={{ display: item.url ? 'none' : 'flex' }}
                                                >
                                                    <div className="text-center text-gray-400">
                                                        <Video className="w-8 h-8 mx-auto mb-2" />
                                                        <p className="text-sm">
                                                            {item.url ? 'Erreur de chargement' : 'Vidéo non disponible'}
                                                        </p>
                                                        {item.url && (
                                                            <p className="text-xs mt-1 text-gray-500">
                                                                URL: {item.url}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {item.type === 'text' && (
                                            <div className="bg-gray-800 p-3 md:p-4 rounded-lg max-w-sm md:max-w-xs">
                                                <p className="text-white text-sm md:text-base">{item.url}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions de modération */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                        <Button
                                            onClick={() => approveContent(item.id)}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm md:text-base flex-1 sm:flex-none"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approuver
                                        </Button>
                                        <Button
                                            onClick={() => setSelectedContent(item)}
                                            variant="outline"
                                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-3 md:px-4 py-2 rounded-lg text-sm md:text-base flex-1 sm:flex-none"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Rejeter
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Aucun contenu en attente
                        </h3>
                        <p className="text-gray-400">
                            Tous les contenus ont été modérés. Revenez plus tard pour de nouveaux contenus.
                        </p>
                    </div>
                )}

                {/* Modal de rejet */}
                {selectedContent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-2xl p-4 md:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">
                                Rejeter le contenu
                            </h3>
                            <p className="text-gray-400 mb-3 md:mb-4 text-sm md:text-base">
                                Veuillez indiquer la raison du rejet pour informer le créateur.
                            </p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Ex: Contenu inapproprié, qualité insuffisante, violation des règles..."
                                className="w-full h-20 md:h-24 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 resize-none text-sm md:text-base"
                            />
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                                <Button
                                    onClick={() => {
                                        setSelectedContent(null);
                                        setRejectionReason('');
                                    }}
                                    variant="outline"
                                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 text-sm md:text-base"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={() => rejectContent(selectedContent.id)}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm md:text-base"
                                >
                                    Rejeter
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ModerationPanel;
