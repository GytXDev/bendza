
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

function CreatorDashboard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className='text-center space-y-8'
        >
            <Helmet>
                <title>Tableau de Bord Créateur - BENDZA</title>
                <meta name="description" content="Tableau de bord créateur BENDZA. Gérez votre contenu, vos revenus et vos abonnés." />
            </Helmet>
            <h1 className='text-5xl md:text-7xl font-bold text-orange-500'>
                Tableau de Bord Créateur
            </h1>

            <motion.p
                className='text-xl md:text-2xl text-beige-200 max-w-2xl mx-auto'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                Bienvenue, cher créateur !
            </motion.p>

            <motion.p
                className='text-md text-gray-400 max-w-lg mx-auto'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
            >
                Gérez votre univers de contenu ici.
            </motion.p>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-600 transition-all duration-300"
                onClick={() => alert("🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀")}
            >
                Voir mes statistiques
            </motion.button>
        </motion.div>
    );
}

export default CreatorDashboard;
  