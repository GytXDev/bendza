import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DashboardContext = createContext({})

export const useDashboard = () => {
    const context = useContext(DashboardContext)
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider')
    }
    return context
}

export const DashboardProvider = ({ children }) => {
    const { user, userProfile } = useAuth()
    const [dashboardData, setDashboardData] = useState({
        stats: null,
        recentContent: [],
        earnings: null
    })
    const [loading, setLoading] = useState(false)

    // Charger les données du dashboard
    const loadDashboardData = async () => {
        if (!user || !userProfile?.is_creator) return

        setLoading(true)
        try {
            // Charger les statistiques
            const { data: stats } = await supabase
                .from('content')
                .select('views_count, likes_count')
                .eq('creator_id', user.id)

            // Charger le contenu récent
            const { data: recentContent } = await supabase
                .from('content')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            // Calculer les statistiques
            const totalViews = stats?.reduce((sum, item) => sum + (item.views_count || 0), 0) || 0
            const totalLikes = stats?.reduce((sum, item) => sum + (item.likes_count || 0), 0) || 0

            setDashboardData({
                stats: {
                    totalViews,
                    totalLikes,
                    contentCount: recentContent?.length || 0
                },
                recentContent: recentContent || [],
                earnings: null // À implémenter selon vos besoins
            })
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Recharger les données
    const refreshDashboard = () => {
        loadDashboardData()
    }

    useEffect(() => {
        if (user && userProfile?.is_creator) {
            loadDashboardData()
        }
    }, [user, userProfile])

    const value = {
        dashboardData,
        loading,
        refreshDashboard
    }

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    )
} 