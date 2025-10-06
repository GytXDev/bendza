import { useEffect, useState } from 'react';

/**
 * Hook personnalisé pour gérer la responsivité des modals
 */
export const useResponsiveModal = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640); // sm breakpoint
      setIsTablet(width >= 640 && width < 1024); // sm to lg breakpoint
    };

    // Vérifier au montage
    checkScreenSize();

    // Écouter les changements de taille
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Classes CSS pour les modals responsives
  const getModalClasses = (size = 'md') => {
    const baseClasses = 'w-[95vw] max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700 mx-4 sm:mx-auto';
    
    const sizeClasses = {
      sm: 'max-w-[425px]',
      md: 'max-w-[500px]',
      lg: 'max-w-[600px]',
      xl: 'max-w-[800px]',
      '2xl': 'max-w-[1000px]',
      '4xl': 'max-w-[1200px]'
    };

    return `${baseClasses} ${sizeClasses[size] || sizeClasses.md}`;
  };

  // Classes pour les titres responsives
  const getTitleClasses = (size = 'lg') => {
    const sizeClasses = {
      sm: 'text-lg sm:text-xl',
      md: 'text-xl sm:text-2xl',
      lg: 'text-2xl sm:text-3xl'
    };

    return sizeClasses[size] || sizeClasses.md;
  };

  // Classes pour les descriptions responsives
  const getDescriptionClasses = () => {
    return 'text-sm sm:text-base text-gray-400';
  };

  // Classes pour les boutons responsives
  const getButtonClasses = (variant = 'default') => {
    const baseClasses = 'w-full sm:flex-1 py-3 sm:py-2';
    
    const variantClasses = {
      default: 'bg-orange-500 hover:bg-orange-600 text-white',
      outline: 'border-gray-700 text-gray-300 hover:bg-gray-800',
      ghost: 'text-gray-300 hover:bg-gray-800'
    };

    return `${baseClasses} ${variantClasses[variant] || variantClasses.default}`;
  };

  // Classes pour les conteneurs de boutons
  const getButtonContainerClasses = (layout = 'row') => {
    const layoutClasses = {
      row: 'flex flex-col sm:flex-row gap-3',
      column: 'flex flex-col gap-3',
      grid: 'grid grid-cols-1 sm:grid-cols-2 gap-3'
    };

    return layoutClasses[layout] || layoutClasses.row;
  };

  // Classes pour les icônes responsives
  const getIconSize = (size = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8'
    };

    return sizeClasses[size] || sizeClasses.md;
  };

  // Classes pour les logos responsives
  const getLogoClasses = (size = 'md') => {
    const sizeClasses = {
      sm: 'w-6 h-6 sm:w-8 sm:h-8',
      md: 'w-8 h-8 sm:w-10 sm:h-10',
      lg: 'w-10 h-10 sm:w-12 sm:h-12'
    };

    return `${sizeClasses[size] || sizeClasses.md} object-contain`;
  };

  // Classes pour les conteneurs de logos
  const getLogoContainerClasses = () => {
    return 'flex justify-center items-center flex-wrap gap-2 sm:gap-3';
  };

  return {
    isMobile,
    isTablet,
    getModalClasses,
    getTitleClasses,
    getDescriptionClasses,
    getButtonClasses,
    getButtonContainerClasses,
    getIconSize,
    getLogoClasses,
    getLogoContainerClasses
  };
};
