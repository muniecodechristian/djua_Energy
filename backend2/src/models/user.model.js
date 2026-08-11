import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Nom is required'],
    trim: true,
  },
  prenom: {
    type: String,
    required: [true, 'Prenom is required'],
    trim: true,
  },
  postNom: {
    type: String,
    trim: true,
    default: '',
  },
  identifier: {
    type: String,
    required: [true, 'Identifier (Email or Phone) is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false, // Do not return password by default in queries
  },
  role: {
    type: String,
    enum: ['administration', 'kitireceveur'],
    default: 'kitireceveur',
    required: [true, 'Role is required'],
  },
}, {
  timestamps: true,
});

// Pre-save hook to hash password
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12); // Use 12 rounds for high security
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
