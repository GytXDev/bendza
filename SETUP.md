# Configuration BENDZA Platform

Ce guide vous explique comment configurer complètement la base de données et le stockage pour BENDZA Platform.

## 📋 Prérequis

1. **Compte Supabase** avec un projet créé
2. **Variables d'environnement** configurées
3. **Clés d'API** Supabase (anon key et service role key)

## 🔧 Configuration de la Base de Données

### 1. Exécuter le script SQL

1. Allez dans votre **Dashboard Supabase**
2. Ouvrez l'**éditeur SQL**
3. Copiez et exécutez le contenu du fichier `bendza.sql`

```sql
-- Exécutez tout le contenu de bendza.sql
```

### 2. Vérifier la configuration

Exécutez le script de diagnostic :

```bash
npm run fix-db
```

Ce script vérifiera :
- ✅ Structure des tables
- ✅ Colonnes requises
- ✅ Politiques RLS
- ✅ Index de performance

## 📦 Configuration du Storage

### 1. Créer les buckets manuellement

Dans votre **Dashboard Supabase > Storage**, créez les buckets suivants :

#### Bucket `avatars`
- **Public** : ✅ Oui
- **File size limit** : 5MB
- **Allowed MIME types** : `image/*`

#### Bucket `content`
- **Public** : ❌ Non
- **File size limit** : 100MB
- **Allowed MIME types** : `video/*, image/*, audio/*`

#### Bucket `thumbnails`
- **Public** : ✅ Oui
- **File size limit** : 2MB
- **Allowed MIME types** : `image/*`

#### Bucket `temp`
- **Public** : ❌ Non
- **File size limit** : 50MB
- **Allowed MIME types** : `*/*`

### 2. Configurer les politiques RLS

Pour chaque bucket, configurez les politiques suivantes :

#### Buckets Publics (`avatars`, `thumbnails`)

**SELECT** : `true` (accès public)
**INSERT** : `auth.uid() IS NOT NULL` (utilisateurs authentifiés)
**UPDATE** : `auth.uid()::text = (storage.foldername(name))[1]` (propriétaire)
**DELETE** : `auth.uid()::text = (storage.foldername(name))[1]` (propriétaire)

#### Buckets Privés (`content`, `temp`)

**SELECT** : `auth.uid()::text = (storage.foldername(name))[1]` (propriétaire)
**INSERT** : `auth.uid() IS NOT NULL` (utilisateurs authentifiés)
**UPDATE** : `auth.uid()::text = (storage.foldername(name))[1]` (propriétaire)
**DELETE** : `auth.uid()::text = (storage.foldername(name))[1]` (propriétaire)

### 3. Configuration automatique (Optionnel)

Si vous avez configuré la **Service Role Key**, vous pouvez utiliser le script automatique :

```bash
# Ajoutez votre service role key dans .env
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Exécutez le script
npm run setup-storage
```

## 🔐 Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 Structure de la Base de Données

### Tables Principales

- **users** : Profils utilisateurs
- **creators** : Profils créateurs
- **content** : Contenu publié
- **transactions** : Transactions de paiement
- **subscriptions** : Abonnements
- **messages** : Messages privés
- **payouts** : Retraits des créateurs

### Tables de Support

- **likes** : J'aime sur le contenu
- **comments** : Commentaires
- **notifications** : Notifications
- **categories** : Catégories de contenu
- **content_categories** : Relation contenu-catégories
- **user_followers** : Suiveurs

## 🚀 Fonctionnalités Configurées

### ✅ Authentification
- Inscription/Connexion email/mot de passe
- Authentification Google
- Confirmation d'email
- Gestion des sessions

### ✅ Gestion des Fichiers
- Upload d'avatars (5MB max)
- Upload de contenu (100MB max)
- Upload de miniatures (2MB max)
- Fichiers temporaires (50MB max)
- URLs signées pour contenu privé

### ✅ Sécurité
- Row Level Security (RLS) activé
- Politiques de sécurité par table
- Validation des types de fichiers
- Limitation de taille des fichiers

### ✅ Performance
- Index optimisés
- Triggers automatiques
- Mise à jour automatique des timestamps
- Nettoyage automatique des fichiers temporaires

## 🔍 Vérification

Après la configuration, testez :

1. **Inscription d'un utilisateur**
2. **Upload d'un avatar**
3. **Création d'un profil créateur**
4. **Upload d'un fichier de contenu**

## 🛠️ Dépannage

### Erreur "column does not exist"
```bash
npm run fix-db
```

### Erreur de permissions Storage
Vérifiez les politiques RLS dans Supabase Dashboard > Storage > Policies

### Erreur d'authentification
Vérifiez vos variables d'environnement et les clés Supabase

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans la console
2. Consultez la documentation Supabase
3. Vérifiez les politiques RLS
4. Testez avec le script de diagnostic

---

**BENDZA Platform** - Configuration complète ✅ 