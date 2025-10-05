import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Smartphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const ContentPaymentModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  contentTitle, 
  amount, 
  loading = false 
}) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const { toast } = useToast();

  const validateMobileNumber = (number) => {
    // Validation pour les numéros africains (8 chiffres, commence par 74, 77, 76, 65, 66, 62)
    const regex = /^(74|77|76|65|66|62)[0-9]{6}$/;
    return regex.test(number.replace(/\s/g, ''));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation du format du numéro
    if (!validateMobileNumber(mobileNumber)) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un numéro valide de 8 chiffres commençant par 74, 77, 76, 65, 66 ou 62",
        variant: "destructive"
      });
      return;
    }

    onConfirm(mobileNumber);
  };

  const handleClose = () => {
    if (!loading) {
      setMobileNumber('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-orange-500">
            Paiement Mobile Money
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Accédez au contenu "{contentTitle}" pour {amount} FCFA.
            Entrez votre numéro de téléphone Mobile Money.
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            <p>🔒 Paiement sécurisé via FusionPay</p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentPaymentModal;
