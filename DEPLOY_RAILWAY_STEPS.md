# 🚀 Déployer Backend APIX-PAP sur Railway

## Étapes:

### 1. Créer un projet Railway
- Allez sur: https://railway.app/dashboard
- Cliquez "New Project"
- Sélectionnez "GitHub Repo"
- Cherchez "apix-pap-backend"
- Cliquez "Import"

### 2. Railway détecte Node.js automatiquement ✅

### 3. Ajouter MongoDB
- Dans le projet Railway
- Cliquez "Add Service"
- Sélectionnez "MongoDB"
- Railway crée la BD automatiquement

### 4. Configurer les variables d'environnement

Railway → Settings → Variables:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-32-char-random-secret-here
JWT_EXPIRE=7d
CORS_ORIGIN=https://apix-pap.vercel.app
MONGODB_URI=[Auto-fourni par le service MongoDB Railway]
```

Pour générer JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Déployer
- Railway auto-déploie!
- Attendez le message "Deployment successful"
- Copiez l'URL du backend

### 6. Mettre à jour Vercel
- Allez sur: https://vercel.com/dashboard
- Projet: apix-pap
- Settings → Environment Variables
- VITE_APP_API_URL = https://[BACKEND_URL]/api
- Redéployer

### 7. Tester
```bash
curl https://[BACKEND_URL]/health
# Doit retourner: {"status": "OK"}
```

## 🎯 Résultat final:
- ✅ Backend on Railway
- ✅ MongoDB inclus
- ✅ Frontend sur Vercel
- ✅ Auto-déploiement sur GitHub push
