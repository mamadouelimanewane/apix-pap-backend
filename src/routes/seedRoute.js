import express from 'express';
import PAP from '../models/PAP.model.js';
import Bien from '../models/Bien.model.js';
import Evaluation from '../models/Evaluation.model.js';
import Compensation from '../models/Compensation.model.js';
import Payment from '../models/Payment.model.js';

const router = express.Router();

const papsData = [
  { nom: 'Diallo', prenom: 'Mamadou', email: 'mamadou.diallo@example.sn', telephone: '+221771234567', adresse: 'Pikine, Dakar' },
  { nom: 'Ba', prenom: 'Fatou', email: 'fatou.ba@example.sn', telephone: '+221772345678', adresse: 'Rufisque, Dakar' },
  { nom: 'Sow', prenom: 'Amadou', email: 'amadou.sow@example.sn', telephone: '+221773456789', adresse: 'Guédiawaye, Dakar' },
  { nom: 'Sy', prenom: 'Aïssatou', email: 'aissatou.sy@example.sn', telephone: '+221774567890', adresse: 'Yeumbeul, Dakar' },
  { nom: 'Ndiaye', prenom: 'Moussa', email: 'moussa.ndiaye@example.sn', telephone: '+221775678901', adresse: 'Grand-Yoff, Dakar' },
  { nom: 'Sarr', prenom: 'Miriam', email: 'miriam.sarr@example.sn', telephone: '+221776789012', adresse: 'Plateau, Dakar' },
  { nom: 'Toure', prenom: 'Ibrahim', email: 'ibrahim.toure@example.sn', telephone: '+221777890123', adresse: 'HLM, Dakar' },
  { nom: 'Cisse', prenom: 'Mariam', email: 'mariam.cisse@example.sn', telephone: '+221778901234', adresse: 'Medina, Dakar' },
  { nom: 'Kane', prenom: 'Ousmane', email: 'ousmane.kane@example.sn', telephone: '+221779012345', adresse: 'Sacré-Cœur, Dakar' },
  { nom: 'Fall', prenom: 'Awa', email: 'awa.fall@example.sn', telephone: '+221780123456', adresse: 'Fann, Dakar' }
];

const biensData = [
  { type: 'Terrain', superficie: 500, localisation: 'Pikine', gps_lat: 14.7600, gps_lng: -17.1700 },
  { type: 'Maison', superficie: 250, localisation: 'Pikine', gps_lat: 14.7610, gps_lng: -17.1710 },
  { type: 'Commerce', superficie: 80, localisation: 'Pikine', gps_lat: 14.7620, gps_lng: -17.1720 },
  { type: 'Terrain', superficie: 1000, localisation: 'Rufisque', gps_lat: 14.7167, gps_lng: -17.2667 },
  { type: 'Maison', superficie: 400, localisation: 'Guédiawaye', gps_lat: 14.7500, gps_lng: -17.3000 },
  { type: 'Cultures', superficie: 2000, localisation: 'Guédiawaye', gps_lat: 14.7510, gps_lng: -17.3010 },
];

const montantsEvaluation = [
  2500000, 5000000, 10000000, 7500000, 15000000, 3000000, 8000000, 12000000, 6000000, 9000000
];

// Seed endpoint - accessible to anyone for demo purposes
router.post('/seed-demo', async (req, res) => {
  try {
    console.log('🌱 Starting database seeding via API...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      PAP.deleteMany({}),
      Bien.deleteMany({}),
      Evaluation.deleteMany({}),
      Compensation.deleteMany({}),
      Payment.deleteMany({})
    ]);

    // Create PAPs
    console.log('👥 Creating PAPs...');
    const paps = await PAP.insertMany(
      papsData.map(pap => ({
        ...pap,
        code_pap: `PAP-${String(Math.random()).substring(2, 8).toUpperCase()}`,
        statut: 'Enregistré',
        phase: 'Registration'
      }))
    );

    // Create Biens
    console.log('🏠 Creating Biens...');
    const biens = [];
    for (let i = 0; i < paps.length; i++) {
      const papBiens = biensData.slice(i % biensData.length, (i % biensData.length) + (i % 3 + 1));
      for (const bien of papBiens) {
        const createdBien = await Bien.create({
          ...bien,
          pap_id: paps[i]._id,
          pap_nom: paps[i].nom,
          pap_prenom: paps[i].prenom,
          code_pap: paps[i].code_pap,
          code_bien: `BIEN-${String(Math.random()).substring(2, 8).toUpperCase()}`,
          montant_initial: montantsEvaluation[Math.floor(Math.random() * montantsEvaluation.length)],
          statut: 'Évalué',
          phase: 'Evaluation'
        });
        biens.push(createdBien);
      }
    }

    // Create Evaluations
    console.log('📊 Creating Evaluations...');
    const evaluations = [];
    for (const bien of biens) {
      const evaluation = await Evaluation.create({
        bien_id: bien._id,
        pap_id: bien.pap_id,
        type_bien: bien.type_bien,
        superficie: bien.superficie,
        montant_evalue: bien.montant_initial,
        montant_homologation: bien.montant_initial * (0.9 + Math.random() * 0.2),
        etat_bien: ['Bon', 'Moyen', 'Mauvais'][Math.floor(Math.random() * 3)],
        photos: [`photo-${bien.id}-1.jpg`, `photo-${bien.id}-2.jpg`],
        date_evaluation: new Date(),
        statut: 'Approuvé',
        phase: 'Evaluation'
      });
      evaluations.push(evaluation);
    }

    // Create Compensations
    console.log('💰 Creating Compensations...');
    const compensations = [];
    for (let i = 0; i < evaluations.length; i++) {
      const evalItem = evaluations[i];
      const compensation = await Compensation.create({
        bien_id: evalItem.bien_id,
        pap_id: evalItem.pap_id,
        montant_homologation: evalItem.montant_homologation,
        montant_propose: evalItem.montant_homologation * 0.95,
        montant_approuve: evalItem.montant_homologation * 0.95,
        justification: 'Montant évalué et homologué selon barème APIX',
        date_proposition: new Date(),
        date_approbation: new Date(),
        statut: 'Approuvé',
        phase: 'Compensation'
      });
      compensations.push(compensation);
    }

    // Create Payments
    console.log('💳 Creating Payments...');
    const modes = ['Wave', 'Orange Money', 'Banque', 'Espèces', 'Cheque'];
    const payments = [];
    for (let i = 0; i < compensations.length; i++) {
      const comp = compensations[i];
      const payment = await Payment.create({
        bien_id: comp.bien_id,
        pap_id: comp.pap_id,
        montant: comp.montant_approuve,
        montant_verse: comp.montant_approuve,
        mode_paiement: modes[Math.floor(Math.random() * modes.length)],
        date_initiation: new Date(),
        date_execution: new Date(),
        reference_transaction: `REF-${String(Math.random()).substring(2, 12).toUpperCase()}`,
        statut: i % 5 === 0 ? 'En attente' : 'Complété',
        phase: 'Payment'
      });
      payments.push(payment);
    }

    // Return summary
    res.json({
      success: true,
      message: 'Données de démonstration créées avec succès',
      data: {
        paps: paps.length,
        biens: biens.length,
        evaluations: evaluations.length,
        compensations: compensations.length,
        payments: payments.length
      }
    });
  } catch (error) {
    console.error('❌ Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
