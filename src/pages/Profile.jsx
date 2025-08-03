
import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { User, Mail, Camera, Save, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../components/ui/use-toast'
import { imageUploadService } from '../lib/imageUpload'

function Profile() {
  const { userProfile, updateProfile, signOut, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    photourl: userProfile?.photourl || ''
  })
  const { toast } = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageUpload = async (file) => {
    if (!file) return

    setUploadingImage(true)

    try {
      // Upload de l'image
      const uploadResult = await imageUploadService.uploadProfileImage(
        file,
        user.id,
        userProfile?.photourl
      )

      // Mise à jour du profil avec la nouvelle URL d'image
      const { error } = await updateProfile({
        photourl: uploadResult.url
      })

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la photo de profil",
          variant: "destructive"
        })
      } else {
        // Mise à jour du state local
        setFormData(prev => ({
          ...prev,
          photourl: uploadResult.url
        }))

        toast({
          title: "Photo mise à jour",
          description: "Votre photo de profil a été mise à jour avec succès"
        })
      }
    } catch (error) {
      console.error('Erreur upload image:', error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'upload de l'image",
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    // Reset l'input pour permettre de sélectionner le même fichier
    e.target.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await updateProfile(formData)

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le profil",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été sauvegardées"
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Profil - BENDZA</title>
        <meta name="description" content="Gérez votre profil BENDZA" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900 rounded-lg p-8"
        >
          <div className="text-center mb-8">
            <div className="relative inline-block group">
              <img
                src={userProfile?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.name}`}
                alt={userProfile?.name}
                className={`w-24 h-24 rounded-full object-cover mx-auto mb-4 transition-opacity ${uploadingImage ? 'opacity-50' : 'opacity-100'
                  }`}
              />
              <button
                onClick={handleImageClick}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Changer la photo de profil"
              >
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              {!uploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
                  <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Cliquer pour changer
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Mon Profil</h1>
            <p className="text-gray-400">
              Gérez vos informations personnelles et paramètres
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10 pointer-events-none" />
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="!pl-12 !pr-4 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-orange-500"
                  placeholder="Votre nom complet"
                  style={{ paddingLeft: '48px', paddingRight: '16px' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10 pointer-events-none" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="!pl-12 !pr-4 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-orange-500"
                  placeholder="votre@email.com"
                  style={{ paddingLeft: '48px', paddingRight: '16px' }}
                />
              </div>
            </div>


            <div className="pt-8">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-base font-medium"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-700">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-3 text-base font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Profile