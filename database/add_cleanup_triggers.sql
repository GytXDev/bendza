-- Ajout des triggers de nettoyage au schéma principal
-- À exécuter après la création des tables

-- 1. Fonction pour nettoyer les transactions orphelines
CREATE OR REPLACE FUNCTION cleanup_orphan_transactions()
RETURNS TRIGGER AS $$
BEGIN
    -- Supprimer les transactions qui n'ont pas de purchases associées
    DELETE FROM transactions 
    WHERE id NOT IN (
        SELECT DISTINCT transaction_id 
        FROM purchases 
        WHERE transaction_id IS NOT NULL
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Fonction pour nettoyer après suppression de purchases
CREATE OR REPLACE FUNCTION cleanup_transactions_after_purchase_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Si une purchase est supprimée, supprimer sa transaction associée
    -- seulement si cette transaction n'a pas d'autres purchases
    IF TG_OP = 'DELETE' THEN
        DELETE FROM transactions 
        WHERE id = OLD.transaction_id 
        AND id NOT IN (
            SELECT DISTINCT transaction_id 
            FROM purchases 
            WHERE transaction_id = OLD.transaction_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger pour nettoyage périodique (après chaque modification de purchases)
DROP TRIGGER IF EXISTS trigger_cleanup_orphan_transactions ON purchases;
CREATE TRIGGER trigger_cleanup_orphan_transactions
    AFTER INSERT OR UPDATE OR DELETE ON purchases
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_orphan_transactions();

-- 4. Trigger pour nettoyage immédiat après suppression de purchases
DROP TRIGGER IF EXISTS trigger_cleanup_transactions_on_purchase_delete ON purchases;
CREATE TRIGGER trigger_cleanup_transactions_on_purchase_delete
    AFTER DELETE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_transactions_after_purchase_delete();

-- 5. Fonction pour nettoyage manuel
CREATE OR REPLACE FUNCTION manual_cleanup_orphan_transactions()
RETURNS TABLE(
    deleted_count INTEGER,
    message TEXT
) AS $$
DECLARE
    count_result INTEGER;
BEGIN
    -- Supprimer toutes les transactions sans purchases
    DELETE FROM transactions 
    WHERE id NOT IN (
        SELECT DISTINCT transaction_id 
        FROM purchases 
        WHERE transaction_id IS NOT NULL
    );
    
    GET DIAGNOSTICS count_result = ROW_COUNT;
    
    -- Retourner le résultat
    RETURN QUERY SELECT 
        count_result,
        'Nettoyage manuel terminé: ' || count_result || ' transactions orphelines supprimées';
END;
$$ LANGUAGE plpgsql;

-- 6. Nettoyage initial des transactions orphelines existantes
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM transactions 
    WHERE id NOT IN (
        SELECT DISTINCT transaction_id 
        FROM purchases 
        WHERE transaction_id IS NOT NULL
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Nettoyage initial terminé: % transactions orphelines supprimées', deleted_count;
END $$;

-- 7. Créer un index pour optimiser les performances du nettoyage
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON purchases(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_id ON transactions(id);

-- 8. Commentaires pour documentation
COMMENT ON FUNCTION cleanup_orphan_transactions() IS 'Supprime automatiquement les transactions sans purchases associées';
COMMENT ON FUNCTION cleanup_transactions_after_purchase_delete() IS 'Supprime les transactions orphelines après suppression de purchases';
COMMENT ON FUNCTION manual_cleanup_orphan_transactions() IS 'Fonction pour nettoyer manuellement les transactions orphelines';
