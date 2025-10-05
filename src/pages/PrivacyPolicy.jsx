import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  Users, 
  Mail, 
  Phone,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

function PrivacyPolicy() {
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: FileText,
      content: `Bendza s'engage à protéger votre vie privée et vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre plateforme de contenu premium.`
    },
    {
      id: 'data-collection',
      title: 'Collecte des Données',
      icon: Database,
      content: `Nous collectons les informations suivantes :`,
      items: [
        'Informations de compte (nom, email, photo de profil)',
        'Données de paiement (via nos partenaires sécurisés)',
        'Contenu créé et interactions sur la plateforme',
        'Données d\'utilisation et statistiques de navigation',
        'Informations de contact pour les retraits (numéro de téléphone, pays)'
      ]
    },
    {
      id: 'data-usage',
      title: 'Utilisation des Données',
      icon: Eye,
      content: `Vos données sont utilisées pour :`,
      items: [
        'Fournir et améliorer nos services',
        'Traiter les paiements et retraits',
        'Communiquer avec vous',
        'Assurer la sécurité de la plateforme',
        'Respecter les obligations légales'
      ]
    },
    {
      id: 'data-protection',
      title: 'Protection des Données',
      icon: Shield,
      content: `Nous mettons en place des mesures de sécurité strictes :`,
      items: [
        'Chiffrement des données sensibles',
        'Accès restreint aux informations personnelles',
        'Surveillance continue de la sécurité',
        'Formation du personnel sur la protection des données',
        'Audits réguliers de sécurité'
      ]
    },
    {
      id: 'data-sharing',
      title: 'Partage des Données',
      icon: Users,
      content: `Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations uniquement dans les cas suivants :`,
      items: [
        'Avec votre consentement explicite',
        'Pour respecter une obligation légale',
        'Avec nos partenaires de paiement (données minimales)',
        'En cas de fusion ou acquisition (avec notification)'
      ]
    },
    {
      id: 'your-rights',
      title: 'Vos Droits',
      icon: CheckCircle,
      content: `Vous avez le droit de :`,
      items: [
        'Accéder à vos données personnelles',
        'Corriger les informations inexactes',
        'Demander la suppression de vos données',
        'Limiter le traitement de vos données',
        'Recevoir une copie de vos données',
        'Retirer votre consentement à tout moment'
      ]
    },
    {
      id: 'cookies',
      title: 'Cookies et Technologies Similaires',
      icon: Lock,
      content: `Nous utilisons des cookies pour améliorer votre expérience :`,
      items: [
        'Cookies essentiels pour le fonctionnement de la plateforme',
        'Cookies d\'analyse pour comprendre l\'utilisation',
        'Cookies de préférences pour personnaliser l\'expérience',
        'Vous pouvez gérer vos préférences dans les paramètres'
      ]
    },
    {
      id: 'data-retention',
      title: 'Conservation des Données',
      icon: Calendar,
      content: `Nous conservons vos données :`,
      items: [
        'Pendant la durée de votre compte actif',
        '3 ans après la fermeture du compte (obligations légales)',
        'Données de paiement : selon les exigences réglementaires',
        'Données anonymisées peuvent être conservées plus longtemps'
      ]
    },
     {
       id: 'international-transfers',
       title: 'Transferts Internationaux',
       icon: AlertCircle,
       content: `Bendza étant une plateforme internationale, vos données peuvent être transférées et traitées dans différents pays. Nous nous assurons que des garanties appropriées sont en place pour protéger vos données conformément aux standards internationaux de protection des données (RGPD, CCPA, etc.).`
     },
    {
      id: 'children-privacy',
      title: 'Protection des Mineurs',
      icon: Shield,
      content: `Notre service n'est pas destiné aux enfants de moins de 16 ans. Nous ne collectons pas sciemment d'informations personnelles d'enfants. Si vous pensez qu'un enfant a fourni des données personnelles, contactez-nous immédiatement.`
    },
    {
      id: 'changes',
      title: 'Modifications de cette Politique',
      icon: FileText,
      content: `Nous pouvons mettre à jour cette politique de confidentialité. Les modifications importantes seront communiquées par email ou via une notification sur la plateforme. Nous vous encourageons à consulter régulièrement cette page.`
    },
     {
       id: 'contact',
       title: 'Contact',
       icon: Mail,
       content: `Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez-nous :`,
       items: [
         'Email : privacy@bendza.online',
         'Support disponible 24h/24, 7j/7',
         'Réponse garantie sous 24-48h',
         'Support multilingue disponible'
       ]
     }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Politique de Confidentialité - Bendza</title>
        <meta name="description" content="Découvrez comment Bendza protège votre vie privée et vos données personnelles" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 mt-16 md:mt-0">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4"
          >
            Politique de Confidentialité
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto"
          >
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </motion.p>
        </div>

        {/* Table des matières mobile */}
        <div className="block lg:hidden mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Table des matières</h2>
            <div className="space-y-2">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block text-sm sm:text-base text-gray-300 hover:text-orange-500 transition-colors py-1"
                >
                  {index + 1}. {section.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Table des matières desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Table des matières</h2>
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm text-gray-300 hover:text-orange-500 transition-colors py-1"
                  >
                    {index + 1}. {section.title}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="lg:col-span-3">
            <div className="space-y-6 sm:space-y-8">
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                     
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {section.title}
                      </h2>
                    </div>
                    
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                        {section.content}
                      </p>
                      
                      {section.items && (
                        <ul className="space-y-2 sm:space-y-3">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start space-x-2 sm:space-x-3">
                              <span className="text-gray-300 text-sm sm:text-base">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.section>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer avec informations importantes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-12 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-500/20"
        >
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
              Questions ou Préoccupations ?
            </h3>
            <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
              Si vous avez des questions sur cette politique de confidentialité ou souhaitez exercer vos droits, 
              n'hésitez pas à nous contacter.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <a
                href="mailto:privacy@bendza.com"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
              >
                privacy@bendza.online
              </a>
              {/* <a
                href="tel:+237XXXXXXXXX"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
              >
                <Phone className="w-4 h-4 mr-2" />
                +237 XXX XXX XXX
              </a> */}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
