
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { Search, Filter, Star, Users, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../components/ui/use-toast'

function Explore() {
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
          creators (
            bio,
            abonnement_mode,
            abonnement_price
          )
        `, { count: 'exact' })
        .eq('is_creator', true)
        .range(from, to)
        .order('created_at', { ascending: false })

      // Apply search filter if term exists
      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,creators.bio.ilike.%${debouncedSearchTerm}%`)
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
      const matchesFilter = filter === 'all' ||
        (filter === 'subscription' && creator.creators?.abonnement_mode) ||
        (filter === 'pay-per-content' && !creator.creators?.abonnement_mode)

      return matchesFilter
    })
  }, [creators, filter])

  const CreatorCard = React.memo(({ creator, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors"
    >
      <div className="relative">
        <img
                          src={creator.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`}
          alt={creator.name}
          className="w-full h-48 object-cover"
          loading="lazy"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`
          }}
        />
        {creator.creators?.abonnement_mode && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
            <Crown className="w-3 h-3 mr-1" />
            Abonnement
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{creator.name}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {creator.creators?.bio || "Aucune description disponible"}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-gray-400 text-sm">
            <Users className="w-4 h-4 mr-1" />
            <span>0 abonnés</span>
          </div>
          <div className="flex items-center text-yellow-400 text-sm">
            <Star className="w-4 h-4 mr-1" />
            <span>0.0</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            {creator.creators?.abonnement_mode ? (
              <span className="text-orange-500 font-semibold">
                {creator.creators.abonnement_price} FCFA/mois
              </span>
            ) : (
              <span className="text-gray-400">Contenus à la carte</span>
            )}
          </div>

          <Link to={`/creator/${creator.id}`}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2">
              Voir le profil
            </Button>
          </Link>
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
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Explorer</h1>
          <p className="text-gray-400">Découvrez des créateurs exclusifs et leurs contenus</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Rechercher un créateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
              >
                Tous
              </Button>
              <Button
                variant={filter === 'subscription' ? 'default' : 'outline'}
                onClick={() => setFilter('subscription')}
                className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
              >
                <Crown className="w-4 h-4 mr-2" />
                Abonnements
              </Button>
              <Button
                variant={filter === 'pay-per-content' ? 'default' : 'outline'}
                onClick={() => setFilter('pay-per-content')}
                className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
              >
                À la carte
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Creators Grid */}
        {filteredCreators.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 text-lg mb-4">
              {searchTerm ? 'Aucun créateur trouvé' : 'Aucun créateur disponible'}
            </div>
            <p className="text-gray-500">
              {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Revenez plus tard pour découvrir de nouveaux créateurs'}
            </p>
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
                className="text-center mt-8"
              >
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
                >
                  {loadingMore ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Chargement...
                    </div>
                  ) : (
                    'Charger plus'
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
