import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface WaitlistModalState {
  isOpen: boolean;
  openWaitlistModal: () => void;
  closeWaitlistModal: () => void;
}

export const useWaitlistModalStore = create<WaitlistModalState>()(
  devtools(
    (set) => ({
      isOpen: false,
      openWaitlistModal: () => set({ isOpen: true }, false, 'openWaitlistModal'),
      closeWaitlistModal: () => set({ isOpen: false }, false, 'closeWaitlistModal'),
    }),
    { name: 'WaitlistModalStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
