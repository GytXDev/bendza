// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Retourner des valeurs par défaut au lieu de lancer une erreur
    return {
      user: null,
      loading: true,
      signInWithGoogle: () => Promise.resolve(),
      signOut: () => Promise.resolve(),
      resetToken: () => Promise.resolve(),
      becomeCreator: () => Promise.resolve(),
      updateProfile: () => Promise.resolve()
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastProfileUpdate = useRef(0);
  const initialized = useRef(false);

  // Upsert user in DB (ne pas écraser les données existantes)
  const upsertUser = async (user) => {
    if (!user) {
      return;
    }
    
    
    try {
      // D'abord, vérifier si l'utilisateur existe déjà
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id, name, photourl')
        .eq('id', user.id)
        .maybeSingle();
      
      if (selectError) {
        console.error('❌ AuthContext: Error checking existing user:', selectError);
        throw selectError;
      }
      
      if (existingUser) {
        // L'utilisateur existe, ne pas l'écraser - garder les données existantes
        return;
      } else {
        // L'utilisateur n'existe pas, l'insérer avec les données de Supabase Auth
        const userData = {
          id: user.id,
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
          email: user.email,
          photourl: user.user_metadata?.avatar_url || null
        };
        
        const { data, error } = await supabase
          .from('users')
          .insert([userData])
          .select();
        
        if (error) {
          console.error('❌ AuthContext: Error inserting user:', error);
          throw error;
        }
        
      }
    } catch (error) {
      console.error('❌ AuthContext: Upsert user failed:', error);
      throw error;
    }
  };

  // Fetch user profile from DB
  const fetchUserProfile = async (userId) => {
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, photourl, is_creator, role, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ AuthContext: Error fetching user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ AuthContext: Exception in fetchUserProfile:', error);
      return null;
    }
  };

  // Handle session
  const handleSession = async (session) => {
    
    if (session?.user) {
      const { user: authUser } = session;
      
      try {
        await upsertUser(authUser);
        const profile = await fetchUserProfile(authUser.id);
        
      // Utiliser la photo de la base de données si elle existe, sinon celle de Supabase Auth
      const finalPhotourl = profile?.photourl || authUser.user_metadata?.avatar_url || null;
      
      // Vérifier si on vient de faire une mise à jour récente (dans les 10 dernières secondes)
      const recentUpdate = Date.now() - lastProfileUpdate.current < 10000;
      
      // Si on vient de faire une mise à jour récente, ne pas écraser les données
      if (recentUpdate) {
        setLoading(false);
        return;
      }
      
      const userData = {
        id: authUser.id,
        email: authUser.email,
        // Toujours utiliser les données de la base de données si elles existent, sinon fallback sur Supabase Auth
        name: profile?.name || authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Utilisateur',
        photourl: finalPhotourl,
        is_creator: profile?.is_creator || false,
        role: profile?.role || null,
        profile: profile
      };
        
        setUser(userData);
        
        // Afficher un message de succès seulement si c'est une nouvelle connexion
        if (session && session.user) {
        }
        
        // S'assurer que loading est mis à false après setUser
        setLoading(false);
      } catch (error) {
        console.error('❌ AuthContext: Error in handleSession:', error);
        setUser(null);
        setLoading(false);
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  };

  // On mount, subscribe to auth changes
  useEffect(() => {
    
    let mounted = true;
    let listener = null;
    
    const initializeAuth = async () => {
      try {
        
        // Récupérer la session initiale
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          await handleSession(session);
        }
        
        // S'abonner aux changements d'authentification
        if (mounted) {
          const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (mounted) {
              handleSession(session);
            }
          });
          listener = data;
        }
      } catch (error) {
        console.error('❌ AuthContext: Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initializeAuth();

    return () => {
      mounted = false;
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
    }
    };
  }, []);

  // Google Sign In
  const signInWithGoogle = async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
    });
    if (error) throw error;
    return { data, error: null };
  };

  // Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Force reset token (nettoyage complet)
  const resetToken = async () => {
    try {
      // Déconnexion via Supabase
      await supabase.auth.signOut();
      
      // Nettoyage manuel du localStorage
      localStorage.removeItem('bendza-auth-token');
      localStorage.removeItem(`sb-${window.location.hostname}-auth-token`);
      
      // Nettoyer tous les tokens Supabase
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth-token')) {
          localStorage.removeItem(key);
        }
      });
      
      setUser(null);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
    }
  };

  // Become Creator
  const becomeCreator = async () => {
    if (!user) throw new Error('User not authenticated');
    
      const { error } = await supabase
        .from('users')
        .update({ is_creator: true })
      .eq('id', user.id);

    if (error) throw error;

    // Mettre à jour l'utilisateur local
    setUser(prev => prev ? { ...prev, is_creator: true } : null);
    return { error: null };
  };

  // Update Profile
  const updateProfile = async (updates) => {
    if (!user) throw new Error('User not authenticated');
    
    
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('AuthContext: Error updating profile in database:', error);
      throw error;
    }

    
    // Enregistrer le timestamp de la mise à jour
    lastProfileUpdate.current = Date.now();
    
    // Forcer une récupération du profil depuis la base de données
    const refreshedProfile = await fetchUserProfile(user.id);
    
    // Mettre à jour l'utilisateur local avec les données fraîches de la base
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { 
        ...prev, 
        ...updates,
        photourl: refreshedProfile?.photourl || updates.photourl || prev.photourl,
        profile: refreshedProfile
      };
      return updatedUser;
    });
    
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ 
    user,
      loading, 
    signInWithGoogle,
    signOut,
      resetToken,
    becomeCreator,
    updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};