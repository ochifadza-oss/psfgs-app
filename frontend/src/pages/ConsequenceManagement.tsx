import { useState, useEffect } from 'react';
import { getCases, getCMTStats } from '../services/api';

const stageBadge: Record<string, string> = {
  Registered: 'badge-blue', Investigation: 'badge-amber', Disciplinary_Hearing: 'badge-purple',
  Appeal: 'badge-teal', Recovery: 'badge-green', Closed: 'badge-gray'
};

export function ConsequenceManagement() {
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCases(), getCMTStats()])
      .then(([c, s]) => { setCases(c.data); setStats(s.data); })
      .catch(() => {
        setCases([]);
        setStats({ total_cases: 0, total_financial_impact: 0, by_stage: {} });
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `R${(n / 1e6).toFixed(1)}M`;

  return (
    <div>
      <div className="domain-bar domain-d" />
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Cases</div><div className="stat-value">{stats?.total_cases || 0}</div></div>
        <div className="stat-card"><div className="stat-label">Total Financial Impact</div><div className="stat-value" style={{ fontSize: 22 }}>{stats ? fmt(stats.total_financial_impact) : '-'}</div></div>
        <div className="stat-card"><div className="stat-label">Under Investigation</div><div className="stat-value">{stats?.by_stage?.Investigation || 0}</div></div>
        <div className="stat-card"><div className="stat-label">Recovery Rate</div><div className="stat-value" style={{ color: 'var(--danger)' }}>0%</div><div className="stat-sub stat-danger">R0 recovered</div></div>
      </div>
      <div className="ai-panel">
        <div className="ai-header"><span className="ai-badge">CLAUDE AI</span><span style={{ fontSize: 12, fontWeight: 600 }}>Consequence Management Assessment</span></div>
        <div className="ai-text">Track consequence management cases linked to IFWE findings. Currently {stats?.total_cases || 0} cases are registered. <strong>Recommended action:</strong> Appoint an investigation committee for all IFWE items over R1M and set 90-day deadlines for each investigation to demonstrate progress to AGSA.</div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Misconduct Cases</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Ref</th><th>Type</th><th>Official</th><th>Impact</th><th>Source</th><th>Stage</th><th>Outcome</th><th>Date</th></tr></thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.case_id}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{c.case_reference}</td>
                  <td><span className="badge badge-red">{c.misconduct_type?.replace(/_/g, ' ')}</span></td>
                  <td className="text-sm">{c.accused_official || '-'}</td>
                  <td className="font-mono">{fmt(c.financial_impact)}</td>
                  <td className="text-sm">{c.referral_source}</td>
                  <td><span className={`badge ${stageBadge[c.stage] || 'badge-gray'}`}>{c.stage?.replace(/_/g, ' ')}</span></td>
                  <td><span className="badge badge-gray">{c.outcome}</span></td>
                  <td className="text-sm">{c.registered_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Empty fallback data
const demoCases: any[] = [];
