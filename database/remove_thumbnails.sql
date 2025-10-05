-- Script pour supprimer les thumbnails du schéma
-- Supprime le champ thumbnail_url de la table content

-- Supprimer le champ thumbnail_url de la table content
ALTER TABLE public.content DROP COLUMN IF EXISTS thumbnail_url;

-- Supprimer le bucket thumbnails s'il existe (optionnel)
-- DROP TABLE IF EXISTS storage.buckets CASCADE WHERE name = 'thumbnails';

-- Commentaire pour documenter le changement
COMMENT ON TABLE public.content IS 'Table des contenus - thumbnails supprimées, utilisation directe des médias';
