import { useEffect, useRef } from 'react';
import { useViews } from '@/hooks/useViews';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Composant pour enregistrer automatiquement les vues lors de la visualisation d'images
 * @param {Object} props
 * @param {string} props.contentId - ID du contenu
 * @param {string} props.creatorId - ID du créateur du contenu
 * @param {number} props.minViewTime - Temps minimum de visualisation en secondes (défaut: 3)
 * @param {boolean} props.autoTrack - Activer le suivi automatique (défaut: true)
 * @param {boolean} props.isPurchased - Si le contenu est acheté (défaut: true)
 */
const ImageViewTracker = ({ 
    contentId, 
    creatorId, 
    minViewTime = 3, 
    autoTrack = true,
    isPurchased = true
}) => {
    const { recordView } = useViews();
    const { user } = useAuth();
    const hasRecordedView = useRef(false);
    const viewStartTime = useRef(null);
    const viewTimer = useRef(null);
    const isVisible = useRef(false);

    useEffect(() => {
        if (!autoTrack || !user || !contentId || !isPurchased || hasRecordedView.current) {
            return;
        }

        // Fonction pour démarrer le suivi de visualisation
        const startViewing = () => {
            if (!isVisible.current) {
                isVisible.current = true;
                viewStartTime.current = Date.now();
                
                // Enregistrer la vue après le temps minimum
                viewTimer.current = setTimeout(async () => {
                    if (!hasRecordedView.current && isVisible.current) {
                        const result = await recordView(contentId, creatorId);
                        if (result.success) {
                            hasRecordedView.current = true;
                        }
                    }
                }, minViewTime * 1000);
            }
        };

        // Fonction pour arrêter le suivi de visualisation
        const stopViewing = () => {
            if (isVisible.current) {
                isVisible.current = false;
                if (viewTimer.current) {
                    clearTimeout(viewTimer.current);
                    viewTimer.current = null;
                }
            }
        };

        // Observer pour détecter quand l'image est visible
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        startViewing();
                    } else {
                        stopViewing();
                    }
                });
            },
            {
                threshold: 0.5,
                rootMargin: '0px'
            }
        );

        // Trouver l'élément image dans le DOM
        const imageElement = document.querySelector(`img[data-content-id="${contentId}"]`);
        
        if (imageElement) {
            observer.observe(imageElement);
        }

        // Écouter les événements de clic sur l'image (pour zoom, etc.)
        const handleImageClick = () => {
            if (!hasRecordedView.current) {
                // Enregistrer immédiatement la vue si l'utilisateur interagit avec l'image
                recordView(contentId, creatorId).then(result => {
                    if (result.success) {
                        hasRecordedView.current = true;
                    }
                });
            }
        };

        // Écouter les événements de survol (hover)
        const handleImageHover = () => {
            if (!hasRecordedView.current) {
                startViewing();
            }
        };

        const handleImageLeave = () => {
            stopViewing();
        };

        if (imageElement) {
            imageElement.addEventListener('click', handleImageClick);
            imageElement.addEventListener('mouseenter', handleImageHover);
            imageElement.addEventListener('mouseleave', handleImageLeave);
        }

        // Nettoyage
        return () => {
            if (imageElement) {
                observer.unobserve(imageElement);
                imageElement.removeEventListener('click', handleImageClick);
                imageElement.removeEventListener('mouseenter', handleImageHover);
                imageElement.removeEventListener('mouseleave', handleImageLeave);
            }
            stopViewing();
        };
    }, [contentId, creatorId, minViewTime, autoTrack, user, isPurchased, recordView]);

    // Fonction pour enregistrer manuellement une vue
    const recordViewManually = async () => {
        if (!hasRecordedView.current) {
            const result = await recordView(contentId, creatorId);
            if (result.success) {
                hasRecordedView.current = true;
            }
            return result;
        }
        return { success: true, message: 'Vue déjà enregistrée' };
    };

    // Ce composant ne rend rien visuellement
    return null;
};

export default ImageViewTracker;
