/**
 * Service d'optimisation des fichiers média
 * Optimise les images et vidéos avant l'upload
 */

// Configuration des optimisations
export const OPTIMIZATION_CONFIG = {
  IMAGE: {
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    QUALITY: 0.8,
    FORMAT: 'webp', // Format optimal pour le web
    FALLBACK_FORMAT: 'jpeg'
  },
  VIDEO: {
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    MAX_BITRATE: 2000000, // 2Mbps
    FORMAT: 'mp4'
  }
}

/**
 * Optimise une image
 */
export const optimizeImage = async (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Calculer les nouvelles dimensions
        let { width, height } = img
        const maxWidth = options.maxWidth || OPTIMIZATION_CONFIG.IMAGE.MAX_WIDTH
        const maxHeight = options.maxHeight || OPTIMIZATION_CONFIG.IMAGE.MAX_HEIGHT

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        // Configurer le canvas
        canvas.width = width
        canvas.height = height

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height)

        // Convertir en format optimisé
        const quality = options.quality || OPTIMIZATION_CONFIG.IMAGE.QUALITY
        const format = options.format || OPTIMIZATION_CONFIG.IMAGE.FORMAT

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Créer un nouveau fichier avec le nom optimisé
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, `.${format}`), {
                type: `image/${format}`,
                lastModified: Date.now()
              })
              
              resolve(optimizedFile)
            } else {
              reject(new Error('Erreur lors de l\'optimisation de l\'image'))
            }
          },
          `image/${format}`,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Optimise une vidéo (compression basique)
 */
export const optimizeVideo = async (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.onloadedmetadata = () => {
      try {
        // Calculer les nouvelles dimensions
        let { videoWidth, videoHeight } = video
        const maxWidth = options.maxWidth || OPTIMIZATION_CONFIG.VIDEO.MAX_WIDTH
        const maxHeight = options.maxHeight || OPTIMIZATION_CONFIG.VIDEO.MAX_HEIGHT

        if (videoWidth > maxWidth || videoHeight > maxHeight) {
          const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight)
          videoWidth = Math.floor(videoWidth * ratio)
          videoHeight = Math.floor(videoHeight * ratio)
        }

        // Pour les vidéos, on utilise une approche différente
        // On génère une miniature et on garde la vidéo originale mais avec des métadonnées optimisées
        canvas.width = videoWidth
        canvas.height = videoHeight

        video.currentTime = 1 // Prendre une frame à 1 seconde
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight)
          
          // Générer une miniature
          canvas.toBlob((thumbnailBlob) => {
            if (thumbnailBlob) {
              const thumbnailFile = new File([thumbnailBlob], `thumb_${file.name.replace(/\.[^/.]+$/, '.jpg')}`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              
              resolve({
                originalFile: file,
                thumbnailFile,
                dimensions: { width: videoWidth, height: videoHeight },
                duration: video.duration
              })
            } else {
              reject(new Error('Erreur lors de la génération de la miniature'))
            }
          }, 'image/jpeg', 0.8)
        }
      } catch (error) {
        reject(error)
      }
    }

    video.onerror = () => reject(new Error('Erreur lors du chargement de la vidéo'))
    video.src = URL.createObjectURL(file)
  })
}

/**
 * Génère une miniature pour une vidéo
 */
export const generateVideoThumbnail = async (file, timeOffset = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.onloadedmetadata = () => {
      video.currentTime = timeOffset
      video.onseeked = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], `thumb_${file.name.replace(/\.[^/.]+$/, '.jpg')}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(thumbnailFile)
          } else {
            reject(new Error('Erreur lors de la génération de la miniature'))
          }
        }, 'image/jpeg', 0.8)
      }
    }

    video.onerror = () => reject(new Error('Erreur lors du chargement de la vidéo'))
    video.src = URL.createObjectURL(file)
  })
}

/**
 * Vérifie si un fichier a besoin d'optimisation
 */
export const needsOptimization = (file) => {
  if (file.type.startsWith('image/')) {
    // Optimiser si > 2MB ou si ce n'est pas du WebP
    return file.size > 2 * 1024 * 1024 || !file.type.includes('webp')
  }
  
  if (file.type.startsWith('video/')) {
    // Toujours générer une miniature pour les vidéos
    return true
  }
  
  return false
}

/**
 * Optimise un fichier selon son type
 */
export const optimizeMediaFile = async (file, options = {}) => {
  try {
    if (file.type.startsWith('image/')) {
      const optimizedImage = await optimizeImage(file, options)
      return {
        type: 'image',
        optimizedFile: optimizedImage,
        originalFile: file,
        thumbnailFile: null
      }
    }
    
    if (file.type.startsWith('video/')) {
      const result = await optimizeVideo(file, options)
      return {
        type: 'video',
        optimizedFile: result.originalFile,
        originalFile: file,
        thumbnailFile: result.thumbnailFile,
        metadata: {
          dimensions: result.dimensions,
          duration: result.duration
        }
      }
    }
    
    throw new Error('Type de fichier non supporté pour l\'optimisation')
  } catch (error) {
    console.error('Erreur optimisation média:', error)
    throw error
  }
}

/**
 * Calcule la taille optimisée estimée
 */
export const estimateOptimizedSize = (file) => {
  if (file.type.startsWith('image/')) {
    // Estimation basée sur la compression WebP (généralement 25-35% de réduction)
    return Math.floor(file.size * 0.3)
  }
  
  if (file.type.startsWith('video/')) {
    // Pour les vidéos, on garde la taille originale mais on ajoute une miniature (~100KB)
    return file.size + 100 * 1024
  }
  
  return file.size
}

/**
 * Formate la taille de fichier
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
