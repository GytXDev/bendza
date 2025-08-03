# Déploiement BENDZA Platform sur Vercel

Ce guide vous explique comment déployer BENDZA Platform sur Vercel.

## 🚀 Déploiement Automatique

### 1. Connexion à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec votre compte GitHub/GitLab/Bitbucket
3. Cliquez sur "New Project"
4. Importez votre repository BENDZA Platform

### 2. Configuration du Projet

Vercel détectera automatiquement que c'est un projet Vite/React et utilisera la configuration suivante :

- **Framework Preset** : Vite
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

### 3. Variables d'Environnement

Dans les paramètres du projet Vercel, ajoutez les variables d'environnement suivantes :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Configuration des Domaines

#### Domaine Principal
- Votre domaine principal sera : `https://your-project.vercel.app`
- Ou votre domaine personnalisé : `https://bendza.online`

#### Configuration Supabase
Dans votre dashboard Supabase > Authentication > Settings > URL Configuration :

```
Site URL: https://bendza.online
Redirect URLs: 
- https://bendza.online/auth/callback
- https://bendza.online/confirm-email
- https://your-project.vercel.app/auth/callback
- https://your-project.vercel.app/confirm-email
```

## 📁 Fichiers de Configuration

### vercel.json
Le fichier `vercel.json` configure :
- ✅ Routes SPA (Single Page Application)
- ✅ Redirection vers `/auth/callback`
- ✅ Headers de sécurité
- ✅ Cache pour les assets statiques

### .vercelignore
Exclut les fichiers inutiles du déploiement :
- `node_modules/`
- `tools/`
- `plugins/`
- Fichiers de développement

## 🔧 Configuration des Routes

Le fichier `vercel.json` gère toutes les routes de l'application :

```json
{
  "routes": [
    {
      "src": "/auth/callback",
      "dest": "/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 🔐 Configuration de l'Authentification

### 1. Supabase Auth Settings

Dans votre dashboard Supabase :

1. **Authentication > Settings > Auth Providers**
   - Activez Google OAuth
   - Configurez les clés Google

2. **Authentication > Settings > URL Configuration**
   ```
   Site URL: https://bendza.online
   Redirect URLs: 
   - https://bendza.online/auth/callback
   - https://bendza.online/confirm-email
   ```

3. **Authentication > Settings > Email Auth**
   - Activez "Confirm email"
   - Configurez les templates d'email

### 2. Google OAuth Configuration

Dans Google Cloud Console :

1. **APIs & Services > Credentials**
2. Ajoutez les URIs de redirection autorisés :
   ```
   https://bendza.online/auth/callback
   https://your-project.vercel.app/auth/callback
   ```

## 🚀 Déploiement

### Déploiement Automatique
À chaque push sur la branche `main`, Vercel déploiera automatiquement.

### Déploiement Manuel
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Déployer en production
vercel --prod
```

## 🔍 Vérification du Déploiement

Après le déploiement, testez :

1. **Page d'accueil** : `https://bendza.online`
2. **Inscription** : `https://bendza.online/register`
3. **Connexion Google** : `https://bendza.online/login`
4. **Callback OAuth** : `https://bendza.online/auth/callback`

## 🛠️ Dépannage

### Erreur 404 sur /auth/callback
- ✅ Vérifiez que `vercel.json` est présent
- ✅ Vérifiez les variables d'environnement
- ✅ Vérifiez la configuration Supabase

### Erreur d'authentification
- ✅ Vérifiez les clés Supabase
- ✅ Vérifiez les URLs de redirection dans Supabase
- ✅ Vérifiez la configuration Google OAuth

### Erreur de build
- ✅ Vérifiez que toutes les dépendances sont installées
- ✅ Vérifiez les erreurs dans les logs de build Vercel

## 📊 Monitoring

### Vercel Analytics
Activez Vercel Analytics pour suivre :
- Performance de l'application
- Erreurs en production
- Métriques utilisateur

### Logs
Accédez aux logs dans :
- **Vercel Dashboard > Functions > Logs**
- **Vercel Dashboard > Deployments > [Deployment] > Functions**

## 🔄 Mises à Jour

### Déploiement Automatique
Les mises à jour se déploient automatiquement à chaque push.

### Rollback
En cas de problème :
1. Allez dans **Vercel Dashboard > Deployments**
2. Trouvez la version stable
3. Cliquez sur "Promote to Production"

## 📞 Support

En cas de problème :
1. Vérifiez les logs Vercel
2. Vérifiez la configuration Supabase
3. Testez en local avec `npm run build`
4. Consultez la documentation Vercel

---

**BENDZA Platform** - Déploiement Vercel ✅ 