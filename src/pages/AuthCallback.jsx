import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function AuthCallback() {
    const navigate = useNavigate()
    const { user } = useAuth()

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Récupérer la session après redirection OAuth
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Erreur lors de la récupération de la session:', error)
                    navigate('/login?error=auth_failed')
                    return
                }

                if (session) {
                    // Vérifier si l'utilisateur existe dans la table users
                    const { data: userProfile, error: profileError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()

                    if (profileError && profileError.code === 'PGRST116') {
                        // L'utilisateur n'existe pas, le créer
                        const { error: insertError } = await supabase
                            .from('users')
                            .insert([
                                {
                                    id: session.user.id,
                                    email: session.user.email,
                                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
                                    photourl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
                                    is_creator: false
                                }
                            ])

                        if (insertError) {
                            console.error('Erreur lors de la création du profil:', insertError)
                        }
                    }

                    // Rediriger vers la page d'accueil par défaut
                    navigate('/')
                } else {
                    // Pas de session, rediriger vers la page de connexion
                    navigate('/login')
                }
            } catch (error) {
                console.error('Erreur lors du callback d\'authentification:', error)
                navigate('/login?error=callback_failed')
            }
        }

        handleAuthCallback()
    }, [navigate])

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-white mb-2">
                    Connexion en cours...
                </h2>
                <p className="text-gray-400">
                    Veuillez patienter pendant que nous vous connectons.
                </p>
            </motion.div>
        </div>
    )
}

export default AuthCallback 