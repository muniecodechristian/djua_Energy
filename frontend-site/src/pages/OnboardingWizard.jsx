import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CardStyleOnboarding from '../components/CardStyleOnboarding';

// Style d'input réutilisable pour garantir les bordures visibles
const InputField = ({ placeholder, value, onChange, type = "text" }) => (
  <input 
    type={type} 
    placeholder={placeholder} 
    value={value} 
    className="w-full p-5 text-lg rounded-2xl bg-white border-2 border-slate-200 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
    onChange={onChange} 
  />
);

const GeneralInfoStep = ({ data, update }) => (
  <div className="space-y-6 max-w-lg">
    <h2 className="text-3xl font-bold text-slate-900">Identité de l'école</h2>
    <InputField placeholder="Nom de l'école" value={data.name} onChange={(e) => update({ name: e.target.value })} />
    <InputField placeholder="Slug unique" value={data.slug} onChange={(e) => update({ slug: e.target.value })} />
  </div>
);

const OperationsStep = ({ data, update }) => (
  <div className="space-y-6 max-w-lg">
    <h2 className="text-3xl font-bold text-slate-900">Opérations</h2>
    <InputField placeholder="Adresse" value={data.address} onChange={(e) => update({ address: e.target.value })} />
    <InputField placeholder="Téléphone" value={data.phone} onChange={(e) => update({ phone: e.target.value })} />
  </div>
);

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [schoolData, setSchoolData] = useState({ name: '', slug: '', address: '', phone: '', cardTemplate: 'classique' });

  const steps = [
    { title: 'Identité', component: GeneralInfoStep },
    { title: 'Opérations', component: OperationsStep },
    { title: 'Style', component: CardStyleOnboarding },
    { title: 'Final', component: () => <h2 className="text-4xl font-bold">Prêt !</h2> }
  ];

  const updateData = (newData) => setSchoolData({ ...schoolData, ...newData });

  return (
    <div className="h-dvh w-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Sidebar: Fixe en haut sur mobile, à gauche sur desktop */}
      <div className="w-full md:w-[280px] bg-blue-900 p-6 md:p-10 flex md:flex-col justify-between md:justify-center md:space-y-10">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center space-x-4 text-white">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm ${step === i + 1 ? 'bg-white text-blue-900' : 'bg-blue-800'}`}>
              {i + 1}
            </div>
            <span className={`hidden md:block ${step === i + 1 ? 'font-bold' : 'opacity-40'}`}>{s.title}</span>
          </div>
        ))}
      </div>

      {/* Zone Contenu */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 p-8 md:p-16 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              {React.createElement(steps[step - 1].component, { data: schoolData, update: updateData, onSelect: (d) => updateData(d) })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 md:p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <button onClick={() => setStep(s => Math.max(s - 1, 1))} disabled={step === 1} className="flex items-center px-6 py-3 font-bold text-slate-500 disabled:opacity-0 hover:text-slate-900">
            <ChevronLeft className="mr-2" /> Retour
          </button>
          <button onClick={() => step < steps.length ? setStep(s => s + 1) : console.log(schoolData)} className="flex items-center px-8 py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 shadow-lg shadow-blue-200">
            {step === steps.length ? 'Finaliser' : 'Suivant'} <ChevronRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}