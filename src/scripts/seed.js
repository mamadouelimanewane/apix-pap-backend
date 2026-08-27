import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PAP from '../models/PAP.model.js';
import Bien from '../models/Bien.model.js';

dotenv.config();

const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'];
const secteurs = ['Agriculture', 'Commerce', 'Résidentiel', 'Industriel', 'Autre'];

const generatePAPs = (count = 50) => {
  const paps = [];
  const firstNames = ['Jean', 'Marie', 'Ahmed', 'Fatou', 'Mamadou', 'Aïssatou', 'Pierre', 'Hawa'];
  const lastNames = ['Diallo', 'Sow', 'Ba', 'Ndiaye', 'Kone', 'Traore', 'Sarr', 'Fall'];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const zone = zones[Math.floor(Math.random() * zones.length)];

    paps.push({
      papCode: `PAP-2024-${String(i).padStart(5, '0')}`,
      nom: lastName,
      prenom: firstName,
      dateNaissance: new Date(1960 + Math.random() * 50, Math.random() * 12, Math.random() * 28),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      telephone: `+221${String(Math.floor(Math.random() * 999999999)).padStart(9, '0')}`,
      adresse: `Rue ${i}, ${zone}`,
      zone,
      secteur: secteurs[Math.floor(Math.random() * secteurs.length)],
      status: ['registered', 'documented', 'evaluated', 'compensated', 'paid'][
        Math.floor(Math.random() * 5)
      ],
      workflowPhase: Math.ceil(Math.random() * 6),
      estimatedCompensation: Math.floor(Math.random() * 500000),
      actualCompensation: Math.floor(Math.random() * 400000),
      numberOfProperties: Math.ceil(Math.random() * 5),
      createdBy: new mongoose.Types.ObjectId()
    });
  }

  return paps;
};

const generateBiens = async (papCodes) => {
  const biens = [];
  const types = ['maison', 'terrain', 'commerce', 'agricole'];

  for (const papCode of papCodes) {
    const numBiens = Math.ceil(Math.random() * 4);

    for (let i = 1; i <= numBiens; i++) {
      biens.push({
        papCode,
        type: types[Math.floor(Math.random() * types.length)],
        adresse: `Adresse bien ${papCode}-${i}`,
        zone: papCode.split('-')[2] % 5,
        superficie: Math.floor(Math.random() * 2000) + 100,
        description: `Bien résidentiel/agricole`,
        estimatedValue: Math.floor(Math.random() * 10000000),
        status: ['non_evaluated', 'evaluated', 'compensated'][Math.floor(Math.random() * 3)],
        createdBy: new mongoose.Types.ObjectId()
      });
    }
  }

  return biens;
};

const seedDatabase = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apix_pap', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('📦 Connexion MongoDB établie');

    // Effacer les collections existantes
    await PAP.deleteMany({});
    await Bien.deleteMany({});
    console.log('🗑️  Collections nettoyées');

    // Générer et insérer les PAPs
    const paps = generatePAPs(50);
    const insertedPAPs = await PAP.insertMany(paps);
    console.log(`✅ ${insertedPAPs.length} PAPs créés`);

    // Générer et insérer les Biens
    const papCodes = insertedPAPs.map(p => p.papCode);
    const biens = await generateBiens(papCodes);
    const insertedBiens = await Bien.insertMany(biens);
    console.log(`✅ ${insertedBiens.length} Biens créés`);

    // Statistiques
    console.log(`
╔════════════════════════════════════╗
║     📊 Résumé du Seed              ║
╠════════════════════════════════════╣
║  PAPs créés:          ${String(insertedPAPs.length).padEnd(17)}║
║  Biens créés:         ${String(insertedBiens.length).padEnd(17)}║
║  PAPs par zone:       ~10           ║
║  Biens par PAP:       1-4           ║
╚════════════════════════════════════╝
    `);

    // Afficher quelques exemples
    console.log('📋 Exemples de PAPs créés:');
    insertedPAPs.slice(0, 3).forEach(pap => {
      console.log(`  - ${pap.papCode}: ${pap.prenom} ${pap.nom} (${pap.zone})`);
    });

    await mongoose.connection.close();
    console.log('✅ Seed complété avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error.message);
    process.exit(1);
  }
};

// Lancer le seed
seedDatabase();
