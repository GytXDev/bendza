-- Trigger pour supprimer automatiquement les transactions orphelines
-- (transactions sans purchases associées)

-- Fonction pour nettoyer les transactions orphelines
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

-- Trigger qui se déclenche après chaque insertion dans purchases
-- pour nettoyer les transactions orphelines
DROP TRIGGER IF EXISTS trigger_cleanup_orphan_transactions ON purchases;
CREATE TRIGGER trigger_cleanup_orphan_transactions
    AFTER INSERT OR UPDATE OR DELETE ON purchases
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_orphan_transactions();

-- Nettoyage initial des transactions orphelines existantes
DELETE FROM transactions 
WHERE id NOT IN (
    SELECT DISTINCT transaction_id 
    FROM purchases 
    WHERE transaction_id IS NOT NULL
);

-- Afficher le nombre de transactions supprimées
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Nettoyage initial terminé: % transactions orphelines supprimées', deleted_count;
END $$;
