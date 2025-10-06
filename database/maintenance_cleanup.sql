-- Script de maintenance pour nettoyer les transactions orphelines
-- À exécuter périodiquement (quotidiennement ou hebdomadairement)

-- 1. Nettoyer les transactions orphelines
SELECT manual_cleanup_orphan_transactions();

-- 2. Statistiques avant/après nettoyage
DO $$
DECLARE
    total_transactions INTEGER;
    total_purchases INTEGER;
    orphan_transactions INTEGER;
BEGIN
    -- Compter les transactions totales
    SELECT COUNT(*) INTO total_transactions FROM transactions;
    
    -- Compter les purchases totales
    SELECT COUNT(*) INTO total_purchases FROM purchases;
    
    -- Compter les transactions orphelines
    SELECT COUNT(*) INTO orphan_transactions 
    FROM transactions 
    WHERE id NOT IN (
        SELECT DISTINCT transaction_id 
        FROM purchases 
        WHERE transaction_id IS NOT NULL
    );
    
    -- Afficher les statistiques
    RAISE NOTICE '=== STATISTIQUES DE NETTOYAGE ===';
    RAISE NOTICE 'Transactions totales: %', total_transactions;
    RAISE NOTICE 'Purchases totales: %', total_purchases;
    RAISE NOTICE 'Transactions orphelines restantes: %', orphan_transactions;
    RAISE NOTICE '================================';
END $$;

-- 3. Vérifier l'intégrité des données
DO $$
DECLARE
    integrity_check INTEGER;
BEGIN
    -- Vérifier s'il y a des purchases sans transactions
    SELECT COUNT(*) INTO integrity_check 
    FROM purchases p
    LEFT JOIN transactions t ON p.transaction_id = t.id
    WHERE t.id IS NULL;
    
    IF integrity_check > 0 THEN
        RAISE WARNING 'ATTENTION: % purchases sans transactions associées trouvées', integrity_check;
    ELSE
        RAISE NOTICE 'Intégrité des données: OK - Toutes les purchases ont des transactions associées';
    END IF;
END $$;

-- 4. Optimiser les index après nettoyage
REINDEX TABLE transactions;
REINDEX TABLE purchases;

-- 5. Analyser les tables pour optimiser les performances
ANALYZE transactions;
ANALYZE purchases;
