# 🔧 Guide de Dépannage - Erreurs de Paiement

## 🚨 Erreurs Courantes et Solutions

### 1. Erreur PGRST204 - Colonne manquante

**Symptôme :**
```
Could not find the 'transaction_type' column of 'transactions' in the schema cache
```

**Solution :**
```bash
# Exécuter le script de correction automatique
node tools/fix-database.js

# OU exécuter manuellement dans Supabase SQL Editor
# Contenu du fichier: tools/fix-transactions-manual.sql
```

### 2. Erreur 23514 - Contrainte de validation

**Symptôme :**
```
new row for relation "transactions" violates check constraint "transactions_type_check"
```

**Solution :**
```sql
-- Ajouter le type manquant
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('abonnement', 'achat_unitaire', 'donation', 'creator_activation'));
```

### 3. Paiement réussi mais pas d'enregistrement

**Symptôme :**
- Le paiement passe mais la transaction n'est pas enregistrée
- L'utilisateur n'est pas activé comme créateur

**Solutions :**

#### A. Vérifier la base de données
```bash
# Tester la configuration
node tools/test-transactions.js
```

#### B. Vérifier les logs
1. Ouvrir la console du navigateur (F12)
2. Regarder les logs avec les emojis 📝, ✅, ❌
3. Identifier l'étape qui échoue

#### C. Vérifier les permissions RLS
```sql
-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'transactions';
```

### 4. Erreur d'authentification

**Symptôme :**
```
Utilisateur non connecté
```

**Solution :**
1. Vérifier que l'utilisateur est connecté
2. Rafraîchir la page
3. Se reconnecter si nécessaire

## 🧪 Tests de Diagnostic

### Test 1 : Vérifier la structure de la base
```bash
node tools/test-transactions.js
```

### Test 2 : Vérifier la configuration
```bash
node tools/fix-database.js
```

### Test 3 : Test manuel dans Supabase
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

## 🔍 Logs de Débogage

Les logs suivants apparaissent dans la console :

- `💳 Traitement du paiement réussi:` - Paiement validé
- `📝 Enregistrement de la transaction...` - Début d'enregistrement
- `✅ Transaction enregistrée avec succès` - Transaction OK
- `👑 Activation du profil créateur...` - Début d'activation
- `✅ Profil créateur activé avec succès` - Activation OK
- `❌ Erreur lors de l'enregistrement:` - Erreur détectée

## 🚀 Flux de Paiement Amélioré

1. **Paiement** → Validation Airtel Money
2. **Traitement** → Écran de chargement avec étapes
3. **Enregistrement** → Transaction en base
4. **Activation** → Profil créateur
5. **Succès** → Animation + redirection

## 📞 Support

Si les problèmes persistent :

1. **Sauvegarder les logs** de la console
2. **Vérifier la structure** de la base de données
3. **Tester avec le script** de diagnostic
4. **Contacter le support** avec les logs

## 🔄 Rollback en Cas de Problème

```sql
-- Annuler les modifications si nécessaire
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('abonnement', 'achat_unitaire', 'donation'));

-- Supprimer les transactions de test
DELETE FROM transactions WHERE transaction_id LIKE 'TEST_%';
``` 