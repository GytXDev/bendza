import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const usePaymentTransaction = () => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    /**
     * Enregistre une transaction de paiement dans la base de données
     */
    const recordPaymentTransaction = async (amount, mobileNumber) => {
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
                        amount: amount,
                        currency: 'XOF',
                        payment_method: 'mobile_money',
                        status: 'paid',
                        type: 'achat_unitaire',
                        payment_reference: mobileNumber,
                    },
                ])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
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