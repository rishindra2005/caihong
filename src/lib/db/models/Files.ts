// Schema for files with:
// - Content
// - File type
// - Version history
// - AI chat history

import { Schema, model, models } from 'mongoose';

const fileSchema = new Schema({
  name: { type: String, required: true },
  content: { type: String, default: '' },
  type: { type: String, required: true }, // 'file' or 'directory'
  path: { type: String, required: true },
  parent: { type: Schema.Types.ObjectId, ref: 'File' },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  metadata: {
    lastCompiled: Date,
    compilationLogs: [String],
    aiChats: [{
      timestamp: Date,
      message: String,
      response: String,
      creditsUsed: Number
    }]
  }
}, { timestamps: true });

// Add indexes for faster querying
fileSchema.index({ project: 1, path: 1 }, { unique: true });

const File = models.File || model('File', fileSchema);

export default File;




