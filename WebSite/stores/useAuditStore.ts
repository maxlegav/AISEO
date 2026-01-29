import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Audit, AuditProgress } from '@/types';

/**
 * Audit store state and actions.
 * Manages current audit, progress tracking, and audit history.
 */
export interface AuditState {
  /** Currently active audit being viewed or processed */
  currentAudit: Audit | null;
  /** Progress information for ongoing audit processing */
  auditProgress: AuditProgress | null;
  /** Whether the app is actively polling for audit status updates */
  isPolling: boolean;
  /** List of recent audits for the dashboard */
  auditHistory: Audit[];

  // Actions (verb-first naming convention)
  setCurrentAudit: (audit: Audit | null) => void;
  updateProgress: (progress: AuditProgress | null) => void;
  setPolling: (isPolling: boolean) => void;
  setAuditHistory: (audits: Audit[]) => void;
  clearAudit: () => void;
}

/** Initial state values with explicit typing */
const initialState: Pick<AuditState, 'currentAudit' | 'auditProgress' | 'isPolling' | 'auditHistory'> = {
  currentAudit: null,
  auditProgress: null,
  isPolling: false,
  auditHistory: [],
};

export const useAuditStore = create<AuditState>()(
  devtools(
    (set) => ({
      ...initialState,

      setCurrentAudit: (currentAudit) => set({ currentAudit }, false, 'setCurrentAudit'),
      updateProgress: (auditProgress) => set({ auditProgress }, false, 'updateProgress'),
      setPolling: (isPolling) => set({ isPolling }, false, 'setPolling'),
      setAuditHistory: (auditHistory) => set({ auditHistory }, false, 'setAuditHistory'),
      clearAudit: () => set(initialState, false, 'clearAudit'),
    }),
    { name: 'AuditStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
