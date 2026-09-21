import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

// ─── Mapper les appareils Djua → format Solar Advisor API ──────────────────
// Djua  : { name, watts, hours, quantity, period: "day"|"night"|"both", diversity }
// ML    : { appliance_id, name, hours_per_day, quantity, usage_period, essential, simultaneous }
// NOTE  : le backend (solar.controller.js → normalizeAppliance) fait une seconde
//         passe de normalisation, ce hook pré-formate déjà proprement.
export function mapAppliancesToML(appliances = []) {
  return appliances.map((a) => {
    // Dériver un appliance_id slug reproductible depuis le nom
    const appliance_id =
      a.appliance_id ||
      (a.name || 'appareil')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    // Mapper usage_period : Djua "both" → ML "mixed"
    const periodMap = {
      day: 'day',
      night: 'night',
      both: 'mixed',
      mixed: 'mixed',
      continuous: 'continuous',
    };

    return {
      appliance_id,
      name:          a.name         || 'Appareil',
      quantity:      Math.max(1, parseInt(a.quantity, 10) || 1),
      hours_per_day: Math.max(0.5, parseFloat(a.hours ?? a.hours_per_day ?? 1)),
      usage_period:  periodMap[a.period] || periodMap[a.usage_period] || 'mixed',
      essential:     a.essential    ?? true,
      simultaneous:  a.simultaneous ?? true,
    };
  });
}

// ─── POST /solar/recommend ──────────────────────────────────────────────────
// Envoie les appareils + infos client au modèle ML, retourne le kit dimensionné.
// Attend : { appliances, clientInfo, projectForm }
export function useSolarRecommend() {
  return useMutation({
    mutationKey: ['solar', 'recommend'],
    mutationFn: async ({ appliances, clientInfo = {}, projectForm = {} }) => {
      // Résoudre la ville et région selon le profil (personne vs entreprise)
      const city   = projectForm.location || clientInfo.ville    || clientInfo.city    || undefined;
      const region = projectForm.location || clientInfo.province || clientInfo.region  || undefined;

      // Résoudre le contact
      const phone = clientInfo.phone || undefined;
      const name  = clientInfo.fullName || clientInfo.companyName || clientInfo.contactName || undefined;
      const contact = phone ? { phone, ...(name ? { name } : {}) } : undefined;

      const payload = {
        appliances:    mapAppliancesToML(appliances),
        city,
        region,
        housing_type:  clientInfo.selectedType || clientInfo.housing_type || undefined,
        people_count:  projectForm.occupants ? parseInt(projectForm.occupants, 10) : undefined,
        autonomy_hours: 10,
        preference:    'balanced',
        customer_id:   phone || clientInfo.email || 'djua-client',
        contact,
        source:        'djua-frontend',
      };

      const res = await api.post('/solar/recommend', payload);
      return res.data?.data ?? res.data;
    },
  });
}

// ─── POST /solar/conversation ───────────────────────────────────────────────
// Chat conversationnel guidé
export function useSolarConversation() {
  return useMutation({
    mutationKey: ['solar', 'conversation'],
    mutationFn: async ({ message, context = {} }) => {
      const res = await api.post('/solar/conversation', { message, context });
      return res.data?.data ?? res.data;
    },
  });
}

// ─── GET /solar/recommendations ────────────────────────────────────────────
// Lister les recommandations ML sauvegardées
export function useSolarRecommendations(limit = 5) {
  return useQuery({
    queryKey: ['solar', 'recommendations', limit],
    queryFn: async () => {
      const res = await api.get('/solar/recommendations', { params: { limit } });
      return res.data?.data ?? res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });
}

// ─── GET /solar/recommendations/:id ────────────────────────────────────────
export function useSolarRecommendationById(id) {
  return useQuery({
    queryKey: ['solar', 'recommendation', id],
    queryFn: async () => {
      const res = await api.get(`/solar/recommendations/${id}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── POST /solar/recommendations/:id/ask ───────────────────────────────────
// Question interactive sur un devis
export function useSolarAsk(recommendationId) {
  return useMutation({
    mutationKey: ['solar', 'ask', recommendationId],
    mutationFn: async (question) => {
      const res = await api.post(`/solar/recommendations/${recommendationId}/ask`, { question });
      return res.data?.data ?? res.data;
    },
  });
}
