# 🚀 Déployer Backend APIX-PAP sur Render.com

**Status**: ✅ Backend repo créé et poussé vers GitHub  
**Temps estimé**: 10-15 minutes  
**Coût**: Gratuit (plan Free)

---

## 📋 Checklist: Ce qui a été fait

- ✅ Backend repo créé: `mamadouelimanewane/apix-pap-backend`
- ✅ Code poussé vers GitHub  
- ✅ Frontend réorganisé et déployé sur Vercel

---

## 🚀 Étapes pour déployer sur Render

### **Étape 1: Accéder à Render Dashboard**
1. Allez sur: https://dashboard.render.com
2. Connectez-vous avec GitHub

### **Étape 2: Créer un nouveau Web Service**
1. Cliquez "New" → "Web Service"
2. Sélectionnez: `mamadouelimanewane/apix-pap-backend`
3. Remplissez les champs:

| Champ | Valeur |
|-------|--------|
| Name | `apix-pap-backend` |
| Environment | **(Laissez vide ou sélectionnez Node)** |
| Language | Node |
| Branch | `main` |
| Region | Oregon (US West) |
| Root Directory | *(Laissez vide)* |
| Build Command | `npm install` |
| Start Command | `node src/server.js` |
| Compute Plan | Free ($0/month) |

### **Étape 3: Ajouter les Variables d'Environnement**

Avant de cliquer "Deploy", ajoutez ces variables:

```
NODE_ENV = production
JWT_SECRET = <générer une clé aléatoire>
CORS_ORIGIN = https://apix-pap.vercel.app
```

**Générer JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Étape 4: Déployer le Web Service**
1. Cliquez "Deploy web service"
2. Attendez que Render compile et déploie
3. Copiez l'URL du backend (exemple: `https://apix-pap-backend.onrender.com`)

### **Étape 5: Ajouter MongoDB**

**Après création du Web Service:**
1. Dashboard → Votre projet `apix-pap-backend`
2. Allez à "Environment"
3. Cliquez "New Database" → "PostgreSQL"
   - *OU* recherchez une option "MongoDB" (Render ne l'inclut pas nativement, utiliser MongoDB Atlas à la place)*

**Alternative: Utiliser MongoDB Atlas (Recommandé)**
1. Allez sur: https://www.mongodb.com/cloud/atlas
2. Créez un compte gratuit
3. Créez un cluster gratuit
4. Copiez la connection string: `mongodb+srv://...`
5. Revenez à Render
6. Settings → Environment Variables
7. Ajoutez: `MONGODB_URI = mongodb+srv://...`

### **Étape 6: Configurer les Variables Manquantes**

Une fois le service créé, allez à Settings → Environment Variables et ajoutez:

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/apix_pap
JWT_EXPIRE = 7d
```

### **Étape 7: Redéployer avec les variables**
1. Render → Redeploy
2. Attendez le redéploiement

### **Étape 8: Tester le Backend**

```bash
# Vérifier la santé
curl https://apix-pap-backend.onrender.com/health

# Vérifier MongoDB
curl -X POST https://apix-pap-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@apix.sn","password":"password"}'
```

### **Étape 9: Mettre à jour Vercel**
1. Dashboard Vercel → Projet `apix-pap`
2. Settings → Environment Variables
3. Mettez à jour: `VITE_APP_API_URL = https://apix-pap-backend.onrender.com/api`
4. Redéployez

---

## 🎯 Résumé des URLs

| Component | URL |
|-----------|-----|
| Frontend | https://apix-pap.vercel.app |
| Backend | https://apix-pap-backend.onrender.com |
| API | https://apix-pap-backend.onrender.com/api |
| Database | MongoDB Atlas |
| GitHub FE | https://github.com/mamadouelimanewane/apix-pap |
| GitHub BE | https://github.com/mamadouelimanewane/apix-pap-backend |

---

## ⚠️ Problèmes courants

### Backend ne démarre pas
- Vérifier les logs: Render → Logs
- Vérifier MONGODB_URI
- Vérifier PORT=3000

### "Cannot find module"
- Vérifier: `npm install` est dans Build Command
- Vérifier package.json est correct

### API répond mais pas de données
- Vérifier MongoDB connection
- Vérifier MONGODB_URI est correct
- Vérifier database existe

---

## ✅ Checklist Final

- [ ] Backend créé sur Render
- [ ] Web Service déploié avec succès
- [ ] MongoDB Atlas configuré
- [ ] Toutes les variables d'environnement ajoutées
- [ ] Backend URL testée et fonctionnelle
- [ ] Frontend VITE_APP_API_URL mise à jour
- [ ] Portail chargé et affiche les données

---

**Besoin d'aide?** Contactez: mamadouastelwane@gmail.com

🎉 **L'application APIX-PAP sera alors complètement déployée et fonctionnelle!**
