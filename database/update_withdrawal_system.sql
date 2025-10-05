-- Mise à jour du système de retrait pour BENDZA
-- Ajout des champs pour le numéro de téléphone et le pays

-- Ajouter les colonnes nécessaires à la table payouts
ALTER TABLE public.payouts 
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS withdrawal_fee integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount integer DEFAULT 0;

-- Mettre à jour les contraintes pour inclure les nouveaux statuts
ALTER TABLE public.payouts 
DROP CONSTRAINT IF EXISTS payouts_status_check;

ALTER TABLE public.payouts 
ADD CONSTRAINT payouts_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text, 'approved'::text, 'rejected'::text]));

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON public.payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON public.payouts(requested_at);

-- Fonction pour calculer automatiquement les frais et le montant net
CREATE OR REPLACE FUNCTION calculate_withdrawal_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer les frais de retrait (10% du montant)
    NEW.withdrawal_fee = ROUND(NEW.amount * 0.10);
    
    -- Calculer le montant net (montant - frais)
    NEW.net_amount = NEW.amount - NEW.withdrawal_fee;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour calculer automatiquement les montants
DROP TRIGGER IF EXISTS trigger_calculate_withdrawal_amounts ON public.payouts;
CREATE TRIGGER trigger_calculate_withdrawal_amounts
    BEFORE INSERT OR UPDATE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_withdrawal_amounts();

-- Mettre à jour les enregistrements existants
UPDATE public.payouts 
SET 
    withdrawal_fee = ROUND(amount * 0.10),
    net_amount = amount - ROUND(amount * 0.10)
WHERE withdrawal_fee IS NULL OR net_amount IS NULL;

-- Commentaires pour la documentation
COMMENT ON COLUMN public.payouts.phone_number IS 'Numéro de téléphone pour le retrait mobile money';
COMMENT ON COLUMN public.payouts.country IS 'Pays du numéro de téléphone';
COMMENT ON COLUMN public.payouts.withdrawal_fee IS 'Frais de retrait (10% du montant)';
COMMENT ON COLUMN public.payouts.net_amount IS 'Montant net après déduction des frais';
