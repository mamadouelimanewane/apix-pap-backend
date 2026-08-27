import mongoose from 'mongoose';

const BienSchema = new mongoose.Schema(
  {
    bienCode: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    papCode: {
      type: String,
      ref: 'PAP',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['maison', 'terrain', 'commerce', 'agricole', 'autre'],
      required: true
    },
    adresse: String,
    zone: String,
    superficie: {
      type: Number,
      required: true
    },
    description: String,
    photos: [String], // URLs
    estimatedValue: Number,
    status: {
      type: String,
      enum: ['non_evaluated', 'evaluated', 'rejected', 'compensated'],
      default: 'non_evaluated'
    },
    evaluation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evaluation'
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

BienSchema.index({ papCode: 1, type: 1 });

BienSchema.pre('save', async function (next) {
  if (!this.bienCode) {
    const count = await this.constructor.countDocuments({ papCode: this.papCode });
    this.bienCode = `BIEN-${this.papCode}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('Bien', BienSchema);
