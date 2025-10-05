
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Image as ImageIcon, Upload, X, Check, AlertCircle } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { uploadContent } from '../lib/storage';
import { needsOptimization, estimateOptimizedSize, formatFileSize } from '../lib/mediaOptimizer';

const CreateContentModal = ({ isOpen, onClose, onContentCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'image',
    price: 500,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [optimizationInfo, setOptimizationInfo] = useState(null);

  const contentTypes = [
    { value: 'image', label: 'Image', icon: ImageIcon },
    { value: 'video', label: 'Vidéo', icon: Play }
  ];

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      title: '',
      type: 'image',
      price: 500,
      description: ''
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setOptimizationInfo(null);
  };

  // Gestion des fichiers
  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    // Vérifier le type de fichier
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast({
        title: "Type de fichier non supporté",
        description: "Veuillez sélectionner une image ou une vidéo",
        variant: "destructive",
      });
      return;
    }

    // Vérifier la taille (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 100MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setFormData(prev => ({
      ...prev,
      type: isImage ? 'image' : 'video'
    }));

    // Calculer les informations d'optimisation
    const needsOpt = needsOptimization(file);
    const estimatedSize = needsOpt ? estimateOptimizedSize(file) : file.size;
    
    setOptimizationInfo({
      needsOptimization: needsOpt,
      originalSize: file.size,
      estimatedSize: estimatedSize,
      reduction: needsOpt ? Math.round((1 - estimatedSize / file.size) * 100) : 0
    });

    // Générer un titre automatique si vide
    if (!formData.title.trim()) {
      const fileName = file.name.split('.')[0];
      setFormData(prev => ({
        ...prev,
        title: fileName
      }));
    }
  }, [formData.title, toast]);

  // Drag & Drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Upload du fichier
  const uploadFile = async () => {
    if (!selectedFile || !user) return null;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simuler le progrès
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadContent(selectedFile, user.id, 'content', {
        optimization: {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8
        }
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      return result;
    } catch (error) {
      console.error('Erreur upload:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

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

    if (!formData.price || formData.price < 100) {
      toast({
        title: "Erreur",
        description: "Le prix doit être d'au moins 100 FCFA",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload du fichier
      const uploadResult = await uploadFile();
      if (!uploadResult) throw new Error('Erreur lors de l\'upload');

      // Créer le contenu en base
      const { data, error } = await supabase
        .from('content')
        .insert({
          creator_id: user.id,
          title: formData.title,
          description: formData.description,
          type: formData.type,
          price: formData.price,
          url: uploadResult.signedUrl,
          thumbnail_url: uploadResult.thumbnailUrl || uploadResult.signedUrl,
          is_published: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Contenu créé !",
        description: "Votre contenu a été publié avec succès",
      });

      // Appeler la fonction de callback pour rafraîchir la liste
      if (onContentCreated) {
        onContentCreated();
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la création du contenu:', error);
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="text-orange-500" size={24} />
            <span>Créer du contenu</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Zone de drag & drop */}
          <div className="space-y-4">
            {!selectedFile ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: dragActive ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <Upload 
                    size={48} 
                    className={`mx-auto ${dragActive ? 'text-orange-500' : 'text-gray-400'}`} 
                  />
                  <div>
                    <h3 className={`text-lg font-semibold ${dragActive ? 'text-orange-500' : 'text-white'}`}>
                      {dragActive ? 'Déposez votre fichier ici' : 'Glissez-déposez votre fichier'}
                    </h3>
                    <p className="text-gray-400 mt-1">
                      ou <span className="text-orange-500 cursor-pointer">cliquez pour sélectionner</span>
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Formats supportés: JPG, PNG, WebP, MP4, WebM</p>
                    <p>Taille maximale: 100MB</p>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Aperçu du fichier sélectionné */
              <div className="border border-gray-700 rounded-xl p-4 bg-gray-900/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {formData.type === 'image' ? (
                      <ImageIcon className="w-8 h-8 text-orange-500" />
                    ) : (
                      <Play className="w-8 h-8 text-orange-500" />
                    )}
                    <div>
                      <p className="text-white font-medium">{selectedFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {formatFileSize(selectedFile.size)} • {formData.type}
                      </p>
                      {optimizationInfo && optimizationInfo.needsOptimization && (
                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-blue-400 text-xs">
                            🔄 Optimisation automatique : {optimizationInfo.reduction}% de réduction estimée
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {formatFileSize(optimizationInfo.originalSize)} → {formatFileSize(optimizationInfo.estimatedSize)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadProgress(0);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X size={20} />
                  </Button>
                </div>
                
                {/* Aperçu */}
                {formData.type === 'image' && (
                  <div className="w-full h-32 bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {formData.type === 'video' && (
                  <div className="w-full h-32 bg-gray-800 rounded-lg overflow-hidden relative">
                    <video
                      src={URL.createObjectURL(selectedFile)}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Formulaire responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Titre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Titre du contenu *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre du contenu"
                required
                className="w-full"
              />
            </div>

            {/* Prix */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Prix (FCFA) *
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                min="100"
                max="50000"
                step="50"
                required
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Prix minimum: 100 FCFA
              </p>
            </div>

            {/* Type de contenu (auto-détecté) */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Type de contenu
              </label>
              <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg">
                {formData.type === 'image' ? (
                  <ImageIcon className="w-5 h-5 text-orange-500" />
                ) : (
                  <Play className="w-5 h-5 text-orange-500" />
                )}
                <span className="text-white capitalize">{formData.type}</span>
                <span className="text-gray-400 text-sm">(auto-détecté)</span>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Description (optionnel)
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre contenu..."
                rows={3}
                className="w-full resize-none"
              />
            </div>
          </div>

          {/* Barre de progression d'upload */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Upload en cours...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-500 font-medium">Upload direct</p>
                <p className="text-xs text-gray-400 mt-1">
                  Votre fichier sera automatiquement hébergé sur nos serveurs sécurisés. 
                  Pas besoin de liens externes !
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-500"
              disabled={loading || uploading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
              disabled={loading || uploading || !selectedFile}
            >
              {loading || uploading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {uploading ? 'Upload...' : 'Publication...'}
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Publier le contenu
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContentModal;
