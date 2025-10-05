
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

function CreatorDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
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

    const handleDeleteContent = async (contentId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) return;

        try {
            const { error } = await supabase
                .from('content')
                .delete()
                .eq('id', contentId);

            if (error) throw error;

            setContent(prev => prev.filter(item => item.id !== contentId));
            toast({
                title: "Contenu supprimé",
                description: "Le contenu a été supprimé avec succès",
            });
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast({
                title: "Erreur",
                description: "Impossible de supprimer le contenu",
                variant: "destructive"
            });
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

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Créateur</h1>
                        <p className="text-gray-400">Gérez votre contenu et vos revenus</p>
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-orange-500 hover:bg-orange-600"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer du contenu
                    </Button>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Contenus publiés</p>
                                <p className="text-2xl font-bold text-white">{stats.totalContent}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-orange-500" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Vues totales</p>
                                <p className="text-2xl font-bold text-white">{stats.totalViews}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Eye className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* Liste du contenu */}
                <div className="bg-gray-900 rounded-xl border border-gray-800">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-semibold text-white">Mes contenus</h2>
                        <p className="text-gray-400 text-sm">Gérez vos publications</p>
                    </div>

                    {content.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Plus className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Aucun contenu publié
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Commencez par créer votre premier contenu pour générer des revenus
                            </p>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-orange-500 hover:bg-orange-600"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Créer du contenu
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {content.map((item, index) => {
                                const Icon = getContentIcon(item.type);
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="p-6 hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                                    <Icon className="w-6 h-6 text-orange-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                                                        <span className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            {formatDate(item.created_at)}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            {item.views_count || 0} vues
                                                        </span>
                                                        <span className="text-orange-500 font-semibold">
                                                            {item.price} FCFA
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteContent(item.id)}
                                                    className="border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
        </div>
    );
}

export default CreatorDashboard;
  