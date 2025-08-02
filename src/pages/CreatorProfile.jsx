
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { Heart, MessageCircle, Share2, Crown, Lock, Play, Image, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/use-toast'
import PaymentModal from '../components/PaymentModal'

function CreatorProfile() {
  const { creatorId } = useParams()
  const [creator, setCreator] = useState(null)
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedContent, setSelectedContent] = useState(null)
  const { user, userProfile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (creatorId) {
      fetchCreatorData()
      checkSubscriptionStatus()
    }
  }, [creatorId, user])

  const fetchCreatorData = async () => {
    try {
      // Fetch creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('users')
        .select(`
          *,
          creators (*)
        `)
        .eq('id', creatorId)
        .eq('is_creator', true)
        .single()

      if (creatorError) throw creatorError

      setCreator(creatorData)

      // Fetch creator contents
      const { data: contentsData, error: contentsError } = await supabase
        .from('content')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })

      if (contentsError) throw contentsError

      setContents(contentsData || [])
    } catch (error) {
      console.error('Error fetching creator data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil du créateur",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const checkSubscriptionStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('type', 'abonnement')
        .eq('status', 'paid')
        .single()

      if (!error && data) {
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleSubscribe = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour vous abonner",
        variant: "destructive"
      })
      return
    }

    setShowPaymentModal(true)
  }

  const handleContentPurchase = (content) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour acheter du contenu",
        variant: "destructive"
      })
      return
    }

    setSelectedContent(content)
    setShowPaymentModal(true)
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

  const ContentCard = ({ content }) => {
    const isLocked = creator.creators?.abonnement_mode && !isSubscribed

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors"
      >
        <div className="relative">
          {content.type === 'image' ? (
            <img
              src={content.url}
              alt={content.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
              {getContentIcon(content.type)}
            </div>
          )}

          {isLocked && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2">{content.title}</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-400 text-sm">
              {getContentIcon(content.type)}
              <span className="ml-2 capitalize">{content.type}</span>
            </div>

            {!creator.creators?.abonnement_mode && (
              <span className="text-orange-500 font-semibold">
                {content.price} FCFA
              </span>
            )}
          </div>

          {!creator.creators?.abonnement_mode && (
            <Button
              onClick={() => handleContentPurchase(content)}
              className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white"
            >
              Acheter
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Chargement du profil...</div>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Créateur non trouvé</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>{creator.name} - BENDZA</title>
        <meta name="description" content={`Profil de ${creator.name} sur BENDZA`} />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Creator Header */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <img
              src={creator.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`}
              alt={creator.name}
              className="w-24 h-24 rounded-full object-cover"
            />

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{creator.name}</h1>
                {creator.creators?.abonnement_mode && (
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Crown className="w-4 h-4 mr-1" />
                    Abonnement
                  </div>
                )}
              </div>

              <p className="text-gray-400 mb-4">
                {creator.creators?.bio || "Aucune description disponible"}
              </p>

              <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  <span>0 abonnés</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span>{contents.length} contenus</span>
                </div>
              </div>

              <div className="flex gap-3">
                {creator.creators?.abonnement_mode ? (
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500 font-semibold">
                      {creator.creators.abonnement_price} FCFA/mois
                    </span>
                    {!isSubscribed && (
                      <Button
                        onClick={handleSubscribe}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        S'abonner
                      </Button>
                    )}
                    {isSubscribed && (
                      <div className="text-green-500 font-semibold">
                        ✓ Abonné
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">Contenus à la carte</span>
                )}

                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contents Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Contenus</h2>

          {contents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">Aucun contenu disponible</div>
              <p className="text-gray-500">Ce créateur n'a pas encore publié de contenu</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          creator={creator}
          content={selectedContent}
          isSubscription={!selectedContent}
          onSuccess={() => {
            setShowPaymentModal(false)
            setSelectedContent(null)
            checkSubscriptionStatus()
            toast({
              title: "Paiement réussi",
              description: "Vous avez maintenant accès au contenu"
            })
          }}
        />
      )}
    </div>
  )
}

export default CreatorProfile
