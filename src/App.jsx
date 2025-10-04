
import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { motion } from 'framer-motion'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Toaster } from './components/ui/toaster'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingScreen from './components/LoadingScreen'

// Import direct des pages (sans lazy loading)
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import CreatorDashboard from './pages/CreatorDashboard'
import Profile from './pages/Profile'
import BecomeCreator from './pages/BecomeCreator'
import EmailConfirmation from './pages/EmailConfirmation'

// Components
import RequireAuth from './components/RequireAuth'
import Layout from './components/Layout'

// App Content component that handles auth loading
const AppContent = () => {
    const { loading } = useAuth();

    // Show loading screen during initial auth check
    if (loading) {
        return <LoadingScreen message="Initialisation de la plateforme..." />;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/confirm-email" element={<EmailConfirmation />} />
                
                {/* Routes protégées */}
                <Route path="/" element={
                    <Layout>
                        <HomePage />
                    </Layout>
                } />
                
                <Route path="/profile" element={
                    <RequireAuth>
                        <Layout>
                            <Profile />
                        </Layout>
                    </RequireAuth>
                } />
                
                <Route path="/creator" element={
                    <RequireAuth>
                        <Layout>
                            <CreatorDashboard />
                        </Layout>
                    </RequireAuth>
                } />
                
                <Route path="/become-creator" element={
                    <RequireAuth>
                        <Layout>
                            <BecomeCreator />
                        </Layout>
                    </RequireAuth>
                } />
                
                {/* 404 route */}
                <Route path="*" element={
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="min-h-screen flex flex-col items-center justify-center p-4"
                    >
                        <h1 className="text-5xl font-bold text-orange-500 mb-4">404</h1>
                        <p className="text-xl text-gray-200 mb-2">Page non trouvée</p>
                        <p className="text-md text-gray-400 mb-8">
                            La page que vous recherchez n'existe pas.
                        </p>
                        <Link 
                            to="/" 
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                            Retour à l'accueil
                        </Link>
                    </motion.div>
                } />
            </Routes>
            <Toaster />
        </div>
    );
};

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <Helmet>
                        <title>BENDZA - Crée. Publie. Encaisse.</title>
                        <meta name="description" content="BENDZA: Crée. Publie. Encaisse. Plateforme de publication et monétisation de contenus exclusifs pour influenceurs." />
                    </Helmet>
                    <AppContent />
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App;
