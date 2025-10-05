import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { getSignedUrl } from '../lib/storage';

const CustomVideoPlayer = ({ 
  src, 
  poster, 
  isPurchased, 
  onPlay, 
  onViewContent,
  className = "",
  blurEffect = false 
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [videoSrc, setVideoSrc] = useState(src);
  const controlsTimeoutRef = useRef(null);
  const [isPreviewMode, setIsPreviewMode] = useState(!isPurchased);
  const [previewEndTime, setPreviewEndTime] = useState(5); // 5 secondes de preview

  // URL de fallback pour les vidéos de test
  const fallbackVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  // Valider l'URL de la vidéo
  const isValidVideoUrl = (url) => {
    if (!url) return false;
    try {
      new URL(url);
      return url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) || url.includes('supabase.co');
    } catch {
      return false;
    }
  };

  // Extraire le chemin du fichier depuis l'URL Supabase
  const extractFilePathFromUrl = (url) => {
    if (!url || !url.includes('supabase.co')) return null;
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/sign\/content\/(.+)/);
      return pathMatch ? pathMatch[1] : null;
    } catch {
      return null;
    }
  };

  // Rafraîchir l'URL signée
  const refreshSignedUrl = async (originalUrl) => {
    try {
      const filePath = extractFilePathFromUrl(originalUrl);
      if (!filePath) {
        return null;
      }

      const newUrl = await getSignedUrl('content', filePath, 3600);
      return newUrl;
    } catch (error) {
      return null;
    }
  };

  // Gérer le changement d'URL et la validation
  useEffect(() => {
    if (!isValidVideoUrl(src)) {
      setVideoSrc(fallbackVideoUrl);
      setHasError(false);
    } else {
      setVideoSrc(src);
      setHasError(false);
    }
  }, [src]);

  // Gérer les événements de la vidéo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Gérer le mode preview - revenir au début après previewEndTime secondes
      if (isPreviewMode && video.currentTime >= previewEndTime) {
        video.currentTime = 0;
        video.play().catch(console.error);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setShowControls(true);
      if (onPlay) onPlay();
      
      // Masquer les contrôles après 3 secondes
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
      
      // Arrêter le timer de masquage
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = async (e) => {
      // Si c'est une URL Supabase, essayer de la rafraîchir
      if (videoSrc.includes('supabase.co') && videoSrc !== fallbackVideoUrl) {
        const newUrl = await refreshSignedUrl(videoSrc);
        if (newUrl) {
          setVideoSrc(newUrl);
          setHasError(false);
          return;
        }
      }
      
      // Si ce n'est pas déjà le fallback, essayer le fallback
      if (videoSrc !== fallbackVideoUrl) {
        setVideoSrc(fallbackVideoUrl);
        setHasError(false);
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isPurchased) {
      if (onViewContent) onViewContent();
      return;
    }

    // Si on était en mode preview, passer en mode normal
    if (isPreviewMode) {
      setIsPreviewMode(false);
      video.currentTime = 0; // Recommencer depuis le début
    }

    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !isPurchased) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    video.currentTime = newTime;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen().catch(console.error);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className={`relative w-full h-full group ${className}`}
      onMouseEnter={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      }}
      onMouseLeave={() => {
        if (isPlaying) {
          // Masquer les contrôles après 1 seconde si la vidéo joue
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 1000);
        } else {
          setShowControls(false);
        }
      }}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={videoSrc} // Utiliser l'URL de la vidéo comme poster
        className={`w-full h-full object-cover transition-all duration-300 ${
          blurEffect ? 'blur-xl brightness-50 saturate-50' : ''
        }`}
        onContextMenu={(e) => e.preventDefault()}
        preload="metadata"
        autoPlay={isPreviewMode && isPurchased}
        muted={isPreviewMode}
        loop={isPreviewMode}
      />

      {/* Overlay de chargement */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Overlay d'erreur */}
      {hasError && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <Play className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Vidéo non disponible</h3>
            <p className="text-gray-300 text-sm mb-4">Cette vidéo ne peut pas être lue actuellement</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                setVideoSrc(fallbackVideoUrl);
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Bouton Play central */}
      {!isPlaying && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-20 h-20 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </button>
        </div>
      )}

      {/* Contrôles personnalisés */}
      {isPurchased && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls || isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Barre de progression */}
          <div 
            className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-orange-500 rounded-full transition-all duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Contrôles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Temps */}
              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Volume */}
              <button
                onClick={toggleMute}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Plein écran */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
              >
                <Maximize className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour contenu non acheté */}
      {!isPurchased && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-500/30">
              <Play className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-white text-sm font-medium">Cliquez pour acheter et regarder</p>
            <p className="text-gray-300 text-xs mt-1">Preview disponible après achat</p>
          </div>
        </div>
      )}

      {/* Indicateur de mode preview */}
      {isPurchased && isPreviewMode && (
        <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full">
          <span className="text-white text-xs font-medium">Preview</span>
        </div>
      )}
    </div>
  );
};

export default CustomVideoPlayer;
