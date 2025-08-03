
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Heart,
  ShoppingBag,
  MessageCircle,
  User,
  Star,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, userProfile } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: Search, label: 'Explorer', path: '/explore' },
    { icon: Heart, label: 'Abonnements', path: '/subscriptions' },
    { icon: ShoppingBag, label: 'Mes achats', path: '/purchases' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profil', path: '/profile' },
  ];

  if (userProfile?.is_creator) {
    menuItems.push({ icon: BarChart3, label: 'Tableau de bord', path: '/dashboard' });
  } else {
    menuItems.push({ icon: Star, label: 'Devenir créateur', path: '/become-creator' });
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
                  ? 'bg-[#FF5A00] text-white'
                  : 'text-gray-300 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
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
      </div>
    </aside>
  );
};

export default Sidebar;
