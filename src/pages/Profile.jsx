
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { User, Mail, Camera, Save, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../components/ui/use-toast'

function Profile() {
  const { userProfile, updateProfile, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
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
            <div className="relative inline-block">
              <img
                src={userProfile?.photourl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.name}`}
                alt={userProfile?.name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
              />
              <button className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full hover:bg-orange-600 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Mon Profil</h1>
            <p className="text-gray-400">
              Gérez vos informations personnelles et paramètres
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  placeholder="Votre nom complet"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  placeholder="votre@email.com"
                />
              </div>
            </div>


            <div className="pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
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
