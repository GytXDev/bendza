import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Users, 
  CreditCard, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  UserCheck,
  Mail,
  Phone,
  Scale
} from 'lucide-react';

function TermsOfService() {
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction et Acceptation',
      icon: FileText,
      content: `En utilisant la plateforme Bendza, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.`,
      items: [
        'Ces conditions s\'appliquent à tous les utilisateurs de Bendza',
        'L\'utilisation de la plateforme constitue votre acceptation de ces conditions',
        'Nous nous réservons le droit de modifier ces conditions à tout moment',
        'Les modifications seront communiquées via la plateforme'
      ]
    },
    {
      id: 'definitions',
      title: 'Définitions',
      icon: Scale,
      content: `Dans ces conditions d'utilisation :`,
      items: [
        '"Bendza" ou "nous" désigne la plateforme et ses opérateurs',
        '"Utilisateur" désigne toute personne utilisant la plateforme',
        '"Créateur" désigne un utilisateur qui publie du contenu',
        '"Contenu" désigne tout matériel publié sur la plateforme',
        '"Service" désigne l\'ensemble des fonctionnalités de Bendza'
      ]
    },
    {
      id: 'account-registration',
      title: 'Inscription et Compte',
      icon: UserCheck,
      content: `Pour utiliser Bendza, vous devez :`,
      items: [
        'Fournir des informations exactes et à jour',
        'Être âgé d\'au moins 16 ans',
        'Maintenir la confidentialité de votre compte',
        'Notifier immédiatement toute utilisation non autorisée',
        'Être responsable de toutes les activités de votre compte'
      ]
    },
    {
      id: 'content-guidelines',
      title: 'Directives de Contenu',
      icon: Shield,
      content: `Le contenu publié sur Bendza doit respecter les règles suivantes :`,
      items: [
        'Respecter les droits d\'auteur et la propriété intellectuelle',
        'Ne pas contenir de contenu illégal, offensant ou inapproprié',
        'Ne pas promouvoir la violence, la haine ou la discrimination',
        'Ne pas contenir de contenu pornographique ou explicite',
        'Respecter la vie privée d\'autrui',
        'Ne pas spammer ou publier de contenu répétitif'
      ]
    },
    {
      id: 'prohibited-activities',
      title: 'Activités Interdites',
      icon: XCircle,
      content: `Il est strictement interdit de :`,
      items: [
        'Utiliser la plateforme à des fins illégales',
        'Tenter de contourner les mesures de sécurité',
        'Créer de faux comptes ou usurper l\'identité d\'autrui',
        'Manipuler les systèmes de paiement ou de notation',
        'Partager des informations de compte avec des tiers',
        'Utiliser des bots ou des scripts automatisés',
        'Harceler ou menacer d\'autres utilisateurs'
      ]
    },
    {
      id: 'payment-terms',
      title: 'Conditions de Paiement',
      icon: CreditCard,
      content: `Les paiements sur Bendza sont régis par les conditions suivantes :`,
      items: [
        'Les prix sont affichés en FCFA et incluent les taxes applicables',
        'Les paiements sont traités par des partenaires sécurisés',
        'Les créateurs reçoivent 80% du prix de vente',
        'Les frais de retrait sont déduits du montant net',
        'Les remboursements sont traités selon notre politique de remboursement',
        'Nous nous réservons le droit de suspendre les paiements en cas de violation'
      ]
    },
     {
       id: 'creator-obligations',
       title: 'Obligations des Créateurs',
       icon: Users,
       content: `En tant que créateur, vous vous engagez à :`,
       items: [
         'Fournir du contenu original et de qualité',
         'Respecter les droits d\'auteur et la propriété intellectuelle',
         'Répondre aux demandes de modération dans les délais',
         'Maintenir un comportement professionnel',
         'Respecter les délais de traitement des retraits',
         'Déclarer vos revenus selon la réglementation locale applicable'
       ]
     },
    {
      id: 'intellectual-property',
      title: 'Propriété Intellectuelle',
      icon: Shield,
      content: `Concernant la propriété intellectuelle :`,
      items: [
        'Vous conservez les droits sur votre contenu original',
        'Vous accordez à Bendza une licence pour héberger et distribuer votre contenu',
        'Vous garantissez posséder les droits sur le contenu que vous publiez',
        'Bendza respecte les droits de propriété intellectuelle d\'autrui',
        'Les signalements de violation sont traités rapidement'
      ]
    },
    {
      id: 'moderation',
      title: 'Modération et Suspension',
      icon: AlertTriangle,
      content: `Bendza se réserve le droit de :`,
      items: [
        'Modérer tout contenu publié sur la plateforme',
        'Suspendre ou supprimer des comptes en cas de violation',
        'Retirer du contenu sans préavis si nécessaire',
        'Coopérer avec les autorités en cas de demande légale',
        'Appliquer des sanctions progressives selon la gravité'
      ]
    },
    {
      id: 'disclaimers',
      title: 'Avertissements et Limitations',
      icon: AlertTriangle,
      content: `Bendza fournit ses services "en l'état" et décline toute responsabilité pour :`,
      items: [
        'Les interruptions temporaires du service',
        'La perte de données due à des causes externes',
        'Les dommages indirects ou consécutifs',
        'Les actions d\'autres utilisateurs',
        'Les problèmes techniques indépendants de notre volonté'
      ]
    },
    {
      id: 'termination',
      title: 'Résiliation',
      icon: XCircle,
      content: `Votre compte peut être résilié :`,
      items: [
        'À votre demande à tout moment',
        'Par Bendza en cas de violation des conditions',
        'En cas d\'inactivité prolongée (plus de 2 ans)',
        'Les données peuvent être conservées selon nos obligations légales',
        'Les paiements en cours seront traités selon les délais habituels'
      ]
    },
     {
       id: 'governing-law',
       title: 'Droit Applicable',
       icon: Scale,
       content: `Ces conditions sont régies par le droit applicable dans votre juridiction. Tout litige sera résolu selon les lois locales et les tribunaux compétents de votre région.`
     },
     {
       id: 'contact',
       title: 'Contact et Support',
       icon: Mail,
       content: `Pour toute question concernant ces conditions d'utilisation :`,
       items: [
         'Email : legal@bendza.online',
         'Support disponible 24h/24, 7j/7',
         'Réponse garantie sous 24-48h',
         'Support multilingue disponible'
       ]
     }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Conditions d'Utilisation - Bendza</title>
        <meta name="description" content="Consultez les conditions d'utilisation de la plateforme Bendza" />
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
            Conditions d'Utilisation
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
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
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
              Questions Juridiques ?
            </h3>
            <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
              Si vous avez des questions sur ces conditions d'utilisation ou des préoccupations juridiques, 
              notre équipe juridique est là pour vous aider.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <a
                href="mailto:legal@bendza.com"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
              >
                legal@bendza.online
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

export default TermsOfService;
