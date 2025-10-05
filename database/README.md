# Instructions de mise à jour de la base de données

## Problème résolu

L'erreur lors de l'approbation du contenu dans le panneau de modération était due à :

1. L'absence du champ `status` dans la table `content`
2. L'absence des fonctions RPC `approve_content` et `reject_content`

## Modifications à appliquer

### 1. Exécuter le script de modération

Exécutez le fichier `database/moderation_functions.sql` dans votre base de données Supabase :

```sql
-- Ce script ajoute :
-- - Le champ status à la table content
-- - Les champs moderation_reason, moderated_by, moderated_at
-- - Les fonctions RPC approve_content et reject_content
-- - Les index et politiques RLS nécessaires
-- - Supprime les fonctions existantes pour éviter les conflits
```

### ⚠️ Résolution des erreurs

Si vous obtenez l'erreur `cannot change return type of existing function`, le script a été mis à jour pour :

- Supprimer automatiquement les fonctions existantes
- Supprimer les politiques RLS existantes
- Recréer tout proprement

### 2. Vérification

Après avoir exécuté le script, vérifiez que :

- La table `content` a les nouveaux champs
- Les fonctions RPC sont créées
- Les politiques RLS permettent la modération

### 3. Test

1. Créez un nouveau contenu (il sera en statut 'pending')
2. Allez dans le panneau de modération
3. Approuvez ou rejetez le contenu
4. Vérifiez que le statut change correctement

## Fonctionnalités ajoutées

### Statuts de contenu

- `pending` : En attente de modération
- `approved` : Approuvé et visible
- `rejected` : Rejeté et non visible

### Fonctions RPC

- `approve_content(p_content_id, p_admin_id)` : Approuve un contenu
- `reject_content(p_content_id, p_admin_id, p_reason)` : Rejette un contenu

### Interface utilisateur

- Le dashboard créateur affiche le statut de chaque contenu
- Les messages indiquent que le contenu est en attente de modération
- Le panneau de modération fonctionne correctement
