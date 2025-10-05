import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Smartphone, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { fusionPayService } from '../lib/fusionpay';
import { useAuth } from '../contexts/AuthContext';

const PaymentModal = ({ isOpen, onClose, onSuccess, amount, type, creatorName, contentTitle }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handlePayment = useCallback(async (e) => {
    e.preventDefault();

    // Validation du numéro de téléphone
    if (!mobileNumber.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    // Validation du format du numéro (74, 77, 76, 65, 66, 62) - 8 chiffres au total
    const phoneRegex = /^(74|77|76|65|66|62)[0-9]{6}$/;
    if (!phoneRegex.test(mobileNumber.replace(/\s/g, ''))) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un numéro valide de 8 chiffres commençant par 74, 77, 76, 65, 66 ou 62",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 PaymentModal: Initiating FusionPay payment');

      // Préparer les données de paiement
      const paymentData = {
        userId: user.id,
        userEmail: user.email,
        userName: user.name || user.email,
        userPhone: mobileNumber.replace(/\s/g, ''),
        amount: amount,
        type: type
      };

      // Initier le paiement via FusionPay
      const result = await fusionPayService.initiateCreatorPayment(paymentData);

      if (result.success) {
        console.log('✅ PaymentModal: Payment initiated, redirecting to:', result.paymentUrl);
        
        toast({
          title: "Redirection vers le paiement",
          description: "Vous allez être redirigé vers la page de paiement Mobile Money"
        });

        // Rediriger vers la page de paiement
        setTimeout(() => {
          fusionPayService.redirectToPayment(result.paymentUrl);
        }, 1000);

      } else {
        console.error('❌ PaymentModal: Payment initiation failed:', result.error);
        toast({
          title: "Erreur de paiement",
          description: result.error || "Impossible d'initier le paiement",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ PaymentModal: Payment error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [mobileNumber, amount, type, user, toast]);

  const getPaymentTitle = () => {
    switch (type) {
      case 'creator_activation':
        return 'Activation du compte créateur';
      case 'content_purchase':
        return `Achat de contenu - ${contentTitle}`;
      default:
        return 'Paiement';
    }
  };

  const getPaymentDescription = () => {
    switch (type) {
      case 'creator_activation':
        return 'Payez pour activer votre compte créateur et commencer à monétiser votre contenu';
      case 'content_purchase':
        return `Achetez le contenu "${contentTitle}" de ${creatorName}`;
      default:
        return 'Effectuez votre paiement via Mobile Money';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-orange-500" />
            <span>{getPaymentTitle()}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {getPaymentDescription()}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Informations de paiement */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Montant à payer</span>
              <span className="text-xl font-bold text-orange-500">{amount} FCFA</span>
            </div>
          </div>

          {/* Formulaire de paiement */}
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Numéro de téléphone Mobile Money
              </label>
              <Input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="74123456"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: 74123456 (8 chiffres, commence par 74, 77, 76, 65, 66 ou 62)
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Annuler
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Redirection...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>Payer maintenant</span>
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Informations de sécurité */}
          <div className="text-center text-xs text-gray-500">
            <p>🔒 Paiement sécurisé via FusionPay</p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;