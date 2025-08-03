# Configuration de l'environnement

## Variables d'environnement requises

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# Supabase Configuration
# Obtenez ces valeurs depuis votre projet Supabase > Settings > API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Comment obtenir les clés Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Allez dans **Settings** > **API**
4. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

## Exemple de configuration

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU0NzIwMCwiZXhwIjoxOTUyMTIzMjAwfQ.example
```

## Diagnostic des problèmes

En mode développement, vous pouvez diagnostiquer les problèmes Supabase en ouvrant la console du navigateur et en exécutant :

```javascript
// Test complet de Supabase
window.supabaseDebug.runFullDiagnostic()

// Tests individuels
window.supabaseDebug.testConnection()
window.supabaseDebug.testAuth()
window.supabaseDebug.testTables()
```

## Problèmes courants

### 1. Variables d'environnement manquantes
- **Symptôme** : Erreur "Missing Supabase environment variables"
- **Solution** : Vérifiez que le fichier `.env.local` existe et contient les bonnes valeurs

### 2. Clé API incorrecte
- **Symptôme** : Erreur 401 ou 403
- **Solution** : Vérifiez que vous utilisez la clé "anon public" et non la clé "service_role"

### 3. Tables manquantes
- **Symptôme** : Erreur "relation does not exist"
- **Solution** : Exécutez le script SQL `bendza.sql` dans votre projet Supabase

### 4. RLS (Row Level Security) bloquant
- **Symptôme** : Erreur "new row violates row-level security policy"
- **Solution** : Vérifiez que les politiques RLS sont correctement configurées 