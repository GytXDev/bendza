# 🎨 Configuration des Créateurs - BENDZA

## 📋 Vue d'ensemble

Ce guide vous aide à configurer complètement le système de créateurs avec :
- ✅ Tables de base de données
- ✅ Buckets de stockage
- ✅ Permissions RLS
- ✅ Fonctions utilitaires
- ✅ Description de profil pour les créateurs

## 🗂️ Structure des dossiers Supabase Storage

### **Buckets à créer :**

```
📁 profile-images/     (déjà existant)
├── Photos de profil des utilisateurs
├── Taille max: 5MB
└── Types: JPEG, PNG, WebP

📁 profile-banners/    (NOUVEAU)
├── Bannières de profil des créateurs
├── Taille max: 10MB
└── Types: JPEG, PNG, WebP

📁 creator-content/    (NOUVEAU)
├── Contenu des créateurs (images + vidéos)
├── Taille max: 50MB
└── Types: JPEG, PNG, WebP, MP4, WebM
```

## 🔧 Étapes de configuration

### **Étape 1 : Configuration des buckets Storage**

```bash
# Exécuter le script de configuration des buckets
node tools/setup-creator-storage.js
```

### **Étape 2 : Configuration de la base de données**

1. **Allez dans votre dashboard Supabase**
2. **SQL Editor > New Query**
3. **Copiez et exécutez le contenu de :**
   ```
   database/creator_profile_setup.sql
   ```

### **Étape 3 : Vérification des permissions**

Dans le dashboard Supabase :
1. **Authentication > Policies**
2. **Vérifiez que les politiques RLS sont créées**
3. **Storage > Policies**
4. **Vérifiez les politiques pour chaque bucket**

## 📊 Structure des tables

### **Table `users` (mise à jour)**
```sql
-- Nouveaux champs ajoutés
is_creator BOOLEAN DEFAULT FALSE
creator_bio TEXT
creator_description TEXT
banner_url TEXT
account_type VARCHAR(20) DEFAULT 'subscription'
subscription_price INTEGER DEFAULT 2500
creator_verified BOOLEAN DEFAULT FALSE
creator_since TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### **Table `creators` (nouvelle)**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
bio TEXT
description TEXT
banner_url TEXT
profile_image_url TEXT
account_type VARCHAR(20)
subscription_price INTEGER
is_verified BOOLEAN
followers_count INTEGER
content_count INTEGER
total_earnings INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

## 🔐 Permissions RLS configurées

### **Table `users`**
- ✅ **Lecture publique** : Tous peuvent voir les profils
- ✅ **Mise à jour personnelle** : Utilisateurs peuvent modifier leur profil
- ✅ **Champs créateur** : Seuls les créateurs peuvent modifier bio/description

### **Table `creators`**
- ✅ **Lecture publique** : Tous peuvent voir les créateurs
- ✅ **Gestion personnelle** : Créateurs peuvent gérer leur profil

### **Storage Buckets**
- ✅ **profile-images** : Upload/lecture/suppression personnelle
- ✅ **profile-banners** : Upload/lecture/suppression personnelle
- ✅ **creator-content** : Upload/lecture/suppression pour créateurs

## 🛠️ Fonctions utilitaires créées

### **`become_creator(bio, description)`**
```sql
-- Permet à un utilisateur de devenir créateur
SELECT become_creator('Ma bio', 'Ma description détaillée');
```

### **`update_creator_profile(bio, description, banner_url, account_type, price)`**
```sql
-- Met à jour le profil créateur
SELECT update_creator_profile(
  'Nouvelle bio',
  'Nouvelle description',
  'https://...',
  'subscription',
  3000
);
```

## 🎯 Fonctionnalités pour les créateurs

### **1. Description de profil**
- **Bio courte** : Description rapide (max 200 caractères)
- **Description complète** : Texte détaillé (max 2000 caractères)
- **Modification** : Uniquement pour les créateurs

### **2. Bannière de profil**
- **Upload** : Via l'interface Profile.jsx
- **Stockage** : Bucket `profile-banners`
- **Taille** : Jusqu'à 10MB
- **Formats** : JPEG, PNG, WebP

### **3. Type de compte**
- **Abonnement** : Prix mensuel fixe
- **Paiement par post** : Rémunération par publication
- **Modification** : Via l'interface Profile.jsx

## 🧪 Tests de configuration

### **Test 1 : Vérification des buckets**
```bash
node tools/check-storage.js
```

### **Test 2 : Test des fonctions SQL**
```sql
-- Tester la fonction become_creator
SELECT become_creator('Test bio', 'Test description');

-- Vérifier que l'utilisateur est devenu créateur
SELECT * FROM users WHERE id = auth.uid();
SELECT * FROM creators WHERE user_id = auth.uid();
```

### **Test 3 : Test des permissions**
```sql
-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'users';
SELECT * FROM pg_policies WHERE tablename = 'creators';
```

## 🚨 Dépannage

### **Erreur "Bucket not found"**
```bash
# Vérifier que les buckets existent
node tools/setup-creator-storage.js
```

### **Erreur "new row violates row-level security policy"**
1. Vérifiez les politiques RLS dans le dashboard
2. Assurez-vous que l'utilisateur est authentifié
3. Vérifiez que les politiques sont activées

### **Erreur "function does not exist"**
1. Exécutez le script SQL complet
2. Vérifiez que les fonctions sont créées
3. Vérifiez les permissions de l'utilisateur

## 📱 Intégration dans l'application

### **Profile.jsx**
- ✅ Upload de bannière
- ✅ Modification de la description
- ✅ Sélection du type de compte
- ✅ Gestion des prix d'abonnement

### **Explore.jsx**
- ✅ Affichage des bannières
- ✅ Affichage des descriptions
- ✅ Filtrage par type de compte

## 🎉 Configuration terminée !

Une fois toutes les étapes suivies :
1. ✅ Les créateurs peuvent ajouter une description
2. ✅ Les créateurs peuvent uploader une bannière
3. ✅ Les permissions sont sécurisées
4. ✅ L'interface est fonctionnelle
5. ✅ Le stockage est optimisé

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans la console
2. Consultez le dashboard Supabase
3. Testez les fonctions SQL directement
4. Vérifiez les variables d'environnement 