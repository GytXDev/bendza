import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Smartphone, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
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
import { supabase } from '../lib/supabase';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const ContentPaymentModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  contentTitle, 
  amount, 
  contentId 
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fonction de validation du numéro gabonais
  const validateGabonNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    
    // Extraire le numéro sans le code pays
    let cleanNumber = phoneNumber.replace(/^\+241/, '').replace(/\s/g, '');
    
    // Vérifier que c'est un numéro gabonais (+241)
    if (!phoneNumber.startsWith('+241')) return false;
    
    // Vérifier que le numéro ne commence pas par 0 (format incorrect)
    if (cleanNumber.startsWith('0')) {
      return false; // Rejeter directement les numéros commençant par 0
    }
    
    // Vérifier la longueur (8 chiffres)
    if (cleanNumber.length !== 8) return false;
    
    // Vérifier les préfixes valides
    const validPrefixes = ['74', '77', '76', '65', '60', '61', '62', '66'];
    const prefix = cleanNumber.substring(0, 2);
    
    return validPrefixes.includes(prefix);
  };

  const handlePayment = useCallback(async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer un paiement.",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    // Validation spécifique pour le Gabon
    if (phoneNumber.startsWith('+241') && !validateGabonNumber(phoneNumber)) {
      toast({
        title: "Numéro invalide",
        description: "Pour le Gabon, le numéro doit commencer par 74, 77, 76, 65, 60, 61, 62 ou 66 et contenir exactement 8 chiffres (ne pas ajouter de 0 au début).",
        variant: "destructive"
      });
      return;
    }

    // Note: La vérification des achats multiples sera faite côté serveur dans PaymentCallback
    // pour éviter les problèmes de permissions RLS côté client
    console.log('ContentPaymentModal: Vérification des achats déléguée au serveur');

    setLoading(true);

    try {
      console.log('ContentPaymentModal: Initiating FusionPay payment');

      const clientName = user.name || user.email.split('@')[0];
      const userId = user.id;

      // Vérifier que contentId est valide avant de le stocker
      if (!contentId || contentId === 'undefined' || contentId === 'null') {
        console.error('ContentPaymentModal: Invalid contentId:', contentId);
        toast({
          title: "Erreur de paiement",
          description: "Identifiant du contenu manquant",
          variant: "destructive"
        });
        return;
      }

      // Vérifier que le contenu existe et a un creator_id valide
      console.log('ContentPaymentModal: Vérification du contenu...');
      try {
        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('id, title, creator_id, price, status, is_published')
          .eq('id', contentId)
          .single();

        if (contentError || !contentData) {
          console.error('ContentPaymentModal: Contenu non trouvé:', contentError);
          toast({
            title: "Contenu introuvable",
            description: "Le contenu que vous essayez d'acheter n'existe plus",
            variant: "destructive"
          });
          return;
        }

        if (!contentData.creator_id) {
          console.error(' ContentPaymentModal: Creator ID manquant:', contentData);
          toast({
            title: "Erreur de contenu",
            description: "Ce contenu n'a pas de créateur associé",
            variant: "destructive"
          });
          return;
        }

        if (contentData.status !== 'approved' || !contentData.is_published) {
          console.error('ContentPaymentModal: Contenu non approuvé:', contentData);
          toast({
            title: "Contenu non disponible",
            description: "Ce contenu n'est pas encore approuvé ou publié",
            variant: "destructive"
          });
          return;
        }

        console.log('ContentPaymentModal: Contenu validé:', {
          id: contentData.id,
          title: contentData.title,
          creator_id: contentData.creator_id,
          price: contentData.price,
          status: contentData.status
        });

      } catch (error) {
        console.error('ContentPaymentModal: Erreur lors de la vérification du contenu:', error);
        toast({
          title: "Erreur de vérification",
          description: "Impossible de vérifier le contenu",
          variant: "destructive"
        });
        return;
      }

      // Stocker temporairement le contentId pour le récupérer après le paiement
      sessionStorage.setItem('pendingContentId', contentId);
      sessionStorage.setItem('pendingContentTitle', contentTitle);
      sessionStorage.setItem('pendingAmount', amount.toString());
      console.log('ContentPaymentModal: Stored payment data in sessionStorage:', { contentId, contentTitle, amount });

      const paymentData = {
        userId,
        userEmail: user.email,
        userName: clientName,
        amount,
        type: 'content_purchase',
        userPhone: phoneNumber,
        contentTitle,
        contentId,
        id: contentId, // Ajouter aussi le champ 'id' pour compatibilité
        return_url: `${window.location.origin}/payment-callback`
      };

      console.log('ContentPaymentModal: Sending payment data:', paymentData);


      const result = await fusionPayService.initiateCreatorPayment(paymentData);

      if (result.success && result.paymentUrl) {
        console.log('ContentPaymentModal: Payment initiated, redirecting to:', result.paymentUrl);
        toast({
          title: "Redirection vers le paiement",
          description: "Vous allez être redirigé vers la page de paiement Mobile Money"
        });

        setTimeout(() => {
          fusionPayService.redirectToPayment(result.paymentUrl);
        }, 1000);
      } else {
        console.error(' ContentPaymentModal: Payment initiation failed:', result);
        toast({
          title: "Erreur de paiement",
          description: result.error || "Impossible d'initier le paiement. URL de paiement manquante.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(' ContentPaymentModal: Payment error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, amount, user, toast, contentTitle, contentId]);

  const handleClose = () => {
    if (!loading) {
      setPhoneNumber('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700"
        aria-describedby="content-payment-description"
      >
        <DialogHeader>
          <p id="content-payment-description" className="sr-only">
            Modal de paiement pour accéder au contenu premium
          </p>
          <DialogTitle className="text-2xl font-bold text-orange-500">
            Paiement Mobile Money
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Débloquez ce contenu pour {amount} FCFA. Entrez votre numéro de téléphone Mobile Money.
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
            <div className="mt-2 text-sm text-gray-400">
              Contenu: {contentTitle}
            </div>
          </div>

          {/* Formulaire de paiement */}
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Numéro de téléphone Mobile Money
              </label>
              
              <PhoneInput
                placeholder="Entrez votre numéro de téléphone"
                value={phoneNumber}
                onChange={setPhoneNumber}
                defaultCountry="GA"
                countries={['GA', 'CI', 'SN', 'BJ', 'ML', 'TG', 'BF', 'CM', 'NE', 'CD']}
                className="phone-input-custom"
                disabled={loading}
                style={{
                  '--PhoneInput-color--focus': '#f97316',
                  '--PhoneInputCountrySelect-marginRight': '0.5rem',
                }}
              />
              
              <p className="text-xs text-gray-500 mt-1">
                {phoneNumber && phoneNumber.startsWith('+241') 
                  ? "Format Gabon: 74, 77, 76, 65, 60, 61, 62 ou 66 suivi de 6 chiffres (ex: 74001209)"
                  : "Sélectionnez votre pays et entrez votre numéro Mobile Money"
                }
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  `Payer ${amount} FCFA`
                )}
              </Button>
            </div>
          </form>

          {/* Informations de sécurité */}
          <div className="text-center text-xs text-gray-500">
            <p>Paiement sécurisé via FusionPay</p>
            
            {/* Images des possibilités de paiement */}
            <div className="flex justify-center items-center space-x-5 mt-3">
              <img 
                src="/payment_logo/airtel_money.jpg" 
                alt="Airtel Money" 
                className="w-10 h-10 object-contain"
              />
              
              <img 
                src="/payment_logo/moov_money.png" 
                alt="Moov Money" 
                className="w-10 h-10 object-contain"
              />
              
              <img 
                src="/payment_logo/mtn.jpg" 
                alt="MTN Mobile Money" 
                className="w-10 h-10 object-contain"
              />
              
              <img 
                src="/payment_logo/wave.png" 
                alt="Wave" 
                className="w-10 h-10 object-contain"
              />
              
              <img 
                src="/payment_logo/orange_money.jpg" 
                alt="Orange Money" 
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentPaymentModal;
