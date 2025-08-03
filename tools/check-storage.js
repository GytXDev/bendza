import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cluxjulsmwwnjwzfideu.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Diagnostic de la configuration Supabase Storage\n');

// Vérifier les variables d'environnement
console.log('1️⃣ Variables d\'environnement:');
console.log(`   URL: ${supabaseUrl ? '✅ Configurée' : '❌ Manquante'}`);
console.log(`   Clé Anon: ${supabaseAnonKey ? '✅ Configurée' : '❌ Manquante'}`);

if (!supabaseAnonKey) {
    console.log('\n❌ Clé Supabase manquante!');
    console.log('   Créez un fichier .env.local avec:');
    console.log('   VITE_SUPABASE_ANON_KEY=votre_clé_ici');
    process.exit(1);
}

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStorage() {
    try {
        console.log('\n2️⃣ Test de connexion Supabase...');

        // Test de connexion
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            console.log('   ⚠️  Erreur d\'authentification (normal si pas connecté)');
        } else {
            console.log('   ✅ Connexion Supabase réussie');
        }

        // Lister les buckets
        console.log('\n3️⃣ Vérification des buckets...');
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.log('   ❌ Erreur lors de la récupération des buckets:', bucketsError.message);
            return;
        }

        console.log(`   📦 Buckets trouvés: ${buckets.length}`);
        buckets.forEach(bucket => {
            console.log(`      - ${bucket.name} (public: ${bucket.public})`);
        });

        // Vérifier le bucket profile-images
        const profileImagesBucket = buckets.find(bucket => bucket.name === 'profile-images');

        if (profileImagesBucket) {
            console.log('\n4️⃣ Bucket profile-images:');
            console.log('   ✅ Bucket trouvé');
            console.log(`   📊 Taille max: ${profileImagesBucket.file_size_limit / 1024 / 1024}MB`);
            console.log(`   🌐 Public: ${profileImagesBucket.public ? 'Oui' : 'Non'}`);
            console.log(`   📋 Types MIME: ${profileImagesBucket.allowed_mime_types?.join(', ') || 'Tous'}`);

            // Tester l'upload
            console.log('\n5️⃣ Test d\'upload...');
            const testContent = 'Test file for storage verification';
            const testFile = new Blob([testContent], { type: 'text/plain' });
            const testFileName = `test_${Date.now()}.txt`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('profile-images')
                .upload(testFileName, testFile);

            if (uploadError) {
                console.log('   ❌ Erreur d\'upload:', uploadError.message);
                console.log('   💡 Vérifiez les politiques RLS dans le dashboard Supabase');
            } else {
                console.log('   ✅ Upload réussi');

                // Nettoyer le fichier de test
                const { error: deleteError } = await supabase.storage
                    .from('profile-images')
                    .remove([testFileName]);

                if (deleteError) {
                    console.log('   ⚠️  Impossible de supprimer le fichier de test');
                } else {
                    console.log('   ✅ Fichier de test nettoyé');
                }
            }
        } else {
            console.log('\n4️⃣ Bucket profile-images:');
            console.log('   ❌ Bucket manquant!');
            console.log('\n🔧 Pour créer le bucket:');
            console.log('   1. Allez dans votre dashboard Supabase');
            console.log('   2. Storage > New bucket');
            console.log('   3. Nom: profile-images');
            console.log('   4. Public bucket: Activé');
            console.log('   5. File size limit: 5MB');
            console.log('   6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp');
        }

        console.log('\n✅ Diagnostic terminé');

    } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error.message);
    }
}

checkStorage(); 