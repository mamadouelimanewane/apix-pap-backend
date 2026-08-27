# APIX-PAP Backend v1.0.0

Backend Node.js/Express pour la plateforme APIX-PAP (Affectés par la Terre). Gestion complète du workflow de 6 phases: Enregistrement → Évaluation → Compensation → Paiement → Réclamations → Clôture.

## 🚀 Démarrage Rapide

### Installation

```bash
# Installation des dépendances
npm install

# Configuration
cp .env.example .env

# Démarrage MongoDB
mongod

# Lancer le serveur de développement
npm run dev

# Lancer en production
npm start
```

### Configuration (.env)

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/apix_pap
JWT_SECRET=your_very_secret_key_generate_with_crypto
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
LOG_LEVEL=debug
```

### Seed Database

```bash
npm run seed
```

Génère 50 PAPs + 150 Biens avec données réalistes.

**Vérification**: `http://localhost:3000/health` → `{"status": "OK"}`

## 📋 API Endpoints (30+)

### Authentification
- `POST /api/auth/login` - Obtenir token (email/password)
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/auth/logout` - Logout

### PAP (Affectés par la Terre)
- `GET /api/pap/list` - Lister PAPs (page, limit, status, zone)
- `GET /api/pap/:papCode` - Détails PAP
- `GET /api/pap/search?q=...` - Chercher PAP
- `GET /api/pap/stats` - Statistiques (by status/zone)
- `POST /api/pap/create` - Créer PAP (Chef+)
- `PUT /api/pap/:papCode` - Mettre à jour (Chef+)

### Bien (Propriétés)
- `GET /api/bien/list/:papCode` - Lister biens du PAP
- `GET /api/bien/:bienCode` - Détails bien
- `GET /api/bien/stats/:papCode` - Stats (by type/status)
- `POST /api/bien/create/:papCode` - Créer bien (Chef+)
- `PUT /api/bien/:bienCode` - Mettre à jour (Chef+)
- `DELETE /api/bien/:bienCode` - Supprimer (Admin)

### Évaluation
- `GET /api/evaluation/list/:papCode` - Évaluations du PAP
- `GET /api/evaluation/:evaluationCode` - Détails évaluation
- `GET /api/evaluation/stats/:papCode` - Stats évaluations
- `POST /api/evaluation/create/:papCode/:bienCode` - Créer (Chef+)
- `POST /api/evaluation/approve/:evaluationCode` - Approuver (Chef+)
- `POST /api/evaluation/reject/:evaluationCode` - Rejeter (Chef+)

### Compensation
- `GET /api/compensation/list/:papCode` - Compensations du PAP
- `GET /api/compensation/stats/:papCode` - Stats compensations
- `POST /api/compensation/propose/:papCode/:bienCode` - Proposer (Chef+)
- `POST /api/compensation/review/:compensationCode` - Examiner (Chef+)
- `POST /api/compensation/approve/:compensationCode` - Approuver (Chef+)
- `POST /api/compensation/reject/:compensationCode` - Rejeter (Chef+)

### Paiement
- `GET /api/payment/list/:papCode` - Paiements du PAP
- `GET /api/payment/stats/:papCode` - Stats paiements
- `POST /api/payment/initiate/:papCode/:compensationCode` - Initier (Chef+)
- `POST /api/payment/confirm/:paymentCode` - Confirmer (Chef+)
- `POST /api/payment/complete/:paymentCode` - Finaliser (Chef+)
- `POST /api/payment/fail/:paymentCode` - Échouer (Chef+)

**Voir [API_TESTING.md](./API_TESTING.md) pour exemples complets avec cURL**

## 🔐 Authentification & Autorisations

Tous les endpoints protégés requièrent JWT en Authorization header:

```
Authorization: Bearer <token>
```

### Utilisateurs Demo

| Email | Mot de passe | Rôle | Permissions |
|-------|---|---|---|
| admin@apix.sn | password | Admin | Tous |
| chef@apix.sn | password | Chef Projet | Gestion PAP, Compensation, Paiement |
| gestionnaire@apix.sn | password | Gestionnaire | PAP, Biens, Évaluation |
| agent@apix.sn | password | Agent Terrain | Lecture, Terrain |

### Obtenir Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@apix.sn",
    "password": "password"
  }'

# Réponse:
# { "token": "eyJhbGciOiJIUzI1NiIs...", "user": { ... } }
```

## 🧪 Tests et Documentation

```bash
# Tester workflow complet
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@apix.sn","password":"password"}'
```

**Guides complets:**
- [API_TESTING.md](./API_TESTING.md) — Tous les exemples cURL
- [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) — Setup détaillé + Troubleshooting

## 📦 Structure Projet

```
src/
├── config/          # MongoDB connection
├── middleware/
│   ├── auth.js      # JWT + RBAC
│   ├── errorHandler.js
│   └── logger.js
├── models/          # Mongoose schemas (5 entités)
│   ├── PAP.model.js
│   ├── Bien.model.js
│   ├── Evaluation.model.js
│   ├── Compensation.model.js
│   └── Payment.model.js
├── routes/          # API endpoints (6 modules)
│   ├── auth.routes.js
│   ├── pap.routes.js
│   ├── bien.routes.js
│   ├── evaluation.routes.js
│   ├── compensation.routes.js
│   └── payment.routes.js
├── controllers/     # Business logic (4 contrôleurs)
│   ├── pap.controller.js
│   ├── bien.controller.js
│   ├── evaluation.controller.js
│   ├── compensation.controller.js
│   └── payment.controller.js
├── utils/
│   └── validation.js # Schémas Joi
├── scripts/
│   └── seed.js      # Population DB
└── server.js        # Entry point
```

## 🔗 Intégration Frontend

Le frontend (React 19 + Vite) est configuré pour utiliser cette API:

```env
# .env.development
VITE_APP_API_URL=http://localhost:3000/api

# .env.production
VITE_APP_API_URL=https://api-apix-pap.vercel.app/api
```

Voir [C:/gravity/apix-pap/src/services/ApiServiceV2.js](../apix-pap/src/services/ApiServiceV2.js) pour intégration.

## 📚 Database

- **MongoDB** - Document database
- **Mongoose** - ODM (Object Document Mapper)

### Collections

- **PAPs** - People affected by project
- **Biens** - Properties/assets
- **Evaluations** - Property evaluations
- **Compensations** - Compensation records
- **Payments** - Payment transactions
- **Reclamations** - Complaints
- **Workflows** - Workflow tracking

## 🛠️ Développement

### Scripts NPM

```bash
npm run dev      # Serveur dev avec nodemon
npm start        # Serveur production
npm run seed     # Seed database (50 PAPs + 150 Biens)
```

### Ajouter une nouvelle route

1. Créer contrôleur: `src/controllers/nova.controller.js`
2. Créer routes: `src/routes/nova.routes.js`
3. Importer dans `server.js`: `app.use('/api/nova', novaRoutes)`
4. Ajouter middleware: `authenticate`, `authorize(['admin'])`

**Voir [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md#développement) pour détails**

## 🔒 Sécurité

- ✅ JWT authentication (7 jours)
- ✅ RBAC (5 rôles)
- ✅ CORS par origine
- ✅ Validation Joi
- ✅ Protection env vars
- ✅ Logs sans données sensibles

## 🚀 Déploiement

### Railway.app (Recommandé)

```bash
# 1. Connecter GitHub
# 2. Railway détecte Node.js automatiquement
# 3. Ajouter MongoDB plugin
# 4. Configurer MONGODB_URI env var
# 5. Deploy!
```

### Render.com

```bash
# 1. Connecter GitHub
# 2. Select "Web Service"
# 3. Build: npm install
# 4. Start: npm start
# 5. Ajouter MongoDB Atlas
```

### Vercel (Functions uniquement)

⚠️ Vercel c'est pour React frontend  
✅ Utiliser Railway, Render, ou Fly.io pour backend

## 📚 Ressources

- **Frontend**: [C:/gravity/apix-pap](../apix-pap) (React 19 + Vite)
- **API Tests**: [API_TESTING.md](./API_TESTING.md)
- **Setup**: [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
- **Integration**: [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)

## 📞 Support

Pour questions ou bugs:
- Email: mamadouastelwane@gmail.com
- GitHub Issues: [apix-pap/issues](https://github.com/mamadouelimanewane/apix-pap/issues)

---

**État**: ✅ **v1.0.0 Production Ready**  
**Dernière mise à jour**: 2026-08-27  
**4 contrôleurs complets** | **30+ endpoints** | **Full workflow implementation** | **MongoDB + JWT + RBAC**
