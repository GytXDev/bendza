# Configuration du Système de Paiement BENDZA

Ce guide explique comment configurer le système de paiement Airtel Money pour BENDZA Platform.

## 🔧 Variables d'Environnement

### Variables Requises

Ajoutez ces variables dans votre fichier `.env` et sur Vercel :

```env
# Configuration Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Configuration Paiement Airtel Money
VITE_AIRTEL_MONEY_API_URL=https://your-domain.com/api/airtelmoney-web.php
```

## 🏦 Configuration Airtel Money API

### Endpoint API

L'API doit accepter les paramètres suivants :

```php
// Exemple d'endpoint PHP
<?php
header('Content-Type: application/json');

// Récupération des paramètres
$amount = $_POST['amount'] ?? null;
$numero = $_POST['numero'] ?? null;
$reference = $_POST['reference'] ?? null;
$description = $_POST['description'] ?? null;
$type = $_POST['type'] ?? null;

// Validation
if (!$amount || !$numero || !$reference) {
    echo json_encode([
        'success' => false,
        'message' => 'Paramètres manquants'
    ]);
    exit;
}

// Traitement du paiement Airtel Money
try {
    // Votre logique de paiement Airtel Money ici
    $transactionId = processAirtelMoneyPayment($amount, $numero, $reference);
    
    echo json_encode([
        'success' => true,
        'transactionId' => $transactionId,
        'message' => 'Paiement effectué avec succès',
        'data' => [
            'amount' => $amount,
            'numero' => $numero,
            'reference' => $reference
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function processAirtelMoneyPayment($amount, $numero, $reference) {
    // Implémentation de l'API Airtel Money
    // Retourner l'ID de transaction
    return 'TXN_' . time() . '_' . rand(1000, 9999);
}
?>
```

### Format de Réponse

L'API doit retourner une réponse JSON avec cette structure :

```json
{
  "success": true,
  "transactionId": "TXN_1234567890_1234",
  "message": "Paiement effectué avec succès",
  "data": {
    "amount": 999,
    "numero": "77123456",
    "reference": "CREATOR_ACTIVATION_USER123_1234567890_ABC123"
  }
}
```

## 🗄️ Base de Données

### Table Transactions

Assurez-vous que la table `transactions` existe dans Supabase :

```sql
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    payment_method VARCHAR(20) DEFAULT 'mobile_money',
    status VARCHAR(20) DEFAULT 'pending',
    transaction_type VARCHAR(50) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    transaction_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

## 🔐 Sécurité

### Validation des Données

Le système valide automatiquement :

1. **Numéro de téléphone** : Format ivoirien (7x, 8x, 9x + 6 chiffres)
2. **Montant** : Doit être positif
3. **Référence** : Unique pour chaque transaction
4. **Type de paiement** : Types autorisés uniquement

### Types de Paiement Supportés

- `creator_activation` : Activation du profil créateur
- `subscription` : Abonnement à un créateur
- `content_purchase` : Achat de contenu

## 🧪 Test du Système

### Test Local

1. **Configurez les variables d'environnement**
2. **Lancez l'application** : `npm run dev`
3. **Testez l'activation créateur** : Allez sur `/become-creator`
4. **Vérifiez les logs** : Console du navigateur

### Test de Production

1. **Déployez sur Vercel**
2. **Configurez les variables d'environnement**
3. **Testez avec un vrai numéro** : Paiement réel
4. **Vérifiez la base de données** : Transactions enregistrées

## 📊 Monitoring

### Logs à Surveiller

- **Erreurs API** : Réponses d'erreur de l'API Airtel Money
- **Transactions échouées** : Statut `failed` dans la base
- **Erreurs de validation** : Numéros invalides, montants incorrects

### Métriques Importantes

- **Taux de succès** : Transactions réussies / Total
- **Temps de réponse** : Latence de l'API
- **Erreurs par type** : Classification des échecs

## 🛠️ Dépannage

### Erreurs Courantes

1. **"URL de l'API Airtel Money non configurée"**
   - Vérifiez `VITE_AIRTEL_MONEY_API_URL`
   - Assurez-vous que l'URL est accessible

2. **"Numéro de téléphone invalide"**
   - Format attendu : 77123456
   - Vérifiez la validation côté client

3. **"Échec du paiement"**
   - Vérifiez les logs de l'API
   - Contrôlez la réponse de l'API Airtel Money

### Support

En cas de problème :
1. Vérifiez les logs de l'application
2. Contrôlez les logs de l'API Airtel Money
3. Vérifiez la base de données Supabase
4. Contactez l'équipe technique

---

**BENDZA Platform** - Système de Paiement ✅ 