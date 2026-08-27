# Guide d'Installation - APIX-PAP Backend v1.0.0

## 🚀 Démarrage Rapide (5 minutes)

### Prérequis
- Node.js 16+ 
- MongoDB 4.4+ (local ou Atlas cloud)
- Git

### Installation

```bash
# 1. Cloner et installer
cd apix-pap-backend
npm install

# 2. Configurer environment
cp .env.example .env
# Éditer .env avec vos paramètres

# 3. Démarrer MongoDB (si local)
mongod

# 4. Seed database avec données de test
npm run seed

# 5. Lancer le serveur
npm run dev
```

**Vérification**: http://localhost:3000/health → `{"status": "OK"}`

---

## 📋 Configuration (.env)

```env
# Serveur
NODE_ENV=development
PORT=3000
HOST=localhost

# Base de données
MONGODB_URI=mongodb://localhost:27017/apix_pap

# JWT
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRE=7d

# CORS - Frontend
CORS_ORIGIN=http://localhost:5173,https://apix-pap.vercel.app
```

### Pour Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/apix_pap
JWT_SECRET=<use strong random key>
CORS_ORIGIN=https://apix-pap.vercel.app
```

---

## 🔌 Intégration Frontend

### Frontend (.env.development)

```env
VITE_APP_API_URL=http://localhost:3000/api
```

### Frontend (.env.production)

```env
VITE_APP_API_URL=https://api-apix-pap.vercel.app/api
```

### Test de Connexion

```javascript
// Dans console du navigateur
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@apix.sn',
    password: 'password'
  })
})
.then(r => r.json())
.then(data => console.log('Token:', data.token))
```

---

## 📊 Base de Données

### Seed Initial

```bash
npm run seed
```

**Résultat attendu:**
- 50 PAPs générés avec données réalistes
- ~150 Biens (1-4 par PAP)
- Statuts et phases workflow variés
- Zones et secteurs distribués

### Collections MongoDB

```javascript
// Voir la taille des collections
db.paps.countDocuments()        // ~50
db.biens.countDocuments()       // ~150
db.evaluations.countDocuments() // 0 (à remplir)
db.compensations.countDocuments() // 0
db.payments.countDocuments()    // 0
```

---

## 🧪 Tests API

### Avec cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@apix.sn",
    "password": "password"
  }'

# Copier le token reçu

# Lister PAPs
curl -X GET "http://localhost:3000/api/pap/list?page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"

# Chercher PAP
curl -X GET "http://localhost:3000/api/pap/search?q=Diallo" \
  -H "Authorization: Bearer <TOKEN>"
```

### Avec Postman

1. Importer la collection: `postman_collection.json` (à créer)
2. Configurer variable: `base_url = http://localhost:3000`
3. Obtenir token via POST /auth/login
4. Tester les endpoints

---

## 🛠️ Développement

### Structure Projet

```
src/
├── config/          # MongoDB connection
├── middleware/      # Auth, errors, logging
├── models/          # Mongoose schemas
├── routes/          # API endpoints
├── controllers/     # Business logic
├── utils/           # Validators, helpers
├── scripts/         # Seed, migrations
└── server.js        # Entry point
```

### Ajouter une Route

1. **Créer modèle** (si nouveau)
   ```bash
   # src/models/NewEntity.model.js
   ```

2. **Créer contrôleur**
   ```bash
   # src/controllers/newentity.controller.js
   export const newEntityController = { ... }
   ```

3. **Créer route**
   ```bash
   # src/routes/newentity.routes.js
   import { newEntityController } from '../controllers/newentity.controller.js'
   
   router.get('/list', authenticate, newEntityController.list)
   ```

4. **Importer dans server.js**
   ```javascript
   import newEntityRoutes from './routes/newentity.routes.js'
   app.use('/api/newentity', newEntityRoutes)
   ```

---

## 📞 Utilisateurs Demo

| Email | Password | Rôle | Permissions |
|-------|----------|------|-------------|
| admin@apix.sn | password | Admin | Tous |
| chef@apix.sn | password | Chef Projet | Gestion PAP, Compensation |
| gestionnaire@apix.sn | password | Gestionnaire | PAP, Biens, Évaluation |
| agent@apix.sn | password | Agent Terrain | Lecture, Terrain |

---

## 🔒 Sécurité

### En Développement
- JWT Secret: démonstration (CHANGE EN PRODUCTION!)
- CORS: localhost:5173 autorisé
- Logs: verbeux (debug)

### En Production
1. **Générer JWT Secret sécurisé**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Configurer MongoDB Atlas**
   - Créer cluster
   - Ajouter IP whitelist
   - Utiliser credentials sécurisées

3. **Déployer sur Vercel/Railway**
   - Variables d'environnement configurées
   - HTTPS obligatoire
   - Logs monitoring

4. **CORS Configuration**
   ```env
   CORS_ORIGIN=https://apix-pap.vercel.app
   ```

---

## 📦 Déploiement

### Vercel Functions

```bash
# Vercel est pour React, pas Node backend
# Utiliser Render, Railway, ou Fly.io
```

### Railway.app (Recommandé)

```bash
# 1. Créer projet Railway
# 2. Connecter GitHub
# 3. Ajouter MongoDB plugin
# 4. Configurer env vars
# 5. Deploy !
```

### Render.com

```bash
# 1. github.com/render-examples
# 2. Connect GitHub
# 3. Select "Web Service"
# 4. Build: npm install
# 5. Start: npm start
```

---

## 🐛 Troubleshooting

### MongoDB Connection Refused
```bash
# Vérifier MongoDB est lancé
mongod

# Ou utiliser MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/apix_pap
```

### Port 3000 en Usage
```bash
# Changer port dans .env
PORT=3001

# Ou tuer le processus
lsof -i :3000
kill -9 <PID>
```

### Token Expired
- JWT_EXPIRE: 7d (par défaut)
- Frontend gère refresh automatique
- Voir ApiServiceV2.js

### CORS Errors
- Vérifier CORS_ORIGIN dans .env
- Inclure protocole complet (http:// ou https://)
- Relancer serveur après changement

---

## 📚 Ressources

- **Frontend**: C:/gravity/apix-pap (React 19 + Vite)
- **API Spec**: BACKEND_INTEGRATION.md
- **Modèles**: src/models/ (Mongoose schemas)
- **Tests**: src/__tests__/ (Vitest)

---

## ✅ Checklist Déploiement

- [ ] .env configuré (secrets sécurisés)
- [ ] MongoDB connectée et seedée
- [ ] npm run dev fonctionne locally
- [ ] Endpoints testés avec cURL/Postman
- [ ] Frontend connecté (CORS OK)
- [ ] Tests unitaires passent
- [ ] Déploiement DB prod (Atlas/Heroku)
- [ ] Déploiement backend (Railway/Render)
- [ ] Variables d'env prod correctes
- [ ] HTTPS activé
- [ ] Monitoring logs configuré
- [ ] Notifications d'erreur en place

---

**État**: ✅ Backend prêt pour développement et déploiement
**Prochain**: Compléter les contrôleurs pour toutes les routes
