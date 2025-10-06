import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useViews = () => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    /**
     * Enregistre une vue pour un contenu spécifique
     * @param {string} contentId - ID du contenu visionné
     * @param {string} creatorId - ID du créateur du contenu (pour vérifier l'accès gratuit)
     * @returns {Object} Résultat de l'enregistrement
     */
    const recordView = async (contentId, creatorId = null) => {
        if (!user) {
            return { success: false, error: 'Utilisateur non connecté' };
        }

        // Si l'utilisateur est le créateur du contenu, pas besoin d'enregistrer de vue
        if (creatorId && user.id === creatorId) {
            return { success: true, message: 'Créateur du contenu - accès gratuit' };
        }

        setLoading(true);
        try {
            // Vérifier si l'utilisateur a déjà visionné ce contenu
            const { data: existingView, error: checkError } = await supabase
                .from('views')
                .select('id')
                .eq('user_id', user.id)
                .eq('content_id', contentId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                // PGRST116 = "not found", ce qui est normal pour une première vue
                throw checkError;
            }

            // Si la vue existe déjà, ne pas l'enregistrer à nouveau
            if (existingView) {
                return { success: true, message: 'Vue déjà enregistrée' };
            }

            // Enregistrer la nouvelle vue
            const { data, error } = await supabase
                .from('views')
                .insert([
                    {
                        user_id: user.id,
                        content_id: contentId,
                        viewed_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data, message: 'Vue enregistrée avec succès' };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };


    /**
     * Vérifie si un utilisateur a déjà visionné un contenu
     * @param {string} contentId - ID du contenu
     * @returns {Object} Résultat de la vérification
     */
    const hasViewed = async (contentId) => {
        if (!user) {
            return { hasViewed: false, error: 'Utilisateur non connecté' };
        }

        try {
            const { data, error } = await supabase
                .from('views')
                .select('id, viewed_at')
                .eq('user_id', user.id)
                .eq('content_id', contentId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return { 
                hasViewed: !!data, 
                viewedAt: data?.viewed_at || null 
            };
        } catch (error) {
            return { hasViewed: false, error: error.message };
        }
    };

    /**
     * Récupère le nombre total de vues pour un contenu
     * @param {string} contentId - ID du contenu
     * @returns {Object} Nombre de vues
     */
    const getViewCount = async (contentId) => {
        try {
            const { count, error } = await supabase
                .from('views')
                .select('*', { count: 'exact', head: true })
                .eq('content_id', contentId);

            if (error) {
                throw error;
            }

            return { count: count || 0, success: true };
        } catch (error) {
            return { count: 0, success: false, error: error.message };
        }
    };

    /**
     * Récupère les vues d'un utilisateur
     * @param {number} limit - Nombre maximum de vues à récupérer
     * @returns {Object} Liste des vues
     */
    const getUserViews = async (limit = 50) => {
        if (!user) {
            return { views: [], error: 'Utilisateur non connecté' };
        }

        try {
            const { data, error } = await supabase
                .from('views')
                .select(`
                    id,
                    viewed_at,
                    content:content_id (
                        id,
                        title,
                        type,
                        price,
                        url,
                        thumbnail_url,
                        creator_id,
                        users:creator_id (
                            id,
                            name,
                            photourl
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('viewed_at', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            return { views: data || [], success: true };
        } catch (error) {
            return { views: [], success: false, error: error.message };
        }
    };


    return {
        recordView,
        hasViewed,
        getViewCount,
        getUserViews,
        loading
    };
};
