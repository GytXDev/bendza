import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { fusionPayService } from '../lib/fusionpay';
import { useAuth } from '../contexts/AuthContext';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, becomeCreator } = useAuth();
  
  const [paymentStatus, setPaymentStatus] = useState('checking'); // 'checking', 'success', 'pending', 'failed', 'error'
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        // Extraire le token de l'URL
        const token = searchParams.get('token');
        
        if (!token) {
          console.error('❌ PaymentCallback: No token found in URL');
          setPaymentStatus('error');
          setLoading(false);
          return;
        }

        console.log('🔍 PaymentCallback: Checking payment status for token:', token);

        // Vérifier le statut du paiement
        const result = await fusionPayService.checkPaymentStatus(token);

        if (!result.success) {
          console.error('❌ PaymentCallback: Status check failed:', result.error);
          setPaymentStatus('error');
          setLoading(false);
          return;
        }

        setPaymentData(result.data);

        if (result.paid) {
          console.log('✅ PaymentCallback: Payment successful');
          setPaymentStatus('success');
          
          // Si c'est un paiement d'activation de créateur
          if (result.customData?.type === 'creator_activation') {
            try {
              console.log('🚀 PaymentCallback: Activating creator account');
              const { error } = await becomeCreator();
              
              if (error) {
                console.error('❌ PaymentCallback: Error activating creator:', error);
                toast({
                  title: "Paiement réussi mais erreur d'activation",
                  description: "Votre paiement a été traité mais nous n'avons pas pu activer votre compte créateur. Notre équipe va vous contacter.",
                  variant: "destructive"
                });
              } else {
                console.log('✅ PaymentCallback: Creator account activated successfully');
                toast({
                  title: "Félicitations !",
                  description: "Votre compte créateur a été activé avec succès !"
                });
              }
            } catch (error) {
              console.error('❌ PaymentCallback: Exception during creator activation:', error);
              toast({
                title: "Erreur d'activation",
                description: "Une erreur s'est produite lors de l'activation de votre compte créateur.",
                variant: "destructive"
              });
            }
          }

        } else if (result.pending) {
          console.log('⏳ PaymentCallback: Payment pending');
          setPaymentStatus('pending');
          
        } else if (result.failed) {
          console.log('❌ PaymentCallback: Payment failed');
          setPaymentStatus('failed');
        }

      } catch (error) {
        console.error('❌ PaymentCallback: Exception during payment check:', error);
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
        return paymentData?.type === 'creator_activation' 
          ? 'Votre compte créateur a été activé avec succès ! Vous pouvez maintenant créer et monétiser du contenu.'
          : 'Votre paiement a été traité avec succès.';
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
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Aller au tableau de bord
            </Button>
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
