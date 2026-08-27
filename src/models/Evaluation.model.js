import mongoose from 'mongoose';

const EvaluationSchema = new mongoose.Schema(
  {
    evaluationCode: {
      type: String,
      unique: true,
      required: true
    },
    bienCode: {
      type: String,
      ref: 'Bien',
      required: true
    },
    papCode: {
      type: String,
      ref: 'PAP',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    evaluator: String,
    estimatedValue: {
      type: Number,
      required: true
    },
    condition: {
      type: String,
      enum: ['bon', 'moyen', 'mauvais'],
      required: true
    },
    details: String,
    photos: [String],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: String,
    approvalDate: Date,
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

EvaluationSchema.index({ papCode: 1, bienCode: 1 });

export default mongoose.model('Evaluation', EvaluationSchema);
