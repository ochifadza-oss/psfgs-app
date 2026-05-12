import { useState, useEffect, useRef } from 'react';
import { getFindings, getAuditYears, createFinding, updateFinding, getDirectorates, createAssignment, getUsers, uploadAgLetter, uploadEvidence } from '../services/api';

const severityBadge: Record<string, string> = {
  Critical: 'badge-red', High: 'badge-red', Medium: 'badge-amber', Low: 'badge-green'
};
const statusBadge: Record<string, string> = {
  New: 'badge-blue', Assigned: 'badge-blue', In_Progress: 'badge-amber',
  Evidence_Submitted: 'badge-teal', Under_Review: 'badge-purple',
  Closed: 'badge-green', Overdue: 'badge-red'
};

export function AuditFindings() {
  const [findings, setFindings] = useState<any[]>([]);
  const [auditYears, setAuditYears] = useState<any[]>([]);
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ audit_year_id: 0, ag_ref_number: '', description: '', finding_type: 'Compliance', severity: 'Medium', financial_impact: 0, directorate_id: 0, is_repeat: false, repeat_years_count: 0 });

  // Assignment modal state
  const [showAssign, setShowAssign] = useState(false);
  const [assignFinding, setAssignFinding] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({ assignee_id: 0, due_date: '', notes: '' });
  const [assigning, setAssigning] = useState(false);

  // Upload state
  const [uploadingLetter, setUploadingLetter] = useState<number | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState<number | null>(null);
  const agLetterInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const [pendingEvidenceFinding, setPendingEvidenceFinding] = useState<number | null>(null);

  const handleAgLetterUpload = async (yearId: number, file: File) => {
    setUploadingLetter(yearId);
    try {
      await uploadAgLetter(yearId, file);
      alert('AG letter uploaded successfully.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploadingLetter(null);
    }
  };

  const handleEvidenceUpload = async (findingId: number, file: File) => {
    setUploadingEvidence(findingId);
    try {
      await uploadEvidence(findingId, file);
      alert('Evidence uploaded successfully.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploadingEvidence(null);
      setPendingEvidenceFinding(null);
    }
  };

  const loadData = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (selectedYear) params.audit_year_id = selectedYear;
    if (filterStatus) params.status = filterStatus;
    Promise.all([getFindings(params), getAuditYears(), getDirectorates(), getUsers()])
      .then(([f, y, d, u]) => {
        setFindings(f.data);
        setAuditYears(y.data);
        setDirectorates(d.data);
        setUsers(u.data);
      })
      .catch(() => {
        setFindings([]);
        setAuditYears([]);
        setDirectorates([]);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [selectedYear, filterStatus]);

  const handleCreate = async () => {
    if (!form.audit_year_id || form.audit_year_id === 0) {
      alert('Please select an Audit Year before saving.'); return;
    }
    if (!form.description.trim()) {
      alert('Please enter a description.'); return;
    }
    const payload = {
      ...form,
      audit_year_id: form.audit_year_id,
      directorate_id: form.directorate_id && form.directorate_id !== 0 ? form.directorate_id : null,
    };
    try {
      await createFinding(payload);
      setShowCreate(false);
      setForm({ audit_year_id: 0, ag_ref_number: '', description: '', finding_type: 'Compliance', severity: 'Medium', financial_impact: 0, directorate_id: 0, is_repeat: false, repeat_years_count: 0 });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating finding. Check all required fields.');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateFinding(id, { status });
      loadData();
    } catch { alert('Error updating finding'); }
  };

  const openAssignModal = (finding: any) => {
    setAssignFinding(finding);
    // Default due date: 3 days from today
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setAssignForm({ assignee_id: 0, due_date: d.toISOString().split('T')[0], notes: '' });
    setShowAssign(true);
  };

  const handleAssign = async () => {
    if (!assignForm.assignee_id || assignForm.assignee_id === 0) {
      alert('Please select an official to assign this finding to.'); return;
    }
    if (!assignForm.due_date) {
      alert('Please set a resolution due date.'); return;
    }
    setAssigning(true);
    try {
      await createAssignment({
        finding_id: assignFinding.finding_id,
        assignee_id: assignForm.assignee_id,
        due_date: assignForm.due_date,
        notes: assignForm.notes || null,
      });
      setShowAssign(false);
      setAssignFinding(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating assignment.');
    } finally {
      setAssigning(false);
    }
  };

  const stats = {
    total: findings.length,
    closed: findings.filter(f => f.status === 'Closed').length,
    overdue: findings.filter(f => f.status === 'Overdue').length,
    repeat: findings.filter(f => f.is_repeat).length,
  };

  return (
    <div>
      <div className="domain-bar domain-a" />
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Findings</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Closed / Remediated</div>
          <div className="stat-value">{stats.closed}</div>
          <div className="stat-sub stat-success">{stats.total > 0 ? Math.round(stats.closed / stats.total * 100) : 0}% closure rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Repeat Findings</div>
          <div className="stat-value">{stats.repeat}</div>
          <div className="stat-sub stat-danger">{stats.total > 0 ? Math.round(stats.repeat / stats.total * 100) : 0}% are repeats</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue (&gt;90 days)</div>
          <div className="stat-value">{stats.overdue}</div>
          <div className="stat-sub stat-danger">Escalation required</div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={agLetterInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f && uploadingLetter !== null) handleAgLetterUpload(uploadingLetter, f);
          e.target.value = '';
        }}
      />
      <input
        ref={evidenceInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f && pendingEvidenceFinding !== null) handleEvidenceUpload(pendingEvidenceFinding, f);
          e.target.value = '';
        }}
      />

      {/* Audit Years / AG Letter upload card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Audit Years &amp; AG Letters</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Financial Year</th><th>AG Opinion</th><th>Findings</th><th>Closed</th><th>AG Letter</th><th>Upload</th></tr></thead>
            <tbody>
              {auditYears.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>No audit years configured.</td></tr>
              ) : auditYears.map(y => (
                <tr key={y.year_id}>
                  <td style={{ fontWeight: 600 }}>{y.financial_year}</td>
                  <td>{y.audit_opinion ? <span className="badge badge-amber">{y.audit_opinion.replace(/_/g,' ')}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td className="font-mono">{y.total_findings}</td>
                  <td className="font-mono">{y.closed_findings}</td>
                  <td>
                    {y.ag_letter_uploaded
                      ? <span className="badge badge-green">✓ Uploaded</span>
                      : <span className="badge badge-gray">Not uploaded</span>}
                  </td>
                  <td>
                    <button
                      className="btn-outline"
                      style={{ fontSize: 12, padding: '3px 10px' }}
                      disabled={uploadingLetter === y.year_id}
                      onClick={() => { setUploadingLetter(y.year_id); setTimeout(() => agLetterInputRef.current?.click(), 0); }}
                    >
                      {uploadingLetter === y.year_id ? 'Uploading…' : '📎 Upload AG Letter'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ai-panel">
        <div className="ai-header">
          <span className="ai-badge">CLAUDE AI</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1F3864' }}>Audit Health Analysis</span>
        </div>
        <div className="ai-text">
          Analyse audit findings by type, severity, and directorate. Track repeat findings and remediation progress across financial years.
          {stats.repeat > 0 && <>Of the {stats.repeat} repeat findings, review root causes and remediation timelines.</>}
          <strong> Priority action:</strong> Focus on high-severity and overdue findings for timely resolution.
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Active Findings</span>
          <div className="flex gap-8">
            <select className="form-select" style={{ width: 140 }} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              <option value="">All Years</option>
              {auditYears.map(y => <option key={y.year_id} value={y.year_id}>{y.financial_year}</option>)}
            </select>
            <select className="form-select" style={{ width: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {['New','Assigned','In_Progress','Evidence_Submitted','Under_Review','Closed','Overdue'].map(s =>
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Finding</button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Description</th>
                  <th>Severity</th>
                  <th>Type</th>
                  <th>Directorate</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {findings.map(f => (
                  <tr key={f.finding_id}>
                    <td className="font-mono" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{f.ag_ref_number}</td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ fontSize: 12 }}>{f.description?.substring(0, 100)}{f.description?.length > 100 ? '...' : ''}</div>
                      {f.is_repeat && <span className="badge badge-amber" style={{ marginTop: 4 }}>Repeat ({f.repeat_years_count}yr)</span>}
                    </td>
                    <td><span className={`badge ${severityBadge[f.severity] || 'badge-gray'}`}>{f.severity}</span></td>
                    <td><span className="text-sm">{f.finding_type?.replace(/_/g, ' ')}</span></td>
                    <td className="text-sm">{f.directorate || '-'}</td>
                    <td style={{ fontSize: 11 }}>
                      {f.assignees && f.assignees.length > 0
                        ? f.assignees.map((a: any, i: number) => (
                            <div key={i} style={{ lineHeight: 1.6 }}>
                              <span style={{ fontWeight: 600, color: '#1F3864' }}>{a.name}</span>
                              <span style={{ color: '#8B93A7', marginLeft: 4 }}>· due {a.due_date}</span>
                            </div>
                          ))
                        : <span style={{ color: '#C0C6D4', fontStyle: 'italic' }}>Unassigned</span>
                      }
                    </td>
                    <td><span className={`badge ${statusBadge[f.status] || 'badge-gray'}`}>{f.status?.replace(/_/g, ' ')}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select className="form-select" style={{ width: 120, fontSize: 11 }} value={f.status}
                          onChange={e => handleStatusChange(f.finding_id, e.target.value)}>
                          {['New','Assigned','In_Progress','Evidence_Submitted','Under_Review','Closed','Overdue'].map(s =>
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: 10, padding: '3px 10px', whiteSpace: 'nowrap' }}
                          title="Assign this finding to a responsible official"
                          onClick={() => openAssignModal(f)}
                        >
                          👤 Assign
                        </button>
                        <button
                          className="btn-outline"
                          style={{ fontSize: 10, padding: '3px 10px', whiteSpace: 'nowrap' }}
                          title="Upload evidence document for this finding"
                          disabled={uploadingEvidence === f.finding_id}
                          onClick={() => { setPendingEvidenceFinding(f.finding_id); setTimeout(() => evidenceInputRef.current?.click(), 0); }}
                        >
                          {uploadingEvidence === f.finding_id ? '…' : '📎 Evidence'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssign && assignFinding && (
        <div className="modal-overlay" onClick={() => setShowAssign(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>Assign Finding</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAssign(false)}>Close</button>
            </div>
            <div className="modal-body">
              {/* Finding summary */}
              <div style={{ background: '#EEF5FC', borderRadius: 6, padding: '10px 14px', marginBottom: 16, borderLeft: '4px solid #2E75B6' }}>
                <div style={{ fontSize: 11, color: '#5A6478', marginBottom: 2 }}>
                  <strong>Ref:</strong> {assignFinding.ag_ref_number || '—'} &nbsp;·&nbsp;
                  <strong>Severity:</strong> {assignFinding.severity}
                </div>
                <div style={{ fontSize: 12, color: '#1F3864', fontWeight: 500 }}>
                  {assignFinding.description?.substring(0, 120)}{assignFinding.description?.length > 120 ? '...' : ''}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To (Responsible Official) <span style={{ color: 'red' }}>*</span></label>
                <select
                  className="form-select"
                  value={assignForm.assignee_id}
                  onChange={e => setAssignForm({ ...assignForm, assignee_id: +e.target.value })}
                >
                  <option value={0}>— Select official —</option>
                  {users.map((u: any) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.full_name} · {u.role?.replace(/_/g, ' ')} {u.directorate ? `(${u.directorate})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Resolution Due Date <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={assignForm.due_date}
                  onChange={e => setAssignForm({ ...assignForm, due_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Directive / Notes (optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Implement corrective controls within 60 days and submit evidence to Internal Audit"
                  value={assignForm.notes}
                  onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })}
                />
              </div>

              <div style={{ background: '#FFF8E6', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#7F5A00' }}>
                ⚠️ Once assigned, the finding status automatically changes to <strong>Assigned</strong> and the responsible official is notified.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAssign(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={assigning}>
                {assigning ? 'Assigning...' : '👤 Assign Finding'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Audit Finding</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Close</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Audit Year</label>
                  <select className="form-select" value={form.audit_year_id} onChange={e => setForm({...form, audit_year_id: +e.target.value})}>
                    <option value={0}>Select year</option>
                    {auditYears.map(y => <option key={y.year_id} value={y.year_id}>{y.financial_year}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">AG Reference</label>
                  <input className="form-input" placeholder="AG-24-XXX" value={form.ag_ref_number} onChange={e => setForm({...form, ag_ref_number: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Finding Type</label>
                  <select className="form-select" value={form.finding_type} onChange={e => setForm({...form, finding_type: e.target.value})}>
                    {['Material_Irregularity','Significant','Other','Compliance','Performance'].map(t =>
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select className="form-select" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
                    {['Critical','High','Medium','Low'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Financial Impact (R)</label>
                  <input className="form-input" type="number" value={form.financial_impact} onChange={e => setForm({...form, financial_impact: +e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Directorate</label>
                  <select className="form-select" value={form.directorate_id} onChange={e => setForm({...form, directorate_id: +e.target.value})}>
                    <option value={0}>Select</option>
                    {directorates.map((d: any) => <option key={d.directorate_id} value={d.directorate_id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="flex-center gap-8">
                  <input type="checkbox" checked={form.is_repeat} onChange={e => setForm({...form, is_repeat: e.target.checked})} />
                  <span className="form-label" style={{ margin: 0 }}>This is a repeat finding</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create Finding</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Empty fallback arrays
const demoDirs: any[] = [];
const demoYears: any[] = [];
const demoFindings: any[] = [];
