import mongoose from 'mongoose';

const InstallationMessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InstallationConversation',
    index: true,
  },
  installation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InstallationFolder',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
  },
  senderRole: {
    type: String,
    enum: ['admin', 'administration', 'shop_manager', 'technician', 'commercial'],
    default: 'technician',
  },
  type: {
    type: String,
    enum: ['text', 'audio', 'image', 'system'],
    default: 'text',
  },
  content: {
    type: String,
    trim: true,
    default: '',
  },
  mediaUrl: {
    type: String, // Base64 data URL or uploaded file URL
    default: null,
  },
  audioDuration: {
    type: Number, // In seconds (e.g. 5.2s)
    default: null,
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
    index: true,
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InstallationMessage',
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

InstallationMessageSchema.index({ installation: 1, createdAt: 1 });
InstallationMessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model('InstallationMessage', InstallationMessageSchema);
