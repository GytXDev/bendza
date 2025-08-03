# 🚀 Configuration Complète - BENDZA Platform

## 📋 Vue d'ensemble

Ce guide vous aide à configurer complètement toutes les fonctionnalités de la plateforme BENDZA :
- ✅ Upload de photos de profil et bannières
- ✅ Gestion des types d'abonnement (Abonnement/Paiement par post)
- ✅ Bio des créateurs
- ✅ Page Explore fonctionnelle avec données réelles

## 🔧 Étapes de Configuration

### 1. Configuration de la Base de Données

#### Option A : Script Automatique (Recommandé)
```bash
# Exécuter le script de configuration automatique
node tools/run-database-setup.js
```

#### Option B : Configuration Manuelle
1. **Copier le script SQL** :
   - Ouvrez `database/creator_profile_setup_fixed.sql`
   - Copiez tout le contenu

2. **Exécuter dans Supabase** :
   - Allez dans votre dashboard Supabase
   - SQL Editor > New Query
   - Collez le contenu du script
   - Cliquez sur "Run"

### 2. Configuration des Buckets de Stockage

#### Option A : Script Automatique
```bash
# Configurer les buckets de stockage
node tools/setup-banner-storage.js
```

#### Option B : Configuration Manuelle
1. **Dashboard Supabase > Storage**
2. **Créer les buckets** :
   - `profile-images` (public, 5MB max)
   - `profile-banners` (public, 10MB max)
   - `creator-content` (public, 50MB max)

3. **Configurer les politiques RLS** pour chaque bucket :
   - SELECT : `bucket_id = 'nom-du-bucket'`
   - INSERT : `bucket_id = 'nom-du-bucket'`
   - UPDATE : `bucket_id = 'nom-du-bucket'`
   - DELETE : `bucket_id = 'nom-du-bucket'`

### 3. Vérification de la Configuration

```bash
# Vérifier que tout est configuré correctement
node tools/check-database-setup.js
```

## 🎯 Fonctionnalités Configurées

### ✅ Profile.jsx
- **Upload de photo de profil** → Bucket `profile-images`
- **Upload de bannière** → Bucket `profile-banners`
- **Champ bio** → Sauvegardé en base
- **Type d'abonnement** → Sauvegardé en base
- **Prix d'abonnement** → Sauvegardé en base
- **Email verrouillé** → Non modifiable

### ✅ Explore.jsx
- **Données réelles** → Depuis la table `users` et `creators`
- **Recherche** → Par nom, bio, description
- **Filtres** → Abonnement / Contenus à la carte
- **Bannières** → Affichage des bannières des créateurs
- **Prix** → Affichage des prix d'abonnement

### ✅ Base de Données
- **Table users** → Colonnes ajoutées : `creator_bio`, `banner_url`, `account_type`, `subscription_price`
- **Table creators** → Colonnes ajoutées : `description`, `banner_url`, `account_type`, `subscription_price`
- **Politiques RLS** → Configurées pour tous les buckets
- **Fonctions** → `become_creator()`, `update_creator_profile()`

## 🧪 Tests à Effectuer

### 1. Test du Profile
1. **Connectez-vous** à l'application
2. **Allez sur la page Profile**
3. **Testez l'upload de photo** :
   - Cliquez sur l'icône caméra
   - Sélectionnez une image
   - Vérifiez qu'elle s'affiche
4. **Testez l'upload de bannière** :
   - Cliquez sur l'icône image
   - Sélectionnez une image
   - Vérifiez qu'elle s'affiche
5. **Testez la bio** :
   - Ajoutez du texte dans le champ bio
   - Sauvegardez
6. **Testez le type d'abonnement** :
   - Changez entre "Abonnement" et "Paiement par post"
   - Ajoutez un prix pour l'abonnement
   - Sauvegardez

### 2. Test de l'Explore
1. **Allez sur la page Explore**
2. **Vérifiez l'affichage** des créateurs
3. **Testez la recherche** :
   - Tapez un nom de créateur
   - Vérifiez les résultats
4. **Testez les filtres** :
   - Cliquez sur "Abonnements Premium"
   - Cliquez sur "Contenus à la carte"
   - Vérifiez le filtrage

### 3. Vérification des Données
1. **Dashboard Supabase > Table Editor**
2. **Vérifiez la table `users`** :
   - Colonnes `creator_bio`, `banner_url`, `account_type`, `subscription_price`
3. **Vérifiez la table `creators`** :
   - Colonnes `description`, `banner_url`, `account_type`, `subscription_price`
4. **Vérifiez Storage** :
   - Bucket `profile-images` : photos de profil
   - Bucket `profile-banners` : bannières

## 🔍 Dépannage

### Erreur "Bucket not found"
```bash
# Exécuter le script de configuration des buckets
node tools/setup-banner-storage.js
```

### Erreur "Column does not exist"
```bash
# Exécuter le script de configuration de la base de données
node tools/run-database-setup.js
```

### Erreur "Row-level security policy"
1. **Vérifiez les politiques RLS** dans le dashboard Supabase
2. **Assurez-vous** que les politiques sont configurées pour tous les buckets

### Données non affichées dans Explore
1. **Vérifiez** que les utilisateurs ont `is_creator = true`
2. **Vérifiez** que les colonnes sont bien remplies
3. **Testez** la requête directement dans Supabase

## 📞 Support

Si vous rencontrez des problèmes :
1. **Vérifiez les logs** dans la console du navigateur
2. **Vérifiez les logs** dans le dashboard Supabase
3. **Exécutez** les scripts de vérification
4. **Consultez** la documentation Supabase

## 🎉 Félicitations !

Votre plateforme BENDZA est maintenant entièrement configurée avec :
- ✅ Upload d'images fonctionnel
- ✅ Gestion des abonnements
- ✅ Bio des créateurs
- ✅ Page Explore avec données réelles
- ✅ Base de données optimisée
- ✅ Politiques de sécurité configurées 