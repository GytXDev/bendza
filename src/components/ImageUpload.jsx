import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, Check, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { useToast } from './ui/use-toast'

const ImageUpload = ({
    currentImageUrl,
    onImageUpload,
    onImageRemove,
    className = "",
    size = "medium" // small, medium, large
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef(null)
    const { toast } = useToast()

    // Tailles selon la prop size
    const sizeClasses = {
        small: "w-16 h-16",
        medium: "w-24 h-24",
        large: "w-32 h-32"
    }

    const iconSizes = {
        small: "w-6 h-6",
        medium: "w-8 h-8",
        large: "w-10 h-10"
    }

    const handleFileSelect = async (file) => {
        if (!file) return

        // Validation du fichier
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        const maxSize = 5 * 1024 * 1024 // 5MB

        if (!validTypes.includes(file.type)) {
            toast({
                title: "Type de fichier non supporté",
                description: "Veuillez sélectionner une image (JPEG, PNG, WebP)",
                variant: "destructive"
            })
            return
        }

        if (file.size > maxSize) {
            toast({
                title: "Fichier trop volumineux",
                description: "La taille maximale est de 5MB",
                variant: "destructive"
            })
            return
        }

        setIsUploading(true)

        try {
            // Créer une URL de prévisualisation
            const preview = URL.createObjectURL(file)
            setPreviewUrl(preview)

            // Simuler l'upload (remplacer par votre logique d'upload)
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Appeler le callback avec le fichier
            await onImageUpload(file, preview)

            toast({
                title: "Image téléchargée",
                description: "Votre image de profil a été mise à jour"
            })

        } catch (error) {
            console.error('Erreur lors de l\'upload:', error)
            toast({
                title: "Erreur d'upload",
                description: "Impossible de télécharger l'image",
                variant: "destructive"
            })
            setPreviewUrl(null)
        } finally {
            setIsUploading(false)
        }
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }

    const handleRemoveImage = async () => {
        try {
            await onImageRemove()
            setPreviewUrl(null)
            toast({
                title: "Image supprimée",
                description: "Votre image de profil a été supprimée"
            })
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer l'image",
                variant: "destructive"
            })
        }
    }

    const displayImage = previewUrl || currentImageUrl

    return (
        <div className={`relative ${className}`}>
            {/* Zone d'upload */}
            <div
                className={`
          relative ${sizeClasses[size]} rounded-full overflow-hidden
          border-2 border-dashed transition-all duration-200
          ${dragActive ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600'}
          ${isUploading ? 'opacity-50' : 'hover:border-orange-500 cursor-pointer'}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                {/* Image actuelle ou prévisualisation */}
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Camera className={`${iconSizes[size]} text-gray-400`} />
                    </div>
                )}

                {/* Overlay pendant l'upload */}
                {isUploading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center"
                    >
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </motion.div>
                )}

                {/* Bouton d'upload */}
                {!isUploading && !displayImage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors"
                    >
                        <Upload className={`${iconSizes[size]} text-white`} />
                    </motion.div>
                )}

                {/* Bouton de suppression */}
                {displayImage && !isUploading && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveImage()
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                        <X className="w-3 h-3 text-white" />
                    </motion.button>
                )}
            </div>

            {/* Input file caché */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
            />

            {/* Indicateurs de statut */}
            <AnimatePresence>
                {isUploading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 text-xs text-orange-500"
                    >
                        <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span>Upload en cours...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Zone de drop pour drag & drop */}
            {dragActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-orange-500/20 flex items-center justify-center z-50"
                >
                    <div className="bg-black/80 rounded-lg p-6 text-center">
                        <Upload className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <p className="text-white text-lg">Déposez votre image ici</p>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export default ImageUpload 