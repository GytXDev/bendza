
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  User,
  Star,
  BarChart3,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, userProfile } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Accueil', path: '/' },
  ];

  // Si l'utilisateur est connecté
  if (user) {
    menuItems.push({ icon: User, label: 'Profil', path: '/profile' });
    
    if (userProfile?.is_creator) {
      menuItems.push({ icon: BarChart3, label: 'Tableau de bord', path: '/dashboard' });
    } else {
      menuItems.push({ icon: Star, label: 'Devenir créateur', path: '/become-creator' });
    }
  } else {
    // Si l'utilisateur n'est pas connecté
    menuItems.push({ icon: LogIn, label: 'Connexion', path: '/login' });
    menuItems.push({ icon: UserPlus, label: 'Inscription', path: '/register' });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`bendza-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="p-6">
        {/* Logo */}
        <div className="mb-8">
          <Link to="/" className="flex items-center space-x-3" onClick={onClose}>
            <img src="/logo.png" alt="BENDZA" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-white">BENDZA</h1>
              <p className="text-xs text-gray-400">Crée. Publie. Encaisse.</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info - Affiché seulement si connecté */}
        {user && (
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center space-x-3">
              <img
                src={userProfile?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.name || user?.email}`}
                alt={userProfile?.name || user?.email}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userProfile?.name || user?.email}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Message pour les utilisateurs non connectés */}
        {!user && (
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-3">Connectez-vous pour accéder à plus de fonctionnalités</p>
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="block w-full bg-transparent border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  S'inscrire
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
