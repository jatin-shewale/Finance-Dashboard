import mongoose from 'mongoose';

const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0, 'Amount cannot be negative'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Please specify type (income/expense)'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Please provide a date'],
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query optimization
financialRecordSchema.index({ createdBy: 1 });
financialRecordSchema.index({ date: -1 });
financialRecordSchema.index({ category: 1 });
financialRecordSchema.index({ type: 1 });
financialRecordSchema.index({ createdBy: 1, date: -1 });
financialRecordSchema.index({ isDeleted: 1 });

export default mongoose.model('FinancialRecord', financialRecordSchema);
