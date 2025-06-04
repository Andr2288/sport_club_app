import { create } from "zustand"
import { axiosInstance } from "../lib/axios.js";

export const useAuthStore = create((set) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,

    setAuthUser: (user) => set({ authUser: user }),

    setIsSigningUp: (value) => set({ isSigningUp: value }),

    setIsLoggingIn: (value) => set({ isLoggingIn: value }),

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });
        } catch (error) {
            set({ authUser: null });
            console.log("Error in checkAuth", error);
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
        } catch (error) {
            console.log("Error in logout", error);
        }
    }
}));