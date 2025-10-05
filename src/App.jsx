import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { motion } from 'framer-motion'

import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/toaster'
import ErrorBoundary from './components/ErrorBoundary'

// Import direct des pages (sans lazy loading)
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import CreatorDashboard from './pages/CreatorDashboard'
import Profile from './pages/Profile'
import BecomeCreator from './pages/BecomeCreator'
import Cashout from './pages/Cashout'
import PaymentCallback from './pages/PaymentCallback'
import ModerationPanel from './pages/ModerationPanel'

// Components
import RequireAuth from './components/RequireAuth'
import Layout from './components/Layout'

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <Helmet>
                        <title>Bendza - Plateforme de contenu premium</title>
                        <meta name="description" content="Découvrez et créez du contenu exclusif sur Bendza" />
                    </Helmet>
                    
                    <div className="min-h-screen bg-black text-white">
                        <Routes>
                                <Route path="/" element={
                                    <Layout>
                                        <HomePage />
                                    </Layout>
                                } />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            
                            <Route path="/profile" element={
                                <RequireAuth>
                                    <Layout>
                                        <Profile />
                                    </Layout>
                                </RequireAuth>
                            } />
                            
                            <Route path="/dashboard" element={
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
                            
                            <Route path="/cashout" element={
                                <RequireAuth>
                                    <Layout>
                                        <Cashout />
                                    </Layout>
                                </RequireAuth>
                            } />
                            
                            <Route path="/moderation" element={
                                <RequireAuth>
                                    <Layout>
                                        <ModerationPanel />
                                    </Layout>
                                </RequireAuth>
                            } />
                            
                            {/* Route de callback pour les paiements */}
                            <Route path="/payment-callback" element={<PaymentCallback />} />
                            
                            {/* 404 route */}
                            <Route path="*" element={
                                <motion.div
                                    initial={{ opacity: 0, y: -50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="min-h-screen bg-black text-white flex items-center justify-center"
                                >
                                    <div className="text-center">
                                        <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
                                        <p className="text-xl text-gray-300 mb-8">Page non trouvée</p>
                                        <Link
                                            to="/"
                                            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                                        >
                                            Retour à l'accueil
                                        </Link>
                                    </div>
                                </motion.div>
                            } />
                        </Routes>
                        <Toaster />
                    </div>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App