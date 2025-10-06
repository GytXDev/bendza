import { useEffect, useRef } from 'react';
import { useViews } from '@/hooks/useViews';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Composant pour enregistrer automatiquement les vues lors de la lecture de contenu
 * @param {Object} props
 * @param {string} props.contentId - ID du contenu
 * @param {string} props.creatorId - ID du créateur du contenu
 * @param {number} props.minWatchTime - Temps minimum de visionnage en secondes (défaut: 10)
 * @param {boolean} props.autoTrack - Activer le suivi automatique (défaut: true)
 */
const ViewTracker = ({ 
    contentId, 
    creatorId, 
    minWatchTime = 10, 
    autoTrack = true 
}) => {
    const { recordView } = useViews();
    const { user } = useAuth();
    const hasRecordedView = useRef(false);
    const watchStartTime = useRef(null);
    const watchTimer = useRef(null);

    useEffect(() => {
        if (!autoTrack || !user || !contentId || hasRecordedView.current) {
            return;
        }

        // Démarrer le timer de visionnage
        const startWatching = () => {
            watchStartTime.current = Date.now();
            
            // Enregistrer la vue après le temps minimum
            watchTimer.current = setTimeout(async () => {
                if (!hasRecordedView.current) {
                    const result = await recordView(contentId, creatorId);
                    if (result.success) {
                        hasRecordedView.current = true;
                    }
                }
            }, minWatchTime * 1000);
        };

        // Arrêter le timer de visionnage
        const stopWatching = () => {
            if (watchTimer.current) {
                clearTimeout(watchTimer.current);
                watchTimer.current = null;
            }
        };

        // Écouter les événements de lecture
        const handlePlay = () => {
            if (!hasRecordedView.current) {
                startWatching();
            }
        };

        const handlePause = () => {
            stopWatching();
        };

        const handleEnded = () => {
            stopWatching();
            // Enregistrer la vue si elle n'a pas encore été enregistrée
            if (!hasRecordedView.current) {
                recordView(contentId, creatorId).then(result => {
                    if (result.success) {
                        hasRecordedView.current = true;
                    }
                });
            }
        };

        // Trouver les éléments vidéo dans le DOM
        const videoElements = document.querySelectorAll('video');
        
        videoElements.forEach(video => {
            video.addEventListener('play', handlePlay);
            video.addEventListener('pause', handlePause);
            video.addEventListener('ended', handleEnded);
        });

        // Nettoyage
        return () => {
            videoElements.forEach(video => {
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('pause', handlePause);
                video.removeEventListener('ended', handleEnded);
            });
            stopWatching();
        };
    }, [contentId, creatorId, minWatchTime, autoTrack, user, recordView]);

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

export default ViewTracker;
