
import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { motion } from 'framer-motion'

import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/toaster'
import LazyLoader from './components/LazyLoader'

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Explore = lazy(() => import('./pages/Explore'))
const CreatorProfile = lazy(() => import('./pages/CreatorProfile'))
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'))
const Messages = lazy(() => import('./pages/Messages'))
const Profile = lazy(() => import('./pages/Profile'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Purchases = lazy(() => import('./pages/Purchases'))
const BecomeCreator = lazy(() => import('./pages/BecomeCreator'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))

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
        <AuthProvider>
            <Router>
                <Helmet>
                    <title>BENDZA - Crée. Publie. Encaisse.</title>
                    <meta name="description" content="BENDZA: Crée. Publie. Encaisse. Plateforme de publication et monétisation de contenus exclusifs pour influenceurs." />
                </Helmet>

                <div className="min-h-screen bg-black text-white">
                    <Suspense fallback={<PageSkeleton />}>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/explore" element={<Explore />} />
                            <Route path="/creator/:creatorId" element={<CreatorProfile />} />
                            <Route path="/auth/callback" element={<AuthCallback />} />

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
                    </Suspense>
                </div>

                <Toaster />
            </Router>
        </AuthProvider>
    )
}

export default App;
