import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Globe, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const WithdrawalModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  availableBalance,
  loading = false,
  editMode = false,
  initialData = null
}) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState(editMode && initialData ? initialData.amount.toString() : '');
  const [phoneNumber, setPhoneNumber] = useState(editMode && initialData ? initialData.phoneNumber : '');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validation du montant
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = 'Veuillez entrer un montant valide';
    } else if (amountValue < 100) {
      newErrors.amount = 'Le montant minimum est de 100 FCFA';
    } else if (amountValue > availableBalance) {
      newErrors.amount = 'Le montant dépasse votre solde disponible';
    }

    // Validation du numéro de téléphone
    if (!phoneNumber) {
      newErrors.phoneNumber = 'Veuillez entrer votre numéro de téléphone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      });
      return;
    }

    const amountValue = parseFloat(amount);
    const withdrawalFee = Math.round(amountValue * 0.10); // 10% de frais
    const netAmount = amountValue - withdrawalFee;

    // Extraire le pays du numéro de téléphone
    const countryCode = phoneNumber.startsWith('+') ? phoneNumber.substring(1, 3) : phoneNumber.substring(0, 2);
    const countryMap = {
      '237': 'CM', '221': 'SN', '225': 'CI', '226': 'BF',
      '223': 'ML', '227': 'NE', '235': 'TD', '236': 'CF',
      '241': 'GA', '242': 'CG', '243': 'CD', '240': 'GQ'
    };
    const country = countryMap[countryCode] || 'GA';

    onConfirm({
      amount: amountValue,
      withdrawalFee,
      netAmount,
      country,
      phoneNumber
    });
  };

  const handleClose = () => {
    // Toujours réinitialiser les valeurs à la fermeture
    setAmount('');
    setPhoneNumber('');
    setErrors({});
    onClose();
  };

  // Réinitialiser les valeurs quand le modal s'ouvre en mode édition
  useEffect(() => {
    if (isOpen && editMode && initialData) {
      setAmount(initialData.amount.toString());
      setPhoneNumber(initialData.phoneNumber || '');
      setErrors({});
    } else if (isOpen && !editMode) {
      // Réinitialiser pour le mode création
      setAmount('');
      setPhoneNumber('');
      setErrors({});
    }
  }, [isOpen, editMode, initialData]);

  // Vérifier que le modal d'édition ne s'ouvre que pour les demandes pending
  useEffect(() => {
    if (isOpen && editMode && initialData && initialData.status && initialData.status !== 'pending') {
      onClose();
      toast({
        title: "Action impossible",
        description: "Cette demande ne peut plus être modifiée",
        variant: "destructive",
      });
    }
  }, [isOpen, editMode, initialData, onClose]);

  const amountValue = parseFloat(amount) || 0;
  const withdrawalFee = Math.round(amountValue * 0.10);
  const netAmount = amountValue - withdrawalFee;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] bg-gray-900 text-white border-gray-700 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-orange-500">
            {editMode ? 'Modifier' : 'Demande de retrait'}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            {editMode 
              ? 'Modifiez les détails de votre demande de retrait' 
              : 'Retirez vos gains via Mobile Money. Frais de retrait: 10%'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 sm:space-y-6 p-1"
          >
            {/* Informations de retrait */}
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm sm:text-base">Solde disponible</span>
                <span className="text-lg sm:text-xl font-bold text-orange-500">{availableBalance.toLocaleString()} FCFA</span>
              </div>
              {amountValue > 0 && (
                <div className="mt-3 space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Montant demandé:</span>
                    <span className="text-white">{amountValue.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frais (10%):</span>
                    <span className="text-red-400">-{withdrawalFee.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-1">
                    <span className="text-white font-medium">Vous recevrez:</span>
                    <span className="text-green-400 font-bold">{netAmount.toLocaleString()} FCFA</span>
                  </div>
                </div>
              )}
            </div>

            {/* Formulaire de retrait */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Montant à retirer (FCFA)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="100"
                  max={availableBalance}
                  step="100"
                  className={`w-full p-2 sm:p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base ${errors.amount ? 'border-red-500' : ''}`}
                />
                {errors.amount && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.amount}
                  </p>
                )}
              </div>

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
                
                {errors.phoneNumber && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.phoneNumber}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez votre pays et entrez votre numéro Mobile Money
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 py-2 sm:py-3"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 sm:py-3" 
                  disabled={loading || amountValue <= 0}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Envoi...
                    </>
                  ) : (
                    editMode ? 'Modifier' : 'Demander le retrait'
                  )}
                </Button>
              </div>
            </form>

            {/* Informations de sécurité */}
            <div className="text-center text-xs text-gray-500">
              <p>Retrait sécurisé via Mobile Money</p>
              
              {/* Images des possibilités de paiement */}
              <div className="flex justify-center items-center space-x-2 sm:space-x-5 mt-3">
                <img 
                  src="/payment_logo/airtel_money.jpg" 
                  alt="Airtel Money" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
                
                <img 
                  src="/payment_logo/moov_money.png" 
                  alt="Moov Money" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
                
                <img 
                  src="/payment_logo/mtn.jpg" 
                  alt="MTN Mobile Money" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
                
                <img 
                  src="/payment_logo/wave.png" 
                  alt="Wave" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
                
                <img 
                  src="/payment_logo/orange_money.jpg" 
                  alt="Orange Money" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalModal;
