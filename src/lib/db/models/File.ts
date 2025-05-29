import mongoose, { Schema } from 'mongoose';

const fileSchema = new Schema({
  name: { type: String, required: true },
  content: { 
    type: String, 
    default: '',
    validate: {
      validator: function(this: any) {
        // Only require content for files, not directories
        return this.type !== 'file' || (this.type === 'file' && this.content !== undefined);
      },
      message: 'Content is required for files'
    }
  },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  parent: { type: Schema.Types.ObjectId, ref: 'File', default: null },
  type: { type: String, enum: ['file', 'directory'], required: true },
  path: { type: String, required: true },
  children: [{ type: Schema.Types.ObjectId, ref: 'File' }]
}, { timestamps: true });

const File = mongoose.models.File || mongoose.model('File', fileSchema);

export default File; 