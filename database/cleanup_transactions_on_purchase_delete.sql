-- Trigger pour supprimer les transactions orphelines lors de la suppression de purchases

-- Fonction pour nettoyer les transactions après suppression de purchases
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

-- Trigger qui se déclenche après chaque suppression de purchase
DROP TRIGGER IF EXISTS trigger_cleanup_transactions_on_purchase_delete ON purchases;
CREATE TRIGGER trigger_cleanup_transactions_on_purchase_delete
    AFTER DELETE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_transactions_after_purchase_delete();

-- Fonction pour nettoyer périodiquement toutes les transactions orphelines
CREATE OR REPLACE FUNCTION periodic_cleanup_orphan_transactions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Supprimer toutes les transactions sans purchases
    DELETE FROM transactions 
    WHERE id NOT IN (
        SELECT DISTINCT transaction_id 
        FROM purchases 
        WHERE transaction_id IS NOT NULL
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log du nettoyage
    INSERT INTO system_logs (message, created_at) 
    VALUES ('Nettoyage périodique: ' || deleted_count || ' transactions orphelines supprimées', NOW())
    ON CONFLICT DO NOTHING; -- Ignore si la table system_logs n'existe pas
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour exécuter le nettoyage manuellement
CREATE OR REPLACE FUNCTION manual_cleanup_orphan_transactions()
RETURNS TABLE(
    deleted_count INTEGER,
    message TEXT
) AS $$
DECLARE
    count_result INTEGER;
BEGIN
    -- Exécuter le nettoyage
    SELECT periodic_cleanup_orphan_transactions() INTO count_result;
    
    -- Retourner le résultat
    RETURN QUERY SELECT 
        count_result,
        'Nettoyage manuel terminé: ' || count_result || ' transactions orphelines supprimées';
END;
$$ LANGUAGE plpgsql;
