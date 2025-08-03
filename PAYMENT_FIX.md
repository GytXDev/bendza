# Correction des Erreurs de Paiement

## Problème Identifié

Les erreurs suivantes ont été corrigées :

1. **Erreur de colonne** : Le code tentait d'insérer dans une colonne `transaction_type` qui n'existe pas dans la base de données
2. **Erreur de type** : Le type `creator_activation` n'était pas autorisé dans la contrainte de la table
3. **Erreur de statut** : Le statut `completed` n'était pas dans la liste des statuts autorisés

## Corrections Apportées

### 1. Code JavaScript

- **Fichier** : `src/hooks/usePaymentTransaction.js`
- **Changement** : `transaction_type` → `type`
- **Changement** : `status: 'completed'` → `status: 'paid'`

### 2. Base de Données

- **Fichier** : `bendza.sql`
- **Changement** : Ajout de `'creator_activation'` aux types autorisés

## Comment Appliquer les Corrections

### Option 1 : Script Automatique (Recommandé)

```bash
# Exécuter le script de correction
node tools/fix-database.js
```

### Option 2 : Correction Manuelle

1. **Aller dans votre dashboard Supabase**
2. **Ouvrir l'éditeur SQL**
3. **Exécuter le script** : `tools/fix-transactions-manual.sql`

### Option 3 : Commandes SQL Individuelles

```sql
-- 1. Supprimer la contrainte existante
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- 2. Recréer la contrainte avec le nouveau type
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('abonnement', 'achat_unitaire', 'donation', 'creator_activation'));

-- 3. Renommer la colonne si nécessaire
ALTER TABLE transactions RENAME COLUMN transaction_type TO type;

-- 4. Ajouter la colonne type si elle n'existe pas
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type TEXT;

-- 5. Mettre à jour les statuts existants
UPDATE transactions SET status = 'paid' WHERE status = 'completed';
```

## Vérification

Après avoir appliqué les corrections, vérifiez que :

1. **La table transactions** a une colonne `type` (pas `transaction_type`)
2. **Les types autorisés** incluent `creator_activation`
3. **Les statuts autorisés** incluent `paid`

```sql
-- Vérifier la structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Vérifier les contraintes
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass;
```

## Types de Transaction Supportés

- `abonnement` : Abonnement à un créateur
- `achat_unitaire` : Achat de contenu unique
- `donation` : Don à un créateur
- `creator_activation` : Activation du profil créateur

## Statuts de Transaction Supportés

- `pending` : En attente
- `paid` : Payé (remplace `completed`)
- `cancelled` : Annulé
- `failed` : Échoué
- `refunded` : Remboursé

## Test

Après les corrections, testez le processus de paiement :

1. **Activation de créateur** : Devrait fonctionner sans erreur
2. **Achat de contenu** : Devrait fonctionner sans erreur
3. **Abonnement** : Devrait fonctionner sans erreur

## Support

Si vous rencontrez encore des erreurs après avoir appliqué ces corrections, vérifiez :

1. **Les logs de la console** pour d'autres erreurs
2. **Les politiques RLS** de la table transactions
3. **Les permissions** de l'utilisateur connecté 