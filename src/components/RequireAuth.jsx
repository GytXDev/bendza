import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RequireAuth = ({ children, redirectTo = "/login" }) => {
  const { user, loading } = useAuth();

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!loading && !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si l'utilisateur est connecté, afficher le contenu
  if (user) {
    return children;
  }

  // Pendant le chargement, afficher un indicateur minimal
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default RequireAuth;
