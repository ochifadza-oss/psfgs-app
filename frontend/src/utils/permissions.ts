/**
 * PSFGS Role Definition & Access Control Matrix
 *
 * Roles (hierarchy high → low):
 *   System_Admin        – Full system access; entity configuration & user management
 *   Accounting_Officer  – Municipal Manager / AO; all operational modules + user management
 *   CFO                 – Chief Financial Officer; all financial & reporting modules
 *   Director            – Directorate head; operational modules within their domain
 *   Manager             – Section manager; day-to-day capture & tracking
 *   Officer             – Operational staff; capture & update within assigned modules
 *   Auditor             – Internal audit; read + comment access across all modules
 *   Viewer              – Read-only access to overview and compliance modules
 */

export type Role =
  | 'System_Admin'
  | 'Accounting_Officer'
  | 'CFO'
  | 'Director'
  | 'Manager'
  | 'Officer'
  | 'Auditor'
  | 'Viewer';

// ─── Shorthand groups ─────────────────────────────────────────────────────────
const ALL: Role[] = ['System_Admin', 'Accounting_Officer', 'CFO', 'Director', 'Manager', 'Officer', 'Auditor', 'Viewer'];
const EXEC_AND_ABOVE: Role[] = ['System_Admin', 'Accounting_Officer', 'CFO'];
const DIRECTOR_AND_ABOVE: Role[] = ['System_Admin', 'Accounting_Officer', 'CFO', 'Director'];
const MANAGER_AND_ABOVE: Role[] = ['System_Admin', 'Accounting_Officer', 'CFO', 'Director', 'Manager'];
const OPERATIONAL: Role[] = ['System_Admin', 'Accounting_Officer', 'CFO', 'Director', 'Manager', 'Officer', 'Auditor'];

/**
 * Page-level access matrix.
 * If a role is NOT listed for a page, that page is hidden in the sidebar
 * and navigation to it is blocked in App.tsx.
 */
export const PAGE_ACCESS: Record<string, Role[]> = {
  // ── Overview ────────────────────────────────────────────────────────────
  dashboard:  ALL,
  workflow:   OPERATIONAL,                        // Viewer has no workflow actions

  // ── Domain A – Audit Readiness ──────────────────────────────────────────
  aft:        OPERATIONAL,                        // Auditors & staff; Viewer excluded
  avs:        OPERATIONAL,

  // ── Domain B – Financial Control ────────────────────────────────────────
  bvm:        MANAGER_AND_ABOVE,                  // Budget data is restricted
  ifw:        OPERATIONAL,

  // ── Domain C – Reporting ────────────────────────────────────────────────
  erp:        EXEC_AND_ABOVE,                     // Executive portal: AO / CFO / Admin
  s71:        EXEC_AND_ABOVE,                     // Section 71 reports: finance leadership
  pkd:        ALL,                                // KPI dashboard is visible to all

  // ── Domain D – Compliance ───────────────────────────────────────────────
  scc:        OPERATIONAL,
  cmt:        MANAGER_AND_ABOVE,                  // Consequence management: managers up
  dar:        DIRECTOR_AND_ABOVE,                 // Delegation register: directors up
  pcr:        ALL,                                // Policy compliance: all staff

  // ── System ───────────────────────────────────────────────────────────────
  admin:      ['System_Admin', 'Accounting_Officer'],
  settings:   ['System_Admin'],                   // Entity settings: System Admin ONLY
};

/** Returns true if the given role can access the given page. */
export function canAccess(role: Role | string, page: string): boolean {
  const allowed = PAGE_ACCESS[page];
  if (!allowed) return false;
  return allowed.includes(role as Role);
}

/**
 * Human-readable role descriptions for the UI / onboarding.
 */
export const ROLE_DESCRIPTIONS: Record<Role, { label: string; description: string; colour: string }> = {
  System_Admin: {
    label: 'System Administrator',
    description: 'Full access to all modules, entity settings, and user management.',
    colour: '#7c3aed',
  },
  Accounting_Officer: {
    label: 'Accounting Officer',
    description: 'Municipal Manager level. Full operational access and user management. Cannot change entity settings.',
    colour: '#1e40af',
  },
  CFO: {
    label: 'Chief Financial Officer',
    description: 'Full access to all financial, audit, and reporting modules. No system administration.',
    colour: '#0369a1',
  },
  Director: {
    label: 'Director',
    description: 'Access to audit findings, assets, budget, IFWE, compliance, delegations, and KPIs.',
    colour: '#0f766e',
  },
  Manager: {
    label: 'Manager',
    description: 'Operational capture and tracking. Access to most modules except executive reporting and delegations.',
    colour: '#15803d',
  },
  Officer: {
    label: 'Officer',
    description: 'Day-to-day data capture in audit findings, assets, IFWE, and compliance modules.',
    colour: '#92400e',
  },
  Auditor: {
    label: 'Auditor',
    description: 'Internal audit staff. Read and comment access across all operational modules.',
    colour: '#b45309',
  },
  Viewer: {
    label: 'Viewer',
    description: 'Read-only access to dashboard, KPI dashboard, and policy compliance.',
    colour: '#64748b',
  },
};
