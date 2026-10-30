import React, { useEffect, useState } from 'react';
import {
  Bell, CheckCircle2, Clock, MapPin, Phone, User,
  Calendar, ArrowRight, RefreshCw, AlertCircle, Wrench, MessageSquare
} from 'lucide-react';
import { installationApi, type InstallationItem } from '../services/api';

interface TechnicianNotificationsProps {
  onOpenChat: (installationId: string) => void;
  onStartScan: (quoteNumber: string) => void;
}

export default function TechnicianNotifications({
  onOpenChat,
  onStartScan
}: TechnicianNotificationsProps) {
  const [installations, setInstallations] = useState<InstallationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchMissions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await installationApi.getAssignedInstallations();
      setInstallations(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les missions assignées.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleAcknowledge = async (id: string) => {
    setAcknowledgingId(id);
    try {
      const updated = await installationApi.acknowledgeInstallation(id);
      setInstallations(prev =>
        prev.map(item => item._id === id ? { ...item, ...updated } : item)
      );
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Erreur lors de l'accusé de réception.");
    } finally {
      setAcknowledgingId(null);
    }
  };

  const pendingCount = installations.filter(i => !i.technicianAcknowledgedAt).length;

  return (
    <div className="technician-tab-page" style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
      {/* En-tête de section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>
            Missions & Notifications
          </h2>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
            {pendingCount > 0
              ? `${pendingCount} nouvelle(s) mission(s) à confirmer`
              : 'Toutes les missions reçues sont confirmées'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMissions}
          disabled={loading}
          style={{
            background: 'none',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#4B5563',
            fontWeight: 600
          }}
        >
          <RefreshCw size={13} className={loading ? 'ops-spin' : ''} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
          <div className="spinner spinner-brand" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13 }}>Chargement de vos missions…</p>
        </div>
      ) : error ? (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: 16, borderRadius: 12, color: '#991B1B', fontSize: 13 }}>
          <AlertCircle size={18} style={{ marginBottom: 6 }} />
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchMissions}
            style={{ marginTop: 8, padding: '4px 10px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
          >
            Réessayer
          </button>
        </div>
      ) : installations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', background: '#F9FAFB', borderRadius: 16, border: '1px dashed #E5E7EB' }}>
          <Bell size={36} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>Aucune mission assignée</h3>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Dès qu'un administrateur ou superviseur vous confie un chantier d'installation, il apparaîtra ici.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {installations.map((inst) => {
            const isConfirmed = Boolean(inst.technicianAcknowledgedAt);
            const isAcknowledging = acknowledgingId === inst._id;

            return (
              <div
                key={inst._id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: isConfirmed ? '1px solid #E5E7EB' : '1.5px solid #FF5C00',
                  boxShadow: isConfirmed ? '0 1px 3px rgba(0,0,0,0.05)' : '0 4px 12px rgba(255, 92, 0, 0.12)',
                  padding: 16,
                  position: 'relative'
                }}
              >
                {/* Badge statut notification */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#6B7280',
                    background: '#F3F4F6',
                    padding: '2px 8px',
                    borderRadius: 6
                  }}>
                    {inst.folderNumber}
                  </span>

                  {isConfirmed ? (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#059669',
                      background: '#ECFDF5',
                      padding: '3px 8px',
                      borderRadius: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <CheckCircle2 size={12} /> Prise en charge confirmée
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#D97706',
                      background: '#FEF3C7',
                      padding: '3px 8px',
                      borderRadius: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Clock size={12} /> À confirmer réception
                    </span>
                  )}
                </div>

                {/* Nom du dossier / client */}
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
                  {inst.folderName || inst.customer?.name || 'Installation Solaire'}
                </h3>

                {/* Infos client & site */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#4B5563', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={14} color="#6B7280" />
                    <span>{inst.customer?.name || 'Client sans nom'}</span>
                    {inst.customer?.phone && (
                      <>
                        <span style={{ color: '#D1D5DB' }}>•</span>
                        <a href={`tel:${inst.customer.phone}`} style={{ color: '#FF5C00', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                          <Phone size={12} /> {inst.customer.phone}
                        </a>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#6B7280" />
                    <span>{[inst.site?.adresse, inst.site?.quartier, inst.site?.ville || 'Kinshasa'].filter(Boolean).join(', ') || 'Adresse non renseignée'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} color="#6B7280" />
                    <span>Date prévue : <strong>{inst.plannedDate || 'Dès que possible'}</strong></span>
                  </div>

                  {inst.createdBy && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      Assigné par : {inst.createdBy.prenom} {inst.createdBy.nom} ({inst.createdBy.role})
                    </div>
                  )}
                </div>

                {/* Actions principales */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                  {!isConfirmed ? (
                    <button
                      type="button"
                      disabled={isAcknowledging}
                      onClick={() => handleAcknowledge(inst._id)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: '#FF5C00',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(255, 92, 0, 0.25)'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {isAcknowledging ? 'Confirmation en cours…' : "Signaler que j'ai reçu la mission"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onStartScan(inst.quoteNumber)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#FF5C00',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <Wrench size={14} /> Poser le kit
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenChat(inst._id)}
                        style={{
                          padding: '8px 12px',
                          background: '#F3F4F6',
                          color: '#374151',
                          border: '1px solid #E5E7EB',
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <MessageSquare size={14} /> Discussion
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
