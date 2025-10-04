// src/components/RequireAuth.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

const RequireAuth = ({ children, redirectTo = "/login" }) => {
  const { user, loading } = useAuth();

  // Afficher un loader pendant le chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg">Vérification de la session...</div>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!user && !loading) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si l'utilisateur est connecté, afficher le contenu
  return children;
};

export default RequireAuth;