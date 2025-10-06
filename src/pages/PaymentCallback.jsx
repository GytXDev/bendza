import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { fusionPayService } from '../lib/fusionpay';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, becomeCreator } = useAuth();
  
  const [paymentStatus, setPaymentStatus] = useState('checking'); // 'checking', 'success', 'pending', 'failed', 'error'
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasedContentId, setPurchasedContentId] = useState(null);

  // Fonction pour traiter l'achat de contenu
  const processContentPurchase = async (customData, paymentData) => {
    try {
      let contentId = customData.contentId || customData.id;
      const userId = customData.userId;
      const amount = paymentData.Montant || paymentData.amount || 0;

      // Récupérer contentId depuis différentes sources si manquant
      if (!contentId) {
        // Vérifier dans customData
        contentId = customData.content_id || customData.contentId || customData.id;
        
        // Vérifier dans personal_Info
        if (!contentId && paymentData.personal_Info?.[0]) {
          const personalInfo = paymentData.personal_Info[0];
          contentId = personalInfo.contentId || personalInfo.content_id || personalInfo.id;
        }
        
        // Vérifier dans l'URL
        if (!contentId) {
          contentId = searchParams.get('contentId') || searchParams.get('id');
        }
        
        // Vérifier dans sessionStorage
        if (!contentId) {
          const storedContentId = sessionStorage.getItem('pendingContentId');
          if (storedContentId && storedContentId !== 'undefined' && storedContentId !== 'null') {
            contentId = storedContentId;
          }
        }
      }

      if (!userId) {
        throw new Error('Données de paiement incomplètes - userId manquant');
      }

      // Si contentId toujours manquant, essayer de le récupérer automatiquement
      if (!contentId || contentId === 'undefined' || contentId === 'null') {
        // Recherche par titre
        if (customData.contentTitle) {
          const { data: titleContent } = await supabase
            .from('content')
            .select('id, title, creator_id, price')
            .ilike('title', `%${customData.contentTitle}%`)
            .limit(5);
          
          if (titleContent?.length > 0) {
            const matchingContent = titleContent.find(c => c.price === amount);
            if (matchingContent) {
              contentId = matchingContent.id;
            }
          }
        }
        
        // Recherche par prix si toujours pas trouvé
        if (!contentId) {
          const { data: priceContent } = await supabase
            .from('content')
            .select('id, title, creator_id, price')
            .eq('price', amount)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (priceContent?.length > 0) {
            contentId = priceContent[0].id;
          }
        }
        
        // Créer un achat générique si toujours pas trouvé
        if (!contentId) {
          const { data: transaction, error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              content_id: null,
              creator_id: null,
              amount: amount,
              type: 'achat_unitaire',
              payment_method: 'mobile_money',
              status: 'paid',
              payment_reference: paymentData.numeroTransaction || null
            })
            .select()
            .single();

          if (transactionError) {
            throw transactionError;
          }
          
          // Nettoyer sessionStorage
          sessionStorage.removeItem('pendingContentId');
          sessionStorage.removeItem('pendingContentTitle');
          sessionStorage.removeItem('pendingAmount');
          
          return 'generic';
        }
      }

      // Récupérer les informations du contenu
      const { data: contentItem, error: contentError } = await supabase
        .from('content')
        .select('id, creator_id, title, price')
        .eq('id', contentId)
        .single();

      if (contentError || !contentItem) {
        throw new Error('Contenu non trouvé');
      }

      // Vérifier les achats existants
      const { data: existingPurchases, error: purchaseCheckError } = await supabase
        .from('purchases')
        .select('id, amount_paid')
        .eq('user_id', userId)
        .eq('content_id', contentId);

      if (!purchaseCheckError && existingPurchases?.length > 0) {
        throw new Error('Ce contenu a déjà été acheté par cet utilisateur');
      }

      // Créer une transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          content_id: contentId,
          creator_id: contentItem.creator_id,
          amount: amount,
          type: 'achat_unitaire',
          payment_method: 'mobile_money',
          status: 'paid',
          payment_reference: paymentData.numeroTransaction || null
        })
        .select()
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // Créer l'achat
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          content_id: contentId,
          transaction_id: transaction.id,
          amount_paid: amount
        });

      if (purchaseError) {
        throw purchaseError;
      }

      // Incrémenter le compteur de vues
      await supabase
        .from('content')
        .update({ 
          views_count: supabase.raw('views_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);
      
      // Nettoyer sessionStorage
      sessionStorage.removeItem('pendingContentId');
      sessionStorage.removeItem('pendingContentTitle');
      sessionStorage.removeItem('pendingAmount');
      
      return contentId;

    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setPaymentStatus('error');
          setLoading(false);
          return;
        }

        const result = await fusionPayService.checkPaymentStatus(token);

        if (!result.success) {
          setPaymentStatus('error');
          setLoading(false);
          return;
        }

        setPaymentData(result.data);

        if (result.paid) {
          setPaymentStatus('success');
          
          let customData = result.customData || {};
          
          // Récupérer customData depuis result.data si vide
          if (!customData || Object.keys(customData).length === 0) {
            if (result.data?.personal_Info?.[0]) {
              customData = result.data.personal_Info[0];
            }
          }
          
          if (customData.type === 'creator_activation') {
            try {
              const { error } = await becomeCreator();
              
              if (error) {
                toast({
                  title: "Paiement réussi mais erreur d'activation",
                  description: "Votre paiement a été traité mais nous n'avons pas pu activer votre compte créateur. Notre équipe va vous contacter.",
                  variant: "destructive"
                });
              } else {
                toast({
                  title: "Félicitations !",
                  description: "Votre compte créateur a été activé avec succès !"
                });
                // Rediriger vers le tableau de bord après 2 secondes
                setTimeout(() => {
                  navigate('/dashboard');
                }, 2000);
              }
            } catch (error) {
              toast({
                title: "Erreur d'activation",
                description: "Une erreur s'est produite lors de l'activation de votre compte créateur.",
                variant: "destructive"
              });
            }
          } else if (customData.type === 'content_purchase') {
            try {
              const contentId = await processContentPurchase(customData, result.data);
              
              if (contentId && contentId !== 'generic') {
                setPurchasedContentId(contentId);
                toast({
                  title: "Achat réussi !",
                  description: "Vous pouvez maintenant accéder au contenu.",
                });
                // Rediriger vers la page Mes Achats après 2 secondes
                setTimeout(() => {
                  navigate('/my-purchases');
                }, 2000);
              } else {
                setPurchasedContentId(null);
                toast({
                  title: "Paiement traité !",
                  description: "Votre achat a été enregistré avec succès.",
                });
                // Rediriger vers la page Mes Achats après 2 secondes
                setTimeout(() => {
                  navigate('/my-purchases');
                }, 2000);
              }
            } catch (error) {
              toast({
                title: "Paiement traité !",
                description: "Votre paiement a été enregistré avec succès.",
              });
            }
          } else {
            toast({
              title: "Paiement réussi !",
              description: "Votre transaction a été confirmée.",
            });
          }

        } else if (result.pending) {
          setPaymentStatus('pending');
        } else if (result.failed) {
          setPaymentStatus('failed');
        }

      } catch (error) {
        setPaymentStatus('error');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentCallback();
  }, [searchParams, becomeCreator, toast]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'checking':
        return <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'checking':
        return 'Vérification du paiement...';
      case 'success':
        return 'Paiement réussi !';
      case 'pending':
        return 'Paiement en cours...';
      case 'failed':
        return 'Paiement échoué';
      case 'error':
        return 'Erreur de vérification';
      default:
        return 'Vérification...';
    }
  };

  const getStatusDescription = () => {
    switch (paymentStatus) {
      case 'checking':
        return 'Nous vérifions le statut de votre paiement...';
      case 'success':
        if (purchasedContentId && purchasedContentId !== 'generic') {
          return 'Votre achat a été traité avec succès ! Vous pouvez maintenant accéder au contenu.';
        }
        return paymentData?.type === 'creator_activation' 
          ? 'Votre compte créateur a été activé avec succès ! Vous pouvez maintenant créer et monétiser du contenu.'
          : 'Votre paiement a été traité et enregistré avec succès.';
      case 'pending':
        return 'Votre paiement est en cours de traitement. Vous recevrez une confirmation une fois terminé.';
      case 'failed':
        return 'Votre paiement n\'a pas pu être traité. Veuillez réessayer ou contacter le support.';
      case 'error':
        return 'Une erreur s\'est produite lors de la vérification de votre paiement.';
      default:
        return 'Vérification en cours...';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
      case 'error':
        return 'text-red-500';
      default:
        return 'text-orange-500';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Helmet>
        <title>Confirmation de paiement - BENDZA</title>
        <meta name="description" content="Confirmation de votre paiement BENDZA" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-gray-900 rounded-xl p-8 text-center"
      >
        {/* Icône de statut */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Titre */}
        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {getStatusTitle()}
        </h1>

        {/* Description */}
        <p className="text-gray-400 mb-6">
          {getStatusDescription()}
        </p>

        {/* Informations de paiement si disponibles */}
        {paymentData && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Détails de la transaction</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Montant:</span>
                <span className="text-white">{paymentData.Montant} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Référence:</span>
                <span className="text-white font-mono text-xs">{paymentData.numeroTransaction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Moyen:</span>
                <span className="text-white">{paymentData.moyen}</span>
              </div>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="space-y-3">
          {paymentStatus === 'success' && (
            <>
              {paymentData?.type === 'creator_activation' ? (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Aller au tableau de bord
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/my-purchases')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Voir mes achats
                </Button>
              )}
            </>
          )}
          
          {(paymentStatus === 'failed' || paymentStatus === 'error') && (
            <Button
              onClick={() => navigate('/become-creator')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Réessayer le paiement
            </Button>
          )}

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Retour à l'accueil
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCallback;
