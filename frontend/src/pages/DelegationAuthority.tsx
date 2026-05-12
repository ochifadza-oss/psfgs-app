import { useState, useEffect } from 'react';
import { getDelegations, createDelegation, updateDelegation, getUsers } from '../services/api';

const EDIT_ROLES = ['System_Admin', 'Accounting_Officer', 'CFO'];

const emptyForm = {
  delegator_id: '',
  delegate_id: '',
  power_description: '',
  financial_limit: '',
  effective_date: '',
  expiry_date: '',
  legislative_reference: '',
  status: 'Active',
};

export function DelegationAuthority() {
  const [delegations, setDelegations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('psfgs_user') || '{}');
  const canEdit = EDIT_ROLES.includes(currentUser.role);

  const load = () => {
    setLoading(true);
    getDelegations()
      .then(r => setDelegations(r.data))
      .catch(() => setDelegations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getUsers().then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const fmt = (n: number) => `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  };

  const openEdit = (d: any) => {
    setEditId(d.delegation_id);
    setForm({
      delegator_id: String(d.delegator_id),
      delegate_id: String(d.delegate_id),
      power_description: d.power_description || '',
      financial_limit: d.financial_limit != null ? String(d.financial_limit) : '',
      effective_date: d.effective_date ? d.effective_date.substring(0, 10) : '',
      expiry_date: d.expiry_date ? d.expiry_date.substring(0, 10) : '',
      legislative_reference: d.legislative_reference || '',
      status: d.status || 'Active',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.delegator_id || !form.delegate_id || !form.power_description || !form.effective_date) {
      setError('Delegator, Delegate, Power Description and Effective Date are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      delegator_id: Number(form.delegator_id),
      delegate_id: Number(form.delegate_id),
      power_description: form.power_description,
      financial_limit: form.financial_limit ? Number(form.financial_limit) : null,
      effective_date: form.effective_date,
      expiry_date: form.expiry_date || null,
      legislative_reference: form.legislative_reference || null,
      status: form.status,
    };
    try {
      if (editId) {
        await updateDelegation(editId, payload);
      } else {
        await createDelegation(payload);
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const expiringSoon = delegations.filter(d => {
    if (d.status !== 'Active' || !d.expiry_date) return false;
    const days = (new Date(d.expiry_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  }).length;

  return (
    <div>
      <div className="domain-bar domain-d" />
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Delegations</div>
          <div className="stat-value">{delegations.filter(d => d.status === 'Active').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expiring Within 30 Days</div>
          <div className="stat-value" style={{ color: 'var(--warn)' }}>{expiringSoon}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expired / Revoked</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>
            {delegations.filter(d => d.status === 'Expired' || d.status === 'Revoked').length}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Delegation Register</span>
          {canEdit && (
            <button className="btn-primary" onClick={openAdd} style={{ marginLeft: 'auto' }}>
              + New Delegation
            </button>
          )}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : delegations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No delegations recorded yet.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Delegator</th>
                  <th>Delegate</th>
                  <th>Power / Responsibility</th>
                  <th>Financial Limit</th>
                  <th>Effective</th>
                  <th>Expiry</th>
                  <th>Legislative Ref</th>
                  <th>Status</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {delegations.map(d => (
                  <tr key={d.delegation_id}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{d.delegator}</td>
                    <td style={{ fontSize: 13 }}>{d.delegate}</td>
                    <td style={{ maxWidth: 220, fontSize: 12 }}>{d.power_description}</td>
                    <td className="font-mono" style={{ fontSize: 13 }}>
                      {d.financial_limit != null ? fmt(d.financial_limit) : <span style={{ color: 'var(--text-muted)' }}>Unlimited</span>}
                    </td>
                    <td style={{ fontSize: 13 }}>{d.effective_date?.substring(0, 10)}</td>
                    <td style={{ fontSize: 13 }}>{d.expiry_date ? d.expiry_date.substring(0, 10) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontSize: 12 }}>{d.legislative_reference || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      <span className={`badge ${d.status === 'Active' ? 'badge-green' : d.status === 'Expired' ? 'badge-red' : d.status === 'Revoked' ? 'badge-red' : 'badge-gray'}`}>
                        {d.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <button
                          className="btn-outline"
                          style={{ padding: '3px 10px', fontSize: 12 }}
                          onClick={() => openEdit(d)}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Delegation' : 'New Delegation'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Delegator *</label>
                  <select
                    className="form-control"
                    value={form.delegator_id}
                    onChange={e => setForm(f => ({ ...f, delegator_id: e.target.value }))}
                  >
                    <option value="">— Select —</option>
                    {users.map((u: any) => (
                      <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Delegate *</label>
                  <select
                    className="form-control"
                    value={form.delegate_id}
                    onChange={e => setForm(f => ({ ...f, delegate_id: e.target.value }))}
                  >
                    <option value="">— Select —</option>
                    {users.map((u: any) => (
                      <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Power / Responsibility Description *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  style={{ resize: 'vertical' }}
                  value={form.power_description}
                  onChange={e => setForm(f => ({ ...f, power_description: e.target.value }))}
                  placeholder="Describe the delegated power or responsibility…"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Financial Limit (R)</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step={1000}
                    value={form.financial_limit}
                    onChange={e => setForm(f => ({ ...f, financial_limit: e.target.value }))}
                    placeholder="Leave blank for Unlimited"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Revoked">Revoked</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Effective Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.effective_date}
                    onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.expiry_date}
                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Legislative Reference</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.legislative_reference}
                  onChange={e => setForm(f => ({ ...f, legislative_reference: e.target.value }))}
                  placeholder="e.g. MFMA s79, MSCM Reg 44"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Delegation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
