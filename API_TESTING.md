# Guide de Test API - APIX-PAP Backend

## 🔐 Authentification

Tous les endpoints requièrent une authentification JWT.

### 1. Obtenir un Token

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@apix.sn",
    "password": "password"
  }' | jq -r '.token')

echo $TOKEN
```

**Utilisateurs de Test:**
- Admin: admin@apix.sn / password
- Chef Projet: chef@apix.sn / password  
- Gestionnaire: gestionnaire@apix.sn / password
- Agent Terrain: agent@apix.sn / password

---

## 📋 Endpoints PAP (Affectés par la Terre)

### Lister PAPs

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/pap/list?page=1&limit=10"
```

### Chercher PAP

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/pap/search?q=Diallo"
```

### Obtenir PAP par Code

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/pap/PAP-2024-00001"
```

### Créer un nouveau PAP

```bash
curl -X POST http://localhost:3000/api/pap/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Diallo",
    "prenom": "Jean",
    "zone": "Zone A",
    "secteur": "Agriculture",
    "email": "jean.diallo@example.com",
    "telephone": "+221771234567",
    "adresse": "Rue de la Paix, Zone A",
    "dateNaissance": "1970-05-15"
  }'
```

### Mettre à jour PAP

```bash
curl -X PUT http://localhost:3000/api/pap/PAP-2024-00001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Zone B",
    "status": "documented",
    "notes": "PAP relocalisé"
  }'
```

### Statistiques PAP

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/pap/stats"
```

---

## 🏠 Endpoints Bien (Propriété)

### Lister Biens d'un PAP

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/bien/list/PAP-2024-00001?page=1&limit=10"
```

### Créer un Bien

```bash
curl -X POST http://localhost:3000/api/bien/create/PAP-2024-00001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "maison",
    "adresse": "Rue du Commerce, Zone A",
    "zone": "Zone A",
    "superficie": 250,
    "description": "Maison résidentielle, 2 étages",
    "photos": ["photo1.jpg", "photo2.jpg"]
  }'
```

### Obtenir Bien

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/bien/BIEN-PAP-2024-00001-001"
```

### Mettre à jour Bien

```bash
curl -X PUT http://localhost:3000/api/bien/BIEN-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "superficie": 260,
    "description": "Maison rénovée"
  }'
```

### Statistiques Bien d'un PAP

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/bien/stats/PAP-2024-00001"
```

---

## 📊 Endpoints Évaluation

### Lister Évaluations d'un PAP

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/evaluation/list/PAP-2024-00001"
```

### Créer Évaluation pour un Bien

```bash
curl -X POST http://localhost:3000/api/evaluation/create/PAP-2024-00001/BIEN-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estimatedValue": 15000000,
    "condition": "bon",
    "evaluator": "Jean Dupont",
    "details": "Évaluation terrain en très bon état",
    "photos": ["eval1.jpg", "eval2.jpg"]
  }'
```

### Approuver Évaluation

```bash
curl -X POST http://localhost:3000/api/evaluation/approve/EVAL-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Évaluation approuvée par le comité"
  }'
```

### Rejeter Évaluation

```bash
curl -X POST http://localhost:3000/api/evaluation/reject/EVAL-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Dossier incomplet, réévaluation requise"
  }'
```

### Statistiques Évaluations

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/evaluation/stats/PAP-2024-00001"
```

---

## 💰 Endpoints Compensation

### Lister Compensations d'un PAP

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/compensation/list/PAP-2024-00001"
```

### Proposer Compensation pour un Bien

```bash
curl -X POST http://localhost:3000/api/compensation/propose/PAP-2024-00001/BIEN-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proposedAmount": 14500000,
    "notes": "Compensation proposée après évaluation"
  }'
```

### Examiner Compensation

```bash
curl -X POST http://localhost:3000/api/compensation/review/COMP-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedAmount": 14500000,
    "notes": "Compensation acceptable selon normes"
  }'
```

### Approuver Compensation

```bash
curl -X POST http://localhost:3000/api/compensation/approve/COMP-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approvedAmount": 14500000,
    "notes": "Approuvée par l'administrateur"
  }'
```

### Rejeter Compensation

```bash
curl -X POST http://localhost:3000/api/compensation/reject/COMP-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Dépassement du budget alloué"
  }'
```

### Statistiques Compensations

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/compensation/stats/PAP-2024-00001"
```

---

## 💳 Endpoints Paiement

### Lister Paiements d'un PAP

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/payment/list/PAP-2024-00001?status=completed"
```

### Initier Paiement pour Compensation

```bash
curl -X POST http://localhost:3000/api/payment/initiate/PAP-2024-00001/COMP-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 14500000,
    "paymentMethod": "wave",
    "reference": "WAVE-2024-001234",
    "notes": "Paiement Wave initié"
  }'
```

### Confirmer Paiement

```bash
curl -X POST http://localhost:3000/api/payment/confirm/PAY-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "WAVE-2024-001234",
    "notes": "Paiement confirmé par Wave"
  }'
```

### Finaliser Paiement

```bash
curl -X POST http://localhost:3000/api/payment/complete/PAY-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Paiement finalisé avec succès"
  }'
```

### Échouer Paiement

```bash
curl -X POST http://localhost:3000/api/payment/fail/PAY-PAP-2024-00001-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Erreur de paiement: compte utilisateur bloqué"
  }'
```

### Statistiques Paiements

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/payment/stats/PAP-2024-00001"
```

---

## 🔄 Workflow Complet - Exemple

Voici un workflow complet du début à la fin:

```bash
#!/bin/bash

# 1. Authentification
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@apix.sn",
    "password": "password"
  }' | jq -r '.token')

# 2. Créer PAP
PAP=$(curl -s -X POST http://localhost:3000/api/pap/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Ba",
    "prenom": "Marie",
    "zone": "Zone A",
    "secteur": "Résidentiel"
  }' | jq -r '.data.papCode')

echo "PAP créé: $PAP"

# 3. Créer Bien
BIEN=$(curl -s -X POST http://localhost:3000/api/bien/create/$PAP \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "terrain",
    "adresse": "Rue Test",
    "superficie": 500
  }' | jq -r '.data.bienCode')

echo "Bien créé: $BIEN"

# 4. Créer Évaluation
EVAL=$(curl -s -X POST http://localhost:3000/api/evaluation/create/$PAP/$BIEN \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estimatedValue": 12000000,
    "condition": "bon",
    "evaluator": "Évaluateur Test"
  }' | jq -r '.data.evaluationCode')

echo "Évaluation créée: $EVAL"

# 5. Approuver Évaluation
curl -s -X POST http://localhost:3000/api/evaluation/approve/$EVAL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# 6. Proposer Compensation
COMP=$(curl -s -X POST http://localhost:3000/api/compensation/propose/$PAP/$BIEN \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proposedAmount": 12000000
  }' | jq -r '.data.compensationCode')

echo "Compensation proposée: $COMP"

# 7. Approuver Compensation
curl -s -X POST http://localhost:3000/api/compensation/approve/$COMP \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approvedAmount": 12000000
  }' | jq .

# 8. Initier Paiement
PAY=$(curl -s -X POST http://localhost:3000/api/payment/initiate/$PAP/$COMP \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 12000000,
    "paymentMethod": "wave"
  }' | jq -r '.data.paymentCode')

echo "Paiement initié: $PAY"

# 9. Finaliser Paiement
curl -s -X POST http://localhost:3000/api/payment/complete/$PAY \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

echo "Workflow complet exécuté!"
```

---

## 🧪 Avec Postman

1. **Importer collection** (à créer en JSON)
2. **Configurer variable d'environnement:**
   - `base_url` = `http://localhost:3000`
   - `token` = token reçu via POST /auth/login
3. **Utiliser templating** pour chaîner les requêtes:
   ```
   {{base_url}}/api/pap/{{papCode}}
   ```
4. **Tests automatisés** pour vérifier statuts et réponses

---

## 🔍 Codes d'Erreur

| Code | Signification |
|------|---|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Erreur de validation |
| 401 | Non authentifié |
| 403 | Accès refusé (rôle) |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## 📝 Notes d'Implémentation

- Tous les codes (PAP, BIEN, EVAL, COMP, PAY) sont **auto-générés**
- Les transitions de statut sont **validées** (ex: impossible de payer une compensation non approuvée)
- Les **audits** tracent qui a créé/modifié chaque ressource
- Les **statistiques** utilisent MongoDB aggregation pipeline pour performance
- Les **paiements** soutiennent 5 méthodes: Wave, OrangeMoney, Virement, Chèque, Espèce
