import { useState, useEffect } from 'react';
import { getKPIs } from '../services/api';

export function PerformanceKPI() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKPIs({ financial_year: '2024/25' })
      .then(r => setKpis(r.data))
      .catch(() => setKpis([]))
      .finally(() => setLoading(false));
  }, []);

  const achieved = kpis.filter(k => k.status === 'Achieved').length;
  const notAchieved = kpis.filter(k => k.status === 'Not_Achieved').length;

  return (
    <div>
      <div className="domain-bar domain-c" />
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total KPIs</div><div className="stat-value">{kpis.length}</div></div>
        <div className="stat-card"><div className="stat-label">On Track</div><div className="stat-value" style={{ color: 'var(--success)' }}>{achieved}</div></div>
        <div className="stat-card"><div className="stat-label">At Risk</div><div className="stat-value" style={{ color: 'var(--warn)' }}>{kpis.filter(k => k.status === 'Active').length}</div></div>
        <div className="stat-card"><div className="stat-label">Not Achieved</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{notAchieved}</div></div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Performance KPIs - FY 2024/25</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Code</th><th>Description</th><th>Unit</th><th>Annual Target</th><th>Q1</th><th>Q2</th><th>Status</th></tr></thead>
            <tbody>
              {kpis.map(k => (
                <tr key={k.kpi_code}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{k.kpi_code}</td>
                  <td style={{ fontSize: 12 }}>{k.description}</td>
                  <td className="text-sm">{k.unit_of_measure}</td>
                  <td className="font-mono">{k.annual_target}</td>
                  <td>{k.q1 ? (<div className="flex-center gap-8"><span className={`traffic ${k.q1.light === 'Green' ? 'tl-green' : k.q1.light === 'Amber' ? 'tl-amber' : 'tl-red'}`} /><span className="text-sm">{k.q1.actual}</span></div>) : '-'}</td>
                  <td>{k.q2 ? (<div className="flex-center gap-8"><span className={`traffic ${k.q2.light === 'Green' ? 'tl-green' : k.q2.light === 'Amber' ? 'tl-amber' : 'tl-red'}`} /><span className="text-sm">{k.q2.actual}</span></div>) : '-'}</td>
                  <td><span className={`badge ${k.status === 'Achieved' ? 'badge-green' : k.status === 'Not_Achieved' ? 'badge-red' : 'badge-amber'}`}>{k.status?.replace(/_/g, ' ')}</span></td>
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
const demoKPIs: any[] = [];
