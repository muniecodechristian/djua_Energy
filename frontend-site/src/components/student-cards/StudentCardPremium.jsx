import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import student from "@/CONSTANTS/fakeData";

const data = Array.isArray(student) ? student[0] : student;

const CardSection = ({ children, className }) => (
  <div className={`border-2 border-slate-800 bg-white p-6 w-[115mm] h-[80mm] flex flex-col box-border shadow-lg ${className}`}>
    {children}
  </div>
);

const StudentCardPremium = () => {
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef: componentRef });

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <button 
        onClick={handlePrint}
        className="px-8 py-3 bg-slate-900 text-white font-bold rounded hover:bg-slate-700 transition-colors print:hidden"
      >
        Imprimer la Carte Premium
      </button>

      <div ref={componentRef} className="flex flex-col gap-10 print:p-0 p-10">
        
        {/* RECTO */}
        <CardSection className="items-center justify-between text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500"></div>
          <div className="text-[13px] font-bold uppercase tracking-wide">
            République Démocratique du Congo<br />
            Ministère de l'Enseignement Primaire, Secondaire et Technique
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 border-4 border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-bold">
              ARMOIRIES
            </div>
          </div>
          <div className="w-full border-t border-b border-slate-300 py-2">
            <h2 className="text-xl font-black uppercase text-slate-900">Carte d'Élève</h2>
          </div>
          <div className="text-sm font-semibold">Année Scolaire 2024-2025</div>
        </CardSection>

        {/* VERSO */}
        <CardSection className="justify-between">
          <div className="flex gap-4 h-full">
            <div className="flex-1 flex flex-col justify-between text-[11px] leading-relaxed">
              <div className="space-y-2 border-l-4 border-blue-900 pl-3">
                <p><strong>Nom :</strong> {data.name}</p>
                <p><strong>Matricule :</strong> {data.studentId}</p>
                <p><strong>École :</strong> {data.school}</p>
                <p><strong>Classe :</strong> {data.className}</p>
                <p><strong>Date de naissance :</strong> {data.birthDate}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-dashed border-slate-400">
                <p className="font-bold uppercase text-[9px]">Le Chef d'Établissement</p>
                <div className="h-12"></div> {/* Espace Signature */}
              </div>
            </div>
            
            <div className="w-[35mm] flex flex-col items-center gap-2">
              <div className="w-full h-[40mm] border-2 border-slate-900 bg-slate-100 overflow-hidden">
                <img src={data.photo} alt="Photo" className="w-full h-full object-cover" />
              </div>
              <div className="text-[8px] text-center italic border border-slate-300 p-1 w-full">
                Fait à ______<br />le ___/___/2026
              </div>
            </div>
          </div>
        </CardSection>

      </div>
    </div>
  );
};

export default StudentCardPremium;