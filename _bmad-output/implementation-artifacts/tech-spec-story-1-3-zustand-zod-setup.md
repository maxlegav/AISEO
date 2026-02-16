---
title: "Setup Zustand State Management and Zod Validation"
slug: "story-1-3-zustand-zod-setup"
created: "2026-01-29"
status: "completed"
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - next@16.1.4
  - react@19.2.3
  - typescript@5.8.3 (strict mode)
  - zustand@4.x (TO INSTALL)
  - zod@3.22.2 (installed)
  - mongoose@7.4.4
files_to_modify:
  - WebSite/package.json (add zustand)
  - WebSite/stores/useUserStore.ts (CREATE)
  - WebSite/stores/useAuditStore.ts (CREATE)
  - WebSite/stores/useDashboardStore.ts (CREATE)
  - WebSite/stores/index.ts (CREATE - barrel export)
  - WebSite/types/audit.ts (CREATE - placeholder)
  - WebSite/lib/validation/common.ts (CREATE)
  - WebSite/lib/validation/user.ts (CREATE)
  - WebSite/lib/validation/index.ts (CREATE - barrel export)
  - WebSite/lib/validation/helpers.ts (CREATE - Zod-ApiError bridge)
  - _bmad-output/project-context.md (UPDATE - add examples)
code_patterns:
  - verb-first-actions (setUser, updateProgress, clearAudit)
  - zustand-selectors (const x = useStore(s => s.x))
  - zustand-devtools (development only)
  - zustand-persist-ssr (skipHydration pattern)
  - zod-type-inference (z.infer<typeof Schema>)
  - zod-safeParse (API route pattern)
  - barrel-exports (index.ts re-exports)
  - path-alias (@/stores, @/lib/validation)
test_patterns:
  - No test framework configured yet (Story 1.5)
adversarial_review:
  - completed: true
  - findings_addressed: 12
---

# Tech-Spec: Setup Zustand State Management and Zod Validation

**Created:** 2026-01-29
**Story:** 1.3 (Epic 1: Project Foundation & Infrastructure)
**Status:** Ready for Development (Post-Adversarial Review)

## Overview

### Problem Statement

ShowYourBrand needs a state management foundation (Zustand) and API validation layer (Zod) to enable predictable frontend state and runtime type safety across the app. Currently, no stores or validation schemas exist, leaving the app without standardized patterns for state and input validation.

### Solution

- Install Zustand 4.x and create 3 stores with verb-first action naming
- Add `persist` middleware to `useUserStore` with SSR-safe hydration
- Add `devtools` middleware for debugging in development
- Create minimal Zod schemas with TypeScript type inference
- Create Zod-to-ApiError bridge for consistent error handling
- Organize schemas by domain in `lib/validation/`
- Export reusable TypeScript types from all schemas

### Scope

**In Scope:**

- Install Zustand 4.x with persist and devtools middleware
- Create `stores/useUserStore.ts` with SSR-safe persistence (theme only)
- Create `stores/useAuditStore.ts` (current audit, progress, polling state)
- Create `stores/useDashboardStore.ts` (sidebar, filters, view state)
- Create `types/audit.ts` with placeholder Audit interface
- Create `lib/validation/user.ts` (login, signup schemas)
- Create `lib/validation/common.ts` (ObjectIdString, Pagination schemas)
- Create `lib/validation/helpers.ts` (Zod-to-ApiError bridge)
- Export reusable TypeScript types from all schemas
- Update project-context.md with concrete validation examples

**Out of Scope:**

- Full API validation suite (tracked as future task)
- Complex store logic (audit polling implementation is Story 4.x)
- Business/Audit domain schemas (will come with their epics)
- Migrating LanguageContext to Zustand (keep existing, working solution)
- i18n for validation error messages (noted as future enhancement)

## Context for Development

### Codebase Patterns

**Existing Patterns Found:**

1. **Error Handling** (`lib/error-handler.ts`):
   - `ErrorType` enum with standardized error types
   - `ApiError` class extends Error
   - `handleApiError()` returns `{ success: false, error, message }`
   - **NEW**: Zod validation errors will be converted via `handleZodError()` helper

2. **Type Organization** (`types/`):
   - Barrel export pattern in `types/index.ts`
   - Types defined per domain (`FAQ.ts`)
   - NextAuth types extended in `next-auth.d.ts`
   - **NEW**: Add `audit.ts` with placeholder interface

3. **Language/Persistence** (`components/LanguageContext.tsx`):
   - Already uses localStorage for language preference
   - Pattern: `localStorage.getItem/setItem("language")`
   - **Decision**: Keep LanguageContext, don't migrate to Zustand

4. **Path Alias** (`tsconfig.json`):
   - `@/*` maps to project root
   - Use: `import { useUserStore } from '@/stores'`

5. **Component Organization**:
   - Domain folders: `components/dashboard/`, `components/ui/`
   - Matches architecture requirement for domain-based organization

### Files to Reference

| File                              | Purpose                                                       |
| --------------------------------- | ------------------------------------------------------------- |
| `lib/error-handler.ts`            | Error types, ApiError class - Zod errors integrate via helper |
| `types/index.ts`                  | Barrel export pattern for types                               |
| `components/LanguageContext.tsx`  | Existing localStorage pattern (don't duplicate for language)  |
| `models/User.ts`                  | UserDocument interface - reference for user-related schemas   |
| `tsconfig.json`                   | Path alias `@/*`, strict mode settings                        |
| `_bmad-output/project-context.md` | Architecture patterns to follow                               |

### Technical Decisions

1. **Zustand persist with SSR safety**: Use `skipHydration: true` to prevent hydration mismatch

   ```typescript
   // Pattern for SSR-safe hydration
   persist(storeConfig, {
     name: "user-store",
     skipHydration: true,
     partialize: (state) => ({ theme: state.theme }),
   });

   // In _app.tsx or layout, call after mount:
   useEffect(() => {
     useUserStore.persist.rehydrate();
   }, []);
   ```

2. **Zustand devtools**: Enable in development only

   ```typescript
   const useStore = create<State>()(
     devtools(
       persist(...),
       { name: 'UserStore', enabled: process.env.NODE_ENV === 'development' }
     )
   );
   ```

3. **Store organization**: New `stores/` folder at project root
   - `stores/useUserStore.ts`
   - `stores/useAuditStore.ts`
   - `stores/useDashboardStore.ts`
   - `stores/index.ts` (barrel export + resetAllStores utility)

4. **Validation organization**: `lib/validation/` folder
   - `lib/validation/common.ts` (id, pagination, reusable primitives)
   - `lib/validation/user.ts` (login, signup)
   - `lib/validation/helpers.ts` (Zod-to-ApiError bridge)
   - `lib/validation/index.ts` (barrel export + all types)

5. **Type naming**: Avoid collision with mongoose
   - Use `ObjectIdString` instead of `ObjectId` to avoid mongoose collision

6. **Date handling in stores**: Use ISO strings, not Date objects
   - Zustand persist serializes to JSON; Date objects become strings
   - Store dates as `string | null` and convert when needed

7. **Action naming**: Verb-first pattern per architecture
   - `setTheme`, `setCurrentAudit`, `updateProgress`, `clearAudit`
   - `toggleSidebar`, `setFilters`, `clearFilters`, `resetAllStores`

8. **Selector pattern**: Always use selectors for performance

   ```typescript
   // Good
   const theme = useUserStore((s) => s.theme);
   // Avoid
   const { theme } = useUserStore();
   ```

9. **Zod error handling**: Use `safeParse` in API routes, not `parse`
   ```typescript
   const result = LoginSchema.safeParse(req.body);
   if (!result.success) {
     return handleZodError(result.error, res);
   }
   const validatedData = result.data;
   ```

---

## Implementation Plan

### Tasks

#### Phase 1: Install Dependencies

- [x] **Task 1: Install Zustand**
  - File: `WebSite/package.json`
  - Action: Run `npm install zustand`
  - Notes: Verify version 4.x installed, check no peer dependency warnings

#### Phase 2: Create Placeholder Types

- [x] **Task 2: Create placeholder Audit type**
  - File: `WebSite/types/audit.ts` (CREATE)
  - Action: Create placeholder interface for Audit (will be expanded in Epic 4)
  - Implementation:

    ```typescript
    /**
     * Placeholder Audit interface for Story 1.3
     * Full implementation comes in Epic 4 (Audit Engine)
     */
    export interface Audit {
      _id: string;
      userId: string;
      businessId: string;
      status: "pending" | "processing" | "completed" | "failed";
      geoScore: number | null;
      createdAt: string; // ISO date string
      completedAt: string | null;
    }

    export interface AuditProgress {
      current: number;
      total: number;
      stage: string;
    }
    ```

- [x] **Task 2b: Update types/index.ts**
  - File: `WebSite/types/index.ts` (UPDATE)
  - Action: Add export for audit types
  - Implementation:
    ```typescript
    export * from "./FAQ";
    export * from "./audit";
    ```

#### Phase 3: Create Zustand Stores

- [x] **Task 3: Create useUserStore with SSR-safe persistence**
  - File: `WebSite/stores/useUserStore.ts` (CREATE)
  - Action: Create store with persist + devtools middleware
  - Implementation:

    ```typescript
    import { create } from "zustand";
    import { devtools, persist } from "zustand/middleware";

    export interface UserProfile {
      id: string;
      name: string;
      email: string;
    }

    export type Theme = "light" | "dark" | "system";
    export type SubscriptionTier = "none" | "basic" | "pro" | "premium";

    export interface UserState {
      // State
      theme: Theme;
      userProfile: UserProfile | null;
      subscriptionTier: SubscriptionTier;

      // Actions (verb-first)
      setTheme: (theme: Theme) => void;
      setUserProfile: (profile: UserProfile | null) => void;
      setSubscriptionTier: (tier: SubscriptionTier) => void;
      clearUser: () => void;
    }

    const initialState = {
      theme: "system" as Theme,
      userProfile: null,
      subscriptionTier: "none" as SubscriptionTier,
    };

    export const useUserStore = create<UserState>()(
      devtools(
        persist(
          (set) => ({
            ...initialState,

            setTheme: (theme) => set({ theme }, false, "setTheme"),
            setUserProfile: (userProfile) =>
              set({ userProfile }, false, "setUserProfile"),
            setSubscriptionTier: (subscriptionTier) =>
              set({ subscriptionTier }, false, "setSubscriptionTier"),
            clearUser: () => set(initialState, false, "clearUser"),
          }),
          {
            name: "user-store",
            skipHydration: true, // SSR-safe: manually rehydrate on client
            partialize: (state) => ({ theme: state.theme }), // Only persist theme
          },
        ),
        { name: "UserStore", enabled: process.env.NODE_ENV === "development" },
      ),
    );
    ```

  - Notes: Must call `useUserStore.persist.rehydrate()` in \_app.tsx useEffect

- [x] **Task 4: Create useAuditStore**
  - File: `WebSite/stores/useAuditStore.ts` (CREATE)
  - Action: Create store for audit state management
  - Implementation:

    ```typescript
    import { create } from "zustand";
    import { devtools } from "zustand/middleware";
    import type { Audit, AuditProgress } from "@/types";

    export interface AuditState {
      // State
      currentAudit: Audit | null;
      auditProgress: AuditProgress | null;
      isPolling: boolean;
      auditHistory: Audit[];

      // Actions (verb-first)
      setCurrentAudit: (audit: Audit | null) => void;
      updateProgress: (progress: AuditProgress | null) => void;
      setPolling: (isPolling: boolean) => void;
      setAuditHistory: (audits: Audit[]) => void;
      clearAudit: () => void;
    }

    const initialState = {
      currentAudit: null,
      auditProgress: null,
      isPolling: false,
      auditHistory: [],
    };

    export const useAuditStore = create<AuditState>()(
      devtools(
        (set) => ({
          ...initialState,

          setCurrentAudit: (currentAudit) =>
            set({ currentAudit }, false, "setCurrentAudit"),
          updateProgress: (auditProgress) =>
            set({ auditProgress }, false, "updateProgress"),
          setPolling: (isPolling) => set({ isPolling }, false, "setPolling"),
          setAuditHistory: (auditHistory) =>
            set({ auditHistory }, false, "setAuditHistory"),
          clearAudit: () => set(initialState, false, "clearAudit"),
        }),
        { name: "AuditStore", enabled: process.env.NODE_ENV === "development" },
      ),
    );
    ```

  - Notes: No persistence - session only

- [x] **Task 5: Create useDashboardStore**
  - File: `WebSite/stores/useDashboardStore.ts` (CREATE)
  - Action: Create store for dashboard UI state
  - Implementation:

    ```typescript
    import { create } from "zustand";
    import { devtools } from "zustand/middleware";

    export type DashboardView =
      | "overview"
      | "audits"
      | "businesses"
      | "settings";

    export interface DashboardFilters {
      dateStart: string | null; // ISO string, not Date (serialization-safe)
      dateEnd: string | null;
      status: string[];
      search: string;
    }

    export interface DashboardState {
      // State
      isSidebarCollapsed: boolean;
      activeView: DashboardView;
      filters: DashboardFilters;

      // Actions (verb-first)
      toggleSidebar: () => void;
      setSidebarCollapsed: (collapsed: boolean) => void;
      setActiveView: (view: DashboardView) => void;
      setFilters: (filters: Partial<DashboardFilters>) => void;
      clearFilters: () => void;
    }

    const initialFilters: DashboardFilters = {
      dateStart: null,
      dateEnd: null,
      status: [],
      search: "",
    };

    const initialState = {
      isSidebarCollapsed: false,
      activeView: "overview" as DashboardView,
      filters: initialFilters,
    };

    export const useDashboardStore = create<DashboardState>()(
      devtools(
        (set) => ({
          ...initialState,

          toggleSidebar: () =>
            set(
              (state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }),
              false,
              "toggleSidebar",
            ),
          setSidebarCollapsed: (isSidebarCollapsed) =>
            set({ isSidebarCollapsed }, false, "setSidebarCollapsed"),
          setActiveView: (activeView) =>
            set({ activeView }, false, "setActiveView"),
          setFilters: (newFilters) =>
            set(
              (state) => ({ filters: { ...state.filters, ...newFilters } }),
              false,
              "setFilters",
            ),
          clearFilters: () =>
            set({ filters: initialFilters }, false, "clearFilters"),
        }),
        {
          name: "DashboardStore",
          enabled: process.env.NODE_ENV === "development",
        },
      ),
    );
    ```

  - Notes: Uses ISO strings for dates (not Date objects) to avoid serialization issues

- [x] **Task 6: Create stores barrel export with resetAllStores**
  - File: `WebSite/stores/index.ts` (CREATE)
  - Action: Create barrel export with coordinated reset utility
  - Implementation:

    ```typescript
    export { useUserStore } from "./useUserStore";
    export { useAuditStore } from "./useAuditStore";
    export { useDashboardStore } from "./useDashboardStore";

    // Re-export types
    export type {
      UserState,
      UserProfile,
      Theme,
      SubscriptionTier,
    } from "./useUserStore";
    export type { AuditState } from "./useAuditStore";
    export type {
      DashboardState,
      DashboardView,
      DashboardFilters,
    } from "./useDashboardStore";

    // Coordinated reset for logout
    import { useUserStore } from "./useUserStore";
    import { useAuditStore } from "./useAuditStore";
    import { useDashboardStore } from "./useDashboardStore";

    /**
     * Reset all stores to initial state (call on logout)
     */
    export function resetAllStores(): void {
      useUserStore.getState().clearUser();
      useAuditStore.getState().clearAudit();
      useDashboardStore.getState().clearFilters();
      useDashboardStore.getState().setActiveView("overview");
      useDashboardStore.getState().setSidebarCollapsed(false);
    }
    ```

#### Phase 4: Create Zod Validation Schemas

- [x] **Task 7: Create common validation schemas**
  - File: `WebSite/lib/validation/common.ts` (CREATE)
  - Action: Create base validation schemas used across the app
  - Implementation:

    ```typescript
    import { z } from "zod";

    // MongoDB ObjectId validation (named to avoid mongoose collision)
    export const ObjectIdStringSchema = z
      .string()
      .regex(/^[a-f\d]{24}$/i, "Invalid ID format");
    export type ObjectIdString = z.infer<typeof ObjectIdStringSchema>;

    // Common ID param for API routes
    export const IdParamSchema = z.object({
      id: ObjectIdStringSchema,
    });
    export type IdParam = z.infer<typeof IdParamSchema>;

    // Pagination schema with coercion for query params
    export const PaginationSchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    });
    export type PaginationInput = z.infer<typeof PaginationSchema>;

    // Email validation (reusable) - applies lowercase + trim
    export const EmailSchema = z
      .string()
      .email("Invalid email address")
      .toLowerCase()
      .trim();

    // Password validation (reusable)
    export const PasswordSchema = z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password too long");
    ```

- [x] **Task 8: Create user validation schemas**
  - File: `WebSite/lib/validation/user.ts` (CREATE)
  - Action: Create login and signup validation schemas
  - Implementation:

    ```typescript
    import { z } from "zod";
    import { EmailSchema, PasswordSchema } from "./common";

    // Login schema - password just needs to be present (don't enforce rules on login)
    export const LoginSchema = z.object({
      email: EmailSchema,
      password: z.string().min(1, "Password is required"),
    });
    export type LoginInput = z.infer<typeof LoginSchema>;

    // Signup schema - full password validation + confirmation match
    export const SignupSchema = z
      .object({
        name: z
          .string()
          .min(2, "Name must be at least 2 characters")
          .max(100)
          .trim(),
        email: EmailSchema,
        password: PasswordSchema,
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    export type SignupInput = z.infer<typeof SignupSchema>;

    // Update profile schema
    export const UpdateProfileSchema = z.object({
      name: z.string().min(2).max(100).trim().optional(),
      company: z.string().max(200).trim().optional(),
    });
    export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
    ```

- [x] **Task 9: Create Zod-to-ApiError bridge helper**
  - File: `WebSite/lib/validation/helpers.ts` (CREATE)
  - Action: Create helper to convert ZodError to API response
  - Implementation:

    ```typescript
    import { NextApiResponse } from "next";
    import { ZodError } from "zod";
    import { ErrorType } from "@/lib/error-handler";

    /**
     * Format Zod errors into a user-friendly structure
     */
    export function formatZodErrors(error: ZodError): Record<string, string> {
      const errors: Record<string, string> = {};

      for (const issue of error.issues) {
        const path = issue.path.join(".");
        // Only keep first error per field
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      }

      return errors;
    }

    /**
     * Handle Zod validation error and return API response
     * Use with safeParse() pattern in API routes
     *
     * @example
     * const result = LoginSchema.safeParse(req.body);
     * if (!result.success) {
     *   return handleZodError(result.error, res);
     * }
     * const validatedData = result.data;
     */
    export function handleZodError(
      error: ZodError,
      res: NextApiResponse,
      customMessage?: string,
    ) {
      const fieldErrors = formatZodErrors(error);

      return res.status(400).json({
        success: false,
        error: ErrorType.VALIDATION,
        message: customMessage || "Validation failed",
        details: fieldErrors,
      });
    }

    /**
     * Type guard to check if error is ZodError
     */
    export function isZodError(error: unknown): error is ZodError {
      return error instanceof ZodError;
    }
    ```

- [x] **Task 10: Create validation barrel export**
  - File: `WebSite/lib/validation/index.ts` (CREATE)
  - Action: Create barrel export for all schemas, types, and helpers
  - Implementation:

    ```typescript
    // Common schemas
    export {
      ObjectIdStringSchema,
      IdParamSchema,
      PaginationSchema,
      EmailSchema,
      PasswordSchema,
    } from "./common";

    // Common types
    export type { ObjectIdString, IdParam, PaginationInput } from "./common";

    // User schemas
    export { LoginSchema, SignupSchema, UpdateProfileSchema } from "./user";

    // User types
    export type { LoginInput, SignupInput, UpdateProfileInput } from "./user";

    // Helpers
    export { formatZodErrors, handleZodError, isZodError } from "./helpers";
    ```

#### Phase 5: Documentation & Verification

- [x] **Task 11: Update project-context.md with validation examples**
  - File: `_bmad-output/project-context.md` (UPDATE)
  - Action: Find section "## Dual Validation Pattern" (around line 1653) and add concrete examples
  - Changes to add after existing content:

    ````markdown
    ### Concrete Implementation Examples (Story 1.3)

    **Import Pattern:**

    ```typescript
    import {
      LoginSchema,
      type LoginInput,
      handleZodError,
    } from "@/lib/validation";
    ```
    ````

    **API Route Pattern (safeParse):**

    ```typescript
    import { LoginSchema, handleZodError } from "@/lib/validation";
    import { handleApiError } from "@/lib/error-handler";

    export default async function handler(
      req: NextApiRequest,
      res: NextApiResponse,
    ) {
      try {
        // 1. Sanitize input
        req.body = sanitizeInput(req.body);

        // 2. Zod validation with safeParse (doesn't throw)
        const result = LoginSchema.safeParse(req.body);
        if (!result.success) {
          return handleZodError(result.error, res);
        }

        // 3. Use validated data (fully typed)
        const { email, password } = result.data;

        // 4. Mongoose handles DB-level validation
        const user = await User.findOne({ email });
        // ... rest of logic
      } catch (error) {
        return handleApiError(error, res);
      }
    }
    ```

    ```

    ```

  - Notes: If section doesn't exist exactly, create it under "## Data Patterns"

- [x] **Task 12: Add SSR rehydration to \_app.tsx**
  - File: `WebSite/pages/_app.tsx` (UPDATE)
  - Action: Add useEffect to rehydrate persisted stores on client
  - Changes to add:

    ```typescript
    import { useEffect } from "react";
    import { useUserStore } from "@/stores";

    // Inside App component:
    useEffect(() => {
      useUserStore.persist.rehydrate();
    }, []);
    ```

  - Notes: This prevents SSR hydration mismatch with localStorage

- [x] **Task 13: Verify build passes**
  - Action: Run `npm run build` to ensure no TypeScript errors
  - Notes: Fix any strict mode violations before marking complete

---

## Acceptance Criteria

### Zustand Stores

- [ ] **AC1**: Given Zustand is installed, when I import `useUserStore` from `@/stores`, then the store is available with `theme`, `userProfile`, and `subscriptionTier` state
- [ ] **AC2**: Given the app loads on client, when `persist.rehydrate()` is called in \_app.tsx, then `theme` preference loads from localStorage without hydration mismatch
- [ ] **AC3**: Given I use `useAuditStore`, when I call `setCurrentAudit(audit)`, then `currentAudit` state updates and components re-render
- [ ] **AC4**: Given I use `useDashboardStore`, when I call `toggleSidebar()`, then `isSidebarCollapsed` toggles between true/false
- [ ] **AC5**: Given all stores exist, when I import from `@/stores`, then all stores, types, and `resetAllStores()` are available

### Zod Validation

- [ ] **AC6**: Given I import `LoginSchema`, when I call `LoginSchema.safeParse({ email: 'TEST@Example.com', password: 'pass' })`, then `result.success` is true and `result.data.email` is `'test@example.com'` (lowercased + trimmed)
- [ ] **AC7**: Given I import `LoginSchema`, when I call `LoginSchema.safeParse({ email: 'invalid', password: '' })`, then `result.success` is false and `result.error.issues` contains field-specific messages
- [ ] **AC8**: Given I import `SignupSchema`, when passwords don't match, then `safeParse` returns error with "Passwords do not match" on `confirmPassword` path
- [ ] **AC9**: Given I import `PaginationSchema`, when I pass `{ page: '2', limit: '50' }`, then it coerces to `{ page: 2, limit: 50, sortOrder: 'desc' }`
- [ ] **AC10**: Given I call `handleZodError(zodError, res)`, then response is `{ success: false, error: 'VALIDATION_ERROR', message: '...', details: { field: 'error' } }`

### Type Safety

- [ ] **AC11**: Given all schemas exist, when I import types like `LoginInput`, then TypeScript provides full type inference with no `any` types
- [ ] **AC12**: Given `Audit` type exists in `types/audit.ts`, when I use it in `useAuditStore`, then TypeScript recognizes all properties

### Documentation

- [ ] **AC13**: Given project-context.md is updated, when a developer reads it, then they see concrete Zod safeParse examples with handleZodError integration

### Build Verification

- [ ] **AC14**: Given all files are created, when I run `npm run build`, then the build completes with no TypeScript errors or hydration warnings

---

## Additional Context

### Dependencies

**To Install:**

```bash
cd WebSite && npm install zustand
```

**Already Installed:**

- zod@3.22.2

**No External Dependencies:**

- Stores don't call APIs directly (that's component responsibility)
- Schemas are pure validation (no database calls)

### Testing Strategy

**Manual Testing (No test framework yet - Story 1.5):**

1. **Store Testing:**
   - Import stores in a test component
   - Verify state updates trigger re-renders
   - Verify persist middleware saves to localStorage (check DevTools > Application > Local Storage)
   - Open Redux DevTools (Zustand compatible) to see state changes
   - Test SSR: no console errors about hydration mismatch

2. **Schema Testing:**
   - Create a test file with sample validation calls using safeParse
   - Verify valid data returns `{ success: true, data: {...} }`
   - Verify invalid data returns `{ success: false, error: ZodError }`
   - Test edge cases (empty strings, boundary values, email casing)

3. **Integration Testing:**
   - Call `resetAllStores()` and verify all stores reset
   - Test `handleZodError()` returns correct response format

**Future Testing (After Story 1.5):**

- Unit tests for store actions
- Unit tests for schema validation edge cases
- Integration tests for persist middleware + SSR

### Notes

**Findings Addressed from Adversarial Review:**

1. F1: Added `skipHydration: true` + rehydrate pattern for SSR safety
2. F2: Created `types/audit.ts` with placeholder Audit interface
3. F3: Created `lib/validation/helpers.ts` with `handleZodError()` bridge
4. F4: Changed Date to `string | null` (ISO strings) in DashboardFilters
5. F5: Added explicit `initialState` objects for all stores
6. F6: Renamed to `ObjectIdStringSchema` to avoid mongoose collision
7. F7: Noted i18n for validation as out of scope (future enhancement)
8. F8: Added safeParse examples throughout, updated ACs
9. F9: Fixed AC6 to verify email transformation
10. F10: Added `resetAllStores()` utility for coordinated logout
11. F11: Made Task 11 more specific with line number hint
12. F12: Added devtools middleware to all stores

**Known Limitations:**

- Validation error messages are English-only (i18n deferred)
- Audit type is placeholder - full implementation in Epic 4

**Future Considerations (Out of Scope):**

- Migrate LanguageContext to Zustand (not recommended - works fine)
- i18n for Zod error messages (add in future when needed)
- Expand validation schemas for all API endpoints (tracked as future task)

### Future Task to Create

**Title:** Expand Zod schemas for full API coverage
**Priority:** Medium
**Epic:** 2-4 (as API routes are built)
**Description:** Add validation schemas for all API endpoints:

- CreateBusinessSchema, UpdateBusinessSchema
- CreateAuditSchema, UpdateAuditStatusSchema
- SubscriptionSchema, WebhookPayloadSchemas
- All schemas should export TypeScript types
- Consider i18n strategy for error messages

---

## Review Notes

**Adversarial Review Completed:** 2026-01-29
**Findings:** 10 total, 9 fixed, 1 skipped (noise)
**Resolution Approach:** Auto-fix

### Fixes Applied:

- F1: Restructured stores/index.ts to avoid duplicate imports
- F2: Added JSDoc comments to all store interfaces and types
- F3: Enhanced PasswordSchema with uppercase, lowercase, digit requirements
- F4: Added detailed placeholder comment to Audit type
- F5: Added ISODateStringSchema for date validation
- F6: Fixed formatZodErrors to handle root-level errors with `_root` key
- F8: Added explicit typing to all initialState objects
- F9: Re-exported Audit/AuditProgress types from stores barrel
- F10: Documented UpdateProfileSchema PATCH semantics

### Skipped:

- F7 (noise): Zustand 5.x installed instead of 4.x - backwards compatible, no action needed
