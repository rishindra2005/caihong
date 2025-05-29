// Schema for user with:
// - Google OAuth data
// - Credits system
// - Profile information
// - Projects reference

import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  name: String,
  email: String,
  image: String,
  emailVerified: Date,
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  credits: { type: Number, required: true, default: 0 },
  metadata: String,
  accounts: [{
    type: Schema.Types.ObjectId,
    ref: 'Account'
  }],
  sessions: [{
    type: Schema.Types.ObjectId,
    ref: 'Session'
  }],
  projects: [{
    type: Schema.Types.ObjectId,
    ref: 'Project'
  }],
  initialCreditAdded: { type: Boolean, default: false }
}, { timestamps: true });

// Add middleware to create initial credit history
userSchema.post('save', async function(doc) {
  // Only run for new users who haven't had their initial credit added
  if (doc.initialCreditAdded) return;
  
  try {
    const CreditHistory = mongoose.models.CreditHistory || mongoose.model('CreditHistory');
    
    // Create the initial credit history record
    await CreditHistory.create({
      userId: doc._id,
      amount: 100,
      beforeBalance: 0,
      afterBalance: 100,
      description: 'Initial credit bonus',
      timestamp: new Date()
    });
    
    // Mark that the initial credit has been added
    doc.initialCreditAdded = true;
    await doc.save();
  } catch (err) {
    console.error('Error creating initial credit history:', err);
  }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
