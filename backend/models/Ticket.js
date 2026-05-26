import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['open', 'in_progress', 'resolved', 'closed'],
      message: 'Status must be one of: open, in_progress, resolved, closed'
    },
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: false
});

// Priority to Target Minutes Map
export const getPriorityTargetMinutes = (priority) => {
  switch (priority) {
    case 'urgent': return 60;       // 1 hour
    case 'high': return 240;        // 4 hours
    case 'medium': return 1440;     // 24 hours
    case 'low': return 4320;        // 72 hours
    default: return 0;
  }
};

// Apply transform to dynamically compute derived fields on serialization
ticketSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    const now = new Date();
    const createdAt = new Date(ret.createdAt);
    const resolvedAt = ret.resolvedAt ? new Date(ret.resolvedAt) : null;
    
    // ageMinutes: between createdAt and resolvedAt (if resolved/closed) or now
    const endTime = resolvedAt || now;
    const ageMinutes = Math.floor((endTime - createdAt) / 60000);
    
    // slaBreached: true if ageMinutes > target limit
    const limit = getPriorityTargetMinutes(ret.priority);
    const slaBreached = ageMinutes > limit;

    ret.ageMinutes = ageMinutes < 0 ? 0 : ageMinutes;
    ret.slaBreached = slaBreached;
    
    delete ret.__v;
    return ret;
  }
});

// Configure Schema to also support toObject mapping
ticketSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    const now = new Date();
    const createdAt = new Date(ret.createdAt);
    const resolvedAt = ret.resolvedAt ? new Date(ret.resolvedAt) : null;
    const endTime = resolvedAt || now;
    const ageMinutes = Math.floor((endTime - createdAt) / 60000);
    const limit = getPriorityTargetMinutes(ret.priority);
    const slaBreached = ageMinutes > limit;

    ret.ageMinutes = ageMinutes < 0 ? 0 : ageMinutes;
    ret.slaBreached = slaBreached;
    
    delete ret.__v;
    return ret;
  }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
