// src/pages/HomePage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { Eye, Play, Image, Plus, User, Lock, Unlock, Video, FileText, X, MapPin, Calendar, MessageCircle, RefreshCw } from 'lucide-react';
import { fusionPayService } from '../lib/fusionpay';
import ContentPaymentModal from '../components/ContentPaymentModal';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import CustomImagePlayer from '../components/CustomImagePlayer';

function HomePage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    // Effet pour détecter les changements d'utilisateur
    useEffect(() => {
        // User state change detection
    }, [user]);
    
    const [content, setContent] = useState([]);
    const [contentLoading, setContentLoading] = useState(true);
    const [purchasedContent, setPurchasedContent] = useState(new Set());
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    const [showInfoBanner, setShowInfoBanner] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);

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
                .eq('status', 'approved') // Seulement les contenus approuvés
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
            setRefreshing(false);
            }
        };

    useEffect(() => {
        loadData();
    }, [user?.id, toast]);



    const handlePurchase = async (contentId, price) => {
        if (!user) {
            navigate('/login');
            return;
        }

        const contentItem = content.find(c => c.id === contentId);
        if (!contentItem) {
            toast({
                title: "Erreur",
                description: "Contenu non trouvé",
                variant: "destructive"
            });
            return;
        }

        // Ouvrir le modal de paiement
        setSelectedContent({
            id: contentId,
            title: contentItem.title || 'Contenu exclusif',
            price: price
        });
        setShowPaymentModal(true);
    };

    const handlePaymentConfirm = async (mobileNumber) => {
        if (!selectedContent) return;

        setProcessingPayment(true);

        try {
            // Préparer les données de paiement pour FusionPay
            const paymentData = {
                userId: user.id,
                userEmail: user.email,
                userName: user.name || user.email.split('@')[0],
                userPhone: mobileNumber,
                amount: selectedContent.price,
                type: 'content_purchase',
                contentId: selectedContent.id,
                contentTitle: selectedContent.title
            };


            // Initier le paiement via FusionPay
            const paymentResult = await fusionPayService.initiateCreatorPayment(paymentData);

            if (paymentResult.success && paymentResult.paymentUrl) {
                toast({
                    title: "Redirection vers le paiement",
                    description: "Vous allez être redirigé vers la page de paiement sécurisée",
                });

                // Fermer le modal
                setShowPaymentModal(false);
                setSelectedContent(null);

                // Rediriger vers FusionPay
                setTimeout(() => {
                    fusionPayService.redirectToPayment(paymentResult.paymentUrl);
                }, 1000);

            } else {
                throw new Error(paymentResult.error || 'Erreur lors de l\'initiation du paiement');
            }

        } catch (error) {
            console.error('❌ HomePage: Payment initiation failed:', error);
            toast({
                title: "Erreur de paiement",
                description: error.message || "Impossible d'initier le paiement",
                variant: "destructive"
            });
        } finally {
            setProcessingPayment(false);
        }
    };

    // Nouvelle fonction pour gérer la vue d'un contenu (paiement unique)
    const handleViewContent = async (contentId, price) => {
        try {
            // Si c'est un contenu gratuit, l'utilisateur peut y accéder même sans être connecté
            if (price === 0) {
                setPurchasedContent(prev => new Set([...prev, contentId]));
                
                // Enregistrer la vue seulement si l'utilisateur est connecté
                if (user?.id) {
                    const { error } = await supabase.rpc('record_view', {
                        p_user_id: user.id,
                        p_content_id: contentId
                    });
                    
                    if (!error) {
                        toast({
                            title: "Contenu gratuit !",
                            description: "Vous pouvez maintenant accéder au contenu",
                        });
                    }
                }
                return;
            }

            // Pour les contenus payants, l'utilisateur doit être connecté
            if (!user) {
                navigate('/login');
                return;
            }

            // Vérifier si l'utilisateur est le créateur du contenu
            const contentItem = content.find(c => c.id === contentId);
            if (contentItem && contentItem.creator_id === user.id) {
                // Le créateur peut voir son propre contenu gratuitement
                setPurchasedContent(prev => new Set([...prev, contentId]));
                return;
            }

            // Vérifier si l'utilisateur a déjà payé pour ce contenu
            if (purchasedContent.has(contentId)) {
                return;
            }

            // Si c'est un contenu payant, déclencher le paiement via FusionPay
            await handlePurchase(contentId, price);

        } catch (error) {
            console.error('Erreur lors de la vue du contenu:', error);
            toast({
                title: "Erreur",
                description: "Impossible d'accéder au contenu",
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

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        toast({
            title: "Actualisé",
            description: "Votre fil d'actualité a été mis à jour"
        });
    };

    // Afficher un loader pendant le chargement de l'authentification
    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white text-lg"
                    >
                        Chargement de votre fil d'actualité...
                    </motion.p>
                </div>
            </div>
        );
    }

    if (contentLoading && !loadingTimeout) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white text-lg"
                    >
                        Chargement du fil d'actualité...
                    </motion.p>
                </div>
            </div>
        );
    }

    // Afficher un message d'erreur seulement si timeout
    if (loadingTimeout) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700"
                    >
                        <Image className="w-12 h-12 text-gray-400" />
                    </motion.div>
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-semibold text-white mb-3"
                    >
                        Chargement interrompu
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 mb-6"
                    >
                        Le chargement a pris trop de temps. Vérifiez votre connexion internet et réessayez.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3"
                    >
                        <Button 
                            onClick={() => window.location.reload()} 
                            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white w-full py-3 rounded-xl font-semibold"
                        >
                            Réessayer
                        </Button>
                    </motion.div>
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

            {/* Bandeau d'information sur la vérification */}
            {showInfoBanner && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-r from-gray-900/80 to-gray-800/60 backdrop-blur-md border-b border-white/10"
                >
                    <div className="max-w-sm mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-gray-300 text-xs font-medium">
                                    Contenus vérifiés et sécurisés
                                </p>
                            </div>
                            <button
                                onClick={() => setShowInfoBanner(false)}
                                className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
                            >
                                <X className="w-3 h-3 text-gray-300" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            

            {/* Fil d'actualité format 9:16 */}
            <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto mt-8 md:mt-4 px-4 pb-8">
                {content.length > 0 ? (
                    <div className="space-y-6">
                        {content.map((item, index) => {
                            return (
                                <motion.article
                                key={item.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 aspect-[9/16] md:aspect-[4/5] lg:aspect-[3/4] max-h-[80vh] flex flex-col group"
                            >
                                    {/* Header du post - Informations créateur */}
                                    <div className="p-3 md:p-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-900/40 to-transparent">
                                        <div className="flex items-center space-x-2 md:space-x-3">
                                            <motion.div whileHover={{ scale: 1.1 }} className="relative">
                                        <img
                                            src={item.users?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.users?.name || 'user'}`}
                                            alt={item.users?.name}
                                                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-orange-500/50 shadow-lg"
                                                />
                                                {item.users?.is_creator && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                                                        <span className="text-xs text-white font-bold">✓</span>
                                            </div>
                                                )}
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2">
                                                    <p className="font-semibold text-white text-xs md:text-sm bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                                                        @{item.users?.name || 'utilisateur'}
                                                    </p>
                                                    <div className="flex items-center space-x-1 text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{formatDate(item.created_at)}</span>
                                        </div>
                                                </div>
                                            </div>
                                    </div>
                                </div>

                                    {/* Contenu média */}
                                    <div className="relative flex-1 overflow-hidden">
                                        {item.type === 'image' && (
                                            <CustomImagePlayer
                                                src={item.url || 'https://picsum.photos/400/600?random=' + item.id}
                                                alt={item.title}
                                                isPurchased={purchasedContent.has(item.id) || item.price === 0}
                                                onViewContent={() => {
                                                    if (!purchasedContent.has(item.id)) {
                                                        handleViewContent(item.id, item.price);
                                                    }
                                                }}
                                                blurEffect={!purchasedContent.has(item.id) && item.price > 0}
                                                className="w-full h-full"
                                            />
                                        )}
                                        {item.type === 'video' && (
                                            <CustomVideoPlayer
                                                src={item.url}
                                                poster={item.url}
                                                isPurchased={purchasedContent.has(item.id) || item.price === 0}
                                                onPlay={() => {
                                                    if (!purchasedContent.has(item.id)) {
                                                        handleViewContent(item.id, item.price);
                                                    }
                                                }}
                                                onViewContent={() => {
                                                    if (!purchasedContent.has(item.id)) {
                                                        handleViewContent(item.id, item.price);
                                                    }
                                                }}
                                                blurEffect={!purchasedContent.has(item.id) && item.price > 0}
                                                className="w-full h-full"
                                            />
                                        )}
                                        {item.type === 'text' && (
                                            <div className={`w-full h-full flex items-center justify-center p-6 ${!purchasedContent.has(item.id) && item.price > 0 ? 'blur-md' : ''}`}>
                                                <div className="text-center">
                                                     <h3 className="text-white text-lg font-bold mb-3">{item.title}</h3>
                                                     <p className="text-white text-sm leading-relaxed">{item.url}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Overlay de verrouillage pour contenu payant uniquement */}
                                        {!purchasedContent.has(item.id) && item.price > 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-[1px]"></div>
                                                
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-center pointer-events-auto relative z-10 p-6 bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-orange-500/30 shadow-2xl mx-4"
                                                >
                                                    <motion.div
                                                        animate={{ 
                                                            scale: [1, 1.2, 1],
                                                            rotate: [0, 5, -5, 0]
                                                        }}
                                                        transition={{ 
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut"
                                                        }}
                                                        className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-orange-500/50 shadow-lg"
                                                    >
                                                        <Lock className="w-10 h-10 text-orange-400" />
                                                    </motion.div>
                                                    
                                                   
                                                    
                                                    <motion.div
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                         <Button 
                                                             onClick={() => handlePurchase(item.id, item.price)}
                                                             disabled={processingPayment}
                                                             className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-6 py-2 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                         >
                                                             {processingPayment ? (
                                                                 <>
                                                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                                     Traitement...
                                                                 </>
                                                             ) : (
                                                                 `${formatPrice(item.price)} - Débloquer`
                                                             )}
                                                         </Button>
                                                    </motion.div>
                                                    
                                                    
                                                </motion.div>
                                        </div>
                                    )}
                                </div>

                                    {/* Footer du post - Titre et statistiques */}
                                    <div className="p-3 md:p-4 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-sm">
                                         {item.title && (
                                             <h3 className="text-white text-xs md:text-sm font-semibold mb-1 line-clamp-2 group-hover:text-orange-200 transition-colors">
                                                 {item.title}
                                             </h3>
                                         )}
                                         {item.description && item.description !== 'Bendza : crée, publie, encaisse.' && (
                                             <p className="text-gray-300 text-xs leading-relaxed mb-2 line-clamp-2">
                                                 {item.description}
                                             </p>
                                         )}
                                        
                                        {/* Statistiques */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
                                            <div className="flex items-center space-x-2 md:space-x-4 text-gray-400">
                                                <div className="flex items-center space-x-1">
                                                     <Eye className="w-3 h-3" />
                                                     <span className="text-xs font-medium">{item.views_count || 0}</span>
                                                 </div>
                                                 
                                              </div>
                                            
                                            {/* Statut d'accès */}
                                            {purchasedContent.has(item.id) || item.price === 0 ? (
                                                 <motion.div
                                                     initial={{ opacity: 0, scale: 0.8 }}
                                                     animate={{ opacity: 1, scale: 1 }}
                                                     className={`flex items-center space-x-1 px-2 py-1 rounded-full border ${
                                                         item.price === 0 
                                                             ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                                                             : 'bg-green-500/20 text-green-400 border-green-500/30'
                                                     }`}
                                                 >
                                                     {item.price === 0 ? (
                                                         <>
                                                         <Unlock className="w-2.5 h-2.5" />
                                                         <span className="text-xs font-semibold hidden md:inline">Accès autorisé</span>
                                                         <span className="text-xs font-semibold md:hidden">✓</span>
                                                     </>
                                                     ) : (
                                                         <>
                                                             <Unlock className="w-2.5 h-2.5" />
                                                             <span className="text-xs font-semibold hidden md:inline">Accès autorisé</span>
                                                             <span className="text-xs font-semibold md:hidden">✓</span>
                                                         </>
                                                     )}
                                                 </motion.div>
                                             ) : (
                                                 <div className="flex items-center space-x-1 bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full border border-orange-500/30">
                                                     <Lock className="w-2.5 h-2.5" />
                                                     <span className="text-xs font-semibold hidden md:inline">Premium</span>
                                                 </div>
                                             )}
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-md mx-auto"
                        >
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-700 shadow-2xl">
                                <Image className="w-12 h-12 text-orange-500" />
                            </div>
                             <h3 className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                                 Aucun contenu disponible
                             </h3>
                             <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                                 Soyez le premier à partager du contenu exclusif sur BENDZA
                             </p>
                            <div className="space-y-3">
                                 <Button 
                                     onClick={handleRefresh} 
                                     className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 w-full text-sm"
                                 >
                                     <RefreshCw className="w-4 h-4 mr-2" />
                                     Actualiser le fil
                                 </Button>
                                {user && user?.is_creator && (
                                    <Link to="/dashboard" className="block">
                                         <Button 
                                             variant="outline" 
                                             className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-6 py-2 rounded-full font-semibold transition-all duration-200 w-full group text-sm"
                                         >
                                             <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                                             Créer du contenu
                                         </Button>
                                    </Link>
                                )}
                                </div>
                            </motion.div>
                    </div>
                )}
            </div>

            {/* Modal de paiement pour le contenu */}
            {showPaymentModal && selectedContent && (
                <ContentPaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedContent(null);
                    }}
                    onConfirm={handlePaymentConfirm}
                    contentTitle={selectedContent.title}
                    amount={selectedContent.price}
                    contentId={selectedContent.id}
                    loading={processingPayment}
                />
            )}
        </div>
    );
}

export default HomePage;