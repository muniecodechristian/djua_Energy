import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export function useGetInstallations(filters = {}) {
  return useQuery({
    queryKey: ['installations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.zone) params.append('zone', filters.zone);
      if (filters.technician) params.append('technician', filters.technician);
      if (filters.page) params.append('page', filters.page);

      const res = await api.get(`/api/installations?${params.toString()}`);
      return res.data?.data;
    },
    staleTime: 30000,
  });
}

export function useGetInstallationDetail(id) {
  return useQuery({
    queryKey: ['installation', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/api/installations/${id}`);
      return res.data?.data;
    },
    enabled: Boolean(id),
  });
}

export function useAssignTechnician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, technicianId, plannedDate, note }) => {
      const res = await api.patch(`/api/installations/${id}/assign`, {
        technicianId,
        plannedDate,
        note,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['installation'] });
    },
  });
}

export function useUpdateInstallationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, note, blockedReason }) => {
      const res = await api.patch(`/api/installations/${id}/status`, {
        status,
        note,
        blockedReason,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['installation'] });
    },
  });
}

export function useCommissionInstallation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, kitId, gpsCoordinates, checklist, notes }) => {
      const res = await api.post(`/api/installations/${id}/commission`, {
        kitId,
        gpsCoordinates,
        checklist,
        notes,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['installation'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['kits'] });
    },
  });
}

export function useValidateInstallation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }) => {
      const res = await api.patch(`/api/installations/${id}/validate`, { note });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['installation'] });
    },
  });
}

export function useAcceptInstallation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      const res = await api.patch(`/api/installations/${id}/accept`);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['installation'] });
    },
  });
}

export function useReportInstallationIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason, category, notes }) => {
      const res = await api.patch(`/api/installations/${id}/report-issue`, {
        reason,
        category,
        notes,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['installation'] });
    },
  });
}

export function useMarkInstallationInstalled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }) => {
      const res = await api.patch(`/api/installations/${id}/mark-installed`, { notes });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['installation'] });
    },
  });
}

export function useGetInstallationMessages(id) {
  return useQuery({
    queryKey: ['installation-messages', id],
    queryFn: async () => {
      if (!id) return { conversation: null, messages: [] };
      const res = await api.get(`/api/installations/${id}/messages`);
      const payload = res.data?.data;
      if (Array.isArray(payload)) {
        return { conversation: null, messages: payload };
      }
      return {
        conversation: payload?.conversation || null,
        messages: payload?.messages || [],
      };
    },
    enabled: Boolean(id),
    refetchInterval: 5000,
  });
}

export function useSendInstallationMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content, type = 'text', mediaUrl, audioDuration, replyTo }) => {
      const res = await api.post(`/api/installations/${id}/messages`, {
        content,
        type,
        mediaUrl,
        audioDuration,
        replyTo,
      });
      return res.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['installation-messages', variables.id] });
    },
  });
}

export function useMarkInstallationMessagesRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      const res = await api.patch(`/api/installations/${id}/messages/read`);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['installation-messages', variables.id] });
    },
  });
}

