// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { Eye, Play, Image, Plus, User, Lock, Unlock } from 'lucide-react';

function HomePage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    // Debug logs
    console.log('🏠 HomePage: user state:', user);
    console.log('🏠 HomePage: authLoading:', authLoading);
    
    // Effet pour détecter les changements d'utilisateur
    useEffect(() => {
        console.log('🏠 HomePage: User state changed:', user ? 'Connected' : 'Not connected');
        if (user) {
            console.log('🏠 HomePage: User details:', {
                id: user.id,
                email: user.email,
                name: user.name,
                is_creator: user.is_creator
            });
        }
    }, [user]);
    
    const [content, setContent] = useState([]);
    const [contentLoading, setContentLoading] = useState(true);
    const [purchasedContent, setPurchasedContent] = useState(new Set());
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // Fonction de déconnexion
    const handleSignOut = async () => {
        try {
            await signOut();
            toast({
                title: "Déconnexion réussie",
                description: "Vous avez été déconnecté avec succès"
            });
            navigate('/');
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            toast({
                title: "Erreur de déconnexion",
                description: "Une erreur s'est produite lors de la déconnexion",
                variant: "destructive"
            });
        }
    };

    // Charger le contenu et les achats de l'utilisateur
    useEffect(() => {
        const loadData = async () => {
            setContentLoading(true);
            setLoadingTimeout(false);
            
            // Timeout de 6 secondes
            const timeoutId = setTimeout(() => {
                setLoadingTimeout(true);
                setContentLoading(false);
                toast({
                    title: "Chargement lent",
                    description: "Le chargement prend plus de temps que prévu. Vérifiez votre connexion.",
                    variant: "destructive"
                });
            }, 6000);
            
            try {
                // Charger le contenu publié avec les informations des créateurs
                const { data: contentData, error: contentError } = await supabase
                    .from('content')
                    .select(`
                        *,
                        users:creator_id (
                            id,
                            name,
                            email,
                            photourl,
                            is_creator
                        )
                    `)
                    .eq('is_published', true)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (contentError) {
                    console.error('Error loading content:', contentError);
                    setContent([]);
                } else {
                    setContent(contentData || []);
                }

                // Charger les achats si utilisateur connecté
                if (user?.id) {
                    try {
                        const { data: purchases, error: purchasesError } = await supabase
                            .from('purchases')
                            .select('content_id')
                            .eq('user_id', user.id);

                        if (!purchasesError) {
                            const purchasedIds = new Set(purchases?.map(p => p.content_id) || []);
                            setPurchasedContent(purchasedIds);
                        }
                    } catch (error) {
                        console.error('Error loading purchases:', error);
                        // Erreur silencieuse pour les achats
                    }
                }
            } catch (error) {
                console.error('Error in loadData:', error);
                setContent([]);
                toast({
                    title: "Erreur de chargement",
                    description: "Impossible de charger le contenu. Vérifiez votre connexion.",
                    variant: "destructive"
                });
            } finally {
                clearTimeout(timeoutId);
                setContentLoading(false);
            }
        };

        loadData();
    }, [user?.id, toast]);

    const handlePurchase = async (contentId, price) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const contentItem = content.find(c => c.id === contentId);
            if (!contentItem) {
                throw new Error('Contenu non trouvé');
            }

            // Créer une transaction
            const { data: transaction, error: transactionError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    content_id: contentId,
                    creator_id: contentItem.creator_id,
                    amount: price,
                    type: 'achat_unitaire',
                    payment_method: 'mobile_money',
                    status: 'pending'
                })
                .select()
                .single();

            if (transactionError) throw transactionError;

            // Simuler un paiement réussi (en V1, on assume que le paiement est toujours réussi)
            const { error: updateError } = await supabase
                .from('transactions')
                .update({ status: 'paid' })
                .eq('id', transaction.id);

            if (updateError) throw updateError;

            // Créer l'achat
            const { error: purchaseError } = await supabase
                .from('purchases')
                .insert({
                    user_id: user.id,
                    content_id: contentId,
                    transaction_id: transaction.id,
                    amount_paid: price
                });

            if (purchaseError) throw purchaseError;

            // Mettre à jour l'état local
            setPurchasedContent(prev => new Set([...prev, contentId]));

            toast({
                title: "Achat réussi !",
                description: "Vous pouvez maintenant accéder au contenu",
            });

        } catch (error) {
            console.error('Erreur lors de l\'achat:', error);
            toast({
                title: "Erreur",
                description: "Impossible de finaliser l'achat",
                variant: "destructive"
            });
        }
    };

    const formatPrice = (price) => {
        return `${price} FCFA`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    // Afficher un loader pendant le chargement de l'authentification
    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-white text-xl">Chargement...</div>
                </div>
            </div>
        );
    }

    if (contentLoading && !loadingTimeout) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-white text-xl">Chargement du fil d'actualité...</div>
                </div>
            </div>
        );
    }

    // Afficher un message d'erreur seulement si timeout
    if (loadingTimeout) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Image className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                        Chargement interrompu
                    </h3>
                    <p className="text-gray-400 mb-6">
                        Le chargement a pris trop de temps. Vérifiez votre connexion internet et réessayez.
                    </p>
                    <div className="space-y-3">
                        <Button 
                            onClick={() => window.location.reload()} 
                            className="bg-orange-500 hover:bg-orange-600 w-full"
                        >
                            Réessayer
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Helmet>
                <title>BENDZA - Fil d'actualité</title>
                <meta name="description" content="Découvrez les derniers contenus exclusifs sur BENDZA" />
            </Helmet>

            {/* Fil d'actualité */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                {content.length > 0 ? (
                    <div className="space-y-6">
                        {content.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-200"
                            >
                                {/* En-tête du post */}
                                <div className="p-4 border-b border-gray-800">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={item.users?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.users?.name || 'user'}`}
                                            alt={item.users?.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-white">{item.users?.name || 'Créateur'}</h3>
                                                <span className="text-gray-400 text-sm">•</span>
                                                <span className="text-gray-400 text-sm">{formatDate(item.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-orange-500 font-bold">{formatPrice(item.price)}</span>
                                            {item.price > 0 && (
                                                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                                                    <Lock className="w-3 h-3 text-orange-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <h2 className="text-lg font-semibold text-white mb-2">{item.title}</h2>
                                        {item.description && (
                                            <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Contenu média avec effet flou */}
                                <div className="relative">
                                    {!purchasedContent.has(item.id) && item.price > 0 ? (
                                        /* Contenu flou pour contenu non payé */
                                        <div className="relative">
                                            <img
                                                src={item.thumbnail_url || '/placeholder.jpg'}
                                                alt={item.title}
                                                className="w-full h-64 object-cover filter blur-md"
                                            />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <div className="text-center p-4">
                                                    <Lock className="w-12 h-12 text-white mx-auto mb-3" />
                                                    <p className="text-white font-bold text-lg mb-2">Contenu exclusif</p>
                                                    <p className="text-gray-300 text-sm mb-4">Débloquez pour voir le contenu complet</p>
                                                    <Button
                                                        onClick={() => handlePurchase(item.id, item.price)}
                                                        className="bg-orange-500 hover:bg-orange-600"
                                                    >
                                                        <Lock className="w-4 h-4 mr-2" />
                                                        Débloquer pour {formatPrice(item.price)}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Contenu débloqué ou gratuit */
                                        <div className="relative">
                                            {item.type === 'video' ? (
                                                <video
                                                    className="w-full h-64 object-cover"
                                                    poster={item.thumbnail_url}
                                                    controls
                                                    onPlay={() => {
                                                        // Incrémenter le compteur de vues
                                                        if (user?.id) {
                                                            supabase
                                                                .from('content')
                                                                .update({ 
                                                                    views_count: (item.views_count || 0) + 1 
                                                                })
                                                                .eq('id', item.id)
                                                                .then(({ error }) => {
                                                                    if (error) console.error('Error updating view count:', error);
                                                                });
                                                        }
                                                    }}
                                                >
                                                    <source src={item.url} type="video/mp4" />
                                                    Votre navigateur ne supporte pas la lecture de vidéos.
                                                </video>
                                            ) : (
                                                <img
                                                    src={item.url || item.thumbnail_url || '/placeholder.jpg'}
                                                    alt={item.title}
                                                    className="w-full h-64 object-cover"
                                                />
                                            )}
                                            <div className="absolute top-2 right-2">
                                                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                                    <Unlock className="w-3 h-3 inline mr-1" />
                                                    {purchasedContent.has(item.id) ? 'Acheté' : 'Gratuit'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Pied du post */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between text-sm text-gray-400">
                                        <div className="flex items-center space-x-4">
                                            <span className="flex items-center">
                                                <Eye className="w-4 h-4 mr-1" />
                                                {item.views_count || 0} vues
                                            </span>
                                        </div>
                                        {purchasedContent.has(item.id) && (
                                            <div className="flex items-center text-green-500">
                                                <Unlock className="w-4 h-4 mr-1" />
                                                Débloqué
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Image className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">
                            Aucun contenu disponible
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Revenez plus tard pour découvrir de nouveaux contenus exclusifs
                        </p>
                        <div className="space-y-3">
                            <Button 
                                onClick={() => window.location.reload()} 
                                className="bg-orange-500 hover:bg-orange-600"
                            >
                                Réessayer
                            </Button>
                            {user && user?.is_creator && (
                                <Link to="/dashboard" className="block">
                                    <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Créer du contenu
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

export default HomePage;