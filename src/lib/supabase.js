import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérifier que les variables d'environnement sont définies
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration error: Missing environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'bendza-auth-token',
    flowType: 'pkce',
    debug: false
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