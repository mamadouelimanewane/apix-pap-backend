import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    paymentCode: {
      type: String,
      unique: true,
      required: true
    },
    compensationCode: {
      type: String,
      ref: 'Compensation',
      required: true
    },
    papCode: {
      type: String,
      ref: 'PAP',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['wave', 'orangemoney', 'virementbancaire', 'cheque', 'espece'],
      required: true
    },
    status: {
      type: String,
      enum: ['initiated', 'confirmed', 'completed', 'failed'],
      default: 'initiated'
    },
    initiationDate: Date,
    confirmationDate: Date,
    completionDate: Date,
    reference: String,
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

PaymentSchema.index({ papCode: 1, status: 1 });

export default mongoose.model('Payment', PaymentSchema);
