import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.log('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupCreatorStorage() {
    try {
        console.log('🔧 Configuration du stockage pour les créateurs...\n');

        // 1. Vérifier les buckets existants
        console.log('1️⃣ Vérification des buckets existants...');
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.error('❌ Erreur lors de la récupération des buckets:', bucketsError);
            return;
        }

        console.log(`   📦 Buckets trouvés: ${buckets.length}`);
        buckets.forEach(bucket => {
            console.log(`      - ${bucket.name} (public: ${bucket.public})`);
        });

        // 2. Configuration des buckets pour les créateurs
        const creatorBuckets = [
            {
                name: 'profile-banners',
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                description: 'Bannières de profil des créateurs'
            },
            {
                name: 'creator-content',
                public: true,
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
                description: 'Contenu des créateurs (images et vidéos)'
            }
        ];

        console.log('\n2️⃣ Configuration des buckets créateurs...');

        for (const bucketConfig of creatorBuckets) {
            const existingBucket = buckets.find(bucket => bucket.name === bucketConfig.name);

            if (existingBucket) {
                console.log(`   ✅ Bucket ${bucketConfig.name} existe déjà`);
            } else {
                console.log(`   📦 Création du bucket ${bucketConfig.name}...`);

                const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketConfig.name, {
                    public: bucketConfig.public,
                    allowedMimeTypes: bucketConfig.allowedMimeTypes,
                    fileSizeLimit: bucketConfig.fileSizeLimit
                });

                if (createError) {
                    console.error(`   ❌ Erreur lors de la création du bucket ${bucketConfig.name}:`, createError);
                } else {
                    console.log(`   ✅ Bucket ${bucketConfig.name} créé avec succès`);
                    console.log(`      📊 Taille max: ${bucketConfig.fileSizeLimit / 1024 / 1024}MB`);
                    console.log(`      📋 Types: ${bucketConfig.allowedMimeTypes.join(', ')}`);
                }
            }
        }

        // 3. Test des buckets
        console.log('\n3️⃣ Test des buckets...');

        for (const bucketConfig of creatorBuckets) {
            console.log(`   🧪 Test du bucket ${bucketConfig.name}...`);

            // Test d'upload
            const testContent = `Test file for ${bucketConfig.name}`;
            const testFile = new Blob([testContent], { type: 'text/plain' });
            const testFileName = `test_${Date.now()}.txt`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketConfig.name)
                .upload(testFileName, testFile);

            if (uploadError) {
                console.log(`   ❌ Erreur d'upload pour ${bucketConfig.name}:`, uploadError.message);
            } else {
                console.log(`   ✅ Upload réussi pour ${bucketConfig.name}`);

                // Nettoyer le fichier de test
                const { error: deleteError } = await supabase.storage
                    .from(bucketConfig.name)
                    .remove([testFileName]);

                if (deleteError) {
                    console.log(`   ⚠️  Impossible de supprimer le fichier de test:`, deleteError.message);
                } else {
                    console.log(`   ✅ Fichier de test nettoyé`);
                }
            }
        }

        console.log('\n✅ Configuration du stockage créateur terminée');
        console.log('\n📋 RÉSUMÉ:');
        console.log('   - Bucket profile-banners configuré (10MB, images)');
        console.log('   - Bucket creator-content configuré (50MB, images + vidéos)');
        console.log('   - Tests d\'upload effectués');

        console.log('\n🔧 PROCHAINES ÉTAPES:');
        console.log('1. Exécuter le script SQL: database/creator_profile_setup.sql');
        console.log('2. Tester l\'upload de bannières dans l\'application');
        console.log('3. Vérifier les permissions RLS dans le dashboard');

    } catch (error) {
        console.error('❌ Erreur lors de la configuration:', error);
    }
}

// Exécuter la configuration
setupCreatorStorage(); 