import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'administration', 'shop_manager', 'technician', 'commercial'],
    default: 'technician',
  },
  name: {
    type: String,
    default: '',
  },
  unreadCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const InstallationConversationSchema = new mongoose.Schema({
  installation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InstallationFolder',
    required: true,
    unique: true,
    index: true,
  },
  folderNumber: {
    type: String,
    trim: true,
    index: true,
  },
  customerName: {
    type: String,
    trim: true,
  },
  participants: [ParticipantSchema],
  lastMessage: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InstallationMessage',
    },
    content: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['text', 'audio', 'image', 'system'],
      default: 'text',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    senderName: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active',
    index: true,
  },
  totalMessages: {
    type: Number,
    default: 0,
    min: 0,
  },
  metadata: {
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    tags: [{ type: String }],
  },
}, {
  timestamps: true,
});

InstallationConversationSchema.index({ 'participants.user': 1 });
InstallationConversationSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model('InstallationConversation', InstallationConversationSchema);
