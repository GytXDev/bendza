const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Nécessite la clé service role

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY sont définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration des buckets
const BUCKETS_CONFIG = [
  {
    name: 'avatars',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/*']
  },
  {
    name: 'content',
    public: false,
    fileSizeLimit: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ['video/*', 'image/*', 'audio/*']
  },
  {
    name: 'thumbnails',
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/*']
  },
  {
    name: 'temp',
    public: false,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ['*/*']
  }
];

async function setupStorage() {
  console.log('🔧 Configuration de Supabase Storage...');

  try {
    // 1. Créer les buckets
    console.log('📦 Création des buckets...');
    
    for (const bucketConfig of BUCKETS_CONFIG) {
      try {
        const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
          public: bucketConfig.public,
          fileSizeLimit: bucketConfig.fileSizeLimit,
          allowedMimeTypes: bucketConfig.allowedMimeTypes
        });

        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`✅ Bucket '${bucketConfig.name}' existe déjà`);
          } else {
            console.error(`❌ Erreur création bucket '${bucketConfig.name}':`, error.message);
          }
        } else {
          console.log(`✅ Bucket '${bucketConfig.name}' créé avec succès`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la création du bucket '${bucketConfig.name}':`, error.message);
      }
    }

    // 2. Configurer les politiques RLS pour chaque bucket
    console.log('🔒 Configuration des politiques RLS...');
    
    await setupBucketPolicies('avatars', true);
    await setupBucketPolicies('content', false);
    await setupBucketPolicies('thumbnails', true);
    await setupBucketPolicies('temp', false);

    console.log('✅ Configuration de Supabase Storage terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  }
}

async function setupBucketPolicies(bucketName, isPublic) {
  try {
    // Supprimer les politiques existantes
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .removePolicies();

    if (deleteError) {
      console.log(`⚠️ Impossible de supprimer les politiques existantes pour '${bucketName}':`, deleteError.message);
    }

    // Créer les nouvelles politiques selon le type de bucket
    if (isPublic) {
      // Politiques pour les buckets publics (avatars, thumbnails)
      await createPublicBucketPolicies(bucketName);
    } else {
      // Politiques pour les buckets privés (content, temp)
      await createPrivateBucketPolicies(bucketName);
    }

    console.log(`✅ Politiques configurées pour le bucket '${bucketName}'`);
  } catch (error) {
    console.error(`❌ Erreur configuration politiques pour '${bucketName}':`, error.message);
  }
}

async function createPublicBucketPolicies(bucketName) {
  const policies = [
    {
      name: 'Public read access',
      definition: 'true',
      operation: 'SELECT'
    },
    {
      name: 'Authenticated users can upload',
      definition: 'auth.uid() IS NOT NULL',
      operation: 'INSERT'
    },
    {
      name: 'Users can update own files',
      definition: 'auth.uid()::text = (storage.foldername(name))[1]',
      operation: 'UPDATE'
    },
    {
      name: 'Users can delete own files',
      definition: 'auth.uid()::text = (storage.foldername(name))[1]',
      operation: 'DELETE'
    }
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .createPolicy(policy.name, {
          definition: policy.definition,
          operation: policy.operation
        });

      if (error) {
        console.log(`⚠️ Politique '${policy.name}' pour '${bucketName}':`, error.message);
      }
    } catch (error) {
      console.log(`⚠️ Erreur création politique '${policy.name}' pour '${bucketName}':`, error.message);
    }
  }
}

async function createPrivateBucketPolicies(bucketName) {
  const policies = [
    {
      name: 'Users can read own files',
      definition: 'auth.uid()::text = (storage.foldername(name))[1]',
      operation: 'SELECT'
    },
    {
      name: 'Authenticated users can upload',
      definition: 'auth.uid() IS NOT NULL',
      operation: 'INSERT'
    },
    {
      name: 'Users can update own files',
      definition: 'auth.uid()::text = (storage.foldername(name))[1]',
      operation: 'UPDATE'
    },
    {
      name: 'Users can delete own files',
      definition: 'auth.uid()::text = (storage.foldername(name))[1]',
      operation: 'DELETE'
    }
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .createPolicy(policy.name, {
          definition: policy.definition,
          operation: policy.operation
        });

      if (error) {
        console.log(`⚠️ Politique '${policy.name}' pour '${bucketName}':`, error.message);
      }
    } catch (error) {
      console.log(`⚠️ Erreur création politique '${policy.name}' pour '${bucketName}':`, error.message);
    }
  }
}

// Exécuter le script
setupStorage(); 