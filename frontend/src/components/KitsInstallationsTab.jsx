import React from 'react';
import { Box, Calendar, CreditCard, MapPin, Radio, ShieldAlert } from 'lucide-react';

export default function KitsInstallationsTab({ client }) {
  if (!client) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs">
        Aucune donnée client disponible.
      </div>
    );
  }

  const formatGPS = (gps) => {
    if (!gps || gps.latitude == null || gps.longitude == null) return 'Non renseigné';
    return `Lat: ${gps.latitude.toFixed(4)}, Lon: ${gps.longitude.toFixed(4)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non installée';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
              <Box size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Détails de l'Installation IoT</h3>
              <p className="text-[10px] text-zinc-500">ID d'Équipement unique du kit d'abonnement</p>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 ${
            client.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            client.status === 'suspended' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              client.status === 'active' ? 'bg-emerald-500 animate-pulse' :
              client.status === 'suspended' ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            {client.status === 'active' ? 'Actif' : client.status === 'suspended' ? 'Suspendu' : 'Résilié'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-zinc-400">
          <div className="flex items-start gap-3">
            <Radio size={16} className="text-orange-500/70 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Identifiant Boîtier / Kit ID</span>
              <span className="text-sm font-bold text-white font-mono">{client.kitId}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard size={16} className="text-orange-500/70 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Offre Commerciale</span>
              <span className="text-sm font-bold text-zinc-200">{client.offerName || 'Non spécifiée'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-orange-500/70 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Date d'Installation</span>
              <span className="text-sm font-bold text-zinc-200">{formatDate(client.installationDate)}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-orange-500/70 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Coordonnées GPS</span>
              <span className="text-sm font-bold text-zinc-200 font-mono">{formatGPS(client.gpsCoordinates)}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldAlert size={16} className="text-orange-500/70 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Frais d'activation (Orange)</span>
              <span className="text-sm font-bold text-zinc-200">
                {client.subscriptionFeePaid ? '✅ Réglés et Synchronisés' : '❌ Non Payés'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Radio size={16} className="text-orange-500/70 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Téléphone de l'abonné</span>
              <span className="text-sm font-bold text-zinc-200 font-mono">{client.clientPhone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
