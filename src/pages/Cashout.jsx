import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Wallet,
  CreditCard,
  Smartphone,
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Minus,
  Plus
} from 'lucide-react';

function Cashout() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Debug logs
  console.log('💰 Cashout: user state:', user);
  console.log('💰 Cashout: user.is_creator:', user?.is_creator);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    availableBalance: 0,
    pendingAmount: 0,
    totalPayouts: 0,
    thisMonthEarnings: 0
  });
  const [recentPayouts, setRecentPayouts] = useState([]);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState('mobile_money');

  useEffect(() => {
    if (user && user?.is_creator) {
      fetchCashoutData();
    }
  }, [user]);

  const fetchCashoutData = async () => {
    try {
      setLoading(true);

      // Récupérer les statistiques des transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount, type, status, created_at')
        .eq('creator_id', user.id);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        return;
      }

      // Récupérer les paiements
      const { data: payouts, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (payoutsError) {
        console.error('Error fetching payouts:', payoutsError);
      }

      // Calculer les statistiques
      const totalEarnings = transactions
        ?.filter(t => t.type === 'achat_unitaire' && t.status === 'paid')
        ?.reduce((sum, t) => sum + (t.amount * 0.8), 0) || 0; // 80% pour le créateur

      const totalPayouts = payouts?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const availableBalance = totalEarnings - totalPayouts;

      // Calculer les gains du mois
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthEarnings = transactions
        ?.filter(t => 
          t.type === 'achat_unitaire' && 
          t.status === 'paid' && 
          new Date(t.created_at) >= thisMonth
        )
        ?.reduce((sum, t) => sum + (t.amount * 0.8), 0) || 0;

      setStats({
        totalEarnings,
        availableBalance,
        pendingAmount: 0, // À implémenter selon la logique métier
        totalPayouts,
        thisMonthEarnings
      });

      setRecentPayouts(payouts || []);
      setCashoutAmount(availableBalance);

    } catch (error) {
      console.error('Error in fetchCashoutData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCashout = async () => {
    if (cashoutAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive",
      });
      return;
    }

    if (cashoutAmount > stats.availableBalance) {
      toast({
        title: "Montant insuffisant",
        description: "Le montant demandé dépasse votre solde disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      // Créer une demande de paiement
      const { data, error } = await supabase
        .from('payouts')
        .insert({
          creator_id: user.id,
          amount: cashoutAmount,
          method: selectedMethod,
          status: 'pending',
          request_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Demande envoyée !",
        description: "Votre demande de retrait a été envoyée avec succès",
      });

      setShowCashoutModal(false);
      fetchCashoutData(); // Recharger les données

    } catch (error) {
      console.error('Error creating payout:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la demande de retrait",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échec';
      default:
        return 'Inconnu';
    }
  };

  if (!user?.is_creator) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accès restreint</h2>
          <p className="text-gray-400">Vous devez être créateur pour accéder à cette page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cashout - Bendza</title>
        <meta name="description" content="Gérez vos retraits et commissions sur Bendza" />
      </Helmet>

      <div className="min-h-screen bg-black text-white p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Cashout</h1>
          <p className="text-gray-400">Gérez vos gains et retraits</p>
        </div>

        {/* Carte principale - Solde disponible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Solde disponible</p>
                <p className="text-3xl font-bold text-white">
                  {formatPrice(stats.availableBalance)}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCashoutModal(true)}
              disabled={stats.availableBalance <= 0}
              className="bg-white text-orange-500 hover:bg-white/90 font-semibold"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Retirer
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/80 text-xs mb-1">Gains totaux</p>
              <p className="text-white font-semibold">{formatPrice(stats.totalEarnings)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/80 text-xs mb-1">Ce mois</p>
              <p className="text-white font-semibold">{formatPrice(stats.thisMonthEarnings)}</p>
            </div>
          </div>
        </motion.div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 rounded-xl p-4"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Gains totaux</p>
                <p className="text-white font-semibold">{formatPrice(stats.totalEarnings)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 rounded-xl p-4"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Minus className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Retraits totaux</p>
                <p className="text-white font-semibold">{formatPrice(stats.totalPayouts)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Historique des retraits */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Historique des retraits</h2>
          
          {recentPayouts.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Aucun retrait effectué</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayouts.map((payout, index) => (
                <motion.div
                  key={payout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-900 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(payout.status)}
                      <div>
                        <p className="text-white font-medium">{formatPrice(payout.amount)}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(payout.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs capitalize">
                        {payout.method.replace('_', ' ')}
                      </p>
                      <p className={`text-sm font-medium ${
                        payout.status === 'completed' ? 'text-green-500' :
                        payout.status === 'pending' ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {getStatusText(payout.status)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de retrait */}
        {showCashoutModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-xl font-bold text-white mb-4">Demander un retrait</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Montant (FCFA)
                  </label>
                  <input
                    type="number"
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                    placeholder="Montant à retirer"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Solde disponible: {formatPrice(stats.availableBalance)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Méthode de paiement
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        value="mobile_money"
                        checked={selectedMethod === 'mobile_money'}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="text-orange-500"
                      />
                      <Smartphone className="w-5 h-5 text-orange-500" />
                      <span className="text-white">Mobile Money</span>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => setShowCashoutModal(false)}
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCashout}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}

export default Cashout;
