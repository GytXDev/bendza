# Configuration de l'environnement BENDZA

## Variables d'environnement requises

Pour que l'application fonctionne correctement, vous devez configurer les variables d'environnement suivantes :

### Supabase (Obligatoire)

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### FusionPay (Optionnel)

```bash
VITE_FUSIONPAY_API_URL=https://api.fusionpay.com
VITE_FUSIONPAY_API_KEY=your-fusionpay-api-key
```

### Application (Optionnel)

```bash
VITE_APP_NAME=BENDZA
VITE_APP_URL=https://www.bendza.online
```

## Configuration en production

### Vercel

1. Allez dans votre projet Vercel
2. Cliquez sur "Settings" > "Environment Variables"
3. Ajoutez les variables d'environnement ci-dessus
4. Redéployez votre application

### Netlify

1. Allez dans votre projet Netlify
2. Cliquez sur "Site settings" > "Environment variables"
3. Ajoutez les variables d'environnement ci-dessus
4. Redéployez votre application

### Autres plateformes

Assurez-vous que les variables d'environnement sont correctement configurées dans votre plateforme de déploiement.

## Vérification de la configuration

Si vous voyez l'erreur `net::ERR_NAME_NOT_RESOLVED`, cela signifie que :

1. Les variables d'environnement ne sont pas configurées
2. L'URL Supabase est incorrecte
3. La clé API Supabase est incorrecte

Vérifiez la console du navigateur pour voir les messages d'erreur de configuration.
