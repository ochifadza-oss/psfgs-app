import { useState, useEffect } from 'react';
import { getRequisitions, createRequisition, runComplianceCheck, getSCCStats } from '../services/api';

const statusBadge: Record<string, string> = {
  Draft: 'badge-gray', Checking: 'badge-blue', Passed: 'badge-green', Failed: 'badge-red',
  Deviation_Requested: 'badge-purple', Approved: 'badge-green', Rejected: 'badge-red'
};

export function SCMCompliance() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ request_date: new Date().toISOString().split('T')[0], description: '', estimated_value: 0, supplier_name: '', procurement_method: 'Written_Quotation' });

  const loadData = () => {
    setLoading(true);
    Promise.all([getRequisitions(), getSCCStats()])
      .then(([r, s]) => { setReqs(r.data); setStats(s.data); })
      .catch(() => { setReqs([]); setStats({ total_requisitions: 0, avg_compliance_score: 0, by_status: {} }); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    try { await createRequisition(form); setShowCreate(false); loadData(); } catch { alert('Error'); }
  };

  const handleCheck = async (id: number) => {
    try { await runComplianceCheck(id); loadData(); } catch { alert('Error running check'); }
  };

  const fmt = (n: number) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;

  return (
    <div>
      <div className="domain-bar domain-d" />
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Requisitions</div>
          <div className="stat-value">{stats?.total_requisitions || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Compliance Score</div>
          <div className="stat-value">{stats?.avg_compliance_score || 0}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Passed</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats?.by_status?.Passed || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.by_status?.Failed || 0}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Procurement Requisitions</span>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Requisition</button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Requester</th><th>Description</th><th>Value</th><th>Method</th><th>Score</th><th>Status</th><th>Checks</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {reqs.map(r => (
                <tr key={r.req_id}>
                  <td className="text-sm">{r.request_date}</td>
                  <td className="text-sm">{r.requester}</td>
                  <td style={{ maxWidth: 200, fontSize: 12 }}>{r.description?.substring(0, 60)}...</td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{fmt(r.estimated_value)}</td>
                  <td><span className="badge badge-blue">{r.procurement_method?.replace(/_/g, ' ')}</span></td>
                  <td>
                    <span className={`badge ${r.compliance_score >= 100 ? 'badge-green' : r.compliance_score >= 70 ? 'badge-amber' : 'badge-red'}`}>
                      {r.compliance_score}%
                    </span>
                  </td>
                  <td><span className={`badge ${statusBadge[r.status] || 'badge-gray'}`}>{r.status?.replace(/_/g, ' ')}</span></td>
                  <td>
                    {r.checks && r.checks.length > 0 && (
                      <div style={{ display: 'flex', gap: 2 }}>
                        {r.checks.map((c: any, i: number) => (
                          <span key={i} className={`traffic ${c.result === 'Pass' ? 'tl-green' : c.result === 'Fail' ? 'tl-red' : 'tl-amber'}`}
                                title={`${c.check_type}: ${c.result}${c.failure_reason ? ' - ' + c.failure_reason : ''}`} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleCheck(r.req_id)}>Run Check</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reqs.filter(r => r.checks?.some((c: any) => c.result === 'Fail')).length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Failed Compliance Checks Detail</span></div>
          <div className="card-body">
            {reqs.filter(r => r.checks?.some((c: any) => c.result === 'Fail')).map(r => (
              <div key={r.req_id} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{r.description} ({fmt(r.estimated_value)})</div>
                {r.checks?.filter((c: any) => c.result === 'Fail').map((c: any, i: number) => (
                  <div key={i} className="check-item check-fail">
                    <div className="check-icon" style={{ background: '#C94B2B', color: '#fff', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>X</div>
                    <div><strong>{c.check_type?.replace(/_/g, ' ')}:</strong> {c.failure_reason}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>New Procurement Requisition</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Close</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Request Date</label><input className="form-input" type="date" value={form.request_date} onChange={e => setForm({...form, request_date: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Estimated Value (R)</label><input className="form-input" type="number" value={form.estimated_value} onChange={e => setForm({...form, estimated_value: +e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Supplier</label><input className="form-input" value={form.supplier_name} onChange={e => setForm({...form, supplier_name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Procurement Method</label>
                  <select className="form-select" value={form.procurement_method} onChange={e => setForm({...form, procurement_method: e.target.value})}>
                    {['Petty_Cash','Written_Quotation','Competitive_Bid','Single_Source','Emergency','Deviation'].map(m =>
                      <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Submit Requisition</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Empty fallback data
const demoReqs: any[] = [];
const demoSCCStats = { total_requisitions: 0, avg_compliance_score: 0, by_status: {} };
