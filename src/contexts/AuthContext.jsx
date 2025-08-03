
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

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, 
          email, 
          name, 
          photourl, 
          is_creator, 
          creator_bio,
          creator_description,
          banner_url,
          account_type,
          subscription_price,
          creator_verified,
          creator_since,
          created_at
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setUserProfile(null)
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      setUserProfile(null)
    }
  }

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        setLoading(false)
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
          redirectTo: `${window.location.origin}`
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
      // Mapper les noms de champs du frontend vers la base de données
      const mappedUpdates = {}

      if (updates.bannerUrl !== undefined) {
        mappedUpdates.banner_url = updates.bannerUrl
      }
      if (updates.photourl !== undefined) {
        mappedUpdates.photourl = updates.photourl
      }
      if (updates.name !== undefined) {
        mappedUpdates.name = updates.name
      }
      if (updates.creatorBio !== undefined) {
        mappedUpdates.creator_bio = updates.creatorBio
      }
      if (updates.creatorDescription !== undefined) {
        mappedUpdates.creator_description = updates.creatorDescription
      }
      if (updates.accountType !== undefined) {
        mappedUpdates.account_type = updates.accountType
      }
      if (updates.subscriptionPrice !== undefined) {
        mappedUpdates.subscription_price = updates.subscriptionPrice
      }

      console.log('Mise à jour du profil avec:', mappedUpdates)

      const { error } = await supabase
        .from('users')
        .update(mappedUpdates)
        .eq('id', user.id)

      if (error) {
        console.error('Erreur lors de la mise à jour du profil:', error)
        throw error
      }

      await fetchUserProfile(user.id)
      return { error: null }
    } catch (error) {
      console.error('Erreur dans updateProfile:', error)
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
