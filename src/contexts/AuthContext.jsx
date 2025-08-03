
import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  const [profileLoading, setProfileLoading] = useState(false)
  const isInitialized = useRef(false)

  const fetchUserProfile = async (userId) => {
    if (profileLoading) return // Éviter les appels multiples

    try {
      setProfileLoading(true)
      console.log('🔍 Fetching user profile for:', userId)

      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, photourl, is_creator, created_at')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Error fetching user profile:', error)

        // Si l'utilisateur n'existe pas dans la table users, on peut le créer
        if (error.code === 'PGRST116') { // No rows returned
          console.log('🔧 User not found in users table, creating...')

          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  name: user.user_metadata?.name || user.email.split('@')[0],
                  is_creator: false,
                  photourl: user.user_metadata?.avatar_url || null
                }
              ])

            if (insertError) {
              console.error('❌ Error creating user profile:', insertError)
              setUserProfile(null)
            } else {
              console.log('✅ User profile created, fetching again...')
              // Retry fetch
              const { data: newData, error: newError } = await supabase
                .from('users')
                .select('id, email, name, photourl, is_creator, created_at')
                .eq('id', userId)
                .single()

              if (newError) {
                console.error('❌ Error fetching newly created profile:', newError)
                setUserProfile(null)
              } else {
                console.log('✅ User profile loaded:', newData)
                setUserProfile(newData)
              }
            }
          }
        } else {
          setUserProfile(null)
        }
      } else {
        console.log('✅ User profile loaded:', data)
        setUserProfile(data)
      }
    } catch (error) {
      console.error('❌ Unexpected error in fetchUserProfile:', error)
      setUserProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

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
        console.log('Auth state changed:', event, session?.user?.id)
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
      isInitialized.current = false
    }
  }, [])

  const signUp = async ({ email, password, name }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          },
          emailRedirectTo: `${window.location.origin}/confirm-email`
        }
      })

      if (error) throw error

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: email,
              name: name,
              is_creator: false,
              photourl: null
            }
          ])

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          // Ne pas faire échouer l'inscription si le profil ne peut pas être créé
          // L'utilisateur pourra le créer plus tard
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
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
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Google sign in error:', error)
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

      // Refresh user profile
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

      // Refresh user profile
      await fetchUserProfile(user.id)
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
