# BENDZA Platform

**Crée. Publie. Encaisse.**

BENDZA est une plateforme de monétisation de contenu pour les influenceurs, permettant aux créateurs de publier du contenu exclusif et de le monétiser via des abonnements ou des achats à la carte.

## 🚀 Fonctionnalités

### Pour les Créateurs
- ✅ Profil créateur personnalisable
- ✅ Publication de contenu exclusif (vidéos, images, textes)
- ✅ Monétisation par abonnement ou à la carte
- ✅ Tableau de bord avec statistiques
- ✅ Gestion des messages privés
- ✅ Système de paiement Mobile Money

### Pour les Utilisateurs
- ✅ Découverte de créateurs
- ✅ Abonnement aux créateurs
- ✅ Achat de contenu à la carte
- ✅ Messagerie privée
- ✅ Historique des achats

## 🛠️ Technologies

- **Frontend** : React 18 + Vite
- **Styling** : Tailwind CSS + Framer Motion
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **Paiements** : Mobile Money (Orange Money, Free Money, etc.)
- **Déploiement** : Vercel/Netlify

## 📦 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Supabase

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd bendza-platform
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**
   - Créer un projet Supabase
   - Exécuter le script SQL dans `bendza.sql`
   - Configurer les variables d'environnement

4. **Variables d'environnement**
Créer un fichier `.env.local` :
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

## 🗄️ Base de données

Le projet utilise Supabase avec les tables suivantes :

- `users` - Profils utilisateurs
- `creators` - Profils créateurs
- `content` - Contenu publié
- `transactions` - Historique des transactions
- `messages` - Messages privés
- `payouts` - Demandes de paiement

## 🎨 Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base
│   └── ...
├── pages/              # Pages de l'application
├── contexts/           # Contextes React
├── hooks/              # Hooks personnalisés
├── lib/                # Utilitaires et configurations
├── config/             # Configurations
└── main.jsx           # Point d'entrée
```

## 🚀 Scripts disponibles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview

# Linting
npm run lint

# Formatage du code
npm run format
```

## 🔧 Optimisations de performance

- ✅ Lazy loading des pages
- ✅ Pagination des listes
- ✅ Debounce sur la recherche
- ✅ Cache des requêtes
- ✅ Optimisation des images
- ✅ Animations optimisées

## 🔐 Sécurité

- Authentification Supabase
- Row Level Security (RLS)
- Validation des données
- Protection CSRF
- Variables d'environnement sécurisées

## 📱 Responsive Design

L'application est entièrement responsive et optimisée pour :
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)

## 🎯 Roadmap

- [ ] Système de notifications push
- [ ] API REST publique
- [ ] Intégration de nouveaux moyens de paiement
- [ ] Système de recommandations
- [ ] Analytics avancées
- [ ] Application mobile native

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support :
- 📧 Email : support@bendza.com
- 💬 Discord : [Lien Discord]
- 📖 Documentation : [Lien Documentation]

---

**BENDZA** - Crée. Publie. Encaisse. 🚀 