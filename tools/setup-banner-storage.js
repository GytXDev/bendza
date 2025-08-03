const { createClient } = require('@supabase/supabase-js')
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

async function setupBannerStorage() {
    console.log('🚀 Configuration du bucket profile-banners...\n')

    try {
        // 1. Créer le bucket profile-banners
        console.log('📦 Création du bucket profile-banners...')
        const { data: bucket, error: bucketError } = await supabase.storage.createBucket('profile-banners', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        })

        if (bucketError) {
            if (bucketError.message.includes('already exists')) {
                console.log('✅ Le bucket profile-banners existe déjà')
            } else {
                console.error('❌ Erreur lors de la création du bucket:', bucketError)
                return
            }
        } else {
            console.log('✅ Bucket profile-banners créé avec succès')
        }

        // 2. Configurer les politiques RLS pour le bucket
        console.log('\n🔐 Configuration des politiques RLS...')

        const policies = [
            {
                name: 'Profile banners are publicly accessible',
                operation: 'SELECT',
                policy: 'bucket_id = \'profile-banners\''
            },
            {
                name: 'Users can upload profile banners',
                operation: 'INSERT',
                policy: 'bucket_id = \'profile-banners\''
            },
            {
                name: 'Users can update own profile banners',
                operation: 'UPDATE',
                policy: 'bucket_id = \'profile-banners\''
            },
            {
                name: 'Users can delete own profile banners',
                operation: 'DELETE',
                policy: 'bucket_id = \'profile-banners\''
            }
        ]

        for (const policy of policies) {
            try {
                // Supprimer l'ancienne politique si elle existe
                await supabase.rpc('drop_policy_if_exists', {
                    table_name: 'storage.objects',
                    policy_name: policy.name
                })

                // Créer la nouvelle politique
                const { error: policyError } = await supabase.rpc('create_policy', {
                    table_name: 'storage.objects',
                    policy_name: policy.name,
                    operation: policy.operation,
                    definition: policy.policy
                })

                if (policyError) {
                    console.error(`❌ Erreur lors de la création de la politique ${policy.name}:`, policyError)
                } else {
                    console.log(`✅ Politique ${policy.name} créée`)
                }
            } catch (error) {
                console.error(`❌ Erreur lors de la configuration de la politique ${policy.name}:`, error)
            }
        }

        // 3. Vérifier la configuration
        console.log('\n🔍 Vérification de la configuration...')
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

        if (bucketsError) {
            console.error('❌ Erreur lors de la vérification des buckets:', bucketsError)
        } else {
            const bannerBucket = buckets.find(b => b.name === 'profile-banners')
            if (bannerBucket) {
                console.log('✅ Bucket profile-banners configuré:')
                console.log(`   - Nom: ${bannerBucket.name}`)
                console.log(`   - Public: ${bannerBucket.public}`)
                console.log(`   - Taille max: ${bannerBucket.fileSizeLimit / 1024 / 1024}MB`)
                console.log(`   - Types autorisés: ${bannerBucket.allowedMimeTypes?.join(', ')}`)
            } else {
                console.log('❌ Bucket profile-banners non trouvé')
            }
        }

        console.log('\n🎉 Configuration terminée !')
        console.log('📝 Prochaines étapes:')
        console.log('   1. Testez l\'upload de bannière dans l\'application')
        console.log('   2. Vérifiez que les images sont bien stockées dans profile-banners')
        console.log('   3. Testez la suppression d\'anciennes bannières')

    } catch (error) {
        console.error('❌ Erreur lors de la configuration:', error)
    }
}

setupBannerStorage() 