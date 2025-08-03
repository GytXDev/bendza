import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ message = "Chargement...", size = "default" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-8 h-8",
    large: "w-12 h-12"
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className={`${sizeClasses[size]} border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
        <div className="text-white text-lg">{message}</div>
      </motion.div>
    </div>
  );
};

export default LoadingSpinner; 