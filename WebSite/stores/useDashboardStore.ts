import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** Available dashboard view sections */
export type DashboardView = 'overview' | 'audits' | 'businesses' | 'settings';

/**
 * Dashboard filter options.
 * Dates are ISO strings for serialization safety.
 */
export interface DashboardFilters {
  /** Start date filter (ISO 8601 string) */
  dateStart: string | null;
  /** End date filter (ISO 8601 string) */
  dateEnd: string | null;
  /** Status filter (e.g., ['completed', 'pending']) */
  status: string[];
  /** Search query string */
  search: string;
}

/**
 * Dashboard store state and actions.
 * Manages sidebar state, active view, and filter settings.
 */
export interface DashboardState {
  /** Whether the sidebar is collapsed */
  isSidebarCollapsed: boolean;
  /** Currently active dashboard section */
  activeView: DashboardView;
  /** Current filter settings */
  filters: DashboardFilters;

  // Actions (verb-first naming convention)
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveView: (view: DashboardView) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  clearFilters: () => void;
}

/** Default filter values */
const initialFilters: DashboardFilters = {
  dateStart: null,
  dateEnd: null,
  status: [],
  search: '',
};

/** Initial state values with explicit typing */
const initialState: Pick<DashboardState, 'isSidebarCollapsed' | 'activeView' | 'filters'> = {
  isSidebarCollapsed: false,
  activeView: 'overview',
  filters: initialFilters,
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      ...initialState,

      toggleSidebar: () => set(
        (state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }),
        false,
        'toggleSidebar'
      ),
      setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }, false, 'setSidebarCollapsed'),
      setActiveView: (activeView) => set({ activeView }, false, 'setActiveView'),
      setFilters: (newFilters) => set(
        (state) => ({ filters: { ...state.filters, ...newFilters } }),
        false,
        'setFilters'
      ),
      clearFilters: () => set({ filters: initialFilters }, false, 'clearFilters'),
    }),
    { name: 'DashboardStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
