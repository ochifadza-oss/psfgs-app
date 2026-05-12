import { canAccess } from '../utils/permissions';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  entityName?: string;
  entityLogo?: string | null;
  userRole?: string;
}

const navItems = [
  { section: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', icon: '|||' },
    { id: 'workflow', label: 'Finding Workflow', icon: 'WF' },
  ]},
  { section: 'Domain A - Audit Readiness', items: [
    { id: 'aft', label: 'Audit Findings (AFT)', icon: 'AF' },
    { id: 'avs', label: 'Asset Verification (AVS)', icon: 'AV' },
  ]},
  { section: 'Domain B - Financial Control', items: [
    { id: 'bvm', label: 'Budget Monitor (BVM)', icon: 'BV' },
    { id: 'ifw', label: 'IFWE Register (IFW)', icon: 'IF' },
  ]},
  { section: 'Domain C - Reporting', items: [
    { id: 'erp', label: 'Executive Portal (ERP)', icon: 'EP' },
    { id: 's71', label: 'Section 71 (S71)', icon: 'S7' },
    { id: 'pkd', label: 'Performance KPIs (PKD)', icon: 'PK' },
  ]},
  { section: 'Domain D - Compliance', items: [
    { id: 'scc', label: 'SCM Compliance (SCC)', icon: 'SC' },
    { id: 'cmt', label: 'Consequence Mgmt (CMT)', icon: 'CM' },
    { id: 'dar', label: 'Delegations (DAR)', icon: 'DA' },
    { id: 'pcr', label: 'Policy Compliance (PCR)', icon: 'PC' },
  ]},
  { section: 'System', items: [
    { id: 'admin', label: 'Administration', icon: '⚙' },
  ]},
];

export function Sidebar({ currentPage, onNavigate, onLogout, entityName, entityLogo, userRole = '' }: SidebarProps) {
  const allowed = (pageId: string) => canAccess(userRole, pageId);
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        {entityLogo && (
          <img
            src={entityLogo}
            alt={entityName}
            style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 8, borderRadius: 8, background: 'rgba(255,255,255,0.12)', padding: 4 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        {!entityLogo && <h1>PSFGS</h1>}
        <p style={{ fontSize: entityLogo ? 11 : undefined, lineHeight: 1.3 }}>
          {entityName || 'Municipality'}
        </p>
      </div>
      {navItems.map((section) => {
        const visibleItems = section.items.filter((item) => allowed(item.id));
        if (visibleItems.length === 0) return null;
        return (
        <div className="sidebar-section" key={section.section}>
          <div className="sidebar-section-label">{section.section}</div>
          {visibleItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <div className="nav-icon" style={{ fontSize: '9px', fontWeight: 700 }}>{item.icon}</div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        );
      })}
      <div style={{ marginTop: 'auto', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {allowed('settings') && (
          <button
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
          >
            <div className="nav-icon" style={{ fontSize: '9px', fontWeight: 700 }}>ST</div>
            <span>Settings</span>
          </button>
        )}
        <button className="nav-item" onClick={onLogout}>
          <div className="nav-icon" style={{ fontSize: '9px', fontWeight: 700 }}>X</div>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
