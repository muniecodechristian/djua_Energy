import student from "@/CONSTANTS/fakeData";
import {
  Calendar,
  GraduationCap,
  IdCard,
  School,
  User,
} from "lucide-react";

export default function StudentCardClassic() {
  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-white shadow-2xl">

      {/* HEADER */}
      <div className="bg-blue-700 text-white px-6 py-4">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">

            <img
              src={student.logo}
              alt="logo"
              className="h-16 w-16 rounded-full bg-white object-contain p-1"
            />

            <div>

              <h1 className="text-xl font-bold uppercase">
                {student.school}
              </h1>

              <p className="text-sm opacity-90">
                CARTE D'IDENTITÉ SCOLAIRE
              </p>

              <p className="text-xs opacity-80">
                Année scolaire {student.validity}
              </p>

            </div>

          </div>

          <div className="text-right">

            <p className="text-sm font-semibold">
              N° {student.studentId}
            </p>

            <p className="text-xs opacity-80">
              République Démocratique du Congo
            </p>

          </div>

        </div>

      </div>

      {/* BODY */}

      <div className="grid grid-cols-[150px,1fr] gap-6 p-6">

        {/* PHOTO */}

        <div className="space-y-3">

          <img
            src={student.photo}
            alt={student.name}
            className="h-44 w-full rounded-lg border-4 border-blue-700 object-cover"
          />

          <div className="rounded-lg bg-blue-50 p-2 text-center">

            <p className="text-xs font-semibold uppercase text-blue-700">
              Élève
            </p>

          </div>

        </div>

        {/* INFOS */}

        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-4">

            <Info
              icon={<User size={16} />}
              label="Nom complet"
              value={student.name}
            />

            <Info
              icon={<IdCard size={16} />}
              label="Matricule"
              value={student.studentId}
            />

            <Info
              icon={<GraduationCap size={16} />}
              label="Classe"
              value={student.className}
            />

            <Info
              icon={<School size={16} />}
              label="Option"
              value={student.option}
            />

            <Info
              icon={<Calendar size={16} />}
              label="Naissance"
              value={student.birthDate}
            />

            <Info
              icon={<User size={16} />}
              label="Sexe"
              value={student.gender}
            />

          </div>

          <div className="rounded-xl border bg-slate-50 p-4">

            <h3 className="mb-2 text-sm font-semibold uppercase text-blue-700">

              Informations

            </h3>

            <div className="grid grid-cols-2 gap-2 text-sm">

              <p>
                <span className="font-semibold">
                  Province :
                </span>{" "}
                {student.province}
              </p>

              <p>
                <span className="font-semibold">
                  Commune :
                </span>{" "}
                {student.commune}
              </p>

              <p>
                <span className="font-semibold">
                  Téléphone :
                </span>{" "}
                {student.phone}
              </p>

              <p>
                <span className="font-semibold">
                  Validité :
                </span>{" "}
                {student.validity}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* FOOTER */}

      <div className="border-t bg-slate-50 px-6 py-4">

        <div className="flex items-end justify-between">

          <div>

            <p className="text-xs text-slate-500">
              Signature du Directeur
            </p>

            <div className="mt-2 h-10 w-40 border-b" />

          </div>

          <img
            src={student.qrCode}
            alt="qr"
            className="h-24 w-24 rounded border bg-white p-2"
          />

        </div>

      </div>

    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-lg border p-3">

      <div className="mb-1 flex items-center gap-2 text-blue-700">

        {icon}

        <span className="text-xs font-semibold uppercase">
          {label}
        </span>

      </div>

      <p className="font-medium text-slate-700">
        {value}
      </p>

    </div>
  );
}