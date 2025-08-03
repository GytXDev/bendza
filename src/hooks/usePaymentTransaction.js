import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const usePaymentTransaction = () => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    /**
     * Enregistre une transaction de paiement dans la base de données
     */
    const recordPaymentTransaction = async (paymentData) => {
        if (!user) {
            throw new Error('Utilisateur non connecté');
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .insert([
                    {
                        user_id: user.id,
                        amount: paymentData.amount,
                        currency: 'XOF',
                        payment_method: 'mobile_money',
                        status: 'completed',
                        transaction_type: paymentData.type,
                        reference: paymentData.reference,
                        transaction_id: paymentData.transactionId,
                        metadata: {
                            mobile_number: paymentData.mobileNumber,
                            description: paymentData.description,
                            payment_provider: 'airtel_money',
                        },
                    },
                ])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la transaction:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Récupère l'historique des transactions d'un utilisateur
     */
    const getTransactionHistory = async (limit = 10) => {
        if (!user) {
            throw new Error('Utilisateur non connecté');
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Vérifie le statut d'une transaction
     */
    const checkTransactionStatus = async (transactionId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('status, metadata')
                .eq('transaction_id', transactionId)
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Erreur lors de la vérification du statut:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        recordPaymentTransaction,
        getTransactionHistory,
        checkTransactionStatus,
    };
}; 