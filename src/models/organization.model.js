import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: false
    },
    allowGroupCreation: {
      type: Boolean,
      default: true
    },
    requireAdminApproval: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes
organizationSchema.index({ name: 'text', description: 'text' });

// Methods
organizationSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

organizationSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member && member.role === 'admin';
};

organizationSchema.methods.addMember = function(userId, role = 'member') {
  if (!this.isMember(userId)) {
    this.members.push({ user: userId, role });
  }
};

organizationSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
};

export default mongoose.model('Organization', organizationSchema);
