import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import student from "@/CONSTANTS/fakeData";

export default function StudentCard() {
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef: componentRef });

  return (
    <div className="flex flex-col items-center gap-8 p-10 bg-gray-50 min-h-screen">
      <button 
        onClick={handlePrint}
        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all print:hidden"
      >
        Imprimer la carte (Format A4)
      </button>

      {/* Zone d'impression */}
      <div ref={componentRef} className="w-[210mm] h-[297mm] bg-white p-[20mm] flex flex-col items-center gap-10 print:m-0">
        
        {/* RECTO (Votre style personnalisé) */}
        <div className="w-[100mm] rounded-2xl overflow-hidden shadow-xl border bg-white">
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{student.school}</h2>
             
            </div>
           
          </div>
          <div className="p-4 flex gap-4">
            <img src={student.photo} className="w-24 h-24 rounded-lg object-cover border" />
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-semibold text-gray-800">Nom: {student.name}</h3>
              <p className="text-sm text-gray-600">ID: <span className="font-medium">{student.studentId}</span></p>
              <p className="text-sm text-gray-600">Class: <span className="font-medium">{student.className}</span></p>
              <p className="text-sm text-gray-600">DOB: <span className="font-medium">{student.birthDate}</span></p>
              <p className="text-xs text-gray-400">Valid: {student.validity}</p>
            </div>
          </div>
          <div className="p-3 border-t flex items-center justify-between">
            <p className="text-xs text-gray-500">Powered by NDako System</p>
            <img src={student.qrCode} className="w-12 h-12" />
          </div>
        </div>

        {/* VERSO EXPERT */}
        <div className="w-[100mm] h-[65mm] rounded-2xl overflow-hidden shadow-2xl border bg-slate-900 text-white p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-700 pb-1">Informations Légales</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
              <p>Né(e) le: {student.birthDate}</p>
              <p>Validité: {student.validity}</p>
            </div>
            <p className="text-[9px] text-slate-500 italic">
              Cette carte est strictement personnelle. En cas de perte, merci de rapporter cet objet à l'administration de l'établissement.
            </p>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-[9px] text-slate-400">Powered by NDako System</div>
            <img src={student.qrCode} className="w-12 h-12 bg-white p-1 rounded" />
          </div>
        </div>

      </div>
    </div>
  );
}