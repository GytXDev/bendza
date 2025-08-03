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

async function setupStorage() {
  try {
    console.log('🔧 Configuration du stockage Supabase...\n');

    // 1. Vérifier si le bucket existe
    console.log('1️⃣ Vérification du bucket profile-images...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError);
      return;
    }

    const profileImagesBucket = buckets.find(bucket => bucket.name === 'profile-images');

    if (profileImagesBucket) {
      console.log('✅ Bucket profile-images existe déjà');
    } else {
      console.log('📦 Création du bucket profile-images...');

      const { data: newBucket, error: createError } = await supabase.storage.createBucket('profile-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
        allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp']
      });

      if (createError) {
        console.error('❌ Erreur lors de la création du bucket:', createError);
        return;
      }

      console.log('✅ Bucket profile-images créé avec succès');
    }

    // 2. Configurer les politiques RLS pour le bucket
    console.log('\n2️⃣ Configuration des politiques RLS...');

    // Politique pour permettre l'upload aux utilisateurs authentifiés
    const uploadPolicy = `
      CREATE POLICY "Users can upload profile images" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Politique pour permettre la lecture publique
    const readPolicy = `
      CREATE POLICY "Profile images are publicly accessible" ON storage.objects
      FOR SELECT USING (bucket_id = 'profile-images');
    `;

    // Politique pour permettre la suppression aux propriétaires
    const deletePolicy = `
      CREATE POLICY "Users can delete their own profile images" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Politique pour permettre la mise à jour aux propriétaires
    const updatePolicy = `
      CREATE POLICY "Users can update their own profile images" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    const policies = [
      { name: 'upload', sql: uploadPolicy },
      { name: 'read', sql: readPolicy },
      { name: 'delete', sql: deletePolicy },
      { name: 'update', sql: updatePolicy }
    ];

    for (const policy of policies) {
      try {
        console.log(`   Configuration de la politique ${policy.name}...`);
        // Note: Ces politiques doivent être créées manuellement dans le dashboard Supabase
        // car l'API ne permet pas de créer des politiques RLS directement
        console.log(`   ⚠️  Politique ${policy.name} à créer manuellement dans le dashboard`);
      } catch (error) {
        console.log(`   ⚠️  Impossible de créer la politique ${policy.name}:`, error.message);
      }
    }

    // 3. Tester l'upload
    console.log('\n3️⃣ Test d\'upload...');

    // Créer un fichier de test
    const testContent = 'Test file for storage setup';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test_${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(testFileName, testFile);

    if (uploadError) {
      console.error('❌ Erreur lors du test d\'upload:', uploadError);
      console.log('   Vérifiez les politiques RLS dans le dashboard Supabase');
    } else {
      console.log('✅ Test d\'upload réussi');

      // Nettoyer le fichier de test
      const { error: deleteError } = await supabase.storage
        .from('profile-images')
        .remove([testFileName]);

      if (deleteError) {
        console.log('⚠️  Impossible de supprimer le fichier de test:', deleteError);
      } else {
        console.log('✅ Fichier de test nettoyé');
      }
    }

    console.log('\n✅ Configuration du stockage terminée');
    console.log('\n📋 RÉSUMÉ:');
    console.log('   - Bucket profile-images configuré');
    console.log('   - Politiques RLS à configurer manuellement dans le dashboard');
    console.log('   - Test d\'upload effectué');

    console.log('\n🔧 PROCHAINES ÉTAPES:');
    console.log('1. Aller dans votre dashboard Supabase');
    console.log('2. Storage > Policies');
    console.log('3. Ajouter les politiques RLS pour le bucket profile-images');
    console.log('4. Tester l\'upload d\'images dans l\'application');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  }
}

// Exécuter la configuration
setupStorage(); 