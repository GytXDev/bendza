import React, { useState, useCallback } from 'react';
import { X, Plus, Upload, Image, Video, File } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { uploadContent } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { imageUploadService } from '../lib/imageUpload';

const MultipleMediaUpload = ({ contentId, onMediaAdded, existingMedia = [] }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  // Types de fichiers autorisés
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
  };

  const getFileType = (file) => {
    if (allowedTypes.image.includes(file.type)) return 'image';
    if (allowedTypes.video.includes(file.type)) return 'video';
    if (allowedTypes.audio.includes(file.type)) return 'audio';
    return 'unknown';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <File className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const handleFiles = useCallback((newFiles) => {
    const validFiles = Array.from(newFiles).filter(file => {
      const fileType = getFileType(file);
      if (fileType === 'unknown') {
        toast({
          title: "Type de fichier non supporté",
          description: `${file.name} n'est pas un type de fichier supporté`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > 100 * 1024 * 1024) { // 100MB
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la limite de 100MB`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    setFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      type: getFileType(file),
      id: Math.random().toString(36).substr(2, 9)
    }))]);
  }, [toast]);

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
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (fileData, index) => {
        // Upload du fichier
        const uploadResult = await uploadContent(
          fileData.file, 
          contentId, // Utiliser contentId comme creatorId temporairement
          'content'
        );

        // Insérer dans content_media
        const { data, error } = await supabase
          .from('content_media')
          .insert({
            content_id: contentId,
            media_url: uploadResult.publicUrl,
            media_type: fileData.type,
            file_name: fileData.file.name,
            file_size: fileData.file.size,
            order_index: index
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      const uploadedMedia = await Promise.all(uploadPromises);
      
      toast({
        title: "Médias ajoutés avec succès",
        description: `${uploadedMedia.length} fichier(s) ajouté(s) au contenu`,
      });

      setFiles([]);
      if (onMediaAdded) onMediaAdded(uploadedMedia);

    } catch (error) {
      console.error('Erreur upload médias:', error);
      toast({
        title: "Erreur lors de l'upload",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Glissez-déposez vos fichiers ici ou
        </p>
        <input
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="multiple-media-upload"
        />
        <label
          htmlFor="multiple-media-upload"
          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Sélectionner des fichiers
        </label>
        <p className="text-xs text-gray-500 mt-2">
          Images, vidéos, audio • Max 100MB par fichier
        </p>
      </div>

      {/* Liste des fichiers sélectionnés */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Fichiers sélectionnés ({files.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((fileData) => (
              <div key={fileData.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getFileIcon(fileData.type)}
                  <div>
                    <p className="text-sm font-medium">{fileData.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {fileData.type} • {(fileData.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileData.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Upload en cours...' : `Uploader ${files.length} fichier(s)`}
          </Button>
        </div>
      )}

      {/* Médias existants */}
      {existingMedia.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Médias existants ({existingMedia.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {existingMedia.map((media) => (
              <div key={media.id} className="relative group">
                {media.media_type === 'image' ? (
                  <img
                    src={media.media_url}
                    alt={media.file_name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ) : media.media_type === 'video' ? (
                  <video
                    src={media.media_url}
                    className="w-full h-24 object-cover rounded-lg"
                    preload="metadata"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <File className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      try {
                        // Supprimer le fichier du storage
                        if (media.media_url) {
                          const deletionResult = await imageUploadService.deleteOldImage(media.media_url);
                          
                          if (!deletionResult.success) {
                            console.warn('Échec de la suppression du fichier:', deletionResult.error);
                            toast({
                              title: "Avertissement",
                              description: "Le média a été supprimé de la base de données mais le fichier pourrait encore exister",
                              variant: "destructive",
                            });
                          } else {
                          }
                        }

                        // Supprimer l'entrée de la base de données
                        const { error } = await supabase
                          .from('content_media')
                          .delete()
                          .eq('id', media.id);
                        
                        if (error) throw error;

                        toast({
                          title: "Média supprimé",
                          description: "Le média a été supprimé avec succès",
                        });
                        
                        if (onMediaAdded) {
                          onMediaAdded(); // Rafraîchir la liste
                        }
                      } catch (error) {
                        console.error('Erreur lors de la suppression:', error);
                        toast({
                          title: "Erreur",
                          description: "Impossible de supprimer le média",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleMediaUpload;
