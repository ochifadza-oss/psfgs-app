import { useState, useEffect } from 'react';
import {
  getUsers, createUser, updateUser, deactivateUser,
  getDirectorates, createDirectorate, updateDirectorate,
  getAuditYears, createAuditYear, updateAuditYear,
  getKPIs, createKPI, updateQuarterly, getPKDYears,
  getDelegations, createDelegation,
  getPolicies, createPolicy, updatePolicy, deletePolicy,
  getAssets, createAsset, getAssetCategories, getLocations,
  getBudgets, createBudget,
} from '../services/api';

// ─── helpers ────────────────────────────────────────────────────────────────
const ROLES = ['System_Admin', 'Accounting_Officer', 'CFO', 'Director', 'Manager', 'Officer', 'Auditor', 'Viewer'];
const AUDIT_OPINIONS = ['Clean Audit', 'Unqualified with findings', 'Qualified', 'Adverse', 'Disclaimer'];
const DOC_TYPES = ['Policy', 'Regulation', 'Framework', 'Procedure', 'SOP', 'By-Law', 'Other'];
const FINDING_TYPES = ['Compliance', 'Financial', 'Performance', 'Internal Control', 'Procurement', 'HR', 'IT'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Written Off'];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 12px',
  border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14,
  fontFamily: 'inherit', color: '#1e293b', background: '#fff',
};

function SaveBtn({ saving, label = 'Save' }: { saving: boolean; label?: string }) {
  return (
    <button type="submit" disabled={saving} style={{
      background: saving ? '#94a3b8' : '#1e40af', color: '#fff', border: 'none',
      padding: '10px 24px', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer',
      fontWeight: 600, fontSize: 14, width: '100%', marginTop: 8
    }}>
      {saving ? 'Saving…' : label}
    </button>
  );
}

// ─── Tab definitions ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'users', label: '👤 Users', icon: '👤' },
  { id: 'directorates', label: '🏢 Directorates', icon: '🏢' },
  { id: 'financial-years', label: '📅 Financial Years', icon: '📅' },
  { id: 'kpis', label: '🎯 KPIs', icon: '🎯' },
  { id: 'delegations', label: '✍️ Delegations', icon: '✍️' },
  { id: 'assets', label: '🏗️ Assets', icon: '🏗️' },
  { id: 'policies', label: '📋 Policies & Docs', icon: '📋' },
  { id: 'budgets', label: '💰 Budgets', icon: '💰' },
];

// ════════════════════════════════════════════════════════════════════════════
// USERS TAB
// ════════════════════════════════════════════════════════════════════════════
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', full_name: '', role: 'Officer', directorate_id: 0, password: 'Admin@2026!' });

  const load = () => {
    Promise.all([getUsers(), getDirectorates()]).then(([u, d]) => {
      setUsers(u.data); setDirectorates(d.data); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ email: '', full_name: '', role: 'Officer', directorate_id: 0, password: 'Admin@2026!' }); setError(''); setShowModal(true); };
  const openEdit = (u: any) => { setEditing(u); setForm({ email: u.email, full_name: u.full_name, role: u.role, directorate_id: u.directorate_id || 0, password: '' }); setError(''); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) {
        const payload: any = { full_name: form.full_name, role: form.role, directorate_id: form.directorate_id || null };
        if (form.password) payload.password = form.password;
        await updateUser(editing.user_id, payload);
      } else {
        await createUser({ ...form, directorate_id: form.directorate_id || null });
      }
      setShowModal(false); load();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (u: any) => {
    if (!confirm(`Deactivate ${u.full_name}? They will no longer be able to log in.`)) return;
    try { await deactivateUser(u.user_id); load(); } catch (err: any) { alert(err.response?.data?.detail || 'Error'); }
  };

  const roleColor: Record<string, string> = {
    System_Admin: '#7c3aed', Accounting_Officer: '#1d4ed8', CFO: '#0369a1',
    Director: '#047857', Manager: '#065f46', Officer: '#374151', Auditor: '#b45309', Viewer: '#6b7280'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>System Users</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{users.length} active users registered</p>
        </div>
        <button onClick={openNew} className="btn-primary" style={{ padding: '9px 18px' }}>+ Add User</button>
      </div>

      {loading ? <div className="loading-spinner" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Full Name</th><th>Email</th><th>Role</th><th>Directorate</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span style={{ background: roleColor[u.role] || '#374151', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                      {u.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{u.directorate || '—'}</td>
                  <td>
                    <button onClick={() => openEdit(u)} style={{ background: '#eff6ff', border: 'none', color: '#1d4ed8', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', marginRight: 6, fontSize: 13 }}>Edit</button>
                    <button onClick={() => handleDeactivate(u)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit User' : 'Add New User'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{error}</div>}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#1e40af' }}>
              🔑 Default password: <strong>Admin@2026!</strong> — user should change on first login.
            </div>
            <FormField label="Full Name" required><input style={inp} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required /></FormField>
            <FormField label="Email Address" required><input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={!!editing} /></FormField>
            <FormField label="Role" required>
              <select style={inp} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Directorate">
              <select style={inp} value={form.directorate_id} onChange={e => setForm(f => ({ ...f, directorate_id: +e.target.value }))}>
                <option value={0}>— None —</option>
                {directorates.map(d => <option key={d.directorate_id} value={d.directorate_id}>{d.name}</option>)}
              </select>
            </FormField>
            <FormField label={editing ? 'New Password (leave blank to keep current)' : 'Password'}>
              <input style={inp} type="password" placeholder={editing ? 'Leave blank to keep current' : 'Admin@2026!'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editing} />
            </FormField>
            <SaveBtn saving={saving} label={editing ? 'Update User' : 'Create User'} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DIRECTORATES TAB
// ════════════════════════════════════════════════════════════════════════════
function DirectoratesTab() {
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', code: '', head_official: '' });

  const load = () => getDirectorates().then(r => { setDirectorates(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', code: '', head_official: '' }); setError(''); setShowModal(true); };
  const openEdit = (d: any) => { setEditing(d); setForm({ name: d.name, code: d.code || '', head_official: d.head_official || '' }); setError(''); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await updateDirectorate(editing.directorate_id, form);
      else await createDirectorate(form);
      setShowModal(false); load();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Directorates</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Organisational units used for reporting and assignment</p>
        </div>
        <button onClick={openNew} className="btn-primary" style={{ padding: '9px 18px' }}>+ Add Directorate</button>
      </div>

      {loading ? <div className="loading-spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {directorates.map(d => (
            <div key={d.directorate_id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{d.name}</div>
                  {d.code && <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', marginTop: 2 }}>{d.code}</div>}
                  {d.head_official && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>👤 {d.head_official}</div>}
                </div>
                <button onClick={() => openEdit(d)} style={{ background: '#eff6ff', border: 'none', color: '#1d4ed8', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
              </div>
            </div>
          ))}
          {directorates.length === 0 && <div style={{ color: '#94a3b8', fontStyle: 'italic', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No directorates configured yet.</div>}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Directorate' : 'Add Directorate'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{error}</div>}
            <FormField label="Directorate Name" required><input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Finance & Budget" /></FormField>
            <FormField label="Short Code"><input style={inp} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. FIN" /></FormField>
            <FormField label="Head Official (Name & Title)"><input style={inp} value={form.head_official} onChange={e => setForm(f => ({ ...f, head_official: e.target.value }))} placeholder="e.g. Mr J. Smith – Director Finance" /></FormField>
            <SaveBtn saving={saving} label={editing ? 'Update Directorate' : 'Create Directorate'} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FINANCIAL YEARS TAB
// ════════════════════════════════════════════════════════════════════════════
function FinancialYearsTab() {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ financial_year: '', audit_opinion: '', ag_letter_uploaded: false });

  const load = () => getAuditYears().then(r => { setYears(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ financial_year: '', audit_opinion: '', ag_letter_uploaded: false }); setError(''); setShowModal(true); };
  const openEdit = (y: any) => { setEditing(y); setForm({ financial_year: y.financial_year, audit_opinion: y.audit_opinion || '', ag_letter_uploaded: y.ag_letter_uploaded || false }); setError(''); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await updateAuditYear(editing.year_id, form);
      else await createAuditYear(form);
      setShowModal(false); load();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const opinionColor: Record<string, string> = {
    'Clean Audit': '#065f46', 'Unqualified with findings': '#0369a1',
    'Qualified': '#b45309', 'Adverse': '#9f1239', 'Disclaimer': '#7c2d12'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Audit Financial Years</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Financial years used in the Audit Findings Tracker</p>
        </div>
        <button onClick={openNew} className="btn-primary" style={{ padding: '9px 18px' }}>+ Add Year</button>
      </div>

      {loading ? <div className="loading-spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {years.map(y => (
            <div key={y.year_id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#1e293b' }}>{y.financial_year}</div>
                  {y.audit_opinion && (
                    <span style={{ background: opinionColor[y.audit_opinion] || '#374151', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, display: 'inline-block', marginTop: 6 }}>
                      {y.audit_opinion}
                    </span>
                  )}
                  <div style={{ marginTop: 10, fontSize: 13, color: '#64748b' }}>
                    Findings: <strong>{y.total_findings || 0}</strong> total · <strong>{y.closed_findings || 0}</strong> closed
                  </div>
                  <div style={{ fontSize: 12, color: y.ag_letter_uploaded ? '#065f46' : '#94a3b8', marginTop: 4 }}>
                    {y.ag_letter_uploaded ? '✅ AG Letter uploaded' : '⏳ AG Letter pending'}
                  </div>
                </div>
                <button onClick={() => openEdit(y)} style={{ background: '#eff6ff', border: 'none', color: '#1d4ed8', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
              </div>
            </div>
          ))}
          {years.length === 0 && <div style={{ color: '#94a3b8', fontStyle: 'italic', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No financial years added yet.</div>}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Financial Year' : 'Add Financial Year'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{error}</div>}
            <FormField label="Financial Year" required>
              <input style={inp} value={form.financial_year} onChange={e => setForm(f => ({ ...f, financial_year: e.target.value }))} required placeholder="e.g. 2024/25" disabled={!!editing} />
            </FormField>
            <FormField label="Audit Opinion">
              <select style={inp} value={form.audit_opinion} onChange={e => setForm(f => ({ ...f, audit_opinion: e.target.value }))}>
                <option value="">— Not yet determined —</option>
                {AUDIT_OPINIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </FormField>
            <FormField label="AG Management Letter">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.ag_letter_uploaded} onChange={e => setForm(f => ({ ...f, ag_letter_uploaded: e.target.checked }))} style={{ width: 16, height: 16 }} />
                AG Letter has been received and uploaded
              </label>
            </FormField>
            <SaveBtn saving={saving} label={editing ? 'Update Year' : 'Create Year'} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// KPIs TAB
// ════════════════════════════════════════════════════════════════════════════
function KPIsTab() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQModal, setShowQModal] = useState(false);
  const [editingKPI, setEditingKPI] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qForm, setQForm] = useState({ kpi_id: 0, quarter: 1, actual_achievement: 0, commentary: '' });
  const [form, setForm] = useState({
    kpi_code: '', description: '', unit_of_measure: '', annual_target: 0, financial_year: '',
    directorate_id: 0, q1_target: 0, q2_target: 0, q3_target: 0, q4_target: 0
  });

  const load = (fy?: string) => {
    setLoading(true);
    Promise.all([getKPIs(fy ? { financial_year: fy } : {}), getDirectorates(), getPKDYears()]).then(([k, d, y]) => {
      setKpis(k.data); setDirectorates(d.data); setYears(y.data || []); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleYearFilter = (fy: string) => { setSelectedYear(fy); load(fy); };

  const openNew = () => {
    setForm({ kpi_code: '', description: '', unit_of_measure: '', annual_target: 0, financial_year: selectedYear || '', directorate_id: 0, q1_target: 0, q2_target: 0, q3_target: 0, q4_target: 0 });
    setError(''); setShowModal(true);
  };

  const openQUpdate = (kpi: any) => {
    setEditingKPI(kpi);
    setQForm({ kpi_id: kpi.kpi_id, quarter: 1, actual_achievement: 0, commentary: '' });
    setShowQModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await createKPI({ ...form, directorate_id: form.directorate_id || null });
      setShowModal(false); load(selectedYear);
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to create KPI'); }
    finally { setSaving(false); }
  };

  const handleQSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await updateQuarterly(qForm.kpi_id, { quarter: qForm.quarter, actual_achievement: qForm.actual_achievement, commentary: qForm.commentary });
      setShowQModal(false); load(selectedYear);
    } catch (err: any) { alert(err.response?.data?.detail || 'Error'); }
    finally { setSaving(false); }
  };

  const tlColor: Record<string, string> = { Green: '#dcfce7', Amber: '#fef9c3', Red: '#fee2e2' };
  const tlText: Record<string, string> = { Green: '#166534', Amber: '#854d0e', Red: '#991b1b' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Key Performance Indicators</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>SDBIP / IDP KPIs with quarterly targets and actuals</p>
        </div>
        <button onClick={openNew} className="btn-primary" style={{ padding: '9px 18px' }}>+ Add KPI</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => handleYearFilter('')} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #e2e8f0', background: !selectedYear ? '#1e40af' : '#fff', color: !selectedYear ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>All Years</button>
        {years.map(y => <button key={y} onClick={() => handleYearFilter(y)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #e2e8f0', background: selectedYear === y ? '#1e40af' : '#fff', color: selectedYear === y ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>{y}</button>)}
      </div>

      {loading ? <div className="loading-spinner" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Code</th><th>Description</th><th>Year</th><th>Annual Target</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {kpis.map(k => (
                <tr key={k.kpi_id}>
                  <td style={{ fontWeight: 700, fontSize: 12, color: '#1e40af' }}>{k.kpi_code}</td>
                  <td style={{ maxWidth: 220, fontSize: 13 }}>{k.description}</td>
                  <td style={{ fontSize: 12 }}>{k.financial_year}</td>
                  <td style={{ fontWeight: 600 }}>{k.annual_target?.toLocaleString()} {k.unit_of_measure}</td>
                  {(k.quarters || []).slice(0, 4).map((q: any) => (
                    <td key={q.quarter} style={{ background: q.traffic_light ? tlColor[q.traffic_light] : '#f8fafc', textAlign: 'center', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, color: q.traffic_light ? tlText[q.traffic_light] : '#374151' }}>{q.actual ?? '—'}</div>
                      <div style={{ color: '#94a3b8', fontSize: 11 }}>/{q.target}</div>
                    </td>
                  ))}
                  {(k.quarters || []).length < 4 && Array.from({ length: 4 - (k.quarters || []).length }).map((_, i) => <td key={i}>—</td>)}
                  <td>
                    <button onClick={() => openQUpdate(k)} style={{ background: '#f0fdf4', border: 'none', color: '#166534', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Update Actual</button>
                  </td>
                </tr>
              ))}
              {kpis.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: 30 }}>No KPIs found. Add your first KPI to get started.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="Add New KPI" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="KPI Code" required><input style={inp} value={form.kpi_code} onChange={e => setForm(f => ({ ...f, kpi_code: e.target.value }))} required placeholder="e.g. KPI-001" /></FormField>
              <FormField label="Financial Year" required><input style={inp} value={form.financial_year} onChange={e => setForm(f => ({ ...f, financial_year: e.target.value }))} required placeholder="e.g. 2025/26" /></FormField>
            </div>
            <FormField label="KPI Description" required><input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required placeholder="e.g. % roads maintained to acceptable standard" /></FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="Unit of Measure" required><input style={inp} value={form.unit_of_measure} onChange={e => setForm(f => ({ ...f, unit_of_measure: e.target.value }))} required placeholder="e.g. %, Rand, Number" /></FormField>
              <FormField label="Annual Target" required><input style={inp} type="number" step="any" value={form.annual_target} onChange={e => setForm(f => ({ ...f, annual_target: +e.target.value }))} required /></FormField>
            </div>
            <FormField label="Directorate">
              <select style={inp} value={form.directorate_id} onChange={e => setForm(f => ({ ...f, directorate_id: +e.target.value }))}>
                <option value={0}>— All Directorates —</option>
                {directorates.map(d => <option key={d.directorate_id} value={d.directorate_id}>{d.name}</option>)}
              </select>
            </FormField>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quarterly Targets (leave 0 to split annual evenly)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {([1, 2, 3, 4] as const).map(q => (
                  <FormField key={q} label={`Q${q} Target`}>
                    <input style={inp} type="number" step="any" value={(form as any)[`q${q}_target`]} onChange={e => setForm(f => ({ ...f, [`q${q}_target`]: +e.target.value }))} />
                  </FormField>
                ))}
              </div>
            </div>
            <SaveBtn saving={saving} label="Create KPI" />
          </form>
        </Modal>
      )}

      {showQModal && editingKPI && (
        <Modal title={`Update Quarterly Actual — ${editingKPI.kpi_code}`} onClose={() => setShowQModal(false)}>
          <form onSubmit={handleQSubmit}>
            <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
              <strong>{editingKPI.description}</strong><br />
              <span style={{ color: '#64748b' }}>Annual target: {editingKPI.annual_target} {editingKPI.unit_of_measure}</span>
            </div>
            <FormField label="Quarter" required>
              <select style={inp} value={qForm.quarter} onChange={e => setQForm(f => ({ ...f, quarter: +e.target.value }))}>
                {[1, 2, 3, 4].map(q => <option key={q} value={q}>Quarter {q}</option>)}
              </select>
            </FormField>
            <FormField label="Actual Achievement" required>
              <input style={inp} type="number" step="any" value={qForm.actual_achievement} onChange={e => setQForm(f => ({ ...f, actual_achievement: +e.target.value }))} required />
            </FormField>
            <FormField label="Commentary / Evidence Reference">
              <textarea style={{ ...inp, minHeight: 70 }} value={qForm.commentary} onChange={e => setQForm(f => ({ ...f, commentary: e.target.value }))} placeholder="Brief narrative on achievement or reason for shortfall..." />
            </FormField>
            <SaveBtn saving={saving} label="Update Actual" />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DELEGATIONS TAB
// ════════════════════════════════════════════════════════════════════════════
function DelegationsTab() {
  const [delegations, setDelegations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    delegator_id: 0, delegate_id: 0, power_description: '', financial_limit: '',
    effective_date: '', expiry_date: '', legislative_reference: '', council_resolution_ref: '', status: 'Active'
  });

  const load = () => {
    Promise.all([getDelegations(), getUsers()]).then(([d, u]) => {
      setDelegations(d.data); setUsers(u.data); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await createDelegation({
        ...form,
        delegator_id: +form.delegator_id,
        delegate_id: +form.delegate_id,
        financial_limit: form.financial_limit ? +form.financial_limit : null,
        expiry_date: form.expiry_date || null,
      });
      setShowModal(false); load();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to create delegation'); }
    finally { setSaving(false); }
  };

  const statusColor: Record<string, { bg: string; text: string }> = {
    Active: { bg: '#dcfce7', text: '#166534' },
    Expired: { bg: '#fee2e2', text: '#991b1b' },
    Suspended: { bg: '#fef9c3', text: '#854d0e' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Delegations of Authority</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>MFMA s79 / s82 delegation register</p>
        </div>
        <button onClick={() => { setForm({ delegator_id: 0, delegate_id: 0, power_description: '', financial_limit: '', effective_date: '', expiry_date: '', legislative_reference: '', council_resolution_ref: '', status: 'Active' }); setError(''); setShowModal(true); }} className="btn-primary" style={{ padding: '9px 18px' }}>+ New Delegation</button>
      </div>

      {loading ? <div className="loading-spinner" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Delegator</th><th>Delegate</th><th>Power / Authority</th><th>Financial Limit</th><th>Effective</th><th>Expires</th><th>Status</th></tr>
            </thead>
            <tbody>
              {delegations.map(d => {
                const sc = statusColor[d.status] || { bg: '#f1f5f9', text: '#374151' };
                return (
                  <tr key={d.delegation_id}>
                    <td style={{ fontWeight: 600 }}>{d.delegator}</td>
                    <td>{d.delegate}</td>
                    <td style={{ fontSize: 13, maxWidth: 240 }}>{d.power_description}</td>
                    <td style={{ fontWeight: 600 }}>{d.financial_limit ? `R ${d.financial_limit.toLocaleString()}` : '—'}</td>
                    <td style={{ fontSize: 12 }}>{d.effective_date}</td>
                    <td style={{ fontSize: 12 }}>{d.expiry_date || '—'}</td>
                    <td><span style={{ background: sc.bg, color: sc.text, padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{d.status}</span></td>
                  </tr>
                );
              })}
              {delegations.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: 30 }}>No delegations recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="New Delegation of Authority" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="Delegator (From)" required>
                <select style={inp} value={form.delegator_id} onChange={e => setForm(f => ({ ...f, delegator_id: +e.target.value }))} required>
                  <option value={0}>— Select official —</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.role?.replace('_', ' ')})</option>)}
                </select>
              </FormField>
              <FormField label="Delegate (To)" required>
                <select style={inp} value={form.delegate_id} onChange={e => setForm(f => ({ ...f, delegate_id: +e.target.value }))} required>
                  <option value={0}>— Select official —</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.role?.replace('_', ' ')})</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Power / Authority Description" required>
              <textarea style={{ ...inp, minHeight: 70 }} value={form.power_description} onChange={e => setForm(f => ({ ...f, power_description: e.target.value }))} required placeholder="e.g. Authorise expenditure for operational items up to the specified limit" />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="Financial Limit (Rand)"><input style={inp} type="number" value={form.financial_limit} onChange={e => setForm(f => ({ ...f, financial_limit: e.target.value }))} placeholder="e.g. 200000" /></FormField>
              <FormField label="Status">
                <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="Active">Active</option><option value="Suspended">Suspended</option><option value="Expired">Expired</option>
                </select>
              </FormField>
              <FormField label="Effective Date" required><input style={inp} type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} required /></FormField>
              <FormField label="Expiry Date"><input style={inp} type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></FormField>
            </div>
            <FormField label="Legislative Reference"><input style={inp} value={form.legislative_reference} onChange={e => setForm(f => ({ ...f, legislative_reference: e.target.value }))} placeholder="e.g. MFMA s79(1)(a)" /></FormField>
            <FormField label="Council Resolution Reference"><input style={inp} value={form.council_resolution_ref} onChange={e => setForm(f => ({ ...f, council_resolution_ref: e.target.value }))} placeholder="e.g. C-2024-05-18/RES001" /></FormField>
            <SaveBtn saving={saving} label="Create Delegation" />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ASSETS TAB
// ════════════════════════════════════════════════════════════════════════════
function AssetsTab() {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    asset_number: '', barcode: '', description: '', category_id: 0, location_id: 0,
    cost: '', condition: 'Good', status: 'Active', serial_number: '', acquisition_date: '', useful_life_years: ''
  });

  const load = () => {
    Promise.all([getAssets(), getAssetCategories(), getLocations()]).then(([a, c, l]) => {
      setAssets(a.data); setCategories(c.data); setLocations(l.data); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await createAsset({
        ...form,
        category_id: form.category_id || null,
        location_id: form.location_id || null,
        cost: form.cost ? +form.cost : null,
        useful_life_years: form.useful_life_years ? +form.useful_life_years : null,
        acquisition_date: form.acquisition_date || null,
      });
      setShowModal(false); load();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to create asset'); }
    finally { setSaving(false); }
  };

  const condColor: Record<string, string> = { Excellent: '#dcfce7', Good: '#eff6ff', Fair: '#fef9c3', Poor: '#fee2e2', 'Written Off': '#f1f5f9' };
  const condText: Record<string, string> = { Excellent: '#166534', Good: '#1e40af', Fair: '#854d0e', Poor: '#991b1b', 'Written Off': '#64748b' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Asset Register</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{assets.length} assets · Total value: R {assets.reduce((s, a) => s + (a.cost || 0), 0).toLocaleString()}</p>
        </div>
        <button onClick={() => { setForm({ asset_number: '', barcode: '', description: '', category_id: 0, location_id: 0, cost: '', condition: 'Good', status: 'Active', serial_number: '', acquisition_date: '', useful_life_years: '' }); setError(''); setShowModal(true); }} className="btn-primary" style={{ padding: '9px 18px' }}>+ Add Asset</button>
      </div>

      {loading ? <div className="loading-spinner" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Asset #</th><th>Description</th><th>Category</th><th>Location</th><th>Cost (R)</th><th>Condition</th><th>Status</th></tr>
            </thead>
            <tbody>
              {assets.slice(0, 100).map(a => (
                <tr key={a.asset_id}>
                  <td style={{ fontWeight: 700, fontSize: 12, color: '#1e40af' }}>{a.asset_number}</td>
                  <td style={{ fontSize: 13 }}>{a.description}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{a.category || '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{a.location || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{a.cost ? `R ${a.cost.toLocaleString()}` : '—'}</td>
                  <td><span style={{ background: condColor[a.condition] || '#f1f5f9', color: condText[a.condition] || '#374151', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{a.condition}</span></td>
                  <td style={{ fontSize: 12, color: a.status === 'Active' ? '#166534' : '#64748b' }}>{a.status}</td>
                </tr>
              ))}
              {assets.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: 30 }}>No assets registered yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="Add Asset to Register" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="Asset Number" required><input style={inp} value={form.asset_number} onChange={e => setForm(f => ({ ...f, asset_number: e.target.value }))} required placeholder="e.g. ASS-2024-0001" /></FormField>
              <FormField label="Barcode / RFID"><input style={inp} value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="Scan or type" /></FormField>
            </div>
            <FormField label="Description" required><input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required placeholder="e.g. Dell Latitude 5540 Laptop" /></FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="Category">
                <select style={inp} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: +e.target.value }))}>
                  <option value={0}>— Uncategorised —</option>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              </FormField>
              <FormField label="Location">
                <select style={inp} value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: +e.target.value }))}>
                  <option value={0}>— Unknown —</option>
                  {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.location_name}</option>)}
                </select>
              </FormField>
              <FormField label="Acquisition Cost (R)"><input style={inp} type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.00" /></FormField>
              <FormField label="Useful Life (Years)"><input style={inp} type="number" value={form.useful_life_years} onChange={e => setForm(f => ({ ...f, useful_life_years: e.target.value }))} placeholder="e.g. 5" /></FormField>
              <FormField label="Acquisition Date"><input style={inp} type="date" value={form.acquisition_date} onChange={e => setForm(f => ({ ...f, acquisition_date: e.target.value }))} /></FormField>
              <FormField label="Serial Number"><input style={inp} value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} /></FormField>
              <FormField label="Condition">
                <select style={inp} value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Status">
                <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {['Active', 'Disposed', 'Lost', 'Stolen', 'Under Repair', 'Written Off'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
            </div>
            <SaveBtn saving={saving} label="Add Asset" />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// POLICIES & DOCUMENTS TAB
// ════════════════════════════════════════════════════════════════════════════
function PoliciesTab() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({
    policy_name: '', category: '', document_type: 'Policy', current_version: '1.0',
    effective_date: '', review_date: '', owner_id: 0, council_approval_date: '',
    council_resolution_ref: '', status: 'Active'
  });

  const load = () => {
    Promise.all([getPolicies(), getUsers()]).then(([p, u]) => {
      setPolicies(p.data); setUsers(u.data); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ policy_name: '', category: '', document_type: 'Policy', current_version: '1.0', effective_date: '', review_date: '', owner_id: 0, council_approval_date: '', council_resolution_ref: '', status: 'Active' }); setError(''); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ policy_name: p.policy_name, category: p.category, document_type: p.document_type || 'Policy', current_version: p.current_version || '1.0', effective_date: p.effective_date || '', review_date: p.review_date || '', owner_id: p.owner_id || 0, council_approval_date: p.council_approval_date || '', council_resolution_ref: p.council_resolution_ref || '', status: p.status }); setError(''); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, owner_id: form.owner_id || null, effective_date: form.effective_date || null, review_date: form.review_date || null, council_approval_date: form.council_approval_date || null, council_resolution_ref: form.council_resolution_ref || null };
      if (editing) await updatePolicy(editing.policy_id, payload);
      else await createPolicy(payload);
      setShowModal(false); load();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p: any) => {
    if (!confirm(`Suspend "${p.policy_name}"?`)) return;
    try { await deletePolicy(p.policy_id); load(); } catch (err: any) { alert(err.response?.data?.detail || 'Error'); }
  };

  const displayed = filterType ? policies.filter(p => p.document_type === filterType) : policies;

  const typeColors: Record<string, string> = {
    Policy: '#1e40af', Regulation: '#7c2d12', Framework: '#4338ca', Procedure: '#047857', SOP: '#0369a1', 'By-Law': '#9f1239', Other: '#374151'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Policy & Regulatory Document Register</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{policies.length} documents registered</p>
        </div>
        <button onClick={openNew} className="btn-primary" style={{ padding: '9px 18px' }}>+ Add Document</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterType('')} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #e2e8f0', background: !filterType ? '#1e40af' : '#fff', color: !filterType ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>All Types</button>
        {DOC_TYPES.map(t => <button key={t} onClick={() => setFilterType(filterType === t ? '' : t)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #e2e8f0', background: filterType === t ? typeColors[t] || '#374151' : '#fff', color: filterType === t ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>{t}</button>)}
      </div>

      {loading ? <div className="loading-spinner" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Document Name</th><th>Type</th><th>Category</th><th>Version</th><th>Effective</th><th>Review Due</th><th>Owner</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {displayed.map(p => (
                <tr key={p.policy_id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{p.policy_name}</td>
                  <td><span style={{ background: typeColors[p.document_type] || '#374151', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{p.document_type}</span></td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{p.category}</td>
                  <td style={{ fontSize: 12 }}>v{p.current_version}</td>
                  <td style={{ fontSize: 12 }}>{p.effective_date || '—'}</td>
                  <td style={{ fontSize: 12, color: p.review_date && new Date(p.review_date) < new Date() ? '#dc2626' : '#374151', fontWeight: p.review_date && new Date(p.review_date) < new Date() ? 700 : 400 }}>{p.review_date || '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{p.owner || '—'}</td>
                  <td style={{ fontSize: 12, color: p.status === 'Active' ? '#166534' : '#64748b' }}>{p.status}</td>
                  <td>
                    <button onClick={() => openEdit(p)} style={{ background: '#eff6ff', border: 'none', color: '#1d4ed8', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', marginRight: 4, fontSize: 12 }}>Edit</button>
                    <button onClick={() => handleDelete(p)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Suspend</button>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: 30 }}>No documents found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Document' : 'Register Policy / Document'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{error}</div>}
            <FormField label="Document Name" required><input style={inp} value={form.policy_name} onChange={e => setForm(f => ({ ...f, policy_name: e.target.value }))} required placeholder="e.g. Supply Chain Management Policy" /></FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="Document Type" required>
                <select style={inp} value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))}>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Category" required><input style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required placeholder="e.g. Finance, HR, IT, SCM" /></FormField>
              <FormField label="Version"><input style={inp} value={form.current_version} onChange={e => setForm(f => ({ ...f, current_version: e.target.value }))} placeholder="e.g. 2.1" /></FormField>
              <FormField label="Responsible Owner">
                <select style={inp} value={form.owner_id} onChange={e => setForm(f => ({ ...f, owner_id: +e.target.value }))}>
                  <option value={0}>— Not assigned —</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
                </select>
              </FormField>
              <FormField label="Effective Date"><input style={inp} type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} /></FormField>
              <FormField label="Next Review Date"><input style={inp} type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} /></FormField>
              <FormField label="Council Approval Date"><input style={inp} type="date" value={form.council_approval_date} onChange={e => setForm(f => ({ ...f, council_approval_date: e.target.value }))} /></FormField>
              <FormField label="Council Resolution Ref"><input style={inp} value={form.council_resolution_ref} onChange={e => setForm(f => ({ ...f, council_resolution_ref: e.target.value }))} placeholder="e.g. C-2025-03/RES007" /></FormField>
            </div>
            <FormField label="Status">
              <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="Active">Active</option><option value="Under Review">Under Review</option><option value="Draft">Draft</option><option value="Suspended">Suspended</option>
              </select>
            </FormField>
            <SaveBtn saving={saving} label={editing ? 'Update Document' : 'Register Document'} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BUDGETS TAB
// ════════════════════════════════════════════════════════════════════════════
function BudgetsTab() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterFY, setFilterFY] = useState('');
  const [form, setForm] = useState({
    vote_code: '', vote_description: '', directorate_id: 0,
    financial_year: '', budget_type: 'Operating',
    original_budget: '', adjusted_budget: ''
  });

  const BUDGET_TYPES = ['Operating', 'Capital', 'Conditional Grant', 'Equitable Share'];

  const load = (fy?: string) => {
    Promise.all([getBudgets(fy ? { financial_year: fy } : {}), getDirectorates()]).then(([b, d]) => {
      setBudgets(b.data); setDirectorates(d.data); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await createBudget({
        ...form,
        directorate_id: form.directorate_id || null,
        original_budget: +form.original_budget,
        adjusted_budget: form.adjusted_budget ? +form.adjusted_budget : +form.original_budget,
      });
      setShowModal(false); load(filterFY);
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to create budget vote'); }
    finally { setSaving(false); }
  };

  const fys = [...new Set(budgets.map((b: any) => b.financial_year).filter(Boolean))].sort().reverse();
  const displayed = filterFY ? budgets.filter((b: any) => b.financial_year === filterFY) : budgets;
  const totalApproved = displayed.reduce((s: number, b: any) => s + (b.adjusted_budget || b.original_budget || 0), 0);
  const totalSpent = displayed.reduce((s: number, b: any) => s + (b.actual_spend || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Budget Vote Register</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Load and manage budget votes / line items for BVM tracking</p>
        </div>
        <button onClick={() => { setForm({ vote_code: '', vote_description: '', directorate_id: 0, financial_year: '', budget_type: 'Operating', original_budget: '', adjusted_budget: '' }); setError(''); setShowModal(true); }} className="btn-primary" style={{ padding: '9px 18px' }}>+ Load Budget Vote</button>
      </div>

      {fys.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => { setFilterFY(''); load(); }} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #e2e8f0', background: !filterFY ? '#1e40af' : '#fff', color: !filterFY ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>All Years</button>
          {fys.map(y => <button key={y} onClick={() => { setFilterFY(y); load(y); }} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #e2e8f0', background: filterFY === y ? '#1e40af' : '#fff', color: filterFY === y ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>{y}</button>)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Approved Budget', value: `R ${totalApproved.toLocaleString()}`, color: '#1e40af' },
          { label: 'Total Spent', value: `R ${totalSpent.toLocaleString()}`, color: '#dc2626' },
          { label: 'Available', value: `R ${(totalApproved - totalSpent).toLocaleString()}`, color: '#166534' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="loading-spinner" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Vote Number</th><th>Description</th><th>Directorate</th><th>Year</th><th>Type</th><th>Approved (R)</th><th>Spent (R)</th><th>% Used</th></tr>
            </thead>
            <tbody>
              {displayed.map((b: any) => {
                const approved = b.adjusted_budget || b.original_budget || 0;
                const spent = b.actual_spend || 0;
                const pct = approved ? Math.min(120, (spent / approved) * 100) : 0;
                const pctColor = pct > 100 ? '#dc2626' : pct > 80 ? '#b45309' : '#166534';
                return (
                  <tr key={b.budget_id}>
                    <td style={{ fontWeight: 700, fontSize: 12, color: '#1e40af' }}>{b.vote_code}</td>
                    <td style={{ fontSize: 13 }}>{b.vote_description}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{b.directorate || '—'}</td>
                    <td style={{ fontSize: 12 }}>{b.financial_year}</td>
                    <td style={{ fontSize: 12 }}>{b.budget_type}</td>
                    <td style={{ fontWeight: 600 }}>R {approved.toLocaleString()}</td>
                    <td style={{ color: '#dc2626' }}>R {spent.toLocaleString()}</td>
                    <td style={{ color: pctColor, fontWeight: 700, fontSize: 13 }}>{pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
              {displayed.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: 30 }}>No budget votes loaded yet. Click "Load Budget Vote" to begin.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="Load Budget Vote" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{error}</div>}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#166534' }}>
              💡 Budget votes are linked to the BVM module for real-time expenditure tracking against approved allocations.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="Vote Code / Number" required><input style={inp} value={form.vote_code} onChange={e => setForm(f => ({ ...f, vote_code: e.target.value }))} required placeholder="e.g. 03/01/01" /></FormField>
              <FormField label="Financial Year" required><input style={inp} value={form.financial_year} onChange={e => setForm(f => ({ ...f, financial_year: e.target.value }))} required placeholder="e.g. 2025/26" /></FormField>
            </div>
            <FormField label="Vote Description" required><input style={inp} value={form.vote_description} onChange={e => setForm(f => ({ ...f, vote_description: e.target.value }))} required placeholder="e.g. Finance — Salaries and Wages" /></FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <FormField label="Directorate">
                <select style={inp} value={form.directorate_id} onChange={e => setForm(f => ({ ...f, directorate_id: +e.target.value }))}>
                  <option value={0}>— Not Assigned —</option>
                  {directorates.map(d => <option key={d.directorate_id} value={d.directorate_id}>{d.name}</option>)}
                </select>
              </FormField>
              <FormField label="Budget Type">
                <select style={inp} value={form.budget_type} onChange={e => setForm(f => ({ ...f, budget_type: e.target.value }))}>
                  {BUDGET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Original (Approved) Budget (R)" required><input style={inp} type="number" step="0.01" value={form.original_budget} onChange={e => setForm(f => ({ ...f, original_budget: e.target.value }))} required placeholder="0.00" /></FormField>
              <FormField label="Adjusted Budget (R, if different)"><input style={inp} type="number" step="0.01" value={form.adjusted_budget} onChange={e => setForm(f => ({ ...f, adjusted_budget: e.target.value }))} placeholder="Leave blank to equal original" /></FormField>
            </div>
            <SaveBtn saving={saving} label="Load Budget Vote" />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN ADMINISTRATION PAGE
// ════════════════════════════════════════════════════════════════════════════
export function Administration() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: 24, fontWeight: 700 }}>Administration</h2>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
          Configure users, organisational structure, financial years, KPIs, delegations, assets, policy documents and budget votes.
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', borderBottom: '2px solid #e2e8f0', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              borderRadius: '6px 6px 0 0', transition: 'all 0.15s',
              background: activeTab === t.id ? '#1e40af' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#64748b',
              borderBottom: activeTab === t.id ? '2px solid #1e40af' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'directorates' && <DirectoratesTab />}
        {activeTab === 'financial-years' && <FinancialYearsTab />}
        {activeTab === 'kpis' && <KPIsTab />}
        {activeTab === 'delegations' && <DelegationsTab />}
        {activeTab === 'assets' && <AssetsTab />}
        {activeTab === 'policies' && <PoliciesTab />}
        {activeTab === 'budgets' && <BudgetsTab />}
      </div>
    </div>
  );
}
