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
  Plus,
  Edit3,
  Trash2,
  MoreVertical
} from 'lucide-react';
import WithdrawalModal from '../components/WithdrawalModal';
import DeleteWithdrawalModal from '../components/DeleteWithdrawalModal';

function Cashout() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Debug logs
  console.log('Cashout: user state:', user);
  console.log('Cashout: user.is_creator:', user?.is_creator);
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
  const [editingPayout, setEditingPayout] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingPayout, setDeletingPayout] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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

      // Récupérer les paiements (exclure les demandes annulées)
      const { data: payouts, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .eq('creator_id', user.id)
        .neq('status', 'cancelled')
        .order('requested_at', { ascending: false })
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

  const handleWithdrawalRequest = async (withdrawalData) => {
    try {
      // Créer une demande de retrait avec les nouvelles données
      const { data, error } = await supabase
        .from('payouts')
        .insert({
          creator_id: user.id,
          amount: withdrawalData.amount,
          withdrawal_fee: withdrawalData.withdrawalFee,
          net_amount: withdrawalData.netAmount,
          payment_method: 'mobile_money',
          phone_number: withdrawalData.phoneNumber,
          country: withdrawalData.country,
          status: 'pending',
          requested_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Demande envoyée !",
        description: `Votre demande de retrait de ${withdrawalData.netAmount.toLocaleString()} FCFA a été soumise. Elle sera traitée sous 24-48h.`,
      });

      setShowCashoutModal(false);
      fetchCashoutData(); // Rafraîchir les données

    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande de retrait",
        variant: "destructive",
      });
    }
  };

  const handleEditPayout = (payout) => {
    // Vérifier que la demande peut être modifiée
    if (payout.status !== 'pending') {
      toast({
        title: "Action impossible",
        description: "Seules les demandes en attente peuvent être modifiées",
        variant: "destructive",
      });
      return;
    }

    setEditingPayout(payout);
    setShowEditModal(true);
  };

  const handleUpdatePayout = async (withdrawalData) => {
    if (!editingPayout) return;

    setActionLoading(true);
    try {
      // Vérifier que la demande existe toujours et est modifiable
      const { data: currentPayout, error: fetchError } = await supabase
        .from('payouts')
        .select('status')
        .eq('id', editingPayout.id)
        .eq('creator_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      if (currentPayout.status !== 'pending') {
        toast({
          title: "Action impossible",
          description: "Cette demande ne peut plus être modifiée",
          variant: "destructive",
        });
        setShowEditModal(false);
        setEditingPayout(null);
        return;
      }

      // Mettre à jour la demande
      const { error } = await supabase
        .from('payouts')
        .update({
          amount: withdrawalData.amount,
          withdrawal_fee: withdrawalData.withdrawalFee,
          net_amount: withdrawalData.netAmount,
          phone_number: withdrawalData.phoneNumber,
          country: withdrawalData.country,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPayout.id)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({
        title: "Demande modifiée !",
        description: "Votre demande de retrait a été mise à jour avec succès.",
      });

      setShowEditModal(false);
      setEditingPayout(null);
      await fetchCashoutData();

    } catch (error) {
      console.error('Error updating withdrawal request:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la demande de retrait",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayout = (payout) => {
    // Vérifier que nous avons un ID valide
    if (!payout.id) {
      toast({
        title: "Erreur",
        description: "Impossible d'identifier la demande de retrait",
        variant: "destructive",
      });
      return;
    }
    
    // Vérifier que la demande peut être supprimée
    if (payout.status !== 'pending') {
      toast({
        title: "Action impossible",
        description: "Seules les demandes en attente peuvent être supprimées",
        variant: "destructive",
      });
      return;
    }

    setDeletingPayout(payout);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (payoutId) => {
    if (!payoutId || !deletingPayout) return;

    setActionLoading(true);
    try {
      // Vérifier que la demande existe toujours et est supprimable
      const { data: currentPayout, error: fetchError } = await supabase
        .from('payouts')
        .select('status')
        .eq('id', payoutId)
        .eq('creator_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      if (currentPayout.status !== 'pending') {
        toast({
          title: "Action impossible",
          description: "Cette demande ne peut plus être supprimée",
          variant: "destructive",
        });
        setShowDeleteModal(false);
        setDeletingPayout(null);
        return;
      }

      // Marquer la demande comme annulée (plus sûr que la suppression physique)
      const { data: updateResult, error: updateError } = await supabase
        .from('payouts')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', payoutId)
        .eq('creator_id', user.id)
        .select();

      if (updateError) throw updateError;

      if (updateResult && updateResult.length > 0) {
        toast({
          title: "Demande annulée !",
          description: "Votre demande de retrait a été annulée avec succès.",
        });
      } else {
        throw new Error('Impossible d\'annuler la demande');
      }

      setShowDeleteModal(false);
      setDeletingPayout(null);
      await fetchCashoutData();

    } catch (error) {
      console.error('Error deleting withdrawal request:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la demande de retrait",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
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
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <CreditCard className="w-6 h-6 mr-3 text-orange-500" />
              Historique des retraits
            </h2>
            <div className="text-sm text-gray-400">
              {recentPayouts.length} retrait{recentPayouts.length > 1 ? 's' : ''}
            </div>
          </div>
          
          {recentPayouts.length === 0 ? (
            <div className="bg-gray-900/50 rounded-xl p-8 text-center border border-gray-700">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-lg mb-2">Aucun retrait effectué</p>
              <p className="text-gray-500 text-sm">Vos demandes de retrait apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPayouts.map((payout, index) => {
                const netAmount = payout.net_amount || (payout.amount - (payout.withdrawal_fee || 0));
                const withdrawalFee = payout.withdrawal_fee || Math.round(payout.amount * 0.10);
                
                return (
                  <motion.div
                    key={payout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                          {getStatusIcon(payout.status)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-white font-bold text-lg">{formatPrice(netAmount)}</p>
                          </div>
                          <div className="flex items-center space-x-3 text-sm">
                            <p className="text-gray-400">
                              {new Date(payout.requested_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </p>
                            <span className="text-gray-600">•</span>
                            <p className="text-gray-400 capitalize">
                              {(payout.payment_method || 'mobile_money').replace('_', ' ')}
                            </p>
                            {payout.phone_number && (
                              <div className="flex items-center space-x-2 text-sm mt-1">
                                <p className="text-gray-400">{payout.phone_number}</p>
                                {payout.country && (
                                  <>
                                    <span className="text-gray-600">•</span>
                                    <p className="text-gray-400 text-xs uppercase">{payout.country}</p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            payout.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            payout.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            payout.status === 'approved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {getStatusText(payout.status)}
                          </div>
                          
                          {/* Actions pour les demandes en attente */}
                          {payout.status === 'pending' && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditPayout(payout)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded-full transition-colors"
                                title="Modifier"
                              >
                                <Edit3 className="w-4 h-4 text-gray-400 hover:text-orange-500" />
                              </button>
                              <button
                                onClick={() => handleDeletePayout(payout)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded-full transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de retrait */}
        <WithdrawalModal
          isOpen={showCashoutModal}
          onClose={() => setShowCashoutModal(false)}
          onConfirm={handleWithdrawalRequest}
          availableBalance={stats.availableBalance}
          loading={false}
        />

        {/* Modal d'édition de retrait */}
        {editingPayout && (
          <WithdrawalModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingPayout(null);
            }}
            onConfirm={handleUpdatePayout}
            availableBalance={stats.availableBalance}
            loading={actionLoading}
            editMode={true}
            initialData={{
              amount: editingPayout.amount,
              phoneNumber: editingPayout.phone_number,
              country: editingPayout.country,
              status: editingPayout.status
            }}
          />
        )}

        {/* Modal de suppression de retrait */}
        <DeleteWithdrawalModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingPayout(null);
          }}
          onConfirm={handleConfirmDelete}
          withdrawalData={deletingPayout}
          loading={actionLoading}
        />
      </div>
    </>
  );
}

export default Cashout;
