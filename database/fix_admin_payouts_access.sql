-- Script pour corriger l'accès admin aux payouts
-- Ce script permet aux administrateurs de voir tous les payouts

-- 1. Vérifier les politiques RLS actuelles
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

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own payouts" ON payouts;
DROP POLICY IF EXISTS "Users can insert their own payouts" ON payouts;
DROP POLICY IF EXISTS "Users can update their own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can view all payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can update all payouts" ON payouts;

-- 3. Créer les nouvelles politiques RLS
-- Politique pour que les utilisateurs voient leurs propres payouts
CREATE POLICY "Users can view their own payouts" ON payouts
    FOR SELECT
    USING (auth.uid() = creator_id);

-- Politique pour que les utilisateurs insèrent leurs propres payouts
CREATE POLICY "Users can insert their own payouts" ON payouts
    FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Politique pour que les utilisateurs mettent à jour leurs propres payouts (seulement si pending)
CREATE POLICY "Users can update their own pending payouts" ON payouts
    FOR UPDATE
    USING (auth.uid() = creator_id AND status = 'pending')
    WITH CHECK (auth.uid() = creator_id);

-- Politique pour que les admins voient tous les payouts
CREATE POLICY "Admins can view all payouts" ON payouts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Politique pour que les admins mettent à jour tous les payouts
CREATE POLICY "Admins can update all payouts" ON payouts
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 4. Vérifier que RLS est activé sur la table
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- 5. Tester les politiques avec une requête
-- Cette requête devrait retourner tous les payouts pour un admin
SELECT 
    p.*,
    u.name as creator_name,
    u.role as creator_role
FROM payouts p
LEFT JOIN users u ON p.creator_id = u.id
ORDER BY p.requested_at DESC;

-- 6. Vérifier le rôle de l'utilisateur actuel
SELECT 
    id,
    name,
    email,
    role,
    is_creator
FROM users 
WHERE id = auth.uid();
