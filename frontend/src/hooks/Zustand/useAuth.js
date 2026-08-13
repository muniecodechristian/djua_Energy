import { create } from "zustand";
import axios from "axios";

import URL from "../api/API";

const API_URL = `${URL}api/auth`;

axios.defaults.withCredentials = true;

export const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    isCheckingAuth: true,
    message: null,

    createUser: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/signup`, data);
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ error: error?.response?.data?.message || "Error signing up", isLoading: false });
            throw error;
        }
    },

    createClient: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/create-client`, data);
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            set({ error: error?.response?.data?.message || "Error creating client", isLoading: false });
            throw error;
        }
    },

    login: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/login`, data);
            set({
                isAuthenticated: true,
                user: response.data.user,
                error: null,
                isLoading: false,
            });
        } catch (error) {
            set({ error: error.response?.data?.message || "Error logging in", isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            await axios.post(`${API_URL}/logout`);
            set({ user: null, isAuthenticated: false, error: null, isLoading: false });
        } catch (error) {
            set({ error: "Error logging out", isLoading: false });
            throw error;
        }
    },

    verifyEmail: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/verify-email`, code);
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
            return response.data;
        } catch (error) {
            set({ error: error.response.data.message || "Error verifying email", isLoading: false });
            throw error;
        }
    },

    checkAuth: async () => {
        set({ isCheckingAuth: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/check-auth`, {
                withCredentials: true,
            });
            set({
                user: response.data.user,
                isAuthenticated: true,
                isCheckingAuth: false,
            });
        } catch (error) {
            set({
                user: null,
                isAuthenticated: false,
                isCheckingAuth: false,
            });
        }
    },

    forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/forgot-password`, { email });
            set({ message: response.data.message, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error.response.data.message || "Error sending reset password email",
            });
            throw error;
        }
    },

    resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/reset-password/${token}`, { password });
            set({ message: response.data.message, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error.response.data.message || "Error resetting password",
            });
            throw error;
        }
    },

    getAdminData: async () => {
        set({ isLoading: true, error: null });
        try {
            await axios.get(`${API_URL}/me`);
            set({ isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Error fetching admin data",
                isLoading: false,
            });
            throw error;
        }
    },

    updateProfile: async (formData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(`${API_URL}/update-profile`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            set({ user: response?.data?.user, isLoading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || "Erreur lors de la mise à jour du profil", isLoading: false });
            throw error;
        }
    },
}));