import { getSession } from "@avenire/auth/client";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
}

interface Error {
  code?: string;
  message?: string;
  status: number;
  statusText: string;
}

interface UserState {
  user: User | null;
  error: Error | null;
  isPending: boolean;
}

interface UserActions {
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
}

type UserStore = UserState & UserActions;

const initialState: UserState = {
  user: null,
  error: null,
  isPending: true,
};

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser: (user) => set({ user }),

        fetchUser: async () => {
          set({ isPending: true });
          try {
            const { data, error } = await getSession();
            if (data?.user && !error) {
              set({
                user: {
                  id: data.user.id,
                  name: data.user.name,
                  username: data.user.username!,
                  email: data.user.email,
                  imageUrl: data.user.image!,
                },
                isPending: false,
                error: null,
              });
            } else {
              set({
                error,
                isPending: false,
                user: null,
              });
            }
          } catch (error) {
            set({
              error: {
                message: "Failed to fetch user",
                status: 500,
                statusText: "Internal Server Error",
              },
              isPending: false,
              user: null,
            });
          }
        },

        clearUser: () => set(initialState),
      }),
      {
        name: "user-store",
        partialize: (state) => ({ user: state.user }),
      }
    ),
    {
      name: "user-store",
    }
  )
);