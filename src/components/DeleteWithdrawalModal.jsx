import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

const DeleteWithdrawalModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  withdrawalData,
  loading = false 
}) => {
  const { toast } = useToast();

  const handleConfirm = () => {
    onConfirm(withdrawalData?.id);
  };

  // Vérifier que le modal de suppression ne s'ouvre que pour les demandes pending
  useEffect(() => {
    if (isOpen && withdrawalData && withdrawalData.status && withdrawalData.status !== 'pending') {
      onClose();
      toast({
        title: "Action impossible",
        description: "Cette demande ne peut plus être supprimée",
        variant: "destructive",
      });
    }
  }, [isOpen, withdrawalData, onClose, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[425px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-500 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3" />
            Supprimer la demande
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Cette action est irréversible
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Avertissement */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div>
                <h3 className="text-red-400 font-medium mb-2">Attention !</h3>
                <p className="text-gray-300 text-sm mb-2">
                  Vous êtes sur le point de supprimer définitivement votre demande de retrait. 
                  Cette action ne peut pas être annulée.
                </p>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm font-medium">
                    L'argent sera automatiquement retourné à votre solde disponible
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Détails de la demande */}
          {withdrawalData && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Détails de la demande :</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Montant :</span>
                  <span className="text-white font-medium">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(withdrawalData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Frais (10%) :</span>
                  <span className="text-red-400">
                    -{new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(withdrawalData.withdrawal_fee || Math.round(withdrawalData.amount * 0.10))}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-gray-400">Montant net :</span>
                  <span className="text-green-400 font-bold">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(withdrawalData.net_amount || (withdrawalData.amount - (withdrawalData.withdrawal_fee || Math.round(withdrawalData.amount * 0.10))))}
                  </span>
                </div>
                {withdrawalData.phone_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Téléphone :</span>
                    <span className="text-white">{withdrawalData.phone_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Date :</span>
                  <span className="text-white">
                    {new Date(withdrawalData.requested_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button 
              type="button"
              onClick={handleConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="hidden sm:inline">Suppression...</span>
                  <span className="sm:hidden">Suppression</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Supprimer</span>
                  <span className="sm:hidden">Supprimer</span>
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteWithdrawalModal;
