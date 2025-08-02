
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const PaymentModal = ({ isOpen, onClose, onSuccess, amount, type, creatorName }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = useCallback(async (e) => {
    e.preventDefault();

    if (!mobileNumber || mobileNumber.length < 8) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, this would call the actual API
      // const response = await fetch('https://gytx.dev/api/airtelmoney-web.php', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   body: `amount=${amount}&numero=${mobileNumber}`
      // });

      // Simulate successful payment
      onSuccess({ mobileNumber, amount });

    } catch (error) {
      toast({
        title: "Erreur de paiement",
        description: "Le paiement n'a pas pu être traité. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [mobileNumber, amount, onSuccess]);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="text-[#FF5A00]" size={24} />
            <span>Paiement Mobile Money</span>
          </DialogTitle>
          <DialogDescription>
            {type === 'abonnement'
              ? `Abonnement à ${creatorName} - ${amount} FCFA/mois`
              : `Achat de contenu - ${amount} FCFA`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePayment} className="space-y-6">
          <div className="space-y-4">
            <div className="bg-[#2a2a2a] p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Montant à payer:</span>
                <span className="text-[#FF5A00] font-bold text-lg">{amount} FCFA</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="pl-10"
                  placeholder="Ex: 77123456"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Entrez votre numéro Mobile Money (Orange Money, Free Money, etc.)
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-[#2a2a2a] text-gray-300 hover:border-[#FF5A00]"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bendza-button flex-1"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Traitement...
                </div>
              ) : (
                'Payer maintenant'
              )}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-400">
            Paiement sécurisé via Mobile Money
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
