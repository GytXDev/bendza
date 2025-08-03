# 📸 Configuration du Stockage d'Images de Profil

## 🎯 Objectif

Configurer un système d'upload d'images de profil optimisé avec :
- ✅ Compression automatique des images
- ✅ Suppression des anciennes images
- ✅ Gestion de l'espace de stockage
- ✅ Upload drag & drop
- ✅ Prévisualisation en temps réel

## 🚀 Installation

### 1. Configuration du Bucket Supabase

```bash
# Exécuter le script de configuration
node tools/setup-storage.js
```

### 2. Configuration Manuelle des Politiques RLS

Dans votre dashboard Supabase :

1. **Aller dans Storage > Policies**
2. **Sélectionner le bucket `profile-images`**
3. **Ajouter les politiques suivantes :**

#### Politique d'Upload
```sql
CREATE POLICY "Users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL
);
```

#### Politique de Lecture Publique
```sql
CREATE POLICY "Profile images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');
```

#### Politique de Suppression
```sql
CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL
);
```

#### Politique de Mise à Jour
```sql
CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL
);
```

## 🔧 Fonctionnalités

### Compression Automatique
- **Taille maximale** : 800x800 pixels
- **Qualité** : 80%
- **Formats supportés** : JPEG, PNG, WebP
- **Taille fichier max** : 5MB

### Gestion de l'Espace
- **Suppression automatique** des anciennes images
- **Noms de fichiers uniques** avec timestamp
- **Monitoring** de l'usage du stockage

### UX Avancée
- **Drag & drop** pour l'upload
- **Prévisualisation** en temps réel
- **Indicateurs de progression**
- **Validation** des types de fichiers

## 📊 Monitoring

Le système affiche :
- **Espace utilisé** en MB
- **Nombre de fichiers**
- **Compression réalisée** (avant/après)

## 🛠️ Utilisation

### Dans le Composant Profile

```jsx
import ImageUpload from '../components/ImageUpload'
import { imageUploadService } from '../lib/imageUpload'

// Gestion de l'upload
const handleImageUpload = async (file, previewUrl) => {
  const result = await imageUploadService.uploadProfileImage(
    file, 
    userId, 
    currentImageUrl
  )
  // Mettre à jour le profil avec result.url
}

// Gestion de la suppression
const handleImageRemove = async () => {
  await imageUploadService.deleteProfileImage(currentImageUrl)
  // Mettre à jour le profil
}
```

### Service d'Upload

```javascript
// Upload avec compression
const result = await imageUploadService.uploadProfileImage(file, userId, oldImageUrl)

// Suppression
await imageUploadService.deleteProfileImage(imageUrl)

// Vérification de l'usage
const usage = await imageUploadService.getStorageUsage()
```

## 🔍 Dépannage

### Erreur d'Upload
```bash
# Vérifier les politiques RLS
node tools/setup-storage.js

# Tester l'upload
node tools/test-transactions.js
```

### Erreur de Permissions
1. **Vérifier** que l'utilisateur est authentifié
2. **Vérifier** les politiques RLS dans Supabase
3. **Vérifier** que le bucket existe

### Erreur de Compression
1. **Vérifier** le type de fichier (JPEG, PNG, WebP)
2. **Vérifier** la taille du fichier (< 5MB)
3. **Vérifier** que le fichier n'est pas corrompu

## 📈 Optimisations

### Performance
- **Compression côté client** avant upload
- **Noms de fichiers uniques** pour éviter les conflits
- **Suppression asynchrone** des anciennes images

### Sécurité
- **Validation** des types de fichiers
- **Limitation** de la taille des fichiers
- **Politiques RLS** strictes

### Stockage
- **Compression automatique** pour économiser l'espace
- **Suppression des doublons** via noms uniques
- **Monitoring** de l'usage

## 🎨 Personnalisation

### Tailles d'Images
```javascript
// Dans ImageUpload.jsx
const sizeClasses = {
  small: "w-16 h-16",
  medium: "w-24 h-24", 
  large: "w-32 h-32"
}
```

### Qualité de Compression
```javascript
// Dans imageUpload.js
this.quality = 0.8 // 80% de qualité
```

### Types de Fichiers
```javascript
this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
```

## 📝 Logs

Le système génère des logs détaillés :
- `📸 Upload de l'image de profil...`
- `🔄 Compression de l'image...`
- `✅ Image compressée: XMB → YMB`
- `📤 Upload vers le stockage...`
- `🗑️ Suppression de l'ancienne image...`

## 🔄 Maintenance

### Nettoyage Automatique
- Les anciennes images sont supprimées automatiquement
- Les fichiers de test sont nettoyés après les tests

### Monitoring
- Vérification régulière de l'usage du stockage
- Alertes en cas d'espace insuffisant

### Sauvegarde
- Les images sont stockées dans Supabase Storage
- Sauvegarde automatique via Supabase 