import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  User, 
  BookOpen, 
  CreditCard, 
  UploadCloud,
  ChevronDown
} from 'lucide-react';

// --- CONFIGURATION DES ÉTAPES ---
const FORM_STEPS = [
  {
    id: 'identity',
    title: 'Identité Personnelle',
    icon: User,
    subSections: [
      { id: 'civil', label: 'État Civil' },
      { id: 'birth', label: 'Naissance & Divers' },
      { id: 'contact', label: 'Contact d\'urgence' }
    ]
  },
  {
    id: 'academic',
    title: 'Données Académiques',
    icon: BookOpen,
    subSections: [
      { id: 'affectation', label: 'Affectation' },
      { id: 'registration', label: 'Immatriculation' }
    ]
  },
  {
    id: 'card',
    title: 'Carte & Finalisation',
    icon: CreditCard,
    subSections: [
      { id: 'photo', label: 'Photo d\'identité' },
      { id: 'validity', label: 'Validité' }
    ]
  }
];

// --- COMPOSANT PRINCIPAL ---
export default function AddStudentForm() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSubSection, setActiveSubSection] = useState(FORM_STEPS[0].subSections[0].id);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      identity: {
        lastName: '', postName: '', firstName: '',
        dateOfBirth: '', placeOfBirth: '', gender: 'M', bloodGroup: '', parentPhone: ''
      },
      academic: {
        matricule: '', section: 'Supérieur', className: '', option: '', academicYear: '2025-2026'
      },
      card: {
        photoUrl: '', expiryDate: ''
      }
    }
  });

  const currentStep = FORM_STEPS[currentStepIndex];

  const handleNextStep = () => {
    if (currentStepIndex < FORM_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setActiveSubSection(FORM_STEPS[currentStepIndex + 1].subSections[0].id);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setActiveSubSection(FORM_STEPS[currentStepIndex - 1].subSections[0].id);
    }
  };

  const onSubmit = (data) => {
    const payload = {
      ...data,
      schoolId: "ID_ETABLISSEMENT_A_INJECTER",
      card: {
        ...data.card,
        qrCode: `QR-${data.academic.matricule}-${Date.now()}`,
        status: 'active'
      }
    };
    console.log("Données prêtes pour le backend :", payload);
  };

  return (
    // Suppression du background global. Le composant s'adapte maintenant à son parent.
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* EN-TÊTE : NAVIGATION SUPÉRIEURE (Top Tabs façon Teero) */}
      <div className="bg-white border-b border-slate-200 flex items-center px-4 overflow-x-auto">
        {FORM_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          
          return (
            <React.Fragment key={step.id}>
              <button 
                onClick={() => {
                  setCurrentStepIndex(index);
                  setActiveSubSection(FORM_STEPS[index].subSections[0].id);
                }}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all border-b-2 -mb-[1px]
                  ${isActive 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    {index + 1}
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px]">
                    {index + 1}
                  </div>
                )}
                {step.title}
              </button>
              {index < FORM_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-2" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* CORPS PRINCIPAL : SIDEBAR & CONTENU */}
      <div className="flex flex-1 min-h-[550px]">
        
        {/* BARRE LATÉRALE (Sous-sections avec "Active Blue") */}
        <div className="w-64 bg-slate-50/50 border-r border-slate-200 p-5 space-y-2.5">
          {currentStep.subSections.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubSection(sub.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-between border
                ${activeSubSection === sub.id 
                  ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' 
                  : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              {sub.label}
              {activeSubSection === sub.id && (
                <ChevronRight className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* ZONE DE FORMULAIRE (Droite) */}
        <div className="flex-1 p-8 bg-white overflow-y-auto">
          <form id="add-student-form" onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSubSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="max-w-2xl space-y-6"
              >
                
                {/* --- ÉTAPE 1 : IDENTITÉ --- */}
                {activeSubSection === 'civil' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">État Civil</h3>
                    <div className="grid grid-cols-2 gap-5">
                      <InputField label="Nom" {...register('identity.lastName', { required: true })} />
                      <InputField label="Postnom" {...register('identity.postName', { required: true })} />
                      <InputField label="Prénom" {...register('identity.firstName', { required: true })} />
                      <SelectField label="Genre" {...register('identity.gender')}>
                        <option value="M">Masculin (M)</option>
                        <option value="F">Féminin (F)</option>
                      </SelectField>
                    </div>
                  </div>
                )}

                {activeSubSection === 'birth' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Naissance & Divers</h3>
                    <div className="grid grid-cols-2 gap-5">
                      <InputField label="Date de naissance" type="date" {...register('identity.dateOfBirth', { required: true })} />
                      <InputField label="Lieu de naissance" {...register('identity.placeOfBirth')} />
                      <SelectField label="Groupe Sanguin" {...register('identity.bloodGroup')}>
                        <option value="">Non spécifié</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </SelectField>
                    </div>
                  </div>
                )}

                {activeSubSection === 'contact' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Contact</h3>
                    <InputField 
                      label="Téléphone du parent / tuteur" 
                      placeholder="Ex: +243 81 000 0000"
                      {...register('identity.parentPhone')} 
                    />
                  </div>
                )}

                {/* --- ÉTAPE 2 : ACADÉMIQUE --- */}
                {activeSubSection === 'affectation' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Affectation</h3>
                    <div className="grid grid-cols-2 gap-5">
                      <SelectField label="Section" {...register('academic.section')}>
                        {['Maternelle', 'Primaire', 'Secondaire', 'Humanités', 'Supérieur'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </SelectField>
                      <InputField label="Classe / Promotion" placeholder="Ex: G3, L2, 6ème" {...register('academic.className', { required: true })} />
                      <div className="col-span-2">
                        <InputField label="Option / Filière" placeholder="Ex: Génie Logiciel" {...register('academic.option')} />
                      </div>
                    </div>
                  </div>
                )}

                {activeSubSection === 'registration' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Immatriculation</h3>
                    <div className="grid grid-cols-2 gap-5">
                      <InputField 
                        label="Matricule" 
                        placeholder="Sera converti en majuscules"
                        {...register('academic.matricule', { required: true })} 
                        className="uppercase font-mono"
                      />
                      <InputField label="Année Académique" placeholder="2025-2026" {...register('academic.academicYear', { required: true })} />
                    </div>
                  </div>
                )}

                {/* --- ÉTAPE 3 : CARTE --- */}
                {activeSubSection === 'photo' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Photo d'identité</h3>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-slate-500 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-colors cursor-pointer group">
                      <UploadCloud className="w-10 h-10 mb-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">Cliquez pour uploader une photo</p>
                      <p className="text-xs mt-1 text-slate-500">PNG, JPG jusqu'à 5MB</p>
                      <input type="text" placeholder="URL temporaire de la photo" className="mt-4 w-full max-w-xs text-xs p-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-500" {...register('card.photoUrl', { required: true })} />
                    </div>
                  </div>
                )}

                {activeSubSection === 'validity' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Validité de la carte</h3>
                    <InputField label="Date d'expiration" type="date" {...register('card.expiryDate', { required: true })} />
                    
                    <div className="bg-blue-50/80 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm flex gap-3 mt-6">
                      <Circle className="w-5 h-5 shrink-0 text-blue-500" />
                      <p className="font-medium">Le QR Code de vérification et la date d'émission seront générés automatiquement à la soumission du formulaire.</p>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </form>
        </div>
      </div>

      {/* PIED DE PAGE : ACTIONS */}
      <div className="bg-slate-50/80 border-t border-slate-200 p-5 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-white border border-slate-300 shadow-sm hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Retour
        </button>
        
        {currentStepIndex < FORM_STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
          >
            Étape suivante : {FORM_STEPS[currentStepIndex + 1].title}
          </button>
        ) : (
          <button
            type="submit"
            form="add-student-form"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Enregistrer l'étudiant
          </button>
        )}
      </div>

    </div>
  );
}

// --- SOUS-COMPOSANTS UI ---

const InputField = React.forwardRef(({ label, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input
      ref={ref}
      className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm ${className}`}
      {...props}
    />
  </div>
));
InputField.displayName = 'InputField';

const SelectField = React.forwardRef(({ label, children, ...props }, ref) => (
  <div className="flex flex-col gap-1.5 relative">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <select
        ref={ref}
        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  </div>
));
SelectField.displayName = 'SelectField';