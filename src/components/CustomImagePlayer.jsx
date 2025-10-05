import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Eye } from 'lucide-react';

const CustomImagePlayer = ({ 
  src, 
  alt = "Image", 
  isPurchased, 
  onViewContent,
  className = "",
  blurEffect = false 
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // URL de fallback pour les images de test
  const fallbackImageUrl = `https://picsum.photos/400/600?random=${Math.random()}`;

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const toggleZoom = () => {
    if (!isPurchased) {
      if (onViewContent) onViewContent();
      return;
    }
    setIsZoomed(!isZoomed);
    // Zoom adaptatif basé sur la taille du conteneur
    const maxScale = 1.3; // Zoom maximum pour éviter le débordement
    setScale(isZoomed ? 1 : maxScale);
  };

  const resetImage = () => {
    if (!isPurchased) return;
    setScale(1);
    setRotation(0);
    setIsZoomed(false);
  };

  const rotateImage = () => {
    if (!isPurchased) return;
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!isPurchased) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      imageRef.current?.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    }
  };


  // Détecter les changements de plein écran
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleMouseEnter = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1000);
  };

  const handleImageClick = () => {
    if (!isPurchased) {
      if (onViewContent) onViewContent();
      return;
    }
    toggleZoom();
  };

  return (
    <div 
      className={`relative w-full h-full group select-none ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container avec gestion du débordement */}
      <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-lg">
        <div className="relative w-full h-full overflow-hidden">
          <img
            ref={imageRef}
            src={hasError ? fallbackImageUrl : src}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-300 cursor-pointer ${
              blurEffect ? 'blur-xl brightness-50 saturate-50' : ''
            }`}
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: 'transform 0.3s ease-in-out',
              transformOrigin: 'center center'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={handleImageClick}
                     onContextMenu={(e) => e.preventDefault()}
                     onDragStart={(e) => e.preventDefault()}
            draggable={false}
          />
        </div>
      </div>

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
              <Eye className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Image non disponible</h3>
            <p className="text-gray-300 text-sm mb-4">Cette image ne peut pas être affichée actuellement</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Bouton central pour contenu non acheté */}
      {!isPurchased && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={onViewContent}
            className="w-20 h-20 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110"
          >
            <Eye className="w-8 h-8 text-white" />
          </button>
        </div>
      )}

      {/* Contrôles personnalisés */}
      {isPurchased && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Contrôles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Zoom */}
              <button
                onClick={toggleZoom}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                title={isZoomed ? "Réduire" : "Agrandir"}
              >
                {isZoomed ? (
                  <ZoomOut className="w-5 h-5 text-white" />
                ) : (
                  <ZoomIn className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Rotation */}
              <button
                onClick={rotateImage}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                title="Tourner"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>

              {/* Reset */}
              <button
                onClick={resetImage}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                title="Réinitialiser"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {/* Plein écran */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
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
              <Eye className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-white text-sm font-medium">Cliquez pour acheter et voir</p>
            <p className="text-gray-300 text-xs mt-1">Aperçu disponible après achat</p>
          </div>
        </div>
      )}

      {/* Indicateur de zoom */}
      {isPurchased && isZoomed && (
        <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full z-10">
          <span className="text-white text-xs font-medium">Zoom {Math.round(scale * 100)}%</span>
        </div>
      )}
    </div>
  );
};

export default CustomImagePlayer;
