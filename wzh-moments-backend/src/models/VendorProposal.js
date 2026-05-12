import mongoose from 'mongoose';

const vendorProposalSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserRequest',
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    proposal: {
      type: String,
      required: [true, 'Proposal description is required'],
      minlength: [30, 'Proposal must be at least 30 characters'],
      maxlength: [1500, 'Proposal cannot exceed 1500 characters'],
    },
    deliveryTimeline: {
      type: String,
      required: [true, 'Delivery timeline is required'],
      maxlength: [100, 'Timeline cannot exceed 100 characters'],
    },
    portfolioLinks: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

vendorProposalSchema.index({ requestId: 1 });
vendorProposalSchema.index({ vendorId: 1 });
vendorProposalSchema.index({ status: 1 });
vendorProposalSchema.index({ vendorId: 1, requestId: 1 }, { unique: true });

export default mongoose.model('VendorProposal', vendorProposalSchema);
