
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

  // Fonction simple pour récupérer le profil utilisateur
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, photourl, is_creator, created_at, updated_at')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Utilisateur n'existe pas, le créer
          const createdUser = await createUserFromAuth(userId)
          if (createdUser) {
            setUserProfile(createdUser)
          }
          return createdUser
        }
        setUserProfile(null)
        return null
      }
      
      setUserProfile(data)
      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUserProfile(null)
      return null
    }
  }

  // Fonction simple pour créer un utilisateur
  const createUserFromAuth = async (userId) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) return null

      const userData = {
        id: userId,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Utilisateur',
        photourl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        is_creator: false
      }

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          // Utilisateur existe déjà, le récupérer
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (!fetchError && existingUser) {
            return existingUser
          }
        }
        console.error('Error creating user:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createUserFromAuth:', error)
      return null
    }
  }

  useEffect(() => {
    // Récupération initiale de la session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setUser(null)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async ({ email, password, name }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/confirm-email`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const becomeCreator = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_creator: true })
        .eq('id', user.id)

      if (error) throw error
      await fetchUserProfile(user.id)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (updates) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Recharger le profil
      const profile = await fetchUserProfile(user.id)
      setUserProfile(profile)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    becomeCreator,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
