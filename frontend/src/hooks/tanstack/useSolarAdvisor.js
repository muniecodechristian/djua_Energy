import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

// ─── Mapper les appareils Djua → format Solar Advisor API ─────────────────
// Djua: { name, watts, hours, quantity, period: "day"|"night"|"both" }
// ML:   { name, power_w, hours_per_day, quantity, usage_period: "day"|"night"|"mixed"|"continuous" }
export function mapAppliancesToML(appliances = []) {
  return appliances.map((a) => ({
    name: a.name,
    quantity: a.quantity ?? 1,
    hours_per_day: a.hours ?? 1,
    power_w: a.watts ?? null,
    usage_period:
      a.period === 'both' ? 'mixed'
      : a.period === 'night' ? 'night'
      : a.period === 'day' ? 'day'
      : 'mixed',
    essential: true,
    simultaneous: true,
  }));
}

// ─── POST /solar/recommend ─────────────────────────────────────────────────
// Envoie les appareils + infos client au modèle ML et retourne le kit dimensionné
export function useSolarRecommend() {
  return useMutation({
    mutationKey: ['solar', 'recommend'],
    mutationFn: async ({ appliances, clientInfo = {}, projectForm = {} }) => {
      const payload = {
        appliances: mapAppliancesToML(appliances),
        city: projectForm.location || clientInfo.ville || undefined,
        region: projectForm.location || undefined,
        housing_type: clientInfo.selectedType || undefined,
        people_count: projectForm.occupants ? parseInt(projectForm.occupants, 10) : undefined,
        autonomy_hours: 10,
        preference: 'balanced',
        source: 'frontend',
        contact: clientInfo.phone
          ? { phone: clientInfo.phone, name: clientInfo.fullName || clientInfo.companyName || undefined }
          : undefined,
      };

      const res = await api.post('/solar/recommend', payload);
      return res.data?.data ?? res.data;
    },
  });
}

// ─── POST /solar/conversation ──────────────────────────────────────────────
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

// ─── GET /solar/recommendations ───────────────────────────────────────────
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

// ─── GET /solar/recommendations/:id ───────────────────────────────────────
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

// ─── POST /solar/recommendations/:id/ask ──────────────────────────────────
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
