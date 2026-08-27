import mongoose from 'mongoose';

const PAPSchema = new mongoose.Schema(
  {
    papCode: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    nom: String,
    prenom: String,
    fullName: {
      type: String,
      get() {
        return `${this.prenom} ${this.nom}`;
      }
    },
    dateNaissance: Date,
    email: String,
    telephone: String,
    adresse: String,
    zone: String,
    secteur: String,
    numberOfProperties: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['registered', 'documented', 'properties_listed', 'evaluated', 'compensated', 'paid', 'closed'],
      default: 'registered'
    },
    workflowPhase: {
      type: Number,
      default: 1,
      min: 1,
      max: 6
    },
    estimatedCompensation: {
      type: Number,
      default: 0
    },
    actualCompensation: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'initiated', 'confirmed', 'completed'],
      default: 'pending'
    },
    paymentMethod: String,
    paymentDate: Date,
    notes: String,
    documents: [{
      type: String,
      url: String,
      uploadedAt: Date
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { getters: true }
  }
);

// Index for common queries
PAPSchema.index({ zone: 1, status: 1 });
PAPSchema.index({ workflowPhase: 1 });
PAPSchema.index({ createdAt: -1 });

// Auto-increment papCode if not provided
PAPSchema.pre('save', async function (next) {
  if (!this.papCode) {
    const count = await this.constructor.countDocuments();
    this.papCode = `PAP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('PAP', PAPSchema);
