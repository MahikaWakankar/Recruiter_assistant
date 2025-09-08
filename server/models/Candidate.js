import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      trim: true,
      maxlength: 100
    },
    email: { 
      type: String, 
      trim: true, 
      index: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: { 
      type: String, 
      trim: true,
      maxlength: 20
    },
    sourceFile: { 
      type: String, 
      required: true,
      trim: true
    },
    status: { 
      type: String, 
      enum: ['new', 'emailed', 'invalid', 'responded'], 
      default: 'new' 
    },
    notes: { 
      type: String,
      maxlength: 500
    },
    emailSentAt: {
      type: Date
    }
  },
  { 
    timestamps: true
  }
);

CandidateSchema.index({ email: 1 }, { sparse: true });
CandidateSchema.index({ status: 1 });
CandidateSchema.index({ sourceFile: 1 }, { unique: true });

export default mongoose.model('Candidate', CandidateSchema);