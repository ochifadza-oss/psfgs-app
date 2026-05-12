import { useState, useEffect } from 'react';
import { getIFWItems, getIFWStats, createIFWItem, updateIFWItem } from '../services/api';

const statusBadge: Record<string, string> = {
  Identified: 'badge-blue', Under_Investigation: 'badge-amber', Condonation_Applied: 'badge-purple',
  Condoned: 'badge-green', Not_Condoned: 'badge-red', Recovery_In_Progress: 'badge-teal',
  Recovered: 'badge-green', Written_Off: 'badge-gray'
};

export function IFWERegister() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ reference_number: '', ifwe_type: 'Irregular', amount: 0, financial_year: '2024/25', description: '' });

  const loadData = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filterType) params.ifwe_type = filterType;
    if (filterStatus) params.status = filterStatus;
    Promise.all([getIFWItems(params), getIFWStats()])
      .then(([i, s]) => { setItems(i.data); setStats(s.data); })
      .catch(() => { setItems([]); setStats({ total_amount: 0, by_type: [], by_status: [], by_year: [] }); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [filterType, filterStatus]);

  const fmt = (n: number) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const handleCreate = async () => {
    try { await createIFWItem(form); setShowCreate(false); loadData(); } catch { alert('Error'); }
  };

  return (
    <div>
      <div className="domain-bar domain-b" />
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total IFWE Balance</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{stats ? fmt(stats.total_amount) : '-'}</div>
          <div className="stat-sub stat-danger">Accumulated across all years</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Irregular Expenditure</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {stats ? fmt(stats.by_type?.find((t: any) => t.type === 'Irregular')?.amount || 0) : '-'}
          </div>
          <div className="stat-sub stat-danger">{stats?.by_type?.find((t: any) => t.type === 'Irregular')?.count || 0} items</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fruitless & Wasteful</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {stats ? fmt(stats.by_type?.find((t: any) => t.type === 'Fruitless_Wasteful')?.amount || 0) : '-'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Recovery Rate</div>
          <div className="stat-value">0%</div>
          <div className="stat-sub stat-danger">Review recovery progress</div>
        </div>
      </div>

      {stats?.by_year && (
        <div className="card mb-20">
          <div className="card-header"><span className="card-title">IFWE Accumulation by Financial Year</span></div>
          <div className="card-body">
            {stats.by_year.map((y: any) => (
              <div key={y.year} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ width: 60, fontSize: 11, fontWeight: 600 }}>{y.year}</span>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill fill-red" style={{ width: `${(y.amount / (stats.total_amount || 1)) * 100}%` }} />
                </div>
                <span className="font-mono text-sm" style={{ width: 120, textAlign: 'right' }}>{fmt(y.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">IFWE Items Register</span>
          <div className="flex gap-8">
            <select className="form-select" style={{ width: 150 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="Irregular">Irregular</option>
              <option value="Fruitless_Wasteful">Fruitless & Wasteful</option>
              <option value="Unauthorised">Unauthorised</option>
            </select>
            <select className="form-select" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {['Identified','Under_Investigation','Condonation_Applied','Condoned','Recovery_In_Progress','Recovered'].map(s =>
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Item</button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr><th>Ref</th><th>Type</th><th>Year</th><th>Description</th><th>Amount</th><th>Official</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.item_id}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{i.reference_number}</td>
                  <td><span className={`badge ${i.ifwe_type === 'Irregular' ? 'badge-red' : 'badge-amber'}`}>{i.ifwe_type?.replace(/_/g, ' ')}</span></td>
                  <td className="text-sm">{i.financial_year}</td>
                  <td style={{ maxWidth: 250, fontSize: 12 }}>{i.description?.substring(0, 80)}...</td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{fmt(i.amount)}</td>
                  <td className="text-sm">{i.responsible_official || '-'}</td>
                  <td><span className={`badge ${statusBadge[i.status] || 'badge-gray'}`}>{i.status?.replace(/_/g, ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Register IFWE Item</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Close</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Reference Number</label>
                  <input className="form-input" value={form.reference_number} onChange={e => setForm({...form, reference_number: e.target.value})} placeholder="IFWE-YYYY-XXX" />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.ifwe_type} onChange={e => setForm({...form, ifwe_type: e.target.value})}>
                    <option value="Irregular">Irregular</option>
                    <option value="Fruitless_Wasteful">Fruitless & Wasteful</option>
                    <option value="Unauthorised">Unauthorised</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (R)</label>
                  <input className="form-input" type="number" value={form.amount} onChange={e => setForm({...form, amount: +e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Financial Year</label>
                  <input className="form-input" value={form.financial_year} onChange={e => setForm({...form, financial_year: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Register Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Empty fallback data
const demoItems: any[] = [];
const demoStats = {
  total_amount: 0,
  by_type: [],
  by_status: [],
  by_year: [],
};
