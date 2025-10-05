-- Vérification des payouts dans la base de données
-- Ce script permet de diagnostiquer les problèmes de récupération des payouts

-- 1. Compter le nombre total de payouts
SELECT 
    COUNT(*) as total_payouts,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
FROM payouts;

-- 2. Voir tous les payouts avec leurs détails
SELECT 
    id,
    creator_id,
    amount,
    currency,
    status,
    phone_number,
    country,
    withdrawal_fee,
    net_amount,
    requested_at,
    updated_at,
    processed_at
FROM payouts 
ORDER BY requested_at DESC;

-- 3. Voir les payouts avec les informations des créateurs
SELECT 
    p.id,
    p.creator_id,
    u.name as creator_name,
    u.email as creator_email,
    p.amount,
    p.currency,
    p.status,
    p.phone_number,
    p.country,
    p.withdrawal_fee,
    p.net_amount,
    p.requested_at,
    p.updated_at,
    p.processed_at
FROM payouts p
LEFT JOIN users u ON p.creator_id = u.id
ORDER BY p.requested_at DESC;

-- 4. Vérifier les politiques RLS (Row Level Security)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'payouts';

-- 5. Vérifier les permissions sur la table payouts
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'payouts' 
AND table_schema = 'public';

-- 6. Vérifier la structure de la table payouts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payouts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Vérifier les triggers sur la table payouts
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'payouts';

-- 8. Vérifier les contraintes sur la table payouts
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'payouts' 
AND tc.table_schema = 'public';

-- 9. Vérifier les index sur la table payouts
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'payouts';

-- 10. Vérifier les données récentes (dernières 24h)
SELECT 
    COUNT(*) as recent_payouts,
    MIN(requested_at) as oldest_recent,
    MAX(requested_at) as newest_recent
FROM payouts 
WHERE requested_at >= NOW() - INTERVAL '24 hours';

-- 11. Vérifier les payouts par créateur
SELECT 
    creator_id,
    u.name as creator_name,
    COUNT(*) as payout_count,
    SUM(amount) as total_amount,
    SUM(withdrawal_fee) as total_fees,
    SUM(net_amount) as total_net
FROM payouts p
LEFT JOIN users u ON p.creator_id = u.id
GROUP BY creator_id, u.name
ORDER BY payout_count DESC;

-- 12. Vérifier les erreurs potentielles dans les données
SELECT 
    'Missing phone_number' as issue,
    COUNT(*) as count
FROM payouts 
WHERE phone_number IS NULL OR phone_number = ''

UNION ALL

SELECT 
    'Missing country' as issue,
    COUNT(*) as count
FROM payouts 
WHERE country IS NULL OR country = ''

UNION ALL

SELECT 
    'Invalid withdrawal_fee' as issue,
    COUNT(*) as count
FROM payouts 
WHERE withdrawal_fee IS NULL OR withdrawal_fee < 0

UNION ALL

SELECT 
    'Invalid net_amount' as issue,
    COUNT(*) as count
FROM payouts 
WHERE net_amount IS NULL OR net_amount < 0

UNION ALL

SELECT 
    'Amount mismatch' as issue,
    COUNT(*) as count
FROM payouts 
WHERE net_amount + withdrawal_fee != amount;
