// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
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
      console.log('⚠️ AuthContext: upsertUser called with no user');
      return;
    }
    
    console.log('💾 AuthContext: Upserting user to database:', user.email);
    
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
        console.log('✅ AuthContext: User already exists, keeping existing data:', existingUser);
        return;
      } else {
        // L'utilisateur n'existe pas, l'insérer avec les données de Supabase Auth
        console.log('➕ AuthContext: Inserting new user');
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
        
        console.log('✅ AuthContext: User inserted successfully:', data);
      }
    } catch (error) {
      console.error('❌ AuthContext: Upsert user failed:', error);
      throw error;
    }
  };

  // Fetch user profile from DB
  const fetchUserProfile = async (userId) => {
    console.log('📊 AuthContext: Fetching profile for user ID:', userId);
    
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
      
      console.log('📊 AuthContext: Profile data received:', data);
      return data;
    } catch (error) {
      console.error('❌ AuthContext: Exception in fetchUserProfile:', error);
      return null;
    }
  };

  // Handle session
  const handleSession = async (session) => {
    console.log('🔍 AuthContext: handleSession called with:', session?.user?.email || 'no user');
    
    if (session?.user) {
      const { user: authUser } = session;
      console.log('👤 AuthContext: Processing user:', authUser.email);
      
      try {
        console.log('💾 AuthContext: Upserting user...');
        await upsertUser(authUser);
        console.log('✅ AuthContext: User upserted successfully');
        
        console.log('📊 AuthContext: Fetching user profile...');
        const profile = await fetchUserProfile(authUser.id);
      console.log('📊 AuthContext: Profile fetched:', profile);
      console.log('🖼️ AuthContext: Photo sources - DB:', profile?.photourl, 'Auth:', authUser.user_metadata?.avatar_url);
      console.log('👑 AuthContext: User role:', profile?.role);
        
      // Utiliser la photo de la base de données si elle existe, sinon celle de Supabase Auth
      const finalPhotourl = profile?.photourl || authUser.user_metadata?.avatar_url || null;
      console.log('🖼️ AuthContext: Final photo URL selected:', finalPhotourl);
      console.log('🖼️ AuthContext: Photo from DB:', profile?.photourl);
      console.log('🖼️ AuthContext: Photo from Auth:', authUser.user_metadata?.avatar_url);
      
      // Vérifier si on vient de faire une mise à jour récente (dans les 10 dernières secondes)
      const recentUpdate = Date.now() - lastProfileUpdate.current < 10000;
      console.log('⏰ AuthContext: Recent profile update?', recentUpdate, 'Time since last update:', Date.now() - lastProfileUpdate.current);
      
      // Si on vient de faire une mise à jour récente, ne pas écraser les données
      if (recentUpdate) {
        console.log('⚠️ AuthContext: Skipping user data update due to recent profile update');
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
        
        console.log('🎯 AuthContext: Setting user data:', userData);
        setUser(userData);
        
        // Afficher un message de succès seulement si c'est une nouvelle connexion
        if (session && session.user) {
          console.log('✅ AuthContext: User successfully authenticated:', userData.email);
        }
        
        // S'assurer que loading est mis à false après setUser
        setLoading(false);
      } catch (error) {
        console.error('❌ AuthContext: Error in handleSession:', error);
        setUser(null);
        setLoading(false);
      }
    } else {
      console.log('🚫 AuthContext: No session, setting user to null');
      setUser(null);
      setLoading(false);
    }
  };

  // On mount, subscribe to auth changes
  useEffect(() => {
    console.log('🚀 AuthContext: useEffect started');
    
    let mounted = true;
    let listener = null;
    
    const initializeAuth = async () => {
      try {
        console.log('🔧 AuthContext: Initializing authentication...');
        
        // Récupérer la session initiale
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 AuthContext: Initial session retrieved:', session?.user?.email || 'no user', error);
        
        if (mounted) {
          await handleSession(session);
        }
        
        // S'abonner aux changements d'authentification
        if (mounted) {
          console.log('👂 AuthContext: Setting up auth state listener...');
          const { data } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 AuthContext: Auth state change detected:', event, session?.user?.email || 'no user');
            if (mounted) {
              handleSession(session);
            }
          });
          listener = data;
          console.log('✅ AuthContext: Auth listener set up successfully');
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
      console.log('🧹 AuthContext: Cleanup - unmounting');
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
      
      console.log('✅ Token réinitialisé avec succès');
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
    
    console.log('🔄 AuthContext: Updating profile with:', updates);
    
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('❌ AuthContext: Error updating profile in database:', error);
      throw error;
    }

    console.log('✅ AuthContext: Profile updated in database successfully');
    
    // Enregistrer le timestamp de la mise à jour
    lastProfileUpdate.current = Date.now();
    
    // Forcer une récupération du profil depuis la base de données
    console.log('🔄 AuthContext: Refreshing profile from database...');
    const refreshedProfile = await fetchUserProfile(user.id);
    console.log('🔄 AuthContext: Refreshed profile:', refreshedProfile);
    
    // Mettre à jour l'utilisateur local avec les données fraîches de la base
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { 
        ...prev, 
        ...updates,
        photourl: refreshedProfile?.photourl || updates.photourl || prev.photourl,
        profile: refreshedProfile
      };
      console.log('🔄 AuthContext: Updated local user state with fresh data:', updatedUser);
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