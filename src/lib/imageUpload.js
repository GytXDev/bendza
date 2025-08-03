import { supabase } from './supabase'

/**
 * Service d'upload d'images optimisé
 * Gère l'upload, la compression et la suppression des anciennes images
 */
export class ImageUploadService {
    constructor() {
        this.bucketName = 'profile-images'
        this.maxFileSize = 5 * 1024 * 1024 // 5MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        this.quality = 0.8 // Qualité de compression
    }

    /**
     * Valide un fichier image
     */
    validateFile(file) {
        if (!file) {
            throw new Error('Aucun fichier fourni')
        }

        if (!this.allowedTypes.includes(file.type)) {
            throw new Error('Type de fichier non supporté. Utilisez JPEG, PNG ou WebP')
        }

        if (file.size > this.maxFileSize) {
            throw new Error(`Fichier trop volumineux. Taille maximale: ${this.maxFileSize / 1024 / 1024}MB`)
        }

        return true
    }

    /**
     * Compresse une image avant l'upload
     */
    async compressImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.onload = () => {
                // Calculer les nouvelles dimensions (max 800x800)
                const maxSize = 800
                let { width, height } = img

                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width
                        width = maxSize
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height
                        height = maxSize
                    }
                }

                canvas.width = width
                canvas.height = height

                // Dessiner l'image compressée
                ctx.drawImage(img, 0, 0, width, height)

                // Convertir en blob
                canvas.toBlob(
                    (blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        })
                        resolve(compressedFile)
                    },
                    file.type,
                    this.quality
                )
            }

            img.src = URL.createObjectURL(file)
        })
    }

    /**
     * Génère un nom de fichier unique
     */
    generateFileName(userId, originalName) {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 8)
        const extension = originalName.split('.').pop()
        return `${userId}_${timestamp}_${random}.${extension}`
    }

    /**
     * Supprime une ancienne image si elle existe
     */
    async deleteOldImage(imageUrl) {
        if (!imageUrl) return

        try {
            // Extraire le nom du fichier de l'URL
            const fileName = imageUrl.split('/').pop().split('?')[0]

            if (fileName && fileName !== 'default-avatar.png') {
                const { error } = await supabase.storage
                    .from(this.bucketName)
                    .remove([fileName])

                if (error) {
                    console.warn('Impossible de supprimer l\'ancienne image:', error)
                } else {
                    console.log('Ancienne image supprimée:', fileName)
                }
            }
        } catch (error) {
            console.warn('Erreur lors de la suppression de l\'ancienne image:', error)
        }
    }

    /**
     * Upload une image de profil avec gestion optimisée
     */
    async uploadProfileImage(file, userId, currentImageUrl = null) {
        try {
            // Validation
            this.validateFile(file)

            // Compression
            console.log('🔄 Compression de l\'image...')
            const compressedFile = await this.compressImage(file)
            console.log('✅ Image compressée:', {
                original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
            })

            // Génération du nom de fichier
            const fileName = this.generateFileName(userId, file.name)
            console.log('📝 Nom de fichier généré:', fileName)

            // Upload vers Supabase Storage
            console.log('📤 Upload vers le stockage...')
            const { data, error } = await supabase.storage
                .from(this.bucketName)
                .upload(fileName, compressedFile, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) {
                throw new Error(`Erreur d'upload: ${error.message}`)
            }

            // Obtenir l'URL publique
            const { data: urlData } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(fileName)

            const publicUrl = urlData.publicUrl
            console.log('✅ Upload réussi:', publicUrl)

            // Supprimer l'ancienne image (en arrière-plan)
            if (currentImageUrl) {
                console.log('🗑️ Suppression de l\'ancienne image...')
                this.deleteOldImage(currentImageUrl).catch(console.warn)
            }

            return {
                url: publicUrl,
                fileName: fileName,
                size: compressedFile.size,
                originalSize: file.size
            }

        } catch (error) {
            console.error('❌ Erreur lors de l\'upload:', error)
            throw error
        }
    }

    /**
     * Supprime une image de profil
     */
    async deleteProfileImage(imageUrl) {
        if (!imageUrl) return

        try {
            const fileName = imageUrl.split('/').pop().split('?')[0]

            const { error } = await supabase.storage
                .from(this.bucketName)
                .remove([fileName])

            if (error) {
                throw new Error(`Erreur de suppression: ${error.message}`)
            }

            console.log('✅ Image supprimée:', fileName)
            return true

        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error)
            throw error
        }
    }

    /**
     * Vérifie l'espace de stockage utilisé
     */
    async getStorageUsage() {
        try {
            const { data, error } = await supabase.storage
                .from(this.bucketName)
                .list('', {
                    limit: 1000
                })

            if (error) {
                throw error
            }

            const totalSize = data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0)
            const fileCount = data.length

            return {
                totalSize,
                fileCount,
                totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
            }

        } catch (error) {
            console.error('Erreur lors du calcul de l\'usage:', error)
            return { totalSize: 0, fileCount: 0, totalSizeMB: '0' }
        }
    }
}

// Instance singleton
export const imageUploadService = new ImageUploadService() 