
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { Calendar, DollarSign, Play, Image, FileText, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/use-toast'

function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchPurchases()
    }
  }, [user])

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          content:content_id (
            id,
            title,
            type,
            url,
            creator_id,
            creators (
              user_id,
              users (
                id,
                name,
                photourl
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('type', 'achat_unitaire')
        .eq('status', 'paid')
        .order('created_at', { ascending: false })

      if (error) throw error

      setPurchases(data || [])
    } catch (error) {
      console.error('Error fetching purchases:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos achats",
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

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />
      case 'image':
        return <Image className="w-4 h-4" />
      case 'text':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Chargement des achats...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Mes achats - BENDZA</title>
        <meta name="description" content="Historique de vos achats BENDZA" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Mes achats</h1>
          <p className="text-gray-400">
            Historique de vos contenus achetés
          </p>
        </div>

        {purchases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Aucun achat</h2>
            <p className="text-gray-400 mb-6">
              Vous n'avez pas encore acheté de contenu.
            </p>
            <Link to="/explore">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Découvrir du contenu
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase, index) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                      {getContentIcon(purchase.content?.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white line-clamp-2">
                        {purchase.content?.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        par {purchase.content?.creators?.users?.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Prix payé</span>
                      <span className="text-orange-500 font-semibold">
                        {purchase.amount} FCFA
                      </span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Acheté le {formatDate(purchase.created_at)}</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="capitalize">{purchase.content?.type}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link to={`/creator/${purchase.content?.creator_id}`} className="flex-1">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Voir le créateur
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

export default Purchases
