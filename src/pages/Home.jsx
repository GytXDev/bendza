
import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Home = () => {
  const { user } = useAuth();
  const { creators, getUserTransactions } = useData();

  const userTransactions = getUserTransactions();
  const subscribedCreators = creators.filter(creator => 
    userTransactions.some(transaction => 
      transaction.creator_id === creator.user_id && 
      transaction.type === 'abonnement' && 
      transaction.status === 'paid'
    )
  );

  const topCreators = creators.slice(0, 3);

  return (
    <div className="space-y-8 pt-16 md:pt-0">
      <Helmet>
        <title>Accueil - BENDZA</title>
        <meta name="description" content="Découvrez les meilleurs créateurs de contenu sur BENDZA" />
      </Helmet>

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bendza-glass rounded-2xl p-8 text-center"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Bienvenue sur BENDZA, {user?.name} ! 👋
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Découvrez du contenu exclusif de vos créateurs préférés
        </p>
        
        {!user?.is_creator && (
          <Link to="/become-creator">
            <Button className="bendza-button">
              <Star className="mr-2" size={20} />
              Devenir créateur
            </Button>
          </Link>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créateurs disponibles</CardTitle>
              <Users className="h-4 w-4 text-[#FF5A00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{creators.length}</div>
              <p className="text-xs text-gray-400">
                Découvrez du contenu unique
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes abonnements</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#FF5A00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{subscribedCreators.length}</div>
              <p className="text-xs text-gray-400">
                Créateurs suivis
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achats effectués</CardTitle>
              <Star className="h-4 w-4 text-[#FF5A00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{userTransactions.length}</div>
              <p className="text-xs text-gray-400">
                Contenus achetés
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Creators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Créateurs populaires</h2>
          <Link to="/explore">
            <Button variant="ghost" className="text-[#FF5A00] hover:bg-[#FF5A00]/10">
              Voir tout
              <ArrowRight className="ml-2" size={16} />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topCreators.map((creator, index) => (
            <motion.div
              key={creator.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
            >
              <Link to={`/creator/${creator.user_id}`}>
                <Card className="hover:border-[#FF5A00] transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={creator.photoURL}
                        alt={creator.name}
                        className="w-16 h-16 rounded-full border-2 border-[#FF5A00]"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{creator.name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{creator.bio}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{creator.followers} abonnés</span>
                          <span>{creator.content_count} contenus</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* My Subscriptions */}
      {subscribedCreators.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Mes abonnements</h2>
            <Link to="/subscriptions">
              <Button variant="ghost" className="text-[#FF5A00] hover:bg-[#FF5A00]/10">
                Voir tout
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscribedCreators.slice(0, 3).map((creator) => (
              <Link key={creator.user_id} to={`/creator/${creator.user_id}`}>
                <Card className="hover:border-[#FF5A00] transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <img
                        src={creator.photoURL}
                        alt={creator.name}
                        className="w-20 h-20 rounded-full border-2 border-[#FF5A00] mx-auto mb-4"
                      />
                      <h3 className="font-semibold text-white mb-2">{creator.name}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{creator.bio}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Home;
