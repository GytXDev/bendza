
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
  const { user, userProfile, loading, becomeCreator } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { recordPaymentTransaction } = usePaymentTransaction()

  const handleBecomeCreator = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Enregistrer la transaction dans la base de données
      await recordPaymentTransaction({
        ...paymentData,
        description: 'Activation du profil créateur BENDZA',
      });

      // Activer le profil créateur
      const { error } = await becomeCreator()

      if (error) {
        toast({
          title: "Erreur",
          description: "Paiement effectué mais impossible d'activer votre profil créateur. Contactez le support.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Félicitations !",
          description: "Paiement effectué et profil créateur activé avec succès !"
        })
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Erreur lors de l\'activation du créateur:', error);
      toast({
        title: "Erreur",
        description: "Paiement effectué mais erreur lors de l'activation. Contactez le support.",
        variant: "destructive"
      })
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
  if (!userProfile) {
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
  if (userProfile?.is_creator) {
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
          <h1 className="text-4xl font-bold text-white mb-4">
            Devenez créateur sur BENDZA
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Rejoignez notre communauté de créateurs et commencez à monétiser votre contenu exclusif
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-8 text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Frais d'activation : 999 FCFA
          </h2>
          <p className="text-orange-100 mb-6">
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
            className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-4 rounded-lg font-semibold"
          >
            <Crown className="w-5 h-5 mr-2" />
            Devenir créateur maintenant
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
          amount={999}
          type="creator_activation"
          onSuccess={handlePaymentSuccess}
        />
      )}
    </motion.div>
  )
}

export default BecomeCreator
