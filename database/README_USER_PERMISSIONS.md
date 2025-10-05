# Configuration des Permissions Utilisateur - BENDZA

## Problème

Les utilisateurs ne peuvent pas accéder aux informations publiques des créateurs (`item.users?.photourl`, `item.users?.name`) à cause des restrictions RLS (Row Level Security) de Supabase.

## Solution

Ce guide explique comment configurer les permissions pour permettre à tous les utilisateurs (connectés ou non) d'accéder aux informations publiques des créateurs.

## Étapes d'Application

### 1. Exécuter le Script de Correction

```sql
-- Dans l'éditeur SQL de Supabase, exécuter :
\i database/fix_user_permissions.sql
```

### 2. Vérifier les Permissions

```sql
-- Tester que les permissions fonctionnent :
\i database/test_user_permissions.sql
```

## Changements Apportés

### 1. Politique RLS pour la Table `users`

- **Avant** : Seuls les utilisateurs connectés pouvaient voir leurs propres informations
- **Après** : Tous les utilisateurs peuvent voir les informations publiques (nom, photo, statut créateur)

### 2. Politique RLS pour la Table `content`

- **Avant** : Restrictions sur l'accès au contenu
- **Après** : Tous les utilisateurs peuvent voir les contenus publiés avec les informations du créateur

### 3. Vue Publique

- Création d'une vue `user_public_info` pour faciliter l'accès aux informations publiques
- Permissions accordées aux rôles `anon` et `authenticated`

## Informations Publiques Accessibles

### Pour Tous les Utilisateurs :

- ✅ **Nom du créateur** (`users.name`)
- ✅ **Photo de profil** (`users.photourl`)
- ✅ **Statut créateur** (`users.is_creator`)
- ✅ **Date de création** (`users.created_at`)

### Informations Protégées :

- ❌ **Email** (`users.email`) - reste privé
- ❌ **ID utilisateur** (`users.id`) - reste privé

## Test de Fonctionnement

### Requête de Test

```sql
SELECT
    c.id,
    c.title,
    c.type,
    c.price,
    u.name as creator_name,
    u.photourl as creator_photo,
    u.is_creator
FROM public.content c
LEFT JOIN public.users u ON c.creator_id = u.id
WHERE c.is_published = true
LIMIT 5;
```

### Résultat Attendu

- La requête doit retourner des résultats
- Les colonnes `creator_name` et `creator_photo` doivent contenir des valeurs
- Aucune erreur de permission ne doit apparaître

## Vérification dans l'Application

### Console du Navigateur

Ouvrir la console et vérifier que les logs montrent :

```javascript
📱 Content item: {
  id: "...",
  type: "video",
  url: "...",
  users: {
    name: "Nom du créateur",
    photourl: "https://...",
    is_creator: true
  }
}
```

### Interface Utilisateur

- Les noms des créateurs doivent s'afficher : `@nom_du_créateur`
- Les photos de profil doivent être visibles
- Les badges "Vérifié" doivent apparaître pour les créateurs

## Dépannage

### Erreur : "Permission denied"

1. Vérifier que les politiques RLS sont correctement appliquées
2. S'assurer que l'utilisateur a les bonnes permissions
3. Vérifier que les tables existent et sont accessibles

### Erreur : "Column does not exist"

1. Vérifier que la table `users` a les colonnes `name` et `photourl`
2. S'assurer que la relation `content.creator_id -> users.id` est correcte

### Informations Manquantes

1. Vérifier que les créateurs ont bien rempli leur profil
2. S'assurer que les contenus sont marqués comme `is_published = true`
3. Vérifier que la relation entre `content` et `users` est correcte

## Sécurité

### Bonnes Pratiques

- ✅ Seules les informations publiques sont exposées
- ✅ L'email reste privé
- ✅ Les utilisateurs ne peuvent pas modifier les informations d'autrui
- ✅ Les contenus non publiés restent privés

### Permissions Accordées

- `anon` : Lecture des informations publiques
- `authenticated` : Lecture des informations publiques + accès complet à ses propres données

## Support

En cas de problème :

1. Vérifier les logs de Supabase
2. Tester les requêtes SQL directement
3. Vérifier la configuration RLS dans l'interface Supabase
4. Consulter la documentation Supabase sur RLS
