
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
    const { user, userProfile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [content, setContent] = useState([]);
    const [contentLoading, setContentLoading] = useState(true);
    const [purchasedContent, setPurchasedContent] = useState(new Set());



    // Charger le contenu et les achats de l'utilisateur
    useEffect(() => {
        // Attendre que l'authentification soit stable
        if (authLoading) {
            return;
        }

        const loadData = async () => {
            setContentLoading(true);
            
            try {
                // Charger le contenu publié
                const { data: contentData, error: contentError } = await supabase
                    .from('content')
                    .select('*')
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
            } finally {
                setContentLoading(false);
            }
        };

        loadData();
    }, [user?.id, authLoading]);

    const handlePurchase = async (contentId, price) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            // Créer une transaction
            const { data: transaction, error: transactionError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    content_id: contentId,
                    creator_id: content.find(c => c.id === contentId)?.creator_id,
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

    if (authLoading || contentLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-white text-xl">Chargement du fil d'actualité...</div>
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

            {/* Header fixe */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <img alt="BENDZA logo" className="w-8 h-8" src="/logo.png" />
                            <h1 className="text-xl font-bold text-white">BENDZA</h1>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            {user ? (
                                <>
                                    {userProfile?.is_creator ? (
                                        <Link to="/dashboard">
                                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                                                <Plus className="w-4 h-4 mr-1" />
                                                Créer
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link to="/become-creator">
                                            <Button size="sm" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                                                Devenir créateur
                                            </Button>
                                        </Link>
                                    )}
                                    <Link to="/profile">
                                        <Button size="sm" variant="outline" className="border-gray-600">
                                            <User className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/login">
                                        <Button size="sm" variant="outline" className="border-gray-600">
                                            Se connecter
                                        </Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                                            S'inscrire
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Fil d'actualité */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                {content.length === 0 ? (
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
                        {user && userProfile?.is_creator && (
                            <Link to="/dashboard">
                                <Button className="bg-orange-500 hover:bg-orange-600">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Créer du contenu
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
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
                                            src={item.users?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.users?.name}`}
                                            alt={item.users?.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-white">{item.users?.name}</h3>
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
                                                className="w-full h-64 object-cover content-blur"
                                            />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="text-center">
                                                    <Lock className="w-16 h-16 text-white mx-auto mb-4" />
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
                                                >
                                                    <source src={item.url} type="video/mp4" />
                                                </video>
                                            ) : (
                                                <img
                                                    src={item.url || item.thumbnail_url}
                                                    alt={item.title}
                                                    className="w-full h-64 object-cover"
                                                />
                                            )}
                                            <div className="absolute top-2 right-2">
                                                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
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
                )}
            </div>
        </div>
    );
}

export default HomePage;
