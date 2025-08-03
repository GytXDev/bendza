# Configuration Supabase pour BENDZA Platform

## 🔐 Configuration de l'Authentification

### 1. URL Configuration

Dans votre dashboard Supabase > **Authentication > Settings > URL Configuration** :

```
Site URL: https://bendza.online

Redirect URLs: 
- https://bendza.online
- https://bendza.online/confirm-email
- https://your-project.vercel.app
- https://your-project.vercel.app/confirm-email
```

### 2. Google OAuth Provider

Dans **Authentication > Settings > Auth Providers > Google** :

1. **Activez Google OAuth**
2. **Client ID** : Votre Google Client ID
3. **Client Secret** : Votre Google Client Secret

### 3. Google Cloud Console Configuration

Dans Google Cloud Console > **APIs & Services > Credentials** :

**URIs de redirection autorisés :**
```
https://bendza.online
https://your-project.vercel.app
```

**Origines JavaScript autorisées :**
```
https://bendza.online
https://your-project.vercel.app
```

## 📧 Configuration Email

### Email Auth Settings

Dans **Authentication > Settings > Email Auth** :

- ✅ **Enable email confirmations**
- ✅ **Enable secure email change**
- ✅ **Enable double confirm changes**

### Email Templates

Personnalisez les templates dans **Authentication > Settings > Email Templates** :

1. **Confirmation Email**
2. **Magic Link**
3. **Change Email Address**
4. **Reset Password**

## 🔒 RLS Policies

Assurez-vous que les politiques RLS sont activées pour toutes les tables :

```sql
-- Exemple pour la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);
```

## 🗄️ Base de Données

### Vérification des Tables

Exécutez le script `bendza.sql` dans l'éditeur SQL de Supabase pour créer toutes les tables nécessaires.

### Vérification des Colonnes

Assurez-vous que la colonne `photourl` existe dans la table `users` :

```sql
-- Vérifier si la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'photourl';

-- Ajouter si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS photourl TEXT;
```

## 🚀 Variables d'Environnement

Dans votre application, assurez-vous d'avoir ces variables :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🔍 Test de Configuration

### Test d'Authentification

1. **Test Email/Password** :
   - Inscription avec email
   - Confirmation email
   - Connexion

2. **Test Google OAuth** :
   - Connexion avec Google
   - Vérification de la création du profil
   - Redirection correcte

### Test des Routes

Vérifiez que ces routes fonctionnent :
- `https://bendza.online` ✅
- `https://bendza.online/login` ✅
- `https://bendza.online/register` ✅
- `https://bendza.online/confirm-email` ✅

## 🛠️ Dépannage

### Erreur 404 sur /auth/callback

**Solution actuelle** : L'authentification OAuth redirige maintenant vers la page d'accueil (`/`) qui gère automatiquement les paramètres OAuth.

### Erreur "Could not find column photourl"

```sql
-- Ajouter la colonne manquante
ALTER TABLE users ADD COLUMN IF NOT EXISTS photourl TEXT;
```

### Erreur d'authentification Google

1. Vérifiez les clés Google dans Supabase
2. Vérifiez les URIs de redirection dans Google Cloud Console
3. Vérifiez les Redirect URLs dans Supabase

---

**BENDZA Platform** - Configuration Supabase ✅ 