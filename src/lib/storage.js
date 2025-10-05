import { supabase } from './supabase'
import { optimizeMediaFile, needsOptimization, formatFileSize } from './mediaOptimizer'

// Configuration des buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  CONTENT: 'content',
  THUMBNAILS: 'thumbnails',
  BANNERS: 'banners',
  DOCUMENTS: 'documents',
  TEMP: 'temp'
}

// Types de fichiers autorisés
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  ALL: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
}

// Tailles de fichiers maximales (en bytes)
export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  THUMBNAIL: 2 * 1024 * 1024, // 2MB
  CONTENT: 100 * 1024 * 1024, // 100MB
  TEMP: 50 * 1024 * 1024 // 50MB
}

/**
 * Génère un nom de fichier unique
 */
export const generateFileName = (file, prefix = '') => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = file.name.split('.').pop()
  return `${prefix}${timestamp}_${randomString}.${extension}`
}

/**
 * Vérifie si le type de fichier est autorisé
 */
export const isFileTypeAllowed = (file, allowedTypes = ALLOWED_FILE_TYPES.ALL) => {
  return allowedTypes.includes(file.type)
}

/**
 * Vérifie si la taille du fichier est dans la limite
 */
export const isFileSizeValid = (file, maxSize) => {
  return file.size <= maxSize
}

/**
 * Upload d'un avatar utilisateur
 */
export const uploadAvatar = async (file, userId) => {
  try {
    // Vérifications
    if (!isFileTypeAllowed(file, ALLOWED_FILE_TYPES.IMAGE)) {
      throw new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.')
    }

    if (!isFileSizeValid(file, FILE_SIZE_LIMITS.AVATAR)) {
      throw new Error('Fichier trop volumineux. Taille maximale : 5MB.')
    }

    const fileName = generateFileName(file, `avatar_${userId}_`)
    const filePath = `${userId}/${fileName}`

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .getPublicUrl(filePath)

    return { publicUrl, filePath }
  } catch (error) {
    console.error('Erreur upload avatar:', error)
    throw error
  }
}

/**
 * Upload d'un fichier de contenu avec optimisation
 */
export const uploadContent = async (file, creatorId, contentType = 'content', options = {}) => {
  try {
    // Vérifications
    if (!isFileTypeAllowed(file, ALLOWED_FILE_TYPES.ALL)) {
      throw new Error('Type de fichier non autorisé.')
    }

    if (!isFileSizeValid(file, FILE_SIZE_LIMITS.CONTENT)) {
      throw new Error('Fichier trop volumineux. Taille maximale : 100MB.')
    }

    let fileToUpload = file
    let thumbnailFile = null
    let optimizationInfo = null

    // Optimiser le fichier si nécessaire
    if (needsOptimization(file) && !options.skipOptimization) {
      console.log('🔄 Optimisation du fichier en cours...')
      const optimizationResult = await optimizeMediaFile(file, options.optimization)
      
      fileToUpload = optimizationResult.optimizedFile
      thumbnailFile = optimizationResult.thumbnailFile
      
      optimizationInfo = {
        originalSize: file.size,
        optimizedSize: fileToUpload.size,
        reduction: Math.round((1 - fileToUpload.size / file.size) * 100),
        type: optimizationResult.type
      }
      
      console.log(`✅ Fichier optimisé: ${formatFileSize(file.size)} → ${formatFileSize(fileToUpload.size)} (${optimizationInfo.reduction}% de réduction)`)
    }

    // Upload du fichier principal
    const fileName = generateFileName(fileToUpload, `${contentType}_${creatorId}_`)
    const filePath = `${creatorId}/${contentType}/${fileName}`

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.CONTENT)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Upload de la miniature si disponible
    let thumbnailPath = null
    let thumbnailUrl = null
    
    if (thumbnailFile) {
      const thumbnailFileName = generateFileName(thumbnailFile, `thumb_${creatorId}_`)
      thumbnailPath = `${creatorId}/thumbnails/${thumbnailFileName}`
      
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from(STORAGE_BUCKETS.THUMBNAILS)
        .upload(thumbnailPath, thumbnailFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (thumbnailError) {
        console.warn('Erreur upload miniature:', thumbnailError)
      } else {
        // Récupérer l'URL publique de la miniature
        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKETS.THUMBNAILS)
          .getPublicUrl(thumbnailPath)
        
        thumbnailUrl = publicUrl
      }
    }

    // Récupérer l'URL signée (privée) du fichier principal
    const { data: { signedUrl } } = await supabase.storage
      .from(STORAGE_BUCKETS.CONTENT)
      .createSignedUrl(filePath, 3600) // 1 heure

    return { 
      signedUrl, 
      filePath, 
      fileName,
      thumbnailPath,
      thumbnailUrl,
      optimizationInfo
    }
  } catch (error) {
    console.error('Erreur upload content:', error)
    throw error
  }
}

/**
 * Upload d'une miniature
 */
export const uploadThumbnail = async (file, creatorId, contentId) => {
  try {
    // Vérifications
    if (!isFileTypeAllowed(file, ALLOWED_FILE_TYPES.IMAGE)) {
      throw new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.')
    }

    if (!isFileSizeValid(file, FILE_SIZE_LIMITS.THUMBNAIL)) {
      throw new Error('Fichier trop volumineux. Taille maximale : 2MB.')
    }

    const fileName = generateFileName(file, `thumb_${contentId}_`)
    const filePath = `${creatorId}/thumbnails/${fileName}`

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.THUMBNAILS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.THUMBNAILS)
      .getPublicUrl(filePath)

    return { publicUrl, filePath }
  } catch (error) {
    console.error('Erreur upload thumbnail:', error)
    throw error
  }
}

/**
 * Upload d'une bannière de créateur
 */
export const uploadBanner = async (file, creatorId) => {
  try {
    // Vérifications
    if (!isFileTypeAllowed(file, ALLOWED_FILE_TYPES.IMAGE)) {
      throw new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.')
    }

    if (!isFileSizeValid(file, 10 * 1024 * 1024)) { // 10MB max pour bannière
      throw new Error('Fichier trop volumineux. Taille maximale : 10MB.')
    }

    const fileName = generateFileName(file, `banner_${creatorId}_`)
    const filePath = `${creatorId}/${fileName}`

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.BANNERS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.BANNERS)
      .getPublicUrl(filePath)

    return { publicUrl, filePath }
  } catch (error) {
    console.error('Erreur upload banner:', error)
    throw error
  }
}

/**
 * Upload d'un document (justificatif, contrat)
 */
export const uploadDocument = async (file, userId, documentType = 'document') => {
  try {
    // Vérifications
    if (!isFileTypeAllowed(file, ['application/pdf', 'image/jpeg', 'image/png'])) {
      throw new Error('Type de fichier non autorisé. Utilisez PDF, JPEG ou PNG.')
    }

    if (!isFileSizeValid(file, 20 * 1024 * 1024)) { // 20MB max pour documents
      throw new Error('Fichier trop volumineux. Taille maximale : 20MB.')
    }

    const fileName = generateFileName(file, `${documentType}_${userId}_`)
    const filePath = `${userId}/${documentType}/${fileName}`

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    return { filePath, fileName }
  } catch (error) {
    console.error('Erreur upload document:', error)
    throw error
  }
}

/**
 * Upload d'un fichier temporaire
 */
export const uploadTempFile = async (file, userId) => {
  try {
    if (!isFileSizeValid(file, FILE_SIZE_LIMITS.TEMP)) {
      throw new Error('Fichier trop volumineux. Taille maximale : 50MB.')
    }

    const fileName = generateFileName(file, `temp_${userId}_`)
    const filePath = `${userId}/temp/${fileName}`

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.TEMP)
      .upload(filePath, file, {
        cacheControl: '1800', // 30 minutes
        upsert: false
      })

    if (error) throw error

    return { filePath, fileName }
  } catch (error) {
    console.error('Erreur upload temp:', error)
    throw error
  }
}

/**
 * Supprimer un fichier
 */
export const deleteFile = async (bucket, filePath) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) throw error

    return true
  } catch (error) {
    console.error('Erreur suppression fichier:', error)
    throw error
  }
}

/**
 * Récupérer l'URL publique d'un fichier
 */
export const getPublicUrl = (bucket, filePath) => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Récupérer l'URL signée d'un fichier privé
 */
export const getSignedUrl = async (bucket, filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (error) throw error

    return data.signedUrl
  } catch (error) {
    console.error('Erreur récupération URL signée:', error)
    throw error
  }
}

/**
 * Lister les fichiers d'un bucket
 */
export const listFiles = async (bucket, folder = '') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder)

    if (error) throw error

    return data
  } catch (error) {
    console.error('Erreur listage fichiers:', error)
    throw error
  }
}

/**
 * Nettoyer les fichiers temporaires (à exécuter périodiquement)
 */
export const cleanupTempFiles = async () => {
  try {
    const { data: files } = await listFiles(STORAGE_BUCKETS.TEMP)
    
    if (!files || files.length === 0) return

    const filesToDelete = files
      .filter(file => {
        // Supprimer les fichiers de plus de 1 heure
        const fileAge = Date.now() - new Date(file.created_at).getTime()
        return fileAge > 3600000 // 1 heure en millisecondes
      })
      .map(file => file.name)

    if (filesToDelete.length > 0) {
      await deleteFile(STORAGE_BUCKETS.TEMP, filesToDelete)
      console.log(`${filesToDelete.length} fichiers temporaires supprimés`)
    }
  } catch (error) {
    console.error('Erreur nettoyage fichiers temporaires:', error)
  }
}

/**
 * Vérifier l'espace de stockage utilisé
 */
export const getStorageUsage = async (bucket) => {
  try {
    const { data: files } = await listFiles(bucket)
    
    if (!files) return 0

    return files.reduce((total, file) => total + (file.metadata?.size || 0), 0)
  } catch (error) {
    console.error('Erreur calcul usage storage:', error)
    return 0
  }
}

/**
 * Formater la taille en bytes en format lisible
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 