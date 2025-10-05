import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Smartphone, 
  Globe, 
  DollarSign,
  Calendar,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

function AdminWithdrawals() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
    }
  }, [user]);

  useEffect(() => {
    filterWithdrawals();
  }, [withdrawals, statusFilter, searchTerm]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      
      console.log('AdminWithdrawals: User role:', user?.role);
      console.log('AdminWithdrawals: User ID:', user?.id);
      
      // Vérifier que l'utilisateur est admin
      if (user?.role !== 'admin') {
        console.error('AdminWithdrawals: User is not admin, role:', user?.role);
        throw new Error('Accès refusé: utilisateur non admin');
      }
      
      // Essayer d'abord une requête simple pour voir tous les payouts
      const { data: allPayouts, error: allError } = await supabase
        .from('payouts')
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(1000);
      
      console.log('AdminWithdrawals: All payouts count:', allPayouts?.length || 0);
      
      if (allError) {
        console.error('AdminWithdrawals: Error fetching all payouts:', allError);
        throw allError;
      }
      
      // Ensuite récupérer avec les utilisateurs
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          users:creator_id (
            id,
            name,
            email,
            photourl
          )
        `)
        .order('requested_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      console.log('AdminWithdrawals: Fetched payouts:', data?.length || 0);
      console.log('AdminWithdrawals: Sample payout:', data?.[0]);
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes de retrait",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterWithdrawals = () => {
    let filtered = withdrawals;

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter);
    }

    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(w => 
        w.users?.name?.toLowerCase().includes(term) ||
        w.users?.email?.toLowerCase().includes(term) ||
        w.phone_number?.includes(term) ||
        w.id.toLowerCase().includes(term)
      );
    }

    setFilteredWithdrawals(filtered);
  };

  const handleStatusUpdate = async (withdrawalId, newStatus) => {
    try {
      setProcessingId(withdrawalId);
      
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed') {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('payouts')
        .update(updateData)
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `La demande a été ${newStatus === 'completed' ? 'approuvée' : newStatus === 'rejected' ? 'rejetée' : 'mise à jour'}`,
      });

      fetchWithdrawals();
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />;
      case 'processing': return <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />;
      default: return <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'processing': return 'En cours';
      case 'completed': return 'Terminé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCountryFlag = (countryCode) => {
    const flags = {
      'CM': '🇨🇲', 'SN': '🇸🇳', 'CI': '🇨🇮', 'BF': '🇧🇫',
      'ML': '🇲🇱', 'NE': '🇳🇪', 'TD': '🇹🇩', 'CF': '🇨🇫',
      'GA': '🇬🇦', 'CG': '🇨🇬', 'CD': '🇨🇩', 'GQ': '🇬🇶'
    };
    return flags[countryCode] || '🌍';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg sm:text-xl">Chargement des retraits...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Administration des Retraits - BENDZA</title>
        <meta name="description" content="Gérer les demandes de retrait des créateurs" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 mt-16 md:mt-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Administration des Retraits</h1>
            <p className="text-gray-400 text-sm sm:text-base">Gérer les demandes de retrait des créateurs</p>
          </div>
          <Button
            onClick={fetchWithdrawals}
            className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto text-sm sm:text-base"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Filtres */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-10 border border-gray-700 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Recherche */}
            <div className="flex-1">
              <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2 sm:mb-3">
                Rechercher
              </label>
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Nom, email, téléphone, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-12 lg:pl-14 pr-4 py-3 sm:py-4 bg-gray-800/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Filtre par statut */}
            <div className="lg:w-64 xl:w-72">
              <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2 sm:mb-3">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 sm:p-4 bg-gray-800/50 border border-gray-600 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="processing">En cours</option>
                <option value="completed">Terminé</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm sm:text-base font-medium mb-2">Total demandes</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">{withdrawals.length}</p>
                <p className="text-xs sm:text-sm text-gray-500">Toutes les demandes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm sm:text-base font-medium mb-2">En attente</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-400 mb-1 sm:mb-2">
                  {withdrawals.filter(w => w.status === 'pending').length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Nécessitent une action</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm sm:text-base font-medium mb-2">Terminées</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-400 mb-1 sm:mb-2">
                  {withdrawals.filter(w => w.status === 'completed').length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Traitement terminé</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm sm:text-base font-medium mb-2">Montant total</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                  {withdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">FCFA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des retraits */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl border border-gray-700 shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-700 bg-gray-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-3 sm:mb-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">Demandes de Retrait</h2>
                <p className="text-gray-400 text-sm sm:text-base">
                  {filteredWithdrawals.length} demande(s) trouvée(s)
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-400">En temps réel</span>
              </div>
            </div>
          </div>

          {/* Version mobile - Cartes */}
          <div className="block lg:hidden">
            {filteredWithdrawals.map((withdrawal) => (
              <motion.div
                key={withdrawal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 sm:p-6 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-800/30 transition-colors"
              >
                <div className="space-y-3 sm:space-y-4">
                  {/* Header avec créateur et statut */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="relative">
                        <img
                          src={withdrawal.users?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${withdrawal.users?.name}`}
                          alt={withdrawal.users?.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-600"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold text-sm truncate">{withdrawal.users?.name}</p>
                        <p className="text-gray-400 text-xs truncate">{withdrawal.users?.email}</p>
                      </div>
                    </div>
                    <div className={`inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl border ${getStatusColor(withdrawal.status)} shadow-lg`}>
                      {getStatusIcon(withdrawal.status)}
                      <span className="text-xs font-semibold whitespace-nowrap">{getStatusText(withdrawal.status)}</span>
                    </div>
                  </div>

                  {/* Montants */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-center">
                      <p className="text-gray-400 text-xs mb-1">Montant</p>
                      <p className="text-white font-bold text-sm">{withdrawal.amount.toLocaleString()}</p>
                      <p className="text-gray-400 text-xs">FCFA</p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-2 sm:p-3 text-center border border-red-500/20">
                      <p className="text-gray-400 text-xs mb-1">Frais</p>
                      <p className="text-red-400 font-semibold text-sm">{withdrawal.withdrawal_fee?.toLocaleString() || 0}</p>
                      <p className="text-gray-400 text-xs">FCFA</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-2 sm:p-3 text-center border border-green-500/20">
                      <p className="text-gray-400 text-xs mb-1">Net</p>
                      <p className="text-green-400 font-bold text-sm">{withdrawal.net_amount?.toLocaleString() || withdrawal.amount.toLocaleString()}</p>
                      <p className="text-gray-400 text-xs">FCFA</p>
                    </div>
                  </div>

                  {/* Contact et date */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div>
                        <p className="text-white font-medium text-sm">{withdrawal.phone_number}</p>
                      </div>
                      <p className="text-gray-400 text-xs">{withdrawal.country}</p>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div>
                        <p className="text-gray-300 text-xs font-medium">{formatDate(withdrawal.requested_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {withdrawal.status === 'pending' && (
                    <div className="flex space-x-2 sm:space-x-3 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                        disabled={processingId === withdrawal.id}
                        className="bg-green-500 hover:bg-green-600 text-white flex-1 text-xs rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(withdrawal.id, 'rejected')}
                        disabled={processingId === withdrawal.id}
                        className="bg-red-500 hover:bg-red-600 text-white flex-1 text-xs rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                  {withdrawal.status === 'processing' && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                        disabled={processingId === withdrawal.id}
                        className="bg-green-500 hover:bg-green-600 text-white w-full text-xs rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Marquer comme terminé
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Version desktop - Tableau */}
          <div className="hidden lg:block relative">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500">
              <table className="w-full min-w-[1000px] xl:min-w-[1200px]">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-700">
                  <tr>
                    <th className="px-4 xl:px-6 py-4 text-left text-sm xl:text-base font-semibold text-gray-200 min-w-[200px] xl:min-w-[250px] border-r border-gray-600">
                      <div className="flex items-center space-x-2 xl:space-x-3">
                        <span>Créateur</span>
                      </div>
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-left text-sm xl:text-base font-semibold text-gray-200 min-w-[120px] xl:min-w-[150px] border-r border-gray-600">
                      <div className="flex items-center space-x-2 xl:space-x-3">
                        <span>Montant</span>
                      </div>
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-left text-sm xl:text-base font-semibold text-gray-200 min-w-[100px] xl:min-w-[130px] border-r border-gray-600">
                      <div className="flex items-center space-x-2 xl:space-x-3">
                        <span className="text-red-400 font-semibold">Frais</span>
                      </div>
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-left text-sm xl:text-base font-semibold text-gray-200 min-w-[100px] xl:min-w-[130px] border-r border-gray-600">
                      <div className="flex items-center space-x-2 xl:space-x-3">
                        <span className="text-green-400 font-semibold">Net</span>
                      </div>
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-left text-sm xl:text-base font-semibold text-gray-200 min-w-[150px] xl:min-w-[180px] border-r border-gray-600">
                      <div className="flex items-center space-x-2 xl:space-x-3">
                        <span>Contact</span>
                      </div>
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-left text-sm xl:text-base font-semibold text-gray-200 min-w-[140px] xl:min-w-[170px] border-r border-gray-600">
                      <div className="flex items-center space-x-2 xl:space-x-3">
                        <Calendar className="w-4 h-4 xl:w-5 xl:h-5" />
                        <span>Date</span>
                      </div>
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-left text-sm xl:text-base font-semibold text-gray-200 min-w-[120px] xl:min-w-[150px] border-r border-gray-600">
                      <div className="flex items-center space-x-2 xl:space-x-3">
                        <Filter className="w-4 h-4 xl:w-5 xl:h-5" />
                        <span>Statut</span>
                      </div>
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-left text-sm xl:text-base font-semibold text-gray-200 min-w-[140px] xl:min-w-[170px]">
                      <div className="flex items-center space-x-2 xl:space-x-3">
                        <span>Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredWithdrawals.map((withdrawal) => (
                    <motion.tr
                      key={withdrawal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 xl:px-6 py-4 min-w-[200px] xl:min-w-[250px] border-r border-gray-700/50">
                        <div className="flex items-center space-x-3 xl:space-x-4">
                          <div className="relative">
                            <img
                              src={withdrawal.users?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${withdrawal.users?.name}`}
                              alt={withdrawal.users?.name}
                              className="w-12 h-12 xl:w-16 xl:h-16 rounded-full object-cover border-2 border-gray-600"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 xl:w-5 xl:h-5 bg-green-500 rounded-full border-2 border-gray-900"></div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-semibold text-sm xl:text-base truncate">{withdrawal.users?.name}</p>
                            <p className="text-gray-400 text-xs xl:text-sm truncate mt-1">{withdrawal.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 xl:px-6 py-4 min-w-[120px] xl:min-w-[150px] border-r border-gray-700/50">
                        <div className="bg-gray-800/50 rounded-lg xl:rounded-xl p-3 xl:p-4">
                          <p className="text-white font-bold text-lg xl:text-xl">{withdrawal.amount.toLocaleString()} <span className="text-gray-400 text-xs xl:text-sm mt-1">FCFA</span></p>
                        </div>
                      </td>
                      
                      <td className="px-4 xl:px-6 py-4 min-w-[100px] xl:min-w-[130px] border-r border-gray-700/50">
                        <div className="bg-red-500/10 rounded-lg xl:rounded-xl p-3 xl:p-4 border border-red-500/20">
                          <p className="text-red-400 font-semibold text-base xl:text-lg">{withdrawal.withdrawal_fee?.toLocaleString() || 0} <span className="text-gray-400 text-xs xl:text-sm mt-1">FCFA</span></p>
                        </div>
                      </td>
                      
                      <td className="px-4 xl:px-6 py-4 min-w-[100px] xl:min-w-[130px] border-r border-gray-700/50">
                        <div className="bg-green-500/10 rounded-lg xl:rounded-xl p-3 xl:p-4 border border-green-500/20">
                          <p className="text-green-400 font-bold text-lg xl:text-xl">{withdrawal.net_amount?.toLocaleString() || withdrawal.amount.toLocaleString()} <span className="text-gray-400 text-xs xl:text-sm mt-1">FCFA</span></p>
                        </div>
                      </td>
                      
                      <td className="px-4 xl:px-6 py-4 min-w-[150px] xl:min-w-[180px] border-r border-gray-700/50">
                        <div className="flex items-center space-x-3 xl:space-x-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm xl:text-base truncate">{withdrawal.phone_number}</p>
                            <p className="text-gray-400 text-xs xl:text-sm mt-1">{withdrawal.country}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 xl:px-6 py-4 min-w-[140px] xl:min-w-[170px] border-r border-gray-700/50">
                        <div className="flex items-center space-x-2 xl:space-x-3">
                          <div>
                            <p className="text-gray-300 text-sm xl:text-base font-medium">{formatDate(withdrawal.requested_at)}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 xl:px-6 py-4 min-w-[120px] xl:min-w-[150px] border-r border-gray-700/50">
                        <div className={`inline-flex items-center space-x-2 xl:space-x-3 px-3 xl:px-5 py-2 xl:py-3 rounded-lg xl:rounded-xl border ${getStatusColor(withdrawal.status)} shadow-lg`}>
                          {getStatusIcon(withdrawal.status)}
                          <span className="text-sm xl:text-base font-semibold whitespace-nowrap">{getStatusText(withdrawal.status)}</span>
                        </div>
                      </td>
                      
                      <td className="px-4 xl:px-6 py-4 min-w-[140px] xl:min-w-[170px]">
                        <div className="flex items-center space-x-2 xl:space-x-3">
                          {withdrawal.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                                disabled={processingId === withdrawal.id}
                                className="bg-green-500 hover:bg-green-600 text-white flex-shrink-0 rounded-lg xl:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 px-3 xl:px-4 py-2"
                              >
                                <CheckCircle className="w-4 h-4 xl:w-5 xl:h-5" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(withdrawal.id, 'rejected')}
                                disabled={processingId === withdrawal.id}
                                className="bg-red-500 hover:bg-red-600 text-white flex-shrink-0 rounded-lg xl:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 px-3 xl:px-4 py-2"
                              >
                                <XCircle className="w-4 h-4 xl:w-5 xl:h-5" />
                              </Button>
                            </>
                          )}
                          {withdrawal.status === 'processing' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                              disabled={processingId === withdrawal.id}
                              className="bg-green-500 hover:bg-green-600 text-white flex-shrink-0 rounded-lg xl:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 px-3 xl:px-4 py-2"
                            >
                              <CheckCircle className="w-4 h-4 xl:w-5 xl:h-5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredWithdrawals.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2">Aucune demande trouvée</h3>
              <p className="text-gray-400 text-xs sm:text-sm lg:text-base">Aucune demande de retrait ne correspond à vos critères</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminWithdrawals;