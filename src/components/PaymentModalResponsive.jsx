import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import ResponsiveModal, { 
  ResponsiveModalActions, 
  ResponsiveModalLogos, 
  ResponsiveModalLogo 
} from './ui/ResponsiveModal';
import { fusionPayService } from '../lib/fusionpay';
import { useAuth } from '../contexts/AuthContext';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const PaymentModalResponsive = ({ isOpen, onClose, onSuccess, amount, type, creatorName, contentTitle }) => {
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
    
    if (!phoneNumber) {
      toast({
        title: "Numéro manquant",
        description: "Veuillez entrer votre numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    if (!validateGabonNumber(phoneNumber)) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro gabonais valide (ex: +24174001209)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const paymentData = {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userPhone: phoneNumber,
        amount: amount,
        type: type,
        contentTitle: contentTitle
      };

      const result = await fusionPayService.initiateCreatorPayment(paymentData);

      if (result.success && result.paymentUrl) {
        toast({
          title: "Redirection vers le paiement",
          description: "Vous allez être redirigé vers la page de paiement Mobile Money"
        });

        setTimeout(() => {
          fusionPayService.redirectToPayment(result.paymentUrl);
        }, 1000);
      } else {
        console.error('PaymentModal: Payment initiation failed:', result);
        toast({
          title: "Erreur de paiement",
          description: result.error || "Impossible d'initier le paiement. URL de paiement manquante.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('PaymentModal: Payment error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, amount, type, user, toast, contentTitle]);

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
        return `Activez votre compte créateur pour ${amount} FCFA. Entrez votre numéro de téléphone Mobile Money.`;
      case 'content_purchase':
        return `Débloquez ce contenu pour ${amount} FCFA. Entrez votre numéro de téléphone Mobile Money.`;
      default:
        return 'Effectuez votre paiement via Mobile Money';
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={getPaymentTitle()}
      description={getPaymentDescription()}
      size="sm"
      titleSize="md"
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
        <ResponsiveModalActions>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            className="bg-orange-500 hover:bg-orange-600 text-white" 
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
        </ResponsiveModalActions>
      </form>

      {/* Informations de sécurité */}
      <div className="text-center text-xs text-gray-500">
        <p>Paiement sécurisé via FusionPay</p>
        
        {/* Images des possibilités de paiement */}
        <ResponsiveModalLogos className="mt-3">
          <ResponsiveModalLogo 
            src="/payment_logo/airtel_money.jpg" 
            alt="Airtel Money" 
          />
          <ResponsiveModalLogo 
            src="/payment_logo/moov_money.png" 
            alt="Moov Money" 
          />
          <ResponsiveModalLogo 
            src="/payment_logo/mtn.jpg" 
            alt="MTN Mobile Money" 
          />
          <ResponsiveModalLogo 
            src="/payment_logo/wave.png" 
            alt="Wave" 
          />
          <ResponsiveModalLogo 
            src="/payment_logo/orange_money.jpg" 
            alt="Orange Money" 
          />
        </ResponsiveModalLogos>
      </div>
    </ResponsiveModal>
  );
};

export default PaymentModalResponsive;
