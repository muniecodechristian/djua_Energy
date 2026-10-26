import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5500/api/messages";

axios.defaults.withCredentials = true;

export const useMessageStore = create((set, get) => ({
  messages: [],
  sentMessages: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  sendMessage: async (data) => {
    try {
      set({ isLoading: true, error: null });

      const res = await axios.post(API_URL, data);

      set((state) => ({
        messages: [res.data.data, ...state.messages],
        sentMessages: [res.data.data, ...state.sentMessages],
        isLoading: false,
      }));

      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Erreur envoi message",
        isLoading: false,
      });
    }
  },

  fetchMessages: async () => {
    try {
      set({ isLoading: true, error: null });

      const res = await axios.get(API_URL);

      const messages = res.data.data || res.data;

      set({
        messages,
        unreadCount: messages.filter((msg) => !msg.isRead).length,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Erreur récupération messages",
        isLoading: false,
      });
    }
  },

  fetchMySentMessages: async () => {
    try {
      set({ isLoading: true, error: null });

      const res = await axios.get(`${API_URL}/mySentMessages`);

      const sentMessages = res.data.data || res.data;

      set({
        sentMessages,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Erreur récupération messages envoyés",
        isLoading: false,
      });
    }
  },

  markAsRead: async (messageId) => {
    try {
      await axios.patch(`${API_URL}/read/${messageId}`);

      set((state) => {
        const updated = state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, isRead: true } : msg
        );

        return {
          messages: updated,
          unreadCount: updated.filter((m) => !m.isRead).length,
        };
      });
    } catch (error) {
      console.error("Erreur markAsRead:", error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axios.delete(`${API_URL}/${messageId}`);

      set((state) => {
        const filteredMessages = state.messages.filter(
          (msg) => msg._id !== messageId
        );

        const filteredSent = state.sentMessages.filter(
          (msg) => msg._id !== messageId
        );

        return {
          messages: filteredMessages,
          sentMessages: filteredSent,
          unreadCount: filteredMessages.filter((m) => !m.isRead).length,
        };
      });
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  },

  clearMessages: () => {
    set({
      messages: [],
      sentMessages: [],
      unreadCount: 0,
    });
  },
}));