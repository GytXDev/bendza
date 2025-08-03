
import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { User, Mail, Camera, Save, LogOut, CreditCard, FileText, Image } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../components/ui/use-toast'
import { imageUploadService } from '../lib/imageUpload'

function Profile() {
  const { userProfile, updateProfile, signOut, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const fileInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    photourl: userProfile?.photourl || '',
    bannerUrl: userProfile?.bannerUrl || '',
    creatorBio: userProfile?.creatorBio || '',
    accountType: userProfile?.accountType || 'subscription',
    subscriptionPrice: userProfile?.subscriptionPrice || 2500
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

  const handleBannerUpload = async (file) => {
    if (!file) return

    setUploadingBanner(true)

    try {
      // Upload de la bannière vers le bon bucket
      const uploadResult = await imageUploadService.uploadBannerImage(
        file,
        user.id,
        userProfile?.bannerUrl
      )

      // Mise à jour du profil avec la nouvelle URL de bannière
      const { error } = await updateProfile({
        bannerUrl: uploadResult.url
      })

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la bannière",
          variant: "destructive"
        })
      } else {
        // Mise à jour du state local
        setFormData(prev => ({
          ...prev,
          bannerUrl: uploadResult.url
        }))

        toast({
          title: "Bannière mise à jour",
          description: "Votre bannière de profil a été mise à jour avec succès"
        })
      }
    } catch (error) {
      console.error('Erreur upload bannière:', error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'upload de la bannière",
        variant: "destructive"
      })
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleBannerClick = () => {
    bannerInputRef.current?.click()
  }

  const handleBannerFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleBannerUpload(file)
    }
    // Reset l'input pour permettre de sélectionner le même fichier
    e.target.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation du prix de l'abonnement
      if (formData.accountType === 'subscription') {
        const price = parseInt(formData.subscriptionPrice)
        if (price < 100 || price > 50000) {
          toast({
            title: "Erreur",
            description: "Le prix de l'abonnement doit être entre 100 et 50 000 FCFA",
            variant: "destructive"
          })
          setLoading(false)
          return
        }
      }

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
          {/* Section Bannière */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Bannière de profil
            </label>
            <div className="relative h-32 md:h-40 bg-gradient-to-br from-orange-500/20 to-purple-600/20 rounded-lg overflow-hidden">
              {formData.bannerUrl ? (
                <img
                  src={formData.bannerUrl}
                  alt="Bannière de profil"
                  className={`w-full h-full object-cover transition-opacity ${uploadingBanner ? 'opacity-50' : 'opacity-100'}`}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-500/30 via-purple-600/30 to-pink-500/30 flex items-center justify-center">
                  <div className="text-white/60 text-2xl font-bold">{userProfile?.name?.charAt(0) || 'B'}</div>
                </div>
              )}

              {/* Bouton pour changer la bannière */}
              <button
                onClick={handleBannerClick}
                disabled={uploadingBanner}
                className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm p-2 rounded-lg hover:bg-black/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Changer la bannière"
              >
                {uploadingBanner ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Image className="w-4 h-4 text-white" />
                )}
              </button>

              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Cliquez sur l'icône pour ajouter une bannière personnalisée (recommandé: 1200x400px)
            </p>
          </div>

          {/* Section Photo de profil */}
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
                Bio du créateur
              </label>
              <textarea
                name="creatorBio"
                value={formData.creatorBio}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg resize-none transition-all duration-200"
                placeholder="Décrivez votre contenu, votre style, vos passions..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Une courte description pour présenter votre profil aux abonnés
              </p>
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
                  disabled
                  className="!pl-12 !pr-4 bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                  placeholder="votre@email.com"
                  style={{ paddingLeft: '48px', paddingRight: '16px' }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Verrouillé</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                L'email ne peut pas être modifié pour des raisons de sécurité
              </p>
            </div>

            {/* Type de compte */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Type de compte
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option Abonnement */}
                <div
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${formData.accountType === 'subscription'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'subscription' }))}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${formData.accountType === 'subscription'
                      ? 'bg-orange-500'
                      : 'bg-gray-700'
                      }`}>
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">Mode Abonnement</h3>
                      <p className="text-sm text-gray-400">Rémunération mensuelle fixe</p>
                    </div>
                    {formData.accountType === 'subscription' && (
                      <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option Paiement par post */}
                <div
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${formData.accountType === 'perPost'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'perPost' }))}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${formData.accountType === 'perPost'
                      ? 'bg-orange-500'
                      : 'bg-gray-700'
                      }`}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">Paiement par post</h3>
                      <p className="text-sm text-gray-400">Rémunération par publication</p>
                    </div>
                    {formData.accountType === 'perPost' && (
                      <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prix de l'abonnement (visible seulement si mode abonnement) */}
            {formData.accountType === 'subscription' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Prix de l'abonnement mensuel (FCFA)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    name="subscriptionPrice"
                    value={formData.subscriptionPrice}
                    onChange={handleChange}
                    min="100"
                    max="50000"
                    step="100"
                    className="!pl-4 !pr-4 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-orange-500"
                    placeholder="2500"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-sm text-gray-400">FCFA</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Prix minimum : 100 FCFA | Prix maximum : 50 000 FCFA
                </p>
              </div>
            )}

            <div className="pt-8">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                <span className="hidden sm:inline">
                  {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                </span>
                <span className="sm:hidden">
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </span>
              </Button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-700">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-3 px-6 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
              <span className="hidden sm:inline">Se déconnecter</span>
              <span className="sm:hidden">Déconnexion</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Profile