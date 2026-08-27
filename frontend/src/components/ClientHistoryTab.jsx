import React from 'react';
import { useTelemetryStream } from '../hooks/tanstack/useTelemetryStream.js';
import { Clock, Battery, Sun, ShieldAlert, MapPin, CheckCircle } from 'lucide-react';

export default function ClientHistoryTab({ client }) {
  const { data: telemetryHistory = [], isLoading, isError } = useTelemetryStream();

  // Filtrer l'historique pour ce client/kit
  const clientHistory = telemetryHistory.filter(
    (entry) => entry.deviceId === client?.kitId
  );

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!client) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs">
        Aucune donnée client disponible.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Historique de Télémétrie</h3>
            <p className="text-[10px] text-zinc-500 font-mono">Kit : {client.kitId}</p>
          </div>
          <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
            {clientHistory.length} entrée(s) enregistrée(s)
          </span>
        </div>

        {isLoading && (
          <div className="py-12 text-center text-xs text-zinc-500 animate-pulse">
            Chargement de l'historique...
          </div>
        )}

        {isError && (
          <div className="py-12 text-center text-xs text-red-400">
            Impossible de charger l'historique de télémétrie.
          </div>
        )}

        {!isLoading && !isError && clientHistory.length === 0 && (
          <div className="py-12 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
            <Clock size={20} className="text-zinc-700 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Aucun signal de télémétrie historique reçu pour ce kit.</span>
            <span className="text-[10px] text-zinc-600">Assurez-vous que le boîtier émet sur le réseau.</span>
          </div>
        )}

        {!isLoading && !isError && clientHistory.length > 0 && (
          <div className="relative border-l border-zinc-800 pl-4 ml-2 space-y-6">
            {clientHistory.map((entry, idx) => {
              const d = entry.data || {};

              return (
                <div key={idx} className="relative">
                  {/* Point sur la ligne de temps */}
                  <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-black ${
                    'border-emerald-500 ring-4 ring-emerald-500/10'
                  }`} />

                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3.5 hover:border-zinc-700/50 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900/40 pb-2 mb-2 text-[10px]">
                      <span className="flex items-center gap-1 text-zinc-400 font-medium">
                        <Clock size={12} className="text-orange-500/80" />
                        {formatTime(entry.timestamp)}
                      </span>
                      <span className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold ${
                        isTampered ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {isTampered ? (
                          <>
                            <ShieldAlert size={10} />
                            Boîtier Ouvert (Tamper)
                          </>
                        ) : (
                          <>
                            <CheckCircle size={10} />
                            État Normal
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] text-zinc-400">
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Batterie</span>
                        <span className="text-zinc-200 font-semibold">{d.batterySOC}%</span>
                        <span className="text-[9px] text-zinc-500 block">{d.batteryVoltage}V · {d.batteryCurrent}A</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Panneau</span>
                        <span className="text-amber-400 font-semibold">{d.panelPower} W</span>
                        <span className="text-[9px] text-zinc-500 block">{d.panelVoltage}V · {d.panelCurrent}A</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Localisation</span>
                        <span className="text-zinc-200 font-mono flex items-center gap-1">
                          <MapPin size={10} className="text-orange-500/60" />
                          {d.latitude != null ? `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}` : 'Non disponible'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Spécifications</span>
                        <span className="text-zinc-200 block">Firmware : v{d.firmwareVersion || '1.0.0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
