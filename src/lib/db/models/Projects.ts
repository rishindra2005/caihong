// Schema for projects with:
// - File structure
// - Collaboration settings
// - Project metadata

import { Schema, model, models } from 'mongoose';

const projectSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  projectPath: { type: String, default: '' },
  size: { type: Number, default: 0 }, // Size in bytes
  storageLimit: { type: Number, default: 52428800 }, // 50MB in bytes
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // Project settings and metadata can be added here
  settings: {
    type: Map,
    of: Schema.Types.Mixed,
    default: () => {
      const map = new Map();
      map.set('gitEnabled', true);
      map.set('autoCommitAfterInactivity', 60000); // 60 seconds in milliseconds
      return map;
    }
  }
});

// Add middleware to update the updatedAt timestamp
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Project = models.Project || model('Project', projectSchema);

export default Project;



