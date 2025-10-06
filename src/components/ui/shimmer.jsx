import React from 'react';

/**
 * Composant de base pour l'effet shimmer
 */
const Shimmer = ({ className = '', children, ...props }) => {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Shimmer pour les cartes de contenu
 */
export const ContentCardShimmer = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
      {/* Image/Video shimmer */}
      <div className="aspect-video bg-gray-800 rounded-lg mb-4 overflow-hidden">
        <Shimmer className="w-full h-full" />
      </div>
      
      {/* Titre shimmer */}
      <div className="mb-3">
        <Shimmer className="h-6 w-3/4 rounded mb-2" />
        <Shimmer className="h-4 w-1/2 rounded" />
      </div>
      
      {/* Description shimmer */}
      <div className="mb-4 space-y-2">
        <Shimmer className="h-4 w-full rounded" />
        <Shimmer className="h-4 w-5/6 rounded" />
        <Shimmer className="h-4 w-2/3 rounded" />
      </div>
      
      {/* Informations créateur shimmer */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Shimmer className="w-8 h-8 rounded-full" />
          <div>
            <Shimmer className="h-4 w-20 rounded mb-1" />
            <Shimmer className="h-3 w-16 rounded" />
          </div>
        </div>
        <Shimmer className="h-6 w-16 rounded" />
      </div>
      
      {/* Bouton shimmer */}
      <Shimmer className="h-10 w-full rounded-lg" />
    </div>
  );
};

/**
 * Shimmer pour les cartes de contenu compactes
 */
export const CompactContentCardShimmer = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex space-x-4">
        {/* Image shimmer */}
        <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
          <Shimmer className="w-full h-full" />
        </div>
        
        {/* Contenu shimmer */}
        <div className="flex-1 min-w-0">
          <Shimmer className="h-5 w-3/4 rounded mb-2" />
          <Shimmer className="h-4 w-1/2 rounded mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shimmer className="w-6 h-6 rounded-full" />
              <Shimmer className="h-3 w-16 rounded" />
            </div>
            <Shimmer className="h-5 w-12 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Shimmer pour les listes de contenu
 */
export const ContentListShimmer = ({ count = 6 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-start space-x-4">
            {/* Image shimmer */}
            <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
              <Shimmer className="w-full h-full" />
            </div>
            
            {/* Contenu shimmer */}
            <div className="flex-1 min-w-0">
              <Shimmer className="h-5 w-4/5 rounded mb-2" />
              <Shimmer className="h-4 w-3/4 rounded mb-2" />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shimmer className="w-5 h-5 rounded-full" />
                  <Shimmer className="h-3 w-20 rounded" />
                </div>
                <Shimmer className="h-4 w-16 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Shimmer pour les statistiques
 */
export const StatsShimmer = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 border border-gray-700">
          <Shimmer className="h-8 w-12 rounded mb-2" />
          <Shimmer className="h-4 w-16 rounded mb-1" />
          <Shimmer className="h-3 w-20 rounded" />
        </div>
      ))}
    </div>
  );
};

/**
 * Shimmer pour les profils utilisateur
 */
export const ProfileShimmer = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center space-x-4 mb-6">
        <Shimmer className="w-16 h-16 rounded-full" />
        <div>
          <Shimmer className="h-6 w-32 rounded mb-2" />
          <Shimmer className="h-4 w-24 rounded" />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="text-center">
            <Shimmer className="h-6 w-8 rounded mb-1 mx-auto" />
            <Shimmer className="h-3 w-12 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Shimmer pour les commentaires
 */
export const CommentShimmer = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex space-x-3">
          <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Shimmer className="h-4 w-20 rounded" />
              <Shimmer className="h-3 w-16 rounded" />
            </div>
            <Shimmer className="h-4 w-full rounded mb-1" />
            <Shimmer className="h-4 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Shimmer pour les boutons
 */
export const ButtonShimmer = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32'
  };
  
  return (
    <Shimmer className={`${sizeClasses[size]} rounded-lg`} />
  );
};

/**
 * Shimmer pour les inputs
 */
export const InputShimmer = () => {
  return (
    <Shimmer className="h-10 w-full rounded-lg" />
  );
};

/**
 * Shimmer pour les modals
 */
export const ModalShimmer = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700 max-w-md w-full">
      {/* Titre shimmer */}
      <Shimmer className="h-6 w-3/4 rounded mb-4" />
      
      {/* Contenu shimmer */}
      <div className="space-y-4 mb-6">
        <Shimmer className="h-4 w-full rounded" />
        <Shimmer className="h-4 w-5/6 rounded" />
        <Shimmer className="h-4 w-4/5 rounded" />
      </div>
      
      {/* Boutons shimmer */}
      <div className="flex space-x-3">
        <Shimmer className="h-10 flex-1 rounded-lg" />
        <Shimmer className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  );
};

export default Shimmer;
