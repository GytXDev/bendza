-- Script pour supprimer le champ transaction_id de la table transactions
-- Ce champ est redondant car on a déjà l'id de la transaction

-- Supprimer le champ transaction_id de la table transactions
ALTER TABLE public.transactions DROP COLUMN IF EXISTS transaction_id;

-- Commentaire pour documenter le changement
COMMENT ON TABLE public.transactions IS 'Table des transactions - champ transaction_id supprimé (redondant avec id)';
