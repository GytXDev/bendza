
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
    const { user, userProfile } = useAuth();

    return (
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className='text-center space-y-8'
        >
            <Helmet>
                <title>Accueil - BENDZA</title>
                <meta name="description" content="Bienvenue sur BENDZA - Crée. Publie. Encaisse. Découvrez des contenus exclusifs et monétisez votre passion." />
            </Helmet>
            <div className='flex justify-center items-center'>
                <img alt="BENDZA logo" className="w-32" src="/logo.png" />
            </div>

            <h1 className='text-5xl md:text-7xl font-bold text-orange-500'>
                BENDZA
            </h1>

            <motion.p
                className='text-xl md:text-2xl text-beige-200 max-w-2xl mx-auto'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                Crée. Publie. Encaisse.
            </motion.p>

            <motion.p
                className='text-md text-gray-400 max-w-lg mx-auto'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
            >
                La plateforme de monétisation de contenu pour les influenceurs.
            </motion.p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {user ? (
                    // Utilisateur connecté
                    <>
                        <Link to="/explore">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-600 transition-all duration-300"
                            >
                                Découvrir
                            </motion.button>
                        </Link>
                        {userProfile?.is_creator ? (
                            // Utilisateur créateur
                            <Link to="/dashboard">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 bg-transparent border-2 border-orange-500 text-orange-500 font-semibold rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-300"
                                >
                                    Mon Dashboard
                                </motion.button>
                            </Link>
                        ) : (
                            // Utilisateur non créateur
                            <Link to="/become-creator">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 bg-transparent border-2 border-orange-500 text-orange-500 font-semibold rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-300"
                                >
                                    Devenir Créateur
                                </motion.button>
                            </Link>
                        )}
                    </>
                ) : (
                    // Utilisateur non connecté
                    <>
                        <Link to="/login">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-600 transition-all duration-300"
                            >
                                Se connecter
                            </motion.button>
                        </Link>
                        <Link to="/register">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-transparent border-2 border-orange-500 text-orange-500 font-semibold rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-300"
                            >
                                S'inscrire
                            </motion.button>
                        </Link>
                    </>
                )}
            </div>
        </motion.div>
    );
}

export default HomePage;
