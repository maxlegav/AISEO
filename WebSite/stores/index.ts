// Import stores once for both export and use in resetAllStores
import { useUserStore } from './useUserStore';
import { useAuditStore } from './useAuditStore';
import { useDashboardStore } from './useDashboardStore';
import { useWaitlistModalStore } from './useWaitlistModalStore';

// Export stores
export { useUserStore, useAuditStore, useDashboardStore, useWaitlistModalStore };

// Re-export store types
export type { UserState, UserProfile, Theme, SubscriptionTier } from './useUserStore';
export type { AuditState } from './useAuditStore';
export type { DashboardState, DashboardView, DashboardFilters } from './useDashboardStore';
export type { WaitlistModalState } from './useWaitlistModalStore';

// Re-export Audit types for convenience (F9 fix)
export type { Audit, AuditProgress } from '@/types';

/**
 * Reset all stores to initial state.
 * Call this on user logout to clear sensitive data.
 */
export function resetAllStores(): void {
  useUserStore.getState().clearUser();
  useAuditStore.getState().clearAudit();
  useDashboardStore.getState().clearFilters();
  useDashboardStore.getState().setActiveView('overview');
  useDashboardStore.getState().setSidebarCollapsed(false);
}
