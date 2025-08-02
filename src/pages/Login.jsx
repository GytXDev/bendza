
import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../components/ui/use-toast'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  // Gérer les erreurs de callback
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      let errorMessage = 'Une erreur est survenue lors de la connexion'

      switch (error) {
        case 'auth_failed':
          errorMessage = 'Échec de l\'authentification'
          break
        case 'callback_failed':
          errorMessage = 'Erreur lors de la redirection'
          break
        default:
          errorMessage = 'Erreur inconnue'
      }

      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [searchParams, toast])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn({ email, password })

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur BENDZA !"
        })
        // Rediriger vers la page d'accueil par défaut
        navigate('/')
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        toast({
          title: "Erreur de connexion Google",
          description: error.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-black flex items-center justify-center p-4"
    >
      <Helmet>
        <title>Connexion - BENDZA</title>
        <meta name="description" content="Connectez-vous à votre compte BENDZA" />
      </Helmet>

      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img src="/logo.png" alt="BENDZA" className="mx-auto h-16 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-white">
            Connexion
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Accédez à votre compte BENDZA
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Mot de passe
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-400">Ou continuer avec</span>
            </div>
          </div>

          <div>
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-medium text-orange-500 hover:text-orange-400">
                Créer un compte
              </Link>
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

export default Login
