
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { Search, Filter, Star, Users, Crown, Heart, Plus, Eye, ArrowLeft, Menu } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../components/ui/use-toast'

function Explore() {
  const navigate = useNavigate()
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const { toast } = useToast()

  const ITEMS_PER_PAGE = 12

  // Debounced search
  const debouncedSetSearchTerm = useCallback(
    (() => {
      let timeout;
      return (term) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setDebouncedSearchTerm(term);
        }, 300);
      };
    })(),
    []
  )

  useEffect(() => {
    debouncedSetSearchTerm(searchTerm)
  }, [searchTerm, debouncedSetSearchTerm])

  useEffect(() => {
    fetchCreators(true)
  }, [debouncedSearchTerm, filter])

  const fetchCreators = async (reset = false) => {
    try {
      if (reset) {
        setPage(0)
        setCreators([])
        setHasMore(true)
      }

      const currentPage = reset ? 0 : page
      const from = currentPage * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      let query = supabase
        .from('users')
        .select(`
          id,
          name,
          photourl,
          is_creator,
          creator_bio,
          banner_url,
          account_type,
          subscription_price,
          creator_verified,
          creator_since,
          created_at,
          creators (
            bio,
            description,
            banner_url,
            account_type,
            subscription_price,
            abonnement_mode,
            abonnement_price,
            followers_count,
            content_count,
            total_earnings
          )
        `, { count: 'exact' })
        .eq('is_creator', true)
        .range(from, to)
        .order('created_at', { ascending: false })

      // Apply search filter if term exists
      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,creator_bio.ilike.%${debouncedSearchTerm}%,creators.bio.ilike.%${debouncedSearchTerm}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      const newCreators = data || []

      if (reset) {
        setCreators(newCreators)
      } else {
        setCreators(prev => [...prev, ...newCreators])
      }

      setHasMore(newCreators.length === ITEMS_PER_PAGE)
      setPage(currentPage + 1)
    } catch (error) {
      console.error('Error fetching creators:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les créateurs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true)
      fetchCreators(false)
    }
  }, [loadingMore, hasMore])

  const filteredCreators = useMemo(() => {
    return creators.filter(creator => {
      const isSubscription = creator.account_type === 'subscription' || creator.creators?.abonnement_mode
      const matchesFilter = filter === 'all' ||
        (filter === 'subscription' && isSubscription) ||
        (filter === 'pay-per-content' && !isSubscription)

      return matchesFilter
    })
  }, [creators, filter])

  const CreatorCard = React.memo(({ creator, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-gray-900 rounded-xl overflow-hidden hover:bg-gray-800 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 group"
    >
      {/* Bannière du créateur */}
      <div className="relative h-32 bg-gradient-to-br from-orange-500/20 to-purple-600/20">
        {creator.banner_url || creator.creators?.banner_url ? (
          <img
            src={creator.banner_url || creator.creators.banner_url}
            alt={`Bannière de ${creator.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500/30 via-purple-600/30 to-pink-500/30 flex items-center justify-center">
            <div className="text-white/60 text-4xl font-bold">{creator.name.charAt(0)}</div>
          </div>
        )}

        {/* Badge de type de compte */}
        {(creator.account_type === 'subscription' || creator.creators?.abonnement_mode) && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg">
            <Crown className="w-3 h-3 mr-1" />
            Abonnement
          </div>
        )}

        {/* Bouton voir le profil */}
        <div className="absolute top-3 right-3">
          <Link to={`/creator/${creator.id}`}>
            <Button
              size="sm"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200 group-hover:bg-orange-500 group-hover:border-orange-500"
            >
              Voir le profil
            </Button>
          </Link>
        </div>
      </div>

      {/* Photo de profil superposée */}
      <div className="relative px-4 -mt-8">
        <div className="relative">
          <img
            src={creator.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`}
            alt={creator.name}
            className="w-16 h-16 rounded-full border-4 border-gray-900 object-cover shadow-lg"
            loading="lazy"
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Contenu de la carte */}
      <div className="p-4 pt-2">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">
              {creator.name}
            </h3>
            <p className="text-gray-400 text-sm font-medium">
              @{creator.name.toLowerCase().replace(/\s+/g, '')}
            </p>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
          {creator.creator_bio || creator.creators?.bio || "Aucune description disponible"}
        </p>

        {/* Prix et action */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {(creator.account_type === 'subscription' || creator.creators?.abonnement_mode) ? (
              <div className="flex items-center">
                <span className="text-orange-500 font-bold text-lg">
                  {creator.subscription_price || creator.creators?.subscription_price || creator.creators?.abonnement_price || 2500}
                </span>
                <span className="text-gray-400 ml-1">FCFA/mois</span>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="text-gray-400 ml-1">• Contenus à la carte</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  ))

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Chargement des créateurs...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Explorer - BENDZA</title>
        <meta name="description" content="Découvrez des créateurs exclusifs sur BENDZA" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header avec navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Bouton retour */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Retour</span>
              </Button>

              {/* Bouton menu */}
              <Link to="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white transition-all duration-200"
                >
                  <Menu className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Menu</span>
                </Button>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
              <span>🔥</span>
              <span>+500 créateurs</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Explorer
              </h1>
              <p className="text-gray-400 text-base md:text-lg">
                Découvrez des créateurs exclusifs et leurs contenus premium
              </p>
            </div>

            {/* Statistiques mobile */}
            <div className="md:hidden flex items-center space-x-2 text-xs text-gray-400">
              <span>🔥</span>
              <span>+500</span>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 space-y-6"
        >
          {/* Barre de recherche améliorée */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un créateur, une bio ou un contenu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtres améliorés */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${filter === 'all'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                : 'bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Tous les créateurs
            </Button>
            <Button
              variant={filter === 'subscription' ? 'default' : 'outline'}
              onClick={() => setFilter('subscription')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${filter === 'subscription'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                : 'bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                }`}
            >
              <Crown className="w-4 h-4 mr-2" />
              Abonnements Premium
            </Button>
            <Button
              variant={filter === 'pay-per-content' ? 'default' : 'outline'}
              onClick={() => setFilter('pay-per-content')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${filter === 'pay-per-content'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                : 'bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Contenus à la carte
            </Button>
          </div>

          {/* Statistiques rapides */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{filteredCreators.length} créateur{filteredCreators.length > 1 ? 's' : ''} trouvé{filteredCreators.length > 1 ? 's' : ''}</span>
            <div className="flex items-center space-x-4">
              <span>🔥 Populaires</span>
              <span>⭐ Recommandés</span>
              <span>🆕 Nouveaux</span>
            </div>
          </div>
        </motion.div>

        {/* Creators Grid */}
        {filteredCreators.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              {searchTerm ? 'Aucun créateur trouvé' : 'Aucun créateur disponible'}
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm
                ? 'Essayez de modifier vos critères de recherche ou explorez nos catégories populaires'
                : 'Revenez plus tard pour découvrir de nouveaux créateurs exclusifs'
              }
            </p>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm('')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg"
              >
                Effacer la recherche
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCreators.map((creator, index) => (
                <CreatorCard key={creator.id} creator={creator} index={index} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center mt-12"
              >
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-orange-500/25"
                >
                  {loadingMore ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Chargement en cours...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Plus className="w-5 h-5 mr-2" />
                      Charger plus de créateurs
                    </div>
                  )}
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Explore
