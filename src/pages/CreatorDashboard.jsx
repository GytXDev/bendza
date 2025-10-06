
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { 
    Plus, 
    Eye, 
    Calendar,
    Edit,
    Trash2,
    Image,
    Play,
    FileText
} from 'lucide-react';
import CreateContentModal from '../components/CreateContentModal';
import EditContentModal from '../components/EditContentModal';
import ConfirmationModal from '../components/ConfirmationModal';

function CreatorDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contentToDelete, setContentToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [stats, setStats] = useState({
        totalContent: 0,
        totalViews: 0
    });

    useEffect(() => {
        fetchContent();
        fetchStats();
    }, [user]);

    const fetchContent = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('content')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContent(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement du contenu:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger votre contenu",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };


    const fetchStats = async () => {
        if (!user) return;

        try {
            // Statistiques du contenu
            const { data: contentData, error: contentError } = await supabase
                .from('content')
                .select('views_count')
                .eq('creator_id', user.id);

            if (contentError) throw contentError;

            const totalContent = contentData?.length || 0;
            const totalViews = contentData?.reduce((sum, item) => sum + (item.views_count || 0), 0) || 0;

            setStats({
                totalContent,
                totalViews
            });
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
        }
    };

    const handleEditContent = (contentItem) => {
        setSelectedContent(contentItem);
        setShowEditModal(true);
    };

    const handleDeleteContent = (contentId) => {
        const contentItem = content.find(c => c.id === contentId);
        if (!contentItem) return;

        setContentToDelete(contentItem);
        setShowDeleteModal(true);
    };

    const confirmDeleteContent = async () => {
        if (!contentToDelete) return;

        setDeleting(true);

        try {
            // Utiliser le service de suppression complète
            const { imageUploadService } = await import('../lib/imageUpload');
            const deletionResults = await imageUploadService.deleteContentCompletely(contentToDelete.id, contentToDelete.url);

            // La suppression n'est plus bloquée - continuer avec le traitement

            // Vérifier les résultats
            const hasErrors = deletionResults.errors.length > 0;
            const allSuccess = deletionResults.contentDeleted && 
                              deletionResults.transactionsDeleted && 
                              deletionResults.purchasesDeleted && 
                              deletionResults.mediaDeleted;

            if (allSuccess) {
                // Mettre à jour l'état local
                setContent(prev => prev.filter(item => item.id !== contentToDelete.id));
                
                toast({
                    title: "Contenu supprimé",
                    description: "Le contenu et toutes ses données associées ont été supprimés avec succès",
                });
            } else if (deletionResults.contentDeleted) {
                // Le contenu principal a été supprimé ou marqué comme supprimé
                setContent(prev => prev.filter(item => item.id !== contentToDelete.id));
                
                // Rafraîchir la liste pour s'assurer que les changements sont pris en compte
                await fetchContent();
                
                toast({
                    title: "Contenu supprimé",
                    description: "Le contenu a été supprimé. Certaines données associées peuvent encore exister.",
                    variant: hasErrors ? "destructive" : "default"
                });
            } else {
                // Vérifier si au moins les données associées ont été supprimées
                const partialSuccess = deletionResults.transactionsDeleted || 
                                     deletionResults.purchasesDeleted || 
                                     deletionResults.mediaDeleted || 
                                     deletionResults.storageDeleted;

                if (partialSuccess) {
                    // Au moins certaines données ont été supprimées
                    setContent(prev => prev.filter(item => item.id !== contentToDelete.id));
                    await fetchContent();
                    
                    toast({
                        title: "Suppression partielle",
                        description: "Certaines données ont été supprimées, mais le contenu principal pourrait encore exister.",
                        variant: "destructive"
                    });
                } else {
                    // Aucune suppression n'a réussi
                    console.error('Aucune suppression réussie:', deletionResults);
                    throw new Error('Impossible de supprimer le contenu. Vérifiez les logs pour plus de détails.');
                }
            }

            // Fermer le modal
            setShowDeleteModal(false);
            setContentToDelete(null);

        } catch (error) {
            console.error('Erreur lors de la suppression complète:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la suppression. Le contenu n'a pas été supprimé.",
                variant: "destructive"
            });
        } finally {
            setDeleting(false);
        }
    };


    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getContentIcon = (type) => {
        switch (type) {
            case 'video': return Play;
            case 'image': return Image;
            default: return FileText;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-white text-xl">Chargement du dashboard...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Helmet>
                <title>Dashboard Créateur - BENDZA</title>
                <meta name="description" content="Dashboard créateur BENDZA. Gérez votre contenu et vos revenus." />
            </Helmet>

            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 mt-16 md:mt-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Dashboard Créateur</h1>
                        <p className="text-gray-400 text-sm sm:text-base">Gérez votre contenu et vos revenus</p>
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer du contenu
                    </Button>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs sm:text-sm">Contenus publiés</p>
                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats.totalContent}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs sm:text-sm">Vues totales</p>
                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats.totalViews}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Liste du contenu */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl border border-gray-700">
                    <div className="p-4 sm:p-6 border-b border-gray-700">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Mes contenus</h2>
                        <p className="text-gray-400 text-xs sm:text-sm">Gérez vos publications</p>
                    </div>

                    {content.length === 0 ? (
                        <div className="p-8 sm:p-12 text-center">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <Plus className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                                Aucun contenu publié
                            </h3>
                            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">
                                Commencez par créer votre premier contenu pour générer des revenus
                            </p>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-orange-500 hover:bg-orange-600 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Créer du contenu
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-700">
                            {content.map((item, index) => {
                                const Icon = getContentIcon(item.type);
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="p-4 sm:p-6 hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                            <div className="flex items-center space-x-3 sm:space-x-4">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base truncate">{item.title}</h3>
                                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-xs sm:text-sm text-gray-400">
                                                        <span className="flex items-center">
                                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                            {formatDate(item.created_at)}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                            {item.views_count || 0} vues
                                                        </span>
                                                        <span className="text-orange-500 font-semibold">
                                                            {item.price} FCFA
                                                        </span>
                                                        <span className={`px-2 py-1 rounded-lg sm:rounded-xl text-xs font-medium ${
                                                            item.status === 'approved' 
                                                                ? 'bg-green-500/20 text-green-400' 
                                                                : item.status === 'rejected'
                                                                ? 'bg-red-500/20 text-red-400'
                                                                : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}>
                                                            {item.status === 'approved' ? 'Approuvé' : 
                                                             item.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 sm:space-x-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditContent(item)}
                                                    className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500 w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl"
                                                >
                                                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                    <span className="sm:hidden">Modifier</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteContent(item.id)}
                                                    className="border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-500 w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl"
                                                >
                                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                    <span className="sm:hidden">Supprimer</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de création de contenu */}
            <CreateContentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onContentCreated={fetchContent}
            />

            {/* Modal d'édition de contenu */}
            <EditContentModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedContent(null);
                }}
                content={selectedContent}
                onContentUpdated={fetchContent}
            />

            {/* Modal de confirmation de suppression */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setContentToDelete(null);
                }}
                onConfirm={confirmDeleteContent}
                title="Supprimer le contenu"
                message="Êtes-vous sûr de vouloir supprimer ce contenu ?"
                confirmText="Supprimer"
                cancelText="Annuler"
                type="danger"
                loading={deleting}
                details={[
                    "Le contenu et ses médias",
                    "Toutes les transactions associées",
                    "Tous les achats enregistrés",
                    "⚠️ Les payouts déjà effectués seront conservés"
                ]}
            />
        </div>
    );
}

export default CreatorDashboard;
  