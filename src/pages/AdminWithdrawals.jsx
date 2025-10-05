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
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
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
          <div className="text-white text-xl">Chargement des retraits...</div>
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

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 mt-16 md:mt-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Administration des Retraits</h1>
            <p className="text-gray-400 text-sm md:text-base">Gérer les demandes de retrait des créateurs</p>
          </div>
          <Button
            onClick={fetchWithdrawals}
            className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Filtres */}
        <div className="bg-gray-900 rounded-xl p-4 md:p-6 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm md:text-base"
                />
              </div>
            </div>

            {/* Filtre par statut */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm md:text-base"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs md:text-sm">Total demandes</p>
                <p className="text-lg md:text-2xl font-bold text-white">{withdrawals.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs md:text-sm">En attente</p>
                <p className="text-lg md:text-2xl font-bold text-yellow-400">
                  {withdrawals.filter(w => w.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs md:text-sm">Terminées</p>
                <p className="text-lg md:text-2xl font-bold text-green-400">
                  {withdrawals.filter(w => w.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs md:text-sm">Montant total</p>
                <p className="text-lg md:text-2xl font-bold text-white">
                  {withdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString()} <span className="text-sm md:text-lg">FCFA</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des retraits */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-lg md:text-xl font-bold text-white">Demandes de Retrait</h2>
            <p className="text-gray-400 text-xs md:text-sm">
              {filteredWithdrawals.length} demande(s) trouvée(s)
            </p>
          </div>

          {/* Version mobile - Cartes */}
          <div className="block md:hidden">
            {filteredWithdrawals.map((withdrawal) => (
              <motion.div
                key={withdrawal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-b border-gray-700 last:border-b-0"
              >
                <div className="space-y-3">
                  {/* Header avec créateur et statut */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={withdrawal.users?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${withdrawal.users?.name}`}
                        alt={withdrawal.users?.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">{withdrawal.users?.name}</p>
                        <p className="text-gray-400 text-xs">{withdrawal.users?.email}</p>
                      </div>
                    </div>
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border ${getStatusColor(withdrawal.status)}`}>
                      {getStatusIcon(withdrawal.status)}
                      <span className="text-xs font-medium">{getStatusText(withdrawal.status)}</span>
                    </div>
                  </div>

                  {/* Montants */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-gray-400 text-xs">Montant</p>
                      <p className="text-white font-medium text-sm">{withdrawal.amount.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Frais</p>
                      <p className="text-red-400 text-sm">{withdrawal.withdrawal_fee?.toLocaleString() || 0} FCFA</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Net</p>
                      <p className="text-green-400 font-medium text-sm">{withdrawal.net_amount?.toLocaleString() || withdrawal.amount.toLocaleString()} FCFA</p>
                    </div>
                  </div>

                  {/* Contact et date */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getCountryFlag(withdrawal.country)}</span>
                      <span className="text-white">{withdrawal.phone_number}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(withdrawal.requested_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {withdrawal.status === 'pending' && (
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                        disabled={processingId === withdrawal.id}
                        className="bg-green-500 hover:bg-green-600 text-white flex-1 text-xs"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(withdrawal.id, 'rejected')}
                        disabled={processingId === withdrawal.id}
                        className="bg-red-500 hover:bg-red-600 text-white flex-1 text-xs"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
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
                        className="bg-green-500 hover:bg-green-600 text-white w-full text-xs"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Marquer comme terminé
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Version desktop - Tableau */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Créateur</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Montant</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Frais</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Net</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={withdrawal.users?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${withdrawal.users?.name}`}
                          alt={withdrawal.users?.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-white font-medium">{withdrawal.users?.name}</p>
                          <p className="text-gray-400 text-sm">{withdrawal.users?.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{withdrawal.amount.toLocaleString()} FCFA</p>
                    </td>
                    
                    <td className="px-6 py-4">
                      <p className="text-red-400">{withdrawal.withdrawal_fee?.toLocaleString() || 0} FCFA</p>
                    </td>
                    
                    <td className="px-6 py-4">
                      <p className="text-green-400 font-medium">{withdrawal.net_amount?.toLocaleString() || withdrawal.amount.toLocaleString()} FCFA</p>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCountryFlag(withdrawal.country)}</span>
                        <div>
                          <p className="text-white text-sm">{withdrawal.phone_number}</p>
                          <p className="text-gray-400 text-xs">{withdrawal.country}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">{formatDate(withdrawal.requested_at)}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                        <span className="text-sm font-medium">{getStatusText(withdrawal.status)}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {withdrawal.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                              disabled={processingId === withdrawal.id}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(withdrawal.id, 'rejected')}
                              disabled={processingId === withdrawal.id}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {withdrawal.status === 'processing' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                            disabled={processingId === withdrawal.id}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredWithdrawals.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <DollarSign className="w-12 h-12 md:w-16 md:h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">Aucune demande trouvée</h3>
              <p className="text-gray-400 text-sm md:text-base">Aucune demande de retrait ne correspond à vos critères</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminWithdrawals;
