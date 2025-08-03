# 🔧 Configuration Rapide - Upload d'Images

## Problème actuel
- ❌ Bucket `profile-images` manquant dans Supabase
- ❌ Variables d'environnement non configurées
- ❌ Superposition des icônes et inputs (corrigé)

## ✅ Solutions

### 1. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
VITE_SUPABASE_URL=https://cluxjulsmwwnjwzfideu.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon_ici
```

**Comment obtenir votre clé anon :**
1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Settings > API
4. Copiez la clé "anon public"

### 2. Création du bucket Supabase

#### Option A : Via Dashboard Supabase (Recommandé)
1. Allez dans votre dashboard Supabase
2. Storage > New bucket
3. Nom : `profile-images`
4. Public bucket : ✅ Activé
5. File size limit : 5MB
6. Allowed MIME types : `image/jpeg, image/jpg, image/png, image/webp`

#### Option B : Via SQL
```sql
-- Créer le bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

-- Politiques RLS pour le bucket
CREATE POLICY "Profile images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-images');

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-images');
```

### 3. Test de la configuration

Après avoir configuré les variables d'environnement et créé le bucket :

```bash
# Redémarrer le serveur de développement
npm run dev
```

### 4. Vérification

1. Allez sur la page Profile
2. Cliquez sur l'icône caméra
3. Sélectionnez une image
4. L'upload devrait fonctionner sans erreur

## 🔍 Diagnostic

Si vous avez encore des problèmes, ouvrez la console du navigateur et exécutez :

```javascript
// Test de connexion Supabase
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configuré' : '❌ Manquant');

// Test du bucket
const { data, error } = await supabase.storage.listBuckets();
console.log('Buckets disponibles:', data?.map(b => b.name));
```

## 📞 Support

Si les problèmes persistent :
1. Vérifiez que le bucket `profile-images` existe
2. Vérifiez les politiques RLS
3. Vérifiez les variables d'environnement
4. Redémarrez le serveur de développement 