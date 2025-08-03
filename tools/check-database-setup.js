const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes')
    console.log('Assurez-vous que .env.local contient:')
    console.log('VITE_SUPABASE_URL=your_supabase_url')
    console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseSetup() {
    console.log('🔍 Vérification de la configuration de la base de données...\n')

    try {
        // 1. Vérifier la structure de la table users
        console.log('📋 Vérification de la table users...')
        const { data: usersColumns, error: usersError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'users')
            .eq('table_schema', 'public')
            .order('ordinal_position')

        if (usersError) {
            console.error('❌ Erreur lors de la vérification de la table users:', usersError)
        } else {
            console.log('✅ Colonnes de la table users:')
            usersColumns.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`)
            })
        }

        // 2. Vérifier la structure de la table creators
        console.log('\n📋 Vérification de la table creators...')
        const { data: creatorsColumns, error: creatorsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'creators')
            .eq('table_schema', 'public')
            .order('ordinal_position')

        if (creatorsError) {
            console.error('❌ Erreur lors de la vérification de la table creators:', creatorsError)
        } else {
            console.log('✅ Colonnes de la table creators:')
            creatorsColumns.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`)
            })
        }

        // 3. Vérifier les buckets de stockage
        console.log('\n📦 Vérification des buckets de stockage...')
        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets()

        if (bucketsError) {
            console.error('❌ Erreur lors de la vérification des buckets:', bucketsError)
        } else {
            console.log('✅ Buckets disponibles:')
            buckets.forEach(bucket => {
                console.log(`   - ${bucket.name} (public: ${bucket.public})`)
            })
        }

        // 4. Vérifier les politiques RLS
        console.log('\n🔐 Vérification des politiques RLS...')
        const { data: policies, error: policiesError } = await supabase
            .from('pg_policies')
            .select('schemaname, tablename, policyname, permissive, roles, cmd, qual')
            .eq('schemaname', 'public')
            .in('tablename', ['users', 'creators'])

        if (policiesError) {
            console.error('❌ Erreur lors de la vérification des politiques:', policiesError)
        } else {
            console.log('✅ Politiques RLS pour users et creators:')
            policies.forEach(policy => {
                console.log(`   - ${policy.tablename}.${policy.policyname} (${policy.cmd})`)
            })
        }

        // 5. Vérifier les fonctions
        console.log('\n⚙️ Vérification des fonctions...')
        const { data: functions, error: functionsError } = await supabase
            .from('information_schema.routines')
            .select('routine_name, routine_type')
            .eq('routine_schema', 'public')
            .in('routine_name', ['become_creator', 'update_creator_profile'])

        if (functionsError) {
            console.error('❌ Erreur lors de la vérification des fonctions:', functionsError)
        } else {
            console.log('✅ Fonctions disponibles:')
            functions.forEach(func => {
                console.log(`   - ${func.routine_name} (${func.routine_type})`)
            })
        }

        console.log('\n🎯 Résumé:')
        const requiredUserColumns = ['banner_url', 'creator_bio', 'creator_description', 'account_type', 'subscription_price']
        const requiredCreatorColumns = ['description', 'banner_url', 'account_type', 'subscription_price']
        const requiredBuckets = ['profile-images', 'profile-banners', 'creator-content']

        const missingUserColumns = requiredUserColumns.filter(col =>
            !usersColumns?.some(c => c.column_name === col)
        )
        const missingCreatorColumns = requiredCreatorColumns.filter(col =>
            !creatorsColumns?.some(c => c.column_name === col)
        )
        const missingBuckets = requiredBuckets.filter(bucket =>
            !buckets?.some(b => b.name === bucket)
        )

        if (missingUserColumns.length > 0) {
            console.log(`❌ Colonnes manquantes dans users: ${missingUserColumns.join(', ')}`)
        } else {
            console.log('✅ Toutes les colonnes requises sont présentes dans users')
        }

        if (missingCreatorColumns.length > 0) {
            console.log(`❌ Colonnes manquantes dans creators: ${missingCreatorColumns.join(', ')}`)
        } else {
            console.log('✅ Toutes les colonnes requises sont présentes dans creators')
        }

        if (missingBuckets.length > 0) {
            console.log(`❌ Buckets manquants: ${missingBuckets.join(', ')}`)
        } else {
            console.log('✅ Tous les buckets requis sont présents')
        }

        if (missingUserColumns.length === 0 && missingCreatorColumns.length === 0 && missingBuckets.length === 0) {
            console.log('\n🎉 Configuration complète ! La base de données est prête.')
        } else {
            console.log('\n⚠️ Configuration incomplète. Exécutez le script SQL pour ajouter les éléments manquants.')
        }

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error)
    }
}

checkDatabaseSetup() 