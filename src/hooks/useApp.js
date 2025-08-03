import { useAuth } from '../contexts/AuthContext'
import { useDashboard } from '../contexts/DashboardContext'

/**
 * Hook personnalisé qui combine les contextes d'authentification et de dashboard
 * Simplifie l'utilisation dans les composants
 */
export const useApp = () => {
    const auth = useAuth()
    const dashboard = useDashboard()

    return {
        // Auth
        user: auth.user,
        userProfile: auth.userProfile,
        loading: auth.loading,
        signUp: auth.signUp,
        signIn: auth.signIn,
        signInWithGoogle: auth.signInWithGoogle,
        signOut: auth.signOut,
        becomeCreator: auth.becomeCreator,
        updateProfile: auth.updateProfile,

        // Dashboard
        dashboardData: dashboard.dashboardData,
        dashboardLoading: dashboard.loading,
        refreshDashboard: dashboard.refreshDashboard,

        // Utilitaires
        isAuthenticated: !!auth.user,
        isCreator: auth.userProfile?.is_creator || false,
        isReady: !auth.loading
    }
} 