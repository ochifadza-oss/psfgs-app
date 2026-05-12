import { useState, useEffect } from 'react';
import { getAssets, getAVSStats, getVerificationSessions } from '../services/api';

export function AssetVerification() {
  const [assets, setAssets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAssets(), getAVSStats(), getVerificationSessions()])
      .then(([a, s, ss]) => { setAssets(a.data); setStats(s.data); setSessions(ss.data); })
      .catch(() => { setStats({ total_assets: 0, total_value: 0, by_status: { Active: 0, Missing: 0, Disposed: 0, Ghost: 0 }, by_condition: { Good: 0, Fair: 0, Poor: 0, Unserviceable: 0 } }); })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => n >= 1e9 ? `R${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `R${(n/1e6).toFixed(0)}M` : `R${n.toLocaleString()}`;

  return (
    <div>
      <div className="domain-bar domain-a" />
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Assets</div><div className="stat-value">{stats?.total_assets?.toLocaleString() || 0}</div></div>
        <div className="stat-card"><div className="stat-label">Total Carrying Value</div><div className="stat-value" style={{ fontSize: 22 }}>{stats ? fmt(stats.total_value) : '-'}</div><div className="stat-sub stat-danger">GRAP 17 reconciliation required</div></div>
        <div className="stat-card"><div className="stat-label">Missing Assets</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.by_status?.Missing || 0}</div></div>
        <div className="stat-card"><div className="stat-label">Ghost Assets</div><div className="stat-value" style={{ color: 'var(--warn)' }}>{stats?.by_status?.Ghost || 0}</div></div>
      </div>
      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-header"><span className="card-title">Assets by Condition</span></div>
          <div className="card-body">
            {stats?.by_condition && Object.entries(stats.by_condition).map(([cond, count]) => (
              <div key={cond} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ width: 100, fontSize: 12, fontWeight: 500 }}>{cond}</span>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className={`progress-fill ${cond === 'Good' ? 'fill-green' : cond === 'Fair' ? 'fill-amber' : 'fill-red'}`}
                       style={{ width: `${((count as number) / (stats?.total_assets || 1)) * 100}%` }} />
                </div>
                <span className="text-sm font-mono">{(count as number).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Verification Sessions</span></div>
          <div className="card-body">
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 12 }}>
                No verification sessions yet. Create one to begin physical asset verification.
              </div>
            ) : sessions.map(s => (
              <div key={s.session_id} style={{ marginBottom: 12, padding: 10, border: '1px solid var(--border)', borderRadius: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{s.session_name}</div>
                <div className="text-sm text-muted">{s.start_date} &middot; <span className={`badge ${s.status === 'Completed' ? 'badge-green' : 'badge-amber'}`}>{s.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ai-panel">
        <div className="ai-header"><span className="ai-badge">CLAUDE AI</span><span style={{ fontSize: 12, fontWeight: 600 }}>Asset Register Analysis</span></div>
        <div className="ai-text">Review the Fixed Asset Register for completeness and accuracy. Key metrics: {stats?.by_status?.Missing || 0} assets not physically verified, {stats?.by_status?.Ghost || 0} ghost assets on register. <strong>Recommendation:</strong> Initiate a full physical verification using mobile barcode scanning before year-end to ensure GRAP 17 compliance.</div>
      </div>
    </div>
  );
}
