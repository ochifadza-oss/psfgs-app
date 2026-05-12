import { useState, useEffect, useRef } from 'react';
import { getPolicies, createPolicy, updatePolicy, uploadPolicyDocument, getUsers } from '../services/api';

const statusBadge: Record<string, string> = {
  Draft: 'badge-gray', Active: 'badge-green', Under_Review: 'badge-amber', Expired: 'badge-red', Superseded: 'badge-gray'
};

const EDIT_ROLES = ['System_Admin', 'Accounting_Officer', 'CFO', 'Director'];

const emptyForm = {
  policy_name: '',
  category: 'Financial',
  current_version: '1.0',
  effective_date: '',
  review_date: '',
  owner_id: '',
  council_approval_date: '',
  council_minute_ref: '',
  status: 'Draft',
};

export function PolicyCompliance() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState<number | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadPolicy, setPendingUploadPolicy] = useState<number | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('psfgs_user') || '{}');
  const canEdit = EDIT_ROLES.includes(currentUser.role);

  const load = () => {
    setLoading(true);
    getPolicies()
      .then(r => setPolicies(r.data))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getUsers().then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditId(p.policy_id);
    setForm({
      policy_name: p.policy_name || '',
      category: p.category || 'Financial',
      current_version: p.current_version || '1.0',
      effective_date: p.effective_date ? p.effective_date.substring(0, 10) : '',
      review_date: p.review_date ? p.review_date.substring(0, 10) : '',
      owner_id: p.owner_id ? String(p.owner_id) : '',
      council_approval_date: p.council_approval_date ? p.council_approval_date.substring(0, 10) : '',
      council_minute_ref: p.council_resolution_ref || '',
      status: p.status || 'Draft',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.policy_name.trim()) { setError('Policy name is required.'); return; }
    setSaving(true); setError('');
    const payload = {
      policy_name: form.policy_name,
      category: form.category,
      current_version: form.current_version || '1.0',
      effective_date: form.effective_date || null,
      review_date: form.review_date || null,
      owner_id: form.owner_id ? Number(form.owner_id) : null,
      council_approval_date: form.council_approval_date || null,
      council_resolution_ref: form.council_minute_ref || null,
      status: form.status,
    };
    try {
      if (editId) { await updatePolicy(editId, payload); }
      else { await createPolicy(payload); }
      setShowModal(false);
      load();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDocUpload = async (policyId: number, file: File) => {
    setUploadingDoc(policyId);
    try {
      await uploadPolicyDocument(policyId, file);
      alert('Document attached successfully.');
      load();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploadingDoc(null);
      setPendingUploadPolicy(null);
    }
  };

  return (
    <div>
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f && pendingUploadPolicy !== null) handleDocUpload(pendingUploadPolicy, f);
          e.target.value = '';
        }}
      />

      <div className="domain-bar domain-d" />
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Policies</div><div className="stat-value">{policies.length}</div></div>
        <div className="stat-card"><div className="stat-label">Active</div><div className="stat-value" style={{ color: 'var(--success)' }}>{policies.filter(p => p.status === 'Active').length}</div></div>
        <div className="stat-card"><div className="stat-label">Under Review</div><div className="stat-value" style={{ color: 'var(--warn)' }}>{policies.filter(p => p.status === 'Under_Review').length}</div></div>
        <div className="stat-card"><div className="stat-label">Expired / Due</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{policies.filter(p => p.status === 'Expired').length}</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Policy Register</span>
          {canEdit && (
            <button className="btn-primary" onClick={openAdd} style={{ marginLeft: 'auto' }}>
              + Add Policy / Document
            </button>
          )}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy Name</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Effective Date</th>
                  <th>Review Date</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Document</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {policies.map(p => (
                  <tr key={p.policy_id}>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{p.policy_name}</td>
                    <td><span className="badge badge-blue">{p.category}</span></td>
                    <td className="font-mono text-sm">{p.current_version}</td>
                    <td className="text-sm">{p.effective_date?.substring(0, 10) || '—'}</td>
                    <td className="text-sm">{p.review_date?.substring(0, 10) || '—'}</td>
                    <td className="text-sm">{p.owner || '—'}</td>
                    <td><span className={`badge ${statusBadge[p.status] || 'badge-gray'}`}>{p.status?.replace(/_/g, ' ')}</span></td>
                    <td>
                      {canEdit ? (
                        <button
                          className="btn-outline"
                          style={{ fontSize: 11, padding: '3px 10px' }}
                          disabled={uploadingDoc === p.policy_id}
                          onClick={() => { setPendingUploadPolicy(p.policy_id); setTimeout(() => docInputRef.current?.click(), 0); }}
                        >
                          {uploadingDoc === p.policy_id ? 'Uploading…' : '📎 Attach'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    {canEdit && (
                      <td>
                        <button
                          className="btn-outline"
                          style={{ fontSize: 12, padding: '3px 10px' }}
                          onClick={() => openEdit(p)}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {policies.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No policies registered yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Policy' : 'Add Policy / Document'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Policy / Document Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.policy_name}
                  onChange={e => setForm(f => ({ ...f, policy_name: e.target.value }))}
                  placeholder="e.g. SCM Policy v4.0"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {['Financial','SCM','HR','IT','Governance','Risk','Performance','Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Version</label>
                  <input type="text" className="form-control" value={form.current_version}
                    onChange={e => setForm(f => ({ ...f, current_version: e.target.value }))} placeholder="e.g. 3.0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Effective Date</label>
                  <input type="date" className="form-control" value={form.effective_date}
                    onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Review Date</label>
                  <input type="date" className="form-control" value={form.review_date}
                    onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Council Approval Date</label>
                  <input type="date" className="form-control" value={form.council_approval_date}
                    onChange={e => setForm(f => ({ ...f, council_approval_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Council Minute Reference</label>
                  <input type="text" className="form-control" value={form.council_minute_ref}
                    onChange={e => setForm(f => ({ ...f, council_minute_ref: e.target.value }))} placeholder="e.g. CM/2026/03/45" />
                </div>
                <div className="form-group">
                  <label className="form-label">Policy Owner</label>
                  <select className="form-control" value={form.owner_id}
                    onChange={e => setForm(f => ({ ...f, owner_id: e.target.value }))}>
                    <option value="">— Select —</option>
                    {users.map((u: any) => (
                      <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {['Draft','Active','Under_Review','Expired','Superseded'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!editId && (
                <div style={{ background: '#EEF5FC', borderRadius: 6, padding: '10px 14px', marginTop: 12, fontSize: 12, color: '#1F3864' }}>
                  💡 After saving, use the <strong>📎 Attach</strong> button on the policy row to upload the council-approved PDF or Word document.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
