import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const CreatorRoute = ({ children }) => {
    const { user, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!userProfile?.is_creator) {
        return <Navigate to="/become-creator" replace />;
    }

    return children;
};

export default CreatorRoute; 