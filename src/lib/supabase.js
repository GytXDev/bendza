import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'bendza-auth-token',
    flowType: 'pkce',
    debug: false // Désactiver les logs de debug
  }
})

// Database types based on your schema
export const TABLES = {
    USERS: 'users',
    CREATORS: 'creators',
    CONTENT: 'content',
    TRANSACTIONS: 'transactions',
    MESSAGES: 'messages',
    PAYOUTS: 'payouts'
} 