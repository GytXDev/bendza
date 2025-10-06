
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { Crown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/use-toast'
import PaymentModal from '../components/PaymentModal'
import { usePaymentTransaction } from '../hooks/usePaymentTransaction'

function BecomeCreator() {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { user, loading, becomeCreator } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { recordPaymentTransaction } = usePaymentTransaction()

  const handleBecomeCreator = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async (paymentData) => {
    setIsProcessing(true)
    setShowPaymentModal(false)

    try {
      // Enregistrer la transaction dans la base de données
      await recordPaymentTransaction(paymentData.amount, paymentData.mobileNumber);

      // Activer le profil créateur
      const { error } = await becomeCreator()

      if (error) {
        toast({
          title: "Paiement réussi mais erreur d'activation",
          description: "Votre paiement a été traité mais nous n'avons pas pu activer votre profil créateur. Notre équipe va vous contacter dans les plus brefs délais.",
          variant: "destructive"
        })
      } else {
        setShowSuccess(true)

        // Attendre un peu avant de rediriger pour montrer l'animation
        setTimeout(() => {
          toast({
            title: "Félicitations !",
            description: "Votre profil créateur a été activé avec succès !"
          })
          navigate('/dashboard')
        }, 2000)
      }
    } catch (error) {
      toast({
        title: "Erreur technique",
        description: "Votre paiement a été traité mais une erreur technique s'est produite. Notre équipe va vous contacter dans les plus brefs délais.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Chargement...</div>
        </div>
      </div>
    )
  }

  // Processing state
  if (isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-black flex items-center justify-center p-4"
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-4">Traitement en cours...</h2>
          <p className="text-gray-400 mb-6">
            Nous traitons votre paiement et activons votre profil créateur.
            Veuillez patienter quelques instants.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Paiement validé</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Enregistrement de la transaction</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Activation du profil créateur</span>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Success state
  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-black flex items-center justify-center p-4"
      >
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Crown className="w-12 h-12 text-white" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Félicitations !
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-300 mb-6"
          >
            Votre profil créateur a été activé avec succès !
            Vous allez être redirigé vers votre tableau de bord.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center space-x-2 text-sm text-gray-400"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Redirection automatique...</span>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Si pas d'utilisateur connecté
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Erreur d'authentification</div>
          <Button onClick={() => navigate('/login')}>
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  // Si pas de profil utilisateur
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Erreur de profil utilisateur</div>
          <p className="text-gray-400 mb-4">Impossible de charger votre profil</p>
          <Button onClick={() => window.location.reload()}>
            Actualiser la page
          </Button>
        </div>
      </div>
    )
  }

  // Si déjà créateur
  if (user?.is_creator) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-black text-white flex items-center justify-center p-4"
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Vous êtes déjà créateur !</h1>
          <p className="text-gray-400 mb-6">
            Votre profil créateur est déjà activé. Accédez à votre tableau de bord pour commencer.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Aller au tableau de bord
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-black text-white"
    >
      <Helmet>
        <title>Devenir créateur - BENDZA</title>
        <meta name="description" content="Rejoignez BENDZA en tant que créateur et monétisez votre contenu" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8 mt-16 md:mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <img src="/logo.png" alt="BENDZA" className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 px-4">
            Devenez créateur sur BENDZA
          </h1>
          <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            Rejoignez notre communauté de créateurs et commencez à monétiser votre contenu exclusif
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 md:p-8 text-center mb-8 mx-4"
        >
                 <h2 className="text-xl md:text-3xl font-bold text-white mb-4">
                   Frais d'activation : 200 FCFA
                 </h2>
                 <p className="text-sm md:text-base text-orange-100 mb-6 px-4">
                   Un seul paiement pour débloquer toutes les fonctionnalités créateur
                 </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center"
        >
          <Button
            onClick={handleBecomeCreator}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm md:text-lg px-4 md:px-8 py-3 md:py-4 rounded-lg font-semibold w-full md:w-auto"
          >
            <Crown className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            <span className="hidden sm:inline">Devenir créateur maintenant</span>
            <span className="sm:hidden">Devenir créateur</span>
          </Button>
          <p className="text-gray-400 mt-4">
            Paiement sécurisé via Mobile Money
          </p>
        </motion.div>
      </div>

             {showPaymentModal && (
               <PaymentModal
                 isOpen={showPaymentModal}
                 onClose={() => setShowPaymentModal(false)}
                 amount={200}
                 type="creator_activation"
                 onSuccess={handlePaymentSuccess}
               />
             )}
    </motion.div>
  )
}

export default BecomeCreator
