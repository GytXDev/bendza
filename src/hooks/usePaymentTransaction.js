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
            console.log('📝 Tentative d\'enregistrement de la transaction:', {
                user_id: user.id,
                amount: paymentData.amount,
                type: paymentData.type,
                transaction_id: paymentData.transactionId
            });

            const { data, error } = await supabase
                .from('transactions')
                .insert([
                    {
                        user_id: user.id,
                        amount: paymentData.amount,
                        currency: 'XOF',
                        payment_method: 'mobile_money',
                        status: 'paid',
                        type: paymentData.type,
                        transaction_id: paymentData.transactionId,
                        metadata: {
                            mobile_number: paymentData.mobileNumber,
                            description: paymentData.description,
                            payment_provider: 'airtel_money',
                            reference: paymentData.reference,
                        },
                    },
                ])
                .select()
                .single();

            if (error) {
                console.error('❌ Erreur Supabase lors de l\'enregistrement:', error);

                // Si c'est une erreur de contrainte, on peut essayer de corriger
                if (error.code === 'PGRST204') {
                    console.log('🔧 Erreur de contrainte détectée, vérification de la structure...');
                    throw new Error(`Erreur de structure de base de données: ${error.message}. Veuillez exécuter le script de correction.`);
                }

                throw error;
            }

            console.log('✅ Transaction enregistrée avec succès:', data);
            return data;
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement de la transaction:', error);
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