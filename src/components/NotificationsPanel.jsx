import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { 
    Bell, 
    CheckCircle, 
    XCircle, 
    DollarSign, 
    UserPlus,
    X,
    Eye
} from 'lucide-react';

function NotificationsPanel({ isOpen, onClose }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Charger les notifications
    const loadNotifications = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            setNotifications(data || []);
            
            // Compter les notifications non lues
            const unread = (data || []).filter(n => !n.is_read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Erreur lors du chargement des notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && isOpen) {
            loadNotifications();
        }
    }, [user, isOpen]);

    // Marquer une notification comme lue
    const markAsRead = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;

            // Mettre à jour l'état local
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la notification:', error);
        }
    };

    // Marquer toutes les notifications comme lues
    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            // Mettre à jour l'état local
            setNotifications(prev => 
                prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Erreur lors de la mise à jour des notifications:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'content_approved':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'content_rejected':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'payment_received':
                return <DollarSign className="w-5 h-5 text-orange-500" />;
            case 'new_follower':
                return <UserPlus className="w-5 h-5 text-blue-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'content_approved':
                return 'border-l-green-500';
            case 'content_rejected':
                return 'border-l-red-500';
            case 'payment_received':
                return 'border-l-orange-500';
            case 'new_follower':
                return 'border-l-blue-500';
            default:
                return 'border-l-gray-500';
        }
    };

    const formatDate = (date) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffInHours = Math.floor((now - notificationDate) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'À l\'instant';
        } else if (diffInHours < 24) {
            return `Il y a ${diffInHours}h`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `Il y a ${diffInDays}j`;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-900 rounded-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-orange-500" />
                        <h2 className="text-lg font-semibold text-white">Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                            <Button
                                onClick={markAllAsRead}
                                variant="outline"
                                size="sm"
                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                                Tout marquer comme lu
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Liste des notifications */}
                <div className="overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-400">Chargement...</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y divide-gray-800">
                            {notifications.map((notification) => (
                                <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                                        !notification.is_read ? 'bg-gray-800/50' : ''
                                    } hover:bg-gray-800/30 transition-colors cursor-pointer`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="flex items-start space-x-3">
                                        {getNotificationIcon(notification.type)}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-medium text-sm">
                                                {notification.title}
                                            </h4>
                                            <p className="text-gray-300 text-sm mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-2">
                                                {formatDate(notification.created_at)}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-white font-medium mb-2">Aucune notification</h3>
                            <p className="text-gray-400 text-sm">
                                Vous recevrez des notifications pour vos contenus et paiements.
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default NotificationsPanel;
