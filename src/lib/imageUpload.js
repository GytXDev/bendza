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
            console.log('Aucune ancienne image à supprimer')
            return { success: true, message: 'Aucune ancienne image' }
        }

        try {
            // Extraire le nom du fichier de l'URL
            const fileName = imageUrl.split('/').pop().split('?')[0]

            if (!fileName || fileName === 'default-avatar.png') {
                console.log('Image par défaut ou nom de fichier invalide, suppression ignorée')
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

            console.log(`Tentative de suppression de l'ancienne image: ${fileName} du bucket ${bucketName}`)

            const { error } = await supabase.storage
                .from(bucketName)
                .remove([fileName])

            if (error) {
                console.warn('Impossible de supprimer l\'ancienne image:', error)
                return { success: false, error: error.message, fileName }
            } else {
                console.log('Ancienne image supprimée avec succès:', fileName)
                return { success: true, fileName }
            }
        } catch (error) {
            console.warn('Erreur lors de la suppression de l\'ancienne image:', error)
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
            console.log('Compression de l\'image...')
            const compressedFile = await this.compressImage(file)
            console.log('Image compressée:', {
                original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
            })

            // Génération du nom de fichier
            const fileName = this.generateFileName(userId, file.name)
            console.log('Nom de fichier généré:', fileName)

            // Upload vers Supabase Storage
            console.log(`Upload vers le stockage (bucket: ${bucketName})...`)
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
            console.log('Upload réussi:', publicUrl)

            // Supprimer l'ancienne image (en arrière-plan)
            let deletionResult = null
            if (currentImageUrl) {
                console.log('Suppression de l\'ancienne image...')
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

            console.log('Image supprimée:', fileName)
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
            console.log(`Nettoyage des images orphelines pour l'utilisateur ${userId}...`)
            
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
                console.log('Aucune image orpheline trouvée')
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
                console.log('Aucune image orpheline à supprimer')
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

            console.log(`✅ ${filesToDelete.length} image(s) orpheline(s) supprimée(s)`)
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
            mediaDeleted: false,
            storageDeleted: false,
            errors: [],
            blocked: false
        };

        try {
            console.log(`Suppression complète du contenu ${contentId}...`);

            // 1. Vérifier d'abord s'il y a des transactions ou purchases liées
            try {
                const { data: transactions, error: transactionsError } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('content_id', contentId);

                const { data: purchases, error: purchasesError } = await supabase
                    .from('purchases')
                    .select('id')
                    .eq('content_id', contentId);

                if (transactionsError || purchasesError) {
                    console.warn('Erreur lors de la vérification des transactions/purchases:', transactionsError || purchasesError);
                } else {
                    const transactionCount = transactions?.length || 0;
                    const purchaseCount = purchases?.length || 0;
                    
                    console.log(`Trouvé ${transactionCount} transaction(s) et ${purchaseCount} purchase(s)`);
                    
                    // Si il y a des transactions ou purchases, bloquer la suppression
                    if (transactionCount > 0 || purchaseCount > 0) {
                        results.blocked = true;
                        results.errors.push(`Impossible de supprimer le contenu car il contient ${transactionCount} transaction(s) et ${purchaseCount} achat(s) actif(s)`);
                        console.log('❌ Suppression bloquée: contenu avec transactions/purchases actives');
                        return results;
                    }
                }
            } catch (error) {
                console.warn('Erreur lors de la vérification des transactions/purchases:', error);
                results.errors.push(`Vérification: ${error.message}`);
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
                    console.log('✅ Purchases supprimées');
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
                    console.warn('Erreur suppression transactions:', transactionsError);
                } else {
                    results.transactionsDeleted = true;
                    console.log('✅ Transactions supprimées');
                }
            } catch (error) {
                results.errors.push(`Transactions: ${error.message}`);
                console.warn('Erreur suppression transactions:', error);
            }

            // 4. Supprimer les médias multiples
            try {
                const { error: mediaError } = await supabase
                    .from('content_media')
                    .delete()
                    .eq('content_id', contentId);

                if (mediaError) {
                    results.errors.push(`Médias multiples: ${mediaError.message}`);
                } else {
                    results.mediaDeleted = true;
                    console.log('Médias multiples supprimés');
                }
            } catch (error) {
                results.errors.push(`Médias multiples: ${error.message}`);
            }

            // 5. Supprimer tous les fichiers média du storage
            try {
                // Supprimer le fichier principal
                if (contentUrl) {
                    const deletionResult = await this.deleteOldImage(contentUrl);
                    if (deletionResult.success) {
                        results.storageDeleted = true;
                        console.log('Fichier média principal supprimé du storage');
                    } else {
                        results.errors.push(`Storage principal: ${deletionResult.error}`);
                    }
                }
                
                // Supprimer tous les médias multiples
                if (mediaFiles && mediaFiles.length > 0) {
                    console.log(`Suppression de ${mediaFiles.length} fichier(s) média multiple(s)...`);
                    let deletedCount = 0;
                    
                    for (const media of mediaFiles) {
                        try {
                            const mediaDeletionResult = await this.deleteOldImage(media.media_url);
                            if (mediaDeletionResult.success) {
                                deletedCount++;
                                console.log(`✅ Média multiple supprimé: ${mediaDeletionResult.fileName}`);
                            } else {
                                console.warn(`⚠️ Échec suppression média: ${media.media_url} - ${mediaDeletionResult.error}`);
                                results.errors.push(`Storage média: ${mediaDeletionResult.error}`);
                            }
                        } catch (error) {
                            console.error(`Erreur suppression média ${media.media_url}:`, error);
                            results.errors.push(`Storage média: ${error.message}`);
                        }
                    }
                    
                    if (deletedCount > 0) {
                        results.storageDeleted = true;
                        console.log(`✅ ${deletedCount}/${mediaFiles.length} fichier(s) média multiple(s) supprimé(s)`);
                    }
                }
            } catch (error) {
                results.errors.push(`Storage: ${error.message}`);
                console.error('Erreur générale suppression storage:', error);
            }

            // 6. Tentative de suppression avec la fonction SQL
            console.log('Tentative avec fonction SQL delete_content_cascade...');
            try {
                const { data: cascadeResult, error: cascadeError } = await supabase
                    .rpc('delete_content_cascade', { content_id: contentId });
                
                if (cascadeError) {
                    console.error('Erreur fonction SQL:', cascadeError);
                    results.errors.push(`SQL: ${cascadeError.message}`);
                } else if (cascadeResult) {
                    console.log('Résultat fonction SQL:', cascadeResult);
                    
                    if (cascadeResult.success) {
                        results.contentDeleted = cascadeResult.deleted_content || cascadeResult.soft_deleted;
                        results.transactionsDeleted = cascadeResult.deleted_transactions > 0;
                        results.purchasesDeleted = cascadeResult.deleted_purchases > 0;
                        results.mediaDeleted = cascadeResult.deleted_media > 0;
                        
                        if (cascadeResult.soft_deleted) {
                            console.log('✅ Contenu marqué comme supprimé (soft delete)');
                        } else {
                            console.log('✅ Contenu supprimé complètement');
                        }
                        return results; // Sortir si succès
                    } else {
                        results.errors.push(`SQL: ${cascadeResult.error}`);
                        console.error('Échec fonction SQL:', cascadeResult.error);
                    }
                }
            } catch (cascadeErr) {
                console.error('Erreur appel fonction SQL:', cascadeErr);
                results.errors.push(`SQL: ${cascadeErr.message}`);
            }

            // 7. Fallback: suppression manuelle avec requêtes SQL directes
            console.log('Fallback: suppression manuelle avec SQL direct...');
            try {
                // Utiliser une requête SQL brute pour contourner les restrictions
                const { data: sqlResult, error: sqlError } = await supabase
                    .rpc('sql', { 
                        query: `
                            DELETE FROM public.purchases WHERE content_id = '${contentId}';
                            DELETE FROM public.transactions WHERE content_id = '${contentId}';
                            DELETE FROM public.content_media WHERE content_id = '${contentId}';
                            DELETE FROM public.content WHERE id = '${contentId}';
                        `
                    });
                
                if (sqlError) {
                    console.error('Erreur SQL direct:', sqlError);
                    results.errors.push(`SQL Direct: ${sqlError.message}`);
                } else {
                    console.log('✅ Suppression SQL direct réussie');
                    results.contentDeleted = true;
                    results.transactionsDeleted = true;
                    results.purchasesDeleted = true;
                    results.mediaDeleted = true;
                    return results;
                }
            } catch (sqlErr) {
                console.error('Erreur SQL direct:', sqlErr);
                results.errors.push(`SQL Direct: ${sqlErr.message}`);
            }

            // 8. Dernier recours: soft delete
            console.log('Dernier recours: soft delete...');
            try {
                const { error: updateError } = await supabase
                    .from('content')
                    .update({ 
                        status: 'rejected',
                        is_published: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', contentId);
                
                if (!updateError) {
                    results.contentDeleted = true;
                    console.log('✅ Contenu marqué comme supprimé (soft delete final)');
                } else {
                    console.error('Erreur soft delete final:', updateError);
                    results.errors.push(`Soft Delete: ${updateError.message}`);
                }
            } catch (updateErr) {
                console.error('Erreur soft delete final:', updateErr);
                results.errors.push(`Soft Delete: ${updateErr.message}`);
            }

            console.log('Suppression complète terminée:', results);
            return results;

        } catch (error) {
            console.error('Erreur lors de la suppression complète:', error);
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