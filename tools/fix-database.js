const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabase() {
  console.log('🔧 Début de la correction de la base de données...');

  try {
    // 1. Vérifier si la colonne photourl existe
    console.log('📋 Vérification de la structure de la table users...');
    
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('id, email, name, photourl, is_creator')
      .limit(1);

    if (selectError) {
      console.error('❌ Erreur lors de la vérification de la table users:', selectError);
      
      if (selectError.message.includes('column "photourl" does not exist')) {
        console.log('🔧 La colonne photourl n\'existe pas dans la table users');
        console.log('');
        console.log('⚠️  ACTION REQUISE :');
        console.log('1. Allez dans votre dashboard Supabase');
        console.log('2. Table Editor > users');
        console.log('3. Cliquez sur "Add column"');
        console.log('4. Ajoutez la colonne :');
        console.log('   - Name: photourl');
        console.log('   - Type: text');
        console.log('   - Default value: null');
        console.log('   - Allow nullable: ✅');
        console.log('');
        console.log('OU exécutez cette requête SQL dans l\'éditeur SQL :');
        console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS photourl TEXT;');
        console.log('');
        return;
      }
    } else {
      console.log('✅ La structure de la table users est correcte');
    }

    // 2. Vérifier les autres colonnes nécessaires
    console.log('🔍 Vérification des autres colonnes...');
    
    const requiredColumns = ['id', 'email', 'name', 'is_creator', 'created_at'];
    const missingColumns = [];

    for (const column of requiredColumns) {
      try {
        await supabase
          .from('users')
          .select(column)
          .limit(1);
      } catch (error) {
        if (error.message.includes(`column "${column}" does not exist`)) {
          missingColumns.push(column);
        }
      }
    }

    if (missingColumns.length > 0) {
      console.log('❌ Colonnes manquantes dans la table users:', missingColumns);
      console.log('');
      console.log('⚠️  Exécutez ces requêtes SQL dans l\'éditeur SQL :');
      missingColumns.forEach(column => {
        console.log(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column} TEXT;`);
      });
      console.log('');
    } else {
      console.log('✅ Toutes les colonnes requises sont présentes');
    }

    // 3. Vérifier les politiques RLS
    console.log('🔒 Vérification des politiques RLS...');
    
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies', { table_name: 'users' });

      if (policiesError) {
        console.log('⚠️  Impossible de vérifier les politiques RLS');
        console.log('Assurez-vous que les politiques RLS sont configurées pour la table users');
      } else {
        console.log('✅ Politiques RLS vérifiées');
      }
    } catch (error) {
      console.log('⚠️  Erreur lors de la vérification des politiques RLS');
    }

    console.log('✅ Vérification de la base de données terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter le script
fixDatabase(); 