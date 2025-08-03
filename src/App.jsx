
import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { motion } from 'framer-motion'

import { AuthProvider } from './contexts/AuthContext'

import { DashboardProvider } from './contexts/DashboardContext'
import { Toaster } from './components/ui/toaster'
import ErrorBoundary from './components/ErrorBoundary'

// Import direct des pages (sans lazy loading)
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import Explore from './pages/Explore'
import CreatorProfile from './pages/CreatorProfile'
import CreatorDashboard from './pages/CreatorDashboard'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import Subscriptions from './pages/Subscriptions'
import Purchases from './pages/Purchases'
import BecomeCreator from './pages/BecomeCreator'
import AuthCallback from './pages/AuthCallback'
import EmailConfirmation from './pages/EmailConfirmation'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import CreatorRoute from './components/CreatorRoute'
import Layout from './components/Layout'

// Loading skeleton component
const PageSkeleton = () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
        >
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white text-lg">Chargement de la page...</div>
        </motion.div>
    </div>
)

function App() {

    return (
        <ErrorBoundary>
            <AuthProvider>
                <DashboardProvider>
                    <Router>
                        <Helmet>
                            <title>BENDZA - Crée. Publie. Encaisse.</title>
                            <meta name="description" content="BENDZA: Crée. Publie. Encaisse. Plateforme de publication et monétisation de contenus exclusifs pour influenceurs." />
                        </Helmet>

                        <div className="min-h-screen bg-black text-white">
                            <Routes>
                                {/* Public routes */}
                                <Route path="/" element={<HomePage />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/explore" element={<Explore />} />
                                <Route path="/creator/:creatorId" element={<CreatorProfile />} />
                                <Route path="/auth/callback" element={<AuthCallback />} />
                                <Route path="/confirm-email" element={<EmailConfirmation />} />

                                {/* Protected routes */}
                                <Route path="/dashboard" element={
                                    <CreatorRoute>
                                        <Layout>
                                            <CreatorDashboard />
                                        </Layout>
                                    </CreatorRoute>
                                } />

                                <Route path="/messages" element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <Messages />
                                        </Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/profile" element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <Profile />
                                        </Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/subscriptions" element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <Subscriptions />
                                        </Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/purchases" element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <Purchases />
                                        </Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/become-creator" element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <BecomeCreator />
                                        </Layout>
                                    </ProtectedRoute>
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
                                        <p className="text-xl text-beige-200 mb-2">Page non trouvée</p>
                                        <p className="text-md text-gray-400">
                                            La page que vous recherchez n'existe pas.
                                        </p>
                                    </motion.div>
                                } />
                            </Routes>
                        </div>

                        <Toaster />
                    </Router>
                </DashboardProvider>
            </AuthProvider>
        </ErrorBoundary >
    )
}

export default App;
