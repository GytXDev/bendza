
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Image as ImageIcon, FileText, Upload } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CreateContentModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addContent, getCreatorProfile } = useData();
  const [formData, setFormData] = useState({
    title: '',
    type: 'text',
    price: 500,
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const creatorProfile = getCreatorProfile(user?.id);

  const contentTypes = [
    { value: 'text', label: 'Texte', icon: FileText },
    { value: 'image', label: 'Image', icon: ImageIcon },
    { value: 'video', label: 'Vidéo', icon: Play }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un titre pour votre contenu",
        variant: "destructive",
      });
      return;
    }

    if (!creatorProfile?.abonnement_mode && (!formData.price || formData.price < 100)) {
      toast({
        title: "Erreur",
        description: "Le prix doit être d'au moins 100 FCFA",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const contentData = {
        title: formData.title,
        type: formData.type,
        price: creatorProfile?.abonnement_mode ? 0 : formData.price,
        url: `https://example.com/content/${Date.now()}`, // Placeholder URL
        description: formData.description
      };

      addContent(contentData);
      
      toast({
        title: "Contenu créé !",
        description: "Votre contenu a été publié avec succès",
      });
      
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        type: 'text',
        price: 500,
        description: ''
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du contenu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="text-[#FF5A00]" size={24} />
            <span>Créer du contenu</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Titre du contenu *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Mes conseils beauté du jour"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Type de contenu
            </label>
            <div className="grid grid-cols-3 gap-3">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.type === type.value
                        ? 'border-[#FF5A00] bg-[#FF5A00]/10'
                        : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                    }`}
                  >
                    <Icon 
                      size={24} 
                      className={`mx-auto mb-2 ${
                        formData.type === type.value ? 'text-[#FF5A00]' : 'text-gray-400'
                      }`} 
                    />
                    <div className={`text-sm ${
                      formData.type === type.value ? 'text-[#FF5A00]' : 'text-gray-400'
                    }`}>
                      {type.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {!creatorProfile?.abonnement_mode && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Prix (FCFA)
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                min="100"
                max="10000"
                step="50"
              />
              <p className="text-xs text-gray-400 mt-1">
                Prix minimum: 100 FCFA
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description (optionnel)
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre contenu..."
              rows={3}
            />
          </div>

          {formData.type !== 'text' && (
            <div className="bg-[#2a2a2a] p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Upload className="text-[#FF5A00]" size={20} />
                <div>
                  <p className="text-sm font-medium text-white">Upload de fichier</p>
                  <p className="text-xs text-gray-400">
                    Cette fonctionnalité sera disponible prochainement
                  </p>
                </div>
              </div>
            </div>
          )}

          {creatorProfile?.abonnement_mode && (
            <div className="bg-[#FF5A00]/10 border border-[#FF5A00]/20 p-3 rounded-lg">
              <p className="text-sm text-[#FF5A00]">
                ℹ️ Mode abonnement: Ce contenu sera accessible à tous vos abonnés
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={onClose}
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
                <div className="loading-spinner"></div>
              ) : (
                'Publier'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContentModal;
