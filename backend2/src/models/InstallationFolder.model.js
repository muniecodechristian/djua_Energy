import mongoose from 'mongoose';

const ChecklistSchema = new mongoose.Schema({
  solarPanelsMounted: { type: Boolean, default: false },
  wiringChecked: { type: Boolean, default: false },
  inverterTested: { type: Boolean, default: false },
  batteryVoltageMeasured: {
    checked: { type: Boolean, default: false },
    voltage: { type: Number, default: null }
  },
  safetyGrounding: { type: Boolean, default: false },
  iotBoxPaired: { type: Boolean, default: false },
  customerTrainingDone: { type: Boolean, default: false },
  notes: { type: String, trim: true, default: '' },
  completedAt: { type: Date, default: null }
}, { _id: false });

const HistoryEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['a_planifier', 'planifiee', 'en_cours', 'en_attente', 'installee', 'mise_en_service', 'validee'],
    required: true
  },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, trim: true, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const InstallationFolderSchema = new mongoose.Schema({
  folderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  // Référence vers le devis d'origine
  quote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: true,
    index: true
  },
  quoteNumber: {
    type: String,
    required: true,
    index: true
  },
  // Client rattaché
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesClient',
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  site: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Spécifications techniques issues du dimensionnement
  system: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  appliances: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  amount: { type: Number, default: 0 },
  currency: { type: String, enum: ['USD', 'CDF'], default: 'USD' },

  // Gouvernance et rôles
  // L'utilisateur qui a validé le devis et donc initié ce dossier
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  shopManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  zone: {
    type: String,
    trim: true,
    default: '',
    index: true
  },

  // Machine à états : Statut opérationnel du cycle de vie
  status: {
    type: String,
    enum: ['a_planifier', 'planifiee', 'en_cours', 'en_attente', 'installee', 'mise_en_service', 'validee'],
    default: 'a_planifier',
    index: true
  },
  blockedReason: {
    type: String,
    trim: true,
    default: ''
  },

  // Planning & Dates
  plannedDate: {
    type: String, // Format YYYY-MM-DD
    default: ''
  },
  startedAt: { type: Date, default: null },
  installedAt: { type: Date, default: null },
  commissionedAt: { type: Date, default: null },
  validatedAt: { type: Date, default: null },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Matériel IoT & Coordonnées de terrain
  kitId: {
    type: String,
    trim: true,
    default: null,
    index: true
  },
  gpsCoordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    accuracy: { type: Number, default: null }
  },

  // Contrôles de mise en service
  checklist: {
    type: ChecklistSchema,
    default: () => ({})
  },

  // Traçabilité & Audit Trail complet
  history: {
    type: [HistoryEventSchema],
    default: []
  },

  // Photos ou justificatifs terrain
  attachments: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

InstallationFolderSchema.index({ status: 1, createdAt: -1 });
InstallationFolderSchema.index({ assignedTechnician: 1, status: 1 });

export default mongoose.model('InstallationFolder', InstallationFolderSchema);
