-- Script pour ajouter le support des miniatures
-- Ajoute un champ thumbnail_url optionnel à la table content

-- Ajouter le champ thumbnail_url à la table content
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Commentaire pour documenter
COMMENT ON COLUMN public.content.thumbnail_url IS 'URL de la miniature pour le contenu (optionnel)';

-- Index pour optimiser les requêtes sur les miniatures
CREATE INDEX IF NOT EXISTS idx_content_thumbnail ON public.content(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
