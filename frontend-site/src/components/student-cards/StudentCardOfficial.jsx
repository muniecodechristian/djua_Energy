import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import student from "@/CONSTANTS/fakeData";

const data = Array.isArray(student) ? student[0] : student;

const StudentCardOfficial = () => {
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef: componentRef });

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <button 
        onClick={handlePrint}
        className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors print:hidden"
      >
        Imprimer la carte
      </button>

      {/* Conteneur A4 */}
      <div ref={componentRef} className="w-[210mm] min-h-[297mm] p-8 bg-white flex flex-col items-center gap-8">
        
        {/* Recto - Largeur augmentée à 110mm */}
        <div className="border-2 border-black p-6 w-[110mm] h-[75mm] flex flex-col justify-between text-center font-bold">
          <div className="text-[12px]">
            RÉPUBLIQUE DÉMOCRATIQUE DU CONGO<br />
            Ministère de l'Enseignement Primaire, Secondaire et Technique
          </div>
          <div className="flex justify-center">
            <div className="w-20 h-12 bg-blue-500 border border-black" />
          </div>
          <div className="text-lg">CARTE D'ÉLÈVE N° ________</div>
          <div className="text-sm">Valable pour l'année scolaire 2024-2025</div>
        </div>

        {/* Verso - Largeur augmentée à 110mm */}
        <div className="border-2 border-black p-5 w-[110mm] h-[75mm] flex gap-4">
          <div className="text-[12px] flex-1 flex flex-col justify-between">
            <div>
              <div className="font-bold text-center border-b border-black mb-3 pb-1">SOUS-DIVISION...</div>
              <div className="space-y-2">
                <div><strong>Nom :</strong> {data.name}</div>
                <div><strong>Matricule :</strong> {data.studentId}</div>
                <div><strong>École :</strong> {data.school}</div>
                <div><strong>Classe :</strong> {data.className}</div>
                <div><strong>Date de naissance :</strong> {data.birthDate}</div>
                <div><strong>Validité :</strong> {data.validity}</div>
              </div>
            </div>
            <div className="italic text-[10px] mt-4">Le Chef d'établissement (Signature)</div>
          </div>
          
          <div className="flex flex-col items-center justify-between w-[30mm]">
            <img
              src={data.photo}
              alt={data.name}
              className="w-full h-[35mm] border border-black object-cover"
            />
            <div className="text-[9px] text-center leading-tight">
              Fait à ______ <br/>le ___/___/2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCardOfficial;