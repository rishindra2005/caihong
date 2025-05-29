import mongoose, { Schema } from 'mongoose';

const creditHistorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  beforeBalance: {
    type: Number,
    required: true
  },
  afterBalance: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  action: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.models.CreditHistory || mongoose.model('CreditHistory', creditHistorySchema); 