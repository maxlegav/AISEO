import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/** User profile information from authentication */
export interface UserProfile {
  /** User's unique identifier */
  id: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
}

/** Theme preference options */
export type Theme = 'light' | 'dark' | 'system';

/** Subscription tier levels */
export type SubscriptionTier = 'none' | 'basic' | 'pro' | 'premium';

/**
 * User store state and actions.
 * Manages theme preferences, user profile, and subscription status.
 */
export interface UserState {
  /** Current theme preference (persisted to localStorage) */
  theme: Theme;
  /** Authenticated user's profile, null if not logged in */
  userProfile: UserProfile | null;
  /** Current subscription tier */
  subscriptionTier: SubscriptionTier;

  // Actions (verb-first naming convention)
  setTheme: (theme: Theme) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  clearUser: () => void;
}

/** Initial state values with explicit typing */
const initialState: Pick<UserState, 'theme' | 'userProfile' | 'subscriptionTier'> = {
  theme: 'system',
  userProfile: null,
  subscriptionTier: 'none',
};

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        setUserProfile: (userProfile) => set({ userProfile }, false, 'setUserProfile'),
        setSubscriptionTier: (subscriptionTier) => set({ subscriptionTier }, false, 'setSubscriptionTier'),
        clearUser: () => set(initialState, false, 'clearUser'),
      }),
      {
        name: 'user-store',
        skipHydration: true, // SSR-safe: manually rehydrate on client
        partialize: (state) => ({ theme: state.theme }), // Only persist theme
      }
    ),
    { name: 'UserStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
