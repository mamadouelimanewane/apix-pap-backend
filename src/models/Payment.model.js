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
PaymentSchema.index({ compensationCode: 1 });
PaymentSchema.index({ status: 1, completionDate: -1 });

PaymentSchema.pre('save', async function (next) {
  if (!this.paymentCode) {
    const count = await this.constructor.countDocuments({ papCode: this.papCode });
    this.paymentCode = `PAY-${this.papCode}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('Payment', PaymentSchema);
