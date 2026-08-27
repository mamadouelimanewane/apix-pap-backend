# APIX-PAP Backend API

Backend Node.js/Express pour la plateforme APIX-PAP (Gestion des Personnes Affectées par les Projets).

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start MongoDB (if not running)
mongod

# Run development server
npm run dev

# Run production server
npm start
```

### Environment Setup

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/apix_pap
JWT_SECRET=your_secret_key_here
CORS_ORIGIN=http://localhost:5173
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - Logout user

### PAP Management
- `GET /api/pap/list` - List all PAPs with filters
- `GET /api/pap/:papCode` - Get PAP details
- `POST /api/pap/create` - Create new PAP
- `PUT /api/pap/:papCode` - Update PAP
- `GET /api/pap/search` - Search PAPs

### Properties (Biens)
- `GET /api/bien/list/:papCode` - List properties for PAP
- `GET /api/bien/:bienCode` - Get property details
- `POST /api/bien/create/:papCode` - Create property
- `PUT /api/bien/:bienCode` - Update property

### Evaluations
- `POST /api/evaluation/create/:bienCode` - Create evaluation
- `GET /api/evaluation/list` - List evaluations

### Compensation
- `POST /api/compensation/submit/:bienCode` - Submit compensation
- `GET /api/compensation/list` - List compensations

### Payments
- `POST /api/payment/initiate/:compensationId` - Initiate payment
- `GET /api/payment/list` - List payments

### Reclamations
- `POST /api/reclamation/create/:papCode` - Create reclamation
- `GET /api/reclamation/list/:papCode` - List reclamations

### Communications
- `GET /api/communications/messages/:papCode` - Get messages
- `GET /api/communications/notifications` - Get notifications

### Workflows
- `POST /api/workflow/create` - Create workflow
- `GET /api/workflow/:papCode` - Get workflow

### Analytics
- `GET /api/analytics/:type` - Get analytics data

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

### Demo Users

```
Email: admin@apix.sn | Password: password | Role: admin
Email: chef@apix.sn | Password: password | Role: chef_projet
Email: gestionnaire@apix.sn | Password: password | Role: gestionnaire
Email: agent@apix.sn | Password: password | Role: agent_terrain
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📦 Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # Mongoose schemas
├── routes/          # API routes
├── controllers/     # Business logic (to be added)
├── services/        # Utility services (to be added)
└── server.js        # Main entry point
```

## 🔗 Frontend Integration

The frontend (React 19 + Vite) is configured to use this API:

```javascript
// .env
VITE_APP_API_URL=http://localhost:3000/api
```

All frontend requests will automatically include the JWT token.

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

## 🛠️ Development

### Project Scripts

```bash
npm run dev              # Start dev server with nodemon
npm start               # Start production server
npm test                # Run tests
npm run test:coverage   # Run tests with coverage
npm run seed            # Seed database with sample data
npm run lint            # Run ESLint
```

### Adding a New Route

1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Import route in `server.js`
4. Add middleware as needed (auth, validation, etc.)

## 🚨 Error Handling

All errors return a standardized JSON response:

```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Error message"
  }
}
```

## 📝 Logging

Request logging is enabled by default:

```
🟢 [200] GET /api/pap/list - 45ms
🔴 [404] GET /api/unknown - 2ms
```

## 🔒 Security Features

- JWT authentication
- Role-based access control (RBAC)
- CORS configuration
- Request validation with Joi
- Secure password hashing with bcryptjs
- Environment variable protection

## 🚀 Deployment

### Vercel

```bash
# Deploy to Vercel
vercel deploy
```

### Docker

```bash
# Build image
docker build -t apix-pap-backend .

# Run container
docker run -p 3000:3000 apix-pap-backend
```

### Cloud Platforms

- **Render.com** - Free Node.js hosting
- **Railway.app** - Simple deployment
- **Heroku** - Traditional PaaS
- **AWS/GCP/Azure** - Enterprise solutions

## 📞 Support

For issues or questions:
- GitHub Issues: [github.com/mamadouelimanewane/apix-pap-backend](https://github.com)
- Email: mamadouastelwane@gmail.com

## 📄 License

MIT License - See LICENSE file for details

---

**Status**: 🚀 Backend scaffolding complete. Ready for full implementation.
