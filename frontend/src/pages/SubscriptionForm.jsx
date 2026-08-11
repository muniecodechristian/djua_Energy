import React from 'react';
import { useForm, FormProvider, useFormContext, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/hooks/Zustand/useAuth';
import AddressAutocomplete from '@/components/AddressAutocomplete';

 // ----------------------------------------------------------------------
// 1. UTILITAIRES & STYLES GLOBAUX
// ----------------------------------------------------------------------

// Helper pour générer les classes CSS des inputs de manière consistante
// et gérer automatiquement la bordure rouge en cas d'erreur.
const getInputClasses = (hasError) => `
  w-full bg-zinc-950 border rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 
  focus:outline-none focus:ring-1 transition-colors
  ${hasError 
    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' 
    : 'border-zinc-800 focus:border-[#FF7900] focus:ring-[#FF7900]'
  }
`;

const Label = ({ children, required }) => (
  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

const ErrorMsg = ({ message }) => {
  if (!message) return null;
  return <p className="text-xs text-rose-500 mt-1">{message}</p>;
};

// ----------------------------------------------------------------------
// 2. SOUS-COMPOSANTS DU FORMULAIRE (Consomment le FormContext)
// ----------------------------------------------------------------------

const ClientTypeSelector = () => {
  const { register, watch } = useFormContext();
  const clientType = watch('clientType');

  const types = [
    { id: 'personne_physique', label: 'Personne Physique', desc: 'Particulier / Usage domestique' },
    { id: 'personne_morale', label: 'Personne Morale', desc: 'Entreprise ou Mandataire' }
  ];

  return (
    <section className="space-y-2">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">
        Type de Souscripteur <span className="text-rose-500">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {types.map((type) => {
          const isSelected = clientType === type.id;
          return (
            <label
              key={type.id}
              className={`relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                isSelected ? 'bg-zinc-900 border-[#FF7900] text-white ring-1 ring-[#FF7900]' : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <input type="radio" value={type.id} {...register('clientType')} className="sr-only" />
              <div>
                <p className="font-medium text-sm text-zinc-100">{type.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{type.desc}</p>
              </div>
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#FF7900] bg-[#FF7900]' : 'border-zinc-700'}`}>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
};

const PersonalInfoSection = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext();

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 md:p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-3">
        Informations Personnelles
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label required>Noms & Prénoms</Label>
          <input type="text" placeholder="ex: Jean Mukendi" {...register('fullName', { required: 'Nom obligatoire' })} className={getInputClasses(errors.fullName)} />
          <ErrorMsg message={errors.fullName?.message} />
        </div>
        
        <div>
          <Label>Nationalité</Label>
          <input type="text" placeholder="ex: Congolaise" {...register('nationality')} className={getInputClasses(errors.nationality)} />
        </div>

        <div>
          <Label>Lieu & Date de Naissance</Label>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Lieu" {...register('birthPlace')} className={getInputClasses(errors.birthPlace)} />
            <input type="date" {...register('birthDate')} className={`${getInputClasses(errors.birthDate)} [color-scheme:dark]`} />
          </div>
        </div>

        <div>
          <Label>Adresse email</Label>
          <input type="email" placeholder="exemple@domaine.com" {...register('email')} className={getInputClasses(errors.email)} />
        </div>

        <div className="md:col-span-2">
          <Label required>Adresse de résidence</Label>
          {/* Intégration du composant Senior de la réponse précédente */}
          <AddressAutocomplete
            name="residenceAddress"
            register={register}
            setValue={setValue}
            watch={watch}
            placeholder="Avenue, Numéro, Quartier, Commune..."
            error={errors.residenceAddress}
          />
          <ErrorMsg message={errors.residenceAddress?.message} />
        </div>

        <div>
          <Label>Point de Repère / Référence</Label>
          <input type="text" placeholder="ex: Croisement Av. Kasa-Vubu" {...register('referenceLandmark')} className={getInputClasses(errors.referenceLandmark)} />
        </div>

        <div>
          <Label required>N° Téléphone Orange (Identifiant Kit)</Label>
          <input type="tel" placeholder="084XXXXXXX" {...register('primaryPhone', { required: 'Numéro Orange requis' })} className={getInputClasses(errors.primaryPhone)} />
          <ErrorMsg message={errors.primaryPhone?.message} />
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800/60 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Type de Pièce</Label>
          <select {...register('idType')} className={getInputClasses(errors.idType)}>
            <option value="carte_electeur" className="bg-zinc-900">Carte d'Électeur</option>
            <option value="passeport" className="bg-zinc-900">Passeport</option>
            <option value="autre" className="bg-zinc-900">Autre</option>
          </select>
        </div>
        <div>
          <Label>N° de Pièce</Label>
          <input type="text" placeholder="N° Identité" {...register('idNumber')} className={getInputClasses(errors.idNumber)} />
        </div>
        <div>
          <Label>Délivrée à / le</Label>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Lieu" {...register('idIssuedAt')} className={getInputClasses(errors.idIssuedAt)} />
            <input type="date" {...register('idIssuedDate')} className={`${getInputClasses(errors.idIssuedDate)} [color-scheme:dark]`} />
          </div>
        </div>
      </div>
    </div>
  );
};

const CompanyInfoSection = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 md:p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-3">
        Informations Société / Mandataire
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label required>Raison Sociale</Label>
          <input type="text" placeholder="Nom de la Société" {...register('companyName', { required: 'Raison sociale requise' })} className={getInputClasses(errors.companyName)} />
          <ErrorMsg message={errors.companyName?.message} />
        </div>
        <div>
          <Label>Représentée Par</Label>
          <input type="text" placeholder="Nom du Mandataire" {...register('representativeName')} className={getInputClasses()} />
        </div>
        <div>
          <Label>N° RCCM</Label>
          <input type="text" placeholder="CD/KIN/RCCM/..." {...register('rccm')} className={getInputClasses()} />
        </div>
        <div>
          <Label>Identification Nationale</Label>
          <input type="text" placeholder="IDNAT N°..." {...register('nationalId')} className={getInputClasses()} />
        </div>
        <div>
          <Label required>Téléphone Orange Portable</Label>
          <input type="tel" placeholder="084XXXXXXX" {...register('companyPhone', { required: 'Téléphone requis' })} className={getInputClasses(errors.companyPhone)} />
          <ErrorMsg message={errors.companyPhone?.message} />
        </div>
        <div>
          <Label>Email Entreprise</Label>
          <input type="email" placeholder="contact@societe.com" {...register('companyEmail')} className={getInputClasses()} />
        </div>
      </div>
    </div>
  );
};

const BillingSection = () => {
  const { register, control, formState: { errors } } = useFormContext();
  
  // Utilisation de useWatch au lieu du root watch() pour ne re-rendre QUE cette section
  const subscriptionFee = useWatch({ control, name: 'subscriptionFeeTTC' }) || 0;
  const monthlyFee = useWatch({ control, name: 'monthlyFeeTTC' }) || 0;
  const months = useWatch({ control, name: 'monthsCount' }) || 1;
  
  // Le calcul se fait à la volée pour l'UI, sans useEffect !
  const computedTotal = Number(subscriptionFee) + (Number(monthlyFee) * Number(months));

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 md:p-6 space-y-5">
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-3">
        Choix du Kit & Facturation
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label required>Zone d'Installation</Label>
          <input type="text" placeholder="ex: Kinshasa / Mont-Ngafula" {...register('installationZone', { required: "Zone d'installation obligatoire" })} className={getInputClasses(errors.installationZone)} />
          <ErrorMsg message={errors.installationZone?.message} />
        </div>
        <div>
          <Label>Formule Choisie</Label>
          <select {...register('offerName')} className={getInputClasses()}>
            <option value="Orange Energies Gold" className="bg-zinc-900">Orange Energies Gold</option>
            <option value="Orange Energies Standard" className="bg-zinc-900">Orange Energies Standard</option>
            <option value="Autre" className="bg-zinc-900">Autre</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">Frais Souscription ($)</label>
          <input type="number" step="0.01" {...register('subscriptionFeeTTC', { valueAsNumber: true })} className={getInputClasses()} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">Abonnement Mensuel ($)</label>
          <input type="number" step="0.01" {...register('monthlyFeeTTC', { valueAsNumber: true })} className={getInputClasses()} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">Nombre de mois</label>
          <input type="number" min="1" {...register('monthsCount', { valueAsNumber: true })} className={getInputClasses()} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#FF7900] mb-1">Total Calculé ($)</label>
          {/* Input ReadOnly pur affichage */}
          <input type="text" readOnly value={computedTotal.toFixed(2)} className="w-full bg-zinc-900/80 border border-[#FF7900]/40 rounded px-2.5 py-1.5 text-sm font-bold font-mono text-[#FF7900] cursor-not-allowed focus:outline-none" />
        </div>
      </div>
    </div>
  );
};

const TermsSection = () => {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 md:p-6 space-y-4">
      <label className="flex items-start gap-3 cursor-pointer group">
        <input type="checkbox" {...register('acceptCommercialProspection')} className="mt-0.5 w-4 h-4 accent-[#FF7900] rounded bg-zinc-950 border-zinc-800 cursor-pointer" />
        <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
          J'accepte de recevoir des informations et prospections commerciales provenant d'Orange RDC.
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input type="checkbox" {...register('acceptTerms', { required: 'Veuillez accepter les conditions CGLV' })} className="mt-0.5 w-4 h-4 accent-[#FF7900] rounded bg-zinc-950 border-zinc-800 cursor-pointer" />
        <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
          Je déclare avoir pris connaissance et accepté les Conditions Générales de Location-Vente du service Orange Energies. <span className="text-rose-500">*</span>
        </span>
      </label>
      <ErrorMsg message={errors.acceptTerms?.message} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-zinc-800">
        <div>
          <Label>Fait à</Label>
          <input type="text" {...register('locationSignedAt')} className={getInputClasses()} />
        </div>
        <div>
          <Label>Le (Date de signature)</Label>
          <input type="date" {...register('signedDate')} className={`${getInputClasses()} [color-scheme:dark]`} />
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. COMPOSANT PRINCIPAL (Orchestrateur)
// ----------------------------------------------------------------------

export default function SubscriptionForm() {
  const { createClient, createUser, isLoading } = useAuthStore();

  const methods = useForm({
    defaultValues: {
      clientType: 'personne_physique',
      offerName: 'Orange Energies Gold',
      subscriptionFeeTTC: 0,
      monthlyFeeTTC: 0,
      monthsCount: 1,
      acceptCommercialProspection: false,
      acceptTerms: false,
      locationSignedAt: 'Kinshasa',
      signedDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data) => {
    // Le calcul du total se fait proprement ici, juste avant l'envoi à l'API
    const calculatedTotal = Number(data.subscriptionFeeTTC || 0) + (Number(data.monthlyFeeTTC || 0) * Number(data.monthsCount || 1));
    const payload = { ...data, totalAmount: calculatedTotal };

    const toastId = toast.loading('Enregistrement de la souscription en cours...');
    try {
      if (typeof createClient === 'function') {
        await createClient(payload);
      } else if (typeof createUser === 'function') {
        await createUser(payload);
      } else {
        const response = await fetch('/api/auth/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Échec de la souscription.');
      }
      toast.success('Souscription enregistrée avec succès !', { id: toastId });
      methods.reset(); // Optionnel : vide le formulaire après succès
    } catch (err) {
      toast.error(err?.message || 'Erreur lors de la création du dossier.', { id: toastId });
    }
  };

  const currentClientType = methods.watch('clientType');

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 text-zinc-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Souscription Orange Energies</h1>
          <p className="text-xs text-zinc-400 mt-1">Contrat de location-vente kit solaire RDC</p>
        </div>
        <div className="self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7900]" />
            Nouveau Dossier
          </span>
        </div>
      </div>

      {/* Le FormProvider distribue le state à tous les sous-composants */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
          
          <ClientTypeSelector />
          
          {currentClientType === 'personne_physique' ? (
            <PersonalInfoSection />
          ) : (
            <CompanyInfoSection />
          )}
          
          <BillingSection />
          
          <TermsSection />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-[#FF7900] hover:bg-[#e66d00] active:scale-[0.998] disabled:opacity-50 text-black font-semibold text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Soumettre la souscription</span>
            )}
          </button>
          
        </form>
      </FormProvider>
    </div>
  );
}