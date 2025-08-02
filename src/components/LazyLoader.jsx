import React from 'react';
import { motion } from 'framer-motion';

const LazyLoader = ({ children, loading, skeleton = null }) => {
    if (loading) {
        return skeleton || (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                >
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-white text-lg">Chargement...</div>
                </motion.div>
            </div>
        );
    }

    return children;
};

export default LazyLoader; 