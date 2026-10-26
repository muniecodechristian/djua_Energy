import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5500/api/schools";

axios.defaults.withCredentials = true;

export const useSchoolStore = create((set) => ({
  schools: [],
  school: null,
  isLoading: false,
  error: null,

 createSchool: async (data) => {
  try {
    set({ isLoading: true, error: null });

    const res = await axios.post(API_URL, data); 

    set((state) => ({
      schools: [...state.schools, res.data],
      isLoading: false,
    }));

    return res.data;
  } catch (err) {
    set({
      error: err.response?.data?.message || err.message,
      isLoading: false,
    });
  }
},

  getSchools: async () => {
    try {
      set({ isLoading: true, error: null });

      const res = await axios.get(API_URL);

      set({
        schools: res.data,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        isLoading: false,
      });
    }
  },

  getSchoolById: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const res = await axios.get(`${API_URL}/${id}`);

      set({
        school: res.data,
        isLoading: false,
      });

      return res.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        isLoading: false,
      });
    }
  },

  updateSchool: async (id, data) => {
    try {
      set({ isLoading: true, error: null });

      const res = await axios.put(`${API_URL}/${id}`, data);

      set((state) => ({
        schools: state.schools.map((s) =>
          s._id === id ? res.data : s
        ),
        school: res.data,
        isLoading: false,
      }));

      return res.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        isLoading: false,
      });
    }
  },

  deleteSchool: async (id) => {
    try {
      set({ isLoading: true, error: null });

      await axios.delete(`${API_URL}/${id}`);

      set((state) => ({
        schools: state.schools.filter((s) => s._id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));