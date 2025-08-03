import { supabase } from './supabase'

// Fonctions de diagnostic Supabase
export const supabaseDebug = {
  // Test de connexion à Supabase
  testConnection: async () => {
    console.log('🔍 Testing Supabase connection...')
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('❌ Connection failed:', error)
        return { success: false, error }
      }
      
      console.log('✅ Supabase connection successful')
      return { success: true, data }
    } catch (err) {
      console.error('❌ Connection error:', err)
      return { success: false, error: err }
    }
  },

  // Test des tables
  testTables: async () => {
    console.log('🔍 Testing table access...')
    
    const tables = ['users', 'creators', 'content', 'transactions', 'messages', 'payouts']
    const results = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.error(`❌ Table ${table} access failed:`, error)
          results[table] = { success: false, error }
        } else {
          console.log(`✅ Table ${table} accessible`)
          results[table] = { success: true, data }
        }
      } catch (err) {
        console.error(`❌ Table ${table} error:`, err)
        results[table] = { success: false, error: err }
      }
    }
    
    return results
  },

  // Test de l'authentification
  testAuth: async () => {
    console.log('🔍 Testing authentication...')
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Auth session failed:', error)
        return { success: false, error }
      }
      
      if (session) {
        console.log('✅ User authenticated:', session.user.email)
        
        // Test user profile fetch
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profileError) {
            console.error('❌ Profile fetch failed:', profileError)
            return { 
              success: false, 
              error: profileError, 
              session,
              message: 'User authenticated but profile fetch failed'
            }
          }
          
          console.log('✅ User profile loaded:', profile)
          return { success: true, session, profile }
        } catch (profileErr) {
          console.error('❌ Profile fetch error:', profileErr)
          return { 
            success: false, 
            error: profileErr, 
            session,
            message: 'User authenticated but profile fetch error'
          }
        }
      } else {
        console.log('ℹ️ No active session')
        return { success: true, session: null, message: 'No active session' }
      }
    } catch (err) {
      console.error('❌ Auth error:', err)
      return { success: false, error: err }
    }
  },

  // Test complet
  runFullDiagnostic: async () => {
    console.log('🚀 Running full Supabase diagnostic...')
    console.log('=====================================')
    
    const connection = await supabaseDebug.testConnection()
    const tables = await supabaseDebug.testTables()
    const auth = await supabaseDebug.testAuth()
    
    console.log('=====================================')
    console.log('📊 DIAGNOSTIC SUMMARY:')
    console.log('Connection:', connection.success ? '✅' : '❌')
    console.log('Tables:', Object.values(tables).every(t => t.success) ? '✅' : '❌')
    console.log('Auth:', auth.success ? '✅' : '❌')
    
    if (!connection.success) {
      console.log('🔧 SUGGESTION: Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    }
    
    if (!Object.values(tables).every(t => t.success)) {
      console.log('🔧 SUGGESTION: Check RLS policies and table permissions')
    }
    
    if (!auth.success && auth.error) {
      console.log('🔧 SUGGESTION: Check authentication setup')
    }
    
    return { connection, tables, auth }
  },

  // Test spécifique pour BecomeCreator
  testBecomeCreatorFlow: async () => {
    console.log('🔍 Testing BecomeCreator flow...')
    
    try {
      // 1. Test auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        return { success: false, step: 'session', error: sessionError }
      }
      
      if (!session) {
        console.log('ℹ️ No session - user not logged in')
        return { success: true, step: 'session', message: 'No session' }
      }
      
      console.log('✅ Session found for:', session.user.email)
      
      // 2. Test user profile fetch
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, photourl, is_creator, created_at')
        .eq('id', session.user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Profile fetch error:', profileError)
        return { success: false, step: 'profile', error: profileError, session }
      }
      
      console.log('✅ Profile loaded:', profile)
      
      // 3. Check creator status
      if (profile.is_creator) {
        console.log('ℹ️ User is already a creator')
        return { success: true, step: 'creator_check', profile, isCreator: true }
      } else {
        console.log('ℹ️ User is not a creator yet')
        return { success: true, step: 'creator_check', profile, isCreator: false }
      }
      
    } catch (err) {
      console.error('❌ BecomeCreator flow error:', err)
      return { success: false, step: 'unknown', error: err }
    }
  },

  // Test détaillé du problème de chargement infini
  testInfiniteLoadingIssue: async () => {
    console.log('🔍 Testing infinite loading issue...')
    console.log('=====================================')
    
    const results = {
      timestamp: new Date().toISOString(),
      steps: {}
    }
    
    try {
      // Étape 1: Vérifier la session
      console.log('📋 Step 1: Checking session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        results.steps.session = { success: false, error: sessionError }
        console.error('❌ Session error:', sessionError)
      } else if (!session) {
        results.steps.session = { success: true, message: 'No session' }
        console.log('ℹ️ No session found')
      } else {
        results.steps.session = { success: true, user: { id: session.user.id, email: session.user.email } }
        console.log('✅ Session found:', session.user.email)
      }
      
      // Étape 2: Vérifier si l'utilisateur existe dans la table users
      if (session) {
        console.log('📋 Step 2: Checking user in users table...')
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, name, is_creator, created_at')
          .eq('id', session.user.id)
        
        if (usersError) {
          results.steps.usersTable = { success: false, error: usersError }
          console.error('❌ Users table query error:', usersError)
        } else if (!users || users.length === 0) {
          results.steps.usersTable = { success: true, message: 'User not found in users table', count: 0 }
          console.log('⚠️ User not found in users table')
        } else {
          results.steps.usersTable = { success: true, user: users[0], count: users.length }
          console.log('✅ User found in users table:', users[0])
        }
      }
      
      // Étape 3: Tester la requête exacte utilisée dans AuthContext
      if (session) {
        console.log('📋 Step 3: Testing exact AuthContext query...')
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          results.steps.authContextQuery = { success: false, error: profileError }
          console.error('❌ AuthContext query error:', profileError)
        } else {
          results.steps.authContextQuery = { success: true, profile }
          console.log('✅ AuthContext query successful:', profile)
        }
      }
      
      // Étape 4: Vérifier les variables d'environnement
      console.log('📋 Step 4: Checking environment variables...')
      const envCheck = {
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      }
      
      results.steps.environment = envCheck
      console.log('✅ Environment check:', envCheck)
      
      // Étape 5: Test de performance
      console.log('📋 Step 5: Testing query performance...')
      const startTime = performance.now()
      
      const { data: perfTest, error: perfError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      results.steps.performance = {
        success: !perfError,
        duration: `${duration.toFixed(2)}ms`,
        error: perfError
      }
      
      console.log(`✅ Performance test: ${duration.toFixed(2)}ms`)
      
    } catch (err) {
      console.error('❌ Infinite loading test error:', err)
      results.error = err
    }
    
    console.log('=====================================')
    console.log('📊 INFINITE LOADING DIAGNOSTIC RESULTS:')
    console.log(JSON.stringify(results, null, 2))
    
    // Analyse des résultats
    if (results.steps.session && !results.steps.session.success) {
      console.log('🔧 ISSUE: Session problem - check authentication')
    }
    
    if (results.steps.usersTable && results.steps.usersTable.message === 'User not found in users table') {
      console.log('🔧 ISSUE: User missing from users table - needs profile creation')
    }
    
    if (results.steps.authContextQuery && !results.steps.authContextQuery.success) {
      console.log('🔧 ISSUE: AuthContext query failing - check RLS or table structure')
    }
    
    if (results.steps.environment && (!results.steps.environment.hasSupabaseUrl || !results.steps.environment.hasSupabaseKey)) {
      console.log('🔧 ISSUE: Missing environment variables')
    }
    
    if (results.steps.performance && results.steps.performance.duration > 5000) {
      console.log('🔧 ISSUE: Slow query performance - check network or database')
    }
    
    return results
  }
}

// Exporter pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.supabaseDebug = supabaseDebug
}

export default supabaseDebug 