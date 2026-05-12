import { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { getEntityBranding } from './services/api';
import { canAccess } from './utils/permissions';
import { Dashboard } from './pages/Dashboard';
import { AuditFindings } from './pages/AuditFindings';
import { IFWERegister } from './pages/IFWERegister';
import { BudgetMonitor } from './pages/BudgetMonitor';
import { SCMCompliance } from './pages/SCMCompliance';
import { AssetVerification } from './pages/AssetVerification';
import { ConsequenceManagement } from './pages/ConsequenceManagement';
import { DelegationAuthority } from './pages/DelegationAuthority';
import { PolicyCompliance } from './pages/PolicyCompliance';
import { Section71 } from './pages/Section71';
import { PerformanceKPI } from './pages/PerformanceKPI';
import { ExecutivePortal } from './pages/ExecutivePortal';
import { Settings } from './pages/Settings';
import { FindingWorkflow } from './pages/FindingWorkflow';
import { Administration } from './pages/Administration';

interface UserInfo {
  user_id: number;
  full_name: string;
  role: string;
  entity_id: number;
}

export default function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [entityName, setEntityName] = useState('');
  const [entityLogo, setEntityLogo] = useState<string | null>(null);

  const loadBranding = () => {
    getEntityBranding()
      .then((res) => {
        setEntityName(res.data.entity_name);
        setEntityLogo(res.data.logo_path);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const stored = localStorage.getItem('psfgs_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    loadBranding();
  }, []);

  const handleLogin = (userInfo: UserInfo) => {
    setUser(userInfo);
    localStorage.setItem('psfgs_user', JSON.stringify(userInfo));
    loadBranding();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('psfgs_token');
    localStorage.removeItem('psfgs_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    if (!canAccess(user.role, currentPage)) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: '#1e293b', marginBottom: 8 }}>Access Restricted</h2>
          <p style={{ color: '#64748b' }}>
            Your role (<strong>{user.role.replace(/_/g, ' ')}</strong>) does not have permission to view this page.
          </p>
        </div>
      );
    }
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'aft': return <AuditFindings />;
      case 'avs': return <AssetVerification />;
      case 'bvm': return <BudgetMonitor />;
      case 'ifw': return <IFWERegister />;
      case 'scc': return <SCMCompliance />;
      case 'cmt': return <ConsequenceManagement />;
      case 'dar': return <DelegationAuthority />;
      case 'pcr': return <PolicyCompliance />;
      case 's71': return <Section71 />;
      case 'pkd': return <PerformanceKPI />;
      case 'erp': return <ExecutivePortal />;
      case 'settings': return <Settings onBrandingChange={loadBranding} />;
      case 'workflow': return <FindingWorkflow />;
      case 'admin': return <Administration />;
      default: return <Dashboard />;
    }
  };

  const pageTitle: Record<string, string> = {
    dashboard: 'Executive Dashboard',
    aft: 'Audit Findings Tracker',
    avs: 'Asset Verification System',
    bvm: 'Budget vs Actual Monitor',
    ifw: 'IFWE Register',
    scc: 'SCM Compliance Checker',
    cmt: 'Consequence Management Tracker',
    dar: 'Delegation of Authority Register',
    pcr: 'Policy Compliance Manager',
    s71: 'Section 71 Auto-Generator',
    pkd: 'Performance KPI Dashboard',
    erp: 'Executive Reporting Portal',
    settings: 'Entity Settings',
    workflow: 'Finding Workflow Diagram',
    admin: 'Administration',
  };

  return (
    <div className="app-shell">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} entityName={entityName} entityLogo={entityLogo} userRole={user.role} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">{pageTitle[currentPage] || 'PSFGS'}</div>
          <div className="topbar-user">
            {user.full_name} &middot; {user.role.replace(/_/g, ' ')}
          </div>
        </div>
        <div className="content-area">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
