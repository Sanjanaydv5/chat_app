import { create } from "zustand";
import {persist} from "zustand/middleware";


const useUserStore = create(
    persist(
        (set) => ({
            user:null,
            isAuthenticated:false,
            setStep:(userData) => set({user: userData,isAuthenticated:true}),
            cleanUser : () => set({ user:null, isAuthenticated:false }),
        }),
        {
            name:"user-storage",
            getStorage: () => localStorage
        }
    )
);

export default useUserStore;