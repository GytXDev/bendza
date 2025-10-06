import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { useResponsiveModal } from '../../hooks/useResponsiveModal';

/**
 * Composant de base pour les modals responsives
 */
const ResponsiveModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  titleSize = 'md',
  showDescription = true,
  className = '',
  ...props
}) => {
  const { getModalClasses, getTitleClasses, getDescriptionClasses } = useResponsiveModal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose} {...props}>
      <DialogContent 
        className={`${getModalClasses(size)} ${className}`}
        aria-describedby={description ? "modal-description" : undefined}
      >
        <DialogHeader>
          {description && (
            <p id="modal-description" className="sr-only">
              {description}
            </p>
          )}
          <DialogTitle className={getTitleClasses(titleSize)}>
            {title}
          </DialogTitle>
          {showDescription && description && (
            <DialogDescription className={getDescriptionClasses()}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {children}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Composant pour les boutons d'action responsives
 */
export const ResponsiveModalActions = ({
  children,
  layout = 'row',
  className = '',
  ...props
}) => {
  const { getButtonContainerClasses } = useResponsiveModal();

  return (
    <div className={`${getButtonContainerClasses(layout)} ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Composant pour les boutons responsives
 */
export const ResponsiveModalButton = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const { getButtonClasses } = useResponsiveModal();

  return (
    <button className={`${getButtonClasses(variant)} ${className}`} {...props}>
      {children}
    </button>
  );
};

/**
 * Composant pour les logos responsives
 */
export const ResponsiveModalLogos = ({
  children,
  className = '',
  ...props
}) => {
  const { getLogoContainerClasses } = useResponsiveModal();

  return (
    <div className={`${getLogoContainerClasses()} ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Composant pour les logos individuels responsives
 */
export const ResponsiveModalLogo = ({
  src,
  alt,
  size = 'md',
  className = '',
  ...props
}) => {
  const { getLogoClasses } = useResponsiveModal();

  return (
    <img 
      src={src}
      alt={alt}
      className={`${getLogoClasses(size)} ${className}`}
      {...props}
    />
  );
};

export default ResponsiveModal;
