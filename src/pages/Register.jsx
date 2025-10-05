import React, { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/use-toast'
import { ArrowLeft } from 'lucide-react'
import GoogleIcon from '../components/icons/GoogleIcon'

function Register() {
  const [loading, setLoading] = React.useState(false)
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  // Gérer les erreurs de callback
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      let errorMessage = 'Une erreur est survenue lors de l\'inscription'

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
        title: "Erreur d'inscription",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [searchParams, toast])

  const handleGoogleSignUp = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Inscription réussie !",
        description: "Bienvenue sur Bendza"
      })
      
      navigate('/')
    } catch (error) {
      console.error('Google sign-up error:', error)
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
    <>
      <Helmet>
        <title>Inscription - Bendza</title>
        <meta name="description" content="Créez votre compte Bendza pour accéder à des contenus exclusifs" />
      </Helmet>

      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header avec logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/logo.png" 
                alt="Bendza" 
                className="w-16 h-16 rounded-full"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Rejoignez Bendza</h1>
            <p className="text-gray-400">Créez votre compte et accédez à du contenu exclusif</p>
          </motion.div>

          {/* Formulaire d'inscription */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 rounded-2xl p-8"
          >
            {/* Inscription Google */}
            <Button
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-100 font-semibold py-6 text-lg mb-6"
            >
              <GoogleIcon className="w-6 h-6 mr-3" />
              {loading ? 'Inscription...' : 'S\'inscrire avec Google'}
            </Button>

            {/* Avantages */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-gray-300 text-sm">Accès à du contenu exclusif</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-gray-300 text-sm">Support des créateurs</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-gray-300 text-sm">Expérience premium</p>
              </div>
            </div>

            {/* Informations */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                En vous inscrivant, vous acceptez nos{' '}
                <Link to="/terms" className="text-orange-500 hover:underline">
                  conditions d'utilisation
                </Link>
                {' '}et notre{' '}
                <Link to="/privacy" className="text-orange-500 hover:underline">
                  politique de confidentialité
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Lien vers la connexion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mt-6"
          >
            <p className="text-gray-400">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-orange-500 hover:underline font-semibold">
                Se connecter
              </Link>
            </p>
          </motion.div>

          {/* Bouton retour */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8"
          >
            <Link
              to="/"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  )
}

export default Register