import { supabase } from './supabase'

/**
 * Service d'upload d'images optimisé
 * Gère l'upload, la compression et la suppression des anciennes images
 */
export class ImageUploadService {
    constructor() {
        this.bucketName = 'avatars'
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
        if (!imageUrl) {
            return { success: true, message: 'Aucune ancienne image' }
        }

        try {
            // Extraire le nom du fichier de l'URL
            const fileName = imageUrl.split('/').pop().split('?')[0]

            if (!fileName || fileName === 'default-avatar.png') {
                return { success: true, message: 'Image par défaut ignorée' }
            }

            // Détecter le bucket à partir de l'URL
            let bucketName = this.bucketName // fallback
            if (imageUrl.includes('/banners/')) {
                bucketName = 'banners'
            } else if (imageUrl.includes('/avatars/')) {
                bucketName = 'avatars'
            } else if (imageUrl.includes('/content/')) {
                bucketName = 'content'
            } else if (imageUrl.includes('/thumbnails/')) {
                bucketName = 'thumbnails'
            }

            // Pour le bucket content, essayer différents chemins possibles
            if (bucketName === 'content') {
                // Essayer de supprimer avec le chemin complet depuis l'URL
                const urlParts = imageUrl.split('/')
                const bucketIndex = urlParts.findIndex(part => part === 'content')
                if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                    // Reconstruire le chemin relatif dans le bucket
                    const relativePath = urlParts.slice(bucketIndex + 1).join('/')
                    
                    const { error: pathError } = await supabase.storage
                        .from(bucketName)
                        .remove([relativePath])
                    
                    if (!pathError) {
                        return { success: true, fileName: relativePath, bucket: bucketName }
                    }
                }
                
                // Essayer avec juste le nom du fichier
                const { error: fileNameError } = await supabase.storage
                    .from(bucketName)
                    .remove([fileName])
                
                if (!fileNameError) {
                    return { success: true, fileName, bucket: bucketName }
                }
                
                // Essayer de lister les fichiers pour trouver le bon chemin
                try {
                    const { data: files, error: listError } = await supabase.storage
                        .from(bucketName)
                        .list('', { search: fileName })
                    
                    if (!listError && files && files.length > 0) {
                        for (const file of files) {
                            if (file.name === fileName) {
                                const { error: deleteError } = await supabase.storage
                                    .from(bucketName)
                                    .remove([file.name])
                                
                                if (!deleteError) {
                                    return { success: true, fileName: file.name, bucket: bucketName }
                                }
                            }
                        }
                    }
                } catch (listErr) {
                    // Ignorer les erreurs de liste
                }
                
                return { success: false, error: 'Impossible de supprimer le fichier du bucket content', fileName }
            } else {
                // Pour les autres buckets, utiliser la méthode normale
                const { error } = await supabase.storage
                    .from(bucketName)
                    .remove([fileName])

                if (error) {
                    return { success: false, error: error.message, fileName }
                } else {
                    return { success: true, fileName, bucket: bucketName }
                }
            }
        } catch (error) {
            return { success: false, error: error.message, fileName: imageUrl.split('/').pop() }
        }
    }

    /**
     * Supprime un fichier de contenu avec la structure content/id_utilisateur/content/nom_du_fichier
     */
    async deleteContentFile(imageUrl, userId) {
        if (!imageUrl || !userId) {
            return { success: false, error: 'Paramètres manquants' }
        }

        try {
            // Extraire le nom du fichier de l'URL
            const fileName = imageUrl.split('/').pop().split('?')[0]
            
            if (!fileName) {
                return { success: false, error: 'Nom de fichier invalide' }
            }

            // Essayer différents chemins possibles dans le bucket content
            const possiblePaths = [
                `${userId}/content/${fileName}`,  // Structure principale
                `content/${userId}/${fileName}`,  // Structure alternative
                `${userId}/${fileName}`,          // Structure simplifiée
                fileName                          // Juste le nom du fichier
            ]

            for (const path of possiblePaths) {
                const { error } = await supabase.storage
                    .from('content')
                    .remove([path])
                
                if (!error) {
                    return { success: true, fileName: path, bucket: 'content' }
                }
            }

            // Si aucun chemin ne fonctionne, essayer de lister et supprimer
            const { data: files, error: listError } = await supabase.storage
                .from('content')
                .list('', { search: fileName })
            
            if (!listError && files && files.length > 0) {
                for (const file of files) {
                    if (file.name === fileName) {
                        const { error: deleteError } = await supabase.storage
                            .from('content')
                            .remove([file.name])
                        
                        if (!deleteError) {
                            return { success: true, fileName: file.name, bucket: 'content' }
                        }
                    }
                }
            }

            return { success: false, error: 'Fichier non trouvé ou impossible à supprimer', fileName }
            
        } catch (error) {
            return { success: false, error: error.message, fileName: imageUrl.split('/').pop() }
        }
    }

    /**
     * Upload une image de profil
     */
    async uploadProfileImage(file, userId, currentImageUrl = null) {
        return this.uploadImage(file, userId, 'avatars', currentImageUrl)
    }

    /**
     * Upload une bannière de profil
     */
    async uploadBannerImage(file, userId, currentImageUrl = null) {
        return this.uploadImage(file, userId, 'banners', currentImageUrl)
    }

    /**
     * Upload une image générique
     */
    async uploadImage(file, userId, bucketName, currentImageUrl = null) {
        try {
            // Validation
            this.validateFile(file)

            // Compression
            const compressedFile = await this.compressImage(file)
           

            // Génération du nom de fichier
            const fileName = this.generateFileName(userId, file.name)

            // Upload vers Supabase Storage
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(fileName, compressedFile, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) {
                throw new Error(`Erreur d'upload: ${error.message}`)
            }

            // Obtenir l'URL publique
            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName)

            const publicUrl = urlData.publicUrl

            // Supprimer l'ancienne image (en arrière-plan)
            let deletionResult = null
            if (currentImageUrl) {
                try {
                    deletionResult = await this.deleteOldImage(currentImageUrl)
                    if (!deletionResult.success) {
                        console.warn('⚠️ Échec de la suppression de l\'ancienne image:', deletionResult.error)
                    }
                } catch (error) {
                    console.warn('Erreur lors de la suppression de l\'ancienne image:', error)
                    deletionResult = { success: false, error: error.message }
                }
            }

            return {
                url: publicUrl,
                fileName: fileName,
                size: compressedFile.size,
                originalSize: file.size,
                deletionResult: deletionResult
            }

        } catch (error) {
            console.error('Erreur lors de l\'upload:', error)
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

            return true

        } catch (error) {
            console.error('Erreur lors de la suppression:', error)
            throw error
        }
    }

    /**
     * Nettoie les anciennes images orphelines d'un utilisateur
     * Utile pour le nettoyage périodique
     */
    async cleanupOrphanedImages(userId, bucketName = 'avatars') {
        try {
            
            // Lister tous les fichiers du bucket
            const { data: files, error: listError } = await supabase.storage
                .from(bucketName)
                .list('', {
                    limit: 1000
                })

            if (listError) {
                throw new Error(`Erreur lors de la liste des fichiers: ${listError.message}`)
            }

            // Filtrer les fichiers de l'utilisateur
            const userFiles = files.filter(file => file.name.startsWith(`${userId}_`))
            
            if (userFiles.length === 0) {
                return { cleaned: 0, total: 0 }
            }

            // Garder seulement la plus récente (basée sur le timestamp dans le nom)
            const sortedFiles = userFiles.sort((a, b) => {
                const timestampA = parseInt(a.name.split('_')[1]) || 0
                const timestampB = parseInt(b.name.split('_')[1]) || 0
                return timestampB - timestampA
            })

            const filesToDelete = sortedFiles.slice(1) // Garder la première (plus récente)
            
            if (filesToDelete.length === 0) {
                return { cleaned: 0, total: userFiles.length }
            }

            // Supprimer les anciennes images
            const fileNames = filesToDelete.map(file => file.name)
            const { error: deleteError } = await supabase.storage
                .from(bucketName)
                .remove(fileNames)

            if (deleteError) {
                throw new Error(`Erreur lors de la suppression: ${deleteError.message}`)
            }

            return { 
                cleaned: filesToDelete.length, 
                total: userFiles.length,
                deletedFiles: fileNames
            }

        } catch (error) {
            console.error('Erreur lors du nettoyage des images orphelines:', error)
            throw error
        }
    }

    /**
     * Supprime complètement un contenu et toutes ses données associées
     * @param {string} contentId - ID du contenu à supprimer
     * @param {string} contentUrl - URL du média principal (optionnel)
     * @returns {Object} Résultat de la suppression
     */
    async deleteContentCompletely(contentId, contentUrl = null) {
        const results = {
            contentDeleted: false,
            transactionsDeleted: false,
            purchasesDeleted: false,
            storageDeleted: false,
            errors: [],
            blocked: false
        };

        try {
            // 1. Compter les transactions et purchases pour information (mais ne pas bloquer)
            try {
                const { data: transactions, error: transactionsError } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('content_id', contentId);

                const { data: purchases, error: purchasesError } = await supabase
                    .from('purchases')
                    .select('id')
                    .eq('content_id', contentId);

                // Ignorer les erreurs de vérification
            } catch (error) {
                // Ignorer les erreurs de vérification
            }

            // 2. Supprimer d'abord les purchases (ils référencent les transactions)
            try {
                const { error: purchasesError } = await supabase
                    .from('purchases')
                    .delete()
                    .eq('content_id', contentId);

                if (purchasesError) {
                    results.errors.push(`Purchases: ${purchasesError.message}`);
                } else {
                    results.purchasesDeleted = true;
                }
            } catch (error) {
                results.errors.push(`Purchases: ${error.message}`);
            }

            // 3. Ensuite supprimer les transactions (maintenant qu'elles ne sont plus référencées)
            try {
                const { error: transactionsError } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('content_id', contentId);

                if (transactionsError) {
                    results.errors.push(`Transactions: ${transactionsError.message}`);
                } else {
                    results.transactionsDeleted = true;
                }
            } catch (error) {
                results.errors.push(`Transactions: ${error.message}`);
            }

            // 3.5. Vérifier qu'il n'y a plus de transactions référençant ce contenu
            try {
                const { data: remainingTransactions, error: checkError } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('content_id', contentId);

                if (!checkError && remainingTransactions && remainingTransactions.length > 0) {
                    // Forcer la suppression des transactions restantes
                    const { error: forceDeleteError } = await supabase
                        .from('transactions')
                        .delete()
                        .eq('content_id', contentId);
                    
                    if (forceDeleteError) {
                        results.errors.push(`Transactions forcées: ${forceDeleteError.message}`);
                    } else {
                        results.transactionsDeleted = true;
                    }
                }
            } catch (checkErr) {
                // Ignorer les erreurs de vérification
            }

            // 4. Supprimer le fichier média principal du storage
            try {
                if (contentUrl) {
                    // Récupérer l'ID du créateur pour construire le bon chemin
                    let creatorId = null;
                    try {
                        const { data: contentData, error: contentError } = await supabase
                            .from('content')
                            .select('creator_id')
                            .eq('id', contentId)
                            .single();
                        
                        if (!contentError && contentData) {
                            creatorId = contentData.creator_id;
                        }
                    } catch (err) {
                        // Ignorer les erreurs de récupération
                    }

                    // Utiliser la nouvelle fonction de suppression spécifique au contenu
                    const deletionResult = creatorId 
                        ? await this.deleteContentFile(contentUrl, creatorId)
                        : await this.deleteOldImage(contentUrl);
                    
                    if (deletionResult.success) {
                        results.storageDeleted = true;
                    } else {
                        results.errors.push(`Storage principal: ${deletionResult.error}`);
                    }
                }
            } catch (error) {
                results.errors.push(`Storage: ${error.message}`);
            }

            // 5. Vérification finale avant suppression du contenu
            try {
                // Vérifier qu'il n'y a plus de transactions
                const { data: finalTransactions, error: finalCheckError } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('content_id', contentId);

                // Vérifier qu'il n'y a plus de purchases
                const { data: finalPurchases, error: finalPurchasesError } = await supabase
                    .from('purchases')
                    .select('id')
                    .eq('content_id', contentId);

                if (!finalCheckError && !finalPurchasesError) {
                    const remainingTransactions = finalTransactions?.length || 0;
                    const remainingPurchases = finalPurchases?.length || 0;
                    
                    if (remainingTransactions > 0 || remainingPurchases > 0) {
                        results.errors.push(`Références restantes: ${remainingTransactions} transactions, ${remainingPurchases} purchases`);
                    }
                }
            } catch (checkError) {
                // Ignorer les erreurs de vérification
            }

            // 6. Suppression directe du contenu (hard delete)
            try {
                const { error: contentError } = await supabase
                    .from('content')
                    .delete()
                    .eq('id', contentId);
                
                if (contentError) {
                    results.errors.push(`Contenu: ${contentError.message}`);
                    
                    // Si c'est une erreur de contrainte de clé étrangère, essayer de supprimer les références restantes
                    if (contentError.code === '23503') {
                        // Supprimer toutes les transactions restantes
                        await supabase.from('transactions').delete().eq('content_id', contentId);
                        // Supprimer toutes les purchases restantes
                        await supabase.from('purchases').delete().eq('content_id', contentId);
                        
                        // Réessayer la suppression du contenu
                        const { error: retryError } = await supabase
                            .from('content')
                            .delete()
                            .eq('id', contentId);
                        
                        if (!retryError) {
                            results.contentDeleted = true;
                        } else {
                            results.errors.push(`Contenu après nettoyage: ${retryError.message}`);
                        }
                    }
                } else {
                    results.contentDeleted = true;
                }
            } catch (error) {
                results.errors.push(`Contenu: ${error.message}`);
            }

            return results;

        } catch (error) {
            results.errors.push(`Erreur générale: ${error.message}`);
            return results;
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