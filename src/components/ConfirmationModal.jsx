import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, Trash2, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmer l'action",
  message = "Êtes-vous sûr de vouloir effectuer cette action ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "danger", // "danger", "warning", "info"
  loading = false,
  details = null
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: Trash2,
          iconColor: 'text-red-500',
          iconBg: 'bg-red-500/20',
          confirmButtonClass: 'bg-red-500 hover:bg-red-600 text-white',
          borderColor: 'border-red-500/30'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-500',
          iconBg: 'bg-yellow-500/20',
          confirmButtonClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          borderColor: 'border-yellow-500/30'
        };
      case 'info':
        return {
          icon: CheckCircle,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-500/20',
          confirmButtonClass: 'bg-blue-500 hover:bg-blue-600 text-white',
          borderColor: 'border-blue-500/30'
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-gray-500',
          iconBg: 'bg-gray-500/20',
          confirmButtonClass: 'bg-gray-500 hover:bg-gray-600 text-white',
          borderColor: 'border-gray-500/30'
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="confirmation-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className={`w-8 h-8 ${config.iconBg} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${config.iconColor}`} />
            </div>
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="text-center mb-6">
            
            <p id="confirmation-description" className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
              {message}
            </p>

            {details && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700">
                <h4 className="text-white font-semibold text-sm mb-2">Détails :</h4>
                <ul className="text-left text-gray-300 text-xs sm:text-sm space-y-1">
                  {details.map((detail, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-gray-500 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white"
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${config.confirmButtonClass}`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Traitement...
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
