# BENDZA V2 - Guide d'Installation et d'Utilisation

## Vue d'Ensemble des Améliorations

Bendza V2 apporte des améliorations significatives avec une ergonomie inspirée de Twitter, un système de modération complet, et des fonctionnalités de paiement uniques.

### Nouvelles Fonctionnalités

**Interface Améliorée :**

- Design Twitter-like plus fluide et espacé
- Cards épurées avec header, contenu et footer
- Auto-play des vidéos au scroll
- Contrôles de lecture manuels
- Suppression des options de téléchargement

**Système de Paiement Unique :**

- Paiement unique par visionnage de contenu
- Créateurs peuvent voir leurs propres contenus gratuitement
- Intégration avec le système de vues existant

**Système de Modération :**

- Statut "en attente" pour tous les nouveaux contenus
- Panneau de modération pour les administrateurs
- Approbation/rejet avec notifications automatiques
- Rôles utilisateur (user, creator, admin)

**Système de Notifications :**

- Notifications pour approbation/rejet de contenu
- Notifications pour nouveaux paiements
- Interface de notifications intégrée

## Installation

### 1. Mise à Jour du Schéma de Base de Données

```sql
-- Exécuter dans l'éditeur SQL de Supabase
\i database/bendza_schema_v2.sql
```

### 2. Créer un Utilisateur Admin

```sql
-- 1. Créer un compte utilisateur normal via l'interface
-- 2. Exécuter cette requête (remplacer l'email) :
UPDATE public.users
SET role = 'admin'
WHERE email = 'votre-email@admin.com';
```

### 3. Vérifier l'Installation

```sql
-- Tester les nouvelles fonctionnalités
\i database/test_user_permissions.sql
```

## Utilisation

### Pour les Utilisateurs

**Navigation :**

- Interface plus fluide et intuitive
- Auto-play des vidéos au scroll
- Contrôles de lecture manuels
- Paiement unique par contenu

**Paiement :**

- Un clic pour débloquer un contenu
- Paiement unique (pas de re-abonnement)
- Créateurs voient leurs contenus gratuitement

### Pour les Créateurs

**Publication :**

- Les contenus passent en statut "en attente"
- Notification automatique lors de l'approbation/rejet
- Accès gratuit à leurs propres contenus

**Tableau de Bord :**

- Voir les statistiques de vues
- Gérer les contenus publiés
- Recevoir les notifications de paiement

### Pour les Administrateurs

**Modération :**

- Accès au panneau `/moderation`
- Voir tous les contenus en attente
- Approuver ou rejeter avec raison
- Notifications automatiques aux créateurs

**👥 Gestion :**

- Voir tous les contenus (même non approuvés)
- Accès aux statistiques complètes
- Gestion des utilisateurs et rôles

## Configuration

### Variables d'Environnement

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# FusionPay (pour les paiements)
FUSIONPAY_API_URL=your_fusionpay_url
```

### Rôles Utilisateur

```sql
-- Types de rôles disponibles
'user'     -- Utilisateur standard
'creator'  -- Créateur de contenu
'admin'    -- Administrateur (modération)
```

### Statuts de Contenu

```sql
-- Statuts de modération
'pending'   -- En attente de modération
'approved'  -- Approuvé et publié
'rejected'  -- Rejeté par la modération
```

## Structure des Données

### Nouvelles Tables

**`notifications` :**

- Notifications pour les utilisateurs
- Types : content_approved, content_rejected, payment_received
- Système de lecture/non-lecture

**`views` :**

- Enregistrement des vues (paiements uniques)
- Une vue par utilisateur par contenu
- Intégration avec le système de paiement

### Nouvelles Colonnes

**Table `users` :**

- `role` : Rôle de l'utilisateur (user/creator/admin)

**Table `content` :**

- `status` : Statut de modération
- `moderated_by` : ID de l'admin modérateur
- `moderated_at` : Date de modération
- `rejection_reason` : Raison du rejet

## Fonctionnalités Avancées

### Auto-Play des Vidéos

```javascript
// Les vidéos se lancent automatiquement au scroll
// Contrôles manuels disponibles
// Pas d'options de téléchargement
```

### Système de Paiement Unique

```javascript
// Un paiement = un accès permanent
// Créateurs voient leurs contenus gratuitement
// Intégration avec FusionPay
```

### Modération Automatique

```sql
-- Fonctions SQL pour la modération
SELECT approve_content('content_id', 'admin_id');
SELECT reject_content('content_id', 'admin_id', 'reason');
```

## Sécurité

### Politiques RLS

- **Utilisateurs** : Voient seulement les contenus approuvés
- **Créateurs** : Voient leurs propres contenus (même en attente)
- **Admins** : Voient tous les contenus et peuvent modérer

### Permissions

- Seuls les admins peuvent approuver/rejeter
- Les créateurs ne peuvent pas modifier le statut
- Les utilisateurs ne peuvent pas voir les contenus en attente

## Dépannage

### Problèmes Courants

**Contenu ne s'affiche pas :**

```sql
-- Vérifier le statut
SELECT status FROM content WHERE id = 'content_id';
-- Doit être 'approved'
```

**Notifications ne fonctionnent pas :**

```sql
-- Vérifier les permissions
SELECT * FROM notifications WHERE user_id = 'user_id';
```

**Auto-play ne fonctionne pas :**

- Vérifier que les vidéos ont des sources valides
- S'assurer que l'utilisateur a payé pour le contenu

### Logs de Debug

```javascript

```

## Performance

### Optimisations

- **Lazy loading** des contenus
- **Auto-play** optimisé pour les performances
- **Notifications** en temps réel
- **Cache** des permissions utilisateur

### Monitoring

```sql
-- Surveiller les performances
SELECT COUNT(*) FROM content WHERE status = 'pending';
SELECT COUNT(*) FROM notifications WHERE is_read = false;
```

## Conclusion

Bendza V2 offre une expérience utilisateur améliorée avec :

- Interface plus fluide et moderne
- Système de modération complet
- Paiements uniques simplifiés
- Notifications en temps réel

L'ensemble reste léger, intuitif et professionnel, en conservant la simplicité de la V1 tout en ajoutant les fonctionnalités demandées.

---

**Support :** Pour toute question ou problème, consultez les logs de la console et vérifiez les permissions dans Supabase.
