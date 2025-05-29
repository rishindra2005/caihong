import mongoose, { Schema } from 'mongoose';

const wishlistSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  name: { 
    type: String, 
    trim: true 
  },
  signupDate: { 
    type: Date, 
    default: Date.now 
  },
  source: { 
    type: String,
    default: 'landing-page'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  notificationPreferences: {
    type: Map,
    of: Boolean,
    default: () => {
      const map = new Map();
      map.set('launch', true);
      map.set('updates', true);
      return map;
    }
  }
}, { timestamps: true });

// Add index for faster queries
wishlistSchema.index({ email: 1 });
wishlistSchema.index({ status: 1 });

export default mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema); 