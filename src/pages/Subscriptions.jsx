
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { Calendar, Users, Crown, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/use-toast'

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchSubscriptions()
    }
  }, [user])

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          creators:creator_id (
            user_id,
            abonnement_price,
            abonnement_mode,
            users (
              id,
              name,
              photourl
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('type', 'abonnement')
        .eq('status', 'paid')

      if (error) throw error

      setSubscriptions(data || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos abonnements",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Chargement des abonnements...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Mes abonnements - BENDZA</title>
        <meta name="description" content="Gérez vos abonnements BENDZA" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Mes abonnements</h1>
          <p className="text-gray-400">
            Gérez vos abonnements aux créateurs
          </p>
        </div>

        {subscriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Aucun abonnement</h2>
            <p className="text-gray-400 mb-6">
              Vous n'êtes abonné à aucun créateur pour le moment.
            </p>
            <Link to="/explore">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Découvrir des créateurs
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((subscription, index) => (
              <motion.div
                key={subscription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={subscription.creators?.users?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${subscription.creators?.users?.name}`}
                      alt={subscription.creators?.users?.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {subscription.creators?.users?.name}
                      </h3>
                      <p className="text-orange-500 font-semibold">
                        {subscription.creators?.abonnement_price} FCFA/mois
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Abonné depuis le {formatDate(subscription.created_at)}</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Crown className="w-4 h-4 mr-2" />
                      <span>Abonnement actif</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link to={`/creator/${subscription.creators?.user_id}`} className="flex-1">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Voir le profil
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Subscriptions
