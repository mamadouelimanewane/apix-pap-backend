# 🚀 Déployer Backend sur Railway.app

**Temps estimé**: 5-10 minutes  
**Prérequis**: GitHub account + Railway account

---

## ✨ Pourquoi Railway?

- ✅ Auto-detect Node.js
- ✅ MongoDB plugin included
- ✅ Auto-deploy on GitHub push
- ✅ Free tier available ($5 credits/month)
- ✅ Simple setup (2 clicks)
- ✅ No need for separate MongoDB

---

## 📋 Step 1: Setup Railway

### 1.1: Create Railway Account

1. Go to: https://railway.app
2. Click "Start Project"
3. Sign up with GitHub
4. Authorize Railway

### 1.2: Create New Project

1. Dashboard → "New Project"
2. Select "GitHub Repo"
3. Search "apix-pap-backend"
4. Click "Import"

---

## 🔧 Step 2: Configure Environment

### 2.1: Add MongoDB

Railway provides MongoDB out of the box!

1. In Railway Project → "Add Service"
2. Select "MongoDB"
3. Railway creates database automatically
4. Copy MONGODB_URI (provided automatically)

### 2.2: Set Environment Variables

Railway Dashboard → Variables:

```
NODE_ENV = production
PORT = 3000
JWT_SECRET = [Generate 32-char random string]
JWT_EXPIRE = 7d
CORS_ORIGIN = https://apix-pap.vercel.app,https://your-domain.com
MONGODB_URI = [Auto-provided by Railway]
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3: Preview Environment (Optional)

For staging/testing:
```
NODE_ENV = development
JWT_SECRET = [Same or different]
CORS_ORIGIN = http://localhost:5173,https://preview.vercel.app
MONGODB_URI = [Separate dev database]
```

---

## 🚀 Step 3: Deploy

### 3.1: Configure Build

Railway auto-detects:
- ✅ Framework: Node.js
- ✅ Build Command: `npm install`
- ✅ Start Command: `npm start`

### 3.2: Deploy Manually

```bash
# First time push
git push origin main

# Railway auto-builds and deploys
```

**Railway Dashboard shows:**
```
📦 Installing dependencies
🔨 Building
✅ Deployment successful
🌍 URL: https://apix-pap-backend.up.railway.app
```

### 3.3: Configure Auto-Deploy

Railway auto-deploys on GitHub push (default on).

Check Railway Dashboard → Settings → Git Integration

---

## ✅ Verify Deployment

### 4.1: Check Backend Health

```bash
# Test endpoint
curl https://apix-pap-backend.up.railway.app/health

# Expected response:
# {"status": "OK"}
```

### 4.2: Test API

```bash
# Login
curl -X POST https://apix-pap-backend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@apix.sn",
    "password": "password"
  }' | jq .

# Expected: JWT token received
```

### 4.3: Verify Database Connection

```bash
# List PAPs
TOKEN=$(curl -s -X POST https://apix-pap-backend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@apix.sn","password":"password"}' | jq -r '.token')

curl -s -X GET https://apix-pap-backend.up.railway.app/api/pap/list \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# Expected: 50+ (seeded data)
```

---

## 📊 Step 4: Seed Production Database

Production database is empty! Seed it:

### Option A: Via SSH (Recommended)

```bash
# From Railway Dashboard:
# 1. Select project
# 2. Click "Connect" → "Shell"
# 3. Run:

npm run seed

# Output:
# ✅ 50 PAPs créés
# ✅ 150 Biens créés
```

### Option B: Via Remote Bash

```bash
# In terminal:
railway shell npm run seed

# Enter project when prompted
```

### Option C: Via API (Not recommended)

Create seeding endpoint in backend (future improvement).

---

## 🔗 Step 5: Connect Frontend to Backend

### 5.1: Update Vercel Environment

Vercel Dashboard → Settings → Environment Variables

```
VITE_APP_API_URL = https://apix-pap-backend.up.railway.app/api
VITE_DEBUG = false
```

### 5.2: Redeploy Frontend

```bash
# Push to GitHub (auto-redeploy on Vercel)
git push origin main

# Or trigger manually on Vercel Dashboard
```

### 5.3: Verify Connection

```
Frontend: https://apix-pap.vercel.app
Backend: https://apix-pap-backend.up.railway.app/api

✅ Login works
✅ List PAPs works
✅ Create PAP works
✅ All endpoints accessible
```

---

## 📈 Monitoring & Logs

### View Logs

Railway Dashboard → Logs tab:

```
✅ Build logs
✅ Runtime logs
✅ Deployment logs
✅ Error stack traces
```

### Monitor Performance

Railway Dashboard → Metrics:

```
✅ CPU usage
✅ Memory usage
✅ Request count
✅ Error rate
```

### Set Up Alerts (Optional)

Railway Dashboard → Alerts:

```
Alert if:
- Memory > 500MB
- Error rate > 5%
- No requests in 5 minutes (down)
```

---

## 🔐 Production Security

### JWT Secret

✅ 32+ character random string  
✅ Changed every 90 days  
✅ Never committed to Git  

### MongoDB Access

✅ Only accessible from Railway network  
✅ No direct public access  
✅ Automatic backups (Railway Premium)

### CORS Configuration

```
Allowed origins:
- https://apix-pap.vercel.app (frontend)
- https://your-custom-domain.com (if any)
```

### Environment Variables

✅ All secrets in Railway Dashboard  
✅ Never in .env.production  
✅ Rotated regularly  

---

## 🆘 Troubleshooting

### Build Failed

**Check Railway Logs:**
1. Dashboard → Deployment tab
2. Click failed deployment
3. See error message
4. Fix locally
5. Push to GitHub (auto-redeploy)

**Common errors:**
- Missing NODE_ENV → Set in Variables
- MongoDB URI wrong → Check Railway MongoDB service
- npm install failed → Check package.json syntax

### App Crashes

**Check Logs:**
```
Railway Dashboard → Logs

Look for:
- EADDRINUSE (port conflict) → Set PORT=3000
- Cannot find module → npm install failed
- MongoDB connection → Check MONGODB_URI
```

### Cold Start Issues

Railway functions startup in ~30 seconds.

**For faster starts:**
- Railway Premium (keeps instances warm)
- Or: Use Hobby tier (acceptable for dev)

---

## 💾 Database Backups

### Automatic Backups

Railway MongoDB includes:
- Daily snapshots
- 7-day retention
- Point-in-time recovery (Premium)

### Manual Backup

```bash
# Export data
mongoexport --uri="$MONGODB_URI" --db=apix_pap --collection=paps \
  --out=paps_backup.json

# Import data
mongoimport --uri="$MONGODB_URI" --db=apix_pap --collection=paps \
  --file=paps_backup.json
```

---

## 📞 Custom Domain (Optional)

### Add Custom Domain

1. Railway Dashboard → Settings → Custom Domains
2. Add your domain (e.g., api.apix-pap.sn)
3. Follow DNS configuration
4. Verify: https://api.apix-pap.sn/health

### DNS Configuration

Example for Namecheap:

```
Host: api
Type: CNAME
Value: cname.railway.app
```

---

## 🎯 Production Checklist

- [ ] Project imported on Railway
- [ ] MongoDB service added
- [ ] Environment variables set
- [ ] NODE_ENV = production
- [ ] JWT_SECRET = 32+ chars
- [ ] CORS_ORIGIN = frontend URL
- [ ] Auto-deploy enabled
- [ ] Database seeded (50 PAPs + 150 Biens)
- [ ] Health check works
- [ ] API endpoints tested
- [ ] Logs monitoring set up
- [ ] Alerts configured (if Premium)
- [ ] Backups enabled
- [ ] Frontend updated with backend URL

---

## 📊 Performance Baseline

Expected metrics:

```
Response time:  < 200ms (average)
P95:           < 500ms
Error rate:    < 1%
Uptime:        99.5%+
Cold start:    ~30s (Hobby), <5s (Premium)
```

---

## 💰 Cost

### Free/Hobby Tier

```
- $5 credit/month (free)
- Good for development
- Public endpoints OK
- No SLA guarantee
```

### Pro Tier

```
- $20/month subscription
- Keep instances warm
- Priority support
- Email notifications
```

**For production**, recommend **Pro Tier**.

---

## 🚀 Deployment Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Create Railway account | 2 min |
| 2 | Import GitHub repo | 1 min |
| 3 | Add MongoDB | 1 min |
| 4 | Set environment vars | 2 min |
| 5 | Deploy (auto) | 3-5 min |
| 6 | Seed database | 1 min |
| 7 | Verify endpoints | 2 min |
| **Total** | | **~12 min** |

---

## ✨ What's Next

1. ✅ Backend deployed on Railway
2. → Frontend deployed on Vercel
3. → Connect backend URL to Vercel env vars
4. → Run end-to-end tests
5. → Go live!

---

## 📚 Resources

- **Railway Docs**: https://docs.railway.app
- **MongoDB**: https://docs.railway.app/guides/databases/mongodb
- **Environment Variables**: https://docs.railway.app/develop/variables
- **Deployments**: https://docs.railway.app/deploy/deployments

---

## 🎉 Status

✅ Backend ready for Railway deployment!

**Next**: Deploy frontend to Vercel (see DEPLOY_VERCEL.md)

**Contact**: mamadouastelwane@gmail.com
