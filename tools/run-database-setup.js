const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes')
    console.log('Assurez-vous que .env.local contient:')
    console.log('VITE_SUPABASE_URL=your_supabase_url')
    console.log('VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (recommandé)')
    console.log('ou VITE_SUPABASE_ANON_KEY=your_anon_key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runDatabaseSetup() {
    console.log('🚀 Exécution du script de configuration de la base de données...\n')

    try {
        // 1. Lire le fichier SQL
        const sqlFilePath = path.join(__dirname, '..', 'database', 'creator_profile_setup_fixed.sql')

        if (!fs.existsSync(sqlFilePath)) {
            console.error('❌ Fichier SQL non trouvé:', sqlFilePath)
            console.log('Assurez-vous que le fichier database/creator_profile_setup_fixed.sql existe')
            return
        }

        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
        console.log('✅ Fichier SQL lu avec succès')

        // 2. Exécuter le script SQL
        console.log('\n📋 Exécution du script SQL...')
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })

        if (error) {
            // Si exec_sql n'existe pas, on essaie d'exécuter directement
            console.log('⚠️ Fonction exec_sql non disponible, tentative d\'exécution directe...')

            // Diviser le script en commandes individuelles
            const commands = sqlContent
                .split(';')
                .map(cmd => cmd.trim())
                .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

            console.log(`📝 Exécution de ${commands.length} commandes...`)

            for (let i = 0; i < commands.length; i++) {
                const command = commands[i]
                if (command.trim()) {
                    try {
                        console.log(`   [${i + 1}/${commands.length}] Exécution...`)
                        const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command + ';' })

                        if (cmdError) {
                            console.warn(`   ⚠️ Commande ${i + 1} ignorée (probablement déjà exécutée):`, cmdError.message)
                        } else {
                            console.log(`   ✅ Commande ${i + 1} exécutée`)
                        }
                    } catch (err) {
                        console.warn(`   ⚠️ Commande ${i + 1} ignorée:`, err.message)
                    }
                }
            }
        } else {
            console.log('✅ Script SQL exécuté avec succès')
        }

        // 3. Vérifier la configuration
        console.log('\n🔍 Vérification de la configuration...')

        // Vérifier les colonnes de la table users
        const { data: usersColumns, error: usersError } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'users')
            .eq('table_schema', 'public')
            .in('column_name', ['creator_bio', 'banner_url', 'account_type', 'subscription_price'])

        if (usersError) {
            console.error('❌ Erreur lors de la vérification de la table users:', usersError)
        } else {
            const requiredColumns = ['creator_bio', 'banner_url', 'account_type', 'subscription_price']
            const foundColumns = usersColumns.map(col => col.column_name)
            const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col))

            if (missingColumns.length === 0) {
                console.log('✅ Toutes les colonnes requises sont présentes dans la table users')
            } else {
                console.log(`❌ Colonnes manquantes dans users: ${missingColumns.join(', ')}`)
            }
        }

        // Vérifier les buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

        if (bucketsError) {
            console.error('❌ Erreur lors de la vérification des buckets:', bucketsError)
        } else {
            const requiredBuckets = ['profile-images', 'profile-banners', 'creator-content']
            const foundBuckets = buckets.map(b => b.name)
            const missingBuckets = requiredBuckets.filter(bucket => !foundBuckets.includes(bucket))

            if (missingBuckets.length === 0) {
                console.log('✅ Tous les buckets requis sont présents')
            } else {
                console.log(`❌ Buckets manquants: ${missingBuckets.join(', ')}`)
            }
        }

        console.log('\n🎉 Configuration terminée !')
        console.log('📝 Prochaines étapes:')
        console.log('   1. Testez l\'upload de photos et bannières dans Profile.jsx')
        console.log('   2. Testez la sauvegarde du type d\'abonnement et de la bio')
        console.log('   3. Vérifiez que Explore.jsx affiche les données correctement')

    } catch (error) {
        console.error('❌ Erreur lors de la configuration:', error)
    }
}

runDatabaseSetup() 