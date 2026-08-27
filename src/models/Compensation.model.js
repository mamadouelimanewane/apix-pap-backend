import mongoose from 'mongoose';

const CompensationSchema = new mongoose.Schema(
  {
    compensationCode: {
      type: String,
      unique: true,
      required: true
    },
    papCode: {
      type: String,
      ref: 'PAP',
      required: true
    },
    bienCode: {
      type: String,
      ref: 'Bien',
      required: true
    },
    evaluatedValue: Number,
    proposedAmount: {
      type: Number,
      required: true
    },
    approvedAmount: Number,
    currency: {
      type: String,
      default: 'XOF'
    },
    status: {
      type: String,
      enum: ['proposed', 'reviewed', 'approved', 'rejected', 'paid'],
      default: 'proposed'
    },
    proposalDate: Date,
    reviewDate: Date,
    approvalDate: Date,
    reviewedBy: String,
    approvedBy: String,
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

CompensationSchema.index({ papCode: 1, status: 1 });

export default mongoose.model('Compensation', CompensationSchema);
